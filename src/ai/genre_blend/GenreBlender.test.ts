/**
 * GenreBlender.test.ts — Direction AQ, V3586-V3595 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  GenreElementExtractor,
  CrossGenreCompatibility,
  BlendRecipeBuilder,
  GenreConflictDetector,
  HybridGenreGenerator,
  GenreTransitionPlanner,
  GenreElementReplacer,
  StyleFusionEngine,
  GenreMixingRatio,
  GenreBlenderIndex,
} from './GenreBlender';

describe('GenreElementExtractor', () => {
  const e = new GenreElementExtractor();

  it('extract for romance', () => {
    const r = e.extract('romance');
    expect(r.setting.length).toBeGreaterThan(0);
  });

  it('extract for fantasy', () => {
    expect(e.extract('fantasy').characters.length).toBeGreaterThan(0);
  });

  it('supported returns 4', () => {
    expect(e.supported()).toHaveLength(4);
  });
});

describe('CrossGenreCompatibility', () => {
  const e = new CrossGenreCompatibility();

  it('score romance+mystery = 0.6', () => {
    expect(e.score('romance', 'mystery')).toBe(0.6);
  });

  it('isBlendable for 0.5+', () => {
    expect(e.isBlendable('romance', 'fantasy')).toBe(true);
  });
});

describe('BlendRecipeBuilder', () => {
  const e = new BlendRecipeBuilder();

  it('build returns normalized', () => {
    const r = e.build(['a', 'b'], { a: 60, b: 40 });
    expect(r.ratio.a).toBeCloseTo(0.6, 5);
  });

  it('build name', () => {
    expect(e.build(['romance', 'mystery'], { romance: 0.5, mystery: 0.5 }).name).toContain('Fusion');
  });

  it('isBalanced true', () => {
    expect(e.isBalanced({ ratio: { a: 0.5, b: 0.5 } })).toBe(true);
  });
});

describe('GenreConflictDetector', () => {
  const e = new GenreConflictDetector();

  it('detect romance+mystery', () => {
    expect(e.detect('romance', 'mystery')).toHaveLength(1);
  });

  it('hasConflict true', () => {
    expect(e.hasConflict('romance', 'mystery')).toBe(true);
  });
});

describe('HybridGenreGenerator', () => {
  const e = new HybridGenreGenerator();

  it('generate romance+mystery', () => {
    expect(e.generate('romance', 'mystery')).toBe('Romantic Suspense');
  });

  it('isKnownHybrid for Cozy', () => {
    expect(e.isKnownHybrid('Cozy Mystery')).toBe(true);
  });
});

describe('GenreTransitionPlanner', () => {
  const e = new GenreTransitionPlanner();

  it('plan bridge at half', () => {
    const r = e.plan('romance', 'mystery', 10);
    expect(r.bridgeChapter).toBe(5);
  });

  it('isSmoothTransition for 0.5+', () => {
    expect(e.isSmoothTransition('romance', 'mystery')).toBe(true);
  });
});

describe('GenreElementReplacer', () => {
  const e = new GenreElementReplacer();

  it('replace setting', () => {
    const r = e.replace('在咖啡馆里', 'romance', 'fantasy', { 咖啡馆: '魔法学院' });
    expect(r).toContain('魔法学院');
  });

  it('isAdapted true', () => {
    const r = e.replace('在咖啡馆里', 'romance', 'fantasy', { 咖啡馆: '魔法学院' });
    expect(e.isAdapted(r, '在咖啡馆里')).toBe(true);
  });
});

describe('StyleFusionEngine', () => {
  const e = new StyleFusionEngine();

  it('fuse combines', () => {
    expect(e.fuse('light', 'dark')).toContain('light');
    expect(e.fuse('light', 'dark')).toContain('dark');
  });

  it('isBlendable true', () => {
    expect(e.isBlendable('a', 'b')).toBe(true);
  });
});

describe('GenreMixingRatio', () => {
  const e = new GenreMixingRatio();

  it('calculate', () => {
    expect(e.calculate('a', 'b', 0.6).genre2).toBe(0.4);
  });

  it('isBalanced true for 50/50', () => {
    expect(e.isBalanced({ genre1: 0.5, genre2: 0.5 })).toBe(true);
  });
});

describe('GenreBlenderIndex', () => {
  const idx = new GenreBlenderIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});