/**
 * WriterAnalysis.ts — Direction AK, V3406-V3415 (Batch 1/3)
 * Adaptive Writing Coach: 写作者分析
 *
 * 10 engines:
 * 1.  WriterStrengthFinder — 写作者强项发现
 * 2.  WriterWeaknessFinder — 弱项发现
 * 3.  WritingStyleAnalyzer — 写作风格分析
 * 4.  PacingProfiler — 节奏画像
 * 5.  DialogueProfiler — 对话画像
 * 6.  DescriptionProfiler — 描写画像
 * 7.  CharacterProfiler — 角色画像
 * 8.  PlotProfiler — 情节画像
 * 9.  GenreAffinityDetector — 类型适配检测
 * 10. WriterAnalysisIndex — 收口
 *
 * 灵感：个人化写作教练 / 学习曲线
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: WriterStrengthFinder
// ============================================================================

export class WriterStrengthFinder {
  private _strengthKeywords: Record<string, string[]> = {
    action: ['战斗', '追逐', '爆炸', '冲刺', 'battle', 'chase', 'explosion'],
    emotion: ['爱', '恨', '悲伤', '思念', 'love', 'hate', 'sadness', 'longing'],
    description: ['天空', '云', '风', '光', 'sky', 'cloud', 'wind', 'light'],
    dialogue: ['说', '问', '答', '叫', 'said', 'asked', 'replied', 'shouted'],
  };

  detect(text: string): { category: string; score: number } | null {
    const lower = text.toLowerCase();
    let best = { category: 'general', score: 0 };
    for (const [cat, keywords] of Object.entries(this._strengthKeywords)) {
      const count = keywords.reduce((s, k) => s + (lower.match(new RegExp(k.toLowerCase(), 'g')) || []).length, 0);
      if (count > best.score) best = { category: cat, score: count };
    }
    return best.score > 0 ? best : null;
  }

  isStrength(category: string, text: string, threshold = 3): boolean {
    const r = this.detect(text);
    return r?.category === category && r.score >= threshold;
  }
}

// ============================================================================
// Engine 2: WriterWeaknessFinder
// ============================================================================

export class WriterWeaknessFinder {
  private _weaknessIndicators: Record<string, string[]> = {
    pacing: ['的', '了', '是', '在', '然后', '接着'],
    show: ['他很', '她很', '感到', '觉得', 'he was', 'she was', 'felt'],
    variety: ['然后', '接着', '于是', '然后他', 'then', 'next', 'after that'],
  };

  detect(text: string): { category: string; count: number }[] {
    const results: { category: string; count: number }[] = [];
    const lower = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(this._weaknessIndicators)) {
      const count = keywords.reduce((s, k) => s + (lower.match(new RegExp(k.toLowerCase(), 'g')) || []).length, 0);
      if (count > 0) results.push({ category: cat, count });
    }
    return results.sort((a, b) => b.count - a.count);
  }

  topWeakness(text: string): { category: string; count: number } | null {
    return this.detect(text)[0] || null;
  }
}

// ============================================================================
// Engine 3: WritingStyleAnalyzer
// ============================================================================

export class WritingStyleAnalyzer {
  analyze(text: string): { avgSentenceLen: number; paragraphCount: number; dialogueRatio: number; descriptionRatio: number } {
    const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);
    const avgSentenceLen = sentences.length > 0 ? text.length / sentences.length : 0;
    const dialogueCount = (text.match(/[""「」]/g) || []).length;
    const dialogueRatio = sentences.length > 0 ? dialogueCount / sentences.length : 0;
    const descriptionRatio = paragraphs.length > 0 ? (paragraphs.length - dialogueCount / 2) / paragraphs.length : 0;
    return {
      avgSentenceLen,
      paragraphCount: paragraphs.length,
      dialogueRatio,
      descriptionRatio: Math.max(0, descriptionRatio),
    };
  }
}

// ============================================================================
// Engine 4: PacingProfiler
// ============================================================================

export class PacingProfiler {
  profile(chapters: Chapter[]): { avgWordsPerChapter: number; pacing: 'slow' | 'normal' | 'fast' } {
    if (chapters.length === 0) return { avgWordsPerChapter: 0, pacing: 'normal' };
    const total = chapters.reduce((s, c) => s + (c.content?.length || 0), 0);
    const avg = total / chapters.length;
    let pacing: 'slow' | 'normal' | 'fast' = 'normal';
    if (avg < 1000) pacing = 'slow';
    else if (avg > 3000) pacing = 'fast';
    return { avgWordsPerChapter: avg, pacing };
  }
}

// ============================================================================
// Engine 5: DialogueProfiler
// ============================================================================

export class DialogueProfiler {
  profile(text: string): { dialogueCount: number; avgDialogueLen: number; tagVariety: number } {
    const matches = text.match(/[""「"][^""「」]*[""「"]/g) || [];
    const tags = ['说', '问', '答', '叫', '喊道', '低语', 'said', 'asked', 'replied', 'shouted', 'whispered'];
    const tagVariety = tags.filter((t) => text.includes(t)).length;
    return {
      dialogueCount: matches.length,
      avgDialogueLen: matches.length > 0 ? matches.reduce((s, m) => s + m.length, 0) / matches.length : 0,
      tagVariety,
    };
  }
}

// ============================================================================
// Engine 6: DescriptionProfiler
// ============================================================================

export class DescriptionProfiler {
  private _senses = ['看', '听', '闻', '摸', '尝', 'see', 'hear', 'smell', 'touch', 'taste'];

  profile(text: string): { sensoryCount: number; usedSenses: string[] } {
    const lower = text.toLowerCase();
    const usedSenses = this._senses.filter((s) => lower.includes(s.toLowerCase()));
    return {
      sensoryCount: usedSenses.length,
      usedSenses,
    };
  }

  isRich(text: string, threshold = 3): boolean {
    return this.profile(text).sensoryCount >= threshold;
  }
}

// ============================================================================
// Engine 7: CharacterProfiler
// ============================================================================

export class CharacterProfiler {
  private _characterKeywords = ['他', '她', '我', '你', '他们', 'he', 'she', 'I', 'you', 'they'];

  profile(text: string): { characterMentions: number; uniqueCharacters: number } {
    const lower = text.toLowerCase();
    const mentions = this._characterKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    return {
      characterMentions: mentions,
      uniqueCharacters: this._characterKeywords.filter((k) => lower.includes(k.toLowerCase())).length,
    };
  }
}

// ============================================================================
// Engine 8: PlotProfiler
// ============================================================================

export class PlotProfiler {
  private _plotKeywords = ['因为', '所以', '导致', '结果', '因为', '由于', 'therefore', 'because', 'so', 'hence', 'thus'];

  profile(text: string): { causalLinks: number; causalDensity: number } {
    const lower = text.toLowerCase();
    const causalLinks = this._plotKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    return {
      causalLinks,
      causalDensity: sentences.length > 0 ? causalLinks / sentences.length : 0,
    };
  }

  isCausallyRich(text: string, threshold = 0.1): boolean {
    return this.profile(text).causalDensity > threshold;
  }
}

// ============================================================================
// Engine 9: GenreAffinityDetector
// ============================================================================

export class GenreAffinityDetector {
  private _genreKeywords: Record<string, string[]> = {
    wuxia: ['剑', '武功', '江湖', '侠', 'sword', 'martial'],
    romance: ['爱', '情', '心', 'love', 'heart', 'romance'],
    mystery: ['谜', '案', '证据', 'mystery', 'clue', 'evidence'],
    scifi: ['太空', '机器人', '未来', 'space', 'robot', 'future'],
    fantasy: ['魔法', '精灵', '龙', 'magic', 'elf', 'dragon'],
  };

  detect(text: string): { genre: string; score: number } {
    const lower = text.toLowerCase();
    let best = { genre: 'general', score: 0 };
    for (const [genre, keywords] of Object.entries(this._genreKeywords)) {
      const count = keywords.reduce((s, k) => s + (lower.match(new RegExp(k.toLowerCase(), 'g')) || []).length, 0);
      if (count > best.score) best = { genre, score: count };
    }
    return best;
  }

  isAffinity(genre: string, text: string, threshold = 3): boolean {
    const r = this.detect(text);
    return r.genre === genre && r.score >= threshold;
  }
}

// ============================================================================
// Engine 10: WriterAnalysisIndex
// ============================================================================

export class WriterAnalysisIndex {
  list(): string[] {
    return [
      'WriterStrengthFinder', 'WriterWeaknessFinder', 'WritingStyleAnalyzer',
      'PacingProfiler', 'DialogueProfiler', 'DescriptionProfiler',
      'CharacterProfiler', 'PlotProfiler', 'GenreAffinityDetector',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AK_BATCH_1_ENGINES = {
  WriterStrengthFinder,
  WriterWeaknessFinder,
  WritingStyleAnalyzer,
  PacingProfiler,
  DialogueProfiler,
  DescriptionProfiler,
  CharacterProfiler,
  PlotProfiler,
  GenreAffinityDetector,
  WriterAnalysisIndex,
} as const;

export type { Chapter };
