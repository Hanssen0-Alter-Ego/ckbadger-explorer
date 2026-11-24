import { render, screen } from '@testing-library/react';
import { MiniStatsCards } from '@/components/mini-stats-cards';
import { vi, expect, it } from 'vitest';
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      currentHour: 25,
      currentDay: 3100,
      hourlyData: [
        { label: '22:00', value: 10 },
        { label: '21:00', value: 25 },
      ],
      dailyData: [
        { label: '11/12', value: 90 },
        { label: '11/25', value: 3100 },
      ],
    },
  }),
}));
it('labels current buckets and history separately without sorting clock labels', () => {
  const { container } = render(<MiniStatsCards />);
  expect(screen.getByText('Latest hour TXs')).toBeInTheDocument();
  expect(screen.getByText('TXs today')).toBeInTheDocument();
  expect(screen.getByText('Hourly · UTC')).toBeInTheDocument();
  expect(screen.getByText('Daily · UTC+8')).toBeInTheDocument();
  expect(container.textContent!.indexOf('22:00')).toBeLessThan(
    container.textContent!.indexOf('21:00')
  );
  const bars = container.querySelectorAll('[data-mini-bar]');
  expect(bars[0].className).toBe(bars[1].className); // height, not opacity, encodes count
});
