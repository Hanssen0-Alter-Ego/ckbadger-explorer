import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BlockDetailPage from '@/app/blocks/[id]/client-page';
import { api } from '@/lib/api';

vi.mock('@/components/layout/header', () => ({ Header: () => null }));
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  api: { getBlock: vi.fn() },
}));

function renderBlock() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BlockDetailPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('block details error recovery', () => {
  it('reserves not found for a 404 response', async () => {
    vi.mocked(api.getBlock).mockReset().mockRejectedValue({ status: 404 });
    renderBlock();
    expect(await screen.findByRole('heading', { name: 'Block not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to explorer' })).toBeTruthy();
  });

  it('offers Retry for an unavailable block endpoint', async () => {
    const getBlock = vi.mocked(api.getBlock).mockReset().mockRejectedValue({ status: 503 });
    renderBlock();
    expect(await screen.findByRole('heading', { name: 'Could not load block' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(getBlock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('heading', { name: 'Block not found' })).toBeNull();
  });
});
