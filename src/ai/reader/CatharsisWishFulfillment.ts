/**
 * CatharsisWishFulfillment.ts — Direction Y, V3086-V3095 (Batch 2/3)
 * Reader Psychology & Engagement: 净化与满足 + 风险预测 + 读者画像
 *
 * 10 engines:
 * 1.  CatharsisPointLocator — 情感净化点定位
 * 2.  WishFulfillmentTracker — 愿望满足追踪
 * 3.  DropOffRiskPredictor — 弃文风险预测
 * 4.  BoredomRiskDetector — 弃读风险（无聊）检测
 * 5.  ConfusionRiskDetector — 弃读风险（困惑）检测
 * 6.  MemoryLoadEstimator — 记忆负荷估算
 * 7.  POVConfusionAuditor — 视角混乱审计
 * 8.  TargetReaderPersona — 目标读者画像
 * 9.  BetaReaderSimulator — Beta 读者模拟器
 * 10. GenreExpectationChecker — 类型期望检查
 *
 * 灵感：起点留存模型 / 共情曲线 / 网文爽点 / 出版业 reader persona
 */

import type { Chapter } from '../pacing/StructureTemplates';
import { POVConsistencyChecker, POVSlipDetector } from '../prose/VocabularyDialogueLayer';

// ============================================================================
// Engine 1: CatharsisPointLocator
// ============================================================================

export interface CatharsisPoint {
  chapter: number;
  type: 'tears' | 'relief' | 'triumph' | 'revelation';
  intensity: number;
}

export class CatharsisPointLocator {
  private _catharsisKeywords: Record<CatharsisPoint['type'], string[]> = {
    tears: ['哭', '泪', '崩溃', '痛哭', '泪水', 'cry', 'tears', 'sobbing', 'grief'],
    relief: ['终于', '松了口气', '放下', '解脱', 'finally', 'relief', 'released', 'at peace'],
    triumph: ['胜利', '成功', '终于', '击败', 'victory', 'triumph', 'defeated', 'won'],
    revelation: ['真相', '原来', '明白了', '发现', 'truth', 'revealed', 'realized', 'discovered'],
  };

  detect(text: string, chapter: number): CatharsisPoint[] {
    const lower = text.toLowerCase();
    const points: CatharsisPoint[] = [];
    for (const [type, keywords] of Object.entries(this._catharsisKeywords)) {
      const matches = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
      if (matches >= 2) {
        points.push({
          chapter,
          type: type as CatharsisPoint['type'],
          intensity: Math.min(1, matches / 3),
        });
      }
    }
    return points;
  }

