'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { HomeContent } from '@/components/home-content';
import { DeepForkAlert } from '@/components/deep-fork-alert';
import { api } from '@/lib/api';

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: () => api.getNetworkStats(),
    staleTime: 0,
    refetchInterval: 10000,
  });

  const initialData = {
    stats: stats ?? null,
    blocks: [],
    transactions: [],
    blockTimeChart: null,
    hashRateChart: null,
  };

  return (
    <div className="bg-base-bg min-h-screen">
      <a
        href="#main-content"
        onClick={(event) => {
          const main = document.getElementById('main-content');
          if (!main) return;
          event.preventDefault();
          main.focus({ preventScroll: true });
          main.scrollIntoView?.({ block: 'start' });
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[110] focus:rounded focus:bg-base-elevated focus:px-3 focus:py-2 focus:text-interactive"
      >
        Skip to main content
      </a>
      <Header />
      {stats && stats.deepForkStatus && <DeepForkAlert status={stats.deepForkStatus} />}
      <HomeContent initialData={initialData} />
    </div>
  );
}
