# Mounted-module cyan and activity-feed containment candidate

Production is unchanged at `f1187c58a1ed5c40b2605bf67320f642be31681b`. This preview keeps the Explorer's layout, routes and data features. Reference: the rendered mounted Khie module at https://app.ckbccc.com/#khie, not only its tool matrix.

## Browser evidence

- [Desktop: current / mounted CCC / candidate](comparison-desktop.jpg)
- [Mobile: current / mounted CCC / candidate](comparison-mobile.jpg)
- [Reproduced production overflow](overflow-before.jpg)
- [Desktop full page with long fixture](desktop-full.jpg), [mobile full page](mobile-full.jpg)
- [Desktop feed end](desktop-feed-end.jpg), [mobile feed end](mobile-feed-end.jpg)
- [Desktop following sections](desktop-following-sections.jpg), [mobile following sections](mobile-following-sections.jpg)
- [Desktop error](desktop-error.jpg), [mobile error](mobile-error.jpg), [desktop loading](desktop-loading.jpg), [mobile loading](mobile-loading.jpg)

All images are our own browser captures of public pages or local fixtures. No user-provided screenshot is included. Live backend data changes between captures; the long-feed screenshots use synthetic activity records while other panels use the public backend.

## Change and regression boundary

The production panel was 608px high while its unconstrained child grew to 1779px; browser hit testing below the border found an activity participant. The panel wrapper now carries the flex/min-height constraint through to its scroll viewport. The home feed is keyboard focusable, scrolls internally, contains overscroll, and clips rows at its border. Loading, empty and retryable error states remain inside that same area. The header and action remain visible while rows scroll.

Cyan now marks the filled feed action, primary chart series/metrics, epoch progress, selected tabs and focused panel edges. The subtle grid follows the mounted reference. Secondary chart series retain steel/pale-steel contrast and labels; negative values and warning semantics keep their separate restrained colors.

`frontend/scripts/verify-home-containment.cjs` exercises the actual static export at 1440x1000 and 390x844, with long/short/empty/loading/error fixtures. It checks bounding boxes, hit testing below the panel, following-section position, horizontal overflow, PageDown/End within the focused feed, keyboard retry, and the View All route. Loading/error are captured before recovery. Normal and reduced motion runs are recorded. Other browser checks cover keyboard search to block detail and selecting a transaction witness byte, with sticky-header/alpha CSS assertions.

Run locally after the Pages export is served under `/ckbadger-explorer/`:

```sh
PREVIEW_ORIGIN=http://127.0.0.1:8773 node frontend/scripts/verify-home-containment.cjs
```

Optional `EVIDENCE_DIR` saves screenshots and metrics; `REDUCED_MOTION=no-preference` exercises normal motion. This environment requires `ALLOW_TEST_CERT_ERRORS=1` for its public-backend TLS interception; production code does not disable certificate validation.

## Review limits

Chromium desktop/mobile viewport checks, not physical-device Safari testing. Dynamic public data is not frozen except for the activity fixtures. Full-page review includes the pipeline and latest blocks/transactions; viewport captures establish header position. The existing mobile estimated-time label wrapping remains. No Pages dispatch or main push is part of this candidate handoff.

For an interactive local preview (no deployment):

```sh
corepack pnpm@9.15.0 install --frozen-lockfile
PAGES_BASE=/ckbadger-explorer/ corepack pnpm@9.15.0 --dir frontend dev --hostname 127.0.0.1 --port 8773
```

Open `http://127.0.0.1:8773/ckbadger-explorer/mainnet`. The recorded browser regression used the production export served with the project's dynamic-route fallback, rather than the development server.

## Final validation

- Full Vitest suite: **930/930 tests, 141/141 files passed**.
- TypeScript, Next production export and route/export verification passed.
- Generated CSS: 21 variable-backed opacity aliases and both font families verified.
- Browser containment: 10/10 desktop/mobile state combinations in reduced motion, and 10/10 in normal motion. Final reduced-motion metrics are in [containment-reduced.json](containment-reduced.json); normal-motion results are in [containment-normal.json](containment-normal.json).
- Long feed: 1779px content / 555px viewport, no outside paint or horizontal page overflow at both sizes; PageDown scrolled the region without moving the page, End reached the last row.
- Keyboard search to block detail and transaction witness selection passed at both sizes. Header95%, witness25% fill/70% ring computed styles passed under both OS color preferences (the intentionally dark presentation remains).
- Independent screenshot review found no blocking new visual regression; the pre-existing estimated-time mobile wrap was noted.

Why the previous review missed the overlap: it sampled the first fold and did not stress the populated nested panel or hit-test/scroll past its border. This round adds actual long-content paint and scrolling assertions plus full-page evidence to address that gap.
