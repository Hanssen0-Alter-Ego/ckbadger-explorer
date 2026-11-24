import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiBaseFor, networkFromPath, wsUrlFor } from '@/lib/active-network';
import { stripAppBase, withAppBase } from '@/lib/app-base';
import { pagesFormatDestination } from '@/lib/pages-format';

const project = '/ckbadger-explorer';
const origin = 'https://hanssen0-alter-ego.github.io';

describe('GitHub Project Pages hosting', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PAGES_BASE', project);
    window.__CKBADGER_RUNTIME_CONFIG__ = {
      defaultNetwork: 'mainnet',
      networks: [
        {
          name: 'mainnet',
          apiBase: 'https://main.example/api/mainnet/v1/',
          wsUrl: 'wss://main.example/ws/mainnet',
          pageBase: 'https://main.example/mainnet',
        },
        {
          name: 'testnet',
          apiBase: 'https://test.example/api/v1',
          wsUrl: 'wss://test.example/ws',
          pageBase: 'https://test.example/testnet',
        },
      ],
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.__CKBADGER_RUNTIME_CONFIG__;
  });

  it('handles the owning project path without mistaking its name for a network', () => {
    expect(networkFromPath(`${project}/testnet/tx/0xabc`)).toBe('testnet');
    expect(networkFromPath('/mainnet/blocks/42')).toBe('mainnet');
    expect(stripAppBase(`${project}-other/mainnet`)).toBe(`${project}-other/mainnet`);
    expect(withAppBase('/testnet/tx/0xabc?view=raw#data')).toBe(`${project}/testnet/tx/0xabc?view=raw#data`);
    expect(withAppBase(`${project}/mainnet`)).toBe(`${project}/mainnet`);
    expect(withAppBase('//main.example/tx/0xabc')).toBe('//main.example/tx/0xabc');
  });

  it('sends each enabled network to its own configured API and websocket', () => {
    expect(apiBaseFor('mainnet')).toBe('https://main.example/api/mainnet/v1');
    expect(apiBaseFor('testnet')).toBe('https://test.example/api/v1');
    expect(wsUrlFor('mainnet')).toBe('wss://main.example/ws/mainnet');
    expect(wsUrlFor('testnet')).toBe('wss://test.example/ws');
  });

  it('delegates browser machine formats but leaves normal HTML routes in the SPA', () => {
    expect(pagesFormatDestination(new URL(`${origin}${project}/mainnet/blocks/42`))).toBeNull();
    expect(pagesFormatDestination(new URL(`${origin}${project}/testnet/tx/0xabc.raw?profile=debugger#view`)))
      .toBe('https://test.example/testnet/tx/0xabc.raw?profile=debugger#view');
    expect(pagesFormatDestination(new URL(`${origin}${project}/mainnet/blocks/42?format=md`)))
      .toBe('https://main.example/mainnet/blocks/42?format=md');
    expect(pagesFormatDestination(new URL(`${origin}${project}/mainnet/blocks/42?format=html`))).toBeNull();
  });

  it('never sends disabled testnet URLs to the mainnet backend', () => {
    window.__CKBADGER_RUNTIME_CONFIG__!.networks!.pop();
    expect(pagesFormatDestination(new URL(`${origin}${project}/testnet/tx/0xabc.raw`))).toBeNull();
  });
});
