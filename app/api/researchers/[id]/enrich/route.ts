import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function findSemanticScholarAuthor(name: string, affiliation: string) {
  const query = `${name} ${affiliation}`.slice(0, 120);
  const fields = 'authorId,name,affiliations,hIndex,citationCount,paperCount';
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(query)}&fields=${fields}&limit=3`,
      { headers: { 'User-Agent': 'ATUM-Scout/1.0' }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function getAuthorPapers(authorId: string) {
  const fields = 'title,year,journal,venue,citationCount,influentialCitationCount,isOpenAccess,authors';
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers?fields=${fields}&limit=25`,
      { headers: { 'User-Agent': 'ATUM-Scout/1.0' }, signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const researcher = await prisma.researcher.findUnique({ where: { id } });
    if (!researcher) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // 1. Fetch from Semantic Scholar
    let papers: any[] = [];
    let ssAuthor: any = null;

    ssAuthor = await findSemanticScholarAuthor(researcher.fullName, researcher.affiliation);
    if (ssAuthor?.authorId) {
      papers = await getAuthorPapers(ssAuthor.authorId);
    }

    // Sort by citations descending
    const sortedPapers = [...papers].sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0));
    const topPapers = sortedPapers.slice(0, 10);

    // Top 5 publications to store
    const enrichPublications = sortedPapers.slice(0, 5).map((p: any) => ({
      title: p.title ?? '',
      year: p.year ?? null,
      journal: p.journal?.name || p.venue || null,
      citations: p.citationCount ?? 0,
      influential: p.influentialCitationCount ?? 0,
      openAccess: p.isOpenAccess ?? false,
    }));

    // Co-authors from top papers
    const coAuthorMap = new Map<string, { name: string; institution: string; sharedPapers: number }>();
    for (const paper of topPapers) {
      for (const a of (paper.authors ?? [])) {
        const authorName: string = a.name ?? '';
        if (!authorName || authorName === researcher.fullName) continue;
        const key = a.authorId || authorName;
        const existing = coAuthorMap.get(key);
        if (existing) {
          existing.sharedPapers++;
        } else {
          coAuthorMap.set(key, {
            name: authorName,
            institution: a.affiliations?.[0]?.name || '',
            sharedPapers: 1,
          });
        }
      }
    }
    const enrichCoAuthors = Array.from(coAuthorMap.values())
      .sort((a, b) => b.sharedPapers - a.sharedPapers)
      .slice(0, 10);

    // Signals
    const influentialCitations = sortedPapers.reduce((s: number, p: any) => s + (p.influentialCitationCount ?? 0), 0);
    const openAccessCount = sortedPapers.filter((p: any) => p.isOpenAccess).length;
    const enrichSignals = {
      influentialCitations,
      openAccessPapers: openAccessCount,
      totalPapersAnalyzed: papers.length,
      coAuthorsFound: enrichCoAuthors.length,
      semanticScholarFound: !!ssAuthor,
    };

    // 2. GPT intelligence brief
    const papersContext = topPapers.length > 0
      ? topPapers.map((p: any, i: number) =>
          `${i + 1}. "${p.title}" (${p.year ?? 'n/d'}) — ${p.citationCount ?? 0} citations${p.journal?.name ? `, ${p.journal.name}` : p.venue ? `, ${p.venue}` : ''}`
        ).join('\n')
      : 'No publication data available from Semantic Scholar.';

    const prompt = `You are an analyst at ATUM Ventures, a Singapore-based deep-tech venture builder. Analyse this researcher and produce a structured intelligence report.

Researcher: ${researcher.fullName}
Affiliation: ${researcher.affiliation}
Domain: ${researcher.domainTags || 'Not specified'}
Subfield: ${researcher.subfield || 'Not specified'}
Category: ${researcher.category}
h-Index: ${researcher.hIndex}
Total Citations: ${researcher.citations}
${researcher.noteOnResearch ? `Research Notes: ${researcher.noteOnResearch}` : ''}

Top Publications by Citations:
${papersContext}

Return ONLY a JSON object (no markdown, no fences) with exactly these fields:
{
  "researchFocus": "One sentence, max 25 words. What is the core research focus — what problems do they solve, what technology do they advance?",
  "brief": "Exactly 3 paragraphs separated by double newlines.\\n\\nParagraph 1: Technical overview — their key research contributions, methodology, and what makes their work distinctive.\\n\\nParagraph 2: Commercial applications — specific industry verticals, potential startup opportunities, relevant deep-tech themes (advanced manufacturing, biotech/medtech, energy/climate).\\n\\nParagraph 3: ATUM fit — is this researcher a strong candidate for venture building with ATUM? What's the outreach angle? What venture thesis does their work fit?",
  "webHighlights": [
    { "title": "short headline", "source": "institution or journal name", "snippet": "1-2 sentence description of this achievement or recognition" }
  ]
}

For webHighlights: provide 2-3 notable facts — awards, recognition, key research milestones, industry partnerships, or highly cited contributions. Base on actual knowledge or reasonable inference from their publication record.`;

    let researchFocus = '';
    let brief = '';
    let enrichWebHighlights: any[] = [];

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1200,
      });
      const raw = completion.choices[0].message.content ?? '{}';
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      researchFocus = parsed.researchFocus ?? '';
      brief = parsed.brief ?? '';
      enrichWebHighlights = Array.isArray(parsed.webHighlights) ? parsed.webHighlights.slice(0, 3) : [];
    } catch (e) {
      console.error('GPT error during enrich:', e);
      researchFocus = `${researcher.subfield ?? researcher.category} researcher at ${researcher.affiliation}.`;
      brief = `${researcher.fullName} is a researcher at ${researcher.affiliation} specialising in ${researcher.domainTags ?? researcher.category}.\n\nFurther intelligence could not be generated at this time. Please try again.\n\nContact the researcher directly to learn more about venture potential.`;
    }

    // 3. Save to DB
    const updated = await prisma.researcher.update({
      where: { id },
      data: {
        enrichResearchFocus: researchFocus,
        enrichBrief: brief,
        enrichPublications: enrichPublications.length > 0 ? enrichPublications : undefined,
        enrichSignals,
        enrichCoAuthors: enrichCoAuthors.length > 0 ? enrichCoAuthors : undefined,
        enrichWebHighlights: enrichWebHighlights.length > 0 ? enrichWebHighlights : undefined,
        enrichedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Enrich error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
