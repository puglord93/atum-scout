'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type TechOfferDraft = {
  technology: string;
  institution: string;
  description: string;
  useCase: string;
  vsExisting: string;
  commercializationPath: string;
  sector: string;
  trl: string;
  venturePotential: string;
  likelyPi: string;
  atumPursue: string;
  notes: string;
};

type ResearcherDraft = {
  fullName: string;
  affiliation: string;
  email: string;
  hIndex: string;
  citations: string;
  domainTags: string;
  subfield: string;
  tier: string;
  noteOnResearch: string;
};

const EMPTY_TECH: TechOfferDraft = {
  technology: '', institution: '', description: '', useCase: '',
  vsExisting: '', commercializationPath: '', sector: '', trl: '',
  venturePotential: '', likelyPi: '', atumPursue: '', notes: '',
};

const EMPTY_RESEARCHER: ResearcherDraft = {
  fullName: '', affiliation: '', email: '', hIndex: '0', citations: '0',
  domainTags: '', subfield: '', tier: 'C', noteOnResearch: '',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FormField({
  label, value, onChange, multiline = false, placeholder = '', mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  mono?: boolean;
}) {
  const cls = `w-full px-2.5 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-400 ${mono ? 'font-mono' : ''}`;
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls + ' resize-none'}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IngestPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'url' | 'manual-tech' | 'manual-researcher'>('url');

  // URL mode state
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractSource, setExtractSource] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [tech, setTech] = useState<TechOfferDraft>(EMPTY_TECH);
  const [researcher, setResearcher] = useState<ResearcherDraft>(EMPTY_RESEARCHER);
  const [saveResearcher, setSaveResearcher] = useState(true);

  // Enrich state
  const [enriching, setEnriching] = useState(false);
  const [enrichMatches, setEnrichMatches] = useState<any[]>([]);
  const [showEnrichMatches, setShowEnrichMatches] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!url.trim()) return;
    setExtracting(true);
    setExtractError('');
    setShowPreview(false);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!data.success) {
        setExtractError(data.error || 'Extraction failed');
        return;
      }

      setTech({ ...EMPTY_TECH, ...data.techOffer });
      setResearcher({ ...EMPTY_RESEARCHER, ...data.researcher, hIndex: String(data.researcher.hIndex || 0), citations: String(data.researcher.citations || 0) });
      setExtractSource(data.source);
      setShowPreview(true);
    } catch (e) {
      setExtractError('Network error — please try again');
    } finally {
      setExtracting(false);
    }
  };

  const handleEnrich = async () => {
    if (!researcher.fullName.trim()) return;
    setEnriching(true);
    setShowEnrichMatches(false);
    try {
      const res = await fetch(`/api/enrich/researcher?name=${encodeURIComponent(researcher.fullName)}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setEnrichMatches(data.data);
        setShowEnrichMatches(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEnriching(false);
    }
  };

  const applyEnrichMatch = (match: any) => {
    setResearcher(r => ({
      ...r,
      fullName: match.name || r.fullName,
      affiliation: match.affiliation || r.affiliation,
      hIndex: String(match.hIndex || 0),
      citations: String(match.citations || 0),
    }));
    setShowEnrichMatches(false);
  };

  const handleSaveTech = async () => {
    setSaving(true);
    setSaveError('');
    try {
      // Optionally create researcher first
      if (saveResearcher && researcher.fullName.trim() && researcher.affiliation.trim()) {
        await fetch('/api/researchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...researcher,
            hIndex: parseInt(researcher.hIndex) || 0,
            citations: parseInt(researcher.citations) || 0,
            source: mode === 'url' ? 'url_ingest' : 'manual',
            origin: mode === 'url' ? url : 'Manual',
          }),
        });
      }

      const res = await fetch('/api/tech-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tech, source: mode === 'url' ? 'url_ingest' : 'manual' }),
      });
      const data = await res.json();
      if (!data.success) { setSaveError(data.error); return; }
      router.push(`/tech-offers/${data.data.id}`);
    } catch (e) {
      setSaveError('Save failed — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResearcherOnly = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/researchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...researcher,
          hIndex: parseInt(researcher.hIndex) || 0,
          citations: parseInt(researcher.citations) || 0,
          source: 'manual',
          origin: 'Manual',
        }),
      });
      const data = await res.json();
      if (!data.success) { setSaveError(data.error); return; }
      router.push(`/researchers/${data.data.id}`);
    } catch (e) {
      setSaveError('Save failed — please try again');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 transition mb-4 inline-block">← Overview</Link>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">Add to Scout</h1>
          <p className="text-sm text-gray-500">Ingest from a URL or add entries manually</p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
          {([
            { id: 'url',                label: 'From URL' },
            { id: 'manual-tech',        label: 'Manual Tech Offer' },
            { id: 'manual-researcher',  label: 'Manual Researcher' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setMode(tab.id); setShowPreview(false); setExtractError(''); setSaveError(''); }}
              className={`h-8 px-4 text-xs font-medium rounded transition ${
                mode === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── URL MODE ─────────────────────────────────────────────────────── */}
        {mode === 'url' && (
          <div>
            {/* URL input */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Paper or Technology URL</div>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleExtract()}
                  placeholder="https://arxiv.org/abs/2301.xxxxx  or  https://doi.org/10.xxxx  or  any TTO page"
                  className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white text-gray-900 placeholder-gray-400 font-mono"
                />
                <button
                  onClick={handleExtract}
                  disabled={extracting || !url.trim()}
                  className="h-9 px-4 text-sm font-medium text-white rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#F0602C' }}
                >
                  {extracting ? 'Extracting…' : 'Extract'}
                </button>
              </div>
              {extractError && <p className="text-xs text-red-600 mt-2">{extractError}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Supports arXiv, DOI links (Semantic Scholar) and any web page (GPT extraction)
              </p>
            </div>

            {/* Preview form */}
            {showPreview && (
              <div>
                {extractSource && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center h-5 px-2 text-xs rounded ${
                      extractSource === 'semantic_scholar'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {extractSource === 'semantic_scholar' ? 'Semantic Scholar' : 'GPT Extraction'}
                    </span>
                    <span className="text-xs text-gray-400">Review and edit the extracted data before saving</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-6">
                  {/* Tech Offer form */}
                  <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Tech Offer</div>
                    <div className="space-y-3">
                      <FormField label="Technology / Title *" value={tech.technology} onChange={v => setTech(t => ({ ...t, technology: v }))} placeholder="Name of the technology or paper" />
                      <FormField label="Institution *" value={tech.institution} onChange={v => setTech(t => ({ ...t, institution: v }))} placeholder="University or research institute" />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Sector" value={tech.sector} onChange={v => setTech(t => ({ ...t, sector: v }))} placeholder="e.g. Biotech/Medtech" />
                        <FormField label="TRL" value={tech.trl} onChange={v => setTech(t => ({ ...t, trl: v }))} placeholder="1–9" mono />
                      </div>
                      <FormField label="Description" value={tech.description} onChange={v => setTech(t => ({ ...t, description: v }))} multiline placeholder="Technical description of what it does" />
                      <FormField label="Use Case" value={tech.useCase} onChange={v => setTech(t => ({ ...t, useCase: v }))} multiline placeholder="Key applications" />
                      <FormField label="vs. Existing Solutions" value={tech.vsExisting} onChange={v => setTech(t => ({ ...t, vsExisting: v }))} multiline placeholder="Advantages over current solutions" />
                      <FormField label="Venture Potential" value={tech.venturePotential} onChange={v => setTech(t => ({ ...t, venturePotential: v }))} multiline placeholder="Assessment of commercial potential" />
                      <FormField label="Likely PI" value={tech.likelyPi} onChange={v => setTech(t => ({ ...t, likelyPi: v }))} placeholder="Lead researcher(s)" />
                      <FormField label="Notes" value={tech.notes} onChange={v => setTech(t => ({ ...t, notes: v }))} multiline placeholder="Internal notes" />
                    </div>
                  </div>

                  {/* Researcher form */}
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">PI / Researcher</div>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveResearcher}
                            onChange={e => setSaveResearcher(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300"
                          />
                          <span className="text-xs text-gray-500">Save researcher</span>
                        </label>
                      </div>

                      {saveResearcher && (
                        <div className="space-y-2.5">
                          <FormField label="Full Name" value={researcher.fullName} onChange={v => setResearcher(r => ({ ...r, fullName: v }))} />
                          <FormField label="Affiliation" value={researcher.affiliation} onChange={v => setResearcher(r => ({ ...r, affiliation: v }))} />
                          <FormField label="Email" value={researcher.email} onChange={v => setResearcher(r => ({ ...r, email: v }))} />
                          <div className="grid grid-cols-2 gap-2">
                            <FormField label="h-index" value={researcher.hIndex} onChange={v => setResearcher(r => ({ ...r, hIndex: v }))} mono />
                            <FormField label="Citations" value={researcher.citations} onChange={v => setResearcher(r => ({ ...r, citations: v }))} mono />
                          </div>
                          <FormField label="Domain Tags" value={researcher.domainTags} onChange={v => setResearcher(r => ({ ...r, domainTags: v }))} />
                          <SelectField
                            label="Tier"
                            value={researcher.tier}
                            onChange={v => setResearcher(r => ({ ...r, tier: v }))}
                            options={[
                              { value: 'A', label: 'A — Priority' },
                              { value: 'B', label: 'B — Strong' },
                              { value: 'C', label: 'C — Moderate' },
                              { value: 'D', label: 'D — Track' },
                            ]}
                          />

                          {/* Enrich from Semantic Scholar */}
                          <button
                            onClick={handleEnrich}
                            disabled={enriching || !researcher.fullName.trim()}
                            className="w-full h-8 text-xs border border-gray-200 rounded text-gray-600 hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40"
                          >
                            {enriching ? 'Searching…' : 'Enrich from Semantic Scholar'}
                          </button>

                          {showEnrichMatches && enrichMatches.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">Select a match</div>
                              {enrichMatches.map((m, i) => (
                                <button
                                  key={i}
                                  onClick={() => applyEnrichMatch(m)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition"
                                >
                                  <div className="text-xs font-medium text-gray-900">{m.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{m.affiliation || '—'}</div>
                                  <div className="text-xs text-gray-400 font-mono mt-0.5">h:{m.hIndex} · {m.citations?.toLocaleString()} citations</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Save */}
                    {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                    <button
                      onClick={handleSaveTech}
                      disabled={saving || !tech.technology.trim() || !tech.institution.trim()}
                      className="w-full h-9 text-sm font-medium text-white rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#F0602C' }}
                    >
                      {saving ? 'Saving…' : 'Save to Scout'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MANUAL TECH OFFER ─────────────────────────────────────────────── */}
        {mode === 'manual-tech' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Tech Offer Details</div>
              <div className="space-y-3">
                <FormField label="Technology / Title *" value={tech.technology} onChange={v => setTech(t => ({ ...t, technology: v }))} placeholder="Name of the technology" />
                <FormField label="Institution *" value={tech.institution} onChange={v => setTech(t => ({ ...t, institution: v }))} placeholder="University or research institute" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Sector" value={tech.sector} onChange={v => setTech(t => ({ ...t, sector: v }))} placeholder="e.g. Advanced Manufacturing" />
                  <FormField label="TRL" value={tech.trl} onChange={v => setTech(t => ({ ...t, trl: v }))} placeholder="1–9" mono />
                </div>
                <FormField label="Description" value={tech.description} onChange={v => setTech(t => ({ ...t, description: v }))} multiline placeholder="Technical description" />
                <FormField label="Use Case" value={tech.useCase} onChange={v => setTech(t => ({ ...t, useCase: v }))} multiline placeholder="Key applications" />
                <FormField label="vs. Existing Solutions" value={tech.vsExisting} onChange={v => setTech(t => ({ ...t, vsExisting: v }))} multiline placeholder="Advantages" />
                <FormField label="Commercialization Path" value={tech.commercializationPath} onChange={v => setTech(t => ({ ...t, commercializationPath: v }))} multiline />
                <FormField label="Venture Potential" value={tech.venturePotential} onChange={v => setTech(t => ({ ...t, venturePotential: v }))} multiline />
                <FormField label="ATUM Pursue?" value={tech.atumPursue} onChange={v => setTech(t => ({ ...t, atumPursue: v }))} multiline />
                <FormField label="Likely PI" value={tech.likelyPi} onChange={v => setTech(t => ({ ...t, likelyPi: v }))} placeholder="Lead researcher name(s)" />
                <FormField label="Notes" value={tech.notes} onChange={v => setTech(t => ({ ...t, notes: v }))} multiline />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tip</div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Only Technology and Institution are required. Fill in as much as you know — you can edit the record any time.
                </p>
              </div>
              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
              <button
                onClick={handleSaveTech}
                disabled={saving || !tech.technology.trim() || !tech.institution.trim()}
                className="w-full h-9 text-sm font-medium text-white rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F0602C' }}
              >
                {saving ? 'Saving…' : 'Save Tech Offer'}
              </button>
            </div>
          </div>
        )}

        {/* ── MANUAL RESEARCHER ─────────────────────────────────────────────── */}
        {mode === 'manual-researcher' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Researcher Details</div>
              <div className="space-y-3">
                <FormField label="Full Name *" value={researcher.fullName} onChange={v => setResearcher(r => ({ ...r, fullName: v }))} placeholder="Prof. Jane Smith" />
                <FormField label="Affiliation *" value={researcher.affiliation} onChange={v => setResearcher(r => ({ ...r, affiliation: v }))} placeholder="National University of Singapore" />
                <FormField label="Email" value={researcher.email} onChange={v => setResearcher(r => ({ ...r, email: v }))} placeholder="jane@nus.edu.sg" />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="h-index" value={researcher.hIndex} onChange={v => setResearcher(r => ({ ...r, hIndex: v }))} mono />
                  <FormField label="Citations" value={researcher.citations} onChange={v => setResearcher(r => ({ ...r, citations: v }))} mono />
                </div>
                <FormField label="Domain Tags" value={researcher.domainTags} onChange={v => setResearcher(r => ({ ...r, domainTags: v }))} placeholder="e.g. MEMS, Flexible Electronics" />
                <FormField label="Subfield" value={researcher.subfield} onChange={v => setResearcher(r => ({ ...r, subfield: v }))} />
                <SelectField
                  label="Tier"
                  value={researcher.tier}
                  onChange={v => setResearcher(r => ({ ...r, tier: v }))}
                  options={[
                    { value: 'A', label: 'A — Priority' },
                    { value: 'B', label: 'B — Strong' },
                    { value: 'C', label: 'C — Moderate' },
                    { value: 'D', label: 'D — Track only' },
                  ]}
                />
                <FormField label="Research Notes" value={researcher.noteOnResearch} onChange={v => setResearcher(r => ({ ...r, noteOnResearch: v }))} multiline placeholder="Key research themes, context, why you're tracking them" />
              </div>
            </div>

            <div className="space-y-4">
              {/* Enrich */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Enrich from Semantic Scholar</div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">Fill in the name above, then click Enrich to auto-fill h-index, citations, and affiliation.</p>
                <button
                  onClick={handleEnrich}
                  disabled={enriching || !researcher.fullName.trim()}
                  className="w-full h-8 text-xs border border-gray-200 rounded text-gray-600 hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40"
                >
                  {enriching ? 'Searching…' : 'Enrich'}
                </button>

                {showEnrichMatches && enrichMatches.length > 0 && (
                  <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">Select a match</div>
                    {enrichMatches.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => applyEnrichMatch(m)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition"
                      >
                        <div className="text-xs font-medium text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{m.affiliation || '—'}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">h:{m.hIndex} · {m.citations?.toLocaleString()} citations</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
              <button
                onClick={handleSaveResearcherOnly}
                disabled={saving || !researcher.fullName.trim() || !researcher.affiliation.trim()}
                className="w-full h-9 text-sm font-medium text-white rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F0602C' }}
              >
                {saving ? 'Saving…' : 'Save Researcher'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
