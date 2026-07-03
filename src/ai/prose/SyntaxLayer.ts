/**
 * SyntaxLayer.ts — Direction X, V3046-V3055 (Batch 1/3)
 * Prose Craft Mastery: 句法层分析
 *
 * 10 engines:
 * 1.  SentenceLengthDistribution — 句长分布
 * 2.  OpenerVariety — 句子开头多样性
 * 3.  SentenceTypeMix — 句型混合（陈述/疑问/感叹/祈使）
 * 4.  ParagraphLengthDist — 段长分布
 * 5.  ActivePassiveRatio — 主动/被动语态比
 * 6.  LongShortAlternation — 长短句交替
 * 7.  ClauseComplexity — 从句复杂度
 * 8.  PhraseLengthHistogram — 短语长度直方图
 * 9.  SyntacticVarietyScore — 句法多样性评分
 * 10. SentenceCadence — 句子节奏（句尾词类）
 *
 * 灵感来源：Hemingway Editor / ProWritingAid / 《On Writing Well》
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Helpers
// ============================================================================

function splitSentences(text: string): string[] {
  if (!text) return [];
  // Split on 。！？. ! ? + newlines
  return text
    .split(/[。！？.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitParagraphs(text: string): string[] {
  if (!text) return [];
  return text.split(/\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
}

// ============================================================================
// Engine 1: SentenceLengthDistribution
// ============================================================================

export interface LengthStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdev: number;
}

export class SentenceLengthDistribution {
  analyze(text: string): LengthStats {
    const sents = splitSentences(text);
    if (sents.length === 0) return { mean: 0, median: 0, min: 0, max: 0, stdev: 0 };
    const lengths = sents.map((s) => s.length);
    const sum = lengths.reduce((a, b) => a + b, 0);
    const mean = sum / lengths.length;
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = lengths.reduce((s, l) => s + (l - mean) ** 2, 0) / lengths.length;
    return {
      mean,
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      stdev: Math.sqrt(variance),
    };
  }

  distribution(text: string, bins = 5): number[] {
    const sents = splitSentences(text);
    if (sents.length === 0) return new Array(bins).fill(0);
    const lengths = sents.map((s) => s.length);
    const max = Math.max(...lengths);
    const binSize = (max + 1) / bins;
    const dist = new Array(bins).fill(0);
    for (const l of lengths) {
      const idx = Math.min(bins - 1, Math.floor(l / binSize));
      dist[idx] += 1;
    }
    return dist;
  }
}

// ============================================================================
// Engine 2: OpenerVariety
// ============================================================================

export class OpenerVariety {
  private _stopChars = new Set(['的', '了', '是', '在', '和', '与', '及']);

  uniqueOpenerRatio(text: string): number {
    const sents = splitSentences(text);
    if (sents.length === 0) return 0;
    const openers = sents.map((s) => s[0] || '');
    const unique = new Set(openers);
    return unique.size / openers.length;
  }

  mostCommonOpener(text: string): { char: string; count: number } {
    const sents = splitSentences(text);
    if (sents.length === 0) return { char: '', count: 0 };
    const counts = new Map<string, number>();
    for (const s of sents) {
      const c = s[0] || '';
      if (this._stopChars.has(c)) continue;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    let best = { char: '', count: 0 };
    for (const [c, n] of counts) {
      if (n > best.count) best = { char: c, count: n };
    }
    return best;
  }
}

// ============================================================================
// Engine 3: SentenceTypeMix
// ============================================================================

export type SentenceType = 'declarative' | 'interrogative' | 'exclamatory' | 'imperative';

export class SentenceTypeMix {
  classify(sentence: string): SentenceType {
    const t = sentence.trim();
    if (/[！!]$/.test(t)) return 'exclamatory';
    if (/[？?]$/.test(t)) return 'interrogative';
    if (/^(请|不要|必须|let|please|don't|do)/i.test(t)) return 'imperative';
    return 'declarative';
  }

  distribution(text: string): Record<SentenceType, number> {
    const dist: Record<SentenceType, number> = {
      declarative: 0,
      interrogative: 0,
      exclamatory: 0,
      imperative: 0,
    };
    for (const s of splitSentences(text)) {
      dist[this.classify(s)] += 1;
    }
    return dist;
  }

  dominant(text: string): SentenceType {
    const d = this.distribution(text);
    let best: SentenceType = 'declarative';
    let max = 0;
    for (const k of Object.keys(d) as SentenceType[]) {
      if (d[k] > max) {
        max = d[k];
        best = k;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 4: ParagraphLengthDist
// ============================================================================

export class ParagraphLengthDist {
  analyze(text: string): { mean: number; max: number; count: number } {
    const paras = splitParagraphs(text);
    if (paras.length === 0) return { mean: 0, max: 0, count: 0 };
    const lengths = paras.map((p) => p.length);
    const sum = lengths.reduce((a, b) => a + b, 0);
    return { mean: sum / paras.length, max: Math.max(...lengths), count: paras.length };
  }

  countShort(text: string, threshold = 100): number {
    return splitParagraphs(text).filter((p) => p.length < threshold).length;
  }

  countLong(text: string, threshold = 500): number {
    return splitParagraphs(text).filter((p) => p.length > threshold).length;
  }
}

// ============================================================================
// Engine 5: ActivePassiveRatio
// ============================================================================

export class ActivePassiveRatio {
  // Chinese: 被 + verb = passive; English: was/were + past participle
  private _chinesePassive = /被[\u4e00-\u9fa5]{1,4}/g;
  private _englishPassive = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;

  count(text: string): { active: number; passive: number; ratio: number } {
    const sents = splitSentences(text);
    let active = 0;
    let passive = 0;
    for (const s of sents) {
      const p = (s.match(this._chinesePassive) || []).length + (s.match(this._englishPassive) || []).length;
      if (p > 0) passive += 1;
      else active += 1;
    }
    const total = active + passive;
    return { active, passive, ratio: total === 0 ? 0 : active / total };
  }

  isOverPassive(text: string, threshold = 0.4): boolean {
    return this.count(text).ratio < 1 - threshold;
  }
}

// ============================================================================
// Engine 6: LongShortAlternation
// ============================================================================

export class LongShortAlternation {
  private _longThreshold = 50;

  alternationScore(text: string): number {
    const sents = splitSentences(text);
    if (sents.length < 2) return 0;
    const lengths = sents.map((s) => s.length);
    let alternations = 0;
    for (let i = 1; i < lengths.length; i++) {
      const wasLong = lengths[i - 1] >= this._longThreshold;
      const isLong = lengths[i] >= this._longThreshold;
      if (wasLong !== isLong) alternations += 1;
    }
    return alternations / (lengths.length - 1);
  }

  isRhythmic(text: string, threshold = 0.5): boolean {
    return this.alternationScore(text) >= threshold;
  }
}

// ============================================================================
// Engine 7: ClauseComplexity
// ============================================================================

export class ClauseComplexity {
  // Chinese: ， ； English: , ;
  private _chineseClause = /[，；]/g;
  private _englishClause = /[,;]/g;

  averageClausesPerSentence(text: string): number {
    const sents = splitSentences(text);
    if (sents.length === 0) return 0;
    let totalClauses = 0;
    for (const s of sents) {
      const c = (s.match(this._chineseClause) || []).length + (s.match(this._englishClause) || []).length;
      totalClauses += c + 1;
    }
    return totalClauses / sents.length;
  }

  classifyComplexity(text: string): 'simple' | 'compound' | 'complex' {
    const avg = this.averageClausesPerSentence(text);
    if (avg < 1.5) return 'simple';
    if (avg < 2.5) return 'compound';
    return 'complex';
  }
}

// ============================================================================
// Engine 8: PhraseLengthHistogram
// ============================================================================

export class PhraseLengthHistogram {
  private _wordSplitter = /[\s，。、！？,.\!?]+/;

  histogram(text: string, maxLen = 10): number[] {
    const hist = new Array(maxLen).fill(0);
    const phrases = text.split(this._wordSplitter).filter((p) => p.length > 0);
    for (const p of phrases) {
      const len = Math.min(maxLen - 1, p.length);
      hist[len] += 1;
    }
    return hist;
  }

  medianPhraseLength(text: string): number {
    const phrases = text.split(this._wordSplitter).filter((p) => p.length > 0).map((p) => p.length);
    if (phrases.length === 0) return 0;
    const sorted = [...phrases].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
}

// ============================================================================
// Engine 9: SyntacticVarietyScore
// ============================================================================

export class SyntacticVarietyScore {
  score(text: string): number {
    const sents = splitSentences(text);
    if (sents.length === 0) return 0;
    const openers = sents.map((s) => s.slice(0, 3));
    const unique = new Set(openers);
    return unique.size / sents.length;
  }

  isMonotonous(text: string, threshold = 0.3): boolean {
    return this.score(text) < threshold;
  }
}

// ============================================================================
// Engine 10: SentenceCadence
// ============================================================================

export interface CadenceProfile {
  endsWithNoun: number;
  endsWithVerb: number;
  endsWithAdjective: number;
  endsWithParticle: number; // 吗/吧/呢/啊
}

export class SentenceCadence {
  private _particles = new Set(['吗', '吧', '呢', '啊', '呀', '哦', '嘛']);

  profile(text: string): CadenceProfile {
    const sents = splitSentences(text);
    const p: CadenceProfile = { endsWithNoun: 0, endsWithVerb: 0, endsWithAdjective: 0, endsWithParticle: 0 };
    for (const s of sents) {
      const last = s.slice(-1);
      if (this._particles.has(last)) p.endsWithParticle += 1;
      else if (/[\u4e00-\u9fa5]/.test(last)) p.endsWithNoun += 1; // 简化：所有汉字结尾归名词
      else p.endsWithVerb += 1;
    }
    return p;
  }

  dominantEnd(text: string): 'noun' | 'verb' | 'particle' {
    const p = this.profile(text);
    if (p.endsWithParticle > p.endsWithNoun && p.endsWithParticle > p.endsWithVerb) return 'particle';
    if (p.endsWithVerb > p.endsWithNoun) return 'verb';
    return 'noun';
  }
}

// ============================================================================
// Public API
// ============================================================================

export const X_BATCH_1_ENGINES = {
  SentenceLengthDistribution,
  OpenerVariety,
  SentenceTypeMix,
  ParagraphLengthDist,
  ActivePassiveRatio,
  LongShortAlternation,
  ClauseComplexity,
  PhraseLengthHistogram,
  SyntacticVarietyScore,
  SentenceCadence,
} as const;

// Re-export for convenience
export { type Chapter };
