"use client";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "@/components/ui/link";
import { api, Block, PendingProposal } from "@/lib/api";
import {
  fullHash,
  matchedProposal,
  orderCommitted,
  orderProposals,
  PIPELINE_VISIBLE,
  proposalKey,
} from "@/lib/ordered-pipeline";

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
  const txQueries = useQueries({
    queries: chain.map((block) => ({
      queryKey: ["mempool-blocks-lens-block-transactions", block.number],
      queryFn: () =>
        api.getTransactions({ blockNumber: block.number, limit: 80 }),
      staleTime: 5000,
    })),
  });
  const proposed = orderProposals(proposals.data?.proposals ?? []);
  const proposedHashes = new Set(proposed.map((p) => p.fullTxHash));
  const pending = [...(pool.data ?? [])]
    .filter((t) => t.status !== "proposed" && !proposedHashes.has(t.txHash))
    .sort((a, b) => a.txHash.localeCompare(b.txHash));
  const [selected, setSelected] = useState<Selection | null>(null);
  const [pinned, setPinned] = useState<Selection | null>(null);
  const active = pinned ?? selected;
  const track = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState<number[] | null>(null);
  useLayoutEffect(() => {
    const node = track.current;
    const measure = () => {
      if (
        !node ||
        !active?.proposal ||
        !matchedProposal(
          active.proposal,
          chain.map((b) => b.number),
        )
      ) {
        setLine(null);
        return;
      }
      const source = [
        ...node.querySelectorAll<HTMLElement>("[data-proposal-source]"),
      ].find((e) => e.dataset.proposalSource === active.key);
      const target = [
        ...node.querySelectorAll<HTMLElement>("[data-proposal-target]"),
      ].find((e) => e.dataset.proposalTarget === active.key);
      if (!source || !target) {
        setLine(null);
        return;
      }
      const a = source.getBoundingClientRect(),
        b = target.getBoundingClientRect(),
        r = node.getBoundingClientRect();
      setLine([
        a.x + a.width / 2 - r.x,
        a.y - r.y,
        b.x + b.width / 2 - r.x,
        b.y + b.height / 2 - r.y,
      ]);
    };
    measure();
    const resize = new ResizeObserver(measure);
    if (node) resize.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active, blocks.data, proposals.data]);
  function mark(s: Selection, extra: Record<string, string> = {}) {
    const on = active?.key === s.key;
    return (
      <button
        key={s.key}
        type="button"
        data-pipeline-tile={s.key}
        {...extra}
        aria-label={s.text}
        aria-pressed={pinned?.key === s.key}
        onMouseEnter={() => setSelected(s)}
        onMouseLeave={() => setSelected(null)}
        onFocus={() => setSelected(s)}
        onBlur={() => setSelected(null)}
        onClick={() => setPinned(pinned?.key === s.key ? null : s)}
        className={`h-6 w-6 sm:h-[15px] sm:w-[15px] border transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive ${on ? "border-interactive bg-interactive" : "border-interactive/50 bg-interactive/35 hover:bg-interactive/60"}`}
      />
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
                mark({
                  key: `pool:${t.txHash}`,
                  hash: t.txHash,
                  text: `Pending ${t.txHash}, ${t.size} bytes, fee ${t.fee} sh, cycles ${t.cycles}`,
                }),
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
            <p className="min-h-[102px] sm:min-h-[66px] text-sm">
              {prediction.data?.pendingBlocks[0]?.transactionCount ?? "—"}{" "}
              transactions
            </p>
            <p className="mt-2 text-xs text-text-dim">
              {prediction.isError ? "Unavailable" : "IDs not supplied"}
            </p>
          </section>
          {chain.map((b, i) => {
            const q = txQueries[i],
              txs = orderCommitted(q.data?.data ?? []),
              dots = proposed
                .filter((p) => p.proposedAtBlock === b.number)
                .slice(0, 5);
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
                  {dots.map((p) => (
                    <button
                      key={proposalKey(p)}
                      data-proposal-target={proposalKey(p)}
                      aria-label={`Proposal marker ${p.proposalId} in block ${b.number}`}
                      onFocus={() =>
                        setSelected({
                          key: proposalKey(p),
                          hash: p.fullTxHash,
                          proposal: p,
                          text: `Proposal ${p.proposalId}`,
                        })
                      }
                      onMouseEnter={() =>
                        setSelected({
                          key: proposalKey(p),
                          hash: p.fullTxHash,
                          proposal: p,
                          text: `Proposal ${p.proposalId}`,
                        })
                      }
                      onMouseLeave={() => setSelected(null)}
                      onBlur={() => setSelected(null)}
                      onClick={() =>
                        setPinned({
                          key: proposalKey(p),
                          hash: p.fullTxHash,
                          proposal: p,
                          text: `Proposal ${p.proposalId}`,
                        })
                      }
                      className="relative h-6 w-6 shrink-0 after:absolute after:left-1/2 after:top-1/2 after:h-2 after:w-2 after:-translate-x-1/2 after:-translate-y-1/2 after:border after:border-interactive after:bg-interactive/50 sm:h-2 sm:w-2"
                    />
                  ))}
                </div>
                <div className="grid min-h-[102px] sm:min-h-[66px] grid-cols-[repeat(5,24px)] sm:grid-cols-[repeat(5,15px)] content-start gap-[2px]">
                  {txs.slice(0, 20).map((t) =>
                    mark({
                      key: `block:${b.number}:${t.hash}`,
                      hash: t.hash,
                      text: `${t.isCellbase ? "Cellbase" : "Transaction"} ${t.index}, ${t.hash}, ${t.txSize ?? "unknown"} bytes, fee ${t.fee} sh, cycles ${t.cycles ?? "unknown"}`,
                    }),
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
