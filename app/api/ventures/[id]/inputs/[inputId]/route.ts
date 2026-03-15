import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; inputId: string }> }
) {
  try {
    const { id: idParam, inputId: inputIdParam } = await params;
    const id = parseInt(idParam);
    const inputId = parseInt(inputIdParam);
    if (isNaN(id) || isNaN(inputId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    const body = await request.json();
    const { label, content, inputDate } = body;
    const input = await prisma.ventureInput.update({
      where: { id: inputId, ventureCaseId: id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(inputDate !== undefined ? { inputDate: new Date(inputDate) } : {}),
      },
    });
    return NextResponse.json({ success: true, input });
  } catch (error) {
    console.error('Error updating input:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; inputId: string }> }
) {
  try {
    const { id: idParam, inputId: inputIdParam } = await params;
    const id = parseInt(idParam);
    const inputId = parseInt(inputIdParam);
    if (isNaN(id) || isNaN(inputId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.ventureInput.delete({
      where: { id: inputId, ventureCaseId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting input:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
