const { chromium } = require("@playwright/test");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  let results = [];
  for (const scheme of ["dark", "light"]) {
    let p = await b.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme: scheme,
      reducedMotion: "reduce",
      ignoreHTTPSErrors: process.env.ALLOW_TEST_CERT_ERRORS === "1",
    });
    await p.goto(
      (process.env.PREVIEW_ORIGIN || "http://127.0.0.1:8767") +
        "/ckbadger-explorer/mainnet/tx/0x208090332e1b30163e1412df24186595dbd0d9d08d2fdf5c13cbcee396d4e79a?witness=0",
    );
    let byte = p.getByTestId("tx-witness-byte-0");
    await byte.waitFor();
    await byte.click();
    await p.mouse.move(0, 0);
    await p.waitForTimeout(100);
    let values = await p.evaluate(() => {
      let s = (e) => {
        let x = getComputedStyle(e);
        return {
          bg: x.backgroundColor,
          border: x.borderColor,
          ring: x.getPropertyValue("--tw-ring-color"),
          position: x.position,
          shadow: x.boxShadow,
        };
      };
      return {
        header: s(document.querySelector("header")),
        footer: s(document.querySelector("footer")),
        byte: s(document.querySelector('[data-testid="tx-witness-byte-0"]')),
        body: s(document.body),
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    assert.equal(values.header.bg, "rgba(9, 13, 16, 0.95)");
    assert.equal(values.header.position, "sticky");
    assert.equal(values.footer.bg, "rgba(7, 10, 12, 0.95)");
    assert.equal(values.byte.bg, "rgba(91, 206, 250, 0.25)");
    assert.equal(values.byte.ring, "rgb(91 206 250/0.7)");
    assert.ok(values.byte.shadow.includes("rgba(91, 206, 250, 0.7)"));
    assert.equal(values.body.bg, "rgb(9, 13, 16)");
    assert.equal(values.documentWidth, 390);
    results.push({ scheme, ...values });
    await p.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await b.close();
})();
