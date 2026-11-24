// CCC steel/signal family adapted for distinguishable explorer series; labels remain authoritative.
export const CHART_PRIMARY_COLOR = '#5bcefa'; // Primary cyan signal
export const CHART_SECONDARY_COLOR = '#7e929e'; // Secondary steel
export const CHART_TERTIARY_COLOR = '#b7c8d0'; // Tertiary pale steel

export const CHART_PALETTE = [
  CHART_PRIMARY_COLOR,
  CHART_SECONDARY_COLOR,
  CHART_TERTIARY_COLOR,
  '#c3b9a6', // gold
  '#b1bcc3', // lavender
  '#a69c91', // amber
  '#8fa59c', // jade-dim
  '#b18c94', // rouge-dim
  '#7896a6', // aqua-dim
  '#a69f8c', // gold-dim
  '#81939f', // lavender-dim
  '#8b847b', // amber-dim
] as const;

export const CHART_GRID_COLOR = '#28343a';
export const CHART_AXIS_COLOR = '#4a5b64';
export const CHART_TOOLTIP_BG = '#11181c';
export const CHART_TOOLTIP_BORDER = CHART_TOOLTIP_BG;
export const CHART_HOVER_BG = '#182228';
export const CHART_HOVER_COLOR = CHART_HOVER_BG;

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
