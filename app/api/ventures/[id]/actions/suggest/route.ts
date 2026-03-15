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
          content: `You are a venture builder at ATUM Ventures. Turn unvalidated assumptions into concrete next actions — things a founder can do this week. Be specific: who to call, what to ask, what to build or test. Return ONLY a JSON array of strings, no other text.`,
        },
        {
          role: 'user',
          content: `${context}\n\nUnvalidated assumptions (priority order):\n${assumptionsList}\n\nGenerate 5-7 concrete next actions to validate these, starting with critical ones. Focus on fastest/cheapest validation methods (customer calls, desk research, small experiments). Each action should be one specific thing.\n\nReturn ONLY this JSON, no other text:\n["action1","action2",...]`,
        },
      ],
      temperature: 0.5,
    });

    const raw = completion.choices[0].message.content?.trim() || '';
    // Strip markdown code fences if present, then parse
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let actionTexts: string[];
    try {
      actionTexts = JSON.parse(cleaned);
      if (!Array.isArray(actionTexts)) throw new Error('Not an array');
    } catch {
      console.error('Actions parse error. Raw response:', raw);
      return NextResponse.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });
    }
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
