import type { PendingProposal, Transaction } from '@/lib/api';
export const PIPELINE_VISIBLE = 20;
export const fullHash = (value: string | null | undefined): value is string =>
  /^0x[0-9a-f]{64}$/i.test(value ?? '');
export function orderCommitted(txs: Transaction[]) {
  return [...txs].sort((a, b) => a.index - b.index || a.hash.localeCompare(b.hash));
}
export function orderProposals(proposals: PendingProposal[]) {
  return [...proposals].sort(
    (a, b) =>
      a.proposedAtBlock - b.proposedAtBlock ||
      a.proposedAtIndex - b.proposedAtIndex ||
      a.proposalId.localeCompare(b.proposalId)
  );
}
export function proposalKey(p: PendingProposal) {
  return `${p.proposedAtBlock}:${p.proposedAtIndex}:${p.proposalId}:${p.fullTxHash ?? ''}`;
}
export function matchedProposal(p: PendingProposal, visibleBlocks: number[]) {
  return fullHash(p.fullTxHash) && visibleBlocks.includes(p.proposedAtBlock);
}

// The Explorer is configured for CKB mainnet, whose proposal window is [2, 10].
export function nextBlockCandidates(
  proposals: PendingProposal[],
  tip: number,
  estimateCount: number,
) {
  const nextHeight = tip + 1;
  const eligible = orderProposals(proposals).filter((p) => {
    const distance = nextHeight - p.proposedAtBlock;
    return distance >= 2 && distance <= 10;
  });
  eligible.sort((a, b) => (b.feeRate ?? 0) - (a.feeRate ?? 0));
  const known = new Set<string>();
  return eligible.filter((p) => {
    if (!fullHash(p.fullTxHash)) return false;
    const hash = p.fullTxHash.toLowerCase();
    if (known.has(hash)) return false;
    known.add(hash);
    return true;
  }).slice(0, estimateCount);
}
