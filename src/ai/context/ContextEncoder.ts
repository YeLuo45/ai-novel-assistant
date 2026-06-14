// V2266 ContextEncoder - Direction J Iter 1/30
// Encode context to compact wire format
// Source: thunderbolt
export interface EncodedContext {
  raw: string;
  hash: string;
  tokens: number;
  modality: 'text' | 'json' | 'binary' | 'embedding';
  ts: number;
}

export interface ContextEncoderState {
  encodings: Map<string, EncodedContext>;
  counter: number;
}

export function createContextEncoderState(): ContextEncoderState {
  return { encodings: new Map(), counter: 0 };
}

function fnv1a(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

export function encodeContext(state: ContextEncoderState, raw: string, modality: 'text' | 'json' | 'binary' | 'embedding' = 'text'): { state: ContextEncoderState; ctx: EncodedContext } {
  state.counter++;
  const ctx: EncodedContext = { raw, hash: fnv1a(raw), tokens: estimateTokens(raw), modality, ts: Date.now() };
  const encodings = new Map(state.encodings);
  encodings.set(raw, ctx);
  return { state: { ...state, encodings }, ctx };
}

export function getEncodedContext(state: ContextEncoderState, raw: string): EncodedContext | undefined {
  return state.encodings.get(raw);
}

export function contextCount(state: ContextEncoderState): number {
  return state.encodings.size;
}

export function contextsByModality(state: ContextEncoderState, modality: string): EncodedContext[] {
  return Array.from(state.encodings.values()).filter((c) => c.modality === modality);
}

export function contextEncoderHealth(state: ContextEncoderState): { count: number; health: number } {
  return { count: state.encodings.size, health: state.encodings.size > 0 ? 1 : 0.5 };
}
