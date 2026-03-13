import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid researcher ID' },
        { status: 400 }
      );
    }

    const researcher = await prisma.researcher.findUnique({
      where: { id },
    });

    if (!researcher) {
      return NextResponse.json(
        { success: false, error: 'Researcher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: researcher,
    });
  } catch (error) {
    console.error('Error fetching researcher:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid researcher ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update researcher
    const researcher = await prisma.researcher.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: researcher,
    });
  } catch (error) {
    console.error('Error updating researcher:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
