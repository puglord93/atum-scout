import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { knowPersonally = false, tone = 'formal' } = body;

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Fetch researcher
    const researcher = await prisma.researcher.findUnique({
      where: { id },
    });

    if (!researcher) {
      return NextResponse.json(
        { success: false, error: 'Researcher not found' },
        { status: 404 }
      );
    }

    // Build prompt based on relationship and tone
    const systemPrompt = `You are an AI assistant helping craft professional outreach emails to researchers for ATUM Ventures, a deep-tech venture builder in Singapore.

ATUM Ventures focuses on:
- Advanced Manufacturing
- Biotech/Medtech
- Energy/Climate

Your task is to generate a concise, engaging email that:
1. Introduces ATUM Ventures and our interest in their research
2. Expresses genuine interest in potential collaboration
3. Suggests a brief call or meeting
4. Maintains a ${tone} tone
${knowPersonally ? '5. Acknowledges our existing relationship warmly' : '5. Establishes credibility as a cold outreach'}

Keep the email under 150 words. Be specific about their research area.`;

    const userPrompt = `Generate an outreach email for:

Researcher: ${researcher.fullName}
Affiliation: ${researcher.affiliation}
Research Domain: ${researcher.domainTags || researcher.subfield || researcher.category}
h-index: ${researcher.hIndex}
${researcher.noteOnResearch ? `Research Notes: ${researcher.noteOnResearch}` : ''}

${knowPersonally ? 'We have an existing relationship with this researcher.' : 'This is a cold outreach.'}
Tone: ${tone}

Return ONLY a JSON object with "subject" and "body" fields.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      data: {
        subject: result.subject || 'Collaboration Opportunity with ATUM Ventures',
        body: result.body || 'Error generating email body',
      },
    });
  } catch (error) {
    console.error('Error generating outreach email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
