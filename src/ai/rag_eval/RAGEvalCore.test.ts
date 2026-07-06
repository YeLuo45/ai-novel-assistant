// V5066-V5075: CQ RAG Evaluation Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  RAGEvaluator,
  RetrievalMetrics,
  ContextRelevance,
  AnswerRelevance,
  GroundednessChecker,
  FaithfulnessScorer,
  HallucinationDetector,
  CompletenessScorer,
  CitationTracker,
  RAGEvalCoreIndex,
  CQ_BATCH_1_ENGINES
} from './RAGEvalCore';

describe('RAGEvaluator', () => {
  it('record + average + count + results + reset', () => {
    const r = new RAGEvaluator();
    r.record('q1', { overall: 0.8, retrieval: 0.9, answer: 0.7, faithfulness: 0.8 });
    r.record('q2', { overall: 0.6, retrieval: 0.5, answer: 0.7, faithfulness: 0.6 });
    const avg = r.average();
    expect(avg.overall).toBeCloseTo(0.7);
    expect(avg.retrieval).toBeCloseTo(0.7);
    expect(avg.answer).toBeCloseTo(0.7);
    expect(avg.faithfulness).toBeCloseTo(0.7);
    expect(r.count()).toBe(2);
    const results = r.results();
    expect(results).toHaveLength(2);
    expect(results[0].query).toBe('q1');
    r.reset();
    expect(r.count()).toBe(0);
    expect(r.average().overall).toBe(0);
  });
});

describe('RetrievalMetrics', () => {
  it('add + recall + precision + count + reset', () => {
    const m = new RetrievalMetrics();
    m.add(['a', 'b'], ['a', 'b', 'c']); // recall = 2/3
    m.add(['a', 'd'], ['a', 'e']); // recall = 1/2
    expect(m.recall()).toBeCloseTo(3 / 5);
    expect(m.precision()).toBeCloseTo(3 / 4);
    expect(m.count()).toBe(2);
    m.reset();
    expect(m.count()).toBe(0);
    expect(m.recall()).toBe(0);
    expect(m.precision()).toBe(0);
  });
});

describe('ContextRelevance + AnswerRelevance', () => {
  it('ContextRelevance score + batch', () => {
    const c = new ContextRelevance();
    expect(c.score('The cat sat', 'cat')).toBeCloseTo(1);
    expect(c.score('The dog ran', 'cat')).toBe(0);
    expect(c.scoreBatch([{ context: 'cat', query: 'cat' }, { context: 'dog', query: 'cat' }])).toBeCloseTo(0.5);
    expect(c.scoreBatch([])).toBe(0);
  });

  it('AnswerRelevance score + batch', () => {
    const a = new AnswerRelevance();
    expect(a.score('The cat sat', 'cat sat')).toBeCloseTo(1);
    expect(a.score('The cat sat', 'dog')).toBeCloseTo(0);
    expect(a.score('The cat sat', '')).toBe(0);
    expect(a.scoreBatch([{ answer: 'cat', query: 'cat' }])).toBe(1);
    expect(a.scoreBatch([])).toBe(0);
  });
});

describe('GroundednessChecker + FaithfulnessScorer + HallucinationDetector + CompletenessScorer', () => {
  it('GroundednessChecker score + isGrounded', () => {
    const g = new GroundednessChecker();
    expect(g.score('the cat', 'the cat sat')).toBeCloseTo(1);
    expect(g.score('the cat', 'the dog')).toBeCloseTo(0.5);
    expect(g.isGrounded('cat', 'the cat sat')).toBe(true);
    expect(g.isGrounded('cat', 'dog', 0.5)).toBe(false);
    expect(g.score('', 'ctx')).toBe(0);
  });

  it('FaithfulnessScorer score + isFaithful', () => {
    const f = new FaithfulnessScorer();
    expect(f.score('cat', 'the cat sat')).toBe(1);
    expect(f.isFaithful('cat', 'cat sat', 0.5)).toBe(true);
    expect(f.score('', 'ctx')).toBe(1); // empty answer → 1
  });

  it('HallucinationDetector detect', () => {
    const h = new HallucinationDetector();
    const r = h.detect('The cat. Random alien thing.', 'cat sat');
    expect(r.hallucinated.length).toBeGreaterThan(0);
    expect(r.score).toBeGreaterThan(0);
    const r2 = h.detect('cat sat', 'cat sat');
    expect(r2.hallucinated).toEqual([]);
    // Empty answer
    const r3 = h.detect('', 'cat');
    expect(r3.score).toBe(0);
  });

  it('CompletenessScorer score + isComplete', () => {
    const c = new CompletenessScorer();
    expect(c.score('the cat sat', 'the cat sat')).toBe(1);
    expect(c.score('the cat', 'the cat sat')).toBeCloseTo(2 / 3);
    expect(c.isComplete('cat sat', 'cat sat')).toBe(true);
    expect(c.score('', 'expected')).toBe(0);
    expect(c.score('answer', '')).toBe(0);
  });
});

describe('CitationTracker', () => {
  it('addCitation + citationsFor + citedAnswers + totalCitations', () => {
    const c = new CitationTracker();
    c.addCitation('a1', 'doc1').addCitation('a1', 'doc2').addCitation('a2', 'doc3');
    expect(c.citationsFor('a1')).toEqual(['doc1', 'doc2']);
    expect(c.citationsFor('missing')).toEqual([]);
    expect(c.citedAnswers().sort()).toEqual(['a1', 'a2']);
    expect(c.totalCitations()).toBe(3);
  });
});

describe('RAGEvalCoreIndex', () => {
  it('list has 10', () => {
    expect(new RAGEvalCoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new RAGEvalCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('RAGEvaluator')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CQ_BATCH_1_ENGINES const has 10', () => {
    expect(CQ_BATCH_1_ENGINES).toHaveLength(10);
  });
});