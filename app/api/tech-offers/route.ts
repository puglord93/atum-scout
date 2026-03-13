import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const institution = searchParams.get('institution');
    const sector = searchParams.get('sector');
    const venturePotential = searchParams.get('venturePotential');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (institution) {
      where.institution = institution;
    }

    if (sector) {
      where.sector = { contains: sector };
    }

    if (venturePotential) {
      where.venturePotential = venturePotential;
    }

    if (search) {
      where.OR = [
        { technology: { contains: search } },
        { description: { contains: search } },
        { sector: { contains: search } },
      ];
    }

    // Fetch tech offers with filters
    const techOffers = await prisma.techOffer.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: techOffers,
      count: techOffers.length,
    });
  } catch (error) {
    console.error('Error fetching tech offers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
