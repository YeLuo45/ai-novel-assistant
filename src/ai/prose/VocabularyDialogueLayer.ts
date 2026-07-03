/**
 * VocabularyDialogueLayer.ts — Direction X, V3066-V3075 (Batch 3/3 收口)
 * Prose Craft Mastery: 词汇层 + 对话层 + 视角·时态 + 收口
 *
 * 10 engines:
 * 1.  RepetitionDetector — 重复词检测
 * 2.  ConnotationAuditor — 色彩义/语域审计
 * 3.  WordEconomy — 字数经济性
 * 4.  DialogueTagVariety — 对话标签多样性
 * 5.  ActionBeatRatio — 动作节拍比
 * 6.  SubtextDetector — 潜台词检测
 * 7.  DialogueVoiceFingerprint — 对话声音指纹
 * 8.  POVConsistencyChecker — 视角一致性
 * 9.  TenseConsistency — 时态一致性
 * 10. POVSlipDetector — 视角滑移检测
 *
 * 灵感：The Elements of Style / 《风格的要素》/ 各种文笔教学
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: RepetitionDetector
// ============================================================================

export interface Repetition {
  word: string;
  count: number;
  positions: number[];
}

export class RepetitionDetector {
  private _stopWords = new Set(['的', '了', '是', '在', '和', '我', '你', '他', '她', '它', '我们', '你们', '他们', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'and', 'in', 'on', 'at', 'for']);

  detect(text: string, minLen = 3): Repetition[] {
    const words = this._tokenize(text);
    const counts = new Map<string, number[]>();
    for (let i = 0; i < words.length; i++) {
      const w = words[i].toLowerCase();
      if (w.length < minLen) continue;
      if (this._stopWords.has(w)) continue;
      if (!counts.has(w)) counts.set(w, []);
      counts.get(w)!.push(i);
    }
    const reps: Repetition[] = [];
    for (const [word, positions] of counts) {
      if (positions.length >= 3) {
        reps.push({ word, count: positions.length, positions });
      }
    }
    return reps.sort((a, b) => b.count - a.count);
  }

  topN(text: string, n = 5): Repetition[] {
    return this.detect(text).slice(0, n);
  }

  private _tokenize(text: string): string[] {
    return text.split(/[\s，。！？,.\!?]+/).filter((w) => w.length > 0);
  }
}

// ============================================================================
// Engine 2: ConnotationAuditor
// ============================================================================

export class ConnotationAuditor {
  // Positive/negative word lists (simplified)
  private _positive = ['爱', '温暖', '阳光', '希望', '幸福', '快乐', '美好', 'love', 'warm', 'sunshine', 'hope', 'happy', 'joy'];
  private _negative = ['恨', '黑暗', '死亡', '绝望', '痛苦', '悲伤', 'hate', 'dark', 'death', 'despair', 'pain', 'sad'];
  private _formal = ['故', '其', '此', '乃', '之', '乎', '者', 'herein', 'therefore', 'henceforth', 'whereby'];
  private _informal = ['啥', '咋', '甭', '俺', '嘚', 'gonna', 'wanna', 'kinda', 'yeah'];

  polarityScore(text: string): { positive: number; negative: number; bias: number } {
    const lower = text.toLowerCase();
    const p = this._positive.filter((w) => lower.includes(w.toLowerCase())).length;
    const n = this._negative.filter((w) => lower.includes(w.toLowerCase())).length;
    const total = p + n;
    return { positive: p, negative: n, bias: total === 0 ? 0 : (p - n) / total };
  }

  registerMix(text: string): { formal: number; informal: number } {
    const lower = text.toLowerCase();
    const f = this._formal.filter((w) => lower.includes(w.toLowerCase())).length;
    const i = this._informal.filter((w) => lower.includes(w.toLowerCase())).length;
    return { formal: f, informal: i };
  }
}

// ============================================================================
// Engine 3: WordEconomy
// ============================================================================

export class WordEconomy {
  private _redundancyPatterns = [
    /完完全全/g, /彻彻底底/g, /非常非常/g, /绝对绝对/g,
    /very very/gi, /really really/gi, /absolutely absolutely/gi,
    /完全彻底/g, /百分之百分之百/g,
  ];

  redundantPhrases(text: string): string[] {
    const found: string[] = [];
    for (const p of this._redundancyPatterns) {
      const m = text.match(p);
      if (m) found.push(...m);
    }
    return found;
  }

  redundancyCount(text: string): number {
    return this.redundantPhrases(text).length;
  }

  wordsSavedIfFixed(text: string): number {
    // Each redundant phrase is at least 2 words that could be 1
    return this.redundancyCount(text) * 1;
  }
}

// ============================================================================
// Engine 4: DialogueTagVariety
// ============================================================================

export class DialogueTagVariety {
  private _commonTags = ['说', '道', '问', '喊', '叫', '答', 'said', 'asked', 'shouted', 'replied', 'whispered', 'murmured'];

  distribution(text: string): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const tag of this._commonTags) {
      const re = new RegExp(tag, 'g');
      const m = text.match(re);
      if (m) dist[tag] = m.length;
    }
    return dist;
  }

  uniqueTagRatio(text: string): number {
    const d = this.distribution(text);
    const total = Object.values(d).reduce((s, n) => s + n, 0);
    if (total === 0) return 0;
    return Object.keys(d).length / total;
  }

  isSaidHeavy(text: string, threshold = 0.7): boolean {
    const d = this.distribution(text);
    const total = Object.values(d).reduce((s, n) => s + n, 0);
    if (total === 0) return false;
    return (d['说'] || 0) / total > threshold || (d['said'] || 0) / total > threshold;
  }
}

// ============================================================================
// Engine 5: ActionBeatRatio
// ============================================================================

export class ActionBeatRatio {
  // Heuristic: action beats are non-quoted sentences after dialogue
  private _dialogueRe = /"[^"]*"|"[^"]*"|「[^」]*」/g;
  private _actionVerbRe = /^[\u4e00-\u9fa5]*[走跑看想坐站转头笑叹握推][\u4e00-\u9fa5，。]|^[A-Z][a-z]+\s+[a-z]+/;

  ratio(text: string): { dialogue: number; action: number; ratio: number } {
    const segments = text.split(this._dialogueRe);
    let action = 0;
    for (const s of segments) {
      if (s.trim().length > 5 && this._actionVerbRe.test(s.trim())) action += 1;
    }
    const dialogues = (text.match(this._dialogueRe) || []).length;
    const total = dialogues + action;
    return { dialogue: dialogues, action, ratio: total === 0 ? 0 : dialogues / total };
  }

  isActionHeavy(text: string, threshold = 0.3): boolean {
    return this.ratio(text).ratio < threshold;
  }
}

// ============================================================================
// Engine 6: SubtextDetector
// ============================================================================

export class SubtextDetector {
  // Subtext markers: 嘴上说 X，心里想 Y / 表面笑，心里哭 / say X but mean Y
  private _subtextPatterns = [
    /嘴上说[^，]*心里/g,
    /表面[^，]*实际/g,
    /虽然[^，]*但是[^。]*?(爱|恨|喜|怒|悲|欢)/g,
    /said.*but meant/gi,
    /smiled.*but/gi,
  ];

  detect(text: string): string[] {
    const found: string[] = [];
    for (const p of this._subtextPatterns) {
      const m = text.match(p);
      if (m) found.push(...m);
    }
    return found;
  }

  count(text: string): number {
    return this.detect(text).length;
  }

  hasSubtext(text: string): boolean {
    return this.count(text) > 0;
  }
}

// ============================================================================
// Engine 7: DialogueVoiceFingerprint
// ============================================================================

export interface VoiceProfile {
  charId: string;
  avgSentenceLength: number;
  uniqueWords: number;
  questionRatio: number;
  exclamationRatio: number;
}

export class DialogueVoiceFingerprint {
  private _profiles = new Map<string, VoiceProfile>();

  extract(charId: string, lines: string[]): VoiceProfile {
    const all = lines.join(' ');
    const sentences = all.split(/[。！.!?]+/).filter((s) => s.trim().length > 0);
    const words = all.split(/\s+/).filter((w) => w.length > 0);
    const uniqueWords = new Set(words).size;
    // Count questions from raw text (？ is split-out by regex)
    const questions = (all.match(/[？?]/g) || []).length;
    const exclamations = (all.match(/[！!]/g) || []).length;
    const profile: VoiceProfile = {
      charId,
      avgSentenceLength: sentences.length > 0 ? all.length / sentences.length : 0,
      uniqueWords,
      questionRatio: sentences.length > 0 ? questions / sentences.length : 0,
      exclamationRatio: sentences.length > 0 ? exclamations / sentences.length : 0,
    };
    this._profiles.set(charId, profile);
    return profile;
  }

  differentiate(a: VoiceProfile, b: VoiceProfile): number {
    let diff = 0;
    if (Math.abs(a.avgSentenceLength - b.avgSentenceLength) > 10) diff += 1;
    if (Math.abs(a.questionRatio - b.questionRatio) > 0.2) diff += 1;
    if (Math.abs(a.exclamationRatio - b.exclamationRatio) > 0.2) diff += 1;
    return diff;
  }

  areVoicesDistinct(a: VoiceProfile, b: VoiceProfile): boolean {
    return this.differentiate(a, b) >= 2;
  }
}

// ============================================================================
// Engine 8: POVConsistencyChecker
// ============================================================================

export type POVType = 'first' | 'second' | 'third_limited' | 'third_omniscient';

export class POVConsistencyChecker {
  private _firstPersonMarkers = ['我', '我的', '我自己', 'I', 'me', 'my', 'myself', 'we', 'us', 'our'];
  private _secondPersonMarkers = ['你', '你的', 'you', 'your', 'yours'];

  detect(text: string): POVType {
    const lower = text.toLowerCase();
    const f = this._firstPersonMarkers.filter((m) => lower.includes(m.toLowerCase())).length;
    const s = this._secondPersonMarkers.filter((m) => lower.includes(m.toLowerCase())).length;
    if (f > s && f >= 2) return 'first';
    if (s > f && s >= 2) return 'second';
    return 'third_limited';
  }

  isConsistent(pov1: POVType, pov2: POVType): boolean {
    if (pov1 === pov2) return true;
    if (pov1 === 'third_limited' && pov2 === 'third_omniscient') return true;
    if (pov1 === 'third_omniscient' && pov2 === 'third_limited') return true;
    return false;
  }
}

// ============================================================================
// Engine 9: TenseConsistency
// ============================================================================

export class TenseConsistency {
  private _pastTense = ['was', 'were', 'did', 'went', 'came', 'saw', 'said', 'thought', 'walked', 'ran', 'ate', 'took', 'made'];
  private _presentTense = ['is', 'am', 'are', 'do', 'go', 'come', 'see', 'say', 'think', 'walk', 'run', 'eat', 'take', 'make'];
  private _chinesePast = ['了', '过', '曾', '曾经'];
  private _chinesePresent = ['在', '正在', '此刻'];

  detect(text: string): 'past' | 'present' | 'mixed' {
    const lower = text.toLowerCase();
    const pastCount = this._pastTense.filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(lower)).length +
      this._chinesePast.filter((p) => text.includes(p)).length;
    const presentCount = this._presentTense.filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(lower)).length +
      this._chinesePresent.filter((p) => text.includes(p)).length;
    if (pastCount > presentCount * 2) return 'past';
    if (presentCount > pastCount * 2) return 'present';
    return 'mixed';
  }

  isConsistent(t1: 'past' | 'present' | 'mixed', t2: 'past' | 'present' | 'mixed'): boolean {
    if (t1 === 'mixed' || t2 === 'mixed') return true;
    return t1 === t2;
  }
}

// ============================================================================
// Engine 10: POVSlipDetector (head-hopping detection)
// ============================================================================

export interface POVSlip {
  paragraph: number;
  fromPOV: POVType;
  toPOV: POVType;
  isSlip: boolean;
}

export class POVSlipDetector {
  private _pov = new POVConsistencyChecker();

  detect(paragraphs: string[]): POVSlip[] {
    const slips: POVSlip[] = [];
    let prevPOV: POVType | null = null;
    for (let i = 0; i < paragraphs.length; i++) {
      const pov = this._pov.detect(paragraphs[i]);
      if (prevPOV && !this._pov.isConsistent(prevPOV, pov)) {
        slips.push({ paragraph: i, fromPOV: prevPOV, toPOV: pov, isSlip: true });
      } else {
        slips.push({ paragraph: i, fromPOV: pov, toPOV: pov, isSlip: false });
      }
      prevPOV = pov;
    }
    return slips;
  }

  hasSlip(paragraphs: string[]): boolean {
    return this.detect(paragraphs).some((s) => s.isSlip);
  }

  countSlips(paragraphs: string[]): number {
    return this.detect(paragraphs).filter((s) => s.isSlip).length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const X_BATCH_3_ENGINES = {
  RepetitionDetector,
  ConnotationAuditor,
  WordEconomy,
  DialogueTagVariety,
  ActionBeatRatio,
  SubtextDetector,
  DialogueVoiceFingerprint,
  POVConsistencyChecker,
  TenseConsistency,
  POVSlipDetector,
} as const;

export const X_ALL_ENGINES = {
  SentenceLengthDistribution: undefined as any,
  OpenerVariety: undefined as any,
  SentenceTypeMix: undefined as any,
  ParagraphLengthDist: undefined as any,
  ActivePassiveRatio: undefined as any,
  LongShortAlternation: undefined as any,
  ClauseComplexity: undefined as any,
  PhraseLengthHistogram: undefined as any,
  SyntacticVarietyScore: undefined as any,
  SentenceCadence: undefined as any,
  ShowVsTellDetector: undefined as any,
  FilterWordDetector: undefined as any,
  AdverbDetector: undefined as any,
  GenericVerbAuditor: undefined as any,
  TellingEmotionDetector: undefined as any,
  SensoryPalette: undefined as any,
  SensoryDensity: undefined as any,
  VisualDominanceAuditor: undefined as any,
  SoundScentTouchTracker: undefined as any,
  ConcreteVsAbstractNouns: undefined as any,
  RepetitionDetector,
  ConnotationAuditor,
  WordEconomy,
  DialogueTagVariety,
  ActionBeatRatio,
  SubtextDetector,
  DialogueVoiceFingerprint,
  POVConsistencyChecker,
  TenseConsistency,
  POVSlipDetector,
} as const;

export class ProseCraftIndex {
  list(): string[] {
    return [
      'SentenceLengthDistribution', 'OpenerVariety', 'SentenceTypeMix',
      'ParagraphLengthDist', 'ActivePassiveRatio', 'LongShortAlternation',
      'ClauseComplexity', 'PhraseLengthHistogram', 'SyntacticVarietyScore', 'SentenceCadence',
      'ShowVsTellDetector', 'FilterWordDetector', 'AdverbDetector', 'GenericVerbAuditor',
      'TellingEmotionDetector', 'SensoryPalette', 'SensoryDensity', 'VisualDominanceAuditor',
      'SoundScentTouchTracker', 'ConcreteVsAbstractNouns',
      'RepetitionDetector', 'ConnotationAuditor', 'WordEconomy', 'DialogueTagVariety',
      'ActionBeatRatio', 'SubtextDetector', 'DialogueVoiceFingerprint',
      'POVConsistencyChecker', 'TenseConsistency', 'POVSlipDetector',
    ];
  }

  count(): number {
    return this.list().length;
  }
}
