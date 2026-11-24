'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from '@/src/navigation';
import { focusGlobalSearchInput, isEditableElement } from '@/lib/search-focus';
import { resolveSearchRoute } from '@/lib/search-routing';

interface CommandItem {
  id: string;
  label: string;
  keywords: string[];
  href: string;
}

interface ShortcutHint {
  keys: string;
  description: string;
}

const COMMANDS: CommandItem[] = [
  {
    id: 'go-home',
    label: 'Go to Home',
    keywords: ['home', 'index'],
    href: '/',
  },
  {
    id: 'go-blocks',
    label: 'Go to Blocks',
    keywords: ['block', 'blocks'],
    href: '/blocks',
  },
  {
    id: 'go-transactions',
    label: 'Go to Transactions',
    keywords: ['tx', 'transaction', 'transactions'],
    href: '/transactions',
  },
  {
    id: 'go-activities',
    label: 'Go to Activities',
    keywords: ['activity', 'activities'],
    href: '/activities',
  },
  {
    id: 'go-dao',
    label: 'Go to DAO',
    keywords: ['dao', 'deposit'],
    href: '/dao',
  },
  {
    id: 'go-inventory-tokens',
    label: 'Go to Tokens',
    keywords: ['inventory', 'token', 'tokens', 'asset'],
    href: '/inventory/tokens',
  },
  {
    id: 'go-inventory-objects',
    label: 'Go to Objects',
    keywords: ['inventory', 'object', 'objects', 'spore', 'dob'],
    href: '/inventory/objects',
  },
  {
    id: 'go-inventory-identities',
    label: 'Go to Identities',
    keywords: ['inventory', 'identity', 'identities', 'dotbit', 'did', 'cell', 'dotcell'],
    href: '/inventory/identities',
  },
  {
    id: 'go-dotcell-names',
    label: 'Go to .cell Names',
    keywords: ['cell', 'dotcell', 'name', 'names', 'identity', 'identities'],
    href: '/identities/dotcell',
  },
  {
    id: 'go-fiber',
    label: 'Go to Fiber',
    keywords: ['fiber', 'channel', 'channels', 'payment'],
    href: '/fiber/channels',
  },
  {
    id: 'go-scripts',
    label: 'Go to Scripts',
    keywords: ['script'],
    href: '/scripts',
  },
  {
    id: 'go-charts',
    label: 'Go to Charts',
    keywords: ['chart', 'stats'],
    href: '/charts',
  },
  {
    id: 'go-hardforks',
    label: 'Go to Hardforks',
    keywords: ['hardfork', 'hard fork', 'upgrade', 'network upgrade'],
    href: '/hardforks',
  },
  {
    id: 'go-peers',
    label: 'Go to Peers',
    keywords: ['peers', 'network', 'nodes', 'node', 'p2p', 'crawler'],
    href: '/network',
  },
];

const GOTO_CHORD_TIMEOUT_MS = 1200;

const GOTO_SHORTCUTS: Record<string, { href?: string; focusSearch?: boolean }> = {
  h: { href: '/' },
  b: { href: '/blocks' },
  t: { href: '/transactions' },
  d: { href: '/dao' },
  i: { href: '/inventory/tokens' },
  s: { href: '/scripts' },
  c: { href: '/charts' },
  p: { href: '/network' },
};

const SHORTCUT_HINTS: ShortcutHint[] = [
  { keys: 'Ctrl/Cmd+K', description: 'Open command palette' },
  { keys: '?', description: 'Open keyboard shortcuts help' },
  { keys: '/', description: 'Focus global search bar' },
  { keys: 'g b', description: 'Go to Blocks' },
  { keys: 'g t', description: 'Go to Transactions' },
  { keys: 'g d', description: 'Go to DAO' },
  { keys: 'g i', description: 'Go to Inventory' },
  { keys: 'g s', description: 'Go to Scripts' },
  { keys: 'g c', description: 'Go to Charts' },
  { keys: 'g p', description: 'Go to Peers' },
  { keys: 'g h', description: 'Go to Home' },
  { keys: 'Esc', description: 'Close panel' },
];

type PaletteMode = 'commands' | 'shortcuts';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesCommand(command: CommandItem, query: string): boolean {
  if (!query) return true;
  const haystack = [command.label, ...command.keywords].join(' ').toLowerCase();
  return haystack.includes(query);
}

