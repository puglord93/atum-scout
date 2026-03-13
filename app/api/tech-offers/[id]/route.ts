import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const techOffer = await prisma.techOffer.findUnique({
      where: { id },
    });

    if (!techOffer) {
      return NextResponse.json(
        { success: false, error: 'Tech offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: techOffer,
    });
  } catch (error) {
    console.error('Error fetching tech offer:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
