// CCC steel/signal family adapted for distinguishable explorer series; labels remain authoritative.
export const CHART_PRIMARY_COLOR = '#5bcefa'; // CCC --signal cyan
export const CHART_SECONDARY_COLOR = '#d0bd96'; // Warm sand/gold — high contrast vs cyan and panel surface
export const CHART_TERTIARY_COLOR = '#b7c8d0'; // Pale steel
export const CHART_POSITIVE_COLOR = '#9eb9ac'; // Muted positive sage
export const CHART_NEGATIVE_COLOR = '#f5a9b8'; // CCC --error rose

export const CHART_PALETTE = [
  CHART_PRIMARY_COLOR,
  CHART_SECONDARY_COLOR,
  CHART_TERTIARY_COLOR,
  CHART_POSITIVE_COLOR,
  CHART_NEGATIVE_COLOR,
  '#7e929e', // steel
  '#a69c91', // warm stone
  '#8fa59c', // sage-dim
  '#b18c94', // rose-dim
  '#7896a6', // slate-blue
  '#a69f8c', // sand-dim
  '#81939f', // cool-steel
] as const;

export const CHART_GRID_COLOR = 'var(--chart-grid, #28343a)';
export const CHART_TOOLTIP_BG = 'var(--chart-tooltip-bg, #070a0c)';
export const CHART_TOOLTIP_BORDER = 'var(--chart-tooltip-border, #4a5b64)';
export const CHART_HOVER_COLOR = 'var(--chart-crosshair, #89979f)';
export const CHART_POINT_RING_COLOR = 'var(--foreground, #e6eef2)';

export function getChartPaletteColor(index: number): string {
  const paletteLength = CHART_PALETTE.length;
  const normalizedIndex = ((index % paletteLength) + paletteLength) % paletteLength;
  return CHART_PALETTE[normalizedIndex];
}

// Activity type colors — shared by activity card, activity breakdown, and pie charts
export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  Transfer: '#aec6cc',
  'DAO Deposit': '#9eb9ac',
  'DAO Withdraw': '#7e9b8d',
  Token: '#c4b0b5',
  Object: '#a9b3c2',
  Identity: '#8faebe',
  'Script Call': '#c3b39c',
};

// Asset category colors — keyed by category slug
export const ASSET_CATEGORY_COLORS: Record<string, string> = {
  dao: ACTIVITY_TYPE_COLORS['DAO Deposit'],
  tokens: ACTIVITY_TYPE_COLORS.Token,
  objects: ACTIVITY_TYPE_COLORS.Object,
  other: '#78858c',
};

// Rotating palette for per-script charts
export const SCRIPT_CHART_COLORS = [
  '#9eb9ac',
  '#c4b0b5',
  '#8faebe',
  '#aec6cc',
  '#a9b3c2',
  '#bacfc4',
  '#d6a1a9',
  '#b9d4df',
  '#a3c1bd',
  '#c1c7d0',
] as const;
