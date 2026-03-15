import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id: idParam, noteId: noteIdParam } = await params;
    const ventureCaseId = parseInt(idParam, 10);
    const noteId = parseInt(noteIdParam, 10);

    if (isNaN(ventureCaseId) || isNaN(noteId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const note = await prisma.ventureNote.findFirst({
      where: { id: noteId, ventureCaseId },
    });

    if (!note) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    await prisma.ventureNote.delete({ where: { id: noteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
