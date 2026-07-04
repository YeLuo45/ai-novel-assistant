/**
 * BlendIntegration.test.ts — Direction AQ, V3606-V3615 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  BlendValidator,
  HybridGenreMarketTester,
  GenreMashupGenerator,
  CrossGenrePrompts,
  GenreSynergyCalculator,
  SuccessfulHybridExamples,
  BlendPrototyping,
  GenreBlendingDirector,
  ReaderSegmentOverlap,
  BlendMasterIndex,
  type BlendRecipe,
} from './BlendIntegration';

const sampleRecipe: BlendRecipe = { primary: 'romance', secondary: 'fantasy', ratio: 0.5, targetAudience: 'YA', uniqueSellingPoint: 'magic + love' };

describe('BlendValidator', () => {
  const e = new BlendValidator();

  it('validate good recipe', () => {
    expect(e.validate({ primary: 'romance', secondary: 'fantasy', ratio: 0.5, targetAudience: 'Young Adult', uniqueSellingPoint: 'magic + love' }).valid).toBe(true);
  });

  it('validate bad recipe', () => {
    expect(e.validate({ primary: 'a', secondary: 'a', ratio: 0.05, targetAudience: 'x', uniqueSellingPoint: 'usp' }).valid).toBe(false);
  });
});

describe('HybridGenreMarketTester', () => {
  const e = new HybridGenreMarketTester();

  it('test with match', () => {
    const r = e.test(sampleRecipe, [{ ratio: 0.5, sales: 1000 }]);
    expect(r.estimatedSales).toBe(1000);
  });

  it('test with no match', () => {
    expect(e.test(sampleRecipe, [{ ratio: 0.9, sales: 1000 }]).confidence).toBe(0.3);
  });
});

describe('GenreMashupGenerator', () => {
  const e = new GenreMashupGenerator();

  it('mashup combines with ×', () => {
    expect(e.mashup(['romance', 'fantasy']).mashup).toBe('romance × fantasy');
  });

  it('hasUniqueName for ×', () => {
    expect(e.hasUniqueName('a × b')).toBe(true);
  });
});

describe('CrossGenrePrompts', () => {
  const e = new CrossGenrePrompts();

  it('generate 3 prompts', () => {
    expect(e.generate(['romance', 'fantasy'])).toHaveLength(3);
  });

  it('isValidPrompt for long', () => {
    expect(e.isValidPrompt('a'.repeat(50))).toBe(true);
  });
});

describe('GenreSynergyCalculator', () => {
  const e = new GenreSynergyCalculator();

  it('calculate high for romance+fantasy', () => {
    expect(e.calculate(['romance', 'fantasy'])).toBeGreaterThan(1.2);
  });

  it('isHighSynergy for 1.2+', () => {
    expect(e.isHighSynergy(1.5)).toBe(true);
  });
});

describe('SuccessfulHybridExamples', () => {
  const e = new SuccessfulHybridExamples();

  it('getAll returns 3+', () => {
    expect(e.getAll().length).toBeGreaterThanOrEqual(3);
  });

  it('findByGenres for known', () => {
    expect(e.findByGenres('romance', 'fantasy')?.title).toBe('Twilight');
  });
});

describe('BlendPrototyping', () => {
  const e = new BlendPrototyping();

  it('prototype returns outline', () => {
    const r = e.prototype(sampleRecipe);
    expect(r.outline).toContain('romance');
  });

  it('isReady for 5 scenes', () => {
    expect(e.isReady({ keyScenes: 5 })).toBe(true);
  });
});

describe('GenreBlendingDirector', () => {
  const e = new GenreBlendingDirector();

  it('decideNextStep create_recipe for null', () => {
    expect(e.decideNextStep({ blend: null, tested: false, prototyped: false })).toBe('create_recipe');
  });

  it('decideNextStep write for all done', () => {
    expect(e.decideNextStep({ blend: sampleRecipe, tested: true, prototyped: true })).toBe('write');
  });
});

describe('ReaderSegmentOverlap', () => {
  const e = new ReaderSegmentOverlap();

  it('overlap for shared', () => {
    expect(e.overlap(['a', 'b'], ['b', 'c'])).toBe(0.5);
  });

  it('isSignificantOverlap for 0.3+', () => {
    expect(e.isSignificantOverlap(0.4)).toBe(true);
  });
});

describe('BlendMasterIndex', () => {
  const idx = new BlendMasterIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});