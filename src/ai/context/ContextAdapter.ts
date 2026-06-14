// V2294 ContextAdapter - Direction J Iter 29/30
// Format adapter (markdown/plain/tokens/json)
// Source: generic-agent
export type ContextAdapterFormat = 'markdown' | 'plain' | 'tokens' | 'json' | 'yaml';

export interface AdaptedContextFormat {
  kind: ContextAdapterFormat;
  payload: string;
  size: number;
}

export interface ContextAdapterState {
  formatCounts: Record<ContextAdapterFormat, number>;
}

export function createContextAdapterState(): ContextAdapterState {
  return { formatCounts: { markdown: 0, plain: 0, tokens: 0, json: 0, yaml: 0 } };
}

export function toContextMarkdown(value: unknown): AdaptedContextFormat {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return { kind: 'markdown', payload, size: payload.length };
}

export function toContextPlain(value: unknown): AdaptedContextFormat {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return { kind: 'plain', payload, size: payload.length };
}

export function toContextTokens(value: unknown): AdaptedContextFormat {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  const tokens = Math.ceil(payload.length / 4);
  return { kind: 'tokens', payload: `[${tokens} tokens]`, size: tokens };
}

export function toContextJSON(value: unknown): AdaptedContextFormat {
  const payload = JSON.stringify(value);
  return { kind: 'json', payload, size: payload.length };
}

export function toContextYAML(value: unknown): AdaptedContextFormat {
  const payload = JSON.stringify(value).replace(/[{}"]/g, '');
  return { kind: 'yaml', payload, size: payload.length };
}

export function adaptContextFormat(state: ContextAdapterState, kind: ContextAdapterFormat): ContextAdapterState {
  return { ...state, formatCounts: { ...state.formatCounts, [kind]: state.formatCounts[kind] + 1 } };
}

export function contextAdapterHealth(state: ContextAdapterState): { total: number; formats: number; health: number } {
  const total = Object.values(state.formatCounts).reduce((s, n) => s + n, 0);
  return { total, formats: Object.values(state.formatCounts).filter((n) => n > 0).length, health: total > 0 ? 1 : 0.5 };
}
