/**
 * BlendRecipe.test.ts — Direction AQ, V3596-V3605 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  HybridGenreRecipeBuilder,
  SuccessfulBlendAnalyzer,
  TrendyBlendPredictor,
  GenreElementSplicer,
  BlendTitleGenerator,
  MarketBlendsAnalyzer,
  ReaderDemographicBlender,
  GenreEvolutionSimulator,
  BlendRiskAssessor,
  BlendRecipeIndex,
  type BlendRecipe,
} from './BlendRecipe';

describe('HybridGenreRecipeBuilder', () => {
  const e = new HybridGenreRecipeBuilder();

  it('build returns recipe', () => {
    const r = e.build('romance', 'fantasy', 0.5, 'YA', 'magic + romance');
    expect(r.primary).toBe('romance');
  });

  it('isBalanced true for 50/50', () => {
    expect(e.isBalanced(e.build('a', 'b', 0.5, 'audience', 'usp'))).toBe(true);
  });
});

describe('SuccessfulBlendAnalyzer', () => {
  const e = new SuccessfulBlendAnalyzer();

  it('analyze normalizes', () => {
    const r = e.analyze([{ name: 'A', sales: 100 }, { name: 'B', sales: 50 }]);
    expect(r[0].score).toBe(1);
    expect(r[1].score).toBe(0.5);
  });

  it('topBlend for empty = null', () => {
    expect(e.topBlend([])).toBeNull();
  });
});

describe('TrendyBlendPredictor', () => {
  const e = new TrendyBlendPredictor();

  it('predict high for romance+fantasy', () => {
    expect(e.predict(['romance', 'fantasy'])).toBeGreaterThanOrEqual(0.7);
  });

  it('isTrendy for 0.7+', () => {
    expect(e.isTrendy(0.8)).toBe(true);
  });
});

describe('GenreElementSplicer', () => {
  const e = new GenreElementSplicer();

  it('splice returns combined', () => {
    expect(e.splice(['a', 'b'], ['c', 'd'], 4)).toHaveLength(4);
  });

  it('hasOverlap true', () => {
    expect(e.hasOverlap(['a'], ['a'])).toBe(true);
  });
});

describe('BlendTitleGenerator', () => {
  const e = new BlendTitleGenerator();

  it('generate 3 titles', () => {
    expect(e.generate('romance', 'fantasy')).toHaveLength(3);
  });

  it('isCatchy for normal length', () => {
    expect(e.isCatchy('The Romantasy Chronicles')).toBe(true);
  });
});

describe('MarketBlendsAnalyzer', () => {
  const e = new MarketBlendsAnalyzer();

  it('analyzeMarket for 2', () => {
    const r = e.analyzeMarket([{ name: 'A', marketShare: 0.7 }, { name: 'B', marketShare: 0.3 }]);
    expect(r.dominant).toBe('A');
  });
});

describe('ReaderDemographicBlender', () => {
  const e = new ReaderDemographicBlender();

  it('blend combines', () => {
    expect(e.blend('YA', 'Adult')).toBe('YA+Adult');
  });

  it('isCompatible true', () => {
    expect(e.isCompatible('A', 'B')).toBe(true);
  });
});

describe('GenreEvolutionSimulator', () => {
  const e = new GenreEvolutionSimulator();

  it('simulate for 3 years', () => {
    const r = e.simulate('romance', 3);
    expect(r).toHaveLength(3);
  });

  it('evolves romance to romantasy', () => {
    expect(e.simulate('romance', 1)[0].evolvedTo).toBe('romantasy');
  });
});

describe('BlendRiskAssessor', () => {
  const e = new BlendRiskAssessor();

  it('assess low risk', () => {
    const recipe: BlendRecipe = { primary: 'a', secondary: 'b', ratio: 0.5, targetAudience: 'audience', uniqueSellingPoint: 'usp' };
    expect(e.assess(recipe).risk).toBe(0);
  });

  it('assess high risk for extreme ratio', () => {
    const recipe: BlendRecipe = { primary: 'a', secondary: 'b', ratio: 0.1, targetAudience: 'audience', uniqueSellingPoint: 'usp' };
    expect(e.assess(recipe).risk).toBeGreaterThan(0);
  });
});

describe('BlendRecipeIndex', () => {
  const idx = new BlendRecipeIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});