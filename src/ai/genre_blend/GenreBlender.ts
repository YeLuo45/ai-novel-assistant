/**
 * GenreBlender.ts — Direction AQ, V3586-V3595 (Batch 1/3)
 * Genre Blending Advisor: 类型融合基础
 *
 * 10 engines:
 * 1.  GenreElementExtractor — 类型元素提取
 * 2.  CrossGenreCompatibility — 跨类型兼容性
 * 3.  BlendRecipeBuilder — 混合配方
 * 4.  GenreConflictDetector — 类型冲突检测
 * 5.  HybridGenreGenerator — 混合类型生成
 * 6.  GenreTransitionPlanner — 类型过渡规划
 * 7.  GenreElementReplacer — 元素替换
 * 8.  StyleFusionEngine — 风格融合
 * 9.  GenreMixingRatio — 混合比例
 * 10. GenreBlenderIndex — 收口
 *
 * 灵感：跨类型小说趋势 / 同人创作 / 类型融合畅销案例
 */

export interface GenreElements {
  setting: string[];
  characters: string[];
  conflicts: string[];
  tropes: string[];
}

export interface GenreProfile {
  name: string;
  elements: GenreElements;
  signatureTropes: string[];
}

// ============================================================================
// Engine 1: GenreElementExtractor
// ============================================================================

export class GenreElementExtractor {
  private _genreKeywords: Record<string, GenreElements> = {
    romance: {
      setting: ['咖啡馆', '校园', '公司', '古代宫廷'],
      characters: ['恋人', '情敌', '暗恋者', '红娘'],
      conflicts: ['误会', '分离', '三角恋'],
      tropes: ['一见钟情', '失忆', '替嫁'],
    },
    mystery: {
      setting: ['庄园', '警局', '密室'],
      characters: ['侦探', '嫌犯', '证人', '助手'],
      conflicts: ['谋杀', '绑架', '失踪'],
      tropes: ['密室杀人', '不在场证明', '隐藏身份'],
    },
    fantasy: {
      setting: ['魔法学院', '异世界', '王国'],
      characters: ['勇者', '魔王', '法师'],
      conflicts: ['魔物入侵', '王国纷争'],
      tropes: ['召唤', '转生', '废柴逆袭'],
    },
    scifi: {
      setting: ['太空船', '基地', '未来城市'],
      characters: ['宇航员', 'AI', '外星人'],
      conflicts: ['入侵', '叛变', '时空'],
      tropes: ['穿越', '人工智能', '虚拟现实'],
    },
  };

  extract(genre: string): GenreElements {
    return this._genreKeywords[genre] || { setting: [], characters: [], conflicts: [], tropes: [] };
  }

  supported(): string[] {
    return Object.keys(this._genreKeywords);
  }
}

// ============================================================================
// Engine 2: CrossGenreCompatibility
// ============================================================================

export class CrossGenreCompatibility {
  score(genre1: string, genre2: string): number {
    const matrix: Record<string, Record<string, number>> = {
      romance: { romance: 1.0, mystery: 0.6, fantasy: 0.7, scifi: 0.5 },
      mystery: { romance: 0.6, mystery: 1.0, fantasy: 0.5, scifi: 0.7 },
      fantasy: { romance: 0.7, mystery: 0.5, fantasy: 1.0, scifi: 0.6 },
      scifi: { romance: 0.5, mystery: 0.7, fantasy: 0.6, scifi: 1.0 },
    };
    return matrix[genre1]?.[genre2] ?? 0;
  }

  isBlendable(genre1: string, genre2: string, threshold = 0.5): boolean {
    return this.score(genre1, genre2) >= threshold;
  }
}

// ============================================================================
// Engine 3: BlendRecipeBuilder
// ============================================================================

export class BlendRecipeBuilder {
  build(genres: string[], ratio: Record<string, number>): { genres: string[]; ratio: Record<string, number>; name: string } {
    const sum = Object.values(ratio).reduce((s, v) => s + v, 0);
    const normalized: Record<string, number> = {};
    for (const g of genres) normalized[g] = (ratio[g] || 0) / sum;
    const name = genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join('-') + ' Fusion';
    return { genres, ratio: normalized, name };
  }

