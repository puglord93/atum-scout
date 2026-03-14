import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SECTION_PROMPTS: Record<string, string> = {
  summary:
    'Write a concise 2-3 paragraph executive summary of this technology opportunity as a venture case. Cover what the technology is, who is behind it, and why it\'s interesting.',
  market_context:
    'Analyze the market context and industry trends for this technology. Cover: (1) the overall market landscape and size, (2) key macro tailwinds, (3) why the timing is right now. Be specific and quantitative where possible.',
  use_case:
    'Identify and analyze the most viable use cases for this technology. For each use case, describe: the target industry/customer, the specific problem solved, and the strength of the fit. Rank by attractiveness.',
  vs_existing:
    'Compare this technology against existing methods and alternatives. For each comparison: (1) what is being displaced, (2) the clear performance/cost benefit, (3) what the switching cost looks like for adopters.',
  unit_economics:
    'Analyze the unit economics potential for a venture built on this technology. Cover: cost structure, value capture mechanism, pricing model options, and what needs to be true for attractive unit economics.',
  market_sizing:
    'Provide a market sizing analysis. Include: TAM estimate with methodology, SAM (serviceable market), SOM (realistic capture in 3-5 years), and identification of the clearest beachhead market to enter first.',
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
          ? '\n\nAdditionally, return a JSON array of 4-6 critical open questions that still need to be validated, in this format at the end of your response: QUESTIONS_JSON:["question1", "question2", ...]'
          : '';

      const userMessage = `${context}\n\n---\n\nTASK: ${prompt}${addQuestionsPrompt}`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert venture analyst helping evaluate deep-tech opportunities for ATUM Ventures, a venture builder in Singapore focused on Advanced Manufacturing, Biotech/Medtech, and Energy/Climate. Provide rigorous, evidence-based analysis.',
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
