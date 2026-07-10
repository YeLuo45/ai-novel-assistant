// V5196-V5205: CU Synthetic Data Advanced Batch 2/3
// Distribution + Coverage + Novelty + Bias + Drift + Fairness + Regeneration + Comparator + SyntheticValidator + AdvancedIndex

export class DistributionAnalyzer {
  // Compute mean + variance + skew for numeric array
  analyze(values: number[]): { mean: number; variance: number; min: number; max: number } {
    if (values.length === 0) return { mean: 0, variance: 0, min: 0, max: 0 };
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return {
      mean,
      variance,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  compare(a: number[], b: number[]): number {
    const sa = this.analyze(a);
    const sb = this.analyze(b);
    if (sa.mean === sb.mean && sa.variance === sb.variance) return 1;
    const meanDelta = Math.abs(sa.mean - sb.mean);
    const varDelta = Math.abs(sa.variance - sb.variance);
    const denom = meanDelta + varDelta + 1;
    return 1 / denom;
  }
}

export class CoverageAnalyzer {
  // % of feature space covered
  coverage(seen: Set<string>, full: Set<string>): number {
    if (full.size === 0) return 0;
    let count = 0;
    for (const s of seen) if (full.has(s)) count += 1;
    return count / full.size;
  }

  gaps(seen: Set<string>, full: Set<string>): string[] {
    return [...full].filter(s => !seen.has(s));
  }

  recordSeen(item: string, store: Set<string>): Set<string> {
    store.add(item);
    return store;
  }
}

export class NoveltyScorer {
  score(candidate: string, existing: string[]): number {
    if (existing.length === 0) return 1;
    let maxSimilarity = 0;
    for (const e of existing) {
      const sim = this._similarity(candidate, e);
      if (sim > maxSimilarity) maxSimilarity = sim;
    }
    return 1 - maxSimilarity;
  }

  private _similarity(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/));
    const bWords = new Set(b.toLowerCase().split(/\s+/));
    if (aWords.size === 0 || bWords.size === 0) return 0;
    let overlap = 0;
    for (const w of aWords) if (bWords.has(w)) overlap += 1;
    return overlap / Math.sqrt(aWords.size * bWords.size);
  }

  isNovel(candidate: string, existing: string[], threshold = 0.7): boolean {
    return this.score(candidate, existing) >= threshold;
  }
}

export class BiasDetector {
  // Detect class imbalance ratio
  classImbalanceRatio<T>(items: T[], getKey: (item: T) => string): number {
    const counts = new Map<string, number>();
    for (const item of items) {
      const k = getKey(item);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    if (counts.size === 0) return 0;
    const values = [...counts.values()];
    return Math.max(...values) / Math.max(1, Math.min(...values));
  }

  isBiased<T>(items: T[], getKey: (item: T) => string, threshold = 2.0): boolean {
    return this.classImbalanceRatio(items, getKey) > threshold;
  }
}

export class DriftDetector {
  private _baseline: number[] = [];
  private _current: number[] = [];

  setBaseline(values: number[]): void {
    this._baseline = [...values];
  }

  addCurrent(value: number): void {
    this._current.push(value);
  }

  // PSI: sum((actual - expected) * ln(actual / expected))
  drift(): number {
    if (this._baseline.length === 0 || this._current.length === 0) return 0;
    const expected = this._baseline.reduce((a, b) => a + b, 0) / this._baseline.length;
    const actual = this._current.reduce((a, b) => a + b, 0) / this._current.length;
    if (expected === 0 || actual === 0) return 0;
    return (actual - expected) * Math.log(actual / expected);
  }

  hasDrift(threshold = 0.2): boolean {
    return Math.abs(this.drift()) > threshold;
  }
}

export class FairnessScorer {
  // Demographic parity difference
  demographicParity(groupA: number[], groupB: number[]): number {
    if (groupA.length === 0 || groupB.length === 0) return 0;
    const meanA = groupA.reduce((a, b) => a + b, 0) / groupA.length;
    const meanB = groupB.reduce((a, b) => a + b, 0) / groupB.length;
    return Math.abs(meanA - meanB);
  }

  isFair(groupA: number[], groupB: number[], threshold = 0.1): boolean {
    return this.demographicParity(groupA, groupB) <= threshold;
  }
}

export class RegenerationStrategy {
  // Decide whether to regenerate based on quality score
  shouldRegenerate(qualityScore: number, threshold = 0.7): boolean {
    return qualityScore < threshold;
  }

  pickStrategy(qualityScore: number): 'regenerate' | 'fix' | 'accept' {
    if (qualityScore < 0.3) return 'regenerate';
    if (qualityScore < 0.7) return 'fix';
    return 'accept';
  }
}

export class SyntheticComparator {
  compare(real: string[], synthetic: string[]): { precision: number; recall: number } {
    if (synthetic.length === 0 || real.length === 0) return { precision: 0, recall: 0 };
    const realSet = new Set(real);
    const synthSet = new Set(synthetic);
    let matched = 0;
    for (const s of synthSet) if (realSet.has(s)) matched += 1;
    const precision = matched / synthSet.size;
    const recall = matched / realSet.size;
    return { precision, recall };
  }
}

export class SyntheticValidator {
  private _rules: Map<string, (sample: unknown) => boolean> = new Map();

  addRule(name: string, rule: (sample: unknown) => boolean): this {
    this._rules.set(name, rule);
    return this;
  }

  validate(sample: unknown): { valid: boolean; failures: string[] } {
    const failures: string[] = [];
    for (const [name, rule] of this._rules.entries()) {
      if (!rule(sample)) failures.push(name);
    }
    return { valid: failures.length === 0, failures };
  }

  ruleNames(): string[] {
    return [...this._rules.keys()];
  }

  ruleCount(): number { return this._rules.size; }
}

// V5205: SynthDataAdvancedIndex
export const CU_BATCH_2_ENGINES = [
  'DistributionAnalyzer', 'CoverageAnalyzer', 'NoveltyScorer', 'BiasDetector', 'DriftDetector',
  'FairnessScorer', 'RegenerationStrategy', 'SyntheticComparator', 'SyntheticValidator', 'SynthDataAdvancedIndex'
] as const;

export class SynthDataAdvancedIndex {
  list(): string[] {
    return [...CU_BATCH_2_ENGINES];
  }

  count(): number {
    return CU_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CU_BATCH_2_ENGINES.includes(name as typeof CU_BATCH_2_ENGINES[number]);
  }
}