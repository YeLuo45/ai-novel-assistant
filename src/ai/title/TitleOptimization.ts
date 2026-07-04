/**
 * TitleOptimization.ts — Direction AI, V3356-V3365 (Batch 2/3)
 * Chapter Title Optimizer: 标题优化 + 协同
 *
 * 10 engines:
 * 1.  ChapterTitleScorer — 章节标题评分
 * 2.  TitleSeriesConsistency — 系列标题一致性
 * 3.  TitleNicheMatcher — 标题 niche 匹配
 * 4.  TitleHistoryTracker — 标题历史追踪
 * 5.  TitleImprover — 标题改进器
 * 6.  TitleBatchOptimizer — 标题批量优化
 * 7.  TitleEffectivenessPredictor — 效果预测
 * 8.  TitleVariationGenerator — 变体生成
 * 9.  TitleCompetitorComparison — 竞品对比
 * 10. TitleOptimizationIndex — 收口
 *
 * 灵感：网文标题优化 / A/B test
 */

import type { TitleCandidate } from './TitleGeneration';

// ============================================================================
// Engine 1: ChapterTitleScorer
// ============================================================================

export class ChapterTitleScorer {
  score(title: string): { length: number; emotion: number; action: number; total: number } {
    const length = Math.min(1, title.length / 15);
    const emotionKeywords = ['热血', '激战', '爆', '燃', '爱', '恨', '情', 'fear', 'love', 'epic'];
    const emotion = emotionKeywords.filter((k) => title.includes(k)).length > 0 ? 1 : 0.3;
    const actionKeywords = ['战', '杀', '觉醒', '突破', '复仇', 'battle', 'awaken', 'breakthrough'];
    const action = actionKeywords.filter((k) => title.includes(k)).length > 0 ? 1 : 0.3;
    const total = (length + emotion + action) / 3;
    return { length, emotion, action, total };
  }

  isHighQuality(title: string, threshold = 0.7): boolean {
    return this.score(title).total >= threshold;
  }
}

// ============================================================================
// Engine 2: TitleSeriesConsistency
// ============================================================================

export class TitleSeriesConsistency {
  private _series = new Map<string, string[]>();

  register(series: string, titles: string[]): void {
    this._series.set(series, titles);
  }

  isConsistent(series: string): boolean {
    const titles = this._series.get(series);
    if (!titles || titles.length < 2) return true;
    // Check length consistency
    const lens = titles.map((t) => t.length);
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    return lens.every((l) => Math.abs(l - avg) < avg * 0.5);
  }

  variance(series: string): number {
    const titles = this._series.get(series);
    if (!titles || titles.length < 2) return 0;
    const lens = titles.map((t) => t.length);
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    return lens.reduce((s, l) => s + (l - avg) ** 2, 0) / lens.length;
  }
}

// ============================================================================
// Engine 3: TitleNicheMatcher
// ============================================================================

export class TitleNicheMatcher {
  private _niches: Record<string, string[]> = {
    'golden_three': ['开局', '穿越', '系统', '金手指', '无敌'],
    'sweet_romance': ['甜', '宠', '爱', '霸总', '青梅'],
    'dark_mystery': ['谜', '悬', '疑', '案', '探', '诡异'],
    'power_fantasy': ['逆袭', '扮猪吃虎', '无敌', '秒杀', '碾压'],
  };

  match(title: string): string | null {
    const lower = title.toLowerCase();
    for (const [niche, keywords] of Object.entries(this._niches)) {
      if (keywords.some((k) => lower.includes(k.toLowerCase()))) return niche;
    }
    return null;
  }

  isNiche(title: string, niche: string): boolean {
    return this.match(title) === niche;
  }
}

// ============================================================================
// Engine 4: TitleHistoryTracker
// ============================================================================

export interface TitleVersion {
  version: number;
  title: string;
  timestamp: number;
}

export class TitleHistoryTracker {
  private _histories = new Map<string, TitleVersion[]>();

  record(identifier: string, title: string): number {
    if (!this._histories.has(identifier)) this._histories.set(identifier, []);
    const versions = this._histories.get(identifier)!;
    const version = versions.length + 1;
    versions.push({ version, title, timestamp: Date.now() });
    return version;
  }

  getHistory(identifier: string): TitleVersion[] {
    return this._histories.get(identifier) || [];
  }

