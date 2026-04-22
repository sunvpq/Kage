export const EDGE_COLORS = {
  breach:   '#ff3355',
  broker:   '#a855f7',
  zombie:   '#eab308',
  overreach:'#fb923c',
  normal:   '#4b5563',
} as const;

type ProblemKey = keyof typeof EDGE_COLORS;

export function getEdgeColor(problems: string[]): string {
  if (problems.length === 0) return EDGE_COLORS.normal;
  if (problems.length === 1) return EDGE_COLORS[problems[0] as ProblemKey] ?? EDGE_COLORS.normal;
  // 2+ problems → pulsing gradient; return first color as static fallback
  return EDGE_COLORS[problems[0] as ProblemKey] ?? EDGE_COLORS.normal;
}

export function getProblemColors(problems: string[]): string[] {
  return problems.map(p => EDGE_COLORS[p as ProblemKey] ?? EDGE_COLORS.normal);
}
