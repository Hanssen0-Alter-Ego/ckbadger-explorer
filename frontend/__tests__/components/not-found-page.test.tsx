import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/utils/test-utils';
import { NotFoundPage } from '@/components/not-found-page';

vi.mock('@/components/not-found-cell-ocean', () => ({
  NotFoundCellOcean: () => <canvas data-testid="animated-ocean" />,
}));

describe('NotFoundPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('explains the missing page, links home, and does not animate with reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: 'Page not found', level: 1 })).toBeInTheDocument();
    expect(screen.queryByTestId('animated-ocean')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Explorer home' })).toHaveAttribute(
      'href',
      '/mainnet'
    );
    expect(screen.getByRole('link', { name: 'Hardforks' })).toHaveAttribute(
      'href',
      '/mainnet/hardforks'
    );
    expect(screen.queryByText(/cell_not_found/)).not.toBeInTheDocument();
  });

  it('does not mislabel an unexpected rendering failure as a missing page', () => {
    render(<NotFoundPage errMessage="Network connection interrupted" />);
    expect(
      screen.getByRole('heading', {
        name: 'Unable to open this page',
        level: 1,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Network connection interrupted')).toBeInTheDocument();
  });
});
