# Live release verification

Published application: `068e5c9b25f423b0f88d5b27531f2723d8470e46`.

[Pages run 45488054737](https://github.com/Hanssen0-Alter-Ego/ckbadger-explorer/actions/runs/45488054737) succeeded; GitHub deployment `8040810188` reports success for that exact SHA and [this existing site](https://hanssen0-alter-ego.github.io/ckbadger-explorer/).

Live rendered captures: [320px home](320-home.jpg), [390px home](390-home.jpg), [desktop home](1440-home.jpg). Populated feed at end: [320px](320-feed-end.jpg), [390px](390-feed-end.jpg), [desktop](1440-feed-end.jpg). Following sections: [390px](390-following.jpg), [desktop](1440-following.jpg). Full pages: [320px](320-full.jpg), [390px](390-full.jpg), [desktop](1440-full.jpg).

No activity fixtures were injected for these captures. The live feed contained 20 rows / 2021px content, bounded inside 523px (320-wide) or 555px scroll viewports. End reached the bottom without moving the outer page, hit testing found no activity paint below the panel, and document widths matched all three viewports. Separate live readability checks verified label/value spacing and single-line estimate fragments. See both JSON metric files.

Chromium with reduced motion and environment-specific TLS interception allowance; no browser/device coverage claim beyond these checks. Public chain data changes between captures. No user-provided screenshot is included. This evidence-only commit is on the preview branch; the deployed application SHA above remains unchanged.
