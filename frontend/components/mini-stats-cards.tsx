'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, TxStatsDataPoint } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MiniStatsCardsProps {
  className?: string;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface BarChartProps {
  data: TxStatsDataPoint[];
  color: 'cyan' | 'ice';
  height?: number;
}

function BarChart({ data, color, height = 48 }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="text-text-dim flex items-center justify-center" style={{ height }}>
        No data
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barColor = color === 'cyan' ? 'bg-interactive/85' : 'bg-[#a8dcec]/85';
  const barColorHover = color === 'cyan' ? 'bg-interactive-hover' : 'bg-[#d1f1fa]';

  return (
    <div className="relative" style={{ height }}>
      <div className="flex h-full items-end gap-[2px]" data-mini-bars>
        {data.map((point, i) => {
          const barHeight = (point.value / maxValue) * 100;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={i}
              className="relative h-full flex-1"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={cn(
                  'absolute bottom-0 w-full transition-colors duration-150',
                  isHovered ? barColorHover : barColor,
                  'border-t border-white/25'
                )}
                data-mini-bar
                style={{ height: `${Math.max(barHeight, 2)}%` }}
              />
              {isHovered && (
                <div className="bg-base-elevated absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs shadow-lg">
                  <div className="text-text font-mono">{point.label}</div>
                  <div
                    className={cn(
                      'font-mono font-bold',
                      color === 'cyan' ? 'text-text-bright' : 'text-text-bright'
                    )}
                  >
                    {formatNumber(point.value)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TxStatWidgetProps {
  label: string;
  value: number;
  data: TxStatsDataPoint[];
  color: 'cyan' | 'ice';
  history: string;
}

function TxStatWidget({ label, value, data, color, history }: TxStatWidgetProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        data-testid="tx-stat-heading"
        className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-3"
      >
        <span className="text-text-dim font-mono text-xs uppercase tracking-wider">{label}</span>
        <span
          className={cn(
            'shrink-0 whitespace-nowrap font-mono text-xl font-bold tabular-nums',
            color === 'cyan' ? 'text-text-bright' : 'text-text-bright'
          )}
        >
          {formatNumber(value)}
        </span>
      </div>
      <p className="text-text-dim font-mono text-[10px]"><span className="block">{history}</span><span className="block">Oldest → newest</span></p>
      <BarChart data={data} color={color} height={48} />
      <div className="text-text-dim flex justify-between font-mono text-[10px]">
        <span>{data.length > 0 ? data[0].label : ''}</span>
        <span>{data.length > 0 ? data[data.length - 1].label : ''}</span>
      </div>
    </div>
  );
}

export function MiniStatsCards({ className }: MiniStatsCardsProps) {
  const { data: txStats } = useQuery({
    queryKey: ['tx-stats'],
    queryFn: () => api.getTxStats(),
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const hourlyData = txStats?.hourlyData ?? [];
  const dailyData = txStats?.dailyData ?? [];
  const txsThisHour = txStats?.currentHour ?? 0;
  const txsToday = txStats?.currentDay ?? 0;

  return (
    <div
      data-testid="tx-mini-charts"
      className={cn('border-base-border bg-base-surface h-full rounded-none border p-4', className)}
    >
      <div className="grid h-full grid-cols-2 gap-6">
        <TxStatWidget
          label="TXs this hour"
          history="Hourly · UTC"
          value={txsThisHour}
          data={hourlyData}
          color="cyan"
        />
        <TxStatWidget
          label="TXs today"
          history="Daily · UTC+8"
          value={txsToday}
          data={dailyData}
          color="ice"
        />
      </div>
    </div>
  );
}
