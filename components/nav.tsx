'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14">
          <Link href="/" className="text-lg font-bold tracking-tight flex-shrink-0 mr-6 sm:mr-10" style={{ color: '#F0602C' }}>
            ATUM Scout
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
              Overview
            </Link>
            <Link href="/researchers" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
              Researchers
            </Link>
            <Link href="/tech-offers" className="text-sm text-gray-600 hover:text-gray-900 transition font-medium">
              Tech Offers
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/ingest"
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white rounded transition"
              style={{ backgroundColor: '#F0602C' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="sm:hidden flex flex-col justify-center gap-1.5 w-9 h-9 rounded hover:bg-gray-100 transition"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <span className={`block mx-auto w-5 h-0.5 bg-gray-600 transition-all origin-center ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block mx-auto w-5 h-0.5 bg-gray-600 transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block mx-auto w-5 h-0.5 bg-gray-600 transition-all origin-center ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-2">
          <Link href="/" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded transition font-medium">
            Overview
          </Link>
          <Link href="/researchers" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded transition font-medium">
            Researchers
          </Link>
          <Link href="/tech-offers" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded transition font-medium">
            Tech Offers
          </Link>
        </div>
      )}
    </nav>
  );
}
