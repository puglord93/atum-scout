'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PIPELINE_STAGES, getStage, stageIndex } from '@/lib/stages';

// ─── Types ────────────────────────────────────────────────────────────────────

type EnrichPublication = {
  title: string;
  year: number | null;
  journal: string | null;
  citations: number;
  influential: number;
  openAccess: boolean;
};

type EnrichSignals = {
  influentialCitations: number;
  openAccessPapers: number;
  totalPapersAnalyzed: number;
  coAuthorsFound: number;
  semanticScholarFound: boolean;
};

type CoAuthor = {
  name: string;
  institution: string;
  sharedPapers: number;
};

type WebHighlight = {
  title: string;
  source: string;
  snippet: string;
  url?: string;
  date?: string;
};

type Researcher = {
  id: number;
  fullName: string;
  email: string | null;
  affiliation: string;
  tier: string;
  hIndex: number;
  citations: number;
  cScore: number;
  globalRank: number | null;
  domainTags: string | null;
  subfield: string | null;
  category: string;
  noteOnResearch: string | null;
  origin: string;
  contacted: boolean;
  contactDate: string | null;
  contactedBy: string | null;
  stage: string;
  enrichResearchFocus: string | null;
  enrichBrief: string | null;
  enrichPublications: EnrichPublication[] | null;
  enrichSignals: EnrichSignals | null;
  enrichCoAuthors: CoAuthor[] | null;
  enrichWebHighlights: WebHighlight[] | null;
  enrichedAt: string | null;
};

type ResearcherNote = {
  id: number;
  researcherId: number;
  content: string;
  author: string;
  type: 'note' | 'call' | 'email' | 'meeting';
  createdAt: string;
};

