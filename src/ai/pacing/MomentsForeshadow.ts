/**
 * MomentsForeshadow.ts — Direction AB, V3026-V3035 (Batch 2/3)
 * 关键时刻检测 + 伏笔账本
 *
 * 10 engines:
 * 1.  ClimaxMapper — 高潮映射器
 * 2.  AllIsLostMoment — 失去一切时刻
 * 3.  DarkNightOfSoul — 灵魂黑夜
 * 4.  MirrorMoment — 镜像时刻
 * 5.  BStoryDetector — B 故事检测
 * 6.  FinaleConvergence — 终局汇聚
 * 7.  ForeshadowPlanter — 伏笔埋设器
 * 8.  ForeshadowPayoffTracker — 伏笔回收追踪
 * 9.  PlantPayoffLedger — 铺垫-回收账本
 * 10. ChekhovGunAuditor — 契诃夫之枪审计
 */

import type { Chapter } from './StructureTemplates';

// ============================================================================
// Engine 1: ClimaxMapper
// ============================================================================

export interface ClimaxLocation {
  chapter: number;
  progress: number; // 0-1
  intensity: number; // 0-1
  isClimax: boolean;
}

export class ClimaxMapper {
  private _intensityKeywords = ['决战', '高潮', '对决', '摊牌', '决定', 'reveal', 'climax', 'confrontation', 'showdown'];

  scoreIntensity(text: string): number {
    const lower = text.toLowerCase();
    const matches = this._intensityKeywords.filter((k) => lower.includes(k)).length;
    return Math.min(1, matches / 3);
  }

  map(chapters: Chapter[]): ClimaxLocation[] {
    return chapters.map((c, i) => {
      const intensity = this.scoreIntensity(c.content || '');
      const progress = chapters.length <= 1 ? 0 : i / (chapters.length - 1);
      return {
        chapter: i,
        progress,
        intensity,
        isClimax: progress >= 0.85 && intensity > 0,
      };
    });
  }

  findClimax(chapters: Chapter[]): ClimaxLocation | null {
    const all = this.map(chapters);
    const candidates = all.filter((c) => c.isClimax);
    if (candidates.length === 0) {
      return all.reduce<ClimaxLocation | null>(
        (best, c) => (best && best.intensity > c.intensity ? best : c),
        null
      );
    }
    return candidates.reduce<ClimaxLocation | null>(
      (best, c) => (best && best.intensity > c.intensity ? best : c),
      null
    );
  }
}

// ============================================================================
// Engine 2: AllIsLostMoment
// ============================================================================

export interface LostMoment {
  chapter: number;
  text: string;
  despairScore: number;
  isAllIsLost: boolean;
}

export class AllIsLostMoment {
  private _despairKeywords = ['失去', '失败', '死亡', '离开', '绝望', 'lost', 'failed', 'died', 'despair', 'gave up'];
  private _idealRange = [0.7, 0.85];

  score(text: string): number {
    const lower = text.toLowerCase();
    return Math.min(1, this._despairKeywords.filter((k) => lower.includes(k)).length / 2);
  }

