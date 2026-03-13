'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
};

export default function TechOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const [techOffer, setTechOffer] = useState<TechOffer | null>(null);
  const [linkedResearcher, setLinkedResearcher] = useState<Researcher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchTechOffer();
    }
  }, [params?.id]);

  useEffect(() => {
    if (techOffer?.likelyPi) {
      fetchLinkedResearcher();
    }
  }, [techOffer]);

  const fetchTechOffer = async () => {
    try {
      const response = await fetch(`/api/tech-offers/${params?.id}`);
      const data = await response.json();
      if (data.success) {
        setTechOffer(data.data);
      }
    } catch (error) {
      console.error('Error fetching tech offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedResearcher = async () => {
    if (!techOffer?.likelyPi) return;

    try {
      const response = await fetch('/api/researchers');
      const data = await response.json();
      if (data.success) {
        const match = data.data.find((researcher: Researcher) => {
          const normalizedPi = techOffer.likelyPi!.toLowerCase();
          const normalizedName = researcher.fullName.toLowerCase();
          return normalizedPi.includes(normalizedName) || normalizedName.includes(normalizedPi);
        });
        setLinkedResearcher(match || null);
      }
    } catch (error) {
      console.error('Error fetching linked researcher:', error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!techOffer) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-500">Tech offer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          href="/tech-offers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          ← Back to Tech Offers
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
            {techOffer.technology}
          </h1>
          <p className="text-base text-gray-600 mb-4">{techOffer.institution}</p>

          {/* Badges */}
          <div className="flex gap-2">
            {techOffer.trl && (
              <div className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 border border-blue-200">
                <span className="text-xs font-medium text-blue-700">TRL {techOffer.trl}</span>
              </div>
            )}
            {techOffer.venturePotential && (
              <div className={`inline-flex items-center px-3 py-1 rounded-md ${
                techOffer.venturePotential.toLowerCase().includes('high')
                  ? 'bg-green-50 border border-green-200'
                  : techOffer.venturePotential.toLowerCase().includes('medium')
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <span className={`text-xs font-medium ${
                  techOffer.venturePotential.toLowerCase().includes('high')
                    ? 'text-green-700'
                    : techOffer.venturePotential.toLowerCase().includes('medium')
                    ? 'text-yellow-700'
                    : 'text-gray-700'
                }`}>
                  {techOffer.venturePotential.split('.')[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-50">Overview</TabsTrigger>
            <TabsTrigger value="researcher" className="data-[state=active]:bg-gray-50">Linked Researcher</TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-gray-50">Analysis</TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-4">
            {/* Basic Info Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Technology Details</h2>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tech ID</p>
                  <p className="text-sm text-gray-900 font-mono">{techOffer.techId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Sector</p>
                  <p className="text-sm text-gray-900">{techOffer.sector || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">TRL</p>
                  <p className="text-sm text-gray-900">{techOffer.trl || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Likely PI</p>
                  <p className="text-sm text-gray-900">{techOffer.likelyPi || '—'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {techOffer.description && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{techOffer.description}</p>
              </div>
            )}

            {/* Use Case */}
            {techOffer.useCase && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Use Case</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{techOffer.useCase}</p>
              </div>
            )}

            {/* vs Existing */}
            {techOffer.vsExisting && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">vs. Existing Solutions</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{techOffer.vsExisting}</p>
              </div>
            )}

            {/* Commercialization Path */}
            {techOffer.commercializationPath && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Commercialization Path</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{techOffer.commercializationPath}</p>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Linked Researcher */}
          <TabsContent value="researcher">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Linked Researcher</h2>
              {!techOffer.likelyPi ? (
                <p className="text-sm text-gray-500">No PI information available for this technology.</p>
              ) : !linkedResearcher ? (
                <div className="text-sm text-gray-600">
                  <p className="mb-1">Likely PI: <span className="font-medium text-gray-900">{techOffer.likelyPi}</span></p>
                  <p className="text-gray-500">No match found in researcher database</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link
                        href={`/researchers/${linkedResearcher.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-[#F0602C] transition"
                      >
                        {linkedResearcher.fullName}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">{linkedResearcher.affiliation}</p>
                    </div>
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-semibold ${
                      linkedResearcher.tier === 'A' ? 'bg-[#F0602C] text-white' :
                      linkedResearcher.tier === 'B' ? 'bg-blue-100 text-blue-700' :
                      linkedResearcher.tier === 'C' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {linkedResearcher.tier}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">h-index</p>
                      <p className="text-lg font-semibold text-gray-900">{linkedResearcher.hIndex}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Citations</p>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(linkedResearcher.citations)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contact</p>
                      {linkedResearcher.email ? (
                        <a href={`mailto:${linkedResearcher.email}`} className="text-xs text-[#F0602C] hover:underline">
                          View email
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/researchers/${linkedResearcher.id}`}
                    className="inline-block mt-4 text-xs text-[#F0602C] hover:underline"
                  >
                    View full profile →
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Analysis */}
          <TabsContent value="analysis">
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-4">ATUM Analysis</h2>

                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Venture Potential</p>
                    <p className="text-sm text-gray-900">{techOffer.venturePotential?.split('.')[0] || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Quality Tier</p>
                    <p className="text-sm text-gray-900">{techOffer.qualityTier || '—'}</p>
                  </div>
                </div>

                {techOffer.venturePotential && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-gray-500 mb-2">Assessment</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{techOffer.venturePotential}</p>
                    </div>
                  </div>
                )}

                {techOffer.atumPursue && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-gray-500 mb-2">Should ATUM Pursue?</p>
                    <div className={`border rounded-lg p-4 ${
                      techOffer.atumPursue.toLowerCase().startsWith('yes') || techOffer.atumPursue.toLowerCase().startsWith('high')
                        ? 'bg-green-50 border-green-200'
                        : techOffer.atumPursue.toLowerCase().startsWith('maybe') || techOffer.atumPursue.toLowerCase().startsWith('moderate')
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className="text-sm text-gray-900 leading-relaxed">{techOffer.atumPursue}</p>
                    </div>
                  </div>
                )}

                {techOffer.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Internal Notes</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{techOffer.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
