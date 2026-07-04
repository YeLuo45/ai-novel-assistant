/**
 * TitleGeneration.ts — Direction AI, V3346-V3355 (Batch 1/3)
 * Chapter Title Optimizer: 章节标题生成 + 优化
 *
 * 10 engines:
 * 1.  TitleGenerator — 标题生成器
 * 2.  TitleClickbaitScorer — 标题党评分
 * 3.  TitleSEOOptimizer — 标题 SEO 优化
 * 4.  TitleLengthValidator — 标题长度
 * 5.  TitleEmotionDetector — 标题情绪检测
 * 6.  TitleGenreMatcher — 标题类型匹配
 * 7.  TitleABTester — 标题 A/B 测试
 * 8.  TitlePatternLearner — 标题模式学习
 * 9.  TitleRanker — 标题排序
 * 10. TitleOptimizerIndex — 收口
 *
 * 灵感：起点签约标准 / 网文黄金三章 / A/B 测试
 */

export interface TitleCandidate {
  title: string;
  score: number;
  genre?: string;
  emotion?: string;
}

// ============================================================================
// Engine 1: TitleGenerator
// ============================================================================

export class TitleGenerator {
  private _templates = [
    '第{n}章 {action}',
    '{hook}',
    '{event}',
    '{character}的{adventure}',
    '{place}的秘密',
  ];

  generate(hooks: string[]): string[] {
    return hooks.map((h) => h);
  }

  generateWithTemplate(template: string, vars: Record<string, string | number>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
    return result;
  }

  generateVariants(base: string, n: number = 3): string[] {
    const variants: string[] = [base];
    for (let i = 1; i < n; i++) {
      variants.push(`${base}（${['续', '下', '终章', '卷二'][i % 4]}）`);
    }
    return variants;
  }

  getTemplates(): string[] {
    return [...this._templates];
  }
}

// ============================================================================
// Engine 2: TitleClickbaitScorer
// ============================================================================

export class TitleClickbaitScorer {
  private _clickbaitKeywords = ['震惊', '惊呆', '逆袭', '神', '绝', '狂', '秒杀', '爽', '爆炸', '燃', '炸裂', 'shocking', 'ultimate', 'epic', 'amazing'];

  score(title: string): number {
    const lower = title.toLowerCase();
    return Math.min(1, this._clickbaitKeywords.filter((k) => lower.includes(k.toLowerCase())).length / 3);
  }

  classify(score: number): 'subtle' | 'balanced' | 'clickbait' {
    if (score < 0.3) return 'subtle';
    if (score < 0.6) return 'balanced';
    return 'clickbait';
  }

  isClickbait(title: string, threshold = 0.5): boolean {
    return this.score(title) >= threshold;
  }
}

// ============================================================================
// Engine 3: TitleSEOOptimizer
// ============================================================================

export class TitleSEOOptimizer {
  private _trendingKeywords = ['穿越', '重生', '金手指', '系统', '无敌', '甜宠', '虐恋', '复仇', '修仙', '玄幻', '言情', '都市'];

  extractKeywords(title: string): string[] {
    return this._trendingKeywords.filter((k) => title.includes(k));
  }

  suggestKeywords(title: string): string[] {
    const current = this.extractKeywords(title);
    if (current.length >= 2) return current;
    // Add recommended
    const missing = this._trendingKeywords.filter((k) => !current.includes(k)).slice(0, 2);
    return [...current, ...missing];
  }

  seoScore(title: string): number {
    const keywords = this.extractKeywords(title);
    return Math.min(1, keywords.length / 3);
  }
}

// ============================================================================
// Engine 4: TitleLengthValidator
// ============================================================================

export class TitleLengthValidator {
  private _minLen = 4;
  private _maxLen = 30;
  private _idealLen = 12;

  isValid(title: string): boolean {
    return title.length >= this._minLen && title.length <= this._maxLen;
  }

  isIdeal(title: string): boolean {
    return title.length >= 8 && title.length <= 16;
  }

  recommend(title: string): string {
    if (title.length < this._minLen) return '太短，建议增加';
    if (title.length > this._maxLen) return '太长，建议缩短';
    if (!this.isIdeal(title)) return '可调整到 8-16 字符理想长度';
    return '理想长度';
  }
}

// ============================================================================
// Engine 5: TitleEmotionDetector
// ============================================================================

