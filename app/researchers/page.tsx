'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { PIPELINE_STAGES, getStage } from '@/lib/stages';

const PAGE_SIZE = 50;

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

export default function ResearchersPage() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [allResearchers, setAllResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [affiliationFilter, setAffiliationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false); // select across all filtered pages
  const [bulkLoading, setBulkLoading] = useState(false);

  const uniqueAffiliations = Array.from(new Set(allResearchers.map(r => r.affiliation))).sort();
  const uniqueCategories = Array.from(new Set(allResearchers.map(r => r.category))).sort();

  useEffect(() => { fetchResearchers(); }, []);
  useEffect(() => { applyFilters(); }, [search, tierFilter, affiliationFilter, categoryFilter, stageFilter, allResearchers]);
  // Clear selection when filters change
  useEffect(() => { setSelectedIds(new Set()); setSelectAll(false); }, [search, tierFilter, affiliationFilter, categoryFilter, stageFilter, page]);

  const fetchResearchers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/researchers');
      const data = await res.json();
      if (data.success) {
        setAllResearchers(data.data);
        setResearchers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allResearchers];
    if (tierFilter !== 'all')        filtered = filtered.filter(r => r.tier === tierFilter);
    if (affiliationFilter !== 'all') filtered = filtered.filter(r => r.affiliation === affiliationFilter);
    if (categoryFilter !== 'all')    filtered = filtered.filter(r => r.category === categoryFilter);
    if (stageFilter !== 'all')       filtered = filtered.filter(r => r.stage === stageFilter);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.fullName.toLowerCase().includes(s) ||
        r.affiliation.toLowerCase().includes(s) ||
        (r.domainTags && r.domainTags.toLowerCase().includes(s)) ||
        (r.subfield && r.subfield.toLowerCase().includes(s))
      );
    }
    setResearchers(filtered);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch(''); setTierFilter('all'); setAffiliationFilter('all');
    setCategoryFilter('all'); setStageFilter('all'); setPage(1);
  };

  const totalPages = Math.ceil(researchers.length / PAGE_SIZE);
  const pagedResearchers = useMemo(
    () => researchers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [researchers, page]
  );

  // Selection helpers
  const activeIds = selectAll ? researchers.map(r => r.id) : [...selectedIds];
  const pageIds = pagedResearchers.map(r => r.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
  const pageSomeSelected = pageIds.some(id => selectedIds.has(id));
  const totalSelected = selectAll ? researchers.length : selectedIds.size;

  const toggleRow = (id: number) => {
    setSelectAll(false);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelectAll(false);
    if (pageAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleSelectAll = () => { setSelectAll(true); };
  const clearSelection = () => { setSelectedIds(new Set()); setSelectAll(false); };

  const handleBulkStageUpdate = async (stageId: string) => {
    if (totalSelected === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/researchers/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: activeIds, updates: { stage: stageId } }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setAllResearchers(prev => prev.map(r =>
          activeIds.includes(r.id) ? { ...r, stage: stageId } : r
        ));
        clearSelection();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkExport = () => {
    const selected = researchers.filter(r => activeIds.includes(r.id));
    const columns = [
      { key: 'tier',           label: 'Tier' },
      { key: 'stage',          label: 'Stage' },
      { key: 'fullName',       label: 'Name' },
      { key: 'email',          label: 'Email' },
      { key: 'affiliation',    label: 'Affiliation' },
      { key: 'hIndex',         label: 'H-Index' },
      { key: 'citations',      label: 'Citations' },
      { key: 'cScore',         label: 'C-Score' },
      { key: 'globalRank',     label: 'Global Rank' },
      { key: 'domainTags',     label: 'Domain Tags' },
      { key: 'subfield',       label: 'Subfield' },
    ];
    exportToCsv(selected, columns, `atum-selected-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExport = () => {
    const columns = [
      { key: 'tier',           label: 'Tier' },
      { key: 'stage',          label: 'Stage' },
      { key: 'fullName',       label: 'Name' },
      { key: 'email',          label: 'Email' },
      { key: 'affiliation',    label: 'Affiliation' },
      { key: 'hIndex',         label: 'H-Index' },
      { key: 'citations',      label: 'Citations' },
      { key: 'cScore',         label: 'C-Score' },
      { key: 'globalRank',     label: 'Global Rank' },
      { key: 'domainTags',     label: 'Domain Tags' },
      { key: 'subfield',       label: 'Subfield' },
      { key: 'category',       label: 'Category' },
      { key: 'noteOnResearch', label: 'Note on Research' },
      { key: 'contactDate',    label: 'Contact Date' },
      { key: 'contactedBy',    label: 'Contacted By' },
    ];
    exportToCsv(researchers, columns, `atum-researchers-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

  const abbreviateAffiliation = (affiliation: string): string => {
    const map: Record<string, string> = {
      'National University of Singapore': 'NUS',
      'Nanyang Technological University': 'NTU',
      'Singapore University of Technology and Design': 'SUTD',
      'Singapore Management University': 'SMU',
      'Singapore Institute of Technology': 'SIT',
      'A-Star, Institute of Materials Research and Engineering': 'IMRE',
      'A-Star, Institute for Infocomm Research': 'I2R',
      'A-Star, Institute of High Performance Computing': 'IHPC',
      'A-Star, Institute of Bioengineering and Nanotechnology': 'IBN',
      'A-Star, Institute of Microelectronics': 'IME',
      'A-Star, Singapore Institute of Manufacturing Technology': 'SIMTech',
      'Agency for Science Technology and Research (A*STAR), Singapore': 'A*STAR',
      'Temasek Polytechnic': 'TP',
    };
    if (map[affiliation]) return map[affiliation];
    for (const [full, abbr] of Object.entries(map)) {
      if (affiliation.includes(full)) return abbr;
    }
    return affiliation.length > 30 ? affiliation.substring(0, 27) + '...' : affiliation;
  };

  const activeFilters = tierFilter !== 'all' || affiliationFilter !== 'all' || categoryFilter !== 'all' || stageFilter !== 'all' || search;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Researchers</h1>
            <span className="text-sm text-gray-500 font-mono">{allResearchers.length} total</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
            <div className="col-span-2 sm:col-span-2">
              <Input
                type="text"
                placeholder="Search name, affiliation, domain..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 text-sm border-gray-300 focus:border-[#F0602C] focus:ring-[#F0602C]"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="h-9 text-sm border-gray-300">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-9 text-sm border-gray-300">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {PIPELINE_STAGES.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={affiliationFilter} onValueChange={setAffiliationFilter}>
              <SelectTrigger className="h-9 text-sm border-gray-300">
                <SelectValue placeholder="Affiliation" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Affiliations</SelectItem>
                {uniqueAffiliations.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-sm border-gray-300 w-full sm:w-[280px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-gray-600">
                <span className="font-medium text-gray-900">{researchers.length}</span> results
              </span>
              {activeFilters && (
                <button onClick={resetFilters} className="text-sm text-gray-600 hover:text-gray-900 transition">
                  Clear
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={researchers.length === 0}
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

        {/* Bulk Action Bar */}
        {totalSelected > 0 && (
          <div className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 mb-3 flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="text-sm font-medium text-gray-900">
              {totalSelected} selected
            </span>
            <div className="w-px h-4 bg-gray-200" />

            {/* Move to stage */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Move to</span>
              <div className="flex items-center gap-1">
                {PIPELINE_STAGES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleBulkStageUpdate(s.id)}
                    disabled={bulkLoading}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition hover:opacity-80 disabled:opacity-40 ${s.color}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-4 bg-gray-200" />

            {/* Export selected */}
            <button
              onClick={handleBulkExport}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export selected
            </button>

            <div className="ml-auto">
              <button
                onClick={clearSelection}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        {/* Select-all-pages banner */}
        {!selectAll && pageSomeSelected && pageAllSelected && researchers.length > PAGE_SIZE && totalSelected < researchers.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-3 flex items-center gap-3">
            <span className="text-xs text-blue-700">
              {pageIds.length} researchers on this page selected.
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900 transition"
            >
              Select all {researchers.length} researchers
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : researchers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-sm text-gray-500">No researchers match your filters</div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[920px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={pageAllSelected}
                      ref={el => { if (el) el.indeterminate = pageSomeSelected && !pageAllSelected; }}
                      onChange={togglePage}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 cursor-pointer accent-gray-900"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-14">Tier</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-72">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-20">Affil.</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-20">h-index</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-28">Citations</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-40">Domain</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-28">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedResearchers.map(r => {
                  const stage = getStage(r.stage);
                  const isSelected = selectAll || selectedIds.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`group hover:bg-gray-50 transition-colors ${isSelected ? 'bg-gray-50' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(r.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer accent-gray-900"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-semibold ${
                          r.tier === 'A' ? 'bg-[#F0602C] text-white' :
                          r.tier === 'B' ? 'bg-blue-100 text-blue-700' :
                          r.tier === 'C' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.tier}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/researchers/${r.id}`}
                          className="font-medium text-gray-900 hover:text-[#F0602C] transition-colors block truncate"
                          title={r.fullName}
                        >
                          {r.fullName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600" title={r.affiliation}>
                        {abbreviateAffiliation(r.affiliation)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-gray-900">{r.hIndex}</td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-gray-600">{formatNumber(r.citations)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 truncate" title={r.domainTags || ''}>{r.domainTags || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${stage.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                          {stage.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && researchers.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-500 font-mono">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, researchers.length)} of {researchers.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-8 px-3 text-xs border border-gray-200 rounded bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed">
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
                    <button key={p} onClick={() => setPage(p as number)}
                      className={`h-8 w-8 text-xs border rounded transition ${page === p ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>
                      {p}
                    </button>
                  )
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-8 px-3 text-xs border border-gray-200 rounded bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