  findMajorCatharsis(chapters: Chapter[]): CatharsisPoint | null {
    let best: CatharsisPoint | null = null;
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      for (const p of this.detect(c.content || '', i)) {
        if (!best || p.intensity > best.intensity) best = p;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 2: WishFulfillmentTracker
// ============================================================================

export interface WishItem {
  id: string;
  description: string;
  raisedChapter: number;
  fulfilledChapter: number | null;
}

export class WishFulfillmentTracker {
  private _wishes: WishItem[] = [];
  private _counter = 0;

  raise(description: string, chapter: number): WishItem {
    this._counter += 1;
    const w: WishItem = {
      id: `w_${this._counter}`,
      description,
      raisedChapter: chapter,
      fulfilledChapter: null,
    };
    this._wishes.push(w);
    return w;
  }

  fulfill(id: string, chapter: number): boolean {
    const w = this._wishes.find((x) => x.id === id && x.fulfilledChapter === null);
    if (!w) return false;
    w.fulfilledChapter = chapter;
    return true;
  }

  getUnfulfilled(): WishItem[] {
    return this._wishes.filter((w) => w.fulfilledChapter === null);
  }

  fulfillmentRate(): number {
    if (this._wishes.length === 0) return 0;
    return this._wishes.filter((w) => w.fulfilledChapter !== null).length / this._wishes.length;
  }
}

// ============================================================================
// Engine 3: DropOffRiskPredictor
// ============================================================================

export interface DropOffRisk {
  chapter: number;
  riskScore: number; // 0-1
  reasons: string[];
  isHigh: boolean;
}

export class DropOffRiskPredictor {
  evaluate(chapter: Chapter, totalChapters: number, idx: number): DropOffRisk {
    const reasons: string[] = [];
    let risk = 0;
    const text = chapter.content || '';
    const length = text.length;

    // Length risk: too short or too long
    if (length < 200) {
      risk += 0.3;
      reasons.push('too_short');
    } else if (length > 5000) {
      risk += 0.2;
      reasons.push('too_long');
    }

    // No dialogue in long chapter
    if (length > 2000 && !/[「""]/.test(text)) {
      risk += 0.2;
      reasons.push('no_dialogue');
    }

    // First chapter special risk
    if (idx === 0 && length < 500) {
      risk += 0.5;
      reasons.push('first_chapter_too_short');
    }

    // Stagnation in middle (5+ chapters without question mark)
    if (idx > 5 && idx < totalChapters - 5) {
      const hasQuestion = /[？?]/.test(text);
      if (!hasQuestion) {
        risk += 0.1;
        reasons.push('mid_stagnation');
      }
    }

    return {
      chapter: idx,
      riskScore: Math.min(1, risk),
      reasons,
      isHigh: risk >= 0.5,
    };
  }
}

// ============================================================================
// Engine 4: BoredomRiskDetector
// ============================================================================

export class BoredomRiskDetector {
  private _boredomKeywords = [
    '后来', '过了几天', '过了一段时间', '日子一天天过去', '平静地', '无事发生',
    'later', 'days passed', 'time went by', 'nothing happened', 'quietly',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._boredomKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  isBoring(text: string, threshold = 2): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 5: ConfusionRiskDetector
// ============================================================================

export class ConfusionRiskDetector {
  private _confusionIndicators = [
    '突然出现的', '前文未提', '原因不明', '不知道为什么', '莫名其妙',
    '突然', '无征兆', '毫无来由',
    'suddenly', 'without warning', 'no reason', 'unexplained',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._confusionIndicators.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  // High density of unexplained elements
  isConfusing(text: string, threshold = 3): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 6: MemoryLoadEstimator
// ============================================================================

export interface MemoryItem {
  type: 'character' | 'place' | 'event' | 'object' | 'concept';
  name: string;
  introducedChapter: number;
  lastReferencedChapter: number;
  stillRelevant: boolean;
}

export class MemoryLoadEstimator {
  private _items = new Map<string, MemoryItem>();

  add(item: Omit<MemoryItem, 'lastReferencedChapter' | 'stillRelevant'>): MemoryItem {
    const i: MemoryItem = { ...item, lastReferencedChapter: item.introducedChapter, stillRelevant: true };
    this._items.set(item.name, i);
    return i;
  }

  reference(name: string, chapter: number): void {
    const i = this._items.get(name);
    if (i) i.lastReferencedChapter = chapter;
  }

  decay(currentChapter: number, forgetThreshold = 20): MemoryItem[] {
    const stale: MemoryItem[] = [];
    for (const i of this._items.values()) {
      if (currentChapter - i.lastReferencedChapter > forgetThreshold) {
        i.stillRelevant = false;
        stale.push(i);
      }
    }
    return stale;
  }

  activeCount(): number {
    return Array.from(this._items.values()).filter((i) => i.stillRelevant).length;
  }

  isOverloaded(threshold = 30): boolean {
    return this.activeCount() > threshold;
  }
}

// ============================================================================
// Engine 7: POVConfusionAuditor
// ============================================================================

export class POVConfusionAuditor {
  private _pov = new POVConsistencyChecker();

  // Simulate: count POV switches per chapter
  audit(switchesPerChapter: number[]): { total: number; max: number; isConfusing: boolean } {
    const total = switchesPerChapter.reduce((s, n) => s + n, 0);
    const max = Math.max(...switchesPerChapter, 0);
    return {
      total,
      max,
      isConfusing: max > 3 || total > 30,
    };
  }

  // Audit actual text using POVConsistencyChecker
  auditText(paragraphs: string[]): { totalSwitches: number; isConfusing: boolean } {
    const slips = new POVSlipDetector();
    const detected = slips.detect(paragraphs);
    const totalSwitches = detected.filter((s) => s.isSlip).length;
    return { totalSwitches, isConfusing: totalSwitches > 3 };
  }
}

// ============================================================================
// Engine 8: TargetReaderPersona
// ============================================================================

export interface ReaderPersona {
  name: string;
  ageRange: [number, number];
  preferences: string[];
  expectations: string[];
  matchScore: number; // 0-1
}

export class TargetReaderPersona {
  // Built-in personas
  private _personas: ReaderPersona[] = [
    {
      name: 'web_novel_young_male',
      ageRange: [15, 30],
      preferences: ['爽点密集', '升级', '扮猪吃虎', '金手指', '快节奏'],
      expectations: ['主角光环', '3 章内升级', '反派智商在线'],
      matchScore: 0,
    },
    {
      name: 'romance_female',
      ageRange: [18, 40],
      preferences: ['情感细腻', '糖刀', 'HE', '强情感'],
      expectations: ['情感线', 'CP 锁死', '虐心'],
      matchScore: 0,
    },
    {
      name: 'literary_reader',
      ageRange: [25, 60],
      preferences: ['文笔', '深度', '隐喻', '留白'],
      expectations: ['人物弧', '主题', '语言美学'],
      matchScore: 0,
    },
  ];

  getPersonas(): ReaderPersona[] {
    return [...this._personas];
  }

  match(text: string): ReaderPersona {
    const lower = text.toLowerCase();
    let best = this._personas[0];
    let bestScore = 0;
    for (const p of this._personas) {
      const hits = p.preferences.filter((kw) => lower.includes(kw)).length;
      const score = hits / p.preferences.length;
      const updated = { ...p, matchScore: score };
      if (score > bestScore) {
        bestScore = score;
        best = updated;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 9: BetaReaderSimulator
// ============================================================================

export interface BetaFeedback {
  persona: string;
  rating: number; // 1-5
  comments: string[];
  wouldContinue: boolean;
}

export class BetaReaderSimulator {
  private _personas = ['web_novel_young_male', 'romance_female', 'literary_reader'];

  simulate(chapters: Chapter[]): BetaFeedback[] {
    const feedbacks: BetaFeedback[] = [];
    for (const persona of this._personas) {
      const total = chapters.length;
      const avgLen = chapters.length > 0 ? chapters.reduce((s, c) => s + (c.content?.length || 0), 0) / chapters.length : 0;
      let rating = 3;
      const comments: string[] = [];
      if (avgLen < 300) {
        rating -= 1;
        comments.push('章节太短，节奏快但深度不足');
      } else if (avgLen > 3000) {
        rating -= 0.5;
        comments.push('章节偏长，耐心挑战');
      }
      if (total < 5) {
        rating -= 0.5;
        comments.push('章节数太少，故事未展开');
      }
      feedbacks.push({
        persona,
        rating: Math.max(1, Math.min(5, rating)),
        comments,
        wouldContinue: rating >= 3,
      });
    }
    return feedbacks;
  }
}

// ============================================================================
// Engine 10: GenreExpectationChecker
// ============================================================================

export class GenreExpectationChecker {
  private _expectations: Record<string, string[]> = {
    mystery: ['线索', '证据', '嫌疑人', '真相', 'clue', 'evidence', 'suspect', 'reveal'],
    romance: ['相遇', '心动', '告白', '误会', 'meet', 'fall in love', 'confess', 'misunderstanding'],
    horror: ['恐惧', '阴影', '诡异', '不安', 'fear', 'shadow', 'eerie', 'unease'],
    scifi: ['科技', '未来', '太空', 'AI', 'technology', 'future', 'space', 'AI'],
    fantasy: ['魔法', '剑', '龙', '王国', 'magic', 'sword', 'dragon', 'kingdom'],
  };

  check(genre: string, text: string): { satisfied: number; total: number; ratio: number } {
    const keywords = this._expectations[genre] || [];
    if (keywords.length === 0) return { satisfied: 0, total: 0, ratio: 0 };
    const lower = text.toLowerCase();
    const satisfied = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
    return { satisfied, total: keywords.length, ratio: satisfied / keywords.length };
  }

  isGenreSatisfied(genre: string, text: string, threshold = 0.3): boolean {
    return this.check(genre, text).ratio >= threshold;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const Y_BATCH_2_ENGINES = {
  CatharsisPointLocator,
  WishFulfillmentTracker,
  DropOffRiskPredictor,
  BoredomRiskDetector,
  ConfusionRiskDetector,
  MemoryLoadEstimator,
  POVConfusionAuditor,
  TargetReaderPersona,
  BetaReaderSimulator,
  GenreExpectationChecker,
} as const;
