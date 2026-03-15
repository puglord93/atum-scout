'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

type Researcher = { id: number; fullName: string; affiliation: string };
type TechOffer = { id: number; technology: string; techId: string };

export default function NewVenturePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('active');
  const [researcherId, setResearcherId] = useState<string>('none');
  const [techOfferId, setTechOfferId] = useState<string>('none');
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [techOffers, setTechOffers] = useState<TechOffer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/researchers')
      .then(r => r.json())
      .then(d => { if (d.success) setResearchers(d.data); });
    fetch('/api/tech-offers')
      .then(r => r.json())
      .then(d => { if (d.success) setTechOffers(d.data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          status,
          researcherId: researcherId !== 'none' ? parseInt(researcherId) : null,
          techOfferId: techOfferId !== 'none' ? parseInt(techOfferId) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/ventures/${data.data.id}`);
      } else {
        setError(data.error || 'Failed to create venture');
        setSubmitting(false);
      }
    } catch {
      setError('Network error');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <Link href="/ventures" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ventures
          </Link>
        </div>

        <div className="max-w-lg">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-6">New Venture Case</h1>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Micro-MIM Process Commercialization"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-9 text-sm border-gray-300 focus:border-[#F0602C] focus:ring-[#F0602C]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="h-9 text-sm border border-gray-300 rounded px-3 focus:outline-none focus:border-[#F0602C] bg-white"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Link Researcher <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <select
                value={researcherId}
                onChange={e => setResearcherId(e.target.value)}
                className="h-9 text-sm border border-gray-300 rounded px-3 focus:outline-none focus:border-[#F0602C] bg-white"
              >
                <option value="none">None</option>
                {researchers.map(r => (
                  <option key={r.id} value={String(r.id)}>
                    {r.fullName} · {r.affiliation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Link Tech Offer <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <select
                value={techOfferId}
                onChange={e => setTechOfferId(e.target.value)}
                className="h-9 text-sm border border-gray-300 rounded px-3 focus:outline-none focus:border-[#F0602C] bg-white"
              >
                <option value="none">None</option>
                {techOffers.map(t => (
                  <option key={t.id} value={String(t.id)}>
                    [{t.techId}] {t.technology}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/ventures"
                className="h-9 px-4 text-sm font-medium text-gray-600 border border-gray-300 rounded hover:border-gray-400 hover:text-gray-900 transition inline-flex items-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="h-9 px-4 text-sm font-medium text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                style={{ backgroundColor: '#F0602C' }}
              >
                {submitting && (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {submitting ? 'Creating...' : 'Create Venture'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