  isBalanced(recipe: { ratio: Record<string, number> }): boolean {
    const values = Object.values(recipe.ratio);
    const max = Math.max(...values);
    return max <= 0.7; // No single genre dominates
  }
}

// ============================================================================
// Engine 4: GenreConflictDetector
// ============================================================================

export class GenreConflictDetector {
  detect(genre1: string, genre2: string): string[] {
    const conflicts: Record<string, Record<string, string[]>> = {
      romance: { mystery: ['romance pacing conflicts with mystery reveals'] },
      fantasy: { scifi: ['magic vs technology paradigm clash'] },
    };
    return conflicts[genre1]?.[genre2] || [];
  }

  hasConflict(genre1: string, genre2: string): boolean {
    return this.detect(genre1, genre2).length > 0;
  }
}

// ============================================================================
// Engine 5: HybridGenreGenerator
// ============================================================================

export class HybridGenreGenerator {
  generate(name1: string, name2: string): string {
    const blendNames: Record<string, Record<string, string>> = {
      romance: { mystery: 'Romantic Suspense', fantasy: 'Fantasy Romance' },
      mystery: { romance: 'Cozy Mystery', fantasy: 'Magical Detective' },
      fantasy: { scifi: 'Science Fantasy' },
      scifi: { fantasy: 'Cyberpunk Fantasy' },
    };
    return blendNames[name1]?.[name2] || `${name1}-${name2} Hybrid`;
  }

  isKnownHybrid(name: string): boolean {
    return ['Romantic Suspense', 'Cozy Mystery', 'Magical Detective'].includes(name);
  }
}

// ============================================================================
// Engine 6: GenreTransitionPlanner
// ============================================================================

export class GenreTransitionPlanner {
  plan(from: string, to: string, chapters: number): { from: string; to: string; bridgeChapter: number } {
    return {
      from,
      to,
      bridgeChapter: Math.floor(chapters / 2),
    };
  }

  isSmoothTransition(from: string, to: string): boolean {
    const compat = new CrossGenreCompatibility();
    return compat.score(from, to) >= 0.5;
  }
}

// ============================================================================
// Engine 7: GenreElementReplacer
// ============================================================================

export class GenreElementReplacer {
  replace(text: string, fromGenre: string, toGenre: string, mapping: Record<string, string>): string {
    let result = text;
    const fromElements = new GenreElementExtractor().extract(fromGenre);
    const targets = [...fromElements.setting, ...fromElements.characters, ...fromElements.conflicts];
    for (const target of targets) {
      const replacement = mapping[target];
      if (replacement) result = result.split(target).join(replacement);
    }
    return result;
  }

  isAdapted(text: string, original: string): boolean {
    return text !== original;
  }
}

// ============================================================================
// Engine 8: StyleFusionEngine
// ============================================================================

export class StyleFusionEngine {
  fuse(style1: string, style2: string): string {
    return `${style1} + ${style2}`;
  }

  isBlendable(style1: string, style2: string): boolean {
    return style1 !== style2;
  }
}

// ============================================================================
// Engine 9: GenreMixingRatio
// ============================================================================

export class GenreMixingRatio {
  calculate(genre1: string, genre2: string, ratio1: number): { genre1: number; genre2: number } {
    return { genre1: ratio1, genre2: 1 - ratio1 };
  }

  isBalanced(ratio: { genre1: number; genre2: number }): boolean {
    return ratio.genre1 >= 0.3 && ratio.genre2 >= 0.3;
  }
}

// ============================================================================
// Engine 10: GenreBlenderIndex
// ============================================================================

export class GenreBlenderIndex {
  list(): string[] {
    return [
      'GenreElementExtractor', 'CrossGenreCompatibility', 'BlendRecipeBuilder',
      'GenreConflictDetector', 'HybridGenreGenerator', 'GenreTransitionPlanner',
      'GenreElementReplacer', 'StyleFusionEngine', 'GenreMixingRatio',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AQ_BATCH_1_ENGINES = {
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
} as const;