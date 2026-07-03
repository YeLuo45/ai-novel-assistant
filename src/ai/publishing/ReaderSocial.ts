/**
 * ReaderSocial.ts — Direction AE, V3236-V3245 (Batch 2/3)
 * Publishing & Marketing: 读者画像 + 书评 + 社媒分发
 *
 * 10 engines:
 * 1.  TargetReaderPersonaEngine — 读者画像（详细版）
 * 2.  CompetitorAnalysis — 竞品分析
 * 3.  HeatmapPredictor — 热度预测
 * 4.  ReviewGenerator — 书评生成
 * 5.  ReaderFeedbackAnalyzer — 读者反馈分析
 * 6.  WeiboCopywriter — 微博文案
 * 7.  XiaohongshuPost — 小红书贴
 * 8.  DouyinScript — 抖音脚本
 * 9.  BilibiliScript — B 站脚本
 * 10. PosterSlogan — 海报文案
 */

// ============================================================================
// Engine 1: TargetReaderPersonaEngine
// ============================================================================

export interface ReaderPersonaFull {
  name: string;
  ageRange: [number, number];
  gender: 'male' | 'female' | 'any';
  readingHabits: string[];
  priceTolerance: string;
  painPoints: string[];
}

export class TargetReaderPersonaEngine {
  private _personas: ReaderPersonaFull[] = [
    {
      name: 'web_novel_enthusiast',
      ageRange: [16, 28],
      gender: 'male',
      readingHabits: ['手机', '碎片时间', '追更', '评论'],
      priceTolerance: 'low',
      painPoints: ['书荒', '烂尾', '更新慢', '同质化'],
    },
    {
      name: 'romance_passionate',
      ageRange: [20, 40],
      gender: 'female',
      readingHabits: ['晚间', '周末', '收藏', '打赏'],
      priceTolerance: 'medium',
      painPoints: ['人设崩', 'BE结局', '注水', '慢热'],
    },
    {
      name: 'literary_reader',
      ageRange: [25, 60],
      gender: 'any',
      readingHabits: ['深度阅读', '纸质/电纸书', '推荐'],
      priceTolerance: 'high',
      painPoints: ['烂大街', '缺乏深度', '文笔差', '套路化'],
    },
  ];

  getPersonas(): ReaderPersonaFull[] {
    return this._personas.map((p) => ({ ...p }));
  }

  findByGender(gender: 'male' | 'female' | 'any'): ReaderPersonaFull[] {
    return this._personas.filter((p) => p.gender === gender);
  }

  findByPainPoint(pain: string): ReaderPersonaFull[] {
    return this._personas.filter((p) => p.painPoints.includes(pain));
  }
}

// ============================================================================
// Engine 2: CompetitorAnalysis
// ============================================================================

export interface Competitor {
  title: string;
  author: string;
  wordcount: number;
  rating: number;
  uniqueFeatures: string[];
}

export class CompetitorAnalysis {
  private _competitors: Competitor[] = [];

  add(c: Competitor): void {
    this._competitors.push(c);
  }

  getAll(): Competitor[] {
    return [...this._competitors];
  }

  averageRating(): number {
    if (this._competitors.length === 0) return 0;
    return this._competitors.reduce((s, c) => s + c.rating, 0) / this._competitors.length;
  }

