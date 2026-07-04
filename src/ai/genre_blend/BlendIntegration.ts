/**
 * BlendIntegration.ts — Direction AQ, V3606-V3615 (Batch 3/3 收口)
 * Genre Blending Advisor: 集成 + 收口
 *
 * 10 engines:
 * 1.  BlendValidator — 配方验证
 * 2.  HybridGenreMarketTester — 市场测试
 * 3.  GenreMashupGenerator — 混搭生成
 * 4.  CrossGenrePrompts — 跨类型 prompt
 * 5.  GenreSynergyCalculator — 协同效应
 * 6.  SuccessfulHybridExamples — 成功案例库
 * 7.  BlendPrototyping — 原型制作
 * 8.  GenreBlendingDirector — AI 总监
 * 9.  ReaderSegmentOverlap — 读者重叠
 * 10. BlendMasterIndex — 28 engines 收口
 */

import type { BlendRecipe } from './BlendRecipe';

// ============================================================================
// Engine 1: BlendValidator
// ============================================================================

export class BlendValidator {
  validate(recipe: BlendRecipe): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (recipe.primary === recipe.secondary) issues.push('same primary and secondary');
    if (recipe.ratio < 0.1 || recipe.ratio > 0.9) issues.push('extreme ratio');
    if (recipe.targetAudience.length < 3) issues.push('audience too vague');
    return { valid: issues.length === 0, issues };
  }
}

// ============================================================================
// Engine 2: HybridGenreMarketTester
// ============================================================================

export class HybridGenreMarketTester {
  test(recipe: BlendRecipe, comparable: { ratio: number; sales: number }[]): { estimatedSales: number; confidence: number } {
    const match = comparable.find((c) => Math.abs(c.ratio - recipe.ratio) < 0.1);
    return {
      estimatedSales: match?.sales || 0,
      confidence: match ? 0.7 : 0.3,
    };
  }
}

// ============================================================================
// Engine 3: GenreMashupGenerator
// ============================================================================

export class GenreMashupGenerator {
  mashup(genres: string[]): { genres: string[]; mashup: string } {
    return { genres, mashup: genres.join(' × ') };
  }

  hasUniqueName(name: string): boolean {
    return name.includes('×');
  }
}

// ============================================================================
// Engine 4: CrossGenrePrompts
// ============================================================================

export class CrossGenrePrompts {
  generate(genres: string[]): string[] {
    return [
      `What if a ${genres[0]} protagonist encounters ${genres[1] || genres[0]} elements?`,
      `Combine the best of ${genres.join(' and ')}.`,
      `Imagine ${genres[0]} rules applied in a ${genres[1] || genres[0]} setting.`,
    ];
  }

  isValidPrompt(prompt: string): boolean {
    return prompt.length > 20;
  }
}

// ============================================================================
// Engine 5: GenreSynergyCalculator
// ============================================================================

export class GenreSynergyCalculator {
  calculate(genres: string[]): number {
    let score = 1.0;
    for (let i = 0; i < genres.length - 1; i++) {
      const a = genres[i];
      const b = genres[i + 1];
      if (a === 'romance' && b === 'fantasy') score += 0.3;
      else if (a === 'mystery' && b === 'thriller') score += 0.2;
      else score -= 0.1;
    }
    return Math.max(0, score);
  }

  isHighSynergy(score: number, threshold = 1.2): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 6: SuccessfulHybridExamples
// ============================================================================

export class SuccessfulHybridExamples {
  private _examples = [
    { title: 'Twilight', primary: 'romance', secondary: 'fantasy', sales: 100 },
    { title: 'Harry Potter', primary: 'fantasy', secondary: 'mystery', sales: 500 },
    { title: 'The Martian', primary: 'scifi', secondary: 'survival', sales: 50 },
  ];

  getAll(): { title: string; primary: string; secondary: string; sales: number }[] {
    return [...this._examples];
  }

  findByGenres(p: string, s: string): { title: string; primary: string; secondary: string; sales: number } | null {
    return this._examples.find((e) => e.primary === p && e.secondary === s) || null;
  }
}

// ============================================================================
// Engine 7: BlendPrototyping
// ============================================================================

export class BlendPrototyping {
  prototype(recipe: BlendRecipe): { outline: string; keyScenes: number } {
    return {
      outline: `${recipe.primary} meets ${recipe.secondary}. Target: ${recipe.targetAudience}. USP: ${recipe.uniqueSellingPoint}`,
      keyScenes: 5,
    };
  }

  isReady(prototype: { keyScenes: number }): boolean {
    return prototype.keyScenes >= 3;
  }
}

// ============================================================================
// Engine 8: GenreBlendingDirector
// ============================================================================

export class GenreBlendingDirector {
  decideNextStep(state: { blend: BlendRecipe | null; tested: boolean; prototyped: boolean }): 'create_recipe' | 'test' | 'prototype' | 'write' {
    if (!state.blend) return 'create_recipe';
    if (!state.tested) return 'test';
    if (!state.prototyped) return 'prototype';
    return 'write';
  }
}

// ============================================================================
// Engine 9: ReaderSegmentOverlap
// ============================================================================

export class ReaderSegmentOverlap {
  overlap(segment1: string[], segment2: string[]): number {
    const shared = segment1.filter((s) => segment2.includes(s));
    return shared.length / Math.min(segment1.length, segment2.length);
  }

  isSignificantOverlap(ratio: number, threshold = 0.3): boolean {
    return ratio >= threshold;
  }
}

// ============================================================================
// Engine 10: BlendMasterIndex
// ============================================================================

export class BlendMasterIndex {
  list(): string[] {
    return [
      'GenreElementExtractor', 'CrossGenreCompatibility', 'BlendRecipeBuilder',
      'GenreConflictDetector', 'HybridGenreGenerator', 'GenreTransitionPlanner',
      'GenreElementReplacer', 'StyleFusionEngine', 'GenreMixingRatio',
      'HybridGenreRecipeBuilder', 'SuccessfulBlendAnalyzer', 'TrendyBlendPredictor',
      'GenreElementSplicer', 'BlendTitleGenerator', 'MarketBlendsAnalyzer',
      'ReaderDemographicBlender', 'GenreEvolutionSimulator', 'BlendRiskAssessor',
      'BlendValidator', 'HybridGenreMarketTester', 'GenreMashupGenerator',
      'CrossGenrePrompts', 'GenreSynergyCalculator', 'SuccessfulHybridExamples',
      'BlendPrototyping', 'GenreBlendingDirector', 'ReaderSegmentOverlap',
      'BlendMasterIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AQ_BATCH_3_ENGINES = {
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
} as const;

export type { BlendRecipe };