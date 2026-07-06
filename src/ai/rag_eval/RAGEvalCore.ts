// V5066-V5075: CQ RAG Evaluation Core Batch 1/3
// RAG evaluator + retrieval/context/answer relevance + groundedness + faithfulness + hallucination + completeness + citation

export interface RAGEvalResult {
  overall: number;
  retrieval: number;
  answer: number;
  faithfulness: number;
}

export class RAGEvaluator {
  private _results: Array<{ query: string; result: RAGEvalResult }> = [];

  record(query: string, result: RAGEvalResult): this {
    this._results.push({ query, result });
    return this;
  }

  average(): RAGEvalResult {
    if (this._results.length === 0) {
      return { overall: 0, retrieval: 0, answer: 0, faithfulness: 0 };
    }
    const sum = this._results.reduce(
      (acc, r) => ({
        overall: acc.overall + r.result.overall,
        retrieval: acc.retrieval + r.result.retrieval,
        answer: acc.answer + r.result.answer,
        faithfulness: acc.faithfulness + r.result.faithfulness
      }),
      { overall: 0, retrieval: 0, answer: 0, faithfulness: 0 }
    );
    const n = this._results.length;
    return {
      overall: sum.overall / n,
      retrieval: sum.retrieval / n,
      answer: sum.answer / n,
      faithfulness: sum.faithfulness / n
    };
  }

  count(): number { return this._results.length; }

  results(): Array<{ query: string; result: RAGEvalResult }> {
    return [...this._results];
  }

  reset(): void {
    this._results = [];
  }
}

export class RetrievalMetrics {
  private _queries: Array<{ retrieved: string[]; relevant: string[] }> = [];

  add(retrieved: string[], relevant: string[]): this {
    this._queries.push({ retrieved, relevant });
    return this;
  }

  recall(): number {
    if (this._queries.length === 0) return 0;
    let total = 0, hit = 0;
    for (const q of this._queries) {
      const rel = new Set(q.relevant);
      for (const r of q.retrieved) if (rel.has(r)) hit += 1;
      total += q.relevant.length;
    }
    return total === 0 ? 0 : hit / total;
  }

  precision(): number {
    if (this._queries.length === 0) return 0;
    let total = 0, hit = 0;
    for (const q of this._queries) {
      const rel = new Set(q.relevant);
      for (const r of q.retrieved) if (rel.has(r)) hit += 1;
      total += q.retrieved.length;
    }
    return total === 0 ? 0 : hit / total;
  }

  count(): number { return this._queries.length; }

  reset(): void {
    this._queries = [];
  }
}

export class ContextRelevance {
  score(context: string, query: string): number {
    const ctxWords = new Set(this._tokenize(context));
    const queryWords = new Set(this._tokenize(query));
    if (queryWords.size === 0) return 0;
    let overlap = 0;
    for (const w of queryWords) if (ctxWords.has(w)) overlap += 1;
    return overlap / queryWords.size;
  }

  scoreBatch(pairs: Array<{ context: string; query: string }>): number {
    if (pairs.length === 0) return 0;
    return pairs.reduce((acc, p) => acc + this.score(p.context, p.query), 0) / pairs.length;
  }

  private _tokenize(s: string): string[] {
    return s.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  }
}

export class AnswerRelevance {
  score(answer: string, query: string): number {
    const ansWords = new Set(this._tokenize(answer));
    const queryWords = new Set(this._tokenize(query));
    if (queryWords.size === 0) return 0;
    let overlap = 0;
    for (const w of queryWords) if (ansWords.has(w)) overlap += 1;
    return overlap / queryWords.size;
  }

  scoreBatch(pairs: Array<{ answer: string; query: string }>): number {
    if (pairs.length === 0) return 0;
    return pairs.reduce((acc, p) => acc + this.score(p.answer, p.query), 0) / pairs.length;
  }

  private _tokenize(s: string): string[] {
    return s.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  }
}

export class GroundednessChecker {
  // Overlap between answer and context = grounded
  score(answer: string, context: string): number {
    const ansWords = this._tokenize(answer);
    const ctxWords = new Set(this._tokenize(context));
    if (ansWords.length === 0) return 0;
    let overlap = 0;
    for (const w of ansWords) if (ctxWords.has(w)) overlap += 1;
    return overlap / ansWords.length;
  }

  isGrounded(answer: string, context: string, threshold = 0.5): boolean {
    return this.score(answer, context) >= threshold;
  }

  private _tokenize(s: string): string[] {
    return s.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  }
}

export class FaithfulnessScorer {
  // Similar to groundedness but rewards when context fully covers answer
  score(answer: string, context: string): number {
    const ansWords = this._tokenize(answer);
    const ctxWords = new Set(this._tokenize(context));
    if (ansWords.length === 0) return 1;
    let covered = 0;
    for (const w of ansWords) if (ctxWords.has(w)) covered += 1;
    return covered / ansWords.length;
  }

  isFaithful(answer: string, context: string, threshold = 0.7): boolean {
    return this.score(answer, context) >= threshold;
  }

  private _tokenize(s: string): string[] {
    return s.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  }
}

export class HallucinationDetector {
  // Detect sentences in answer not in context
  detect(answer: string, context: string, threshold = 0.4): { hallucinated: string[]; score: number } {
    const sentences = answer.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    const ctxWords = new Set(this._tokenize(context));
    const hallucinated: string[] = [];
    for (const sent of sentences) {
      const words = this._tokenize(sent);
      if (words.length === 0) continue;
      let overlap = 0;
      for (const w of words) if (ctxWords.has(w)) overlap += 1;
      const score = overlap / words.length;
      if (score < threshold) hallucinated.push(sent);
    }
    return { hallucinated, score: sentences.length === 0 ? 0 : hallucinated.length / sentences.length };
  }

  private _tokenize(s: string): string[] {
    return s.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  }
}

export class CompletenessScorer {
  score(answer: string, expected: string): number {
    const ansWords = new Set(this._tokenize(answer));
    const expWords = this._tokenize(expected);
    if (expWords.length === 0) return 0;
    let covered = 0;
    for (const w of expWords) if (ansWords.has(w)) covered += 1;
    return covered / expWords.length;
  }

  isComplete(answer: string, expected: string, threshold = 0.8): boolean {
    return this.score(answer, expected) >= threshold;
  }

  private _tokenize(s: string): string[] {
    return s.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  }
}

export class CitationTracker {
  private _citations: Map<string, string[]> = new Map();

  addCitation(answer: string, sourceId: string): this {
    const list = this._citations.get(answer) ?? [];
    list.push(sourceId);
    this._citations.set(answer, list);
    return this;
  }

  citationsFor(answer: string): string[] {
    return [...(this._citations.get(answer) ?? [])];
  }

  citedAnswers(): string[] {
    return [...this._citations.keys()];
  }

  totalCitations(): number {
    let s = 0;
    for (const list of this._citations.values()) s += list.length;
    return s;
  }
}

// V5075: RAGEvalCoreIndex
export const CQ_BATCH_1_ENGINES = [
  'RAGEvaluator', 'RetrievalMetrics', 'ContextRelevance', 'AnswerRelevance', 'GroundednessChecker',
  'FaithfulnessScorer', 'HallucinationDetector', 'CompletenessScorer', 'CitationTracker', 'RAGEvalCoreIndex'
] as const;

export class RAGEvalCoreIndex {
  list(): string[] {
    return [...CQ_BATCH_1_ENGINES];
  }

  count(): number {
    return CQ_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CQ_BATCH_1_ENGINES.includes(name as typeof CQ_BATCH_1_ENGINES[number]);
  }
}