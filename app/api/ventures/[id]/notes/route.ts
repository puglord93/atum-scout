import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const VALID_TYPES = ['note', 'call', 'email', 'meeting', 'customer_interview'] as const;
type NoteType = typeof VALID_TYPES[number];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const notes = await prisma.ventureNote.findMany({
      where: { ventureCaseId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { content, author, type = 'note' } = body;

    if (!content?.trim()) return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    if (!author?.trim()) return NextResponse.json({ success: false, error: 'Author is required' }, { status: 400 });
    if (!VALID_TYPES.includes(type as NoteType)) return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });

    const note = await prisma.ventureNote.create({
      data: {
        ventureCaseId: id,
        content: content.trim(),
        author: author.trim(),
        type,
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
