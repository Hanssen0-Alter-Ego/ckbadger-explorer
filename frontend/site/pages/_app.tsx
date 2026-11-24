import type { AppProps } from 'next/app';
import '@/app/globals.css';

export default function ExplorerApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
