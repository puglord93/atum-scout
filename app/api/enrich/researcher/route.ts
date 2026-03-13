import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: 'name param required' }, { status: 400 });
  }

  try {
    const fields = 'name,affiliations,hIndex,citationCount,paperCount,papers.year,papers.title';
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(name)}&fields=${fields}&limit=5`,
      { headers: { 'User-Agent': 'ATUM-Scout/1.0' }, signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Semantic Scholar API error' }, { status: 502 });
    }

    const data = await res.json();
    const authors = (data.data || []).map((a: any) => ({
      semanticScholarId: a.authorId,
      name: a.name,
      affiliation: a.affiliations?.[0]?.name || '',
      hIndex: a.hIndex || 0,
      citations: a.citationCount || 0,
      paperCount: a.paperCount || 0,
    }));

    return NextResponse.json({ success: true, data: authors });
  } catch (error) {
    console.error('Enrich researcher error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch from Semantic Scholar' },
      { status: 500 }
    );
  }
}
