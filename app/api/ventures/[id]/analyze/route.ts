import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SECTION_PROMPTS: Record<string, string> = {
  summary:
    `Write the venture summary. Lead with the single most interesting or surprising thing about this technology — not a definition. Then:
- What it actually does (one sentence, plain language, no jargon)
- Who built it and why that gives it credibility (or doesn't)
- The honest bull case: what has to be true for this to work as a venture
- The key tension or fatal risk sitting at the center of this — name it directly

No intro sentence. No "this technology presents an opportunity to...". Start with the insight.`,

  market_context:
    `Analyze the market context. Structure it as:

**The Problem**
What's broken in this market today? Be specific about who suffers and what it costs them.

**Why Now**
What changed recently (regulation, cost curve, new enabling tech, supply shock) that makes this timing different from 5 years ago?

**Market Size**
Give a number. Show your source (e.g. "Mordor Intelligence, 2023") or your logic if estimating. One TAM figure is better than three vague ranges.

**The Macro Tailwind**
The single strongest structural trend behind this. One paragraph, no fluff.

If you lack data on any of these, say explicitly what's unknown and why it matters.`,

  use_case:
    `Identify the 2-4 most viable use cases. For each, use this structure:

### [N]. [Use Case Name] — [one-word verdict: Primary / Secondary / Speculative]
- **Buyer**: [specific role at specific type of company, not "enterprises"]
- **Problem**: [what it costs them today, in dollars or operational terms]
- **Why this wins**: [specific advantage over status quo]
- **Demand signal**: [pilot, named customer, regulatory driver, or "none yet — speculative"]

Rank by commercial attractiveness. Flag clearly which has real traction vs. which is hypothetical.`,

  vs_existing:
    `Compare against incumbent solutions. Use a table for the head-to-head, then add commentary on switching friction.

| Incumbent | Why buyers use it today | Where this tech wins | Where this tech loses |
|-----------|------------------------|---------------------|----------------------|
| [name] | [reason] | [specific advantage] | [honest weakness] |

After the table:
**Switching friction**: What does it actually take for a buyer to switch? (procurement cycle length, re-qualification cost, integration effort, risk tolerance)

**The honest verdict**: Is this technology better enough — and different enough — to overcome inertia? Or is it a marginal improvement that will struggle to displace entrenched incumbents?`,

  unit_economics:
    `Break down the unit economics. Use this structure:

**Cost to Produce**
Walk through the main cost components (CapEx amortized, OpEx, inputs). If numbers are available from the inputs, use them. If not, flag what's unknown.

**Revenue Potential**
What can you charge, and what's the value-based anchor? (e.g. "replaces fishmeal at $1,500/ton → ceiling price is ~$1,200/ton at 80% of incumbent")

**The Math at Scale**
Show the key equation: [output per unit] × [price] − [cost] = [margin]. Even rough numbers are more useful than prose.

**What Needs to Be True**
List 2-3 specific assumptions the economics depend on. If any one of them is wrong, what breaks?`,

  market_sizing:
    `Do a grounded market sizing. No padding, show the logic.

**TAM** — [$ figure] ([source or methodology])
One sentence on how you got there.

**SAM** — [$ figure]
What constrains the reachable market: geography, go-to-market, tech readiness, regulation.

**SOM (3-5 year)** — [$ figure]
What a well-executed venture could realistically capture. Anchor to a comparable if possible.

**Beachhead**
Name the specific segment to enter first. Why this one: lowest friction, highest willingness to pay, or clearest path to a reference customer?

Flag your confidence level on each number. Honest uncertainty beats false precision.`,
};

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  market_context: 'Market Context',
  use_case: 'Use Cases',
  vs_existing: 'vs. Existing',
  unit_economics: 'Unit Economics',
  market_sizing: 'Market Sizing',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { key } = body; // optional: if provided, analyze only that section

    // Fetch venture with all context
    const venture = await prisma.ventureCase.findUnique({
      where: { id },
      include: {
        researcher: true,
        techOffer: true,
        inputs: { orderBy: { createdAt: 'asc' } },
        sections: true,
        questions: { where: { answered: true } },
      },
    });

    if (!venture) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Build context string
    const contextParts: string[] = [];

    contextParts.push(`VENTURE CASE: ${venture.title}`);

    if (venture.techOffer) {
      contextParts.push(`\nTECHNOLOGY: ${venture.techOffer.technology}`);
      contextParts.push(`Institution: ${venture.techOffer.institution}`);
      if (venture.techOffer.description) {
        contextParts.push(`Description: ${venture.techOffer.description}`);
      }
    }

    if (venture.researcher) {
      contextParts.push(`\nPRINCIPAL INVESTIGATOR: ${venture.researcher.fullName}`);
      contextParts.push(`Affiliation: ${venture.researcher.affiliation}`);
    }

    if (venture.inputs.length > 0) {
      contextParts.push('\nINPUTS / NOTES:');
      venture.inputs.forEach(input => {
        contextParts.push(`[${input.type.toUpperCase()} — ${input.label}]\n${input.content}`);
      });
    }

    if (venture.questions.length > 0) {
      contextParts.push('\nANSWERED QUESTIONS:');
      venture.questions.forEach(q => {
        contextParts.push(`Q: ${q.question}\nA: ${q.answer || ''}`);
      });
    }

    const context = contextParts.join('\n');
    const inputCount = venture.inputs.length;

    // Determine which sections to analyze
    const keysToAnalyze = key ? [key] : Object.keys(SECTION_PROMPTS);

    // Whether to extract questions (full analyze, or if questions are empty)
    const existingQuestions = await prisma.ventureQuestion.findMany({
      where: { ventureCaseId: id },
    });
    const shouldExtractQuestions = !key || existingQuestions.length === 0;

    const updatedSections: Array<{ key: string; content: string }> = [];

    for (const sectionKey of keysToAnalyze) {
      const prompt = SECTION_PROMPTS[sectionKey];
      if (!prompt) continue;

      const isFirstSection = sectionKey === keysToAnalyze[0];
      const addQuestionsPrompt =
        shouldExtractQuestions && isFirstSection
          ? '\n\nAdditionally, return a JSON array of 4-6 key assumptions that must hold true for this venture to work — things currently unvalidated that could kill or reshape the thesis if wrong. Frame each as a testable hypothesis (e.g. "Customers will pay a 30% premium over incumbent Y for benefit Z"). Return them at the end in this exact format: QUESTIONS_JSON:["assumption1", "assumption2", ...]'
          : '';

      const userMessage = `${context}\n\n---\n\nTASK: ${prompt}${addQuestionsPrompt}`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              `You are a senior analyst at ATUM Ventures, a deep-tech venture builder in Singapore (Advanced Manufacturing, Biotech/Medtech, Energy/Climate). You think like an operator, not a consultant. Your job: produce analysis that is immediately actionable, not impressive-sounding.

Style rules — follow these exactly:
- Write in analyst shorthand. Short sentences. Direct claims. No throat-clearing openers.
- Never start a section with "This technology..." or "The X venture presents...". Start with the most important thing.
- Use → to show implications (e.g. "CapEx is $3M → payback period exceeds 8 years at current prices")
- Use **bold** only for specific numbers, named companies, or the single most important term per paragraph. Not for every noun phrase.
- Use tables when comparing 3+ options across consistent dimensions. Tables beat bullet lists for comparisons.
- Keep bullets to one line each. If a bullet needs two sentences, it's not a bullet — it's a paragraph.
- When you don't know something, say: "Unknown — needs validation" or "No data in inputs — estimate only". Don't invent confidence.
- Name specific companies, people, prices. "Major pet food manufacturers" is useless. "Nestlé Purina, Mars Petcare" is useful.
- Call out the uncomfortable truth. If the economics look bad, say so. If the market is crowded, say so.

Format: use markdown. **bold** for key terms/numbers. ### for sub-headings within a section. Bullet lists for parallel items. Tables for comparisons. No ## headers (each section already has a title).`,
          },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
      });

      let content = completion.choices[0].message.content || '';

      // Extract and handle questions if present
      if (shouldExtractQuestions && isFirstSection && content.includes('QUESTIONS_JSON:')) {
        const qMatch = content.match(/QUESTIONS_JSON:\s*(\[[\s\S]*?\])/);
        if (qMatch) {
          try {
            const questions: string[] = JSON.parse(qMatch[1]);
            // Remove the QUESTIONS_JSON block from content
            content = content.replace(/\n*QUESTIONS_JSON:\s*\[[\s\S]*?\]/, '').trim();

            // Create questions that don't already exist
            const existingTexts = new Set(existingQuestions.map(q => q.question));
            const newQuestions = questions.filter(q => !existingTexts.has(q));

            if (newQuestions.length > 0) {
              const maxOrder = existingQuestions.reduce((max, q) => Math.max(max, q.order), -1);
              for (let i = 0; i < newQuestions.length; i++) {
                await prisma.ventureQuestion.create({
                  data: {
                    ventureCaseId: id,
                    question: newQuestions[i],
                    order: maxOrder + 1 + i,
                  },
                });
              }
            }
          } catch {
            // Parse failure — continue without questions
          }
        }
      }

      // Update section
      await prisma.ventureSection.updateMany({
        where: { ventureCaseId: id, key: sectionKey },
        data: {
          content,
          generatedAt: new Date(),
          inputCount,
          editedAt: null,
        },
      });

      updatedSections.push({ key: sectionKey, content });
    }

    // Return updated sections and questions
    const sections = await prisma.ventureSection.findMany({
      where: { ventureCaseId: id },
      orderBy: { id: 'asc' },
    });
    const questions = await prisma.ventureQuestion.findMany({
      where: { ventureCaseId: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, data: { sections, questions } });
  } catch (error) {
    console.error('Error analyzing venture:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
