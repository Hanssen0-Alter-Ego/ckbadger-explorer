const hash = (n) => '0x' + n.toString(16).padStart(64, '0');
exports.hash = hash;
exports.install = async (page, mode = 'populated') => {
  await page.routeWebSocket(/.*/, (s) => s.close());
  await page.route('**/api/mainnet/v1/**', async (route) => {
    const u = new URL(route.request().url()),
      p = u.pathname;
    if (mode === 'error')
      return route.fulfill({ status: 503, json: { error: 'fixture unavailable' } });
    const blocks = [100, 99, 98].map((number) => ({
      number,
      hash: hash(number + 900),
      parentHash: hash(number + 899),
      timestamp: '1795550400000',
      transactionsCount: 25,
      proposalsCount: 1,
      unclesCount: 0,
      epoch: '0x0',
      difficulty: '0x1',
    }));
    const proposal = (n, block, full = true) => ({
      proposalId: '0x' + n.toString(16).padStart(20, '0'),
      fullTxHash: full ? hash(n) : null,
      proposedAtBlock: block,
      proposedAtIndex: 0,
      blocksUntilExpiry: 8,
      fee: 1000,
      size: 400,
      cycles: 300000,
      feeRate: 2.5,
    });
    let data;
    if (p.endsWith('/mempool/transactions'))
      data = {
        transactions:
          mode === 'empty'
            ? []
            : Array.from({ length: 32 }, (_, i) => ({
                txHash: hash(i + 1),
                status: 'pending',
                size: 300 + i,
                fee: 1000,
                cycles: 400000,
                feeRate: 3,
                ancestorsCount: 0,
                timestamp: 1795550400,
              })).reverse(),
        total: 32,
      };
    else if (p.endsWith('/mempool/pending-proposals'))
      data = {
        proposals:
          mode === 'empty' ? [] : [proposal(101, 99), proposal(102, 50), proposal(103, 100, false)],
        totalCount: mode === 'empty' ? 0 : 3,
        tipBlockNumber: 100,
      };
    else if (p.endsWith('/mempool/blocks'))
      data = {
        pendingBlocks: [
          {
            index: 0,
            transactionCount: 7,
            totalSize: 2800,
            totalFee: 7000,
            totalCycles: 2100000,
            feeRateRange: { min: 1, max: 3 },
            medianFeeRate: 2,
            estimatedTimeMinutes: 1,
          },
        ],
        totalPendingCount: 32,
        totalProposedCount: 3,
      };
    else if (p.endsWith('/proposals')) {
      const block = blocks.find((b) => p.endsWith(`/${b.hash}/proposals`));
      const index = block ? { 100: 103, 99: 101, 98: 104 }[block.number] : undefined;
      data = index && mode !== 'empty' ? [{
        proposalIndex: 0,
        proposalId: proposal(index, block.number).proposalId,
        committedTxHash: index === 104 ? hash(10001) : null,
        committedBlockNumber: index === 104 ? 100 : null,
      }, ...(index === 104 ? [{
        proposalIndex: 1,
        proposalId: proposal(105, block.number).proposalId,
        // The full hash exists, but not in the API's reported commitment block.
        committedTxHash: hash(10002),
        committedBlockNumber: 99,
      }] : [])] : [];
    } else if (p.endsWith('/blocks'))
      data = {
        data: mode === 'empty' ? [] : blocks,
        total: 3,
        limit: 10,
        hasMore: false,
        nextCursor: null,
      };
    else if (p.endsWith('/transactions')) {
      const block = Number(u.searchParams.get('block_number') ?? 100);
      data = {
        data:
          mode === 'empty'
            ? []
            : Array.from({ length: 25 }, (_, index) => ({
                hash: hash(block * 100 + index),
                index,
                blockNumber: block,
                blockHash: hash(block + 900),
                timestamp: '1795550400000',
                inputsCount: 1,
                outputsCount: 2,
                fee: '1000',
                txSize: 400,
                cycles: 300000,
                isCellbase: index === 0,
              })).reverse(),
        total: 25,
        limit: 80,
        hasMore: false,
        nextCursor: null,
      };
    } else return route.fulfill({ status: 503, json: { error: 'unused fixture endpoint' } });
    return route.fulfill({ json: data });
  });
};
