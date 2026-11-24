import dynamic from 'next/dynamic';
import Head from 'next/head';

const Explorer = dynamic(() => import('../explorer-client'), {
  ssr: false,
  loading: () => (
    <div role="status" className="mx-auto max-w-6xl px-6 py-10 text-text-dim">
      Loading CKBadger Explorer…
    </div>
  ),
});

export default function ExplorerPage() {
  return (
    <>
      <Head>
        <title>CKBadger Explorer | Nervos CKB</title>
        <meta name="description" content="Explore Nervos CKB blocks, transactions, assets and network activity." />
      </Head>
      <Explorer />
    </>
  );
}
