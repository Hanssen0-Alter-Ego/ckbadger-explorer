import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { api } from '@/lib/api';

const SHARED_PLACEHOLDER = 'Search block / tx / address / cell ...';

const pushMock = vi.hoisted(() => vi.fn());

vi.mock('@/src/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}));

vi.mock('@/lib/api', () => ({
  api: {
    search: vi.fn(),
  },
  isWarmupPendingError: vi.fn(() => false),
  isNetworkInitializingError: vi.fn(() => false),
}));

import { SearchBar } from '@/components/search-bar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushMock.mockReset();
    vi.mocked(api.search).mockResolvedValue({
      query: '12',
      results: [
        {
          resultType: 'block',
          id: '12',
          label: 'Block #12',
          url: '/blocks/12',
        },
        {
          resultType: 'transaction',
          id: '0xabc',
          label: 'Transaction 0xabc',
          url: '/tx/0xabc',
        },
        {
          resultType: 'address',
          id: 'ckb1xyz',
          label: 'Address ckb1xyz',
          url: '/address/ckb1xyz',
        },
        {
          resultType: 'cell',
          id: '0xdef-0',
          label: 'Cell 0xdef:0',
          url: '/cell/0xdef-0',
        },
      ],
    });
  });

  it('uses the same placeholder copy across variants', () => {
    const { rerender } = render(<SearchBar />);

    expect(screen.getByPlaceholderText(SHARED_PLACEHOLDER)).toBeInTheDocument();

    rerender(<SearchBar variant="compact" />);
    expect(screen.getByPlaceholderText(SHARED_PLACEHOLDER)).toBeInTheDocument();

    rerender(<SearchBar variant="home" />);
    expect(screen.getByPlaceholderText(SHARED_PLACEHOLDER)).toBeInTheDocument();
  });

  it('renders shortcut hints in home variant', () => {
    render(<SearchBar variant="home" />);
    expect(screen.getByTestId('search-shortcut-hints')).toBeInTheDocument();
    expect(screen.getByTestId('search-shortcut-key-slash')).toHaveTextContent('/');
    expect(screen.getByTestId('search-shortcut-key-question')).toHaveTextContent('?');
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('keeps the compact query and caret in a native input on a long address', async () => {
    vi.mocked(api.search).mockImplementation(() => new Promise(() => {}));
    render(<SearchBar variant="compact" />);
    const input = screen.getByRole<HTMLInputElement>('combobox', {
      name: 'Search the CKB explorer',
    });
    const address = 'ckb1' + 'abcd'.repeat(25);
    const user = userEvent.setup();
    await user.click(input);
    fireEvent.change(input, { target: { value: address } });
    await user.keyboard('{End}');

    expect(input).toHaveValue(address);
    expect(input.selectionStart).toBe(address.length);
    expect(input).not.toHaveClass('text-transparent', 'caret-transparent');
    expect(screen.queryByTestId('compact-search-command-line')).not.toBeInTheDocument();
  });

  it('keeps keyboard focus in the combobox, exposing and clearing the active option correctly', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SearchBar />
        <button type="button">After search</button>
      </>
    );
    const input = screen.getByRole('combobox', {
      name: 'Search the CKB explorer',
    });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.type(input, '12');
    const options = await screen.findByRole('listbox', {
      name: 'Search results',
    });
    const block = within(options).getByRole('option', { name: /Block #12/ });
    const tx = within(options).getByRole('option', {
      name: /Transaction 0xabc/,
    });
    expect(input).toHaveAttribute('aria-controls', options.id);

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-activedescendant', block.id);
    expect(block).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', tx.id);
    expect(block).toHaveAttribute('aria-selected', 'false');
    await user.keyboard('{Escape}');
    expect(input).toHaveFocus();
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(pushMock).toHaveBeenCalledWith('/tx/0xabc');

    await user.type(input, '12');
    await screen.findByRole('listbox');
    await user.tab();
    expect(screen.getByRole('button', { name: 'After search' })).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('still selects an option by pointer without blurring the input before click', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(screen.getByRole('combobox'), '12');
    await user.click(await screen.findByRole('option', { name: /Transaction 0xabc/ }));
    expect(pushMock).toHaveBeenCalledWith('/tx/0xabc');
  });

  it('distinguishes an unavailable search from a completed empty result', async () => {
    vi.mocked(api.search).mockRejectedValueOnce(new Error('Service unavailable'));
    render(<SearchBar />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '12' } });
    expect(await screen.findByRole('status')).toHaveTextContent(/Searching|Search is unavailable/);
    await screen.findByText(/Search is unavailable right now/);
    fireEvent.submit(input.closest('form')!);
    expect(screen.queryByText(/no (matches|results)/i)).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('renders semantic icons for different search result types', async () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(SHARED_PLACEHOLDER);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-result-icon-block')).toBeInTheDocument();
      expect(screen.getByTestId('search-result-icon-transaction')).toBeInTheDocument();
      expect(screen.getByTestId('search-result-icon-address')).toBeInTheDocument();
      expect(screen.getByTestId('search-result-icon-cell')).toBeInTheDocument();
    });
  });

  it('does not auto-navigate when multiple matches are returned on submit', async () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(SHARED_PLACEHOLDER);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12' } });

    await waitFor(() => {
      expect(screen.getByText('Block #12')).toBeInTheDocument();
    });

    fireEvent.submit(input.closest('form')!);

    expect(pushMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('Multiple matches found. Please choose one result.')
    ).toBeInTheDocument();
  });

  it('navigates immediately when exactly one result is returned on submit', async () => {
    vi.mocked(api.search).mockResolvedValueOnce({
      query: 'alpha',
      results: [
        {
          resultType: 'script',
          id: '0xabc',
          label: 'Script Alpha',
          url: '/script/0xabc',
        },
      ],
    });

    render(<SearchBar />);

    const input = screen.getByPlaceholderText(SHARED_PLACEHOLDER);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'alpha' } });

    await waitFor(() => {
      expect(screen.getByText('Script Alpha')).toBeInTheDocument();
    });

    fireEvent.submit(input.closest('form')!);
    expect(pushMock).toHaveBeenCalledWith('/script/0xabc');
  });

  /// Every valid CKB address now comes back as exactly one result, whatever
  /// the chain knows about it, so pasting one always lands on its page —
  /// including a brand-new address whose only transaction is still in the
  /// node's pool. The bar itself needs no special case for that.
  it('navigates to an address whose only presence is the tx pool', async () => {
    const address =
      'ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqxwquc4';
    vi.mocked(api.search).mockResolvedValueOnce({
      query: address,
      results: [
        {
          resultType: 'address',
          id: address,
          label: 'Address (0 cells, 1 pending)',
          url: `/address/${address}`,
        },
      ],
    });

    render(<SearchBar />);

    const input = screen.getByPlaceholderText(SHARED_PLACEHOLDER);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: address } });

    await waitFor(() => {
      expect(screen.getByText('Address (0 cells, 1 pending)')).toBeInTheDocument();
    });

    fireEvent.submit(input.closest('form')!);
    expect(pushMock).toHaveBeenCalledWith(`/address/${address}`);
  });

  it('shows no-match feedback instead of navigating on empty result set', async () => {
    vi.mocked(api.search).mockResolvedValueOnce({
      query: 'not-found',
      results: [],
    });

    render(<SearchBar />);

    const input = screen.getByPlaceholderText(SHARED_PLACEHOLDER);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'not-found' } });

    await waitFor(() => {
      expect(api.search).toHaveBeenCalledWith('not-found');
    });
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    fireEvent.submit(input.closest('form')!);
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText('No matches found.')).toBeInTheDocument();
  });

  it('prefers exact block hash result on submit when hash query has mixed results', async () => {
    const hash = `0x${'a'.repeat(64)}`;
    vi.mocked(api.search).mockImplementation(async (query: string) => {
      if (query !== hash) {
        return { query, results: [] };
      }

      return {
        query: hash,
        results: [
          {
            resultType: 'transaction',
            id: hash,
            label: `Transaction ${hash}`,
            url: `/tx/${hash}`,
            matchKind: 'exact_hash',
          },
          {
            resultType: 'block',
            id: '123',
            label: 'Block #123',
            url: `/blocks/${hash}`,
            matchKind: 'exact_hash',
          },
        ],
      };
    });

    render(<SearchBar />);

    const input = screen.getByPlaceholderText(SHARED_PLACEHOLDER);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: hash } });

    await waitFor(() => {
      expect(api.search).toHaveBeenCalledWith(hash);
    });
    await waitFor(() => {
      expect(screen.getByText('Block #123')).toBeInTheDocument();
    });

    fireEvent.submit(input.closest('form')!);
    expect(pushMock).toHaveBeenCalledWith(`/blocks/${hash}`);
  });
});
