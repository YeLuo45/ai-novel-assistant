/**
 * TimelineEvents.ts — Direction AC, V3136-V3145 (Batch 1/3)
 * Continuity & Lore: 时间线 + 信息传播 + 揭示追踪
 *
 * 10 engines:
 * 1.  EventTimeline — 事件时间轴
 * 2.  TimeJumpAuditor — 时间跳跃审计
 * 3.  FlashbackReasonableness — 闪回合理性
 * 4.  AgeCalculator — 跨章节年龄计算
 * 5.  AnniversaryReminder — 周年纪念提醒
 * 6.  InformationPropagation — 信息传播链
 * 7.  CharacterKnowledgeLedger — 角色知识账本
 * 8.  SecretKeeper — 秘密守护
 * 9.  RumorsNews — 谣言/新闻
 * 10. RevealTracker — 揭示追踪
 *
 * 灵感：MCU 编剧室 continuity bible / 漫威/权游 穿帮分析
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: EventTimeline
// ============================================================================

export interface TimelineEvent {
  id: string;
  name: string;
  chapter: number;
  timestamp: number; // 故事内时间戳
  before?: string[]; // 依赖的事件 id
}

export class EventTimeline {
  private _events: TimelineEvent[] = [];
  private _counter = 0;

  add(name: string, chapter: number, timestamp: number, before: string[] = []): TimelineEvent {
    this._counter += 1;
    const e: TimelineEvent = { id: `e_${this._counter}`, name, chapter, timestamp, before };
    this._events.push(e);
    return e;
  }

  getAll(): TimelineEvent[] {
    return [...this._events];
  }

  sortByTime(): TimelineEvent[] {
    return [...this._events].sort((a, b) => a.timestamp - b.timestamp);
  }

  hasContradiction(): boolean {
    // Two events at same timestamp in different chapters
    const map = new Map<number, TimelineEvent[]>();
    for (const e of this._events) {
      if (!map.has(e.timestamp)) map.set(e.timestamp, []);
      map.get(e.timestamp)!.push(e);
    }
    for (const arr of map.values()) {
      if (arr.length > 1) return true;
    }
    return false;
  }
}

// ============================================================================
// Engine 2: TimeJumpAuditor
// ============================================================================

export interface TimeJump {
  fromChapter: number;
  toChapter: number;
  durationDays: number;
  isExcessive: boolean;
  isFlashback: boolean;
}

export class TimeJumpAuditor {
  private _maxDays = 365; // 1 year default
  private _flashbackThreshold = 7; // <7 days likely flashback

  audit(fromChapter: number, toChapter: number, durationDays: number): TimeJump {
    return {
      fromChapter,
      toChapter,
      durationDays,
      isExcessive: durationDays > this._maxDays,
      isFlashback: durationDays < this._flashbackThreshold && toChapter > fromChapter,
    };
  }

  batchAudit(jumps: TimeJump[]): { total: number; excessive: number; flashbacks: number } {
    return {
      total: jumps.length,
      excessive: jumps.filter((j) => j.isExcessive).length,
      flashbacks: jumps.filter((j) => j.isFlashback).length,
    };
  }
}

// ============================================================================
// Engine 3: FlashbackReasonableness
// ============================================================================

export class FlashbackReasonableness {
  private _flashbackKeywords = ['回忆', '想起', '当年', '曾经', '过去', '那时', 'memoir', 'remembered', 'past', 'those days', 'back then'];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._flashbackKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  isFlashback(text: string, threshold = 1): boolean {
    return this.count(text) >= threshold;
  }

  isOverFlashbacked(text: string, threshold = 3): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 4: AgeCalculator
// ============================================================================

export interface AgeSnapshot {
  character: string;
  birthChapter: number;
  currentChapter: number;
  age: number;
}

export class AgeCalculator {
  private _births = new Map<string, { birthChapter: number; ageAtBirth: number }>();

  setBirth(character: string, chapter: number, age: number): void {
    this._births.set(character, { birthChapter: chapter, ageAtBirth: age });
  }

  ageAt(character: string, chapter: number): number | null {
    const b = this._births.get(character);
    if (!b) return null;
    const elapsed = chapter - b.birthChapter;
    return b.ageAtBirth + elapsed;
  }

  ageInYears(character: string, chapter: number): number | null {
    const a = this.ageAt(character, chapter);
    if (a === null) return null;
    return Math.floor(a / 365);
  }
}

// ============================================================================
// Engine 5: AnniversaryReminder
// ============================================================================

export class AnniversaryReminder {
  private _events = new Map<number, string[]>(); // chapter → events

  addEvent(chapter: number, name: string): void {
    if (!this._events.has(chapter)) this._events.set(chapter, []);
    this._events.get(chapter)!.push(name);
  }

  getUpcoming(currentChapter: number, lookAhead = 10): { chapter: number; events: string[] }[] {
    const result: { chapter: number; events: string[] }[] = [];
    for (let i = 1; i <= lookAhead; i++) {
      const c = currentChapter + i;
      if (this._events.has(c)) {
        result.push({ chapter: c, events: this._events.get(c)! });
      }
    }
    return result;
  }

  hasAnniversary(chapter: number): boolean {
    return this._events.has(chapter);
  }
}

// ============================================================================
// Engine 6: InformationPropagation
// ============================================================================

export interface PropLog {
  information: string;
  toldBy: string;
  toldTo: string;
  chapter: number;
  confirmed: boolean;
}

export class InformationPropagation {
  private _logs: PropLog[] = [];

  tell(information: string, by: string, to: string, chapter: number): PropLog {
    const log: PropLog = { information, toldBy: by, toldTo: to, chapter, confirmed: false };
    this._logs.push(log);
    return log;
  }

  confirm(information: string, by: string, to: string, chapter: number): boolean {
    const log = this._logs.find(
      (l) => l.information === information && l.toldBy === by && l.toldTo === to && !l.confirmed
    );
    if (!log) return false;
    log.confirmed = true;
    return true;
  }

  whoKnows(information: string): string[] {
    return Array.from(
      new Set(this._logs.filter((l) => l.information === information).map((l) => l.toldTo))
    );
  }
}

// ============================================================================
// Engine 7: CharacterKnowledgeLedger
// ============================================================================

export class CharacterKnowledgeLedger {
  private _ledger = new Map<string, Set<string>>(); // character → known info

  learn(character: string, info: string): void {
    if (!this._ledger.has(character)) this._ledger.set(character, new Set());
    this._ledger.get(character)!.add(info);
  }

  knows(character: string, info: string): boolean {
    return this._ledger.get(character)?.has(info) || false;
  }

  knowsEverything(character: string, infoList: string[]): boolean {
    return infoList.every((i) => this.knows(character, i));
  }

  getAllKnown(character: string): string[] {
    return Array.from(this._ledger.get(character) || []);
  }
}

// ============================================================================
// Engine 8: SecretKeeper
// ============================================================================

export class SecretKeeper {
  private _secrets = new Map<string, { secret: string; keeper: string; chapter: number }>();

  add(secret: string, keeper: string, chapter: number): void {
    this._secrets.set(secret, { secret, keeper, chapter });
  }

  reveal(secret: string): string | null {
    return this._secrets.get(secret)?.keeper || null;
  }

  isRevealed(secret: string, chapter: number): boolean {
    const s = this._secrets.get(secret);
    return s ? s.chapter < chapter : false;
  }

  getAll(): string[] {
    return Array.from(this._secrets.keys());
  }
}

// ============================================================================
// Engine 9: RumorsNews
// ============================================================================

export class RumorsNews {
  private _rumors = new Map<string, { rumor: string; spread: number; spreader: string[] }>();

  start(rumor: string, by: string): void {
    this._rumors.set(rumor, { rumor, spread: 1, spreader: [by] });
  }

  spread(rumor: string, by: string): boolean {
    const r = this._rumors.get(rumor);
    if (!r) return false;
    if (!r.spreader.includes(by)) {
      r.spreader.push(by);
      r.spread += 1;
    }
    return true;
  }

  getSpreadCount(rumor: string): number {
    return this._rumors.get(rumor)?.spread || 0;
  }

  isViral(rumor: string, threshold = 10): boolean {
    return this.getSpreadCount(rumor) >= threshold;
  }
}

// ============================================================================
// Engine 10: RevealTracker
// ============================================================================

export interface Reveal {
  mystery: string;
  revealedChapter: number;
  setupChapters: number[];
  foreshadowingStrength: number;
}

export class RevealTracker {
  private _reveals: Reveal[] = [];

  record(mystery: string, revealedChapter: number, setupChapters: number[], foreshadowingStrength: number): Reveal {
    const r: Reveal = { mystery, revealedChapter, setupChapters, foreshadowingStrength };
    this._reveals.push(r);
    return r;
  }

  isPayoffStrong(reveal: Reveal): boolean {
    return reveal.foreshadowingStrength > 0.5 && reveal.setupChapters.length >= 2;
  }

  isCheapReveal(reveal: Reveal): boolean {
    return reveal.setupChapters.length === 0;
  }

  getAll(): Reveal[] {
    return [...this._reveals];
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AC_BATCH_1_ENGINES = {
  EventTimeline,
  TimeJumpAuditor,
  FlashbackReasonableness,
  AgeCalculator,
  AnniversaryReminder,
  InformationPropagation,
  CharacterKnowledgeLedger,
  SecretKeeper,
  RumorsNews,
  RevealTracker,
} as const;
