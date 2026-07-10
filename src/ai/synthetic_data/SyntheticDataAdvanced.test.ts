// V5196-V5205: CU Synthetic Data Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  DistributionAnalyzer,
  CoverageAnalyzer,
  NoveltyScorer,
  BiasDetector,
  DriftDetector,
  FairnessScorer,
  RegenerationStrategy,
  SyntheticComparator,
  SyntheticValidator,
  SynthDataAdvancedIndex,
  CU_BATCH_2_ENGINES
} from './SyntheticDataAdvanced';

describe('DistributionAnalyzer + CoverageAnalyzer', () => {
  it('DistributionAnalyzer analyze + compare', () => {
    const d = new DistributionAnalyzer();
    const r = d.analyze([1, 2, 3, 4, 5]);
    expect(r.mean).toBe(3);
    expect(r.min).toBe(1);
    expect(r.max).toBe(5);
    expect(d.analyze([])).toEqual({ mean: 0, variance: 0, min: 0, max: 0 });
    expect(d.compare([1, 2], [1, 2])).toBe(1);
    expect(d.compare([1, 2], [10, 20])).toBeLessThan(1);
    expect(d.compare([1, 2], [1, 2, 3])).toBeLessThan(1); // different variance
  });

  it('CoverageAnalyzer coverage + gaps + recordSeen', () => {
    const c = new CoverageAnalyzer();
    const full = new Set(['a', 'b', 'c', 'd']);
    const seen = new Set(['a', 'b']);
    expect(c.coverage(seen, full)).toBe(0.5);
    expect(c.gaps(seen, full)).toEqual(['c', 'd']);
    expect(c.coverage(new Set(), full)).toBe(0);
    c.recordSeen('e', seen);
    expect(seen.has('e')).toBe(true);
  });
});

describe('NoveltyScorer + BiasDetector + DriftDetector', () => {
  it('NoveltyScorer score + isNovel', () => {
    const n = new NoveltyScorer();
    expect(n.score('the cat sat', [])).toBe(1);
    expect(n.score('the cat', ['the cat sat'])).toBeLessThan(1);
    // Completely different words → high novelty
    expect(n.isNovel('quantum physics research', ['cooking recipe ingredients'], 0.7)).toBe(true);
    // Identical text → similarity = 1 → novelty = 0 → not novel
    expect(n.isNovel('existing content here', ['existing content here'], 0.5)).toBe(false);
  });

  it('BiasDetector classImbalanceRatio + isBiased', () => {
    const b = new BiasDetector();
    type Item = { c: string };
    const items: Item[] = [{ c: 'A' }, { c: 'A' }, { c: 'B' }];
    expect(b.classImbalanceRatio(items, (x: Item) => x.c)).toBe(2);
    const biased: Item[] = [{ c: 'A' }, { c: 'A' }, { c: 'A' }, { c: 'B' }];
    expect(b.isBiased(biased, (x: Item) => x.c, 2.5)).toBe(true);
    const balanced: Item[] = [{ c: 'A' }, { c: 'B' }];
    expect(b.isBiased(balanced, (x: Item) => x.c)).toBe(false);
    expect(b.classImbalanceRatio([] as Item[], (x: Item) => x.c)).toBe(0);
  });

  it('DriftDetector setBaseline + addCurrent + drift + hasDrift', () => {
    const d = new DriftDetector();
    d.setBaseline([10, 10, 10, 10]);
    d.addCurrent(20); d.addCurrent(20);
    expect(Math.abs(d.drift())).toBeGreaterThan(0);
    expect(d.hasDrift(0.1)).toBe(true);
    expect(d.hasDrift(10)).toBe(false);
    expect(new DriftDetector().drift()).toBe(0);
  });
});

describe('FairnessScorer + RegenerationStrategy + SyntheticComparator + SyntheticValidator', () => {
  it('FairnessScorer demographicParity + isFair', () => {
    const f = new FairnessScorer();
    expect(f.demographicParity([1, 1, 1], [1, 1, 1])).toBe(0);
    expect(f.demographicParity([1, 2, 3], [4, 5, 6])).toBe(3);
    expect(f.demographicParity([], [])).toBe(0);
    expect(f.isFair([1, 1], [1, 1.05], 0.1)).toBe(true);
  });

  it('RegenerationStrategy shouldRegenerate + pickStrategy', () => {
    const r = new RegenerationStrategy();
    expect(r.shouldRegenerate(0.5)).toBe(true);
    expect(r.shouldRegenerate(0.8)).toBe(false);
    expect(r.pickStrategy(0.1)).toBe('regenerate');
    expect(r.pickStrategy(0.5)).toBe('fix');
    expect(r.pickStrategy(0.9)).toBe('accept');
  });

  it('SyntheticComparator compare', () => {
    const c = new SyntheticComparator();
    const r = c.compare(['a', 'b'], ['a', 'b']);
    expect(r.precision).toBe(1);
    expect(r.recall).toBe(1);
    const r2 = c.compare(['a', 'b', 'c'], ['a', 'b', 'x']);
    expect(r2.precision).toBeCloseTo(2 / 3);
    expect(c.compare([], [])).toEqual({ precision: 0, recall: 0 });
  });

  it('SyntheticValidator addRule + validate + names + count', () => {
    const v = new SyntheticValidator();
    v.addRule('isString', (x: unknown) => typeof x === 'string');
    v.addRule('notEmpty', (x: unknown) => typeof x === 'string' && x.length > 0);
    const r1 = v.validate('hello');
    expect(r1.valid).toBe(true);
    expect(r1.failures).toEqual([]);
    const r2 = v.validate(42); // not string → both fail
    expect(r2.valid).toBe(false);
    expect(r2.failures.length).toBe(2);
    expect(r2.failures).toContain('isString');
    expect(r2.failures).toContain('notEmpty');
    expect(v.ruleNames()).toEqual(['isString', 'notEmpty']);
    expect(v.ruleCount()).toBe(2);
  });
});

describe('SynthDataAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new SynthDataAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new SynthDataAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('DistributionAnalyzer')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CU_BATCH_2_ENGINES const has 10', () => {
    expect(CU_BATCH_2_ENGINES).toHaveLength(10);
  });
});