  detect(chapters: Chapter[]): LostMoment | null {
    let best: LostMoment | null = null;
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      const text = c.content || '';
      const progress = chapters.length <= 1 ? 0 : i / (chapters.length - 1);
      const inRange = progress >= this._idealRange[0] && progress <= this._idealRange[1];
      const score = this.score(text);
      if (inRange && score > 0) {
        if (!best || score > best.despairScore) {
          best = { chapter: i, text: text.slice(0, 80), despairScore: score, isAllIsLost: true };
        }
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 3: DarkNightOfSoul
// ============================================================================

export interface DarkNightMoment {
  chapter: number;
  introspectionScore: number;
  isDarkNight: boolean;
}

export class DarkNightOfSoul {
  private _introspectionKeywords = ['反思', '独处', '夜晚', '思考', '失去', 'contemplation', 'alone', 'night', 'reflected', 'thought'];
  private _idealRange = [0.78, 0.88];

  detect(chapter: number, totalChapters: number, text: string): DarkNightMoment {
    const progress = totalChapters <= 1 ? 0 : chapter / (totalChapters - 1);
    const lower = text.toLowerCase();
    const score = Math.min(1, this._introspectionKeywords.filter((k) => lower.includes(k)).length / 2);
    return {
      chapter,
      introspectionScore: score,
      isDarkNight: progress >= this._idealRange[0] && progress <= this._idealRange[1] && score > 0,
    };
  }
}

// ============================================================================
// Engine 4: MirrorMoment
// ============================================================================

export interface MirrorEvent {
  text: string;
  isMirror: boolean;
}

export class MirrorMoment {
  private _mirrorKeywords = ['反观', '对比', '曾经', '过去', '回到', 'mirrored', 'remembered', 'past', 'echoed', 'reflected'];

  detect(text: string): MirrorEvent {
    const lower = text.toLowerCase();
    const matches = this._mirrorKeywords.filter((k) => lower.includes(k)).length;
    return { text: text.slice(0, 80), isMirror: matches >= 2 };
  }
}

// ============================================================================
// Engine 5: BStoryDetector
// ============================================================================

export interface BStory {
  theme: string;
  chapter: number;
  isBStory: boolean;
}

export class BStoryDetector {
  private _loveKeywords = ['爱', '友情', '家庭', '信任', 'love', 'friendship', 'family', 'trust'];
  private _idealRange = [0.25, 0.4];

  detect(text: string, chapter: number, totalChapters: number): BStory {
    const progress = totalChapters <= 1 ? 0 : chapter / (totalChapters - 1);
    const lower = text.toLowerCase();
    const matches = this._loveKeywords.filter((k) => lower.includes(k)).length;
    const inRange = progress >= this._idealRange[0] && progress <= this._idealRange[1];
    return {
      theme: matches > 0 ? 'love_or_relationship' : 'subplot',
      chapter,
      isBStory: inRange && matches > 0,
    };
  }
}

// ============================================================================
// Engine 6: FinaleConvergence
// ============================================================================

export interface Convergence {
  subplotsResolved: number;
  subplotsTotal: number;
  convergenceScore: number;
  isConverged: boolean;
}

export class FinaleConvergence {
  private _threshold = 0.7;

  compute(resolved: number, total: number): Convergence {
    const score = total === 0 ? 0 : resolved / total;
    return {
      subplotsResolved: resolved,
      subplotsTotal: total,
      convergenceScore: score,
      isConverged: score >= this._threshold,
    };
  }
}

// ============================================================================
// Engine 7: ForeshadowPlanter
// ============================================================================

export interface Foreshadow {
  id: string;
  description: string;
  plantedChapter: number;
  strength: number; // 0-1
}

export class ForeshadowPlanter {
  private _counter = 0;

  plant(description: string, chapter: number, strength = 0.5): Foreshadow {
    this._counter += 1;
    return {
      id: `fs_${this._counter}`,
      description,
      plantedChapter: chapter,
      strength: Math.max(0, Math.min(1, strength)),
    };
  }

  getCount(): number {
    return this._counter;
  }
}

// ============================================================================
// Engine 8: ForeshadowPayoffTracker
// ============================================================================

export interface Payoff {
  foreshadowId: string;
  chapter: number;
  description: string;
  distanceChapters: number;
  strength: number;
}

export class ForeshadowPayoffTracker {
  private _payoffs: Payoff[] = [];

  track(foreshadowId: string, chapter: number, description: string, plantedChapter: number, strength = 0.5): Payoff {
    const p: Payoff = {
      foreshadowId,
      chapter,
      description,
      distanceChapters: chapter - plantedChapter,
      strength,
    };
    this._payoffs.push(p);
    return p;
  }

  getAll(): Payoff[] {
    return [...this._payoffs];
  }

  findByForeshadowId(id: string): Payoff[] {
    return this._payoffs.filter((p) => p.foreshadowId === id);
  }
}

// ============================================================================
// Engine 9: PlantPayoffLedger
// ============================================================================

export interface LedgerEntry {
  id: string;
  planted: number | null;
  paidOff: number | null;
  status: 'planted' | 'paid' | 'forgotten' | 'resolved';
}

export class PlantPayoffLedger {
  private _entries = new Map<string, LedgerEntry>();

  add(id: string): LedgerEntry {
    if (!this._entries.has(id)) {
      this._entries.set(id, { id, planted: null, paidOff: null, status: 'planted' });
    }
    return this._entries.get(id)!;
  }

  markPlanted(id: string, chapter: number): LedgerEntry {
    const e = this.add(id);
    e.planted = chapter;
    e.status = 'planted';
    return e;
  }

  markPaidOff(id: string, chapter: number): LedgerEntry {
    const e = this.add(id);
    e.paidOff = chapter;
    e.status = e.planted !== null ? 'resolved' : 'paid';
    return e;
  }

  getStatus(id: string): 'planted' | 'paid' | 'forgotten' | 'resolved' | 'unknown' {
    return this._entries.get(id)?.status || 'unknown';
  }

  getOrphans(): LedgerEntry[] {
    return Array.from(this._entries.values()).filter((e) => e.planted !== null && e.paidOff === null);
  }

  getResolved(): LedgerEntry[] {
    return Array.from(this._entries.values()).filter((e) => e.status === 'resolved');
  }
}

// ============================================================================
// Engine 10: ChekhovGunAuditor
// ============================================================================

export interface ChekhovItem {
  name: string;
  introducedChapter: number;
  usedChapter: number | null;
  isUsed: boolean;
}

export class ChekhovGunAuditor {
  private _items = new Map<string, ChekhovItem>();

  introduce(name: string, chapter: number): ChekhovItem {
    if (!this._items.has(name)) {
      this._items.set(name, { name, introducedChapter: chapter, usedChapter: null, isUsed: false });
    }
    return this._items.get(name)!;
  }

  use(name: string, chapter: number): ChekhovItem {
    const item = this.introduce(name, 0);
    item.usedChapter = chapter;
    item.isUsed = true;
    return item;
  }

  getUnused(): ChekhovItem[] {
    return Array.from(this._items.values()).filter((i) => !i.isUsed);
  }

  getUsed(): ChekhovItem[] {
    return Array.from(this._items.values()).filter((i) => i.isUsed);
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AB_BATCH_2_ENGINES = {
  ClimaxMapper,
  AllIsLostMoment,
  DarkNightOfSoul,
  MirrorMoment,
  BStoryDetector,
  FinaleConvergence,
  ForeshadowPlanter,
  ForeshadowPayoffTracker,
  PlantPayoffLedger,
  ChekhovGunAuditor,
} as const;
