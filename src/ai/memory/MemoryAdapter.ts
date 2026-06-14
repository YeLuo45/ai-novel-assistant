// V2174 MemoryAdapter - Direction F Iter 29/30
// Format adapter for different LLM contexts
// Source: generic-agent
export type FormatKind = 'json' | 'yaml' | 'markdown' | 'plain' | 'tokens';

export interface AdaptedFormat {
  kind: FormatKind;
  content: string;
  tokens: number;
}

export interface MemoryAdapterState {
  formatCounts: Record<FormatKind, number>;
}

export function createMemoryAdapterState(): MemoryAdapterState {
  return { formatCounts: { json: 0, yaml: 0, markdown: 0, plain: 0, tokens: 0 } };
}

export function toJSON(data: unknown): AdaptedFormat {
  const content = JSON.stringify(data);
  return { kind: 'json', content, tokens: content.length / 4 };
}

export function toYAML(data: unknown): AdaptedFormat {
  // Simple YAML conversion
  const lines: string[] = [];
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      lines.push(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    }
  }
  const content = lines.join('\n');
  return { kind: 'yaml', content, tokens: content.length / 4 };
}

export function toMarkdown(data: unknown): AdaptedFormat {
  if (typeof data === 'string') return { kind: 'markdown', content: data, tokens: data.length / 4 };
  if (data && typeof data === 'object') {
    const lines: string[] = ['# Memory\n'];
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      lines.push(`- **${k}**: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    }
    const content = lines.join('\n');
    return { kind: 'markdown', content, tokens: content.length / 4 };
  }
  return { kind: 'markdown', content: String(data), tokens: 1 };
}

export function toPlain(data: unknown): AdaptedFormat {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return { kind: 'plain', content, tokens: content.length / 4 };
}

export function toTokens(text: string, tokensPerWord = 0.75): AdaptedFormat {
  const tokens = Math.ceil(text.split(/\s+/).length * tokensPerWord);
  return { kind: 'tokens', content: text, tokens };
}

export function adaptFormat(state: MemoryAdapterState, kind: FormatKind, data: unknown): MemoryAdapterState {
  return { ...state, formatCounts: { ...state.formatCounts, [kind]: state.formatCounts[kind] + 1 } };
}

export function memoryAdapterHealth(state: MemoryAdapterState): { total: number; formats: number; health: number } {
  const total = Object.values(state.formatCounts).reduce((s, n) => s + n, 0);
  return { total, formats: Object.values(state.formatCounts).filter((n) => n > 0).length, health: total > 0 ? 1 : 0.5 };
}
