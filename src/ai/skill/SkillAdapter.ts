// V2324 SkillAdapter - Direction K Iter 29/30
// Format adapter (markdown/mdx/plain/tokens)
// Source: generic-agent
export type SkillAdapterFormat = 'markdown' | 'mdx' | 'plain' | 'tokens' | 'json';

export interface AdaptedSkillFormat {
  kind: SkillAdapterFormat;
  payload: string;
  size: number;
}

export interface SkillAdapterState {
  formatCounts: Record<SkillAdapterFormat, number>;
}

export function createSkillAdapterState(): SkillAdapterState {
  return { formatCounts: { markdown: 0, mdx: 0, plain: 0, tokens: 0, json: 0 } };
}

export function toSkillMarkdown(value: unknown): AdaptedSkillFormat {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return { kind: 'markdown', payload, size: payload.length };
}

export function toSkillMDX(value: unknown): AdaptedSkillFormat {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return { kind: 'mdx', payload, size: payload.length };
}

export function toSkillPlain(value: unknown): AdaptedSkillFormat {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return { kind: 'plain', payload, size: payload.length };
}

export function toSkillTokens(value: unknown): AdaptedSkillFormat {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  const tokens = Math.ceil(payload.length / 4);
  return { kind: 'tokens', payload: `[${tokens} tokens]`, size: tokens };
}

export function toSkillJSON(value: unknown): AdaptedSkillFormat {
  const payload = JSON.stringify(value);
  return { kind: 'json', payload, size: payload.length };
}

export function adaptSkillFormat(state: SkillAdapterState, kind: SkillAdapterFormat): SkillAdapterState {
  return { ...state, formatCounts: { ...state.formatCounts, [kind]: state.formatCounts[kind] + 1 } };
}

export function skillAdapterHealth(state: SkillAdapterState): { total: number; formats: number; health: number } {
  const total = Object.values(state.formatCounts).reduce((s, n) => s + n, 0);
  return { total, formats: Object.values(state.formatCounts).filter((n) => n > 0).length, health: total > 0 ? 1 : 0.5 };
}