  getCurrent(identifier: string): string | null {
    const h = this.getHistory(identifier);
    return h.length > 0 ? h[h.length - 1].title : null;
  }
}

// ============================================================================
// Engine 5: TitleImprover
// ============================================================================

export class TitleImprover {
  improve(title: string): string {
    let improved = title;
    if (improved.length < 5) {
      improved = improved + '——展开';
    } else if (improved.length > 20) {
      improved = improved.slice(0, 18) + '...';
    }
    return improved;
  }

  suggest(original: string): string[] {
    return [
      original,
      `《${original}》`,
      `${original}（续）`,
      `${original}（终章）`,
    ];
  }
}

// ============================================================================
// Engine 6: TitleBatchOptimizer
// ============================================================================

export class TitleBatchOptimizer {
  optimize(titles: string[]): { original: string; optimized: string; improvement: number }[] {
    return titles.map((t) => {
      const improved = new TitleImprover().improve(t);
      return { original: t, optimized: improved, improvement: improved.length - t.length };
    });
  }

  averageImprovement(titles: string[]): number {
    const opts = this.optimize(titles);
    const total = opts.reduce((s, o) => s + o.improvement, 0);
    return opts.length > 0 ? total / opts.length : 0;
  }
}

// ============================================================================
// Engine 7: TitleEffectivenessPredictor
// ============================================================================

export class TitleEffectivenessPredictor {
  predict(title: string): { ctr: number; retention: number; virality: number } {
    const length = Math.min(1, title.length / 12);
    const emotionBoost = /热血|爆|燃|爽|epic|amazing/.test(title) ? 0.3 : 0;
    const ctr = Math.min(1, length * 0.6 + emotionBoost);
    const retention = ctr * 0.8;
    const virality = emotionBoost > 0 ? 0.7 : 0.3;
    return { ctr, retention, virality };
  }

  isHighCTR(title: string, threshold = 0.5): boolean {
    return this.predict(title).ctr >= threshold;
  }
}

// ============================================================================
// Engine 8: TitleVariationGenerator
// ============================================================================

export class TitleVariationGenerator {
  generate(base: string, n: number = 5): string[] {
    const variants: string[] = [base];
    const suffixes = ['（续）', '（终）', '（番外）', '（前传）', '（后日谈）'];
    const prefixes = ['序章：', '插曲：', '终曲：', '外传：', '特典：'];
    for (let i = 0; i < n - 1; i++) {
      const variant = i % 2 === 0 ? `${prefixes[i % prefixes.length]}${base}` : `${base}${suffixes[i % suffixes.length]}`;
      variants.push(variant);
    }
    return variants.slice(0, n);
  }
}

// ============================================================================
// Engine 9: TitleCompetitorComparison
// ============================================================================

export class TitleCompetitorComparison {
  compare(own: string, competitors: string[]): { betterThan: number; total: number; rank: number } {
    const myScore = this._score(own);
    const competitorScores = competitors.map((c) => this._score(c));
    const betterThan = competitorScores.filter((s) => myScore > s).length;
    const total = competitors.length;
    const allScores = [myScore, ...competitorScores].sort((a, b) => b - a);
    const rank = allScores.indexOf(myScore) + 1;
    return { betterThan, total, rank };
  }

  private _score(title: string): number {
    let score = 0;
    if (title.length > 4 && title.length < 20) score += 0.5;
    if (/热血|爆|燃|爽/.test(title)) score += 0.3;
    if (/第.+章/.test(title)) score += 0.2;
    return Math.min(1, score);
  }
}

// ============================================================================
// Engine 10: TitleOptimizationIndex
// ============================================================================

export class TitleOptimizationIndex {
  list(): string[] {
    return [
      'ChapterTitleScorer', 'TitleSeriesConsistency', 'TitleNicheMatcher',
      'TitleHistoryTracker', 'TitleImprover', 'TitleBatchOptimizer',
      'TitleEffectivenessPredictor', 'TitleVariationGenerator', 'TitleCompetitorComparison',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AI_BATCH_2_ENGINES = {
  ChapterTitleScorer,
  TitleSeriesConsistency,
  TitleNicheMatcher,
  TitleHistoryTracker,
  TitleImprover,
  TitleBatchOptimizer,
  TitleEffectivenessPredictor,
  TitleVariationGenerator,
  TitleCompetitorComparison,
  TitleOptimizationIndex,
} as const;

export type { TitleCandidate };
