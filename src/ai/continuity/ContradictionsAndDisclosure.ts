/**
 * ContradictionsAndDisclosure.ts — Direction AC, V3156-V3165 (Batch 3/3 收口)
 * Continuity & Lore: 矛盾检测 + 信息披露 + 收口
 *
 * 10 engines:
 * 1.  ContradictionDetector — 矛盾检测
 * 2.  InfoConflictResolver — 信息冲突解决
 * 3.  DistanceConflict — 距离冲突
 * 4.  SeasonConflict — 季节冲突
 * 5.  TimeConflict — 时间冲突
 * 6.  InfoReleaseStrategy — 信息释放策略
 * 7.  ShowTellRatio — show vs tell 比
 * 8.  ImplicitExplicitBalance — 隐式/显式平衡
 * 9.  RepetitionDetectorInfo — 信息重复检测
 * 10. ContinuityIndex — 30 engines 收口
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: ContradictionDetector
// ============================================================================

export interface Contradiction {
  type: string;
  chapter1: number;
  chapter2: number;
  detail: string;
}

export class ContradictionDetector {
  private _contradictions: Contradiction[] = [];

  detectBetween(chapter1: number, chapter2: number, type: string, detail: string): Contradiction {
    const c: Contradiction = { type, chapter1, chapter2, detail };
    this._contradictions.push(c);
    return c;
  }

  getAll(): Contradiction[] {
    return [...this._contradictions];
  }

  count(): number {
    return this._contradictions.length;
  }

  hasByType(type: string): boolean {
    return this._contradictions.some((c) => c.type === type);
  }
}

// ============================================================================
// Engine 2: InfoConflictResolver
// ============================================================================

export type Resolution = 'prefer_first' | 'prefer_last' | 'merge' | 'flag';

export class InfoConflictResolver {
  resolve(conflicting: string[], strategy: Resolution): string {
    switch (strategy) {
      case 'prefer_first':
        return conflicting[0];
      case 'prefer_last':
        return conflicting[conflicting.length - 1];
      case 'merge':
        return conflicting.join(' / ');
      case 'flag':
        return `[CONFLICT] ${conflicting.join(' vs ')}`;
    }
  }
}

// ============================================================================
// Engine 3: DistanceConflict
// ============================================================================

export class DistanceConflict {
  // distance in km, time in hours
  hasConflict(distance: number, time: number, mode: 'walk' | 'horse' | 'ship'): boolean {
    const max = mode === 'walk' ? 6 : mode === 'horse' ? 60 : 50;
    if (time === 0) return distance > 0;
    const speed = distance / time;
    return speed > max;
  }

  suggest(distance: number, mode: 'walk' | 'horse' | 'ship'): { minTime: number; minDays: number } {
    const max = mode === 'walk' ? 6 : mode === 'horse' ? 60 : 50;
    return {
      minTime: distance / max,
      minDays: Math.ceil(distance / max / 8),
    };
  }
}

// ============================================================================
// Engine 4: SeasonConflict
// ============================================================================

export class SeasonConflict {
  private _chapterSeason = new Map<number, string>();

  setSeason(chapter: number, season: string): void {
    this._chapterSeason.set(chapter, season);
  }

  getSeason(chapter: number): string | null {
    return this._chapterSeason.get(chapter) || null;
  }

  hasConflict(chapter1: number, chapter2: number): boolean {
    const s1 = this._chapterSeason.get(chapter1);
    const s2 = this._chapterSeason.get(chapter2);
    if (!s1 || !s2) return false;
    // Same chapter or very close should have same season
    if (Math.abs(chapter1 - chapter2) < 5) {
      return s1 !== s2;
    }
    return false;
  }
}

// ============================================================================
// Engine 5: TimeConflict
// ============================================================================

export class TimeConflict {
  // Two events at same timestamp in different chapters
  hasTimeConflict(timestamp1: number, chapter1: number, timestamp2: number, chapter2: number): boolean {
    return timestamp1 === timestamp2 && chapter1 !== chapter2;
  }

  // Distance/time ratio check
  isTravelTimeConsistent(distance: number, timeHours: number, maxSpeedKmh: number): boolean {
    if (timeHours === 0) return distance === 0;
    return distance / timeHours <= maxSpeedKmh;
  }
}

// ============================================================================
// Engine 6: InfoReleaseStrategy
// ============================================================================

export class InfoReleaseStrategy {
  private _infoPerChapter = new Map<number, number>();

  add(chapter: number, infoCount: number): void {
    this._infoPerChapter.set(chapter, infoCount);
  }

  totalReleased(): number {
    let total = 0;
    for (const c of this._infoPerChapter.values()) total += c;
    return total;
  }

  averagePerChapter(chapters: number): number {
    return this.totalReleased() / Math.max(1, chapters);
  }

  isBalanced(threshold = 5): boolean {
    const avg = this.averagePerChapter(this._infoPerChapter.size);
    return avg >= 1 && avg <= threshold;
  }
}

// ============================================================================
// Engine 7: ShowTellRatio
// ============================================================================

export class ShowTellRatio {
  private _showKeywords = ['看见', '听到', '闻到', '尝到', '感到', '摸到', 'saw', 'heard', 'smelled', 'tasted', 'felt', 'touched'];
  private _tellKeywords = ['他很', '她很', '他感到', '她觉得', 'he was', 'she was', 'he felt', 'she felt'];

  compute(text: string): { show: number; tell: number; ratio: number } {
    const lower = text.toLowerCase();
    const show = this._showKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const tell = this._tellKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const total = show + tell;
    return { show, tell, ratio: total === 0 ? 0 : show / total };
  }

  isShowHeavy(text: string, threshold = 0.6): boolean {
    return this.compute(text).ratio > threshold;
  }
}

// ============================================================================
// Engine 8: ImplicitExplicitBalance
// ============================================================================

export class ImplicitExplicitBalance {
  private _implicit = ['暗示', '似乎', '仿佛', '或许', '可能', 'hint', 'seem', 'perhaps', 'maybe', 'possibly'];
  private _explicit = ['明确', '肯定', '一定', '绝对', 'definitely', 'certainly', 'absolutely', 'surely'];

  compute(text: string): { implicit: number; explicit: number; balance: number } {
    const lower = text.toLowerCase();
    const i = this._implicit.filter((k) => lower.includes(k.toLowerCase())).length;
    const e = this._explicit.filter((k) => lower.includes(k.toLowerCase())).length;
    const total = i + e;
    return { implicit: i, explicit: e, balance: total === 0 ? 0.5 : i / total };
  }

  isBalanced(text: string, threshold = 0.7): boolean {
    const b = this.compute(text).balance;
    return b < threshold && b > 1 - threshold;
  }
}

// ============================================================================
// Engine 9: RepetitionDetectorInfo
// ============================================================================

export class RepetitionDetectorInfo {
  detect(text: string, minLen = 3): { word: string; count: number }[] {
    const words = text.split(/[\s，。！？,.\!?]+/).filter((w) => w.length >= minLen);
    const counts = new Map<string, number>();
    for (const w of words) {
      const wLower = w.toLowerCase();
      counts.set(wLower, (counts.get(wLower) || 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([_, c]) => c >= 2)
      .map(([word, count]) => ({ word, count }));
  }

  hasRepetitionIssue(text: string, threshold = 5): boolean {
    return this.detect(text).filter((r) => r.count >= threshold).length > 0;
  }
}

// ============================================================================
// Engine 10: ContinuityIndex
// ============================================================================

export class ContinuityIndex {
  list(): string[] {
    return [
      'EventTimeline', 'TimeJumpAuditor', 'FlashbackReasonableness', 'AgeCalculator',
      'AnniversaryReminder', 'InformationPropagation', 'CharacterKnowledgeLedger',
      'SecretKeeper', 'RumorsNews', 'RevealTracker',
      'PropLifecycle', 'ChekhovGun', 'GiftExchange', 'LostItemAuditor',
      'CharacterLocation', 'CharacterMoodContinuity', 'RelationshipStateMachine',
      'CharacterVoice', 'CharacterHealth', 'CharacterWealth',
      'ContradictionDetector', 'InfoConflictResolver', 'DistanceConflict',
      'SeasonConflict', 'TimeConflict', 'InfoReleaseStrategy',
      'ShowTellRatio', 'ImplicitExplicitBalance', 'RepetitionDetectorInfo',
      'ContinuityIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AC_BATCH_3_ENGINES = {
  ContradictionDetector,
  InfoConflictResolver,
  DistanceConflict,
  SeasonConflict,
  TimeConflict,
  InfoReleaseStrategy,
  ShowTellRatio,
  ImplicitExplicitBalance,
  RepetitionDetectorInfo,
  ContinuityIndex,
} as const;

// Re-export Chapter
export type { Chapter };
