# Color opacity regression verification

Baseline fa950ff3 vs preview 82a2fb2: compiling identical raw candidates with the pinned Tailwind emitted bg-base-void/95, border-base-border/70, bg-emphasis/25, ring-emphasis/70 and text-text-dim/70 at baseline; the bare-variable preview emitted none. Tailwind documentation: https://v3.tailwindcss.com/docs/customizing-colors#using-css-variables.

All 21 variable-backed color aliases now use rgb(var(--channel-rgb) / <alpha-value>). Complete-color variable names remain available via rgb(var(--channel-rgb)), preserving existing direct CSS consumers. No layout changes.

Production CSS assertions in frontend/scripts/verify-color-css.mjs run at the end of the build. Confirmed emitted values:
- bg-base-bg/95: rgb(var(--background-rgb)/.95)
- bg-base-void/95: rgb(var(--surface-recess-rgb)/.95)
- border-base-border/70: rgb(var(--color-border-rgb)/.7)
- bg-emphasis/25: rgb(var(--color-interactive-rgb)/.25)
- ring-emphasis/70: rgb(var(--color-interactive-rgb)/0.7)

Chromium checks on the exported transaction route 0x208090332e1b30163e1412df24186595dbd0d9d08d2fdf5c13cbcee396d4e79a?witness=0, 390x844, reduced motion, both dark and light OS preferences:
- Actual sticky header: rgba(9, 13, 16, 0.95), position sticky.
- Actual footer: rgba(7, 10, 12, 0.95).
- Selected witness byte: rgba(91, 206, 250, 0.25); settled 1px ring shadow rgba(91, 206, 250, 0.7).
- Body rgb(9, 13, 16); document width 390px in both preferences.

Reproduce against local exported preview with `PREVIEW_ORIGIN=http://127.0.0.1:8767 node frontend/scripts/verify-color-browser.cjs`. Chromium path is configurable via CHROMIUM_PATH. This environment required ALLOW_TEST_CERT_ERRORS=1 for public backend TLS trust; default leaves certificate verification enabled. Live backend availability is a test dependency.

Light palette was withdrawn rather than claiming support. Sample unchanged small foreground colors against its white panel: info-dim 2.69:1, positive-dim 2.54:1, warning-dim 2.24:1, lavender 2.13:1, negative 3.57:1 (WCAG relative-luminance contrast). These fail 4.5:1; both OS preferences retain the supported dark presentation pending a complete semantic/chart audit. Earlier light screenshots are superseded.

TypeScript/Next production export, route verification, production color assertions, all 21 alias compiler checks, and 25 search/transaction tests passed. No production deployment.
