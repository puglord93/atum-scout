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

    const systemPrompt = `You are a critical analyst for ATUM Ventures, a deep-tech venture builder in Singapore. \
Score the following technology offer rigorously across 4 dimensions (1–10 each). Be honest and calibrated — \
most technologies score 4–7. Reserve 8–10 for genuinely exceptional cases. Scores of 9–10 should be rare.

Scoring rubrics (be specific and critical):
- marketSize: 1 = purely academic, no commercial path; 3 = niche vertical <$50M TAM; \
5 = clear $100M–500M addressable market; 7 = $500M–2B market with proven demand; \
9–10 = global platform >$2B with network effects. Penalise if market is crowded or buyer fatigue exists.
- ipMoat: 1 = no IP, purely know-how; 3 = trade secret only; 5 = patent filed/pending; \
7 = granted patent(s) with strong claims; 9–10 = broad patent portfolio + hard process know-how. \
Penalise if prior art exists or it's software-only.
- trlTrajectory: map TRL directly — TRL 1-2 = 1-2pts; TRL 3-4 = 3-4pts; TRL 5-6 = 5-6pts; \
TRL 7 = 7pts; TRL 8 = 8pts; TRL 9 = 9-10pts. Penalise if TRL is unclear or self-reported.
- atumFit: 1 = no fit (consumer, pure software, social); 4 = tangential fit; \
6 = fits one ATUM vertical (Advanced Manufacturing, Biotech/Medtech, Energy/Climate); \
8 = strong fit + aligns with ATUM's venture-building model (needs POC, pilot, spin-out); \
10 = perfect fit, ATUM has direct network for commercialisation.

For each dimension write a 2–3 sentence rationale (~50 words) that explains the specific evidence \
behind the score — cite concrete details from the technology description. Do not be vague.

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
