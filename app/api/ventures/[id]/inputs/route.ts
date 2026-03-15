import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const inputs = await prisma.ventureInput.findMany({
      where: { ventureCaseId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: inputs });
  } catch (error) {
    console.error('Error fetching inputs:', error);
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
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { type, label, content, inputDate } = body;

    if (!type?.trim() || !label?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'type, label, and content are required' },
        { status: 400 }
      );
    }

    const input = await prisma.ventureInput.create({
      data: {
        ventureCaseId: id,
        type,
        label,
        content,
        ...(inputDate ? { inputDate: new Date(inputDate) } : {}),
      },
    });

    return NextResponse.json({ success: true, data: input });
  } catch (error) {
    console.error('Error creating input:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
