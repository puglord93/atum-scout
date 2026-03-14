'use client';

import { useState, useEffect, useMemo } from 'react';

const PAGE_SIZE = 50;
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToCsv } from '@/lib/export';

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

export default function TechOffersPage() {
  const [techOffers, setTechOffers] = useState<TechOffer[]>([]);
  const [allTechOffers, setAllTechOffers] = useState<TechOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [venturePotentialFilter, setVenturePotentialFilter] = useState<string>('all');
  const [trlFilter, setTrlFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const uniqueInstitutions = Array.from(new Set(allTechOffers.map(t => t.institution))).sort();
  const uniqueSectors = Array.from(new Set(allTechOffers.map(t => t.sector).filter(Boolean))).sort() as string[];

  // Extract just the tier (first word) from venture potential and normalize
  const uniqueVenturePotentials = Array.from(
    new Set(
      allTechOffers
        .map(t => {
          if (!t.venturePotential) return null;
          // Get first word only
          const firstWord = t.venturePotential.split(/[\s.\-]/)[0].trim();
          // Normalize: HIGH/High -> High, LOW/Low -> Low, MOD -> Moderate
          if (firstWord.toUpperCase() === 'HIGH') return 'High';
          if (firstWord.toUpperCase() === 'LOW') return 'Low';
          if (firstWord.toUpperCase() === 'MOD' || firstWord.toUpperCase() === 'MODERATE') return 'Moderate';
          if (firstWord.toUpperCase() === 'MEDIUM') return 'Medium';
          return firstWord;
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  const uniqueTRLs = Array.from(
    new Set(
      allTechOffers
        .map(t => {
          if (!t.trl) return null;
          const trlStr = String(t.trl).trim();
          // Match single digit or range like "4-6" or "4~6"
          const match = trlStr.match(/^(?:TRL\s*)?(\d)(?:[-~](\d))?$/i);
          if (match) {
            return match[2] ? `${match[1]}-${match[2]}` : match[1];
          }
          return null;
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  useEffect(() => {
    fetchTechOffers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, institutionFilter, sectorFilter, venturePotentialFilter, trlFilter, allTechOffers]);

  const fetchTechOffers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tech-offers`);
      const data = await response.json();
      if (data.success) {
        setAllTechOffers(data.data);
        setTechOffers(data.data);
      }
    } catch (error) {
      console.error('Error fetching tech offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allTechOffers];
    if (institutionFilter !== 'all') filtered = filtered.filter(t => t.institution === institutionFilter);
    if (sectorFilter !== 'all') filtered = filtered.filter(t => t.sector === sectorFilter);
    if (venturePotentialFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (!t.venturePotential) return false;
        const firstWord = t.venturePotential.split(/[\s.\-]/)[0].trim();
        // Normalize and compare
        if (firstWord.toUpperCase() === 'HIGH') return venturePotentialFilter === 'High';
        if (firstWord.toUpperCase() === 'LOW') return venturePotentialFilter === 'Low';
        if (firstWord.toUpperCase() === 'MOD' || firstWord.toUpperCase() === 'MODERATE') return venturePotentialFilter === 'Moderate';
        if (firstWord.toUpperCase() === 'MEDIUM') return venturePotentialFilter === 'Medium';
        return firstWord === venturePotentialFilter;
      });
    }
    if (trlFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (!t.trl) return false;
        const trlStr = String(t.trl).trim();
        const match = trlStr.match(/^(?:TRL\s*)?(\d)(?:[-~](\d))?$/i);
        if (match) {
          const normalizedTrl = match[2] ? `${match[1]}-${match[2]}` : match[1];
          return normalizedTrl === trlFilter;
        }
        return false;
      });
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.technology.toLowerCase().includes(s) ||
        (t.description && t.description.toLowerCase().includes(s)) ||
        (t.sector && t.sector.toLowerCase().includes(s))
      );
    }
    setTechOffers(filtered);
    setPage(1); // reset to first page on filter change
  };

  const resetFilters = () => {
    setSearch('');
    setInstitutionFilter('all');
    setSectorFilter('all');
    setVenturePotentialFilter('all');
    setTrlFilter('all');
    setPage(1);
  };

  const totalPages = Math.ceil(techOffers.length / PAGE_SIZE);
  const pagedTechOffers = useMemo(
    () => techOffers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [techOffers, page]
  );

  const handleExport = () => {
    const columns = [
      { key: 'techId',                label: 'Tech ID' },
      { key: 'technology',            label: 'Technology' },
      { key: 'institution',           label: 'Institution' },
      { key: 'trl',                   label: 'TRL' },
      { key: 'sector',                label: 'Sector' },
      { key: 'venturePotential',      label: 'Venture Potential' },
      { key: 'description',           label: 'Description' },
      { key: 'useCase',               label: 'Use Case' },
      { key: 'vsExisting',            label: 'VS Existing' },
      { key: 'commercializationPath', label: 'Commercialization Path' },
      { key: 'atumPursue',            label: 'ATUM Pursue' },
      { key: 'likelyPi',              label: 'Likely PI' },
      { key: 'qualityTier',           label: 'Quality Tier' },
      { key: 'notes',                 label: 'Notes' },
    ];
    const today = new Date().toISOString().slice(0, 10);
    exportToCsv(techOffers, columns, `atum-tech-offers-${today}.csv`);
  };

  const activeFilters = institutionFilter !== 'all' || sectorFilter !== 'all' || venturePotentialFilter !== 'all' || trlFilter !== 'all' || search;

  const getVenturePotentialColor = (vp: string | null) => {
    if (!vp) return 'bg-gray-100 text-gray-600';
    if (vp.toLowerCase().includes('high')) return 'bg-green-100 text-green-700';
    if (vp.toLowerCase().includes('medium')) return 'bg-yellow-100 text-yellow-700';
    if (vp.toLowerCase().includes('low')) return 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-600';
  };

  const getAtumPursueColor = (pursue: string | null) => {
    if (!pursue) return 'text-gray-400';
    if (pursue.toLowerCase().includes('yes') || pursue.toLowerCase().includes('high')) return 'text-green-700';
    if (pursue.toLowerCase().includes('maybe') || pursue.toLowerCase().includes('medium')) return 'text-yellow-700';
    if (pursue.toLowerCase().includes('no') || pursue.toLowerCase().includes('low')) return 'text-gray-500';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Tech Offers</h1>
            <span className="text-sm text-gray-500 font-mono">{allTechOffers.length} total</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="col-span-2">
              <Input
                type="text"
                placeholder="Search technology, description, sector..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm border-gray-300 focus:border-[#F0602C] focus:ring-[#F0602C]"
              />
            </div>

            <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
              <SelectTrigger className="h-9 text-sm border-gray-300">
                <SelectValue placeholder="Institution" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Institutions</SelectItem>
                {uniqueInstitutions.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="h-9 text-sm border-gray-300">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Sectors</SelectItem>
                {uniqueSectors.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <Select value={venturePotentialFilter} onValueChange={setVenturePotentialFilter}>
                <SelectTrigger className="h-9 text-sm border-gray-300 w-[200px]">
                  <SelectValue placeholder="Venture Potential" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Venture Potential</SelectItem>
                  {uniqueVenturePotentials.map(vp => (
                    <SelectItem key={vp} value={vp}>{vp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={trlFilter} onValueChange={setTrlFilter}>
                <SelectTrigger className="h-9 text-sm border-gray-300 w-[160px]">
                  <SelectValue placeholder="TRL" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All TRLs</SelectItem>
                  {uniqueTRLs.map(trl => (
                    <SelectItem key={trl} value={trl}>{trl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-gray-600">
                <span className="font-medium text-gray-900">{techOffers.length}</span> results
              </span>
              {activeFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={techOffers.length === 0}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : techOffers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-sm text-gray-500">No tech offers match your filters</div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-28">Institution</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-80">Technology</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-16">TRL</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-40">Sector</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Venture Potential</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">ATUM Pursue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedTechOffers.map((t) => (
                  <tr key={t.id} className="group hover:bg-gray-50 transition-colors align-top">
                    <td className="py-4 px-4 text-sm text-gray-600">{t.institution}</td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/tech-offers/${t.id}`}
                        className="font-medium text-gray-900 hover:text-[#F0602C] transition-colors block line-clamp-2"
                        title={t.technology}
                      >
                        {t.technology}
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-center">{t.trl || '—'}</td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600 line-clamp-2" title={t.sector || ''}>
                        {t.sector || '—'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed" title={t.venturePotential || ''}>
                        {t.venturePotential || '—'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed" title={t.atumPursue || ''}>
                        {t.atumPursue || '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && techOffers.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500 font-mono">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, techOffers.length)} of {techOffers.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 text-xs border border-gray-200 rounded bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`h-8 w-8 text-xs border rounded transition ${
                        page === p
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 text-xs border border-gray-200 rounded bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
