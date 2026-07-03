/**
 * PropCharacterTracking.ts — Direction AC, V3146-V3155 (Batch 2/3)
 * Continuity & Lore: 道具流转 + 人物连续性
 *
 * 10 engines:
 * 1.  PropLifecycle — 道具生命周期
 * 2.  ChekhovGun — 契诃夫之枪
 * 3.  GiftExchange — 礼物交换
 * 4.  LostItemAuditor — 失踪道具审计
 * 5.  CharacterLocation — 角色位置
 * 6.  CharacterMoodContinuity — 角色情绪连续性
 * 7.  RelationshipState — 关系状态
 * 8.  CharacterVoice — 角色声音
 * 9.  CharacterHealth — 角色健康
 * 10. CharacterWealth — 角色财富
 */

// ============================================================================
// Engine 1: PropLifecycle
// ============================================================================

export interface PropRecord {
  id: string;
  name: string;
  introduced: number;
  used: number | null;
  destroyed: number | null;
  status: 'active' | 'used' | 'destroyed' | 'lost';
}

export class PropLifecycle {
  private _props: PropRecord[] = [];
  private _counter = 0;

  introduce(name: string, chapter: number): PropRecord {
    this._counter += 1;
    const p: PropRecord = { id: `p_${this._counter}`, name, introduced: chapter, used: null, destroyed: null, status: 'active' };
    this._props.push(p);
    return p;
  }

  use(name: string, chapter: number): boolean {
    const p = this._props.find((x) => x.name === name);
    if (!p) return false;
    p.used = chapter;
    if (p.status === 'active') p.status = 'used';
    return true;
  }

  destroy(name: string, chapter: number): boolean {
    const p = this._props.find((x) => x.name === name);
    if (!p) return false;
    p.destroyed = chapter;
    p.status = 'destroyed';
    return true;
  }

  getActive(): PropRecord[] {
    return this._props.filter((p) => p.status === 'active');
  }

  getUnused(): PropRecord[] {
    return this._props.filter((p) => !p.used && p.status === 'active');
  }
}

// ============================================================================
// Engine 2: ChekhovGun
// ============================================================================

export class ChekhovGun {
  private _guns: { name: string; fired: boolean }[] = [];

  register(name: string): void {
    this._guns.push({ name, fired: false });
  }

  fire(name: string): boolean {
    const g = this._guns.find((x) => x.name === name);
    if (!g) return false;
    g.fired = true;
    return true;
  }

  getUnfired(): string[] {
    return this._guns.filter((g) => !g.fired).map((g) => g.name);
  }

  fulfillmentRate(): number {
    if (this._guns.length === 0) return 0;
    return this._guns.filter((g) => g.fired).length / this._guns.length;
  }
}

// ============================================================================
// Engine 3: GiftExchange
// ============================================================================

export class GiftExchange {
  private _gifts: { from: string; to: string; item: string; chapter: number }[] = [];

  give(from: string, to: string, item: string, chapter: number): void {
    this._gifts.push({ from, to, item, chapter });
  }

  receivedBy(character: string): string[] {
    return this._gifts.filter((g) => g.to === character).map((g) => g.item);
  }

  givenBy(character: string): string[] {
    return this._gifts.filter((g) => g.from === character).map((g) => g.item);
  }

  count(): number {
    return this._gifts.length;
  }
}

// ============================================================================
// Engine 4: LostItemAuditor
// ============================================================================

export class LostItemAuditor {
  private _introduced: { name: string; chapter: number }[] = [];
  private _lastSeen = new Map<string, number>();

  introduce(name: string, chapter: number): void {
    this._introduced.push({ name, chapter });
    this._lastSeen.set(name, chapter);
  }

  reference(name: string, chapter: number): void {
    this._lastSeen.set(name, chapter);
  }

  getLost(currentChapter: number, threshold = 50): string[] {
    return this._introduced
      .filter((i) => currentChapter - (this._lastSeen.get(i.name) || i.chapter) > threshold)
      .map((i) => i.name);
  }
}

// ============================================================================
// Engine 5: CharacterLocation
// ============================================================================

export class CharacterLocation {
  private _locations = new Map<string, { location: string; chapter: number }>();

  moveTo(character: string, location: string, chapter: number): void {
    this._locations.set(character, { location, chapter });
  }

  currentLocation(character: string): string | null {
    return this._locations.get(character)?.location || null;
  }

  wasAt(character: string, location: string, chapter: number): boolean {
    const loc = this._locations.get(character);
    if (!loc) return false;
    return loc.location === location && loc.chapter <= chapter;
  }

