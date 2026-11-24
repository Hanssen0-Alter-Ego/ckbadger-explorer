import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/layout/header';
import { useHomeScrollStore } from '@/hooks/useHomeScrollStore';

const usePathnameMock = vi.fn(() => '/');
const searchBarMock = vi.fn(({ variant }: { variant?: 'default' | 'compact' | 'home' }) => (
  <div data-testid="search-bar" data-variant={variant ?? 'default'}>
    SearchBar
  </div>
));

vi.mock('@/src/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useSearchAndHash: () => '',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/components/command-palette', () => ({
  CommandPalette: () => <div data-testid="command-palette">CommandPalette</div>,
}));

vi.mock('@/components/search-bar', () => ({
  SearchBar: (props: { variant?: 'default' | 'compact' | 'home' }) => searchBarMock(props),
}));

vi.mock('@/components/layout/logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('@/components/stats-bar', () => ({
  GlobalStatsBar: () => <div data-testid="global-stats-bar">GlobalStatsBar</div>,
}));

describe('Header', () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    searchBarMock.mockClear();
    useHomeScrollStore.setState({ heroVisible: true });
  });

  afterEach(() => {
    delete window.__CKBADGER_RUNTIME_CONFIG__;
  });

  it('uses compact search variant on home page', () => {
    usePathnameMock.mockReturnValue('/');
    render(<Header />);

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(searchBarMock.mock.calls.some(([props]) => props.variant === 'compact')).toBeTruthy();
    expect(searchBarMock.mock.calls.some(([props]) => props.variant === 'home')).toBeFalsy();
  });

  it('renders nav links and stats bar on non-home pages', () => {
    usePathnameMock.mockReturnValue('/blocks');
    render(<Header />);

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('global-stats-bar')).toBeInTheDocument();
    expect(searchBarMock.mock.calls.some(([props]) => props.variant === 'compact')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'DAO' }).at(0)).toHaveAttribute(
      'href',
      '/mainnet/dao'
    );
    expect(screen.getAllByRole('link', { name: 'Activities' }).at(0)).toHaveAttribute(
      'href',
      '/mainnet/activities'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Inventory' }));
    expect(screen.getAllByRole('link', { name: 'Tokens' }).at(0)).toHaveAttribute(
      'href',
      '/mainnet/inventory/tokens'
    );
    expect(screen.getAllByRole('link', { name: 'Objects' }).at(0)).toHaveAttribute(
      'href',
      '/mainnet/inventory/objects'
    );
    expect(screen.getAllByRole('link', { name: 'Identities' }).at(0)).toHaveAttribute(
      'href',
      '/mainnet/inventory/identities'
    );
    expect(screen.getAllByRole('link', { name: 'Scripts' }).at(0)).toHaveAttribute(
      'href',
      '/mainnet/scripts'
    );
    expect(screen.getAllByRole('link', { name: 'Charts' }).at(0)).toHaveAttribute(
      'href',
      '/mainnet/charts'
    );
    expect(screen.queryByRole('link', { name: 'Fiber' })).not.toBeInTheDocument();
  });

  it('opens and closes the mobile menu with navigation links', () => {
    usePathnameMock.mockReturnValue('/');
    render(<Header />);

    const toggleMenu = screen.getByRole('button', { name: 'Toggle menu' });

    fireEvent.click(toggleMenu);

    expect(screen.getAllByRole('link', { name: 'DAO' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Activities' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Tokens' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Objects' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Identities' })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Fiber' })).not.toBeInTheDocument();
    expect(searchBarMock.mock.calls.every(([props]) => props.variant === 'compact')).toBe(true);

    fireEvent.click(toggleMenu);

    expect(screen.getAllByRole('link', { name: 'DAO' })).toHaveLength(1);
  });

  it('opens Inventory explicitly with the keyboard, tabs into links, and restores focus on Escape', async () => {
    usePathnameMock.mockReturnValue('/inventory/tokens');
    const user = userEvent.setup();
    render(<Header />);
    const inventory = screen.getByRole('button', { name: 'Inventory' });
    expect(inventory).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Tokens' })).not.toBeInTheDocument();
    inventory.focus();
    await user.keyboard('{Enter}');
    expect(inventory).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    const tokens = screen.getByRole('link', { name: 'Tokens' });
    expect(tokens).toHaveFocus();
    expect(tokens).toHaveAttribute('aria-current', 'page');
    await user.keyboard('{Escape}');
    expect(inventory).toHaveFocus();
    expect(inventory).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Tokens' })).not.toBeInTheDocument();
  });

  it('focuses the mobile navigation and returns to the toggle on Escape', async () => {
    usePathnameMock.mockReturnValue('/');
    const user = userEvent.setup();
    render(<Header />);
    const toggle = screen.getByRole('button', { name: 'Toggle menu' });
    toggle.focus();
    await user.keyboard(' ');
    const nav = screen.getByRole('navigation', { name: 'Mobile primary' });
    expect(toggle).toHaveAttribute('aria-controls', nav.id);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(nav.querySelector('a')).toHaveFocus();
    expect(nav.parentElement).toHaveClass('overflow-y-auto');
    await user.keyboard('{Escape}');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile primary' })).not.toBeInTheDocument();
  });

  it('separates the network context selector from navbar links', () => {
    usePathnameMock.mockReturnValue('/');
    window.__CKBADGER_RUNTIME_CONFIG__ = {
      networks: [{ name: 'mainnet' }, { name: 'testnet' }],
      defaultNetwork: 'mainnet',
    };
    render(<Header />);

    const switcher = within(screen.getByRole('navigation', { name: 'Primary' })).getByTestId(
      'network-switcher'
    );
    const daoLink = screen.getAllByRole('link', { name: 'DAO' })[0];

    expect(switcher).toHaveAttribute('data-control', 'network-context');
    expect(switcher.nextElementSibling).toBe(daoLink);
  });

  it('hides the network switcher for single-network deployments', () => {
    usePathnameMock.mockReturnValue('/');
    render(<Header />);

    expect(screen.queryByTestId('network-switcher')).not.toBeInTheDocument();
  });
});
