import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SECTION_PROMPTS: Record<string, string> = {
  summary:
    `Write a sharp 2-3 paragraph summary of this venture case. Be direct: what does this technology actually do (in plain terms), who built it and why that matters, and what's the honest case for it as a venture. Don't lead with hype — lead with the most interesting or surprising thing about it. Call out the key tension or unresolved question upfront. No filler phrases like "transformative opportunity" or "revolutionary technology".`,

  market_context:
    `Analyze the market context for this technology. Be specific:
- What is the actual problem this market has today, and why hasn't it been solved?
- What's driving urgency now (regulation, cost shifts, new infra, etc.)?
- What's the rough market size and growth rate? Cite your sources inline (e.g. "per Mordor Intelligence, 2023"). Don't make up numbers — if you're estimating, say so and show your logic.
- What's the one macro trend that most strengthens the case for this?
Avoid generic "the market is large and growing" statements. If you don't have enough data to be specific, say what's unknown.`,

  use_case:
    `Identify the 2-4 most viable commercial use cases for this technology. For each:
- **Who** is the buyer (be specific — not "industrial companies" but "procurement teams at Tier 1 auto manufacturers")
- **What problem** does it solve for them, in economic terms
- **Why this technology** over what they do today
- **Signal of real demand** — is there evidence customers actually want this (pilots, analogues, regulatory pressure)?
Rank them. Flag if the top use case has a real customer vs. is speculative.`,

  vs_existing:
    `Compare this technology against realistic alternatives. For each incumbent/alternative:
- What it is and why buyers currently use it
- Where this technology wins (performance, cost, scalability, regulatory fit) — be quantitative where possible
- Where this technology is worse or unproven
- What the switching friction looks like (procurement cycles, integration cost, re-qualification)
Don't just list advantages. The honest comparison — including weaknesses — is more useful than a one-sided pitch.`,

  unit_economics:
    `Analyze the unit economics potential. Work through:
- What does it cost to produce/deliver one unit of value?
- What can a customer reasonably be charged, and what's the value-based anchor?
- What's the margin structure if this scales (what costs fall, what stays fixed)?
- What business model fits best — and what assumptions does it rest on?
Be honest about what's unknown. If the cost structure is unclear from available info, say so and identify what needs to be true for this to work.`,

  market_sizing:
    `Do a grounded market sizing. Show your work:
- **TAM**: What's the total addressable market? Cite sources for any figures (e.g. "Grand View Research, 2024"). If you're building bottom-up, show the logic.
- **SAM**: What subset is actually reachable given geography, go-to-market, and technology readiness?
- **SOM**: What's a realistic 3-5 year capture? Anchor this to comparable venture trajectories if possible.
- **Beachhead**: Which specific segment should be entered first, and why?
Don't pad with multiple overlapping market definitions. Pick the most defensible numbers and be clear about confidence level.`,
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
              `You are a rigorous venture analyst at ATUM Ventures, a deep-tech venture builder in Singapore (focus: Advanced Manufacturing, Biotech/Medtech, Energy/Climate). Your job is to produce sharp, honest analysis — not pitch decks. Write like a thoughtful analyst, not a consultant. Use plain language. Be direct about uncertainty. Quantify claims and cite sources where you have them. Call out gaps, weak assumptions, and risks. Avoid corporate filler phrases. Format your response in clean markdown: use **bold** for emphasis, ## for sub-sections if needed, and bullet lists for parallel items. Do not use excessive headers.`,
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
