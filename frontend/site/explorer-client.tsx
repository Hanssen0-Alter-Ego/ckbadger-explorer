import { useEffect } from 'react';
import { AppRoot } from '@/src/app/root';
import { pagesFormatDestination } from '@/lib/pages-format';

export default function ExplorerClient() {
  const destination = pagesFormatDestination(new URL(window.location.href));
  useEffect(() => {
    if (destination) window.location.replace(destination);
  }, [destination]);
  return destination ? <p role="status">Opening the configured CKBadger server…</p> : <AppRoot />;
}
