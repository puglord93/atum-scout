'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type TechOffer = {
  id: number;
  techId: string;
  technology: string;
  institution: string;
  trl: string | null;
  sector: string | null;
  venturePotential: string | null;
  description: string | null;
  useCase: string | null;
  vsExisting: string | null;
  commercializationPath: string | null;
  atumPursue: string | null;
  likelyPi: string | null;
  qualityTier: string | null;
  notes: string | null;
};

type Researcher = {
  id: number;
  fullName: string;
  email: string | null;
  affiliation: string;
  tier: string;
  hIndex: number;
  citations: number;
  contacted: boolean;
};

const TIER_COLORS: Record<string, string> = {
  A: 'bg-[#F0602C] text-white',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-gray-100 text-gray-600',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0 flex gap-4">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-900 flex-1 ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export default function TechOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const [techOffer, setTechOffer] = useState<TechOffer | null>(null);
  const [linkedResearcher, setLinkedResearcher] = useState<Researcher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) fetchTechOffer();
  }, [params?.id]);

  useEffect(() => {
    if (techOffer?.likelyPi) fetchLinkedResearcher();
  }, [techOffer]);

  const fetchTechOffer = async () => {
    try {
      const res = await fetch(`/api/tech-offers/${params?.id}`);
      const data = await res.json();
      if (data.success) setTechOffer(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedResearcher = async () => {
    if (!techOffer?.likelyPi) return;
    try {
      const res = await fetch('/api/researchers');
      const data = await res.json();
      if (data.success) {
        const match = data.data.find((r: Researcher) => {
          const pi = techOffer.likelyPi!.toLowerCase();
          const name = r.fullName.toLowerCase();
          return pi.includes(name) || name.includes(pi);
        });
        setLinkedResearcher(match || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!techOffer) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <span className="text-sm text-gray-400">Tech offer not found</span>
      </div>
    );
  }

  const vpHigh = techOffer.venturePotential?.toLowerCase().includes('high');
  const vpMed = techOffer.venturePotential?.toLowerCase().includes('medium') || techOffer.venturePotential?.toLowerCase().includes('mod');
  const pursueYes = techOffer.atumPursue?.toLowerCase().startsWith('yes') || techOffer.atumPursue?.toLowerCase().startsWith('high');
  const pursueMaybe = techOffer.atumPursue?.toLowerCase().startsWith('maybe') || techOffer.atumPursue?.toLowerCase().startsWith('mod');

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Back */}
        <Link href="/tech-offers" className="text-xs text-gray-500 hover:text-gray-900 transition mb-6 inline-block">
          ← Tech Offers
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">{techOffer.technology}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{techOffer.institution}</span>
            {techOffer.sector && <><span>·</span><span>{techOffer.sector}</span></>}
          </div>
          <div className="flex gap-2 mt-3">
            {techOffer.trl && (
              <span className="inline-flex items-center h-6 px-2.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded">
                TRL {techOffer.trl}
              </span>
            )}
            {techOffer.venturePotential && (
              <span className={`inline-flex items-center h-6 px-2.5 text-xs font-medium rounded border ${
                vpHigh ? 'bg-green-50 text-green-700 border-green-200' :
                vpMed  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                         'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {techOffer.venturePotential.split(/[\s.]/)[0]}
              </span>
            )}
            {techOffer.qualityTier && (
              <span className="inline-flex items-center h-6 px-2.5 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded">
                {techOffer.qualityTier}
              </span>
            )}
          </div>
        </div>

        {/* 2-col layout */}
        <div className="grid grid-cols-3 gap-6">

          {/* LEFT — long-form content */}
          <div className="col-span-2 space-y-px">

            {techOffer.description && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <Section title="Description">
                  <p className="text-sm text-gray-700 leading-relaxed">{techOffer.description}</p>
                </Section>
              </div>
            )}

            {techOffer.useCase && (
              <div className="bg-white border border-gray-200 rounded-t-none rounded-b-none border-t-0 p-5" style={{ borderRadius: 0 }}>
                <Section title="Use Case">
                  <p className="text-sm text-gray-700 leading-relaxed">{techOffer.useCase}</p>
                </Section>
              </div>
            )}

            {techOffer.vsExisting && (
              <div className="bg-white border border-gray-200 border-t-0 p-5" style={{ borderRadius: 0 }}>
                <Section title="vs. Existing Solutions">
                  <p className="text-sm text-gray-700 leading-relaxed">{techOffer.vsExisting}</p>
                </Section>
              </div>
            )}

            {techOffer.commercializationPath && (
              <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-5">
                <Section title="Commercialization Path">
                  <p className="text-sm text-gray-700 leading-relaxed">{techOffer.commercializationPath}</p>
                </Section>
              </div>
            )}
          </div>

          {/* RIGHT — metadata + analysis + linked researcher */}
          <div className="space-y-4">

            {/* Tech metadata */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Details</div>
              <Field label="Tech ID" value={techOffer.techId} mono />
              <Field label="Institution" value={techOffer.institution} />
              <Field label="TRL" value={techOffer.trl} mono />
              <Field label="Sector" value={techOffer.sector} />
              <Field label="Likely PI" value={techOffer.likelyPi} />
            </div>

            {/* ATUM Analysis */}
            {(techOffer.atumPursue || techOffer.venturePotential || techOffer.notes) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">ATUM Analysis</div>

                {techOffer.atumPursue && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Should pursue?</div>
                    <div className={`text-xs px-3 py-2 rounded border leading-relaxed ${
                      pursueYes   ? 'bg-green-50 border-green-200 text-green-800' :
                      pursueMaybe ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                    'bg-gray-50 border-gray-200 text-gray-700'
                    }`}>
                      {techOffer.atumPursue}
                    </div>
                  </div>
                )}

                {techOffer.venturePotential && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Venture potential</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{techOffer.venturePotential}</p>
                  </div>
                )}

                {techOffer.notes && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Notes</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{techOffer.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Linked Researcher */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Linked Researcher</div>
              {!techOffer.likelyPi ? (
                <p className="text-xs text-gray-400">No PI on record</p>
              ) : !linkedResearcher ? (
                <div>
                  <p className="text-xs text-gray-700 mb-0.5 font-medium">{techOffer.likelyPi}</p>
                  <p className="text-xs text-gray-400">Not in researcher DB</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/researchers/${linkedResearcher.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#F0602C] transition block"
                      >
                        {linkedResearcher.fullName}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{linkedResearcher.affiliation}</p>
                    </div>
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold flex-shrink-0 ${TIER_COLORS[linkedResearcher.tier] ?? 'bg-gray-100 text-gray-600'}`}>
                      {linkedResearcher.tier}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">h-index</div>
                      <div className="font-mono text-sm text-gray-900">{linkedResearcher.hIndex}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Citations</div>
                      <div className="font-mono text-sm text-gray-900">{new Intl.NumberFormat().format(linkedResearcher.citations)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className={`text-xs mt-0.5 flex items-center gap-1 ${linkedResearcher.contacted ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${linkedResearcher.contacted ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {linkedResearcher.contacted ? 'Contacted' : 'Pending'}
                      </div>
                    </div>
                  </div>
                  <Link href={`/researchers/${linkedResearcher.id}`} className="text-xs text-[#F0602C] hover:underline mt-2 inline-block">
                    View profile →
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
