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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      technology, institution, trl = null, sector = null,
      venturePotential = null, description = null, useCase = null,
      vsExisting = null, commercializationPath = null, atumPursue = null,
      likelyPi = null, qualityTier = null, notes = null,
      source = 'manual',
    } = body;

    if (!technology?.trim() || !institution?.trim()) {
      return NextResponse.json(
        { success: false, error: 'technology and institution are required' },
        { status: 400 }
      );
    }

    // Auto-generate a unique techId
    const prefix = source === 'url_ingest' ? 'INGEST' : 'MANUAL';
    const techId = `${prefix}_${Date.now()}`;

    const techOffer = await prisma.techOffer.create({
      data: {
        techId,
        technology: technology.trim(),
        institution: institution.trim(),
        trl: trl || null,
        sector: sector || null,
        venturePotential: venturePotential || null,
        description: description || null,
        useCase: useCase || null,
        vsExisting: vsExisting || null,
        commercializationPath: commercializationPath || null,
        atumPursue: atumPursue || null,
        likelyPi: likelyPi || null,
        qualityTier: qualityTier || null,
        notes: notes || null,
        source,
      },
    });

    return NextResponse.json({ success: true, data: techOffer });
  } catch (error) {
    console.error('Error creating tech offer:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
