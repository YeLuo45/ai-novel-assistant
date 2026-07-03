/**
 * AuthorStyleFingerprint.ts — Direction AD, V3196-V3205 (Batch 1/3)
 * Voice & Style Fingerprint: 风格指纹提取 + 大师模仿
 *
 * 10 engines:
 * 1.  AuthorStyleFingerprint — 风格指纹提取
 * 2.  LuXunStyle — 鲁迅风格
 * 3.  LaoSheStyle — 老舍风格
 * 4.  ZhangAilingStyle — 张爱玲风格
 * 5.  JinYongStyle — 金庸风格
 * 6.  GuLongStyle — 古龙风格
 * 7.  HemingwayStyle — 海明威风格
 * 8.  FitzgeraldStyle — 菲茨杰拉德风格
 * 9.  JKRowlingStyle — JK 罗琳风格
 * 10. StyleSimilarity — 风格相似度
 *
 * 灵感：Stylometry 文学计量学 / 各种"模仿X写作"prompt / AI 风格迁移
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: AuthorStyleFingerprint
// ============================================================================

export interface StyleFingerprint {
  author: string;
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  dialogueRatio: number;
  descriptionRatio: number;
  longSentenceRatio: number; // sentences > 30 chars
  passiveVoiceRatio: number;
  uniqueWordRatio: number;
}

export class AuthorStyleFingerprint {
  private _sentenceSplitter = /[。！？.!?\n]+/;

  extract(author: string, text: string): StyleFingerprint {
    const sentences = text.split(this._sentenceSplitter).filter((s) => s.trim().length > 0);
    const words = text.split(/[\s，。！？,.\!?]+/).filter((w) => w.length > 0);
    const sentenceLengths = sentences.map((s) => s.length);
    const avgSentenceLength = sentences.length > 0 ? sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length : 0;
    const sentenceLengthVariance = sentences.length > 0
      ? Math.sqrt(sentenceLengths.reduce((s, l) => s + (l - avgSentenceLength) ** 2, 0) / sentences.length)
      : 0;
    const longSentences = sentenceLengths.filter((l) => l > 30).length;
    const longSentenceRatio = sentences.length > 0 ? longSentences / sentences.length : 0;
    const dialogueMatches = (text.match(/[""「」]/g) || []).length;
    const dialogueRatio = sentences.length > 0 ? dialogueMatches / sentences.length : 0;
    const descriptionRatio = longSentenceRatio - dialogueRatio; // approximation
    const passiveMatches = (text.match(/被[\u4e00-\u9fa5]{1,4}|was\s+\w+ed|were\s+\w+ed/gi) || []).length;
    const passiveVoiceRatio = sentences.length > 0 ? passiveMatches / sentences.length : 0;
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const uniqueWordRatio = words.length > 0 ? uniqueWords.size / words.length : 0;
    return {
      author,
      avgSentenceLength,
      sentenceLengthVariance,
      dialogueRatio,
      descriptionRatio,
      longSentenceRatio,
      passiveVoiceRatio,
      uniqueWordRatio,
    };
  }

  compare(a: StyleFingerprint, b: StyleFingerprint): number {
    // 0 = identical, 1 = very different
    const lenDiff = Math.abs(a.avgSentenceLength - b.avgSentenceLength) / 50;
    const dialogueDiff = Math.abs(a.dialogueRatio - b.dialogueRatio);
    const descDiff = Math.abs(a.descriptionRatio - b.descriptionRatio);
    const longDiff = Math.abs(a.longSentenceRatio - b.longSentenceRatio);
    const passiveDiff = Math.abs(a.passiveVoiceRatio - b.passiveVoiceRatio);
    return Math.min(1, (lenDiff + dialogueDiff + descDiff + longDiff + passiveDiff) / 5);
  }

  areSimilar(a: StyleFingerprint, b: StyleFingerprint, threshold = 0.3): boolean {
    return this.compare(a, b) < threshold;
  }
}

// ============================================================================
// Engine 2: LuXunStyle
// ============================================================================

export class LuXunStyle {
  private _characteristics = {
    shortSentences: true,
    irony: true,
    socialCritique: true,
    colloquial: true,
  };

  score(text: string): number {
    let score = 0;
    if (/讽刺|尖锐|批判|冷峻|辛辣|satire|critique/.test(text)) score += 0.3;
    if (/，|。|；/.test(text)) score += 0.1; // uses Chinese punctuation heavily
    if (text.length < 200) score += 0.1; // Lu Xun used short
    if (/，.{1,15}，/.test(text)) score += 0.2; // 短句夹句号
    if (/我|他|她/.test(text)) score += 0.1;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 3: LaoSheStyle
// ============================================================================

export class LaoSheStyle {
  score(text: string): number {
    let score = 0;
    if (/北京|胡同|茶馆|底层|老百姓|beijing/.test(text)) score += 0.3;
    if (/幽默|诙谐|讽刺|humor/.test(text)) score += 0.2;
    if (/老|小/.test(text)) score += 0.1; // 老X/小X naming
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 4: ZhangAilingStyle
// ============================================================================

export class ZhangAilingStyle {
  score(text: string): number {
    let score = 0;
    if (/细腻|情感|旧上海|繁华|苍凉|delicate|sentimental/.test(text)) score += 0.3;
    if (/她|女人|男人/.test(text)) score += 0.1;
    if (/旗袍|月|花|fragrance/.test(text)) score += 0.2;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 5: JinYongStyle
// ============================================================================

export class JinYongStyle {
  score(text: string): number {
    let score = 0;
    if (/武功|内力|招式|江湖|侠|martial arts|sect/.test(text)) score += 0.4;
    if (/剑法|刀法|掌法|拳法/.test(text)) score += 0.2;
    if (/大侠|英雄|豪杰/.test(text)) score += 0.1;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 6: GuLongStyle
// ============================================================================

export class GuLongStyle {
  score(text: string): number {
    let score = 0;
    if (/酒|刀|剑|月|孤独|lonely/.test(text)) score += 0.3;
    if (/冷|寂寞|无情|冷漠|cold/.test(text)) score += 0.2;
    if (/浪子|侠客/.test(text)) score += 0.1;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 7: HemingwayStyle
// ============================================================================

export class HemingwayStyle {
  score(text: string): number {
    let score = 0;
    // Short sentences (avg < 15 words)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgLen = sentences.length > 0 ? sentences.reduce((s, x) => s + x.length, 0) / sentences.length : 0;
    if (avgLen < 80) score += 0.3; // Hemingway was terse
    if (/\band\b|\bthe\b|\bhe\b|\bshe\b/i.test(text)) score += 0.1;
    if (/\b(iceberg|sea|mountain|bull|war)/i.test(text)) score += 0.2;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 8: FitzgeraldStyle
// ============================================================================

export class FitzgeraldStyle {
  score(text: string): number {
    let score = 0;
    if (/elegant|rich|glitter|gatsby|jazz|green light/i.test(text)) score += 0.4;
    if (/dream|illusion|wealth|lonely|melancholy/i.test(text)) score += 0.2;
    if (text.length > 200) score += 0.1; // Fitzgerald used longer sentences
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 9: JKRowlingStyle
// ============================================================================

export class JKRowlingStyle {
  score(text: string): number {
    let score = 0;
    if (/magic|wand|spell|wizard|hogwarts|harry|potter/i.test(text)) score += 0.4;
    if (/mysterious|secret|ancient|prophecy/i.test(text)) score += 0.2;
    if (/friend|loyal|courage/i.test(text)) score += 0.1;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 10: StyleSimilarity
// ============================================================================

export class StyleSimilarity {
  private _fingerprints = new AuthorStyleFingerprint();
  private _styleScores: Record<string, (text: string) => number> = {
    LuXun: new LuXunStyle().score,
    LaoShe: new LaoSheStyle().score,
    ZhangAiling: new ZhangAilingStyle().score,
    JinYong: new JinYongStyle().score,
    GuLong: new GuLongStyle().score,
    Hemingway: new HemingwayStyle().score,
    Fitzgerald: new FitzgeraldStyle().score,
    JKRowling: new JKRowlingStyle().score,
  };

  rankAuthors(text: string): { author: string; score: number }[] {
    const results: { author: string; score: number }[] = [];
    for (const [author, scorer] of Object.entries(this._styleScores)) {
      results.push({ author, score: scorer(text) });
    }
    return results.sort((a, b) => b.score - a.score);
  }

  mostSimilar(text: string): { author: string; score: number } {
    return this.rankAuthors(text)[0];
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AD_BATCH_1_ENGINES = {
  AuthorStyleFingerprint,
  LuXunStyle,
  LaoSheStyle,
  ZhangAilingStyle,
  JinYongStyle,
  GuLongStyle,
  HemingwayStyle,
  FitzgeraldStyle,
  JKRowlingStyle,
  StyleSimilarity,
} as const;

export type { Chapter };
