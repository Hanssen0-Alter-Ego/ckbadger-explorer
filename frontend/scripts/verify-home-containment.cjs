// Run against the exported app, not a DOM mock. Only the activity feed is fixture-backed.
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:8773';
const output = process.env.EVIDENCE_DIR;
const makeRows = (count) =>
  Array.from({ length: count }, (_, i) => ({
    txHash: '0x' + (i + 1).toString(16).padStart(64, '0'),
    blockNumber: 21100374,
    txIndex: i,
    timestamp: '1795550400',
    isCellbase: false,
    typeCalls: [],
    lockCalls: [],
    protocolActions: [],
    participants: Array.from({ length: 3 }, (_, j) => ({
      address: 'ckb1qfixture' + i + j,
      lockHash: '0x' + (j + 1).toString(16).padStart(64, '0'),
      lockHashPrefix: null,
      roles: [],
      ckbDelta: j % 2 ? '10000000000' : '-10000000000',
      usedDelta: '0',
      itemDeltas: [],
      tags: 0,
    })),
  }));
(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH || (process.env.DETERMINISTIC ? undefined : '/usr/bin/chromium'),
    args: ['--no-sandbox'],
  });
  let evidence = [];
  for (const [device, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
    ['narrow', 320, 844],
  ])
    for (const mode of ['long', 'short', 'empty', 'error', 'loading']) {
      const p = await browser.newPage({
        viewport: { width, height },
        ignoreHTTPSErrors: process.env.ALLOW_TEST_CERT_ERRORS === '1',
        reducedMotion: process.env.REDUCED_MOTION || 'reduce',
      });
      if (process.env.DETERMINISTIC)
        await require('./home-browser-fixtures.cjs').install(p, origin);
      let retry = false,
        release;
      const gate = new Promise((r) => (release = r));
      await p.route('**/activities/latest?*', async (r) => {
        if (mode === 'loading') await gate;
        await r.fulfill(
          mode === 'error' && !retry
            ? { status: 400, json: { error: 'fixture_unavailable' } }
            : {
                json: makeRows(mode === 'long' ? 32 : mode === 'empty' ? 0 : 2),
              }
        );
      });
      await p.goto(origin + '/ckbadger-explorer/mainnet', {
        waitUntil: 'domcontentloaded',
      });
      const region = p.getByRole('region', { name: 'Latest activities feed' }),
        panel = p.getByTestId('latest-activities-panel');
      await region.waitFor();
      async function capturePendingState() {
        await panel.scrollIntoViewIfNeeded();
        const bounded = await region.evaluate(
          (el) =>
            el.getBoundingClientRect().bottom <=
            el.closest('[data-testid="latest-activities-panel"]').getBoundingClientRect().bottom + 1
        );
        assert.ok(bounded);
        if (output) {
          fs.mkdirSync(output, { recursive: true });
          await p.screenshot({ path: `${output}/${device}-${mode}.png` });
        }
      }
      if (mode === 'loading') {
        await p.waitForFunction(
          () =>
            document
              .querySelector('[data-testid="latest-activities-content"]')
              ?.getAttribute('aria-busy') === 'true'
        );
        await capturePendingState();
        release();
      }
      if (mode === 'error') {
        await p
          .getByRole('alert')
          .filter({ hasText: 'Activities could not be loaded' })
          .waitFor({ timeout: 25000 });
        await capturePendingState();
        retry = true;
        await p.getByRole('button', { name: 'Retry activities' }).focus();
        await p.keyboard.press('Enter');
      }
      if (mode === 'empty') await p.getByText('No recent activities.').waitFor();
      else
        await region
          .locator('[data-activity-row]')
          .nth(mode === 'long' ? 19 : 1)
          .waitFor();
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(2500);
      await panel.evaluate((el) => {
        el.scrollIntoView({ block: 'start' });
        window.scrollBy(0, -100);
      });
      const metrics = await region.evaluate((el) => {
        const r = el.getBoundingClientRect(),
          panel = el.closest('[data-testid="latest-activities-panel"]').getBoundingClientRect();
        const hit = document.elementFromPoint(
          panel.left + 40,
          Math.min(innerHeight - 2, panel.bottom + 8)
        );
        return {
          client: el.clientHeight,
          scroll: el.scrollHeight,
          regionBottom: r.bottom,
          panelBottom: panel.bottom,
          paintOutside: el.contains(hit),
          overflowX: document.documentElement.scrollWidth > innerWidth,
          pipelineTop: document
            .querySelector('[data-testid="home-pipeline-section"]')
            .getBoundingClientRect().top,
        };
      });
      assert.ok(metrics.client > 0);
      assert.ok(metrics.regionBottom <= metrics.panelBottom + 1);
      assert.equal(metrics.paintOutside, false);
      assert.equal(metrics.overflowX, false);
      assert.ok(metrics.pipelineTop >= metrics.panelBottom);
      if (mode === 'long') {
        assert.ok(metrics.scroll > metrics.client);
        await region.focus();
        await p.waitForTimeout(300);
        const initialY = await p.evaluate(() => scrollY);
        await p.keyboard.press('PageDown');
        await p.waitForTimeout(150);
        assert.ok(await region.evaluate((el) => el.scrollTop > 0));
        console.log('keyboard scroll', device, initialY, await p.evaluate(() => scrollY));
        assert.ok(Math.abs((await p.evaluate(() => scrollY)) - initialY) < 2);
        await p.keyboard.press('End');
        await p.waitForTimeout(150);
        assert.ok(
          await region.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2)
        );
        if (output) {
          fs.mkdirSync(output, { recursive: true });
          await p.screenshot({ path: `${output}/${device}-feed-end.png` });
          await p.getByTestId('home-pipeline-section').scrollIntoViewIfNeeded();
          await p.screenshot({
            path: `${output}/${device}-following-sections.png`,
          });
          await p.evaluate(() => window.scrollTo(0, 0));
          await p.waitForTimeout(100);
          await p.screenshot({
            path: `${output}/${device}-full.png`,
            fullPage: true,
          });
        }
      }
      const latest = p.getByTestId('home-latest-section');
      await latest.scrollIntoViewIfNeeded();
      if (process.env.DETERMINISTIC) {
        const blockLink = latest.getByRole('link', { name: /21100374|21,100,374/ }).first();
        await blockLink.scrollIntoViewIfNeeded();
        assert.ok(await blockLink.isVisible());
        await blockLink.focus();
        assert.ok(await blockLink.evaluate((el) => el === document.activeElement));
      }
      if (mode === 'short') {
        await panel.getByRole('link', { name: /VIEW ALL/ }).focus();
        await p.keyboard.press('Enter');
        await p.waitForURL(/\/activities/);
      }
      evidence.push({ device, mode, ...metrics, passed: true });
      await p.close();
    }
  console.log(JSON.stringify(evidence, null, 2));
  if (output) fs.writeFileSync(`${output}/containment.json`, JSON.stringify(evidence, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
