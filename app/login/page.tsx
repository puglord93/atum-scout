'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  { icon: '🔬', label: '256 researchers tracked' },
  { icon: '⚙️', label: '313 tech offers evaluated' },
  { icon: '🤖', label: 'AI-powered scoring & outreach' },
];

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Incorrect password');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar — matches app nav style */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight" style={{ color: '#F0602C' }}>
            ATUM Scout
          </span>
          <span className="text-xs font-medium text-gray-400 border border-gray-200 rounded-full px-3 py-1 uppercase tracking-wider">
            Private Beta
          </span>
        </div>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Deep-tech scouting, built for ATUM</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Track researchers, evaluate tech offers, and manage your scouting pipeline — all in one place.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-col gap-1.5 mb-6">
              {FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 mb-6" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wider">
                  Access password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full h-9 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded px-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-xs mt-1.5">{error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full h-9 rounded text-sm font-medium text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#F0602C' }}
              >
                {loading ? 'Verifying...' : 'Enter'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Access by invitation only ·{' '}
            <a
              href="mailto:jj@atumventures.com?subject=ATUM Scout Access Request"
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              Request an invite
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
