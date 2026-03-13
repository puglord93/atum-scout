'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PIPELINE_STAGES, getStage, stageIndex } from '@/lib/stages';

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

const TIER_COLORS: Record<string, string> = {
  A: 'bg-[#F0602C] text-white',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-gray-100 text-gray-600',
};

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0 flex gap-4">
      <span className="text-xs text-gray-500 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-900 flex-1 ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export default function ResearcherDetailPage() {
  const params = useParams();
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [linkedTech, setLinkedTech] = useState<TechOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contactDate, setContactDate] = useState('');
  const [contactedBy, setContactedBy] = useState('');
  const [knowPersonally, setKnowPersonally] = useState(false);
  const [tone, setTone] = useState<'formal' | 'casual'>('formal');
  const [generating, setGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null);

  useEffect(() => {
    fetchResearcher();
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      console.error(e);
    }
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
        body: JSON.stringify({
          contacted: isContacted,
          stage: newStage,
          contactDate: isContacted ? contactDate : null,
          contactedBy: isContacted ? contactedBy : null,
        }),
      });
      const data = await res.json();
      if (data.success) setResearcher(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const generateEmail = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/researchers/${params.id}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowPersonally, tone }),
      });
      const data = await res.json();
      if (data.success) setGeneratedEmail(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string, field: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1500);
  };

  const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!researcher) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <span className="text-sm text-gray-400">Researcher not found</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Back */}
        <Link href="/researchers" className="text-xs text-gray-500 hover:text-gray-900 transition mb-6 inline-block">
          ← Researchers
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">{researcher.fullName}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                <span>{researcher.affiliation}</span>
                {researcher.email && (
                  <>
                    <span>·</span>
                    <a href={`mailto:${researcher.email}`} className="text-[#F0602C] hover:underline font-mono text-xs">
                      {researcher.email}
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded text-sm font-semibold flex-shrink-0 ${TIER_COLORS[researcher.tier] ?? 'bg-gray-100 text-gray-600'}`}>
              {researcher.tier}
            </div>
          </div>

          {/* Metrics strip + stage */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-gray-200 items-end">
            {[
              { label: 'h-index',     value: researcher.hIndex },
              { label: 'Citations',   value: formatNumber(researcher.citations) },
              { label: 'C-Score',     value: researcher.cScore.toFixed(3) },
              { label: 'Global Rank', value: researcher.globalRank ? `#${formatNumber(researcher.globalRank)}` : '—' },
            ].map(m => (
              <div key={m.label}>
                <div className="text-xs text-gray-500 mb-0.5">{m.label}</div>
                <div className="font-mono text-lg font-semibold text-gray-900">{m.value}</div>
              </div>
            ))}
            <div className="ml-auto">
              {(() => {
                const s = getStage(researcher.stage);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${s.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 2-col body */}
        <div className="grid grid-cols-3 gap-6">

          {/* LEFT — Research profile + Linked tech */}
          <div className="col-span-2 space-y-4">

            {/* Research Profile */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Research Profile</div>
              <Field label="Domain" value={researcher.domainTags} />
              <Field label="Subfield" value={researcher.subfield} />
              <Field label="Category" value={researcher.category} />
              <Field label="Origin" value={researcher.origin} />
              {researcher.noteOnResearch && (
                <Field label="Research Notes" value={researcher.noteOnResearch} />
              )}
            </div>

            {/* Linked Tech Offers */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Linked Tech Offers</div>
                {linkedTech.length > 0 && (
                  <span className="text-xs font-mono text-gray-400">{linkedTech.length}</span>
                )}
              </div>
              {linkedTech.length === 0 ? (
                <p className="text-sm text-gray-400">No linked technology offers found</p>
              ) : (
                <div className="space-y-3">
                  {linkedTech.map(tech => (
                    <div key={tech.id} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/tech-offers/${tech.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-[#F0602C] transition leading-snug"
                        >
                          {tech.technology}
                        </Link>
                        {tech.venturePotential && (
                          <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                            tech.venturePotential.toLowerCase().includes('high')
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {tech.venturePotential.split(/[\s.]/)[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                        <span>{tech.institution}</span>
                        {tech.trl && <span>TRL {tech.trl}</span>}
                        {tech.sector && <span>{tech.sector}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Pipeline + AI Outreach */}
          <div className="space-y-4">

            {/* Pipeline Stage */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Pipeline Stage</div>

              {/* Stage steps */}
              <div className="space-y-1 mb-4">
                {PIPELINE_STAGES.map((s, idx) => {
                  const current = stageIndex(researcher.stage);
                  const isPast    = idx < current;
                  const isCurrent = idx === current;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleContactUpdate(researcher.contacted, s.id)}
                      disabled={saving}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition ${
                        isCurrent
                          ? `${s.color} font-medium`
                          : isPast
                          ? 'text-gray-400 hover:bg-gray-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isCurrent ? `border-current ${s.dot} border-0` :
                        isPast    ? 'border-gray-300 bg-gray-200' :
                                    'border-gray-200'
                      }`}>
                        {(isCurrent || isPast) && (
                          <svg className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Contact date / by — only shown once outreach started */}
              {stageIndex(researcher.stage) >= 1 && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Outreach date</label>
                    <input
                      type="date"
                      value={contactDate}
                      onChange={e => setContactDate(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">By</label>
                    <input
                      type="text"
                      value={contactedBy}
                      onChange={e => setContactedBy(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <button
                    onClick={() => handleContactUpdate(true, researcher.stage)}
                    disabled={saving}
                    className="w-full h-8 text-xs border border-gray-200 rounded text-gray-600 hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40"
                  >
                    {saving ? 'Saving…' : 'Save details'}
                  </button>
                </div>
              )}
            </div>

            {/* AI Outreach */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">AI Outreach Email</div>

              <div className="space-y-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="knowPersonally"
                    checked={knowPersonally}
                    onChange={e => setKnowPersonally(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#F0602C]"
                  />
                  <label htmlFor="knowPersonally" className="text-xs text-gray-600">Know personally</label>
                </div>

                <div className="flex gap-3">
                  {(['formal', 'casual'] as const).map(t => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="tone"
                        value={t}
                        checked={tone === t}
                        onChange={() => setTone(t)}
                        className="w-3.5 h-3.5 border-gray-300 text-[#F0602C]"
                      />
                      <span className="text-xs text-gray-600 capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={generateEmail}
                disabled={generating}
                className="w-full h-8 text-xs rounded text-white transition disabled:opacity-60"
                style={{ backgroundColor: '#F0602C' }}
              >
                {generating ? 'Generating…' : 'Generate email'}
              </button>

              {generatedEmail && (
                <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Subject</span>
                      <button
                        onClick={() => copyText(generatedEmail.subject, 'subject')}
                        className="text-xs text-gray-400 hover:text-gray-700 transition"
                      >
                        {copied === 'subject' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2">
                      <p className="text-xs text-gray-900 font-medium">{generatedEmail.subject}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Body</span>
                      <button
                        onClick={() => copyText(generatedEmail.body, 'body')}
                        className="text-xs text-gray-400 hover:text-gray-700 transition"
                      >
                        {copied === 'body' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{generatedEmail.body}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
