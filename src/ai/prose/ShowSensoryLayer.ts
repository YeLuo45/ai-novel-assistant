/**
 * ShowSensoryLayer.ts — Direction X, V3056-V3065 (Batch 2/3)
 * Prose Craft Mastery: 展示层 + 感官层
 *
 * 10 engines:
 * 1.  ShowVsTellDetector — show vs tell 检测
 * 2.  FilterWordDetector — 过滤词检测（意识到/感觉到/觉得）
 * 3.  AdverbDetector — 副词检测（尤其对话标签后）
 * 4.  GenericVerbAuditor — 通用动词审计
 * 5.  TellingEmotionDetector — 直接陈述情绪检测
 * 6.  SensoryPalette — 感官调色板（5 感分布）
 * 7.  SensoryDensity — 感官密度
 * 8.  VisualDominanceAuditor — 视觉主导审计
 * 9.  SoundScentTouchTracker — 声/嗅/触追踪
 * 10. ConcreteVsAbstractNouns — 具体 vs 抽象名词
 *
 * 灵感：Stephen King《写作这回事》/ Show Don't Tell 教学 / 写作教练
 */

// ============================================================================
// Engine 1: ShowVsTellDetector
// ============================================================================

export class ShowVsTellDetector {
  private _tellPhrases = [
    '他很生气', '她很高兴', '他感到悲伤', '她觉得害怕', '他很紧张', '她很兴奋',
    'he was angry', 'she was happy', 'he felt sad', 'she was scared', 'he was nervous',
  ];

  detect(text: string): { tellCount: number; tellExamples: string[] } {
    const examples: string[] = [];
    let count = 0;
    for (const phrase of this._tellPhrases) {
      if (text.toLowerCase().includes(phrase.toLowerCase())) {
        count += 1;
        examples.push(phrase);
      }
    }
    return { tellCount: count, tellExamples: examples };
  }

  tellRatio(text: string): number {
    const sentences = text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    const tells = this.detect(text).tellCount;
    return tells / sentences.length;
  }
}

// ============================================================================
// Engine 2: FilterWordDetector
// ============================================================================

export class FilterWordDetector {
  private _filterWords = [
    '意识到', '感觉到', '觉得', '想到', '看得出来', '看起来', '听起来',
    'realized', 'felt', 'thought', 'noticed', 'seemed', 'appeared', 'watched', 'heard', 'saw',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    let count = 0;
    for (const w of this._filterWords) {
      const re = new RegExp(w.toLowerCase(), 'g');
      const m = lower.match(re);
      if (m) count += m.length;
    }
    return count;
  }

  isOverFiltered(text: string, threshold = 5): boolean {
    return this.count(text) > threshold;
  }

  findExamples(text: string): string[] {
    const found: string[] = [];
    const lower = text.toLowerCase();
    for (const w of this._filterWords) {
      if (lower.includes(w.toLowerCase())) found.push(w);
    }
    return found;
  }
}

// ============================================================================
// Engine 3: AdverbDetector
// ============================================================================

export class AdverbDetector {
  // Chinese adverbs ending in 地
  // English adverbs ending in -ly
  private _chineseAdvRe = /[\u4e00-\u9fa5]{1,3}地/g;
  private _englishAdvRe = /\b\w+ly\b/gi;

  count(text: string): { chinese: number; english: number; total: number } {
    const c = (text.match(this._chineseAdvRe) || []).length;
    const e = (text.match(this._englishAdvRe) || []).length;
    return { chinese: c, english: e, total: c + e };
  }

  findAfterDialogueTag(text: string): string[] {
    const examples: string[] = [];
    // 说话标签后接 -ly 副词: "said quickly" / "说得很慢"
    const enRe = /said\s+\w+ly\b/gi;
    const zhRe = /说得很?[\u4e00-\u9fa5]{1,3}/g;
    const en = text.match(enRe) || [];
    const zh = text.match(zhRe) || [];
    examples.push(...en, ...zh);
    return examples;
  }
}

// ============================================================================
// Engine 4: GenericVerbAuditor
// ============================================================================

