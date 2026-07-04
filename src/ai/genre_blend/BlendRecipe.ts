/**
 * BlendRecipe.ts — Direction AQ, V3596-V3605 (Batch 2/3)
 * Genre Blending Advisor: 混合配方生成
 *
 * 10 engines:
 * 1.  HybridGenreRecipeBuilder — 混合类型配方
 * 2.  SuccessfulBlendAnalyzer — 成功案例分析
 * 3.  TrendyBlendPredictor — 趋势预测
 * 4.  GenreElementSplicer — 元素拼接
 * 5.  BlendTitleGenerator — 标题生成
 * 6.  MarketBlendsAnalyzer — 市场分析
 * 7.  ReaderDemographicBlender — 读者群混合
 * 8.  GenreEvolutionSimulator — 类型进化模拟
 * 9.  BlendRiskAssessor — 风险评估
 * 10. BlendRecipeIndex — 收口
 */

export interface BlendRecipe {
  primary: string;
  secondary: string;
  ratio: number;
  targetAudience: string;
  uniqueSellingPoint: string;
}

// ============================================================================
// Engine 1: HybridGenreRecipeBuilder
// ============================================================================

export class HybridGenreRecipeBuilder {
  build(primary: string, secondary: string, ratio: number, audience: string, usp: string): BlendRecipe {
    return { primary, secondary, ratio, targetAudience: audience, uniqueSellingPoint: usp };
  }

  isBalanced(recipe: BlendRecipe): boolean {
    return recipe.ratio >= 0.3 && recipe.ratio <= 0.7;
  }
}

// ============================================================================
// Engine 2: SuccessfulBlendAnalyzer
// ============================================================================

export class SuccessfulBlendAnalyzer {
  analyze(blends: { name: string; sales: number }[]): { name: string; score: number }[] {
    if (blends.length === 0) return [];
    const max = Math.max(...blends.map((b) => b.sales));
    return blends.map((b) => ({ name: b.name, score: b.sales / max }));
  }

  topBlend(blends: { name: string; sales: number }[]): { name: string; score: number } | null {
    const analyzed = this.analyze(blends);
    return analyzed.sort((a, b) => b.score - a.score)[0] || null;
  }
}

// ============================================================================
// Engine 3: TrendyBlendPredictor
// ============================================================================

export class TrendyBlendPredictor {
  predict(genres: string[]): number {
    let score = 0.5;
    if (genres.includes('romance') && genres.includes('fantasy')) score += 0.2;
    if (genres.includes('mystery') && genres.includes('romance')) score += 0.2;
    if (genres.includes('scifi') && genres.includes('fantasy')) score += 0.1;
    return Math.min(1, score);
  }

  isTrendy(score: number, threshold = 0.7): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 4: GenreElementSplicer
// ============================================================================

export class GenreElementSplicer {
  splice(elements1: string[], elements2: string[], max: number = 5): string[] {
    return [...elements1.slice(0, Math.ceil(max / 2)), ...elements2.slice(0, Math.floor(max / 2))].slice(0, max);
  }

  hasOverlap(a: string[], b: string[]): boolean {
    return a.some((x) => b.includes(x));
  }
}

// ============================================================================
// Engine 5: BlendTitleGenerator
// ============================================================================

export class BlendTitleGenerator {
  generate(genre1: string, genre2: string): string[] {
    return [
      `${genre1} ${genre2}`,
      `The ${genre1.charAt(0).toUpperCase()}${genre2.charAt(0).toUpperCase()} Chronicles`,
      `${genre1.charAt(0).toUpperCase() + genre1.slice(1)} of ${genre2.charAt(0).toUpperCase() + genre2.slice(1)}`,
    ];
  }

  isCatchy(title: string): boolean {
    return title.length > 5 && title.length < 40;
  }
}

// ============================================================================
// Engine 6: MarketBlendsAnalyzer
// ============================================================================

export class MarketBlendsAnalyzer {
  analyzeMarket(blends: { name: string; marketShare: number }[]): { dominant: string; diversity: number } {
    if (blends.length === 0) return { dominant: 'none', diversity: 0 };
    const sorted = [...blends].sort((a, b) => b.marketShare - a.marketShare);
    const diversity = blends.length / 10; // simple metric
    return { dominant: sorted[0].name, diversity: Math.min(1, diversity) };
  }
}

// ============================================================================
// Engine 7: ReaderDemographicBlender
// ============================================================================

export class ReaderDemographicBlender {
  blend(demo1: string, demo2: string): string {
    return `${demo1}+${demo2}`;
  }

  isCompatible(demo1: string, demo2: string): boolean {
    return demo1 !== demo2;
  }
}

// ============================================================================
// Engine 8: GenreEvolutionSimulator
// ============================================================================

export class GenreEvolutionSimulator {
  simulate(genre: string, years: number): { genre: string; evolvedTo: string }[] {
    const evolutions: string[] = [];
    let current = genre;
    for (let i = 0; i < years; i++) {
      current = this._nextEvolution(current);
      evolutions.push(current);
    }
    return evolutions.map((e) => ({ genre, evolvedTo: e }));
  }

  private _nextEvolution(genre: string): string {
    const map: Record<string, string> = {
      fantasy: 'progression fantasy',
      romance: 'romantasy',
      mystery: 'thriller',
      scifi: 'cyberpunk',
    };
    return map[genre] || genre;
  }
}

// ============================================================================
// Engine 9: BlendRiskAssessor
// ============================================================================

export class BlendRiskAssessor {
  assess(recipe: BlendRecipe): { risk: number; factors: string[] } {
    const factors: string[] = [];
    let risk = 0;
    if (recipe.ratio < 0.2 || recipe.ratio > 0.8) { risk += 0.4; factors.push('extreme ratio'); }
    if (recipe.targetAudience.length === 0) { risk += 0.3; factors.push('no target'); }
    if (recipe.uniqueSellingPoint.length === 0) { risk += 0.3; factors.push('no USP'); }
    return { risk: Math.min(1, risk), factors };
  }

  isHighRisk(risk: number, threshold = 0.5): boolean {
    return risk >= threshold;
  }
}

// ============================================================================
// Engine 10: BlendRecipeIndex
// ============================================================================

export class BlendRecipeIndex {
  list(): string[] {
    return [
      'HybridGenreRecipeBuilder', 'SuccessfulBlendAnalyzer', 'TrendyBlendPredictor',
      'GenreElementSplicer', 'BlendTitleGenerator', 'MarketBlendsAnalyzer',
      'ReaderDemographicBlender', 'GenreEvolutionSimulator', 'BlendRiskAssessor',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AQ_BATCH_2_ENGINES = {
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
} as const;