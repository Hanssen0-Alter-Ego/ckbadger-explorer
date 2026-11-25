"use client";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "@/components/ui/link";
import { api, Block, PendingProposal } from "@/lib/api";
import {
  fullHash,
  nextBlockCandidates,
  orderCommitted,
  orderProposals,
  PIPELINE_VISIBLE,
  proposalKey,
} from "@/lib/ordered-pipeline";

const glyphs = [
  ["pending", "Pending", "border border-interactive"],
  ["proposed", "Proposed", "border border-positive bg-positive/45"],
  ["proposal-marker", "On-chain proposal", "rounded-full border border-positive bg-positive/70"],
  ["committed", "Committed", "border border-interactive bg-interactive/45"],
  ["cellbase", "Cellbase", "rotate-45 border border-gold bg-gold"],
] as const;
type GlyphKind = (typeof glyphs)[number][0];

function PipelineGlyph({
  kind,
  className,
}: {
  kind: GlyphKind;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-pipeline-glyph={kind}
      className={`pointer-events-none block shrink-0 ${glyphs.find(([id]) => id === kind)?.[2]} ${className}`}
    />
  );
}

type Selection = {
  key: string;
  hash?: string | null;
  text: string;
  proposal?: PendingProposal;
};
export function OrderedPipeline({
  initialBlocks = [],
}: {
  initialBlocks?: Block[];
}) {
  const blocks = useQuery({
    queryKey: ["latest-blocks"],
    queryFn: () => api.getBlocks({ limit: 10 }),
    initialData: initialBlocks.length
      ? {
          data: initialBlocks,
          total: initialBlocks.length,
          limit: 10,
          hasMore: false,
          nextCursor: null,
        }
      : undefined,
    refetchInterval: 10000,
  });
  const pool = useQuery({
    queryKey: ["mempool-blocks-lens-mempool-transactions"],
    queryFn: api.getMempoolTransactions,
    refetchInterval: 10000,
  });
  const proposals = useQuery({
    queryKey: ["mempool-blocks-lens-pending-proposals"],
    queryFn: api.getPendingProposals,
    refetchInterval: 10000,
  });
  const prediction = useQuery({
    queryKey: ["mempool-blocks"],
    queryFn: api.getMempoolBlocks,
    refetchInterval: 5000,
  });
  const chain = [...(blocks.data?.data ?? [])]
    .sort((a, b) => b.number - a.number)
    .slice(0, 10);
  const queryClient = useQueryClient();
  const tip = chain[0]?.number;
  const tipHash = chain[0]?.hash;
  const previousTip = useRef(tipHash);
  const txQueries = useQueries({
    queries: chain.map((block) => ({
      queryKey: ["mempool-blocks-lens-block-transactions", block.number],
      queryFn: () =>
        api.getTransactions({ blockNumber: block.number, limit: 80 }),
      staleTime: 5000,
    })),
  });
  const proposalQueries = useQueries({
    queries: chain.map((block) => ({
      queryKey: ["pipeline-block-proposals", block.hash],
      queryFn: () => api.getBlockProposals(block.hash),
      enabled: block.proposalsCount > 0 || block.unclesCount > 0,
      staleTime: 15000,
    })),
  });
  useEffect(() => {
    if (tip == null || tipHash == null || previousTip.current === tipHash) return;
    const previous = previousTip.current;
    previousTip.current = tipHash;
    if (previous == null) return;
    // A proposal's block hash is stable while its committed fields can change.
    // Recheck only unresolved records still in or just leaving the commit window.
    chain.forEach((block, i) => {
      const age = tip - block.number;
      if (
        age >= 2 &&
        age <= 10 &&
        proposalQueries[i].data?.some((marker) => !fullHash(marker.committedTxHash))
      ) {
        void queryClient.invalidateQueries({
          queryKey: ["pipeline-block-proposals", block.hash],
          exact: true,
        });
      }
    });
  }, [tip, tipHash, queryClient]);
  const proposed = orderProposals(proposals.data?.proposals ?? []);
  const nextCount = prediction.data?.pendingBlocks[0]?.transactionCount;
  const candidates =
    proposals.data && nextCount !== undefined
      ? nextBlockCandidates(proposed, proposals.data.tipBlockNumber, nextCount)
      : [];
  const visibleData = [...proposalQueries, ...txQueries]
    .map((query) => query.dataUpdatedAt)
    .join(":");
  const proposedHashes = new Set(proposed.map((p) => p.fullTxHash));
  const pending = [...(pool.data ?? [])]
    .filter((t) => t.status !== "proposed" && !proposedHashes.has(t.txHash))
    .sort((a, b) => a.txHash.localeCompare(b.txHash));
  const [selected, setSelected] = useState<Selection | null>(null);
  const [pinned, setPinned] = useState<Selection | null>(null);
  const active = pinned ?? selected;
  const track = useRef<HTMLDivElement>(null);
  const [connector, setConnector] = useState<{
    points: number[];
    keys: string[];
  } | null>(null);
  const line = connector?.points;
  useLayoutEffect(() => {
    const node = track.current;
    const measure = () => {
      if (!node || !active) {
        setConnector(null);
        return;
      }
      const tiles = [...node.querySelectorAll<HTMLElement>("[data-pipeline-item]")];
      const selectedTile = tiles.find((el) => el.dataset.pipelineItem === active.key);
      const historyDots = tiles.filter((el) => el.dataset.committedTarget);
      // The API supplies both the full transaction hash and commitment height.
      // Match that exact tile, not a neighboring block or a short proposal ID.
      const committedDot = selectedTile?.dataset.committedTarget
        ? selectedTile
        : historyDots.find((el) => el.dataset.committedTarget === active.key);
      const committedTile = committedDot
        ? tiles.find((el) => el.dataset.pipelineItem === committedDot.dataset.committedTarget)
        : undefined;
      const pendingKey = fullHash(active.hash)
        ? selectedTile?.dataset.proposalSource ?? selectedTile?.dataset.proposalTarget
        : undefined;
      const source = committedDot
        ?? (pendingKey && tiles.find((el) => el.dataset.proposalSource === pendingKey));
      const target = committedDot
        ? committedTile
        : pendingKey && tiles.find((el) => el.dataset.proposalTarget === pendingKey);
      if (!source || !target) {
        setConnector(null);
        return;
      }
      const a = source.getBoundingClientRect(),
        b = target.getBoundingClientRect(),
        r = node.getBoundingClientRect();
      setConnector({
        points: [
          a.x + a.width / 2 - r.x,
          a.y - r.y,
          b.x + b.width / 2 - r.x,
          b.y + b.height / 2 - r.y,
        ],
        keys: [source.dataset.pipelineItem!, target.dataset.pipelineItem!],
      });
    };
    measure();
    const resize = new ResizeObserver(measure);
    if (node) resize.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, blocks.data, proposals.data, visibleData]);
  const isLinked = (key: string) => connector?.keys.includes(key) ?? false;
  function mark(
    s: Selection,
    kind: GlyphKind,
    extra: Record<string, string> = {},
  ) {
    const on = active?.key === s.key;
    return (
      <button
        key={s.key}
        type="button"
        data-pipeline-tile={s.key}
        data-pipeline-item={s.key}
        data-pipeline-linked={isLinked(s.key) || undefined}
        {...extra}
        aria-label={s.text}
        aria-pressed={pinned?.key === s.key}
        onMouseEnter={() => setSelected(s)}
        onMouseLeave={() => setSelected(null)}
        onFocus={() => setSelected(s)}
        onBlur={() => setSelected(null)}
        onClick={() => setPinned(pinned?.key === s.key ? null : s)}
        className={`grid h-6 w-6 place-items-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive sm:h-[15px] sm:w-[15px] ${isLinked(s.key) ? "bg-interactive/40 ring-1 ring-interactive" : on ? "bg-interactive/25" : "hover:bg-interactive/[.15]"}`}
      >
        <PipelineGlyph
          kind={kind}
          className={
            kind === "cellbase"
              ? "h-3 w-3 sm:h-2.5 sm:w-2.5"
              : "h-[18px] w-[18px] sm:h-[13px] sm:w-[13px]"
          }
        />
      </button>
    );
  }
  function state(loading: boolean, error: boolean, count: number) {
    return loading
      ? "Loading…"
      : error
        ? "Unavailable"
        : count === 0
          ? "Empty"
          : null;
  }
  return (
    <div
      className="container mx-auto px-4"
      data-testid="ordered-pipeline"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setPinned(null);
          setSelected(null);
        }
      }}
    >
      <div
        role="region"
        aria-label="Transaction pipeline; scroll horizontally for earlier blocks"
        tabIndex={0}
        className="overflow-x-auto overscroll-x-contain py-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-interactive"
      >
        <div
          ref={track}
          className="relative flex w-max items-start gap-4 pt-8 pb-2"
        >
          {line && (
            <svg
              data-testid="proposal-connector"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
            >
              <path
                d={`M ${line[0]} ${line[1]} V 8 H ${line[2]} V ${line[3]}`}
                fill="none"
                stroke="var(--color-interactive)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </svg>
          )}
          <section className="h-[240px] w-[156px] sm:h-[180px] sm:w-[132px] shrink-0 border border-base-border bg-base-surface p-3">
            <h3 className="whitespace-nowrap font-mono text-xs">
              Mempool · {pool.data ? pending.length : "—"}
            </h3>
            <div aria-hidden="true" className="my-2 h-6 sm:h-2" />
            <div className="grid min-h-[102px] sm:min-h-[66px] grid-cols-[repeat(5,24px)] sm:grid-cols-[repeat(5,15px)] content-start gap-[2px]">
              {pending.slice(0, PIPELINE_VISIBLE).map((t) =>
                mark(
                  {
                    key: `pool:${t.txHash}`,
                    hash: t.txHash,
                    text: `Pending ${t.txHash}, ${t.size} bytes, fee ${t.fee} sh, cycles ${t.cycles}`,
                  },
                  "pending",
                ),
              )}
            </div>
            <p className="mt-2 text-xs text-text-dim">
              {state(pool.isLoading, pool.isError, pending.length) ??
                (pending.length > 20
                  ? `+${pending.length - 20} not shown`
                  : "Hash order")}
            </p>
          </section>
          <section className="h-[240px] w-[156px] sm:h-[180px] sm:w-[132px] shrink-0 border border-base-border bg-base-surface p-3">
            <h3 className="whitespace-nowrap font-mono text-xs">
              Proposed · {proposals.data ? proposals.data.totalCount : "—"}
            </h3>
            <div aria-hidden="true" className="my-2 h-6 sm:h-2" />
            <div className="grid min-h-[102px] sm:min-h-[66px] grid-cols-[repeat(5,24px)] sm:grid-cols-[repeat(5,15px)] content-start gap-[2px]">
              {proposed.slice(0, 20).map((p) =>
                mark(
                  {
                    key: proposalKey(p),
                    hash: p.fullTxHash,
                    proposal: p,
                    text: `Proposal ${p.proposalId}, proposed in block ${p.proposedAtBlock}, size ${p.size ?? "unknown"} bytes, fee ${p.fee ?? "unknown"} sh, cycles ${p.cycles ?? "unknown"}`,
                  },
                  "proposed",
                  { "data-proposal-source": proposalKey(p) },
                ),
              )}
            </div>
            <p className="mt-2 text-xs text-text-dim">
              {state(proposals.isLoading, proposals.isError, proposed.length) ??
                ((proposals.data?.totalCount ?? proposed.length) > 20
                  ? `+${(proposals.data?.totalCount ?? proposed.length) - 20} not shown`
                  : "Block/index order")}
            </p>
          </section>
          <section className="h-[240px] w-[156px] sm:h-[180px] sm:w-[132px] shrink-0 border border-base-border bg-base-surface p-3">
            <h3 className="whitespace-nowrap font-mono text-xs">Next (est.)</h3>
            <div aria-hidden="true" className="my-2 h-6 sm:h-2" />
            <div className="grid min-h-[102px] sm:min-h-[66px] grid-cols-[repeat(5,24px)] sm:grid-cols-[repeat(5,15px)] content-start gap-[2px]">
              {candidates.slice(0, PIPELINE_VISIBLE).map((p) =>
                mark(
                  {
                    key: `next:${p.fullTxHash}`,
                    hash: p.fullTxHash,
                    text: `Next candidate ${p.fullTxHash}, proposed in block ${p.proposedAtBlock}, size ${p.size ?? "unknown"} bytes, fee ${p.fee ?? "unknown"} sh, fee rate ${p.feeRate ?? "unknown"} sh/B, cycles ${p.cycles ?? "unknown"}`,
                  },
                  "proposed",
                ),
              )}
            </div>
            <p className="mt-2 text-xs text-text-dim">
              {prediction.isError || proposals.isError
                ? "Unavailable"
                : nextCount === undefined || !proposals.data
                  ? "No estimate"
                  : `${nextCount} estimated · ${Math.min(candidates.length, PIPELINE_VISIBLE)} shown`}
            </p>
          </section>
          {chain.map((b, i) => {
            const q = txQueries[i],
              txs = orderCommitted(q.data?.data ?? []),
              pq = proposalQueries[i],
              markers = [...(pq.data ?? [])].sort(
                (a, b) => a.proposalIndex - b.proposalIndex,
              );
            const total = q.data?.total ?? b.transactionsCount;
            return (
              <section
                key={b.number}
                data-pipeline-block={b.number}
                className="h-[240px] w-[156px] sm:h-[180px] sm:w-[132px] shrink-0 border border-base-border bg-base-surface p-3"
              >
                <h3 className="font-mono text-xs">
                  <Link
                    className="text-interactive hover:underline"
                    href={`/blocks/${b.number}`}
                  >
                    #{b.number.toLocaleString()}
                  </Link>
                </h3>
                <div className="my-2 flex h-6 gap-0.5 sm:h-2">
                  {markers.slice(0, 5).map((marker) => {
                    const live = proposed.find(
                      (p) =>
                        p.proposedAtBlock === b.number &&
                        p.proposedAtIndex === marker.proposalIndex &&
                        p.proposalId === marker.proposalId &&
                        (!marker.committedTxHash ||
                          marker.committedTxHash === p.fullTxHash),
                    );
                    const selection = {
                      key: `proposal:${b.hash}:${marker.proposalIndex}`,
                      hash: marker.committedTxHash ?? live?.fullTxHash,
                      proposal: live,
                      text: `Proposal ${marker.proposalId} in block ${b.number}${
                        marker.committedBlockNumber == null
                          ? ""
                          : `, committed in block ${marker.committedBlockNumber}`
                      }`,
                    };
                    return (
                      <button
                        key={selection.key}
                        type="button"
                        data-pipeline-item={selection.key}
                        data-pipeline-linked={isLinked(selection.key) || undefined}
                        data-proposal-target={live ? proposalKey(live) : undefined}
                        data-committed-target={
                          fullHash(marker.committedTxHash) && marker.committedBlockNumber != null
                            ? `block:${marker.committedBlockNumber}:${marker.committedTxHash.toLowerCase()}`
                            : undefined
                        }
                        aria-label={selection.text}
                        aria-pressed={pinned?.key === selection.key}
                        onFocus={() => setSelected(selection)}
                        onMouseEnter={() => setSelected(selection)}
                        onMouseLeave={() => setSelected(null)}
                        onBlur={() => setSelected(null)}
                        onClick={() => setPinned(pinned?.key === selection.key ? null : selection)}
                        className="grid h-6 w-6 shrink-0 place-items-center focus-visible:outline focus-visible:outline-interactive sm:h-2 sm:w-2"
                      >
                        <PipelineGlyph kind="proposal-marker" className={`h-2 w-2 ${isLinked(selection.key) ? "ring-2 ring-interactive" : ""}`} />
                      </button>
                    );
                  })}
                  {markers.length > 5 && (
                    <span className="self-center text-[10px] leading-none text-text-dim">+{markers.length - 5}</span>
                  )}
                  {pq.isError && (
                    <span className="self-center text-[10px] leading-none text-text-dim">Proposals unavailable</span>
                  )}
                </div>
                <div className="grid min-h-[102px] sm:min-h-[66px] grid-cols-[repeat(5,24px)] sm:grid-cols-[repeat(5,15px)] content-start gap-[2px]">
                  {txs.slice(0, 20).map((t) =>
                    mark(
                      {
                        key: `block:${b.number}:${t.hash.toLowerCase()}`,
                        hash: t.hash,
                        text: `${t.isCellbase ? "Cellbase" : "Transaction"} ${t.index}, ${t.hash}, ${t.txSize ?? "unknown"} bytes, fee ${t.fee} sh, cycles ${t.cycles ?? "unknown"}`,
                      },
                      t.isCellbase ? "cellbase" : "committed",
                    ),
                  )}
                </div>
                <p className="mt-2 text-xs text-text-dim">
                  {state(q.isLoading, q.isError, txs.length) ??
                    (total > 20
                      ? `+${total - 20} not shown`
                      : "Index order · fetched sample")}
                </p>
              </section>
            );
          })}
          {!chain.length && (
            <p className="w-36 text-sm text-text-dim">
              {blocks.isLoading
                ? "Loading blocks…"
                : blocks.isError
                  ? "Blocks unavailable"
                  : "No recent blocks"}
            </p>
          )}
        </div>
      </div>
      <ul
        aria-label="Transaction symbols"
        className="flex flex-wrap gap-x-4 gap-y-1 pb-2 text-xs text-text-dim"
      >
        {glyphs.map(([kind, label]) => (
          <li className="flex items-center gap-1.5" key={kind}>
            <PipelineGlyph kind={kind} className="h-2 w-2" />
            {label}
          </li>
        ))}
      </ul>
      <div
        aria-live="polite"
        data-testid="pipeline-selection"
        className="min-h-16 break-words border-t border-base-border py-2 text-xs text-text-dim"
      >
        {active ? (
          <>
            <p>{active.text}</p>
            {active.proposal && !line && (
              <p>
                No matching visible proposal marker with a full transaction
                identity.
              </p>
            )}
            {fullHash(active.hash) && (
              <Link
                href={`/tx/${active.hash}`}
                className="text-interactive underline"
              >
                Open transaction
              </Link>
            )}
            <button
              className="ml-3 underline"
              onClick={() => {
                setPinned(null);
                setSelected(null);
              }}
            >
              Clear selection
            </button>
          </>
        ) : (
          <p>
            One tile per transaction. Hover, focus or tap to inspect; tap pins a
            selection. Proposal lines connect only supplied matching identities.
            Scroll for earlier blocks.
          </p>
        )}
      </div>
    </div>
  );
}
