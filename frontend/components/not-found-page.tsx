'use client';

import { useSyncExternalStore } from 'react';
import Link from '@/components/ui/link';
import { Header } from '@/components/layout/header';
import { NotFoundCellOcean } from '@/components/not-found-cell-ocean';
import { resolveBuildVersion } from '@/lib/runtime-config';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia?.(MOTION_QUERY);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

interface NotFoundPageProps {
  errMessage?: string;
}

export function NotFoundPage({ errMessage }: NotFoundPageProps = {}) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia?.(MOTION_QUERY)?.matches ?? true,
    () => true
  );

  return (
    <div className="bg-base-bg relative flex min-h-[100dvh] flex-col">
      {!prefersReducedMotion && (
        <div aria-hidden="true">
          <NotFoundCellOcean />
        </div>
      )}
      <Header />

      <main className="relative z-20 mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-12">
        <div className="border-base-border bg-base-surface/95 w-full rounded-xl border p-6 shadow-xl sm:p-10">
          {!errMessage && (
            <p
              aria-hidden="true"
              className="text-jade mb-3 font-mono text-3xl font-bold sm:text-5xl"
            >
              404
            </p>
          )}
          <h1 className="text-text-bright text-2xl font-semibold sm:text-3xl">
            {errMessage ? 'Unable to open this page' : 'Page not found'}
          </h1>
          <p className="text-text-dim mt-3 max-w-prose">
            {errMessage
              ? 'Something went wrong while loading this page.'
              : 'This explorer URL does not match any page. You can return to the dashboard or use search to find a block, transaction, address, or cell.'}
          </p>
          {errMessage && (
            <p className="text-text-dim mt-3 break-words font-mono text-xs">{errMessage}</p>
          )}
          <Link
            href="/"
            className="border-interactive text-interactive hover:bg-base-elevated mt-6 inline-flex min-h-11 items-center rounded-md border px-4 py-2 font-mono text-sm"
          >
            Back to Explorer home
          </Link>
        </div>
      </main>
      <div className="text-text-dim relative z-20 mx-auto flex flex-wrap items-center justify-center gap-4 px-4 py-4 font-mono text-xs">
        <a
          href="https://github.com/janx/ckbadger"
          target="_blank"
          rel="noreferrer"
          className="hover:text-interactive"
        >
          {resolveBuildVersion()}
        </a>
        <Link href="/hardforks" className="hover:text-interactive">
          Hardforks
        </Link>
        <a
          href="https://dashboard.fiber.channel/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-interactive"
        >
          Fiber Dashboard
        </a>
      </div>
    </div>
  );
}
