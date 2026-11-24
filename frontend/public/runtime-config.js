// Deploy-time configuration: all endpoints below are public in the browser.
// Add { name: 'testnet', apiBase: '<verified URL>', wsUrl: '<verified WSS URL>',
// pageBase: '<verified network page URL>' } only after verifying that network.
window.__CKBADGER_RUNTIME_CONFIG__ = {
  defaultNetwork: 'mainnet',
  buildVersion: '0.8.3@da98312e44cd',
  networks: [
    {
      name: 'mainnet',
      apiBase: 'https://explorer.ckbccc.com/api/mainnet/v1',
      wsUrl: 'wss://explorer.ckbccc.com/ws/mainnet',
      pageBase: 'https://explorer.ckbccc.com/mainnet',
    },
  ],
};
