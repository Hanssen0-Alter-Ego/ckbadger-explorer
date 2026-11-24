# Narrow-screen readability follow-up

The transaction-count heading uses a real gap and stacks label/count below 640px. The epoch estimate wraps as one unbroken label/value group, instead of squeezing both text fragments. Layout ordering and features remain unchanged.

Local browser captures: [320px](320.jpg), [390px](390.jpg), [desktop](1440.jpg). [Computed bounds](metrics.json) prove separation and single-line estimate fragments; [fixture containment](containment.json) covers all five states at 320, 390 and 1440px. The long feed scrolls with PageDown/End without moving the surrounding document.

Validation: all 930 tests / 141 files passed; TypeScript, production export, 21 opacity aliases and export-route verification passed. Actual browser capture uses Chromium and mutable public data; not a physical Safari device. Scripts: `frontend/scripts/verify-home-readability.cjs` and `verify-home-containment.cjs`.
