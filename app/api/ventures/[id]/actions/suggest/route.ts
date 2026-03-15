import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const venture = await prisma.ventureCase.findUnique({
      where: { id },
      include: {
        techOffer: true,
        researcher: true,
        questions: { where: { answered: false }, orderBy: { order: 'asc' } },
      },
    });
    if (!venture) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // Get top assumptions (critical first, then high, limit 6)
    const priorityOrder = ['critical', 'high', 'medium'];
    const topAssumptions = [...venture.questions]
      .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority))
      .slice(0, 6);

    if (topAssumptions.length === 0) {
      return NextResponse.json({ success: false, error: 'No unvalidated assumptions to generate actions from.' }, { status: 400 });
    }

    const assumptionsList = topAssumptions
      .map((q, i) => `${i + 1}. [${q.priority.toUpperCase()}] ${q.question}`)
      .join('\n');

    const context = [
      `Venture: ${venture.title}`,
      venture.techOffer ? `Technology: ${venture.techOffer.technology} (${venture.techOffer.institution})` : '',
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a venture builder at ATUM Ventures. Your job is to turn unvalidated assumptions into concrete, specific next actions. Each action should be something a founder or analyst can actually do this week - a specific call, meeting, data pull, or experiment. Not "research the market" but "call 3 aquaculture feed buyers in Singapore to ask X". Be specific about who to contact, what to ask, or what to build/test.`,
        },
        {
          role: 'user',
          content: `${context}\n\nUnvalidated assumptions (priority order):\n${assumptionsList}\n\nGenerate 5-7 concrete next actions to validate these assumptions, starting with the critical ones. Focus on fastest/cheapest validation methods. Return as a JSON array of strings: ACTIONS_JSON:["action1","action2",...]`,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content || '';
    const match = content.match(/ACTIONS_JSON:\s*(\[[\s\S]*?\])/);
    if (!match) return NextResponse.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });

    const actionTexts: string[] = JSON.parse(match[1]);
    const created = [];
    for (const text of actionTexts) {
      if (text?.trim()) {
        const action = await prisma.ventureAction.create({
          data: { ventureCaseId: id, text: text.trim() },
        });
        created.push(action);
      }
    }

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Error suggesting actions:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
