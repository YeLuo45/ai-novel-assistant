/**
 * WebNovelGenres.ts — Direction Z, V3166-V3175 (Batch 1/3)
 * Genre Masters: 网文流派（爽点/打脸/系统/无限流/武侠/仙侠/修真）
 *
 * 10 engines:
 * 1.  HuanDianScheduler — 爽点编排器
 * 2.  FaceSlapEngine — 装逼打脸引擎
 * 3.  PretendWeakHiddenStrong — 扮猪吃虎
 * 4.  SystemFlowRPG — 系统流/数值流
 * 5.  InfiniteFlowDesigner — 无限流任务设计
 * 6.  PowerUpMoment — 金手指触发
 * 7.  WuxiaLevelSystem — 武侠等级
 * 8.  XianxiaRealm — 修真境界
 * 9.  SystemTaskDesigner — 系统任务设计
 * 10. GenreConventionAuditor — 类型惯例审计
 *
 * 灵感：起点/番茄流派研究 / 网文运营 / 类型小说技巧
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: HuanDianScheduler
// ============================================================================

export interface CoolPoint {
  chapter: number;
  type: 'face_slap' | 'power_up' | 'revelation' | 'victory' | 'rescue';
  intensity: number;
}

export class HuanDianScheduler {
  private _points: CoolPoint[] = [];
  private _targetDensity = 3; // 3 cool points per 10 chapters

  schedule(chapter: number, type: CoolPoint['type'], intensity: number): CoolPoint {
    const p: CoolPoint = { chapter, type, intensity: Math.max(0, Math.min(1, intensity)) };
    this._points.push(p);
    return p;
  }

  getPoints(): CoolPoint[] {
    return [...this._points].sort((a, b) => a.chapter - b.chapter);
  }

  densityPer10Chapters(totalChapters: number): number {
    return (this._points.length / Math.max(1, totalChapters)) * 10;
  }

  isSatisfying(totalChapters: number): boolean {
    return this.densityPer10Chapters(totalChapters) >= this._targetDensity;
  }
}

// ============================================================================
// Engine 2: FaceSlapEngine
// ============================================================================

export class FaceSlapEngine {
  private _setupKeywords = ['轻视', '看不起', '嘲讽', '嘲笑', '嘲笑', '不屑', 'despise', 'mock', 'ridicule', 'scorn'];
  private _payoffKeywords = ['震惊', '怎么可能', '不可能', '目瞪口呆', '跪下', '道歉', 'shock', 'impossible', 'kneel', 'apologize'];

  hasSetup(text: string): boolean {
    return this._setupKeywords.some((k) => text.includes(k));
  }

  hasPayoff(text: string): boolean {
    return this._payoffKeywords.some((k) => text.includes(k));
  }

  isCompleteFaceSlap(setupText: string, payoffText: string): boolean {
    return this.hasSetup(setupText) && this.hasPayoff(payoffText);
  }

  intensity(text: string): number {
    return Math.min(1, this._payoffKeywords.filter((k) => text.includes(k)).length / 3);
  }
}

// ============================================================================
// Engine 3: PretendWeakHiddenStrong
// ============================================================================

export class PretendWeakHiddenStrong {
  private _weakKeywords = ['废物', '垃圾', '没用', 'loser', 'trash', 'useless', 'weak'];
  private _strongKeywords = ['天才', '高手', '强者', '隐藏', 'genius', 'master', 'hidden', 'strong', 'powerful'];

  isSetup(setup: string): boolean {
    return this._weakKeywords.some((k) => setup.includes(k));
  }

  isReveal(reveal: string): boolean {
    return this._strongKeywords.some((k) => reveal.includes(k));
  }

  isComplete(setup: string, reveal: string): boolean {
    return this.isSetup(setup) && this.isReveal(reveal);
  }
}

// ============================================================================
// Engine 4: SystemFlowRPG
// ============================================================================

export interface Stats {
  level: number;
  exp: number;
  hp: number;
  mp: number;
  str: number;
  agi: number;
  int: number;
}

export class SystemFlowRPG {
  private _stats: Stats = { level: 1, exp: 0, hp: 100, mp: 50, str: 10, agi: 10, int: 10 };

  gainExp(amount: number): void {
    this._stats.exp += amount;
    while (this._stats.exp >= this._expToLevel(this._stats.level)) {
      this._stats.exp -= this._expToLevel(this._stats.level);
      this._stats.level += 1;
      this._stats.hp += 10;
      this._stats.mp += 5;
    }
  }

  private _expToLevel(level: number): number {
    return 100 * level * level;
  }

  getStats(): Stats {
    return { ...this._stats };
  }

  isBalanced(): boolean {
    // Healthy: HP > MP, STR/AGI/INT balanced
    return this._stats.hp > this._stats.mp && Math.abs(this._stats.str - this._stats.int) < 50;
  }
}

// ============================================================================
// Engine 5: InfiniteFlowDesigner
// ============================================================================

export interface InfiniteTask {
  id: string;
  name: string;
  difficulty: number;
  reward: number;
  deathRate: number;
}

export class InfiniteFlowDesigner {
  private _tasks: InfiniteTask[] = [];
  private _counter = 0;

  createTask(name: string, difficulty: number, reward: number, deathRate: number): InfiniteTask {
    this._counter += 1;
    const t: InfiniteTask = { id: `task_${this._counter}`, name, difficulty, reward, deathRate };
    this._tasks.push(t);
    return t;
  }

  isBalanced(t: InfiniteTask): boolean {
    return t.reward >= t.difficulty * 10 && t.deathRate < 0.5;
  }

  getAll(): InfiniteTask[] {
    return [...this._tasks];
  }
}

// ============================================================================
// Engine 6: PowerUpMoment
// ============================================================================

export class PowerUpMoment {
  private _powerUpKeywords = ['突破', '升级', '觉醒', '解锁', '获得传承', 'breakthrough', 'level up', 'awaken', 'unlock', 'inherit'];

  detect(text: string): number {
    return this._powerUpKeywords.filter((k) => text.toLowerCase().includes(k.toLowerCase())).length;
  }

  isPowerUp(text: string, threshold = 1): boolean {
    return this.detect(text) >= threshold;
  }

  isCheatingPowerUp(text: string): boolean {
    // Multiple power-ups in short text = sudden OP
    return this.detect(text) >= 3;
  }
}

// ============================================================================
// Engine 7: WuxiaLevelSystem
// ============================================================================

export type WuxiaLevel = '三流' | '二流' | '一流' | '顶尖' | '宗师' | '大宗师' | '先天';

export class WuxiaLevelSystem {
  private _levels: WuxiaLevel[] = ['三流', '二流', '一流', '顶尖', '宗师', '大宗师', '先天'];
  private _characterLevel = new Map<string, WuxiaLevel>();

  setLevel(character: string, level: WuxiaLevel): void {
    this._characterLevel.set(character, level);
  }

  getLevel(character: string): WuxiaLevel | null {
    return this._characterLevel.get(character) || null;
  }

  canBeat(attacker: string, defender: string): boolean {
    const a = this._levels.indexOf(this._characterLevel.get(attacker) || '三流');
    const d = this._levels.indexOf(this._characterLevel.get(defender) || '三流');
    return a >= d;
  }

  hasLevelSkip(character: string): boolean {
    const level = this._characterLevel.get(character);
    if (!level) return false;
    return ['大宗师', '先天'].includes(level);
  }
}

// ============================================================================
// Engine 8: XianxiaRealm
// ============================================================================

export type RealmName = '炼气' | '筑基' | '金丹' | '元婴' | '化神' | '炼虚' | '合体' | '大乘' | '渡劫';

export class XianxiaRealm {
  private _realms: RealmName[] = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];
  private _characterRealm = new Map<string, RealmName>();

  setRealm(character: string, realm: RealmName): void {
    this._characterRealm.set(character, realm);
  }

  getRealm(character: string): RealmName | null {
    return this._characterRealm.get(character) || null;
  }

  realmGap(attacker: string, defender: string): number {
    const a = this._realms.indexOf(this._characterRealm.get(attacker) || '炼气');
    const d = this._realms.indexOf(this._characterRealm.get(defender) || '炼气');
    return d - a;
  }

  isCrossRealmBattle(attacker: string, defender: string): boolean {
    return Math.abs(this.realmGap(attacker, defender)) >= 1;
  }
}

// ============================================================================
// Engine 9: SystemTaskDesigner
// ============================================================================

export class SystemTaskDesigner {
  private _tasks: { id: string; desc: string; reward: string; deadline: number; completed: boolean }[] = [];
  private _counter = 0;

  create(desc: string, reward: string, deadline: number): void {
    this._counter += 1;
    this._tasks.push({ id: `t_${this._counter}`, desc, reward, deadline, completed: false });
  }

  complete(id: string): boolean {
    const t = this._tasks.find((x) => x.id === id);
    if (!t) return false;
    t.completed = true;
    return true;
  }

  overdue(currentChapter: number): string[] {
    return this._tasks.filter((t) => !t.completed && t.deadline < currentChapter).map((t) => t.id);
  }

  getAll(): { id: string; desc: string; completed: boolean }[] {
    return this._tasks.map((t) => ({ id: t.id, desc: t.desc, completed: t.completed }));
  }
}

// ============================================================================
// Engine 10: GenreConventionAuditor
// ============================================================================

export class GenreConventionAuditor {
  private _conventions: Record<string, string[]> = {
    wuxia: ['内功', '招式', '江湖', '门派', '内力', 'martial arts', 'sects'],
    xianxia: ['灵气', '法宝', '丹药', '渡劫', 'spiritual energy', 'tribulation'],
    xuanhuan: ['斗气', '炼药师', '魔兽', '斗帝', 'battle qi', 'alchemist'],
    urban: ['总裁', '豪门', '重生', 'ceo', 'rebirth', 'heir'],
    school: ['校园', '同学', '考试', 'campus', 'school', 'exam'],
  };

  check(genre: string, text: string): { satisfied: number; total: number; ratio: number } {
    const keywords = this._conventions[genre] || [];
    if (keywords.length === 0) return { satisfied: 0, total: 0, ratio: 0 };
    const lower = text.toLowerCase();
    const satisfied = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
    return { satisfied, total: keywords.length, ratio: satisfied / keywords.length };
  }

  isGenreCorrect(genre: string, text: string, threshold = 0.3): boolean {
    return this.check(genre, text).ratio >= threshold;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const Z_BATCH_1_ENGINES = {
  HuanDianScheduler,
  FaceSlapEngine,
  PretendWeakHiddenStrong,
  SystemFlowRPG,
  InfiniteFlowDesigner,
  PowerUpMoment,
  WuxiaLevelSystem,
  XianxiaRealm,
  SystemTaskDesigner,
  GenreConventionAuditor,
} as const;

export type { Chapter };
