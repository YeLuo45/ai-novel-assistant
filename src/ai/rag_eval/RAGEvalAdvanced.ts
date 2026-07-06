// V5076-V5085: CQ RAG Evaluation Advanced Batch 2/3
// BERT + ROUGE + BLEU + ExactMatch + F1 + NDCG + MRR + Diversity + semantic similarity

export class BERTScore {
  // Mock BERTScore: token-level F1 with weighted length penalty
  score(candidate: string, reference: string): number {
    const candTokens = candidate.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const refTokens = reference.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (candTokens.length === 0 || refTokens.length === 0) return 0;
    const refSet = new Set(refTokens);
    let overlap = 0;
    for (const t of candTokens) if (refSet.has(t)) overlap += 1;
    const precision = overlap / candTokens.length;
    const recall = overlap / refTokens.length;
    if (precision + recall === 0) return 0;
    return 2 * precision * recall / (precision + recall);
  }

  batchScore(pairs: Array<{ candidate: string; reference: string }>): number {
    if (pairs.length === 0) return 0;
    return pairs.reduce((acc, p) => acc + this.score(p.candidate, p.reference), 0) / pairs.length;
  }
}

export class ROUGEScore {
  score(candidate: string, reference: string, n = 2): number {
    const candNgrams = this._ngrams(candidate, n);
    const refNgrams = this._ngrams(reference, n);
    if (refNgrams.length === 0) return 0;
    let overlap = 0;
    const refSet = new Set(refNgrams);
    for (const ng of candNgrams) if (refSet.has(ng)) overlap += 1;
    return overlap / refNgrams.length;
  }

  rouge1(candidate: string, reference: string): number { return this.score(candidate, reference, 1); }
  rouge2(candidate: string, reference: string): number { return this.score(candidate, reference, 2); }

  private _ngrams(text: string, n: number): string[] {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const grams: string[] = [];
    for (let i = 0; i + n <= words.length; i++) {
      grams.push(words.slice(i, i + n).join(' '));
    }
    return grams;
  }
}

export class BLEUScore {
  score(candidate: string, reference: string, maxN = 4): number {
    let logSum = 0;
    for (let n = 1; n <= maxN; n++) {
      const candNgrams = this._ngrams(candidate, n);
      const refNgrams = this._ngrams(reference, n);
      if (candNgrams.length === 0) return 0;
      let overlap = 0;
      const refSet = new Set(refNgrams);
      for (const ng of candNgrams) if (refSet.has(ng)) overlap += 1;
      const precision = overlap / candNgrams.length;
      if (precision === 0) return 0;
      logSum += Math.log(precision);
    }
    const bp = this._brevityPenalty(candidate, reference);
    return bp * Math.exp(logSum / maxN);
  }

  private _ngrams(text: string, n: number): string[] {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const grams: string[] = [];
    for (let i = 0; i + n <= words.length; i++) grams.push(words.slice(i, i + n).join(' '));
    return grams;
  }

  private _brevityPenalty(candidate: string, reference: string): number {
    const cLen = candidate.split(/\s+/).length;
    const rLen = reference.split(/\s+/).length;
    if (cLen >= rLen) return 1;
    return Math.exp(1 - rLen / Math.max(1, cLen));
  }
}

export class ExactMatch {
  score(candidate: string, reference: string): number {
    return candidate.trim().toLowerCase() === reference.trim().toLowerCase() ? 1 : 0;
  }

  batchScore(pairs: Array<{ candidate: string; reference: string }>): number {
    if (pairs.length === 0) return 0;
    return pairs.reduce((acc, p) => acc + this.score(p.candidate, p.reference), 0) / pairs.length;
  }
}

export class F1Score {
  score(candidateTokens: string[], referenceTokens: string[]): number {
    if (candidateTokens.length === 0 || referenceTokens.length === 0) return 0;
    const refSet = new Set(referenceTokens);
    let overlap = 0;
    for (const t of candidateTokens) if (refSet.has(t)) overlap += 1;
    const precision = overlap / candidateTokens.length;
    const recall = overlap / referenceTokens.length;
    if (precision + recall === 0) return 0;
    return 2 * precision * recall / (precision + recall);
  }

  fromStrings(candidate: string, reference: string): number {
    return this.score(
      candidate.toLowerCase().split(/\s+/).filter(w => w.length > 0),
      reference.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    );
  }
}

export class NDCG {
  score(actual: string[], ideal: string[]): number {
    if (ideal.length === 0) return 0;
    const relevance = new Map<string, number>();
    for (let i = 0; i < ideal.length; i++) {
      relevance.set(ideal[i], ideal.length - i);
    }
    let dcg = 0;
    for (let i = 0; i < actual.length; i++) {
      const rel = relevance.get(actual[i]) ?? 0;
      dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
    }
    let idcg = 0;
    for (let i = 0; i < ideal.length; i++) {
      const rel = ideal.length - i;
      idcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
    }
    return idcg === 0 ? 0 : dcg / idcg;
  }
}

export class MRR {
  score(actual: string[], relevant: string[]): number {
    const rel = new Set(relevant);
    for (let i = 0; i < actual.length; i++) {
      if (rel.has(actual[i])) return 1 / (i + 1);
    }
    return 0;
  }

  averageScore(queries: Array<{ actual: string[]; relevant: string[] }>): number {
    if (queries.length === 0) return 0;
    return queries.reduce((acc, q) => acc + this.score(q.actual, q.relevant), 0) / queries.length;
  }
}

export class DiversityScorer {
  // Measure unique n-grams / total n-grams
  score(text: string, n = 1): number {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    const ngrams: string[] = [];
    for (let i = 0; i + n <= words.length; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    return new Set(ngrams).size / ngrams.length;
  }

  interDocumentDiversity(documents: string[], n = 1): number {
    if (documents.length === 0) return 0;
    const allNgrams = new Set<string>();
    let total = 0;
    for (const doc of documents) {
      const words = doc.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      for (let i = 0; i + n <= words.length; i++) {
        const ng = words.slice(i, i + n).join(' ');
        allNgrams.add(ng);
        total += 1;
      }
    }
    return total === 0 ? 0 : allNgrams.size / total;
  }
}

export class SemanticSimilarity {
  // Token overlap as proxy
  score(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 0));
    const bWords = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 0));
    if (aWords.size === 0 || bWords.size === 0) return 0;
    let overlap = 0;
    for (const w of aWords) if (bWords.has(w)) overlap += 1;
    return overlap / Math.sqrt(aWords.size * bWords.size);
  }

  batchScore(pairs: Array<{ a: string; b: string }>): number {
    if (pairs.length === 0) return 0;
    return pairs.reduce((acc, p) => acc + this.score(p.a, p.b), 0) / pairs.length;
  }
}

// V5085: RAGEvalAdvancedIndex
export const CQ_BATCH_2_ENGINES = [
  'BERTScore', 'ROUGEScore', 'BLEUScore', 'ExactMatch', 'F1Score',
  'NDCG', 'MRR', 'DiversityScorer', 'SemanticSimilarity', 'RAGEvalAdvancedIndex'
] as const;

export class RAGEvalAdvancedIndex {
  list(): string[] {
    return [...CQ_BATCH_2_ENGINES];
  }

  count(): number {
    return CQ_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CQ_BATCH_2_ENGINES.includes(name as typeof CQ_BATCH_2_ENGINES[number]);
  }
}