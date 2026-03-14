'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type VentureListItem = {
  id: number;
  title: string;
  status: string;
  researcher: { id: number; fullName: string; affiliation: string } | null;
  techOffer: { id: number; technology: string; techId: string } | null;
  inputCount: number;
  questionCount: number;
  answeredCount: number;
  actionCount: number;
  createdAt: string;
  updatedAt: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-[#F0602C]">
        Active
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400">
        Archived
      </span>
    );
  }
  // draft
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
      Draft
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VenturesPage() {
  const [ventures, setVentures] = useState<VentureListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ventures')
      .then(r => r.json())
      .then(d => {
        if (d.success) setVentures(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ventures</h1>
            <span className="text-sm text-gray-500 font-mono">{ventures.length} cases</span>
          </div>
          <Link
            href="/ventures/new"
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white rounded transition"
            style={{ backgroundColor: '#F0602C' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Venture
          </Link>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : ventures.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4">No venture cases yet. Create your first one.</p>
            <Link
              href="/ventures/new"
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-white rounded transition"
              style={{ backgroundColor: '#F0602C' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Venture
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ventures.map(v => (
              <Link
                key={v.id}
                href={`/ventures/${v.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 group-hover:text-[#F0602C] transition-colors leading-snug">
                    {v.title}
                  </h2>
                  <StatusBadge status={v.status} />
                </div>

                {(v.researcher || v.techOffer) && (
                  <div className="mb-3 space-y-1">
                    {v.researcher && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">{v.researcher.fullName} · {v.researcher.affiliation}</span>
                      </div>
                    )}
                    {v.techOffer && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="truncate">{v.techOffer.technology}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                  <span>{v.inputCount} inputs</span>
                  <span>·</span>
                  <span>{v.questionCount} Q ({v.answeredCount} answered)</span>
                  <span>·</span>
                  <span>{v.actionCount} actions</span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Updated {formatDate(v.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