  isTeleporting(character: string, currentChapter: number): boolean {
    return this._locations.has(character) && this._locations.get(character)!.chapter > currentChapter - 1;
  }
}

// ============================================================================
// Engine 6: CharacterMoodContinuity
// ============================================================================

export class CharacterMoodContinuity {
  private _moods = new Map<string, { mood: string; chapter: number }>();

  setMood(character: string, mood: string, chapter: number): void {
    this._moods.set(character, { mood, chapter });
  }

  currentMood(character: string): string | null {
    return this._moods.get(character)?.mood || null;
  }

  hasMoodShift(character: string, newMood: string): boolean {
    const current = this.currentMood(character);
    if (!current) return false;
    return current !== newMood;
  }

  isMoodJump(character: string, newMood: string, threshold = 3): boolean {
    // Heuristic: if no intermediate moods, this is a sudden jump
    return this.hasMoodShift(character, newMood);
  }
}

// ============================================================================
// Engine 7: RelationshipState
// ============================================================================

export type RelationshipState = 'stranger' | 'acquaintance' | 'friend' | 'enemy' | 'lover' | 'family';

export class RelationshipStateMachine {
  private _states = new Map<string, RelationshipState>();

  set(a: string, b: string, state: RelationshipState): void {
    const key = this._key(a, b);
    this._states.set(key, state);
  }

  get(a: string, b: string): RelationshipState {
    return this._states.get(this._key(a, b)) || 'stranger';
  }

  transition(a: string, b: string, newState: RelationshipState): RelationshipState {
    const current = this.get(a, b);
    this.set(a, b, newState);
    return current;
  }

  isHostile(a: string, b: string): boolean {
    return this.get(a, b) === 'enemy';
  }

  isClose(a: string, b: string): boolean {
    const s = this.get(a, b);
    return s === 'friend' || s === 'lover' || s === 'family';
  }

  private _key(a: string, b: string): string {
    return [a, b].sort().join('|');
  }
}

// ============================================================================
// Engine 8: CharacterVoice
// ============================================================================

export class CharacterVoice {
  private _catchphrases = new Map<string, string[]>();

  addCatchphrase(character: string, phrase: string): void {
    if (!this._catchphrases.has(character)) this._catchphrases.set(character, []);
    this._catchphrases.get(character)!.push(phrase);
  }

  getCatchphrases(character: string): string[] {
    return this._catchphrases.get(character) || [];
  }

  usesPhrase(character: string, phrase: string): boolean {
    return this.getCatchphrases(character).includes(phrase);
  }

  distinctVoices(): number {
    return this._catchphrases.size;
  }
}

// ============================================================================
// Engine 9: CharacterHealth
// ============================================================================

export interface HealthRecord {
  character: string;
  state: 'healthy' | 'injured' | 'sick' | 'dying' | 'dead';
  chapter: number;
  notes: string;
}

export class CharacterHealth {
  private _records: HealthRecord[] = [];

  set(character: string, state: HealthRecord['state'], chapter: number, notes = ''): void {
    this._records.push({ character, state, chapter, notes });
  }

  currentState(character: string): HealthRecord['state'] {
    const records = this._records.filter((r) => r.character === character);
    if (records.length === 0) return 'healthy';
    return records[records.length - 1].state;
  }

  hasDied(character: string): boolean {
    return this.currentState(character) === 'dead';
  }

  getHistory(character: string): HealthRecord[] {
    return this._records.filter((r) => r.character === character);
  }
}

// ============================================================================
// Engine 10: CharacterWealth
// ============================================================================

export class CharacterWealth {
  private _wealth = new Map<string, { amount: number; chapter: number }>();

  set(character: string, amount: number, chapter: number): void {
    this._wealth.set(character, { amount, chapter });
  }

  current(character: string): number {
    return this._wealth.get(character)?.amount || 0;
  }

  earn(character: string, amount: number, chapter: number): void {
    this.set(character, this.current(character) + amount, chapter);
  }

  spend(character: string, amount: number, chapter: number): boolean {
    if (this.current(character) < amount) return false;
    this.set(character, this.current(character) - amount, chapter);
    return true;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AC_BATCH_2_ENGINES = {
  PropLifecycle,
  ChekhovGun,
  GiftExchange,
  LostItemAuditor,
  CharacterLocation,
  CharacterMoodContinuity,
  RelationshipStateMachine,
  CharacterVoice,
  CharacterHealth,
  CharacterWealth,
} as const;
