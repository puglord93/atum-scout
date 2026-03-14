import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; aId: string }> }
) {
  try {
    const { id: idParam, aId: aIdParam } = await params;
    const id = parseInt(idParam);
    const aId = parseInt(aIdParam);
    if (isNaN(id) || isNaN(aId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { text, done } = body;

    const action = await prisma.ventureAction.update({
      where: { id: aId, ventureCaseId: id },
      data: {
        ...(text !== undefined ? { text } : {}),
        ...(done !== undefined ? { done } : {}),
      },
    });

    return NextResponse.json({ success: true, data: action });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; aId: string }> }
) {
  try {
    const { id: idParam, aId: aIdParam } = await params;
    const id = parseInt(idParam);
    const aId = parseInt(aIdParam);
    if (isNaN(id) || isNaN(aId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.ventureAction.delete({
      where: { id: aId, ventureCaseId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
