# Verified live release

Published SHA: `ad3061be5fad7cfcbbaec041302eac726e8d2833`.

[Pages run 45498010819](https://github.com/Hanssen0-Alter-Ego/ckbadger-explorer/actions/runs/45498010819) succeeded. Its build actually executed and passed “Verify populated home scroll containment offline” before artifact upload and deployment. GitHub deployment `8042150013` reports success for this exact SHA and [the existing Pages URL](https://hanssen0-alter-ego.github.io/ckbadger-explorer/).

Live, unmocked browser checks passed at 390px and 1440px:

- [Mobile charts](390-charts.jpg), [desktop charts](1440-charts.jpg): correct latest-hour/today labels, cyan/pale-cyan fills with uniform 85% alpha within each series.
- [Mobile idle](390-idle.jpg), [desktop idle](1440-idle.jpg): search background transparent. [Mobile focus/open](390-search.jpg), [desktop focus/open](1440-search.jpg): 4% cyan tint, readable dropdown; ArrowDown/Enter navigates to block detail.
- [Mobile ordinary hash hover](390-hash.jpg), [desktop hash hover](1440-hash.jpg): no character targets, uniform whole-value hover color.
- [Witness inspection](witness-dark.jpg): selected byte retains 25% fill and 70% ring; computed assertions passed under dark and light OS preferences (the app intentionally retains its dark presentation).

All screenshots are our browser captures of the public site, not user-provided images. Data changes between captures. Chromium viewport checks with this environment's TLS-interception allowance, not a physical-device Safari claim. The floating LIVE badge was not changed. This evidence-only commit is on the preview branch; no second Pages dispatch or main update.
