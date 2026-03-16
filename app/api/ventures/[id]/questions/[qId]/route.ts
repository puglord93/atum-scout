import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; qId: string }> }
) {
  try {
    const { id: idParam, qId: qIdParam } = await params;
    const id = parseInt(idParam);
    const qId = parseInt(qIdParam);
    if (isNaN(id) || isNaN(qId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { answer, answered, question, priority, validationStatus } = body;

    const q = await prisma.ventureQuestion.update({
      where: { id: qId, ventureCaseId: id },
      data: {
        ...(answer !== undefined ? { answer } : {}),
        ...(answered !== undefined ? { answered } : {}),
        ...(question !== undefined ? { question } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(validationStatus !== undefined ? { validationStatus } : {}),
      },
    });

    return NextResponse.json({ success: true, data: q });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; qId: string }> }
) {
  try {
    const { id: idParam, qId: qIdParam } = await params;
    const id = parseInt(idParam);
    const qId = parseInt(qIdParam);
    if (isNaN(id) || isNaN(qId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.ventureQuestion.delete({
      where: { id: qId, ventureCaseId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
