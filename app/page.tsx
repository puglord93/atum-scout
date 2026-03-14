'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PIPELINE_STAGES, getStage } from '@/lib/stages';

type Stats = {
  researchers: {
    total: number;
    byTier: Record<string, number>;
    byStage: Record<string, number>;
  };
  techOffers: {
    total: number;
    byVenturePotential: Record<string, number>;
  };
  recentlyActive: {
    id: number;
    fullName: string;
    affiliation: string;
    tier: string;
    stage: string;
    contactDate: string | null;
    contactedBy: string | null;
  }[];
  topResearchers: {
    id: number;
    fullName: string;
    affiliation: string;
    hIndex: number;
    domainTags: string | null;
    stage: string;
  }[];
};

const TIER_COLORS: Record<string, string> = {
  A: 'bg-[#F0602C] text-white',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-gray-100 text-gray-600',
};

const VP_COLORS: Record<string, string> = {
  High: 'bg-green-500',
  Moderate: 'bg-yellow-400',
  Medium: 'bg-yellow-400',
  Low: 'bg-gray-300',
};

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
  return affiliation.length > 20 ? affiliation.substring(0, 18) + '…' : affiliation;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-sm text-gray-400">Failed to load stats.</div>
      </div>
    );
  }

  const { researchers, techOffers, recentlyActive, topResearchers } = stats;
  const activeCount = researchers.total - (researchers.byStage['identified'] ?? 0);
  const contactRate = researchers.total > 0
    ? Math.round((activeCount / researchers.total) * 100)
    : 0;

  const tierOrder = ['A', 'B', 'C', 'D'];
  const vpOrder = ['High', 'Moderate', 'Medium', 'Low'];
  const vpTotal = Object.values(techOffers.byVenturePotential).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">Overview</h1>
          <p className="text-sm text-gray-500">Deep-tech scouting pipeline — Singapore research institutions</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Link href="/researchers" className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition group">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Researchers</div>
            <div className="text-3xl font-semibold text-gray-900 font-mono mb-1">{researchers.total}</div>
            <div className="text-xs text-gray-500">tracked profiles</div>
          </Link>

          <Link href="/researchers?tier=A" className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition group">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Tier A</div>
            <div className="text-3xl font-semibold font-mono mb-1" style={{ color: '#F0602C' }}>
              {researchers.byTier['A'] ?? 0}
            </div>
            <div className="text-xs text-gray-500">top-priority researchers</div>
          </Link>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">In Pipeline</div>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-3xl font-semibold text-gray-900 font-mono">{activeCount}</div>
              <div className="text-sm text-gray-500 font-mono">{contactRate}%</div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${contactRate}%` }}
              />
            </div>
          </div>

          <Link href="/tech-offers" className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition group">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Tech Offers</div>
            <div className="text-3xl font-semibold text-gray-900 font-mono mb-1">{techOffers.total}</div>
            <div className="text-xs text-gray-500">from research institutions</div>
          </Link>
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Scouting Pipeline</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {PIPELINE_STAGES.map((s) => {
              const count = researchers.byStage[s.id] ?? 0;
              const pct = researchers.total > 0 ? Math.round((count / researchers.total) * 100) : 0;
              return (
                <Link
                  key={s.id}
                  href={`/researchers`}
                  className="group flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition"
                >
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </div>
                  <div className="font-mono text-2xl font-semibold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-400 font-mono">{pct}%</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Two-col: Tier breakdown + Venture Potential */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          {/* Tier Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Researcher Tier Breakdown</div>
            <div className="space-y-3">
              {tierOrder.map((tier) => {
                const count = researchers.byTier[tier] ?? 0;
                const pct = researchers.total > 0 ? (count / researchers.total) * 100 : 0;
                return (
                  <div key={tier} className="flex items-center gap-3">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold flex-shrink-0 ${TIER_COLORS[tier]}`}>
                      {tier}
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          tier === 'A' ? 'bg-[#F0602C]' :
                          tier === 'B' ? 'bg-blue-400' :
                          tier === 'C' ? 'bg-yellow-400' :
                          'bg-gray-300'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="font-mono text-sm text-gray-900 w-8 text-right">{count}</div>
                    <div className="font-mono text-xs text-gray-400 w-10 text-right">{Math.round(pct)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Venture Potential */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Tech Offers — Venture Potential</div>
            <div className="space-y-3">
              {vpOrder.map((vp) => {
                const count = techOffers.byVenturePotential[vp] ?? 0;
                const pct = vpTotal > 0 ? (count / vpTotal) * 100 : 0;
                return (
                  <div key={vp} className="flex items-center gap-3">
                    <div className="text-xs text-gray-600 w-16 flex-shrink-0">{vp}</div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${VP_COLORS[vp] ?? 'bg-gray-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="font-mono text-sm text-gray-900 w-8 text-right">{count}</div>
                    <div className="font-mono text-xs text-gray-400 w-10 text-right">{Math.round(pct)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two-col: Recently Contacted + Top Tier A */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Recently Active */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recently Active</span>
              <Link href="/researchers" className="text-xs text-gray-400 hover:text-[#F0602C] transition">View all →</Link>
            </div>
            {recentlyActive.length === 0 ? (
              <div className="px-5 py-8 text-sm text-gray-400 text-center">No activity yet</div>
            ) : (
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {recentlyActive.map((r) => {
                    const s = getStage(r.stage);
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/researchers/${r.id}`} className="font-medium text-sm text-gray-900 hover:text-[#F0602C] transition-colors block truncate">
                            {r.fullName}
                          </Link>
                          <div className="text-xs text-gray-400 mt-0.5">{abbreviateAffiliation(r.affiliation)}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          {r.contactDate && (
                            <div className="text-xs text-gray-400 mt-1 font-mono">
                              {new Date(r.contactDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Top Tier A Researchers */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Tier A Researchers</span>
              <Link href="/researchers" className="text-xs text-gray-400 hover:text-[#F0602C] transition">View all →</Link>
            </div>
            <table className="w-full">
              <tbody className="divide-y divide-gray-50">
                {topResearchers.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/researchers/${r.id}`} className="font-medium text-sm text-gray-900 hover:text-[#F0602C] transition-colors block truncate">
                        {r.fullName}
                      </Link>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{r.domainTags || abbreviateAffiliation(r.affiliation)}</div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right">
                      <div className="font-mono text-sm text-gray-900">{r.hIndex}</div>
                      <div className="text-xs text-gray-400 mt-0.5">h-index</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      {(() => {
                        const s = getStage(r.stage);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
