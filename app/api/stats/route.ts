import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalResearchers,
      tierCounts,
      stageCounts,
      totalTechOffers,
      recentlyActive,
      allVenturePotentials,
      topResearchers,
    ] = await Promise.all([
      prisma.researcher.count(),
      prisma.researcher.groupBy({ by: ['tier'], _count: { id: true }, orderBy: { tier: 'asc' } }),
      prisma.researcher.groupBy({ by: ['stage'], _count: { id: true } }),
      prisma.techOffer.count(),
      prisma.researcher.findMany({
        where: { stage: { not: 'identified' } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          affiliation: true,
          tier: true,
          stage: true,
          contactDate: true,
          contactedBy: true,
        },
      }),
      prisma.techOffer.findMany({ select: { venturePotential: true } }),
      prisma.researcher.findMany({
        where: { tier: 'A' },
        orderBy: { hIndex: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          affiliation: true,
          hIndex: true,
          domainTags: true,
          stage: true,
        },
      }),
    ]);

    // Normalize venture potential counts
    const vpCounts: Record<string, number> = { High: 0, Moderate: 0, Medium: 0, Low: 0 };
    allVenturePotentials.forEach((t) => {
      if (!t.venturePotential) return;
      const first = t.venturePotential.split(/[\s.\-]/)[0].toUpperCase();
      if (first === 'HIGH') vpCounts.High++;
      else if (first === 'MOD' || first === 'MODERATE') vpCounts.Moderate++;
      else if (first === 'MEDIUM') vpCounts.Medium++;
      else if (first === 'LOW') vpCounts.Low++;
    });

    const tierMap = tierCounts.reduce(
      (acc, t) => ({ ...acc, [t.tier]: t._count.id }),
      {} as Record<string, number>
    );

    const stageMap = stageCounts.reduce(
      (acc, s) => ({ ...acc, [s.stage]: s._count.id }),
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        researchers: {
          total: totalResearchers,
          byTier: tierMap,
          byStage: stageMap,
        },
        techOffers: {
          total: totalTechOffers,
          byVenturePotential: vpCounts,
        },
        recentlyActive,
        topResearchers,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
