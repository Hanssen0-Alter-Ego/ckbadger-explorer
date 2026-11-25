import { expect, it } from 'vitest';
import { orderCommitted, orderProposals, matchedProposal, nextBlockCandidates } from '@/lib/ordered-pipeline';
import type { PendingProposal, Transaction } from '@/lib/api';
const p = {
  proposalId: '0x1234',
  fullTxHash: '0x' + 'a'.repeat(64),
  proposedAtBlock: 99,
  proposedAtIndex: 1,
} as PendingProposal;
it('requires full identity and visible origin, never a shortened hash match', () => {
  expect(matchedProposal(p, [100, 99])).toBe(true);
  expect(matchedProposal(p, [100])).toBe(false);
  expect(matchedProposal({ ...p, fullTxHash: null }, [99])).toBe(false);
  expect(matchedProposal({ ...p, fullTxHash: '0x1234' }, [99])).toBe(false);
});
it('orders returned transactions by index with a stable tie-break, without mutation', () => {
  const a = [
    { index: 8, hash: 'b' },
    { index: 0, hash: 'a' },
    { index: 8, hash: 'a' },
  ] as Transaction[];
  expect(orderCommitted(a).map((t) => t.hash)).toEqual(['a', 'a', 'b']);
  expect(a[0].index).toBe(8);
});
it('orders proposals by supplied block/index rather than fee or metric positions', () => {
  expect(orderProposals([p, { ...p, proposedAtBlock: 98 }]).map((x) => x.proposedAtBlock)).toEqual([
    98, 99,
  ]);
});

it('uses only identifiable candidates in the next height’s commitment window, capped by the estimate', () => {
  const proposals = [
    { ...p, proposedAtBlock: 100, feeRate: 999 },
    { ...p, proposedAtBlock: 98, feeRate: 10 },
    { ...p, proposedAtBlock: 99, feeRate: 9 },
    { ...p, proposedAtBlock: 91, fullTxHash: '0x' + 'b'.repeat(64), feeRate: 11 },
    { ...p, proposedAtBlock: 90, fullTxHash: '0x' + 'c'.repeat(64), feeRate: 999 },
    { ...p, proposedAtBlock: 98, fullTxHash: null, feeRate: 999 },
  ];
  expect(nextBlockCandidates(proposals, 100, 2).map((x) => x.proposedAtBlock)).toEqual([91, 98]);
  expect(nextBlockCandidates(proposals, 100, 1).map((x) => x.proposedAtBlock)).toEqual([91]);
  expect(nextBlockCandidates(proposals, 100, 0)).toEqual([]);
});
