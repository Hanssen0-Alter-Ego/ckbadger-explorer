import { fireEvent, render, screen } from '../utils/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';

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

import { CommandPalette } from '@/components/command-palette';

describe('CommandPalette', () => {
  beforeEach(() => {
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.open = true;
        },
      },
      close: {
        configurable: true,
        value(this: HTMLDialogElement) {
          this.open = false;
        },
      },
    });
    pushMock.mockReset();
  });

  it('opens with Ctrl+K and executes a matching command', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByLabelText('Command palette input');
    fireEvent.change(input, { target: { value: 'blocks' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/blocks');
  });

  it('executes the activities command from the palette', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByLabelText('Command palette input');
    fireEvent.change(input, { target: { value: 'activities' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/activities');
  });

  it('keeps the fiber command available in the palette', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByLabelText('Command palette input');
    fireEvent.change(input, { target: { value: 'fiber' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/fiber/channels');
  });

  it('exposes the peers command in the palette (it is no longer in the navbar)', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByLabelText('Command palette input');
    fireEvent.change(input, { target: { value: 'peers' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/network');
  });

  it('executes highlighted go-to command when query is empty', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByLabelText('Command palette input');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/blocks');
  });

  it('falls back to search-bar routing when no command matches', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    const input = screen.getByLabelText('Command palette input');
    const txHash = `0x${'a'.repeat(64)}`;
    fireEvent.change(input, { target: { value: `tx:${txHash}` } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith(`/tx/${txHash}`);
  });

  it('only offers Enter navigation if the current text can be routed', () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'something unknown' } });
    expect(screen.getByRole('status')).toHaveTextContent('No command or exact ID matched');
    expect(screen.getByRole('status')).not.toHaveTextContent('Press Enter');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'block:123' } });
    expect(screen.getByRole('status')).toHaveTextContent('Press Enter to open');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledWith('/blocks/123');
  });

  it('focuses global search input on slash', () => {
    render(
      <>
        <input data-ckbadger-global-search="true" aria-label="global search input" />
        <CommandPalette />
      </>
    );

    const searchInput = screen.getByLabelText('global search input');
    fireEvent.keyDown(window, { key: '/' });

    expect(searchInput).toHaveFocus();
  });

  it('navigates to blocks with g b chord', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'b' });

    expect(pushMock).toHaveBeenCalledWith('/blocks');
  });

  it('navigates to inventory with g i chord', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'i' });

    expect(pushMock).toHaveBeenCalledWith('/inventory/tokens');
  });

  it('navigates to scripts with g s chord', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 's' });

    expect(pushMock).toHaveBeenCalledWith('/scripts');
  });

  it('navigates to home with g h chord', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'h' });

    expect(pushMock).toHaveBeenCalledWith('/');
  });

  it('navigates to charts with g c chord', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'c' });

    expect(pushMock).toHaveBeenCalledWith('/charts');
  });

  it('navigates to peers with g p chord', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'p' });

    expect(pushMock).toHaveBeenCalledWith('/network');
  });

  it('does not navigate with g f chord', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'f' });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it('opens a labeled modal, exposes the active command, and restores focus on Escape/cancel', () => {
    render(
      <>
        <button type="button">Original control</button>
        <CommandPalette />
      </>
    );
    const origin = screen.getByRole('button', { name: 'Original control' });
    origin.focus();
    fireEvent.keyDown(origin, { key: 'k', ctrlKey: true });
    const dialog = screen.getByRole('dialog', { name: 'Command palette' });
    const input = screen.getByRole('combobox', {
      name: 'Command palette input',
    });
    expect(dialog).toHaveAttribute('open');
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const blocks = screen.getByRole('option', {
      name: 'Go to Blocks',
      selected: true,
    });
    expect(input).toHaveAttribute('aria-activedescendant', blocks.id);
    // Native Escape dispatches the cancel event; jsdom does not synthesize it.
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(origin).toHaveFocus();
  });

  it('focuses the close control in help and returns focus on closing', () => {
    render(
      <>
        <button type="button">Original control</button>
        <CommandPalette />
      </>
    );
    const origin = screen.getByRole('button', { name: 'Original control' });
    origin.focus();
    fireEvent.keyDown(origin, { key: '?' });
    expect(screen.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(origin).toHaveFocus();
  });

  it('opens shortcut help panel with question mark', () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Focus global search bar')).toBeInTheDocument();
  });
});
