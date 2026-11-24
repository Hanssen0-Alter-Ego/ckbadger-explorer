const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
const fs = require("fs");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const origin = process.env.PREVIEW_ORIGIN || "http://127.0.0.1:8773";
  const out = process.env.EVIDENCE_DIR || "/tmp/explorer-readability";
  fs.mkdirSync(out, { recursive: true });
  let result = [];
  for (const width of [320, 390, 1440]) {
    const p = await b.newPage({
      viewport: { width, height: width > 500 ? 1000 : 844 },
      ignoreHTTPSErrors: process.env.ALLOW_TEST_CERT_ERRORS === "1",
      reducedMotion: "reduce",
    });
    await p.goto(origin + "/ckbadger-explorer/mainnet");
    await p.getByTestId("epoch-estimate").waitFor();
    await p.waitForTimeout(2500);
    const metrics = await p.evaluate(() => {
      const box = (e) => {
        const r = e.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          right: r.right,
          bottom: r.bottom,
          height: r.height,
        };
      };
      return {
        width: innerWidth,
        doc: document.documentElement.scrollWidth,
        stats: [
          ...document.querySelectorAll("[data-testid=tx-stat-heading]"),
        ].map((e) => ({
          label: box(e.children[0]),
          value: box(e.children[1]),
          gap: getComputedStyle(e).gap,
        })),
        epoch: [
          ...document.querySelector("[data-testid=epoch-estimate]").children,
        ].map(box),
      };
    });
    assert.equal(metrics.width, metrics.doc);
    for (const s of metrics.stats) {
      assert.ok(
        s.value.y >= s.label.bottom + 7 || s.value.x >= s.label.right + 11,
      );
    }
    for (const v of metrics.epoch) assert.ok(v.height <= 25);
    assert.ok(Math.abs(metrics.epoch[0].bottom - metrics.epoch[1].bottom) <= 4);
    await p.screenshot({ path: `${out}/${width}.png` });
    result.push(metrics);
    await p.close();
  }
  fs.writeFileSync(out + "/metrics.json", JSON.stringify(result, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
