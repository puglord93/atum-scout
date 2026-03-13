import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { loadTechOffersFromExcel, loadResearchersFromExcel } from '@/lib/excel-loader';
import path from 'path';

export async function POST() {
  try {
    // Paths to Excel files (in project root)
    const techOffersPath = path.join(process.cwd(), 'Funnel 2 - TTO Tech Offers.xlsx');
    const researchersPath = path.join(process.cwd(), 'Funnel 3 - Top researchers SCORED.xlsx');

    console.log('Starting database seed...');

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.researcher.deleteMany({});
    await prisma.techOffer.deleteMany({});

    // Load and insert tech offers
    console.log('Loading tech offers from Excel...');
    const techOffers = await loadTechOffersFromExcel(techOffersPath);
    console.log(`Inserting ${techOffers.length} tech offers...`);

    // Insert in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < techOffers.length; i += batchSize) {
      const batch = techOffers.slice(i, i + batchSize);
      await prisma.techOffer.createMany({
        data: batch,
      });
    }

    // Load and insert researchers
    console.log('Loading researchers from Excel...');
    const researchers = await loadResearchersFromExcel(researchersPath);
    console.log(`Inserting ${researchers.length} researchers...`);

    for (let i = 0; i < researchers.length; i += batchSize) {
      const batch = researchers.slice(i, i + batchSize);
      await prisma.researcher.createMany({
        data: batch,
      });
    }

    // Get final counts
    const researcherCount = await prisma.researcher.count();
    const techOfferCount = await prisma.techOffer.count();

    console.log('Database seed completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        researchers: researcherCount,
        techOffers: techOfferCount,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
