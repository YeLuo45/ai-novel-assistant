// V5186-V5195: CU Synthetic Data Generation Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  SyntheticGenerator,
  TemplateSynthesizer,
  DiversityFilter,
  QualityValidator,
  PrivacyFilter,
  StatisticalMatcher,
  SchemaGenerator,
  SampleAugmenter,
  Balancer,
  SeedManager,
  SynthDataCoreIndex,
  CU_BATCH_1_ENGINES
} from './SyntheticDataCore';

describe('SyntheticGenerator + TemplateSynthesizer', () => {
  it('SyntheticGenerator registerTemplate + generate + batch + names + count', () => {
    const g = new SyntheticGenerator();
    g.registerTemplate('greeting', 'Hello, {name}!');
    expect(g.generate('greeting', { name: 'Alice' })).toBe('Hello, Alice!');
    expect(g.generate('missing', {})).toBe('');
    expect(g.generateBatch('greeting', [{ name: 'A' }, { name: 'B' }])).toEqual(['Hello, A!', 'Hello, B!']);
    expect(g.templateNames()).toEqual(['greeting']);
    expect(g.templateCount()).toBe(1);
  });

  it('TemplateSynthesizer fillDefaults + detectVars + substitute', () => {
    const s = new TemplateSynthesizer();
    expect(s.fillDefaults('Hi {name}, age {age}', { name: 'Bob' })).toBe('Hi Bob, age {age}');
    expect(s.detectVars('Hi {name}, age {age}').sort()).toEqual(['age', 'name']);
    expect(s.substitute('Hi {name}', { name: 'X' })).toBe('Hi X');
    expect(s.substitute('Hi {name}', {})).toBe('Hi {name}');
  });
});

describe('DiversityFilter + QualityValidator + PrivacyFilter', () => {
  it('DiversityFilter score + filter + isDiverse', () => {
    const f = new DiversityFilter();
    expect(f.score(['a', 'b', 'c'])).toBe(1);
    expect(f.score(['a', 'a', 'a'])).toBeCloseTo(1 / 3);
    expect(f.score([])).toBe(0);
    expect(f.filter(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    expect(f.isDiverse(['a', 'b', 'c'])).toBe(true);
    expect(f.isDiverse(['a', 'a'], 0.6)).toBe(false);
  });

  it('QualityValidator score + isValid + validateBatch', () => {
    const q = new QualityValidator();
    expect(q.score('the cat sat')).toBe(1); // all unique
    expect(q.score('the the the')).toBeCloseTo(1 / 3);
    expect(q.score('')).toBe(0);
    expect(q.isValid('the cat sat')).toBe(true);
    expect(q.isValid('a a a a a', 0.5)).toBe(false); // 1/5 = 0.2 < 0.5
    expect(q.validateBatch(['good text', 'a a a a a']).length).toBe(1);
  });

  it('PrivacyFilter hasPII + redact + filter', () => {
    const p = new PrivacyFilter();
    expect(p.hasPII('Call 555-123-4567')).toBe(false); // not SSN format
    expect(p.hasPII('SSN 123-45-6789')).toBe(true);
    expect(p.hasPII('Email: test@example.com')).toBe(true);
    expect(p.hasPII('No PII here')).toBe(false);
    const redacted = p.redact('SSN 123-45-6789 and email test@example.com');
    expect(redacted).toContain('[REDACTED]');
    expect(p.filter(['clean', 'SSN 123-45-6789'])).toEqual(['clean']);
  });
});

describe('StatisticalMatcher + SchemaGenerator + SampleAugmenter + Balancer + SeedManager', () => {
  it('StatisticalMatcher matchDistributions + matchVariances', () => {
    const s = new StatisticalMatcher();
    expect(s.matchDistributions([1, 2, 3], [1, 2, 3])).toBe(1);
    expect(s.matchDistributions([0, 0, 0], [10, 10, 10])).toBe(0);
    expect(s.matchDistributions([], [])).toBe(0);
    expect(s.matchVariances([1, 2, 3], [1, 2, 3])).toBe(1);
  });

  it('SchemaGenerator addField + generate + batch + fieldNames + fieldTypes', () => {
    const s = new SchemaGenerator();
    s.addField('name', 'string').addField('age', 'number').addField('active', 'boolean');
    const row = s.generate();
    expect(typeof row.name).toBe('string');
    expect(typeof row.age).toBe('number');
    expect(typeof row.active).toBe('boolean');
    const batch = s.generateBatch(5);
    expect(batch).toHaveLength(5);
    expect(s.fieldNames()).toEqual(['name', 'age', 'active']);
    expect(s.fieldTypes()).toEqual(['string', 'number', 'boolean']);
  });

  it('SampleAugmenter paraphrase + synonymReplace + augmentBatch', () => {
    const a = new SampleAugmenter();
    expect(a.paraphrase('hi')).toBe('hi'); // too short
    expect(a.paraphrase('a b c d').split(' ').length).toBe(4);
    expect(a.synonymReplace('the cat', { cat: 'dog' })).toBe('the dog');
    expect(a.augmentBatch(['hello world']).length).toBe(2);
  });

  it('Balancer balance + classCounts', () => {
    const b = new Balancer();
    const items = [
      { c: 'A' }, { c: 'A' }, { c: 'A' },
      { c: 'B' }, { c: 'B' }
    ];
    const balanced = b.balance(items, x => x.c);
    expect(balanced.length).toBe(4); // min(3, 2) * 2 classes
    const counts = b.classCounts(items, x => x.c);
    expect(counts.get('A')).toBe(3);
    expect(counts.get('B')).toBe(2);
  });

  it('SeedManager setSeed + getSeed + next + reset', () => {
    const s = new SeedManager(42);
    expect(s.getSeed()).toBe(42);
    s.setSeed(100);
    expect(s.getSeed()).toBe(100);
    const n1 = s.next();
    expect(typeof n1).toBe('number');
    s.reset();
    expect(s.getSeed()).toBe(42);
  });
});

describe('SynthDataCoreIndex', () => {
  it('list has 11', () => {
    expect(new SynthDataCoreIndex().list()).toHaveLength(11);
  });

  it('count + engines + has', () => {
    const idx = new SynthDataCoreIndex();
    expect(idx.count()).toBe(11);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('SyntheticGenerator')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CU_BATCH_1_ENGINES const has 11', () => {
    expect(CU_BATCH_1_ENGINES).toHaveLength(11);
  });
});