export class TitleEmotionDetector {
  private _emotionKeywords: Record<string, string[]> = {
    excitement: ['热血', '激战', '爆', '燃', 'exciting', 'epic'],
    mystery: ['秘密', '谜', '疑', '未解', 'mystery', 'secret'],
    romance: ['爱', '情', '心', 'love', 'heart'],
    tension: ['危机', '危险', '险', 'danger', 'tension'],
  };

  detect(title: string): string | null {
    const lower = title.toLowerCase();
    for (const [emotion, keywords] of Object.entries(this._emotionKeywords)) {
      if (keywords.some((k) => lower.includes(k.toLowerCase()))) return emotion;
    }
    return null;
  }

  isExciting(title: string): boolean {
    return this.detect(title) === 'excitement';
  }
}

// ============================================================================
// Engine 6: TitleGenreMatcher
// ============================================================================

export class TitleGenreMatcher {
  private _genreKeywords: Record<string, string[]> = {
    xuanhuan: ['修真', '修仙', '仙', '玄幻', '修炼'],
    urban: ['都市', '总裁', '豪门', '重生'],
    romance: ['爱', '情', '甜', '宠', '虐'],
    mystery: ['谜', '案', '探', '推理'],
    scifi: ['星际', '未来', '机甲', 'AI', '太空'],
  };

  match(title: string): string | null {
    const lower = title.toLowerCase();
    for (const [genre, keywords] of Object.entries(this._genreKeywords)) {
      if (keywords.some((k) => lower.includes(k.toLowerCase()))) return genre;
    }
    return null;
  }

  isGenreConsistent(title: string, genre: string): boolean {
    return this.match(title) === genre;
  }
}

// ============================================================================
// Engine 7: TitleABTester
// ============================================================================

export class TitleABTester {
  private _results = new Map<string, { clicks: number; impressions: number }>();

  recordImpression(title: string): void {
    if (!this._results.has(title)) this._results.set(title, { clicks: 0, impressions: 0 });
    this._results.get(title)!.impressions += 1;
  }

  recordClick(title: string): void {
    if (!this._results.has(title)) this._results.set(title, { clicks: 0, impressions: 0 });
    this._results.get(title)!.clicks += 1;
  }

  ctr(title: string): number {
    const r = this._results.get(title);
    if (!r || r.impressions === 0) return 0;
    return r.clicks / r.impressions;
  }

  winner(titles: string[]): string | null {
    let best: string | null = null;
    let bestCtr = -1;
    for (const t of titles) {
      const c = this.ctr(t);
      if (c > bestCtr) {
        bestCtr = c;
        best = t;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 8: TitlePatternLearner
// ============================================================================

export class TitlePatternLearner {
  private _patterns: { pattern: string; count: number }[] = [];

  learn(title: string): void {
    // Extract simple pattern: e.g., 2+ Chinese chars = 4-char title
    const chineseChars = (title.match(/[\u4e00-\u9fa5]/g) || []).length;
    const pattern = `${chineseChars}汉字`;
    const existing = this._patterns.find((p) => p.pattern === pattern);
    if (existing) existing.count += 1;
    else this._patterns.push({ pattern, count: 1 });
  }

  getPatterns(): { pattern: string; count: number }[] {
    return [...this._patterns].sort((a, b) => b.count - a.count);
  }

  mostCommon(): string | null {
    return this.getPatterns()[0]?.pattern || null;
  }
}

// ============================================================================
// Engine 9: TitleRanker
// ============================================================================

export class TitleRanker {
  rank(candidates: TitleCandidate[]): TitleCandidate[] {
    return [...candidates].sort((a, b) => b.score - a.score);
  }

  topN(candidates: TitleCandidate[], n: number): TitleCandidate[] {
    return this.rank(candidates).slice(0, n);
  }

  isCompetitive(candidates: TitleCandidate[], threshold = 0.5): boolean {
    return candidates.some((c) => c.score >= threshold);
  }
}

// ============================================================================
// Engine 10: TitleOptimizerIndex
// ============================================================================

export class TitleOptimizerIndex {
  list(): string[] {
    return [
      'TitleGenerator', 'TitleClickbaitScorer', 'TitleSEOOptimizer',
      'TitleLengthValidator', 'TitleEmotionDetector', 'TitleGenreMatcher',
      'TitleABTester', 'TitlePatternLearner', 'TitleRanker',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AI_BATCH_1_ENGINES = {
  TitleGenerator,
  TitleClickbaitScorer,
  TitleSEOOptimizer,
  TitleLengthValidator,
  TitleEmotionDetector,
  TitleGenreMatcher,
  TitleABTester,
  TitlePatternLearner,
  TitleRanker,
  TitleOptimizerIndex,
} as const;