  findUniqueFeatures(): string[] {
    const counts = new Map<string, number>();
    for (const c of this._competitors) {
      for (const f of c.uniqueFeatures) {
        counts.set(f, (counts.get(f) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  }
}

// ============================================================================
// Engine 3: HeatmapPredictor
// ============================================================================

export class HeatmapPredictor {
  predict(features: { genre: string; titleQuality: number; authorReputation: number; updateFrequency: string }): number {
    let score = 5;
    if (['玄幻', '都市', '言情'].includes(features.genre)) score += 1;
    score += features.titleQuality;
    score += features.authorReputation;
    if (features.updateFrequency === 'daily') score += 2;
    return Math.min(10, score);
  }

  classify(heat: number): 'cold' | 'warm' | 'hot' | 'viral' {
    if (heat < 3) return 'cold';
    if (heat < 6) return 'warm';
    if (heat < 8) return 'hot';
    return 'viral';
  }
}

// ============================================================================
// Engine 4: ReviewGenerator
// ============================================================================

export class ReviewGenerator {
  generate(title: string, rating: number, type: 'positive' | 'neutral' | 'negative'): string {
    if (type === 'positive') {
      return `${title} 太赞了！强烈推荐，剧情跌宕起伏，人物鲜活。`;
    } else if (type === 'negative') {
      return `${title} 让人失望，剧情拖沓，人设崩塌。`;
    } else {
      return `${title} 还可以，有些亮点但也有不足。`;
    }
  }

  generateAllRatings(title: string): { type: string; review: string }[] {
    return [
      { type: 'positive', review: this.generate(title, 5, 'positive') },
      { type: 'neutral', review: this.generate(title, 3, 'neutral') },
      { type: 'negative', review: this.generate(title, 1, 'negative') },
    ];
  }
}

// ============================================================================
// Engine 5: ReaderFeedbackAnalyzer
// ============================================================================

export class ReaderFeedbackAnalyzer {
  analyze(feedbacks: string[]): { positive: number; negative: number; neutral: number; themes: string[] } {
    const positiveWords = ['好', '赞', '喜欢', '推荐', 'good', 'great', 'love'];
    const negativeWords = ['差', '烂', '失望', 'bad', 'terrible', 'hate'];
    let positive = 0, negative = 0, neutral = 0;
    const themes = new Set<string>();
    for (const f of feedbacks) {
      const lower = f.toLowerCase();
      const isPos = positiveWords.some((w) => lower.includes(w.toLowerCase()));
      const isNeg = negativeWords.some((w) => lower.includes(w.toLowerCase()));
      if (isPos) positive += 1;
      else if (isNeg) negative += 1;
      else neutral += 1;
      // Extract themes
      for (const t of ['剧情', '人物', '文笔', '设定', 'plot', 'character']) {
        if (lower.includes(t.toLowerCase())) themes.add(t);
      }
    }
    return { positive, negative, neutral, themes: Array.from(themes) };
  }
}

// ============================================================================
// Engine 6: WeiboCopywriter
// ============================================================================

export class WeiboCopywriter {
  generate(title: string, genre: string, points: string[]): string {
    const pointStr = points.length > 0 ? points.join('+') : '';
    return `#${genre}# ${title} ${pointStr} #网文推荐#`;
  }

  generateWithHashtags(title: string, hashtags: string[]): string {
    const tags = hashtags.map((h) => `#${h}#`).join(' ');
    return `${title} ${tags}`;
  }
}

// ============================================================================
// Engine 7: XiaohongshuPost
// ============================================================================

export class XiaohongshuPost {
  generate(title: string, hook: string, recommendation: string): { title: string; content: string; tags: string[] } {
    return {
      title: `【推荐】${title}：${hook}`,
      content: `${hook}\n\n${recommendation}\n\n真的太好看了，强烈推荐！`,
      tags: ['小说推荐', '书单', '网文'],
    };
  }
}

// ============================================================================
// Engine 8: DouyinScript
// ============================================================================

export class DouyinScript {
  generate(title: string, hook: string, cta: string): { duration: number; segments: string[] } {
    return {
      duration: 30,
      segments: [
        `0-5s: 钩子 - ${hook}`,
        `5-20s: 剧情简介 + 卖点 - ${title}`,
        `20-30s: 召唤行动 - ${cta}`,
      ],
    };
  }

  isShortEnough(script: { duration: number }): boolean {
    return script.duration <= 60;
  }
}

// ============================================================================
// Engine 9: BilibiliScript
// ============================================================================

export class BilibiliScript {
  generate(title: string, plot: string, analysis: string): { duration: number; outline: string[] } {
    return {
      duration: 180,
      outline: [
        `0-30s: 开场 + 介绍 ${title}`,
        `30-90s: 剧情 ${plot}`,
        `90-150s: 深度分析 ${analysis}`,
        `150-180s: 总结 + 推荐`,
      ],
    };
  }

  hasOutline(script: { outline: string[] }): boolean {
    return script.outline.length >= 3;
  }
}

// ============================================================================
// Engine 10: PosterSlogan
// ============================================================================

export class PosterSlogan {
  private _templates = [
    '一{theme}，一世界',
    '当你{action}时，{outcome}',
    '{number}天{transformation}',
    '{hook}，{promise}',
  ];

  generate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return result;
  }

  getTemplates(): string[] {
    return [...this._templates];
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AE_BATCH_2_ENGINES = {
  TargetReaderPersonaEngine,
  CompetitorAnalysis,
  HeatmapPredictor,
  ReviewGenerator,
  ReaderFeedbackAnalyzer,
  WeiboCopywriter,
  XiaohongshuPost,
  DouyinScript,
  BilibiliScript,
  PosterSlogan,
} as const;
