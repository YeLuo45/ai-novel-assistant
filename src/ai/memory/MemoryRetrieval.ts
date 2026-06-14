// V2148 MemoryRetrieval - Direction F Iter 3/30
// Vector + keyword hybrid retrieval
// Source: thunderbolt
export interface RetrievalResult {
  id: string;
  score: number;
  reason: 'vector' | 'keyword' | 'hybrid';
}

export interface RetrievalState {
  documents: Map<string, { content: string; vec: number[] }>;
  queryCount: number;
}

export function createRetrievalState(): RetrievalState {
  return { documents: new Map(), queryCount: 0 };
}

function hashVec(s: string, dim = 16): number[] {
  const out: number[] = new Array(dim).fill(0);
  for (let i = 0; i < s.length; i++) {
    out[i % dim] += s.charCodeAt(i) * (i + 1);
  }
  // Normalize to unit vector
  let norm = 0;
  for (const v of out) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < out.length; i++) out[i] = out[i] / norm;
  return out;
}

export function indexDocument(state: RetrievalState, id: string, content: string): RetrievalState {
  const documents = new Map(state.documents);
  documents.set(id, { content, vec: hashVec(content) });
  return { ...state, documents };
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  if (d < 0.01) return 0;
  return Math.max(0, Math.min(1, dot / d));
}

function keywordScore(content: string, query: string): number {
  const words = query.toLowerCase().split(/\s+/);
  const lower = content.toLowerCase();
  return words.filter((w) => w.length > 0 && lower.includes(w)).length / Math.max(1, words.length);
}

export function retrieve(state: RetrievalState, query: string, topK = 5): RetrievalState & { results: RetrievalResult[] } {
  const qVec = hashVec(query);
  const results: RetrievalResult[] = [];
  for (const [id, doc] of state.documents) {
    const vScore = cosineSim(qVec, doc.vec);
    const kScore = keywordScore(doc.content, query);
    const vHigh = vScore > 0.95;
    const kHigh = kScore > 0.3;
    if (kHigh && !vHigh) {
      results.push({ id, score: kScore, reason: 'keyword' });
    } else if (vHigh && !kHigh) {
      results.push({ id, score: vScore, reason: 'vector' });
    } else if (vHigh && kHigh) {
      results.push({ id, score: 0.5 * vScore + 0.5 * kScore, reason: 'hybrid' });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return { ...state, queryCount: state.queryCount + 1, results: results.slice(0, topK) } as any;
}

export function docCount(state: RetrievalState): number {
  return state.documents.size;
}

export function retrievalHealth(state: RetrievalState): { docs: number; queries: number; health: number } {
  return { docs: state.documents.size, queries: state.queryCount, health: state.documents.size > 0 ? 1 : 0.5 };
}
