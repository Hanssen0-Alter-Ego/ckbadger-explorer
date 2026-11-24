import { Head, Html, Main, NextScript } from 'next/document';

const base = process.env.NEXT_PUBLIC_PAGES_BASE || '';

export default function ExplorerDocument() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta name="theme-color" content="#090d10" />
        <link rel="icon" href={`${base}/favicon.ico`} />
        <script src={`${base}/runtime-config.js`} />
      </Head>
      <body>
        <Main />
        <noscript>This explorer needs JavaScript to load live CKB data.</noscript>
        <NextScript />
      </body>
    </Html>
  );
}