export class GenericVerbAuditor {
  private _genericVerbs = [
    '走', '去', '来', '看', '说', '想', '做', '弄',
    'walked', 'went', 'came', 'looked', 'said', 'thought', 'made', 'did', 'got', 'put',
  ];

  count(text: string): number {
    let count = 0;
    for (const v of this._genericVerbs) {
      const re = new RegExp(`\\b${v}\\b|${v}`, 'g');
      const m = text.match(re);
      if (m) count += m.length;
    }
    return count;
  }

  genericVerbRatio(text: string): number {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return 0;
    return this.count(text) / words.length;
  }

  suggestReplacements(verb: string): string[] {
    const map: Record<string, string[]> = {
      '走': ['踱步', '蹒跚', '疾走', '缓行'],
      '看': ['凝视', '瞥见', '扫视', '注视'],
      '说': ['低语', '喊道', '喃喃', '宣称'],
      'walked': ['strode', 'strolled', 'trudged', 'sauntered'],
      'said': ['whispered', 'shouted', 'murmured', 'declared'],
    };
    return map[verb] || [];
  }
}

// ============================================================================
// Engine 5: TellingEmotionDetector
// ============================================================================

export class TellingEmotionDetector {
  private _tells = [
    '他很开心', '她很伤心', '他很愤怒', '她很害怕', '他很焦虑', '她很沮丧',
    'he was happy', 'she was sad', 'he was angry', 'she was afraid', 'he was anxious',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    let count = 0;
    for (const t of this._tells) {
      const re = new RegExp(t.toLowerCase(), 'g');
      const m = lower.match(re);
      if (m) count += m.length;
    }
    return count;
  }

  examples(text: string): string[] {
    const lower = text.toLowerCase();
    return this._tells.filter((t) => lower.includes(t.toLowerCase()));
  }

  isOverTelling(text: string, threshold = 3): boolean {
    return this.count(text) > threshold;
  }
}

// ============================================================================
// Engine 6: SensoryPalette
// ============================================================================

export interface SenseDistribution {
  visual: number;
  auditory: number;
  olfactory: number;
  gustatory: number;
  tactile: number;
}

export class SensoryPalette {
  private _visual = ['看见', '颜色', '光', '影子', '红色', '亮', '暗', 'saw', 'looked', 'red', 'bright', 'shadow', 'color'];
  private _auditory = ['听见', '声音', '喊', '叫', '响', '静', 'heard', 'sound', 'shout', 'voice', 'loud', 'quiet', 'silence'];
  private _olfactory = ['闻到', '香', '臭', '气味', 'smelled', 'scent', 'fragrance', 'stench', 'odor'];
  private _gustatory = ['尝到', '味道', '甜', '苦', '辣', '酸', 'tasted', 'sweet', 'bitter', 'spicy', 'sour', 'flavor'];
  private _tactile = ['感到', '摸', '触', '冷', '热', '软', '硬', 'felt', 'touch', 'cold', 'hot', 'soft', 'hard', 'rough'];

  distribution(text: string): SenseDistribution {
    const lower = text.toLowerCase();
    const count = (words: string[]) => words.filter((w) => lower.includes(w.toLowerCase())).length;
    return {
      visual: count(this._visual),
      auditory: count(this._auditory),
      olfactory: count(this._olfactory),
      gustatory: count(this._gustatory),
      tactile: count(this._tactile),
    };
  }

