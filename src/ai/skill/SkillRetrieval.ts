// V2298 SkillRetrieval - Direction K Iter 3/30
// Vector+keyword+tag hybrid skill retrieval
// Source: thunderbolt
export interface SkillHit {
  key: string;
  score: number;
  matchedOn: ('vector' | 'keyword' | 'tag')[];
}

export interface SkillRetrievalState {
  vectorIndex: Map<string, number[]>;
  keywordIndex: Map<string, Set<string>>;
  tagIndex: Map<string, Set<string>>;
}

export function createSkillRetrievalState(): SkillRetrievalState {
  return { vectorIndex: new Map(), keywordIndex: new Map(), tagIndex: new Map() };
}

export function indexSkillVector(state: SkillRetrievalState, key: string, vector: number[]): SkillRetrievalState {
  const vectorIndex = new Map(state.vectorIndex);
  vectorIndex.set(key, vector);
  return { ...state, vectorIndex };
}

export function indexSkillKeyword(state: SkillRetrievalState, key: string, text: string): SkillRetrievalState {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const keywordIndex = new Map(state.keywordIndex);
  for (const w of words) {
    const set = new Set(keywordIndex.get(w) || []);
    set.add(key);
    keywordIndex.set(w, set);
  }
  return { ...state, keywordIndex };
}

export function indexSkillTag(state: SkillRetrievalState, key: string, tag: string): SkillRetrievalState {
  const tagIndex = new Map(state.tagIndex);
  const set = new Set(tagIndex.get(tag) || []);
  set.add(key);
  tagIndex.set(tag, set);
  return { ...state, tagIndex };
}

function cosSim(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

export function retrieveSkill(state: SkillRetrievalState, query: { vector?: number[]; keywords?: string[]; tags?: string[] }, topK = 5): SkillHit[] {
  const scores = new Map<string, { score: number; matched: Set<'vector' | 'keyword' | 'tag'> }>();
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
  if (query.tags) {
    for (const t of query.tags) {
      const keys = state.tagIndex.get(t);
      if (keys) for (const k of keys) {
        const existing = scores.get(k) || { score: 0, matched: new Set() };
        existing.score += 0.4;
        existing.matched.add('tag');
        scores.set(k, existing);
      }
    }
  }
  return Array.from(scores.entries()).map(([k, v]) => ({ key: k, score: v.score, matchedOn: Array.from(v.matched) })).sort((a, b) => b.score - a.score).slice(0, topK);
}

export function skillRetrievalHealth(state: SkillRetrievalState): { vectors: number; keywords: number; tags: number; health: number } {
  return { vectors: state.vectorIndex.size, keywords: state.keywordIndex.size, tags: state.tagIndex.size, health: state.vectorIndex.size > 0 ? 1 : 0.5 };
}