export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PaletteMode>('commands');
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isGotoChordActive, setIsGotoChordActive] = useState(false);
  const gotoTimerRef = useRef<number | null>(null);

  const normalizedQuery = normalize(query);

  const matchingCommands = useMemo(
    () => COMMANDS.filter((command) => matchesCommand(command, normalizedQuery)),
    [normalizedQuery]
  );

  const activeOption = matchingCommands[selectedIndex];
  const activeOptionId = activeOption ? listboxId + '-' + activeOption.id : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    if (!dialog.open) dialog.showModal();
    if (mode === 'commands') {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      closeButtonRef.current?.focus();
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (activeOptionId) {
      document.getElementById(activeOptionId)?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeOptionId]);

  const closePalette = () => {
    dialogRef.current?.close();
    if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
    triggerRef.current = null;
    setIsOpen(false);
    setMode('commands');
    setQuery('');
    setSelectedIndex(0);
  };

  useEffect(() => {
    return () => {
      if (gotoTimerRef.current !== null) {
        window.clearTimeout(gotoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const isEditable = isEditableElement(event.target);
      const isMetaOrCtrl = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isMetaOrCtrl && !event.altKey && key === 'k') {
        event.preventDefault();
        setIsGotoChordActive(false);
        if (!isOpen) {
          const focused = document.activeElement;
          triggerRef.current = focused instanceof HTMLElement ? focused : null;
        }
        setMode('commands');
        setIsOpen(true);
        return;
      }

      if (
        event.key === '?' &&
        !isOpen &&
        !isEditable &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setIsGotoChordActive(false);
        if (gotoTimerRef.current !== null) {
          window.clearTimeout(gotoTimerRef.current);
          gotoTimerRef.current = null;
        }
        const focused = document.activeElement;
        triggerRef.current = focused instanceof HTMLElement ? focused : null;
        setQuery('');
        setMode('shortcuts');
        setIsOpen(true);
        return;
      }

      if (
        !isOpen &&
        !isEditable &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (isGotoChordActive) {
          const action = GOTO_SHORTCUTS[key];
          setIsGotoChordActive(false);

          if (gotoTimerRef.current !== null) {
            window.clearTimeout(gotoTimerRef.current);
            gotoTimerRef.current = null;
          }

          if (action?.focusSearch) {
            if (focusGlobalSearchInput()) {
              event.preventDefault();
            }
            return;
          }

          if (action?.href) {
            event.preventDefault();
            router.push(action.href);
            return;
          }
        } else if (key === 'g') {
          event.preventDefault();
          setIsGotoChordActive(true);
          if (gotoTimerRef.current !== null) {
            window.clearTimeout(gotoTimerRef.current);
          }
          gotoTimerRef.current = window.setTimeout(() => {
            setIsGotoChordActive(false);
            gotoTimerRef.current = null;
          }, GOTO_CHORD_TIMEOUT_MS);
          return;
        }
      }

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !isOpen &&
        !isEditable
      ) {
        if (focusGlobalSearchInput()) {
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isGotoChordActive, isOpen, router]);

  const execute = () => {
    if (mode !== 'commands') return;

    const command =
      matchingCommands[selectedIndex] ?? (matchingCommands.length > 0 ? matchingCommands[0] : null);

    if (command) {
      router.push(command.href);
    } else if (normalizedQuery) {
      const route = resolveSearchRoute(query);
      if (!route) {
        return;
      }
      router.push(route);
    } else {
      return;
    }

    closePalette();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (matchingCommands.length === 0) return;
      setSelectedIndex((prev) => Math.min(prev + 1, matchingCommands.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (matchingCommands.length === 0) return;
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      execute();
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="border-base-border bg-base-surface text-text inset-x-0 top-[min(12vh,4rem)] m-0 mx-auto max-h-[82dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-auto rounded-xl border shadow-2xl backdrop:bg-base-bg/70"
      onCancel={(event) => {
        event.preventDefault();
        closePalette();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < left ||
          event.clientX > right ||
          event.clientY < top ||
          event.clientY > bottom
        ) {
          closePalette();
        }
      }}
    >
      <header className="border-base-border flex items-center justify-between gap-2 border-b px-4 py-2">
        <h2 id={titleId} className="text-text-bright font-mono text-sm uppercase tracking-wide">
          {mode === 'commands' ? 'Command palette' : 'Keyboard Shortcuts'}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          className="text-text hover:text-interactive min-h-8 rounded px-2 font-mono text-xs"
          onClick={closePalette}
        >
          Close
        </button>
      </header>
      {mode === 'commands' ? (
        <>
          <div className="border-base-border border-b p-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={matchingCommands.length > 0}
              aria-controls={matchingCommands.length > 0 ? listboxId : undefined}
              aria-activedescendant={activeOptionId}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Type a command, or search block / tx / address"
              className="focus:border-jade focus:ring-jade border-base-border bg-base-bg text-text-bright w-full rounded-md border px-3 py-2 font-mono text-sm outline-none focus:ring-1"
              aria-label="Command palette input"
            />
          </div>

          <div className="max-h-[360px] overflow-auto p-2">
            {matchingCommands.length > 0 ? (
              <ul id={listboxId} role="listbox" aria-label="Commands" className="space-y-1">
                {matchingCommands.map((command, index) => (
                  <li
                    key={command.id}
                    id={listboxId + '-' + command.id}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    className={`w-full cursor-pointer rounded-md px-3 py-2 text-left font-mono text-sm transition-colors ${
                      index === selectedIndex
                        ? 'text-jade bg-base-elevated'
                        : 'text-text hover:bg-base-elevated/60'
                    }`}
                    onClick={() => {
                      setSelectedIndex(index);
                      router.push(command.href);
                      closePalette();
                    }}
                  >
                    {command.label}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-text-dim rounded-md px-3 py-2 font-mono text-sm">
                No command matched. Press Enter to run search.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="max-h-[360px] overflow-auto p-2">
            <ul className="space-y-1">
              {SHORTCUT_HINTS.map((shortcut) => (
                <li
                  key={shortcut.keys}
                  className="flex items-center justify-between gap-4 rounded-md px-3 py-2"
                >
                  <span className="text-text">{shortcut.description}</span>
                  <span className="border-base-border text-text rounded border px-2 py-0.5 font-mono text-xs">
                    {shortcut.keys}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </dialog>
  );
}
