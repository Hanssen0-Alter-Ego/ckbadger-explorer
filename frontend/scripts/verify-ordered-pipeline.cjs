const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { install } = require('./pipeline-browser-fixtures.cjs');
(async () => {
  const b = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH || (process.env.DETERMINISTIC ? undefined : '/usr/bin/chromium'),
    args: ['--no-sandbox'],
  });
  const out = process.env.EVIDENCE_DIR;
  if (out) fs.mkdirSync(out, { recursive: true });
  let results = [];
  for (const width of [320, 390, 1440])
    for (const mode of ['populated', 'empty', 'error']) {
      const p = await b.newPage({
        viewport: { width, height: width > 500 ? 1000 : 844 },
        ignoreHTTPSErrors: true,
        reducedMotion: 'reduce',
        hasTouch: width < 640,
      });
      if (process.env.DETERMINISTIC)
        await require('./home-browser-fixtures.cjs').install(p, process.env.PREVIEW_ORIGIN);
      await install(p, mode);
      await p.goto(
        (process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:8776') + '/ckbadger-explorer/mainnet',
        { waitUntil: 'domcontentloaded' }
      );
      const root = p.getByTestId('ordered-pipeline');
      await root.waitFor();
      await root.scrollIntoViewIfNeeded();
      if (mode === 'populated') {
        const source = root.locator('[data-proposal-source^="99:"]');
        await source.waitFor();
        await root.locator('[data-pipeline-block="100"] [data-pipeline-tile]').nth(19).waitFor();
        const tiles = root.locator('[data-pipeline-block="100"] [data-pipeline-tile]');
        const ids = await tiles.evaluateAll((es) => es.map((e) => e.dataset.pipelineTile));
        assert.ok(ids[0].endsWith('2710'));
        assert.ok(ids[19].endsWith('2723'));
        const cellbase = tiles.first();
        const diamond = cellbase.locator('[data-pipeline-glyph="cellbase"]');
        assert.match(await cellbase.getAttribute("aria-label"), /^Cellbase 0,/);
        assert.notEqual(
          await diamond.evaluate((el) => getComputedStyle(el).transform),
          "none",
        );
        const committed = tiles
          .nth(1)
          .locator('[data-pipeline-glyph="committed"]');
        assert.equal(await committed.count(), 1);
        assert.equal(
          await committed.evaluate((el) => getComputedStyle(el).transform),
          "none",
        );
        const proposedSquare = source.locator('[data-pipeline-glyph="proposed"]');
        assert.deepEqual(
          await proposedSquare.evaluate((el) => {
            const css = getComputedStyle(el);
            return [css.borderRadius, css.backgroundColor];
          }),
          ["0px", "rgba(158, 185, 172, 0.45)"],
        );
        const historical = root.locator('[data-pipeline-block="98"]')
          .getByRole("button", { name: /committed in block 100/ });
        await historical.waitFor();
        assert.equal(await historical.getAttribute('data-proposal-target'), null);
        assert.equal(await historical.locator('[data-pipeline-glyph="proposal-marker"]')
          .evaluate((el) => getComputedStyle(el).borderRadius), "9999px");
        await historical.hover();
        await p.getByTestId('proposal-connector').waitFor();
        const historicalTx = tiles.nth(1);
        await historicalTx.and(root.locator('[data-pipeline-linked="true"]')).waitFor();
        assert.notEqual(await historicalTx.evaluate((el) => getComputedStyle(el).boxShadow), 'none');
        const txRect = await historicalTx.boundingBox();
        const historyPath = await p.getByTestId('proposal-connector').evaluate((svg) => {
          const values = svg.querySelector('path').getAttribute('d').match(/-?[\d.]+/g).map(Number);
          const bounds = svg.getBoundingClientRect();
          return { x: values[3] + bounds.x, y: values[4] + bounds.y };
        });
        assert.ok(Math.abs(historyPath.x - (txRect.x + txRect.width / 2)) < 1);
        assert.ok(Math.abs(historyPath.y - (txRect.y + txRect.height / 2)) < 1);
        assert.ok((await root.getByRole('link', {name: 'Open transaction'})
          .getAttribute('href')).endsWith('2711'));
        await p.keyboard.press('Escape');
        await p.mouse.move(1, 1);
        await historicalTx.focus();
        await historical.and(root.locator('[data-pipeline-linked="true"]')).waitFor();
        await p.keyboard.press('Escape');
        await root.locator('[data-pipeline-block="98"]')
          .getByRole("button", { name: /committed in block 99/ }).hover();
        assert.equal(await p.getByTestId('proposal-connector').count(), 0);
        assert.equal(await tiles.nth(2).getAttribute('data-pipeline-linked'), null);
        await p.keyboard.press('Escape');
        const pending = root
          .locator(
            '[data-pipeline-tile^="pool:"] [data-pipeline-glyph="pending"]',
          )
          .first();
        assert.equal(
          await pending.evaluate((el) => getComputedStyle(el).backgroundColor),
          "rgba(0, 0, 0, 0)",
        );
        const legend = root.getByRole("list", { name: "Transaction symbols" });
        for (const label of ["Pending", "Proposed", "On-chain proposal", "Committed", "Cellbase"])
          assert.equal(
            await legend.getByText(label, { exact: true }).count(),
            1,
          );
        const candidate = root.locator('[data-pipeline-tile^="next:"]');
        assert.equal(await candidate.count(), 1);
        await candidate.focus();
        assert.match(await candidate.getAttribute('aria-label'), /Next candidate .* fee rate 2.5 sh\/B/);
        assert.ok((await root.getByRole('link', {name: 'Open transaction'})
          .getAttribute('href')).endsWith('65'));
        assert.equal(await root.getByText('7 estimated · 1 shown').count(), 1);
        await p.keyboard.press('Escape');
        const rects = await tiles.evaluateAll((es) =>
          es.map((e) => {
            let r = e.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          })
        );
        for (let i = 1; i < 5; i++) assert.equal(rects[i].y, rects[0].y);
        assert.equal(rects[5].x, rects[0].x);
        if (width < 640) assert.ok(rects.every((r) => r.w >= 24 && r.h >= 24));
        assert.equal(rects[5].y - rects[0].y, width < 640 ? 26 : 17);
        if (out) await p.screenshot({ path: `${out}/${width}-idle.png` });
        await source.focus();
        await p.getByTestId('proposal-connector').waitFor();
        const endpoint = await p.getByTestId('proposal-connector').evaluate((svg) => {
          const v = svg
              .querySelector('path')
              .getAttribute('d')
              .match(/[\d.]+/g)
              .map(Number),
            r = svg.getBoundingClientRect(),
            t = document.querySelector('[data-proposal-target^="99:"]').getBoundingClientRect();
          return { x: v[3] + r.x, y: v[4] + r.y, tx: t.x + t.width / 2, ty: t.y + t.height / 2 };
        });
        assert.ok(Math.abs(endpoint.x - endpoint.tx) < 1 && Math.abs(endpoint.y - endpoint.ty) < 1);
        if (out) await p.screenshot({ path: `${out}/${width}-keyboard-connector.png` });
        await source.click();
        await root.locator('[role="region"]').evaluate((e) => (e.scrollLeft = 500));
        assert.ok(await p.getByTestId('proposal-connector').isVisible());
        if (out) await p.screenshot({ path: `${out}/${width}-pinned-target.png` });
        await p.keyboard.press('Escape');
        await p.getByTestId('proposal-connector').waitFor({ state: 'detached' });
        const missing = root.locator('[data-proposal-source^="50:"]');
        await missing.focus();
        await missing.hover();
        assert.equal(await p.getByTestId('proposal-connector').count(), 0);
        await p
          .getByText('No matching visible proposal marker with a full transaction identity.')
          .waitFor();
        await root.locator('[data-proposal-source^="100:"]').focus();
        assert.equal(await p.getByTestId('proposal-connector').count(), 0);
        await p.keyboard.press('Escape');
        await source.hover();
        await p.getByTestId('proposal-connector').waitFor();
        const link = root.getByRole('link', { name: 'Open transaction' });
        assert.ok((await link.getAttribute('href')).endsWith('65'));
        await p.keyboard.press('Escape');
        assert.ok(await root.getByText('+12 not shown').isVisible());
        assert.equal(
          await root.locator('[data-pipeline-block="100"]').getByText('+5 not shown').count(),
          1
        );
      } else {
        await root
          .getByText(mode === 'empty' ? 'Empty' : 'Unavailable', { exact: true })
          .first()
          .waitFor({ timeout: 30000 });
        assert.equal(await p.getByTestId('proposal-connector').count(), 0);
        if (out) await p.screenshot({ path: `${out}/${width}-${mode}.png` });
      }
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth), width);
      results.push({ width, mode, passed: true });
      await p.close();
    }
  fs.writeFileSync(
    out ? out + '/checks.json' : '/tmp/ordered-pipeline-checks.json',
    JSON.stringify(results, null, 2)
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
