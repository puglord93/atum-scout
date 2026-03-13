'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function ResearchersPage() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [allResearchers, setAllResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [affiliationFilter, setAffiliationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const uniqueAffiliations = Array.from(new Set(allResearchers.map(r => r.affiliation))).sort();
  const uniqueCategories = Array.from(new Set(allResearchers.map(r => r.category))).sort();

  useEffect(() => {
    fetchResearchers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, tierFilter, affiliationFilter, categoryFilter, allResearchers]);

  const fetchResearchers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/researchers`);
      const data = await response.json();
      if (data.success) {
        setAllResearchers(data.data);
        setResearchers(data.data);
      }
    } catch (error) {
      console.error('Error fetching researchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allResearchers];
    if (tierFilter !== 'all') filtered = filtered.filter(r => r.tier === tierFilter);
    if (affiliationFilter !== 'all') filtered = filtered.filter(r => r.affiliation === affiliationFilter);
    if (categoryFilter !== 'all') filtered = filtered.filter(r => r.category === categoryFilter);
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
  };

  const resetFilters = () => {
    setSearch('');
    setTierFilter('all');
    setAffiliationFilter('all');
    setCategoryFilter('all');
  };

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num);

  const abbreviateAffiliation = (affiliation: string): string => {
    const abbreviations: { [key: string]: string } = {
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

    // Try exact match first
    if (abbreviations[affiliation]) {
      return abbreviations[affiliation];
    }

    // Try partial matches
    for (const [full, abbr] of Object.entries(abbreviations)) {
      if (affiliation.includes(full)) {
        return abbr;
      }
    }

    // If no match, return original but truncate if too long
    return affiliation.length > 30 ? affiliation.substring(0, 27) + '...' : affiliation;
  };

  const activeFilters = tierFilter !== 'all' || affiliationFilter !== 'all' || categoryFilter !== 'all' || search;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Researchers</h1>
            <span className="text-sm text-gray-500 font-mono">{allResearchers.length} total</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="col-span-2">
              <Input
                type="text"
                placeholder="Search name, affiliation, domain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

          <div className="flex items-center justify-between">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-sm border-gray-300 w-[280px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{researchers.length}</span> results
              </span>
              {activeFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

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
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-16">Tier</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-80">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-24">Affiliation</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-24">h-index</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-32">Citations</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-56">Domain</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {researchers.map((r) => (
                  <tr key={r.id} className="group hover:bg-gray-50 transition-colors">
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
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${
                        r.contacted ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          r.contacted ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        {r.contacted ? 'Contacted' : 'Not contacted'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
