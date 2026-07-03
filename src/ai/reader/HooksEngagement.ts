/**
 * HooksEngagement.ts — Direction Y, V3076-V3085 (Batch 1/3)
 * Reader Psychology & Engagement: 钩子体系 + 情绪曲线 + 共情触发
 *
 * 10 engines:
 * 1.  ChapterOpenerHook — 章节开头钩子
 * 2.  ChapterCliffhangerScorer — 章节悬念评分
 * 3.  PageTurnStrength — 翻页强度（章末段）
 * 4.  HookDensityPerKChar — 钩子密度（每千字）
 * 5.  InformationGapTracker — 信息缺口追踪
 * 6.  ReaderQuestionTracker — 读者问题追踪
 * 7.  SentimentArcAnalyzer — 情绪弧线分析
 * 8.  EmotionalBeatDetector — 情绪节拍检测
 * 9.  TensionCurveViz — 张力曲线可视化
 * 10. EmpathyTriggerDetector — 共情触发检测
 *
 * 灵感：起点留存模型 / 钩子理论 / Save the Cat 心理学 / 网文爽点分析
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: ChapterOpenerHook
// ============================================================================

export interface HookScore {
  chapter: number;
  firstSentence: string;
  hookStrength: number; // 0-1
  isHook: boolean;
}

export class ChapterOpenerHook {
  private _hookKeywords = [
    '突然', '意外', '但', '然而', '就在', '没想到', '就在这时', '一瞬间',
    'suddenly', 'unexpectedly', 'but', 'however', 'just then', 'at that moment',
  ];

  score(sentence: string): number {
    const lower = sentence.toLowerCase();
    const matches = this._hookKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    return Math.min(1, matches / 2);
  }

  analyze(chapter: Chapter): HookScore {
    const text = chapter.content || '';
    const firstSentence = text.split(/[。！？.!?\n]+/)[0]?.trim() || '';
    const hookStrength = this.score(firstSentence);
    return {
      chapter: chapter.order ?? 0,
      firstSentence,
      hookStrength,
      isHook: hookStrength >= 0.5,
    };
  }

  findWeakOpeners(chapters: Chapter[]): HookScore[] {
    return chapters
      .map((c) => this.analyze(c))
      .filter((h) => !h.isHook);
  }
}

// ============================================================================
// Engine 2: ChapterCliffhangerScorer
// ============================================================================

export class ChapterCliffhangerScorer {
  private _cliffKeywords = [
    '突然', '就在这时', '不料', '竟然', '原来', '真相是', '但', '然而',
    'suddenly', 'but', 'however', 'revealed', 'in fact', 'turns out',
  ];

  score(text: string): number {
    // Analyze last 200 chars
    const tail = text.slice(-200);
    const lower = tail.toLowerCase();
    const matches = this._cliffKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    return Math.min(1, matches / 2);
  }

  isCliffhanger(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }

  weakestChapters(chapters: Chapter[]): { chapter: number; score: number }[] {
    return chapters
      .map((c, i) => ({ chapter: i, score: this.score(c.content || '') }))
      .filter((c) => c.score < 0.5);
  }
}

// ============================================================================
// Engine 3: PageTurnStrength
// ============================================================================

export class PageTurnStrength {
  // Last 100 chars: high emotion/tension = page turn
  private _turnKeywords = [
    '?', '？', '!', '！', '?', '?', '?',  // suspense punctuation
    'why', 'how', 'what', 'why', 'who', '怎么', '为什么', '谁', '什么', '如何',
  ];

  score(text: string): number {
    if (!text) return 0;
    const tail = text.slice(-100);
    let count = 0;
    for (const k of this._turnKeywords) {
      const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const m = tail.match(re);
      if (m) count += m.length;
    }
    return Math.min(1, count / 3);
  }

  isStrong(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 4: HookDensityPerKChar
// ============================================================================

export class HookDensityPerKChar {
  private _hookPatterns = [
    /突然[^，。]*[，。]/g,
    /就在这时/g,
    /没想到/g,
    /竟然/g,
    /不料/g,
    /suddenly[^,.!?]*[,.!?]/gi,
    /but then/gi,
    /however/gi,
    /revealed/gi,
  ];

  count(text: string): number {
    let total = 0;
    for (const p of this._hookPatterns) {
      const m = text.match(p);
      if (m) total += m.length;
    }
    return total;
  }

  perKChar(text: string): number {
    if (text.length === 0) return 0;
    return (this.count(text) / text.length) * 1000;
  }

  classify(density: number): 'low' | 'medium' | 'high' {
    if (density < 0.5) return 'low';
    if (density < 2) return 'medium';
    return 'high';
  }
}

// ============================================================================
// Engine 5: InformationGapTracker
// ============================================================================

export interface GapItem {
  question: string;
  raisedChapter: number;
  resolvedChapter: number | null;
  isResolved: boolean;
}

export class InformationGapTracker {
  private _gaps: GapItem[] = [];

  raise(question: string, chapter: number): GapItem {
    const g: GapItem = { question, raisedChapter: chapter, resolvedChapter: null, isResolved: false };
    this._gaps.push(g);
    return g;
  }

  resolve(question: string, chapter: number): boolean {
    const g = this._gaps.find((x) => x.question === question && !x.isResolved);
    if (!g) return false;
    g.resolvedChapter = chapter;
    g.isResolved = true;
    return true;
  }

  getOpenGaps(): GapItem[] {
    return this._gaps.filter((g) => !g.isResolved);
  }

  getUnresolvedCount(): number {
    return this.getOpenGaps().length;
  }

  isOverwhelming(threshold = 10): boolean {
    return this.getUnresolvedCount() > threshold;
  }
}

// ============================================================================
// Engine 6: ReaderQuestionTracker
// ============================================================================

export class ReaderQuestionTracker {
  private _questionKeywords = [
    '为什么', '怎么', '谁', '什么', '哪里', '真的吗', '怎么办',
    'why', 'how', 'who', 'what', 'where', 'really', 'no way',
  ];

  countQuestions(text: string): number {
    const lower = text.toLowerCase();
    let count = 0;
    for (const k of this._questionKeywords) {
      const re = new RegExp(k, 'g');
      const m = lower.match(re);
      if (m) count += m.length;
    }
    return count;
  }

  // Plus actual ? marks
  explicitQuestions(text: string): number {
    return (text.match(/[？?]/g) || []).length;
  }

  totalImplicit(text: string): number {
    return this.countQuestions(text) + this.explicitQuestions(text);
  }
}

// ============================================================================
// Engine 7: SentimentArcAnalyzer
// ============================================================================

export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface SentimentPoint {
  chapter: number;
  sentiment: Sentiment;
  score: number; // -1 to 1
}

export class SentimentArcAnalyzer {
  private _positiveWords = ['爱', '温暖', '阳光', '希望', '幸福', '快乐', '美好', 'love', 'warm', 'happy', 'joy'];
  private _negativeWords = ['恨', '黑暗', '死亡', '绝望', '痛苦', '悲伤', 'hate', 'dark', 'death', 'despair', 'pain', 'sad'];

  analyze(text: string): number {
    const lower = text.toLowerCase();
    const p = this._positiveWords.filter((w) => lower.includes(w.toLowerCase())).length;
    const n = this._negativeWords.filter((w) => lower.includes(w.toLowerCase())).length;
    const total = p + n;
    if (total === 0) return 0;
    return (p - n) / total;
  }

  classify(score: number): Sentiment {
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }

  arc(chapters: Chapter[]): SentimentPoint[] {
    return chapters.map((c, i) => {
      const score = this.analyze(c.content || '');
      return { chapter: i, sentiment: this.classify(score), score };
    });
  }

  // Detect "emotional roller coaster": 3+ flips
  isRollerCoaster(arc: SentimentPoint[]): boolean {
    if (arc.length < 3) return false;
    let flips = 0;
    for (let i = 1; i < arc.length; i++) {
      if (arc[i].sentiment !== arc[i - 1].sentiment) flips += 1;
    }
    return flips >= 3;
  }
}

// ============================================================================
// Engine 8: EmotionalBeatDetector
// ============================================================================

export interface EmotionalBeat {
  chapter: number;
  emotion: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust';
  intensity: number;
}

export class EmotionalBeatDetector {
  private _emotionKeywords: Record<EmotionalBeat['emotion'], string[]> = {
    joy: ['开心', '高兴', '笑', '幸福', '爱', 'happy', 'joy', 'love', 'laugh'],
    sadness: ['哭', '泪', '伤心', '悲伤', '失去', 'sad', 'cry', 'tears', 'lost', 'grief'],
    anger: ['怒', '恨', '气', '愤怒', '生气', 'anger', 'hate', 'rage', 'furious'],
    fear: ['怕', '恐惧', '担心', '紧张', '害怕', 'fear', 'afraid', 'scared', 'anxious', 'worry'],
    surprise: ['惊', '意外', '没想到', '竟然', 'surprise', 'shock', 'unexpected', 'amazed'],
    disgust: ['恶', '讨厌', '恶心', 'disgust', 'hate', 'loathe', 'sick'],
  };

  detect(text: string, chapter: number): EmotionalBeat[] {
    const lower = text.toLowerCase();
    const beats: EmotionalBeat[] = [];
    for (const [emotion, keywords] of Object.entries(this._emotionKeywords)) {
      const matches = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
      if (matches > 0) {
        beats.push({
          chapter,
          emotion: emotion as EmotionalBeat['emotion'],
          intensity: Math.min(1, matches / 3),
        });
      }
    }
    return beats;
  }

  dominant(text: string, chapter: number): EmotionalBeat | null {
    const beats = this.detect(text, chapter);
    if (beats.length === 0) return null;
    return beats.reduce((best, b) => (b.intensity > best.intensity ? b : best));
  }
}

// ============================================================================
// Engine 9: TensionCurveViz
// ============================================================================

export class TensionCurveViz {
  profile(text: string): number {
    // Heuristic: count high-arousal words + exclamation/question marks
    const arousal = ['!', '！', '?', '？', '突然', '立刻', '马上', '现在', 'sudden', 'immediately', 'now', '!'];
    let count = 0;
    for (const a of arousal) {
      const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const m = text.match(re);
      if (m) count += m.length;
    }
    // Normalize by length
    if (text.length === 0) return 0;
    return Math.min(1, (count / text.length) * 100);
  }

  asciiCurve(values: number[]): string {
    if (values.length === 0) return '';
    const max = Math.max(...values, 0.01);
    const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    return values
      .map((v) => {
        const idx = Math.min(bars.length - 1, Math.floor((v / max) * bars.length));
        return bars[idx];
      })
      .join('');
  }

  buildCurve(chapters: Chapter[]): number[] {
    return chapters.map((c) => this.profile(c.content || ''));
  }
}

// ============================================================================
// Engine 10: EmpathyTriggerDetector
// ============================================================================

export class EmpathyTriggerDetector {
  // Empathy triggers: vulnerability, loss, love, family, sacrifice
  private _empathyKeywords = [
    '失去', '死亡', '病', '痛苦', '孤独', '无助', '思念', '家', '孩子', '母亲', '父亲',
    'lost', 'died', 'sick', 'pain', 'alone', 'helpless', 'miss', 'home', 'child', 'mother', 'father',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._empathyKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  density(text: string): number {
    if (text.length === 0) return 0;
    return this.count(text) / text.length;
  }

  isEmpathetic(text: string, threshold = 0.005): boolean {
    return this.density(text) > threshold;
  }

  triggerWords(text: string): string[] {
    const lower = text.toLowerCase();
    return this._empathyKeywords.filter((k) => lower.includes(k.toLowerCase()));
  }
}

// ============================================================================
// Public API
// ============================================================================

export const Y_BATCH_1_ENGINES = {
  ChapterOpenerHook,
  ChapterCliffhangerScorer,
  PageTurnStrength,
  HookDensityPerKChar,
  InformationGapTracker,
  ReaderQuestionTracker,
  SentimentArcAnalyzer,
  EmotionalBeatDetector,
  TensionCurveViz,
  EmpathyTriggerDetector,
} as const;