type TechOffer = {
  id: number;
  techId: string;
  technology: string;
  institution: string;
  trl: string | null;
  sector: string | null;
  venturePotential: string | null;
  description: string | null;
  likelyPi: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_TYPES: { value: ResearcherNote['type']; label: string; dot: string; color: string }[] = [
  { value: 'note',    label: 'Note',    dot: 'bg-gray-400',   color: 'text-gray-600'   },
  { value: 'call',    label: 'Call',    dot: 'bg-blue-500',   color: 'text-blue-700'   },
  { value: 'email',   label: 'Email',   dot: 'bg-violet-500', color: 'text-violet-700' },
  { value: 'meeting', label: 'Meeting', dot: 'bg-amber-500',  color: 'text-amber-700'  },
];

const TIER_COLORS: Record<string, string> = {
  A: 'bg-[#F0602C] text-white',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-gray-100 text-gray-600',
};

const SCORE_COMPONENTS = [
  { key: 'domain',   label: 'Domain Relevance', weight: 35, color: '#F0602C' },
  { key: 'hindex',   label: 'h-index',           weight: 25, color: '#3B82F6' },
  { key: 'cscore',   label: 'c-score',            weight: 25, color: '#8B5CF6' },
  { key: 'momentum', label: 'Momentum',           weight: 15, color: '#10B981' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNoteType(type: string) {
  return NOTE_TYPES.find(t => t.value === type) ?? NOTE_TYPES[0];
}

function fmt(n: number) { return new Intl.NumberFormat().format(n); }

function calcAtumScore(r: Researcher) {
  const tierMap: Record<string, number> = { A: 95, B: 78, C: 55, D: 30 };
  const domainScore  = tierMap[r.tier] ?? 50;
  const hScore       = Math.min(100, (Math.log(Math.max(1, r.hIndex)) / Math.log(150)) * 100);
  const cScore       = Math.min(100, Math.max(0, (r.cScore - 2.5) / 2.5 * 100));
  const momentumScore = 50; // no historical data available

  const scores = { domain: domainScore, hindex: hScore, cscore: cScore, momentum: momentumScore };
  const rawDisplays: Record<string, string> = {
    domain: domainScore.toFixed(0),
    hindex: r.hIndex.toString(),
    cscore: r.cScore.toFixed(3),
    momentum: '—',
  };

  const total = SCORE_COMPONENTS.reduce((s, c) => s + scores[c.key as keyof typeof scores] * c.weight / 100, 0);

  return {
    total: Math.round(total * 10) / 10,
    components: SCORE_COMPONENTS.map(c => ({
      ...c,
      score: scores[c.key as keyof typeof scores],
      rawDisplay: rawDisplays[c.key],
      normalised: (scores[c.key as keyof typeof scores] * c.weight / 100).toFixed(1),
      barWidth: scores[c.key as keyof typeof scores] * c.weight / 100, // % of full bar
    })),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WebHighlightCard({ h }: { h: WebHighlight }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <p className="text-xs font-medium text-gray-800 leading-snug">{h.title}</p>
        {h.url && (
          <svg className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{h.source}</span>
        {h.date && <span className="text-xs text-gray-300 font-mono">{h.date}</span>}
      </div>
      {h.snippet && <p className="text-xs text-gray-600 leading-relaxed">{h.snippet}</p>}
    </>
  );
  return h.url ? (
    <a href={h.url} target="_blank" rel="noopener noreferrer"
      className="block border border-gray-100 rounded p-3 hover:border-gray-300 hover:bg-gray-50 transition">
      {inner}
    </a>
  ) : (
    <div className="border border-gray-100 rounded p-3">{inner}</div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'publications' | 'network' | 'web';

export default function ResearcherDetailPage() {
  const params = useParams();
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [linkedTech, setLinkedTech]  = useState<TechOffer[]>([]);
  const [loading, setLoading]        = useState(true);
  const [saving, setSaving]          = useState(false);
  const [activeTab, setActiveTab]    = useState<Tab>('overview');

  const [contactDate, setContactDate]   = useState('');
  const [contactedBy, setContactedBy]   = useState('');

  const [notes, setNotes]               = useState<ResearcherNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [showCompose, setShowCompose]   = useState(false);
  const [noteContent, setNoteContent]   = useState('');
  const [noteAuthor, setNoteAuthor]     = useState('');
  const [noteType, setNoteType]         = useState<ResearcherNote['type']>('note');
  const [submittingNote, setSubmittingNote] = useState(false);

  const [enriching, setEnriching]       = useState(false);

  const [knowPersonally, setKnowPersonally] = useState(false);
  const [tone, setTone]                 = useState<'formal' | 'casual'>('formal');
  const [generating, setGenerating]     = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied]             = useState<'subject' | 'body' | null>(null);

  useEffect(() => {
    fetchResearcher();
    fetchNotes();
    const saved = typeof window !== 'undefined' ? localStorage.getItem('atum_scout_author') : '';
    if (saved) setNoteAuthor(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchResearcher = async () => {
    try {
      const res = await fetch(`/api/researchers/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setResearcher(data.data);
        setContactDate(data.data.contactDate || '');
        setContactedBy(data.data.contactedBy || '');
        fetchLinkedTech(data.data.fullName);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLinkedTech = async (fullName: string) => {
    try {
      const res = await fetch('/api/tech-offers');
      const data = await res.json();
      if (data.success) {
        const matches = data.data.filter((tech: TechOffer) => {
          if (!tech.likelyPi) return false;
          const pi = tech.likelyPi.toLowerCase();
          const name = fullName.toLowerCase();
          return pi.includes(name) || name.includes(pi);
        });
        setLinkedTech(matches);
      }
    } catch (e) { console.error(e); }
  };

  const handleContactUpdate = async (contacted: boolean, stage?: string) => {
    if (!researcher) return;
    setSaving(true);
    const newStage = stage ?? researcher.stage;
    const isContacted = contacted || stageIndex(newStage) >= 1;
    try {
      const res = await fetch(`/api/researchers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacted: isContacted, stage: newStage,
          contactDate: isContacted ? contactDate : null,
          contactedBy: isContacted ? contactedBy : null }),
      });
      const data = await res.json();
      if (data.success) setResearcher(data.data);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/researchers/${params.id}/notes`);
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch (e) { console.error(e); }
    finally { setNotesLoading(false); }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !noteAuthor.trim()) return;
    setSubmittingNote(true);
    const tempId = -Date.now();
    const optimistic: ResearcherNote = {
      id: tempId, researcherId: researcher!.id,
      content: noteContent.trim(), author: noteAuthor.trim(),
      type: noteType, createdAt: new Date().toISOString(),
    };
    setNotes(prev => [optimistic, ...prev]);
    setShowCompose(false);
    setNoteContent('');
    if (typeof window !== 'undefined') localStorage.setItem('atum_scout_author', noteAuthor.trim());
    try {
      const res = await fetch(`/api/researchers/${params.id}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimistic.content, author: optimistic.author, type: noteType }),
      });
      const data = await res.json();
      if (data.success) setNotes(prev => prev.map(n => n.id === tempId ? data.data : n));
      else setNotes(prev => prev.filter(n => n.id !== tempId));
    } catch { setNotes(prev => prev.filter(n => n.id !== tempId)); }
    finally { setSubmittingNote(false); }
  };

  const handleDeleteNote = async (noteId: number) => {
    const prev = [...notes];
    setNotes(n => n.filter(x => x.id !== noteId));
    try {
      const res = await fetch(`/api/researchers/${params.id}/notes/${noteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) setNotes(prev);
    } catch { setNotes(prev); }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const res = await fetch(`/api/researchers/${params.id}/enrich`, { method: 'POST' });
      const data = await res.json();
      if (data.success) setResearcher(data.data);
    } catch (e) { console.error(e); }
    finally { setEnriching(false); }
  };

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/researchers/${params.id}/outreach`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowPersonally, tone }),
      });
      const data = await res.json();
      if (data.success) setGeneratedEmail(data.data);
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const copyText = (text: string, field: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading...</span>
    </div>
  );

  if (!researcher) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <span className="text-sm text-gray-400">Researcher not found</span>
    </div>
  );

  const score = calcAtumScore(researcher);
  const isEnriched = !!researcher.enrichedAt;

  // Tab availability
  const hasPubs    = (researcher.enrichPublications?.length ?? 0) > 0;
  const hasNetwork = (researcher.enrichCoAuthors?.length ?? 0) > 0;
  const hasWeb     = (researcher.enrichWebHighlights?.length ?? 0) > 0;

  const TABS: { id: Tab; label: string; locked?: boolean }[] = [
    { id: 'overview',      label: 'Overview' },
    { id: 'publications',  label: 'Publications', locked: !hasPubs },
    { id: 'network',       label: 'Network',      locked: !hasNetwork },
    { id: 'web',           label: 'Web Presence', locked: !hasWeb },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Back */}
        <Link href="/researchers" className="text-xs text-gray-500 hover:text-gray-900 transition mb-5 inline-block">
          ← Researchers
        </Link>

        {/* ── Header ── */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{researcher.fullName}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
                <span>{researcher.affiliation}</span>
                {researcher.email && (
                  <>
                    <span className="text-gray-300">·</span>
                    <a href={`mailto:${researcher.email}`} className="text-[#F0602C] hover:underline font-mono text-xs">
                      {researcher.email}
                    </a>
                  </>
                )}
              </div>
            </div>
            {/* Enrich button */}
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="flex-shrink-0 h-8 px-3 text-xs border border-gray-200 rounded text-gray-600 hover:border-[#F0602C] hover:text-[#F0602C] transition disabled:opacity-40 flex items-center gap-1.5"
            >
              {enriching ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Enriching…
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  {isEnriched ? 'Re-enrich' : 'Enrich with AI'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.locked && setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : tab.locked
                  ? 'border-transparent text-gray-300 cursor-default'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.locked && (
                <span className="ml-1.5 text-gray-300">·</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body: content + sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">

          {/* ── LEFT: Tab content ── */}
          <div className="min-w-0 space-y-4">

            {/* ═══ OVERVIEW ═══ */}
            {activeTab === 'overview' && (
              <>
                {/* ATUM Score */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">ATUM Score</span>
                    <span className="text-3xl font-semibold font-mono" style={{ color: '#F0602C' }}>
                      {score.total.toFixed(1)}
                    </span>
                  </div>

                  {/* Segmented bar */}
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                    {score.components.map(c => (
                      <div
                        key={c.key}
                        style={{ width: `${c.barWidth}%`, backgroundColor: c.color }}
                        className="h-full"
                      />
                    ))}
                  </div>

                  {/* Component rows */}
                  <div className="space-y-2.5">
                    {score.components.map(c => (
                      <div key={c.key} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-xs text-gray-600 w-32 flex-shrink-0">{c.label}</span>
                        <span className="text-xs text-gray-400 w-8 flex-shrink-0">{c.weight}%</span>
                        {/* Mini bar */}
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.score}%`, backgroundColor: c.color, opacity: 0.6 }} />
                        </div>
                        <span className="text-xs font-mono text-gray-500 w-12 text-right flex-shrink-0">{c.rawDisplay}</span>
                        <span className="text-xs font-mono text-gray-400 w-8 text-right flex-shrink-0">{c.normalised}</span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-300 mt-2">Raw values normalised 0–100, then weighted. h-index log scale, c-score linear 2.5–5.0.</p>
                  </div>
                </div>

                {/* Research Focus — shown if enriched */}
                {researcher.enrichResearchFocus && (
                  <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Research Focus</div>
                    <p className="text-sm text-gray-800 leading-relaxed">{researcher.enrichResearchFocus}</p>
                  </div>
                )}

                {/* Top Publications preview (3) */}
                {hasPubs && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Publications</span>
                      <button onClick={() => setActiveTab('publications')} className="text-xs text-gray-400 hover:text-gray-700 transition">
                        View all {researcher.enrichPublications!.length} →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {researcher.enrichPublications!.slice(0, 3).map((pub, i) => (
                        <div key={i} className="border border-gray-100 rounded p-3 hover:border-gray-200 transition">
                          <p className="text-xs font-medium text-gray-800 leading-snug mb-1.5">{pub.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono flex-wrap">
                            {pub.year && <span>{pub.year}</span>}
                            {pub.journal && <><span className="text-gray-200">·</span><span className="max-w-[150px] truncate">{pub.journal}</span></>}
                            <span className="text-gray-200">·</span>
                            <span>{fmt(pub.citations)} citations</span>
                            {pub.influential > 0 && <><span className="text-gray-200">·</span><span className="text-amber-500">{pub.influential} influential</span></>}
                            {pub.openAccess && <span className="bg-green-50 text-green-600 px-1 rounded">OA</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intelligence Brief */}
                {researcher.enrichBrief && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Intelligence Brief</div>
                    <div className="space-y-3">
                      {researcher.enrichBrief.split(/\n\n+/).map((para, i) => (
                        <p key={i} className="text-sm text-gray-700 leading-relaxed">{para}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Profile (always visible) */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Research Profile</div>
                  {[
                    { label: 'Domain',          value: researcher.domainTags },
                    { label: 'Subfield',         value: researcher.subfield },
                    { label: 'Category',         value: researcher.category },
                    { label: 'Origin',           value: researcher.origin },
                    { label: 'Research Notes',   value: researcher.noteOnResearch },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="py-2.5 border-b border-gray-100 last:border-0 flex gap-4">
                      <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{f.label}</span>
                      <span className="text-sm text-gray-800 flex-1">{f.value}</span>
                    </div>
                  ))}
                </div>

                {/* Linked Tech Offers */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Linked Tech Offers</div>
                    {linkedTech.length > 0 && <span className="text-xs font-mono text-gray-400">{linkedTech.length}</span>}
                  </div>
                  {linkedTech.length === 0 ? (
                    <p className="text-sm text-gray-400">No linked technology offers found</p>
                  ) : (
                    <div className="space-y-2">
                      {linkedTech.map(tech => (
                        <div key={tech.id} className="border border-gray-100 rounded p-3 hover:border-gray-200 transition">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/tech-offers/${tech.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-[#F0602C] transition leading-snug">
                              {tech.technology}
                            </Link>
                            {tech.venturePotential && (
                              <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                                tech.venturePotential.toLowerCase().includes('high') ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>{tech.venturePotential.split(/[\s.]/)[0]}</span>
                            )}
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            <span>{tech.institution}</span>
                            {tech.trl && <span>TRL {tech.trl}</span>}
                            {tech.sector && <span>{tech.sector}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Outreach Email */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">AI Outreach Email</div>
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={knowPersonally} onChange={e => setKnowPersonally(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#F0602C]" />
                      <span className="text-xs text-gray-600">Know personally</span>
                    </label>
                    <div className="flex gap-3">
                      {(['formal', 'casual'] as const).map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="tone" value={t} checked={tone === t} onChange={() => setTone(t)}
                            className="w-3.5 h-3.5 border-gray-300 text-[#F0602C]" />
                          <span className="text-xs text-gray-600 capitalize">{t}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={generateEmail} disabled={generating}
                      className="ml-auto h-8 px-4 text-xs rounded text-white transition disabled:opacity-60"
                      style={{ backgroundColor: '#F0602C' }}>
                      {generating ? 'Generating…' : 'Generate email'}
                    </button>
                  </div>
                  {generatedEmail && (
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      {(['subject', 'body'] as const).map(field => (
                        <div key={field}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400 capitalize">{field}</span>
                            <button onClick={() => copyText(generatedEmail[field], field)}
                              className="text-xs text-gray-400 hover:text-gray-700 transition">
                              {copied === field ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2">
                            <p className={`text-xs text-gray-700 whitespace-pre-wrap leading-relaxed ${field === 'subject' ? 'font-medium' : ''}`}>
                              {generatedEmail[field]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enriching loading state */}
                {enriching && (
                  <div className="bg-white border border-gray-200 rounded-lg px-5 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Fetching publications & generating intelligence brief…
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Usually takes 10–20 seconds</p>
                  </div>
                )}
              </>
            )}

            {/* ═══ PUBLICATIONS ═══ */}
            {activeTab === 'publications' && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Publications</span>
                  <span className="text-xs font-mono text-gray-400">{researcher.enrichPublications?.length ?? 0} found</span>
                </div>
                {hasPubs ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-4 text-gray-400 font-medium">Title</th>
                          <th className="text-right py-2 pr-3 text-gray-400 font-medium w-12">Year</th>
                          <th className="text-left py-2 pr-4 text-gray-400 font-medium w-32 hidden sm:table-cell">Journal</th>
                          <th className="text-right py-2 pr-3 text-gray-400 font-medium w-20">Citations</th>
                          <th className="text-right py-2 pr-3 text-gray-400 font-medium w-20 hidden sm:table-cell">Influential</th>
                          <th className="text-center py-2 text-gray-400 font-medium w-10 hidden sm:table-cell">OA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {researcher.enrichPublications!.map((pub, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="py-3 pr-4 text-gray-800 font-medium leading-snug">{pub.title}</td>
                            <td className="py-3 pr-3 text-right font-mono text-gray-500">{pub.year ?? '—'}</td>
                            <td className="py-3 pr-4 text-gray-500 truncate max-w-[128px] hidden sm:table-cell">{pub.journal ?? '—'}</td>
                            <td className="py-3 pr-3 text-right font-mono text-gray-700">{fmt(pub.citations)}</td>
                            <td className="py-3 pr-3 text-right font-mono text-amber-500 hidden sm:table-cell">
                              {pub.influential > 0 ? pub.influential : '—'}
                            </td>
                            <td className="py-3 text-center hidden sm:table-cell">
                              {pub.openAccess && <span className="bg-green-50 text-green-600 px-1 rounded text-xs">OA</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No publications data. Click &ldquo;Enrich with AI&rdquo; to fetch.</p>
                )}
              </div>
            )}

            {/* ═══ NETWORK ═══ */}
            {activeTab === 'network' && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Co-author Network</span>
                  <span className="text-xs font-mono text-gray-400">{researcher.enrichCoAuthors?.length ?? 0} found</span>
                </div>
                {hasNetwork ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 pr-4 text-gray-400 font-medium">Name</th>
                          <th className="text-left py-2 pr-4 text-gray-400 font-medium hidden sm:table-cell">Institution</th>
                          <th className="text-right py-2 text-gray-400 font-medium w-24">Shared Papers</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {researcher.enrichCoAuthors!.map((ca, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="py-3 pr-4 text-gray-800 font-medium">{ca.name}</td>
                            <td className="py-3 pr-4 text-gray-500 hidden sm:table-cell">{ca.institution || '—'}</td>
                            <td className="py-3 text-right font-mono text-gray-700">{ca.sharedPapers}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No network data. Click &ldquo;Enrich with AI&rdquo; to fetch.</p>
                )}
              </div>
            )}

            {/* ═══ WEB PRESENCE ═══ */}
            {activeTab === 'web' && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Web Highlights</span>
                  {hasWeb && researcher.enrichWebHighlights!.some(h => h.url) && (
                    <span className="text-xs text-gray-300">· live results</span>
                  )}
                </div>
                {hasWeb ? (
                  <div className="space-y-2">
                    {researcher.enrichWebHighlights!.map((h, i) => (
                      <WebHighlightCard key={i} h={h} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No web data. Click &ldquo;Enrich with AI&rdquo; to fetch.</p>
                )}
              </div>
            )}

          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">

            {/* Tier + stage badge */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0 ${TIER_COLORS[researcher.tier] ?? 'bg-gray-100 text-gray-600'}`}>
                  {researcher.tier}
                </div>
                {(() => {
                  const s = getStage(researcher.stage);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${s.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  );
                })()}
              </div>

              {/* Pipeline steps */}
              <div className="space-y-0.5">
                {PIPELINE_STAGES.map((s, idx) => {
                  const current    = stageIndex(researcher.stage);
                  const isPast     = idx < current;
                  const isCurrent  = idx === current;
                  return (
                    <button key={s.id}
                      onClick={() => handleContactUpdate(researcher.contacted, s.id)}
                      disabled={saving}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition ${
                        isCurrent ? `${s.color} font-medium` : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isCurrent ? `${s.dot} border-0` : isPast ? 'border-gray-300 bg-gray-200' : 'border-gray-200'
                      }`}>
                        {(isCurrent || isPast) && (
                          <svg className={`w-2.5 h-2.5 ${isCurrent ? 'text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Outreach date / by */}
              {stageIndex(researcher.stage) >= 1 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <input type="date" value={contactDate} onChange={e => setContactDate(e.target.value)}
                    className="w-full h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900"/>
                  <input type="text" value={contactedBy} onChange={e => setContactedBy(e.target.value)}
                    placeholder="By (your name)"
                    className="w-full h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-400"/>
                  <button onClick={() => handleContactUpdate(true, researcher.stage)} disabled={saving}
                    className="w-full h-7 text-xs border border-gray-200 rounded text-gray-600 hover:border-gray-400 transition disabled:opacity-40">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Metrics</div>
              <div className="space-y-2.5">
                {[
                  { label: 'h-index',      value: researcher.hIndex },
                  { label: 'Citations',    value: fmt(researcher.citations) },
                  { label: 'c-score',      value: researcher.cScore.toFixed(3) },
                  { label: 'Global rank',  value: researcher.globalRank ? `#${fmt(researcher.globalRank)}` : '—' },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{m.label}</span>
                    <span className="text-xs font-mono font-semibold text-gray-900">{m.value}</span>
                  </div>
                ))}

                {researcher.enrichSignals && (
                  <>
                    <div className="border-t border-gray-100 pt-2.5 space-y-2.5">
                      {[
                        { label: 'Influential cit.',  value: researcher.enrichSignals.influentialCitations },
                        { label: 'Papers analysed',   value: researcher.enrichSignals.totalPapersAnalyzed },
                        { label: 'Co-authors found',  value: researcher.enrichSignals.coAuthorsFound },
                        { label: 'Open access',       value: researcher.enrichSignals.openAccessPapers },
                      ].map(m => (
                        <div key={m.label} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{m.label}</span>
                          <span className="text-xs font-mono text-gray-700">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(researcher.subfield || researcher.domainTags) && (
                  <div className="border-t border-gray-100 pt-2.5 space-y-2">
                    {researcher.subfield && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Subfield</div>
                        <div className="text-xs font-medium text-gray-700">{researcher.subfield}</div>
                      </div>
                    )}
                    {researcher.domainTags && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1.5">Domains</div>
                        <div className="flex flex-wrap gap-1">
                          {researcher.domainTags.split(/[,;]+/).map(d => d.trim()).filter(Boolean).map(d => (
                            <span key={d} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {researcher.enrichedAt && (
                  <div className="border-t border-gray-100 pt-2.5">
                    <div className="text-xs text-gray-300">
                      Enriched {new Date(researcher.enrichedAt).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── Activity Log (always full width below) ── */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Activity Log</span>
            <button onClick={() => setShowCompose(v => !v)}
              className="text-xs text-gray-500 hover:text-gray-900 transition font-medium">
              {showCompose ? 'Cancel' : '+ Add note'}
            </button>
          </div>

          {showCompose && (
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)}
                placeholder="Log a call, email, meeting outcome, or general observation..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-400 resize-none"/>
              <div className="flex items-center gap-2 mt-2">
                <select value={noteType} onChange={e => setNoteType(e.target.value as ResearcherNote['type'])}
                  className="h-8 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-700">
                  {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input type="text" value={noteAuthor} onChange={e => setNoteAuthor(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 h-8 px-2.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-400"/>
                <button onClick={handleAddNote} disabled={submittingNote || !noteContent.trim() || !noteAuthor.trim()}
                  className="h-8 px-4 text-xs font-medium text-white rounded transition disabled:opacity-40"
                  style={{ backgroundColor: '#F0602C' }}>
                  {submittingNote ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          )}

          {notesLoading ? (
            <div className="px-5 py-8 text-sm text-gray-400 text-center">Loading…</div>
          ) : notes.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-400 text-center">No activity logged yet. Add a note to start tracking this relationship.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notes.map(note => {
                const nt = getNoteType(note.type);
                const isTemp = note.id < 0;
                return (
                  <div key={note.id} className={`group px-5 py-4 hover:bg-gray-50 transition-colors ${isTemp ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${nt.dot}`} />
                        <span className={`text-xs font-medium ${nt.color}`}>{nt.label}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {new Date(note.createdAt).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{note.author}</span>
                      </div>
                      {!isTemp && (
                        <button onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-200 hover:text-red-400 transition text-sm leading-none flex-shrink-0 opacity-0 group-hover:opacity-100">
                          ×
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
