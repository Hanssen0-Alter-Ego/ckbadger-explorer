// No live API or socket traffic: local Pages-prefixed fixtures only.
exports.install = async (page, origin) => {
  await page.routeWebSocket(/.*/, (socket) => socket.close());
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/runtime-config.js'))
      return route.fulfill({
        contentType: 'application/javascript',
        body: `window.__CKBADGER_RUNTIME_CONFIG__ = {defaultNetwork:"mainnet",networks:[{name:"mainnet",apiBase:"${origin}/ckbadger-explorer/api/mainnet/v1",wsUrl:"ws://127.0.0.1:1/ws"}]};`,
      });
    if (url.origin !== origin)
      return route.fulfill({ status: 503, json: { error: 'offline fixture' } });
    if (!url.pathname.includes('/api/')) return route.continue();
    if (url.pathname.endsWith('/blocks'))
      return route.fulfill({
        json: {
          data: [
            {
              number: 21100374,
              hash: '0x' + 'a'.repeat(64),
              timestamp: '1795550400000',
              transactionsCount: 3,
              proposalsCount: 0,
              unclesCount: 0,
              size: 1024,
              cycles: 0,
              epoch: '0x0',
            },
          ],
          total: 1,
          limit: 10,
          hasMore: false,
          nextCursor: null,
        },
      });
    return route.fulfill({ status: 503, json: { error: 'offline fixture' } });
  });
};
