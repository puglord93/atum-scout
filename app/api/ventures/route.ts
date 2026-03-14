import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const SECTION_KEYS = [
  'summary',
  'market_context',
  'use_case',
  'vs_existing',
  'unit_economics',
  'market_sizing',
];

export async function GET() {
  try {
    const ventures = await prisma.ventureCase.findMany({
      include: {
        researcher: { select: { id: true, fullName: true, affiliation: true } },
        techOffer: { select: { id: true, technology: true, techId: true } },
        _count: {
          select: { inputs: true, sections: true, questions: true, actions: true },
        },
        questions: { select: { answered: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const data = ventures.map(v => ({
      id: v.id,
      title: v.title,
      status: v.status,
      researcher: v.researcher,
      techOffer: v.techOffer,
      inputCount: v._count.inputs,
      questionCount: v._count.questions,
      answeredCount: v.questions.filter(q => q.answered).length,
      actionCount: v._count.actions,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching ventures:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, status = 'active', researcherId, techOfferId } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      );
    }

    const venture = await prisma.ventureCase.create({
      data: {
        title: title.trim(),
        status,
        researcherId: researcherId ? parseInt(researcherId) : null,
        techOfferId: techOfferId ? parseInt(techOfferId) : null,
        sections: {
          create: SECTION_KEYS.map(key => ({ key, content: '' })),
        },
      },
      include: {
        sections: true,
        researcher: { select: { id: true, fullName: true, affiliation: true } },
        techOffer: { select: { id: true, technology: true, techId: true } },
      },
    });

    return NextResponse.json({ success: true, data: venture });
  } catch (error) {
    console.error('Error creating venture:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
