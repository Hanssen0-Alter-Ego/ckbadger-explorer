'use client';

import { useState, useEffect, useId, useMemo, useRef } from 'react';
import { useRouter } from '@/src/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, type SearchResult } from '@/lib/api';
import { normalizeHash32 } from '@/lib/search-intent';
import { resolveSearchRoute } from '@/lib/search-routing';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  variant?: 'default' | 'compact' | 'home';
}

const SEARCH_PLACEHOLDER = 'Search block / tx / address / cell ...';

export function SearchBar({ className, variant = 'default' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    data: searchResults,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query),
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  const results = useMemo(() => searchResults?.results ?? [], [searchResults?.results]);

  const showDropdown = isOpen && query.trim().length >= 2;
  const showOptions = showDropdown && !isLoading && !isError && results.length > 0;
  const activeOptionId =
    showOptions && results[selectedIndex] ? listboxId + '-option-' + selectedIndex : undefined;

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  useEffect(() => {
    if (activeOptionId) {
      document.getElementById(activeOptionId)?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeOptionId]);

  useEffect(() => {
    setSubmitFeedback(null);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetSearchState = () => {
    setIsOpen(false);
    setIsInputFocused(false);
    setQuery('');
    setSubmitFeedback(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (activeOptionId) {
      router.push(results[selectedIndex].url);
      resetSearchState();
      return;
    }

    if (isLoading) {
      setSubmitFeedback(null);
      setIsOpen(true);
      return;
    }

    if (isError && trimmed.length >= 2) {
      setSubmitFeedback(null);
      setIsOpen(true);
      return;
    }

    const normalizedHash = normalizeHash32(trimmed);
    if (normalizedHash) {
      const blockExactHash = results.find(
        (result) => result.resultType === 'block' && result.matchKind === 'exact_hash'
      );
      if (blockExactHash) {
        router.push(blockExactHash.url);
        resetSearchState();
        return;
      }
    }

    if (results.length === 1) {
      router.push(results[0].url);
      resetSearchState();
      return;
    }

    if (results.length > 1) {
      setIsOpen(true);
      setSubmitFeedback('Multiple matches found. Please choose one result.');
      return;
    }

    const route = resolveSearchRoute(trimmed);
    if (trimmed.length < 2 && route) {
      router.push(route);
      resetSearchState();
      return;
    }

    setSubmitFeedback('No matches found.');
  };

  const closeSuggestions = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (
      (e.key === 'ArrowDown' || e.key === 'ArrowUp') &&
      query.trim().length >= 2 &&
      !isLoading &&
      !isError &&
      results.length > 0
    ) {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) =>
        e.key === 'ArrowDown'
          ? Math.min(prev + 1, results.length - 1)
          : prev < 0
            ? results.length - 1
            : prev - 1
      );
    } else if (e.key === 'Escape' && showDropdown) {
      e.preventDefault();
      closeSuggestions();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    resetSearchState();
  };

  const isCompact = variant === 'compact';
  const isHome = variant === 'home';
  const showShortcutHints = isHome || isCompact;

  return (
    <div className={cn('instrument-search relative', className)}>
      <form onSubmit={handleSearch}>
        <div
          className={cn(
            'group relative',
            isHome && 'overflow-hidden rounded-none',
            isCompact && 'overflow-hidden rounded-none'
          )}
        >
          {isCompact && (
            <span
              aria-hidden="true"
              data-testid="compact-search-prompt"
              className="text-jade/70 pointer-events-none absolute inset-y-0 left-0 z-10 flex w-4 items-center justify-start font-mono text-[11px]"
            >
              &gt;
            </span>
          )}
          <input
            ref={inputRef}
            data-ckbadger-global-search="true"
            type="text"
            role="combobox"
            aria-label="Search the CKB explorer"
            aria-autocomplete="list"
            aria-expanded={showOptions}
            aria-controls={showOptions ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              setIsInputFocused(true);
            }}
            onBlur={() => {
              setIsInputFocused(false);
              closeSuggestions();
            }}
            onClick={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={SEARCH_PLACEHOLDER}
            className={cn(
              'text-text-bright w-full font-mono transition-colors focus:outline-none',
              isHome
                ? 'border-base-border bg-base-surface placeholder:text-text-dim focus:border-interactive h-10 rounded-none border pl-4 pr-20 text-sm duration-150 shadow-none focus:ring-0 sm:pr-28'
                : isCompact
                  ? cn(
                      'border-jade/18 focus:border-jade/42 h-8 rounded-none border-0 border-b bg-transparent pl-4 pr-2 text-[13px] tracking-[0.015em] caret-jade shadow-none placeholder:text-text-dim focus:border-0 focus:border-b focus:ring-0 focus-visible:border-interactive',
                      !isInputFocused && !query && 'sm:pr-14'
                    )
                  : 'border-base-border bg-base-surface placeholder:text-text-dim focus:border-jade focus:ring-jade rounded-lg border px-3 py-2.5 pr-3 text-sm focus:ring-1 sm:px-4 sm:py-3 sm:text-base'
            )}
          />
          {showShortcutHints && (!isCompact || (!isInputFocused && !query)) && (
            <SearchShortcutHints variant={isCompact ? 'compact' : 'home'} />
          )}

        </div>
      </form>

      {submitFeedback && (
        <div className="text-text-dim mt-1 px-1 text-xs" role="status" aria-live="polite">
          {submitFeedback}
        </div>
      )}

      {showDropdown && (
        <div
          ref={dropdownRef}
          data-testid="search-results-dropdown"
          className={cn(
            'absolute z-50 mt-1 w-full border',
            isCompact
              ? 'border-jade/12 rounded-none bg-[#06090f] shadow-[0_14px_32px_rgba(0,0,0,0.68)]'
              : 'border-base-border bg-base-surface rounded-lg shadow-lg'
          )}
        >
          {isLoading ? (
            <div className="text-text-dim px-4 py-3" role="status">
              Searching...
            </div>
          ) : isError ? (
            <div className="text-text-dim px-4 py-3" role="status">
              Search is unavailable right now. Try again in a moment.
            </div>
          ) : results.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="max-h-80 overflow-auto py-1"
            >
              {results.map((result, index) => (
                <li
                  key={result.resultType + '-' + result.id}
                  id={listboxId + '-option-' + index}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors',
                    isCompact
                      ? selectedIndex === index
                        ? 'text-jade bg-[#091217]'
                        : 'text-text hover:bg-[#070e13]'
                      : selectedIndex === index
                        ? 'text-jade bg-base-elevated'
                        : 'text-text hover:bg-base-elevated/50'
                  )}
                >
                  <SearchResultIcon type={result.resultType} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{result.label}</div>
                    <div className="text-text-dim truncate font-mono text-xs">{result.id}</div>
                  </div>
                  <span className="bg-base-elevated text-text-dim shrink-0 rounded px-2 py-0.5 font-mono text-xs">
                    {result.resultType}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-text-dim px-4 py-3" role="status">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchShortcutHints({ variant }: { variant: 'compact' | 'home' }) {
  const isCompact = variant === 'compact';

  return (
    <div
      aria-hidden="true"
      data-testid="search-shortcut-hints"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10 items-center gap-1',
        isCompact ? 'right-0 hidden sm:flex' : 'right-3 hidden sm:flex'
      )}
    >
      <span
        data-testid="search-shortcut-key-slash"
        className={cn(
          'rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none',
          isCompact
            ? 'border-jade/14 text-text-dim/72 rounded-none bg-[#06090f]'
            : 'border-base-border/80 bg-base-surface/80 text-text-dim'
        )}
      >
        /
      </span>
      <span
        data-testid="search-shortcut-key-question"
        className={cn(
          'rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none',
          isCompact
            ? 'border-jade/14 text-text-dim/72 rounded-none bg-[#06090f]'
            : 'border-base-border/80 bg-base-surface/80 text-text-dim'
        )}
      >
        ?
      </span>
    </div>
  );
}

function SearchResultIcon({ type }: { type: string }) {
  const classes = {
    block: 'text-aqua',
    transaction: 'text-jade',
    address: 'text-text-bright',
    cell: 'text-aqua-dim',
    script: 'text-lavender',
    token: 'text-gold',
    spore: 'text-lavender',
    cluster: 'text-lavender-dim',
    object: 'text-lavender-dim',
    identity: 'text-lavender-dim',
    default: 'text-text-dim',
  };

  const iconColor = classes[type as keyof typeof classes] ?? classes.default;

  const icon = (() => {
    switch (type) {
      case 'block':
        return (
          <path
            d="M4.5 7.5 12 4l7.5 3.5v9L12 20l-7.5-3.5v-9ZM12 4v9m0 7v-7m7.5-5.5-7.5 3.5-7.5-3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'transaction':
        return (
          <path
            d="M4 8h10m0 0-2.5-2.5M14 8l-2.5 2.5M20 16H10m0 0 2.5-2.5M10 16l2.5 2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'address':
        return (
          <>
            <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M6 19c.8-2 3-3.5 6-3.5s5.2 1.5 6 3.5" strokeLinecap="round" />
          </>
        );
      case 'cell':
        return (
          <path
            d="M5 9 12 5l7 4-7 4-7-4Zm0 0v6l7 4 7-4V9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'script':
        return (
          <path
            d="M6 5h12v12H6zM9 9h6M9 12h6M9 15h4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'token':
        return (
          <path
            d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 0v12M6 12h12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'spore':
      case 'cluster':
      case 'object':
      case 'identity':
        return (
          <path
            d="M12 5 7 8v5l5 3 5-3V8l-5-3Zm0 0v11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      default:
        return (
          <path
            d="m21 21-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
    }
  })();

  return (
    <span
      className={cn('inline-flex h-5 w-5 items-center justify-center', iconColor)}
      data-testid={`search-result-icon-${type}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        {icon}
      </svg>
    </span>
  );
}
