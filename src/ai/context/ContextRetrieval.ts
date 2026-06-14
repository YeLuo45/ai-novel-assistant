// V2268 ContextRetrieval - Direction J Iter 3/30
// Vector+keyword+graph hybrid retrieval
// Source: thunderbolt
export interface RetrievalHit {
  key: string;
  score: number;
  matchedOn: ('vector' | 'keyword' | 'graph')[];
}

export interface ContextRetrievalState {
  vectorIndex: Map<string, number[]>;
  keywordIndex: Map<string, Set<string>>; // keyword → keys
  graphEdges: Map<string, Set<string>>; // key → connected keys
}

export function createContextRetrievalState(): ContextRetrievalState {
  return { vectorIndex: new Map(), keywordIndex: new Map(), graphEdges: new Map() };
}

export function indexVector(state: ContextRetrievalState, key: string, vector: number[]): ContextRetrievalState {
  const vectorIndex = new Map(state.vectorIndex);
  vectorIndex.set(key, vector);
  return { ...state, vectorIndex };
}

export function indexKeyword(state: ContextRetrievalState, key: string, text: string): ContextRetrievalState {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const keywordIndex = new Map(state.keywordIndex);
  for (const w of words) {
    const set = new Set(keywordIndex.get(w) || []);
    set.add(key);
    keywordIndex.set(w, set);
  }
  return { ...state, keywordIndex };
}

export function indexGraphEdge(state: ContextRetrievalState, from: string, to: string): ContextRetrievalState {
  const graphEdges = new Map(state.graphEdges);
  const set = new Set(graphEdges.get(from) || []);
  set.add(to);
  graphEdges.set(from, set);
  return { ...state, graphEdges };
}

function cosSim(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

export function retrieveContext(state: ContextRetrievalState, query: { vector?: number[]; keywords?: string[]; graphKey?: string }, topK = 5): RetrievalHit[] {
  const scores = new Map<string, { score: number; matched: Set<'vector' | 'keyword' | 'graph'> }>();
  if (query.vector) {
    for (const [k, v] of state.vectorIndex) {
      const s = cosSim(query.vector, v);
      if (s > 0.5) {
        const existing = scores.get(k) || { score: 0, matched: new Set() };
        existing.score += s;
        existing.matched.add('vector');
        scores.set(k, existing);
      }
    }
  }
  if (query.keywords) {
    for (const w of query.keywords) {
      const keys = state.keywordIndex.get(w.toLowerCase());
      if (keys) for (const k of keys) {
        const existing = scores.get(k) || { score: 0, matched: new Set() };
        existing.score += 0.3;
        existing.matched.add('keyword');
        scores.set(k, existing);
      }
    }
  }
  if (query.graphKey) {
    const connected = state.graphEdges.get(query.graphKey) || new Set();
    for (const k of connected) {
      const existing = scores.get(k) || { score: 0, matched: new Set() };
      existing.score += 0.2;
      existing.matched.add('graph');
      scores.set(k, existing);
    }
  }
  return Array.from(scores.entries()).map(([k, v]) => ({ key: k, score: v.score, matchedOn: Array.from(v.matched) })).sort((a, b) => b.score - a.score).slice(0, topK);
}

export function contextRetrievalHealth(state: ContextRetrievalState): { vectors: number; keywords: number; edges: number; health: number } {
  return { vectors: state.vectorIndex.size, keywords: state.keywordIndex.size, edges: state.graphEdges.size, health: state.vectorIndex.size > 0 ? 1 : 0.5 };
}
