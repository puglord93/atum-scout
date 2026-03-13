import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const offer = await prisma.techOffer.findUnique({ where: { id } });

    if (!offer) {
      return NextResponse.json({ success: false, error: 'Tech offer not found' }, { status: 404 });
    }

    const systemPrompt = `You are an AI analyst for ATUM Ventures, a deep-tech venture builder in Singapore. \
Score the following technology offer across 4 dimensions (1–10 each) with a brief rationale (~25 words) \
per dimension, plus an overall summary (~50 words).

Scoring rubrics:
- marketSize (1–10): 1 = niche/academic only; 5 = regional addressable market $100M+; 10 = global platform opportunity $1B+
- ipMoat (1–10): 1 = no IP protection; 5 = patent pending or strong trade secret; 10 = granted broad patents + hard-to-replicate know-how
- trlTrajectory (1–10): 1 = TRL 1-2 concept only; 5 = TRL 5-6 validated prototype; 10 = TRL 8-9 deployment ready
- atumFit (1–10): alignment with ATUM's deep-tech verticals (Advanced Manufacturing, Biotech/Medtech, Energy/Climate) \
and venture-building model; 1 = poor fit; 10 = perfect fit

Return ONLY valid JSON:
{"marketSize":{"score":N,"rationale":"..."},"ipMoat":{"score":N,"rationale":"..."},"trlTrajectory":{"score":N,"rationale":"..."},"atumFit":{"score":N,"rationale":"..."},"summary":"..."}`;

    const fields = [
      `Technology: ${offer.technology}`,
      `Institution: ${offer.institution}`,
      offer.sector         && `Sector: ${offer.sector}`,
      offer.trl            && `TRL: ${offer.trl}`,
      offer.description    && `Description: ${offer.description}`,
      offer.useCase        && `Use Case: ${offer.useCase}`,
      offer.vsExisting     && `vs. Existing Solutions: ${offer.vsExisting}`,
      offer.commercializationPath && `Commercialization Path: ${offer.commercializationPath}`,
      offer.venturePotential && `Venture Potential (human): ${offer.venturePotential}`,
      offer.atumPursue     && `ATUM Pursue (human): ${offer.atumPursue}`,
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fields },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const raw = JSON.parse(completion.choices[0].message.content || '{}');

    // Clamp scores to 1–10 and normalise types
    const clamp = (v: unknown) => Math.min(10, Math.max(1, parseInt(String(v), 10) || 5));

    const updated = await prisma.techOffer.update({
      where: { id },
      data: {
        aiScoreMarketSize:        clamp(raw.marketSize?.score),
        aiScoreIpMoat:            clamp(raw.ipMoat?.score),
        aiScoreTrlTrajectory:     clamp(raw.trlTrajectory?.score),
        aiScoreAtumFit:           clamp(raw.atumFit?.score),
        aiRationaleMarketSize:    String(raw.marketSize?.rationale   || ''),
        aiRationaleIpMoat:        String(raw.ipMoat?.rationale       || ''),
        aiRationaleTrlTrajectory: String(raw.trlTrajectory?.rationale || ''),
        aiRationaleAtumFit:       String(raw.atumFit?.rationale      || ''),
        aiSummary:                String(raw.summary                 || ''),
        aiScoredAt:               new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error scoring tech offer:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
