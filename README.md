# CKBadger Explorer

A CCC App-inspired static Nervos CKB explorer, retaining the browser routes
and features of [CKBadger v0.8.3](https://github.com/janx/ckbadger/tree/da98312e44cdc3655a6be8b3373caf293631e35a).
This is an independent frontend, not the official CKBadger project.
The upstream frontend and assets remain under the [GNU GPL v3](./LICENSE).

## Local development

This repository uses a Next.js static export with a client-only shell for the
release’s existing explorer screens. Use Node.js 24 and pnpm 9.15.0:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm test
PAGES_BASE=/ckbadger-explorer/ pnpm build
```

## Configure the backend

Edit [frontend/public/runtime-config.js](frontend/public/runtime-config.js)
before deploying, or serve a replacement alongside the deployed `index.html`.
The default network is **mainnet**, using the explorer at
`https://explorer.ckbccc.com/mainnet`. The upstream frontend commit is fixed,
but the public backend's version and uptime are independently managed.
A compatible backend must allow browser requests from your Pages HTTPS origin.
No API keys or credentials belong in this public file.

Each enabled network has its own name, REST API v1 root (`apiBase`), full
WebSocket address (`wsUrl`) and optional upstream network page path
(`pageBase`). A testnet can be added as a second entry once the endpoints and
network identity are verified. Do not reuse mainnet endpoints for testnet.

## Publish

In GitHub Pages settings, select **GitHub Actions** as the publishing source.
The main-branch workflow builds the static export into `frontend/site/out`,
verifies the Pages base and uploads that directory. Production deployment is
scoped to this repository.

## Hosting limits

GitHub Project Pages adds the repository basename; below it the original
`/mainnet` and route suffixes are unchanged. Known static routes serve their
entrypoints; dynamically addressed pages such as `/mainnet/tx/<hash>` use
the Pages 404 document to render the same SPA without rewriting the browser
URL. A direct dynamic request may have HTTP status 404 even though the
JavaScript app renders successfully.

REST data and real-time updates come from the configured CKBadger server.
Pages serves no backend and cannot perform HTTP Accept negotiation.
Browser navigation to `.md` and `.raw` URLs (or explicit `format=md|raw`)
can be redirected to the configured upstream page origin. Machine clients
should use that origin directly for negotiated responses, headers and
`/capabilities`.

The older fork ID and address-activity participant detail require a compatible
v0.8.3 API. Newer servers may expose a different fork locator or only compact
participant data; the frontend does not invent missing details. Core data
availability is determined by the configured server.
