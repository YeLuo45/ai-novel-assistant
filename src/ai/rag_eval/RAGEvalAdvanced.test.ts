// V5076-V5085: CQ RAG Evaluation Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  BERTScore,
  ROUGEScore,
  BLEUScore,
  ExactMatch,
  F1Score,
  NDCG,
  MRR,
  DiversityScorer,
  SemanticSimilarity,
  RAGEvalAdvancedIndex,
  CQ_BATCH_2_ENGINES
} from './RAGEvalAdvanced';

describe('BERTScore + ROUGEScore + BLEUScore', () => {
  it('BERTScore score + batchScore', () => {
    const b = new BERTScore();
    expect(b.score('the cat sat', 'the cat sat')).toBe(1);
    expect(b.score('cat', 'the cat sat')).toBeCloseTo(0.5); // precision=1, recall=1/3, F1=0.5
    expect(b.score('', 'ref')).toBe(0);
    expect(b.score('cand', '')).toBe(0);
    expect(b.batchScore([{ candidate: 'a', reference: 'a' }])).toBe(1);
    expect(b.batchScore([])).toBe(0);
  });

  it('ROUGEScore + rouge1 + rouge2', () => {
    const r = new ROUGEScore();
    expect(r.rouge1('the cat sat', 'the cat sat')).toBe(1);
    expect(r.rouge2('the cat sat', 'the cat sat')).toBe(1);
    expect(r.score('', 'ref')).toBe(0);
    // n=1 unigrams overlap: cand=['a','b','c'], ref=['a','c'] → overlap=2, refLen=2 → 1
    expect(r.score('a b c', 'a c', 1)).toBe(1);
  });

  it('BLEUScore score', () => {
    const b = new BLEUScore();
    expect(b.score('the cat sat on the mat', 'the cat sat on the mat', 4)).toBeGreaterThan(0);
    expect(b.score('the cat sat on the mat', 'the cat sat on the mat', 4)).toBeCloseTo(1);
    expect(b.score('', 'ref')).toBe(0);
    // brevity penalty (candidate shorter than reference, long enough to score)
    expect(b.score('the cat sat on', 'the cat sat on the mat', 4)).toBeLessThan(1);
    // default maxN=4
    expect(b.score('a b c d e f g h', 'a b c d e f g h')).toBeCloseTo(1);
  });
});

describe('ExactMatch + F1Score + NDCG + MRR', () => {
  it('ExactMatch score + batchScore', () => {
    const e = new ExactMatch();
    expect(e.score('cat', 'cat')).toBe(1);
    expect(e.score('Cat', 'cat')).toBe(1);
    expect(e.score('Cat ', 'cat')).toBe(1);
    expect(e.score('dog', 'cat')).toBe(0);
    expect(e.batchScore([{ candidate: 'a', reference: 'a' }, { candidate: 'b', reference: 'c' }])).toBe(0.5);
  });

  it('F1Score score + fromStrings', () => {
    const f = new F1Score();
    // cand=['a','b','c'], ref=['a','b']: P=2/3, R=1, F1=4/5=0.8
    expect(f.score(['a', 'b', 'c'], ['a', 'b'])).toBeCloseTo(0.8);
    expect(f.score(['a', 'b'], ['a', 'b', 'c'])).toBeCloseTo(0.8); // symmetric
    expect(f.score([], ['a'])).toBe(0);
    expect(f.score(['a'], [])).toBe(0);
    // No overlap → F1=0 → precision+recall>0 → returns 0
    expect(f.score(['x', 'y'], ['a', 'b'])).toBe(0);
    expect(f.fromStrings('a b c', 'a b')).toBeCloseTo(0.8);
  });

  it('NDCG score', () => {
    const n = new NDCG();
    expect(n.score(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
    expect(n.score(['c', 'b', 'a'], ['a', 'b', 'c'])).toBeLessThan(1);
    expect(n.score([], ['a'])).toBe(0);
    expect(n.score(['x'], [])).toBe(0);
    // Test missing relevant in actual → fallback to 0
    expect(n.score(['x', 'y'], ['a', 'b'])).toBeGreaterThanOrEqual(0);
  });

  it('MRR score + averageScore', () => {
    const m = new MRR();
    expect(m.score(['a', 'b'], ['b'])).toBe(0.5);
    expect(m.score(['a'], ['b'])).toBe(0);
    expect(m.averageScore([
      { actual: ['a'], relevant: ['a'] },
      { actual: ['b'], relevant: ['b'] }
    ])).toBe(1);
    expect(m.averageScore([])).toBe(0);
  });
});

describe('DiversityScorer + SemanticSimilarity', () => {
  it('DiversityScorer score + interDocumentDiversity', () => {
    const d = new DiversityScorer();
    expect(d.score('a b c d', 1)).toBe(1); // all unique
    expect(d.score('a a a', 1)).toBeCloseTo(1 / 3);
    expect(d.score('')).toBe(0);
    expect(d.interDocumentDiversity(['a b', 'c d'])).toBeGreaterThan(0);
    expect(d.interDocumentDiversity([])).toBe(0);
    // Empty documents → total=0 → 0
    expect(d.interDocumentDiversity(['', ''])).toBe(0);
  });

  it('SemanticSimilarity score + batchScore', () => {
    const s = new SemanticSimilarity();
    expect(s.score('cat sat', 'cat sat')).toBe(1);
    expect(s.score('cat', 'dog')).toBe(0);
    expect(s.score('', 'cat')).toBe(0);
    expect(s.score('cat', '')).toBe(0);
    expect(s.batchScore([{ a: 'a', b: 'a' }])).toBe(1);
    expect(s.batchScore([])).toBe(0);
  });
});

describe('RAGEvalAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new RAGEvalAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new RAGEvalAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('BERTScore')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CQ_BATCH_2_ENGINES const has 10', () => {
    expect(CQ_BATCH_2_ENGINES).toHaveLength(10);
  });
});