  dominant(text: string): keyof SenseDistribution {
    const d = this.distribution(text);
    let best: keyof SenseDistribution = 'visual';
    let max = 0;
    for (const k of Object.keys(d) as (keyof SenseDistribution)[]) {
      if (d[k] > max) {
        max = d[k];
        best = k;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 7: SensoryDensity
// ============================================================================

export class SensoryDensity {
  private _sensoryRe = /(看见|听到|闻到|尝到|感到|摸到|saw|heard|smelled|tasted|felt|touched)/gi;

  perThousandChars(text: string): number {
    if (text.length === 0) return 0;
    const matches = text.match(this._sensoryRe) || [];
    return (matches.length / text.length) * 1000;
  }

  classify(text: string): 'low' | 'medium' | 'high' {
    const d = this.perThousandChars(text);
    if (d < 1) return 'low';
    if (d < 3) return 'medium';
    return 'high';
  }
}

// ============================================================================
// Engine 8: VisualDominanceAuditor
// ============================================================================

export class VisualDominanceAuditor {
  private _visual = ['看见', '颜色', '光', '影子', '红色', '亮', '暗', 'saw', 'looked', 'red', 'bright', 'shadow'];
  private _nonVisual = ['听见', '声音', '闻到', '感到', '摸到', 'heard', 'smelled', 'tasted', 'felt', 'touched'];

  visualRatio(text: string): number {
    const lower = text.toLowerCase();
    const v = this._visual.filter((w) => lower.includes(w.toLowerCase())).length;
    const nv = this._nonVisual.filter((w) => lower.includes(w.toLowerCase())).length;
    const total = v + nv;
    return total === 0 ? 0 : v / total;
  }

  isVisuallyImbalanced(text: string, threshold = 0.85): boolean {
    return this.visualRatio(text) > threshold;
  }
}

// ============================================================================
// Engine 9: SoundScentTouchTracker
// ============================================================================

export class SoundScentTouchTracker {
  private _soundWords = ['听见', '声音', '喊', '叫', '响', '静', 'heard', 'sound', 'shout', 'voice', 'loud', 'quiet', 'silence', 'whisper', 'bang'];
  private _scentWords = ['闻到', '香', '臭', '气味', 'smelled', 'scent', 'fragrance', 'stench', 'odor', 'perfume'];
  private _touchWords = ['感到', '摸', '触', '冷', '热', '软', '硬', 'felt', 'touch', 'cold', 'hot', 'soft', 'hard', 'rough', 'smooth'];

  countAll(text: string): { sound: number; scent: number; touch: number; total: number } {
    const lower = text.toLowerCase();
    const cnt = (w: string) => (lower.match(new RegExp(w, 'g')) || []).length;
    const sound = this._soundWords.reduce((s, w) => s + cnt(w.toLowerCase()), 0);
    const scent = this._scentWords.reduce((s, w) => s + cnt(w.toLowerCase()), 0);
    const touch = this._touchWords.reduce((s, w) => s + cnt(w.toLowerCase()), 0);
    return { sound, scent, touch, total: sound + scent + touch };
  }

  isUnderRepresented(text: string, threshold = 0.001): boolean {
    return this.countAll(text).total / text.length < threshold;
  }
}

// ============================================================================
// Engine 10: ConcreteVsAbstractNouns
// ============================================================================

export class ConcreteVsAbstractNouns {
  // Simplified: Chinese single-char abstract indicators
  private _abstractMarkers = ['情感', '思想', '精神', '理念', '原则', '主义', 'freedom', 'love', 'justice', 'concept', 'idea', 'belief', 'principle'];
  // Concrete: numbers, names, physical objects
  private _concreteMarkers = ['石头', '桌子', '杯子', '剑', '枪', 'door', 'table', 'sword', 'gun', 'car', 'phone'];

  ratio(text: string): { concrete: number; abstract: number; ratio: number } {
    const lower = text.toLowerCase();
    const cnt = (w: string) => (lower.match(new RegExp(w, 'g')) || []).length;
    const c = this._concreteMarkers.reduce((s, w) => s + cnt(w.toLowerCase()), 0);
    const a = this._abstractMarkers.reduce((s, w) => s + cnt(w.toLowerCase()), 0);
    const total = c + a;
    return { concrete: c, abstract: a, ratio: total === 0 ? 0 : c / total };
  }

  isTooAbstract(text: string, threshold = 0.3): boolean {
    return this.ratio(text).ratio < threshold;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const X_BATCH_2_ENGINES = {
  ShowVsTellDetector,
  FilterWordDetector,
  AdverbDetector,
  GenericVerbAuditor,
  TellingEmotionDetector,
  SensoryPalette,
  SensoryDensity,
  VisualDominanceAuditor,
  SoundScentTouchTracker,
  ConcreteVsAbstractNouns,
} as const;
