'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export default function ResearcherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [linkedTech, setLinkedTech] = useState<TechOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Contact tracking form state
  const [contactDate, setContactDate] = useState('');
  const [contactedBy, setContactedBy] = useState('');

  // AI outreach state
  const [knowPersonally, setKnowPersonally] = useState(false);
  const [tone, setTone] = useState<'formal' | 'casual'>('formal');
  const [generating, setGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    fetchResearcher();
    fetchLinkedTech();
  }, [params.id]);

  const fetchResearcher = async () => {
    try {
      const response = await fetch(`/api/researchers/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setResearcher(data.data);
        setContactDate(data.data.contactDate || '');
        setContactedBy(data.data.contactedBy || '');
      }
    } catch (error) {
      console.error('Error fetching researcher:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedTech = async () => {
    try {
      // Fetch all tech offers and filter by fuzzy match on client side for now
      const response = await fetch('/api/tech-offers');
      const data = await response.json();
      if (data.success && researcher) {
        // Simple fuzzy matching - check if researcher name is in likelyPi
        const matches = data.data.filter((tech: TechOffer) => {
          if (!tech.likelyPi) return false;
          const normalizedPi = tech.likelyPi.toLowerCase();
          const normalizedName = researcher.fullName.toLowerCase();
          return normalizedPi.includes(normalizedName) || normalizedName.includes(normalizedPi);
        });
        setLinkedTech(matches);
      }
    } catch (error) {
      console.error('Error fetching linked tech:', error);
    }
  };

  const handleContactUpdate = async (contacted: boolean) => {
    if (!researcher) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/researchers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacted,
          contactDate: contacted ? contactDate : null,
          contactedBy: contacted ? contactedBy : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResearcher(data.data);
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    } finally {
      setSaving(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'D': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const generateOutreachEmail = async () => {
    if (!researcher) return;

    setGenerating(true);
    try {
      const response = await fetch(`/api/researchers/${params.id}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowPersonally, tone }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedEmail(data.data);
      } else {
        alert('Failed to generate email: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating outreach email:', error);
      alert('Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!researcher) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-gray-500">Researcher not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/researchers" className="text-sm text-gray-600 hover:text-primary mb-2 inline-block">
          ← Back to Researchers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {researcher.fullName}
            </h1>
            <p className="text-lg text-gray-600">{researcher.affiliation}</p>
          </div>
          <Badge variant="outline" className={`${getTierColor(researcher.tier)} text-lg px-4 py-2`}>
            Tier {researcher.tier}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📋 Overview</TabsTrigger>
          <TabsTrigger value="tech">🔗 Linked Tech ({linkedTech.length})</TabsTrigger>
          <TabsTrigger value="contact">📝 Contact & Outreach</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Contact Info */}
          {researcher.email && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  <span className="font-semibold">Email:</span>{' '}
                  <a href={`mailto:${researcher.email}`} className="text-primary hover:underline">
                    {researcher.email}
                  </a>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">h-index</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{researcher.hIndex}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Citations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatNumber(researcher.citations)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">C-Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{researcher.cScore.toFixed(3)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600">Global Rank</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{researcher.globalRank || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Research Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Research Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Domain</p>
                <p className="text-gray-900">{researcher.domainTags || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Subfield</p>
                <p className="text-gray-900">{researcher.subfield || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Category</p>
                <p className="text-gray-900">{researcher.category}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Origin</p>
                <p className="text-gray-900">{researcher.origin}</p>
              </div>
              {researcher.noteOnResearch && (
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Research Notes</p>
                  <p className="text-gray-900">{researcher.noteOnResearch}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Linked Tech */}
        <TabsContent value="tech">
          <Card>
            <CardHeader>
              <CardTitle>Linked Technology Offers</CardTitle>
            </CardHeader>
            <CardContent>
              {linkedTech.length === 0 ? (
                <p className="text-gray-500 py-4">No linked technology offers found.</p>
              ) : (
                <div className="space-y-4">
                  {linkedTech.map((tech) => (
                    <div key={tech.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{tech.technology}</h3>
                        {tech.venturePotential && (
                          <Badge>{tech.venturePotential}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {tech.institution} {tech.trl && `• TRL ${tech.trl}`}
                      </p>
                      {tech.description && (
                        <p className="text-gray-700 text-sm">{tech.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Contact & Outreach */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {researcher.contacted ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold mb-2">✅ Contacted</p>
                    <div className="text-sm text-green-700">
                      <p><span className="font-medium">Date:</span> {researcher.contactDate || 'Not specified'}</p>
                      <p><span className="font-medium">By:</span> {researcher.contactedBy || 'Not specified'}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleContactUpdate(false)}
                    disabled={saving}
                  >
                    ↩️ Mark as Not Contacted
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Contact Date
                      </label>
                      <Input
                        type="date"
                        value={contactDate}
                        onChange={(e) => setContactDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Contacted By
                      </label>
                      <Input
                        type="text"
                        value={contactedBy}
                        onChange={(e) => setContactedBy(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleContactUpdate(true)}
                    disabled={saving || !contactDate || !contactedBy}
                    style={{ backgroundColor: '#F0602C' }}
                    className="text-white hover:opacity-90"
                  >
                    {saving ? 'Saving...' : 'Mark as Contacted'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Outreach Email Generation */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>AI Outreach Email Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="knowPersonally"
                    checked={knowPersonally}
                    onChange={(e) => setKnowPersonally(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="knowPersonally" className="text-sm text-gray-700">
                    I know this researcher personally
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tone</label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="formal"
                        name="tone"
                        value="formal"
                        checked={tone === 'formal'}
                        onChange={() => setTone('formal')}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="formal" className="text-sm text-gray-700">
                        Formal
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="casual"
                        name="tone"
                        value="casual"
                        checked={tone === 'casual'}
                        onChange={() => setTone('casual')}
                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="casual" className="text-sm text-gray-700">
                        Casual
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={generateOutreachEmail}
                disabled={generating}
                style={{ backgroundColor: '#F0602C' }}
                className="text-white hover:opacity-90"
              >
                {generating ? 'Generating...' : '✨ Generate Email'}
              </Button>

              {/* Generated Email */}
              {generatedEmail && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Subject</label>
                      <button
                        onClick={() => copyToClipboard(generatedEmail.subject)}
                        className="text-xs text-primary hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-900 font-medium">{generatedEmail.subject}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Body</label>
                      <button
                        onClick={() => copyToClipboard(generatedEmail.body)}
                        className="text-xs text-primary hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {generatedEmail.body}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
