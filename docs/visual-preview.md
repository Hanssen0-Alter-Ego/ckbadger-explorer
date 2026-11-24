# Isolated CCC visual-system preview

Latest user clarification acknowledged: retain the explorer's layout, areas, ordering and component positions largely unchanged; use actual CCC App primitives for borders, motion, palette, typography, controls and surfaces. This is not a wallet-flow or navigation redesign.

Baseline: fa950ff3d483f69b1d363f65c0ca800b927d95f3.
Reference: live https://app.ckbccc.com/ and ckb-devrel/ccc source snapshot 0961763da4a81c954e156a27c581aed0aeca9761, packages/app/src/app/styles/{tokens,base,module-controls,workspace,shell}.css.

Changes: square structural panel borders and small signal accents; flat recessed panel headings; sans display headings and mono metadata; square search/controls, restrained active tabs, 160ms state transitions and short dialog entrance; removal of panel scanline overlay and search scanning/glow treatment; semantic surface tokens with OS light-mode support and reduced-motion handling. Existing grids, order, routes, API calls and feature logic are retained. Chart semantic colors remain distinct.

Validation: 55 targeted tests passed (8 files), Next production build including TypeScript and static export passed, verify-pages.mjs passed, git diff --check passed. Earlier 45-test pass also included Tabs and network-isolation tests. No production writes or deployment.

Browser evidence is stored in /workspace/explorer-visual-evidence, including comparison.html and desktop/mobile screenshots for CCC, current production and local preview. Local server uses the same exported index fallback for client routes. Public read-only backend requests are used; data and times can differ across captures. Chromium required ignoreHTTPSErrors for the environment's public-site certificate trust failure; no credentials or wallet connections were used. Screenshots demonstrate rendering, not a complete UX audit. Final independent review remains required.

Follow-up entry-point checks: removed the home search repeated glow/scan markup itself, changed witness inspector chips and byte highlights to square outlines and short color feedback without breathing, retaining semantic tones. Light-mode warning/positive foregrounds use contrast-adjusted tones. An additional 25 search and transaction-detail tests passed; final Next build/export and route verification passed. Browser evidence includes idle/focused search and selected witness inspector on desktop/mobile with reduced-motion variants.
