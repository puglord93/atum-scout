import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SS_FIELDS = 'title,abstract,authors,year,externalIds,venue,publicationTypes,fieldsOfStudy,s2FieldsOfStudy';
const SS_AUTHOR_FIELDS = 'name,affiliations,hIndex,citationCount,paperCount';

// ── URL detection ─────────────────────────────────────────────────────────────

function detectUrl(url: string): { type: 'arxiv' | 'doi' | 'other'; id?: string } {
  const arxiv = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i);
  if (arxiv) return { type: 'arxiv', id: arxiv[1] };

  const doi = url.match(/(?:doi\.org\/|^doi:)(10\.\S+)/i);
  if (doi) return { type: 'doi', id: doi[1] };

  return { type: 'other' };
}

// ── Semantic Scholar ──────────────────────────────────────────────────────────

async function fetchSSPaper(type: 'arxiv' | 'doi', id: string) {
  const paperId = type === 'arxiv' ? `arXiv:${id}` : id;
  const res = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(paperId)}?fields=${SS_FIELDS}`,
    { headers: { 'User-Agent': 'ATUM-Scout/1.0' }, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  return res.json();
}

async function fetchSSAuthor(authorId: string) {
  const res = await fetch(
    `https://api.semanticscholar.org/graph/v1/author/${authorId}?fields=${SS_AUTHOR_FIELDS}`,
    { headers: { 'User-Agent': 'ATUM-Scout/1.0' }, signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) return null;
  return res.json();
}

// ── GPT fallback ──────────────────────────────────────────────────────────────

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ATUM-Scout/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);
  } catch {
    return '';
  }
}

async function extractWithGPT(pageText: string, url: string) {
  const prompt = `You are a deep-tech venture intelligence assistant for ATUM Ventures (Singapore).
Extract structured data from the following content to create a technology scouting entry.

URL: ${url}
Content: ${pageText}

Return a JSON object with these exact fields (use null for unknown values):
{
  "technology": "paper/technology title",
  "institution": "university or research institution name",
  "description": "2-3 sentence technical description",
  "useCase": "key applications and use cases",
  "vsExisting": "advantages over existing solutions",
  "sector": "one of: Advanced Manufacturing, Biotech/Medtech, Energy/Climate, ICT, Other",
  "trl": "estimated TRL 1-9 as a string, or null",
  "venturePotential": "brief venture potential assessment",
  "likelyPi": "full name of lead author/PI",
  "piAffiliation": "PI's institution",
  "piEmail": "PI email if found, else null",
  "piHIndex": null,
  "piCitations": null
}`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url?.trim()) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const detected = detectUrl(url.trim());
    let extractionSource = 'gpt';

    // ── Path A: Semantic Scholar (arXiv / DOI) ────────────────────────────────
    if (detected.type !== 'other' && detected.id) {
      try {
        const paper = await fetchSSPaper(detected.type, detected.id);
        if (paper?.title) {
          extractionSource = 'semantic_scholar';

          // Enrich first author
          const firstAuthor = paper.authors?.[0];
          let authorDetails: any = null;
          if (firstAuthor?.authorId) {
            authorDetails = await fetchSSAuthor(firstAuthor.authorId);
          }

          const allAuthors = (paper.authors || []).map((a: any) => a.name).join(', ');
          const sectors = [
            ...(paper.s2FieldsOfStudy?.map((f: any) => f.category) || []),
            ...(paper.fieldsOfStudy || []),
          ].filter(Boolean).slice(0, 3).join(', ');

          return NextResponse.json({
            success: true,
            source: extractionSource,
            techOffer: {
              technology: paper.title,
              institution: authorDetails?.affiliations?.[0]?.name || '',
              description: paper.abstract || '',
              sector: sectors,
              trl: null,
              likelyPi: allAuthors,
              venturePotential: null,
              useCase: null,
              vsExisting: null,
              commercializationPath: null,
            },
            researcher: {
              fullName: authorDetails?.name || firstAuthor?.name || '',
              affiliation: authorDetails?.affiliations?.[0]?.name || '',
              hIndex: authorDetails?.hIndex || 0,
              citations: authorDetails?.citationCount || 0,
              email: null,
              domainTags: sectors,
            },
          });
        }
      } catch (e) {
        console.warn('Semantic Scholar lookup failed, falling back to GPT:', e);
      }
    }

    // ── Path B: GPT extraction from page HTML ─────────────────────────────────
    const pageText = await fetchPageText(url.trim());
    if (!pageText) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch page content. Try a different URL.' },
        { status: 400 }
      );
    }

    const extracted = await extractWithGPT(pageText, url.trim());

    return NextResponse.json({
      success: true,
      source: 'gpt',
      techOffer: {
        technology: extracted.technology || '',
        institution: extracted.institution || '',
        description: extracted.description || '',
        useCase: extracted.useCase || '',
        vsExisting: extracted.vsExisting || '',
        sector: extracted.sector || '',
        trl: extracted.trl || null,
        venturePotential: extracted.venturePotential || '',
        likelyPi: extracted.likelyPi || '',
        commercializationPath: null,
      },
      researcher: {
        fullName: extracted.likelyPi || '',
        affiliation: extracted.piAffiliation || extracted.institution || '',
        email: extracted.piEmail || null,
        hIndex: extracted.piHIndex || 0,
        citations: extracted.piCitations || 0,
        domainTags: extracted.sector || '',
      },
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
