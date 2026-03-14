'use client';

import { SWRConfig } from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 5 * 60 * 1000, // 5 minutes — won't re-fetch if data is fresh
        revalidateOnFocus: false,          // don't re-fetch when tab regains focus
        revalidateOnReconnect: false,      // don't re-fetch on network reconnect
      }}
    >
      {children}
    </SWRConfig>
  );
}
