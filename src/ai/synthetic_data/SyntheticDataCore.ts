// V5186-V5195: CU Synthetic Data Generation Core Batch 1/3
// Generator + Template + Diversity + Quality + Privacy + StatMatch + Schema + Augmenter + Balancer + SeedManager

export class SyntheticGenerator {
  private _templates: Map<string, string> = new Map();

  registerTemplate(name: string, template: string): this {
    this._templates.set(name, template);
    return this;
  }

  generate(templateName: string, vars: Record<string, string>): string {
    const template = this._templates.get(templateName);
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  }

  generateBatch(templateName: string, varsList: Array<Record<string, string>>): string[] {
    return varsList.map(vars => this.generate(templateName, vars));
  }

  templateNames(): string[] {
    return [...this._templates.keys()];
  }

  templateCount(): number { return this._templates.size; }
}

export class TemplateSynthesizer {
  // Fill missing values based on most common
  fillDefaults(template: string, defaults: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => defaults[key] ?? `{${key}}`);
  }

  detectVars(template: string): string[] {
    const vars = new Set<string>();
    for (const m of template.matchAll(/\{(\w+)\}/g)) vars.add(m[1]);
    return [...vars];
  }

  substitute(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  }
}

export class DiversityFilter {
  score(samples: string[]): number {
    if (samples.length === 0) return 0;
    const unique = new Set(samples);
    return unique.size / samples.length;
  }

  filter(samples: string[], threshold = 0.5): string[] {
    const seen = new Set<string>();
    return samples.filter(s => {
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  }

  isDiverse(samples: string[], threshold = 0.5): boolean {
    return this.score(samples) >= threshold;
  }
}

export class QualityValidator {
  score(text: string): number {
    if (!text || text.length === 0) return 0;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;
    const unique = new Set(words).size;
    return unique / words.length;
  }

  isValid(text: string, minScore = 0.3): boolean {
    return this.score(text) >= minScore;
  }

  validateBatch(samples: string[], minScore = 0.3): string[] {
    return samples.filter(s => this.isValid(s, minScore));
  }
}

export class PrivacyFilter {
  private _piiPatterns: RegExp[];

  constructor() {
    this._piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
      /\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g // Email
    ];
  }

  hasPII(text: string): boolean {
    return this._piiPatterns.some(p => p.test(text));
  }

  redact(text: string): string {
    let result = text;
    for (const p of this._piiPatterns) {
      result = result.replace(p, '[REDACTED]');
    }
    return result;
  }

  filter(samples: string[]): string[] {
    return samples.filter(s => !this.hasPII(s));
  }
}

export class StatisticalMatcher {
  // Match distribution means
  matchDistributions(real: number[], synthetic: number[]): number {
    if (real.length === 0 || synthetic.length === 0) return 0;
    const meanReal = real.reduce((a, b) => a + b, 0) / real.length;
    const meanSynthetic = synthetic.reduce((a, b) => a + b, 0) / synthetic.length;
    const denom = Math.max(Math.abs(meanReal), Math.abs(meanSynthetic), 1);
    return 1 - Math.abs(meanReal - meanSynthetic) / denom;
  }

  matchVariances(real: number[], synthetic: number[]): number {
    if (real.length === 0 || synthetic.length === 0) return 0;
    const meanR = real.reduce((a, b) => a + b, 0) / real.length;
    const meanS = synthetic.reduce((a, b) => a + b, 0) / synthetic.length;
    const varR = real.reduce((a, b) => a + (b - meanR) ** 2, 0) / real.length;
    const varS = synthetic.reduce((a, b) => a + (b - meanS) ** 2, 0) / synthetic.length;
    const denom = Math.max(Math.abs(varR), Math.abs(varS), 1);
    return 1 - Math.abs(varR - varS) / denom;
  }
}

export class SchemaGenerator {
  private _fields: Map<string, string> = new Map();

  addField(name: string, type: 'string' | 'number' | 'boolean'): this {
    this._fields.set(name, type);
    return this;
  }

  generate(): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    for (const [name, type] of this._fields.entries()) {
      switch (type) {
        case 'string': result[name] = `value_${name}`; break;
        case 'number': result[name] = Math.random() * 100; break;
        case 'boolean': result[name] = Math.random() > 0.5; break;
      }
    }
    return result;
  }

  generateBatch(count: number): Array<Record<string, string | number | boolean>> {
    return Array.from({ length: count }, () => this.generate());
  }

  fieldNames(): string[] {
    return [...this._fields.keys()];
  }

  fieldTypes(): string[] {
    return [...this._fields.values()];
  }
}

export class SampleAugmenter {
  // Paraphrase by word shuffle
  paraphrase(text: string): string {
    const words = text.split(/\s+/);
    if (words.length < 3) return text;
    // Swap adjacent words
    for (let i = 0; i < words.length - 1; i += 2) {
      [words[i], words[i + 1]] = [words[i + 1], words[i]];
    }
    return words.join(' ');
  }

  synonymReplace(text: string, mapping: Record<string, string>): string {
    return text.replace(/\b\w+\b/g, word => mapping[word] ?? word);
  }

  augmentBatch(samples: string[]): string[] {
    return samples.flatMap(s => [s, this.paraphrase(s)]);
  }
}

export class Balancer {
  // Rebalance classes to equal counts
  balance<T>(items: T[], getKey: (item: T) => string): T[] {
    const groups = new Map<string, T[]>();
    for (const item of items) {
      const key = getKey(item);
      let list = groups.get(key);
      if (!list) { list = []; groups.set(key, list); }
      list.push(item);
    }
    const sizes = [...groups.values()].map(g => g.length);
    const min = sizes.length === 0 ? 0 : Math.min(...sizes);
    const result: T[] = [];
    for (const list of groups.values()) {
      result.push(...list.slice(0, min));
    }
    return result;
  }

  classCounts<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = getKey(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }
}

export class SeedManager {
  private _currentSeed: number;

  constructor(seed = 42) {
    this._currentSeed = seed;
  }

  setSeed(seed: number): void {
    this._currentSeed = seed;
  }

  getSeed(): number { return this._currentSeed; }

  next(): number {
    this._currentSeed = (this._currentSeed * 1103515245 + 12345) & 0x7fffffff;
    return this._currentSeed;
  }

  reset(): void {
    this._currentSeed = 42;
  }
}

// V5195: SynthDataCoreIndex
export const CU_BATCH_1_ENGINES = [
  'SyntheticGenerator', 'TemplateSynthesizer', 'DiversityFilter', 'QualityValidator', 'PrivacyFilter',
  'StatisticalMatcher', 'SchemaGenerator', 'SampleAugmenter', 'Balancer', 'SeedManager', 'SynthDataCoreIndex'
] as const;

export class SynthDataCoreIndex {
  list(): string[] {
    return [...CU_BATCH_1_ENGINES];
  }

  count(): number {
    return CU_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CU_BATCH_1_ENGINES.includes(name as typeof CU_BATCH_1_ENGINES[number]);
  }
}