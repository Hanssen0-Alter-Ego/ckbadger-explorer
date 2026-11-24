'use client';

import { useEffect, useRef } from 'react';

const MAIN_CONTENT_ID = 'main-content';

function getMain(link: HTMLAnchorElement | null) {
  const main = link?.parentElement?.querySelector('main') ?? document.querySelector('main');
  if (!main) return null;
  if (!main.id) main.id = MAIN_CONTENT_ID;
  return main;
}

export function SkipToMain() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    getMain(linkRef.current);
  }, []);

  return (
    <a
      ref={linkRef}
      href="#main-content"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const main = getMain(linkRef.current);
        if (!main) return;
        // Do not replace a page's existing search params or detail/tab fragment.
        event.preventDefault();
        if (!main.hasAttribute('tabindex')) main.tabIndex = -1;
        main.focus({ preventScroll: true });
        main.scrollIntoView?.({ block: 'start', behavior: 'instant' });
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[110] focus:rounded focus:bg-base-elevated focus:px-3 focus:py-2 focus:text-interactive"
    >
      Skip to main content
    </a>
  );
}
