'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Beta badge */}
      <div className="absolute top-4 right-4">
        <span className="text-xs text-gray-500 border border-gray-800 rounded-full px-3 py-1">
          Beta
        </span>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm px-6">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-widest mb-2">
              <span style={{ color: '#F0602C' }}>ATUM</span>
              <span className="text-white"> SCOUT</span>
            </h1>
            <p className="text-gray-500 text-sm">Researcher Discovery &amp; Intelligence</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-600 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#F0602C' }}
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-700 text-xs mt-6">
            Private beta — access by invitation only
          </p>
        </div>
      </div>
    </div>
  );
}
