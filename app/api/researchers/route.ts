import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const tier = searchParams.get('tier');
    const affiliation = searchParams.get('affiliation');
    const category = searchParams.get('category');
    const domain = searchParams.get('domain');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (tier) {
      where.tier = tier;
    }

    if (affiliation) {
      where.affiliation = { contains: affiliation };
    }

    if (category) {
      where.category = { contains: category };
    }

    if (domain) {
      where.domainTags = { contains: domain };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { affiliation: { contains: search } },
        { domainTags: { contains: search } },
        { subfield: { contains: search } },
      ];
    }

    // Fetch researchers with filters
    const researchers = await prisma.researcher.findMany({
      where,
      orderBy: {
        hIndex: 'desc', // Default sort by h-index descending
      },
    });

    return NextResponse.json({
      success: true,
      data: researchers,
      count: researchers.length,
    });
  } catch (error) {
    console.error('Error fetching researchers:', error);
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
      fullName, email, affiliation, tier = 'C',
      hIndex = 0, citations = 0, cScore = 0, globalRank = null,
      domainTags = null, subfield = null, category = 'Manual',
      noteOnResearch = null, origin = 'Manual', source = 'manual',
    } = body;

    if (!fullName?.trim() || !affiliation?.trim()) {
      return NextResponse.json(
        { success: false, error: 'fullName and affiliation are required' },
        { status: 400 }
      );
    }

    const researcher = await prisma.researcher.create({
      data: {
        fullName: fullName.trim(),
        email: email?.trim() || null,
        affiliation: affiliation.trim(),
        tier,
        hIndex: parseInt(hIndex) || 0,
        citations: parseInt(citations) || 0,
        cScore: parseFloat(cScore) || 0,
        globalRank: globalRank ? parseInt(globalRank) : null,
        domainTags: domainTags || null,
        subfield: subfield || null,
        category,
        noteOnResearch: noteOnResearch || null,
        origin,
        source,
      },
    });

    return NextResponse.json({ success: true, data: researcher });
  } catch (error) {
    console.error('Error creating researcher:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
