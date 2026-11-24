# Mini chart, identity hover and header search candidate

Production remains at `068e5c9b25f423b0f88d5b27531f2723d8470e46`; this is a preview awaiting parent review, not a Pages release. All images are our browser captures, not user-provided images.

## Rendered evidence

- Matched data/viewport mini chart comparisons: [390px](chart-390.jpg), [desktop](chart-1440.jpg). Both before and after received the same deterministic public-shape chart fixture. Opacity is uniform within each series; only height encodes value. Cyan and pale cyan retain distinct, legible default marks with a fine top edge.
- Candidate full pages: [mobile](after-390-full.jpg), [desktop](after-1440-full.jpg). Other panels use mutable public data, so not pixel-identical snapshots.
- Ordinary hash hover: [mobile](after-390-hash.jpg), [desktop](after-1440-hash.jpg). No per-character spans/handlers; whole-link color remains, exact-copy and truncation tests pass. Byte-group display and the witness inspector are separate and preserved.
- Header search: [mobile idle](search-390-idle.jpg), [mobile open](search-390-open.jpg), [desktop idle](search-1440-idle.jpg), [desktop open](search-1440-open.jpg). Idle computed input background is transparent; focused/open is cyan at 4%, with a cyan underline. ArrowDown/Enter navigation to block detail passed at both widths. Dropdown remains opaque.

## Verified time semantics

Pinned v0.8.3 [statistics handler](https://github.com/janx/ckbadger/blob/da98312e44cdc3655a6be8b3373caf293631e35a/crates/api/src/routes/statistics.rs#L214-L322) returns hourly buckets oldest-to-newest (up to 24) and daily buckets oldest-to-newest (up to 14). Clock labels alone cross midnight, so 22:00 → 21:00 is not reversed data. `currentHour` is the newest hourly bucket; `currentDay` is the current UTC+8 calendar day. Changed headline labels to “TXs this hour” / “TXs today” and added separate UTC/UTC+8 history captions and oldest → newest direction. Data and ordering are unchanged. Opacity does not imply age, size or completeness.

## Reference comparison

Janx main was re-resolved to `ded8f6aa9b74256c49f91866f36581eeda5ca109` during this work. This comparison is source-only, not a rendered-main verification:

1. [Main chart figure/network section](https://github.com/janx/ckbadger/blob/ded8f6aa9b74256c49f91866f36581eeda5ca109/frontend/components/home/network-section.tsx) separates the headline's bucket period from the chart range. Borrowed that clarity without importing its new backend `complete` flags, range controls or incomplete-bucket fading.
2. [Main HexCode](https://github.com/janx/ckbadger/blob/ded8f6aa9b74256c49f91866f36581eeda5ca109/frontend/components/ui/hex-code.tsx) treats an identifier as one value. The candidate removes character-hover targets but retains this application's existing exact-copy behavior and truncation contract.
3. [Main text field](https://github.com/janx/ckbadger/blob/ded8f6aa9b74256c49f91866f36581eeda5ca109/frontend/components/ui/text-field.tsx) intentionally uses an inset well. That is not suitable for the user's current header feedback, so the compact field blends with its header instead. Mounted CCC/Khie's cyan action/edge vocabulary remains the visual reference; no wallet workflow or upstream layout rewrite was imported.

## Regression and validation

- 932 tests / 142 files passed; the final caption refinement then passed all 18 targeted chart/hash/search tests.
- TypeScript, Next static build/export and generated alpha/font CSS verification passed.
- Actual browser identity hover has a uniform root/prefix color after transition; witness selection retains 25% fill and 70% ring. Recorded JSON files contain computed results.
- Deterministic browser CI serves the production export under `/ckbadger-explorer/`, overrides runtime config to local mocked API endpoints, blocks external HTTP and WebSocket data, and supplies 32 activity rows plus a Latest Blocks fixture. Tests cover 320/390/1440px, long/short/empty/error/loading, clipping bounds and below-panel hit testing, PageDown/End scroll confinement, and visible keyboard-reachable Latest Blocks below. Both validation and Pages workflows now install Chromium and run this check before success/deployment. Public/live smoke remains a separate check.

Run offline after building: `CHROMIUM_PATH=/usr/bin/chromium node frontend/scripts/verify-home-ci.cjs` (omit CHROMIUM_PATH when using Playwright's installed Chromium). The separate live-data scripts retain their existing explicit TLS-interception allowance for this environment; deterministic CI needs neither backend nor TLS bypass.

Limits: Chromium viewports, not physical Safari; upstream main comparison is source-only. No Pages dispatch or production push in this candidate turn.
