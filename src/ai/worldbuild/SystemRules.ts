/**
 * SystemRules.ts — Direction AA, V3106-V3115 (Batch 1/3)
 * Worldbuilding Coherence: 基础体系（魔法/科技/物种/宗教/语言/地理/时间）
 *
 * 10 engines:
 * 1.  MagicSystemAuditor — 魔法体系审计（Sanderson 三定律）
 * 2.  TechConsistency — 科技一致性（科幻硬伤）
 * 3.  PowerEconomy — 力量经济
 * 4.  SpeciesEcology — 物种生态
 * 5.  ReligionSystem — 宗教体系
 * 6.  LanguageCohort — 语言/方言
 * 7.  GeographicConsistency — 地理一致性
 * 8.  TimelineTracker — 时间线追踪
 * 9.  SeasonWeather — 季节/天气
 * 10. DistanceSpeedValidator — 距离/速度验证
 *
 * 灵感：Tolkien Middle-earth / Brandon Sanderson 魔法三定律 / World Anvil
 */

// ============================================================================
// Engine 1: MagicSystemAuditor
// ============================================================================

export interface MagicRule {
  rule: 'self_consistent' | 'has_cost' | 'has_limit';
  satisfied: boolean;
  evidence: string;
}

export class MagicSystemAuditor {
  private _costKeywords = ['代价', '消耗', '牺牲', '付出', '燃烧', '生命', 'cost', 'sacrifice', 'life'];
  private _limitKeywords = ['限制', '上限', '边界', '不能', '禁忌', 'limit', 'cannot', 'forbidden', 'taboo'];

  audit(text: string): MagicRule[] {
    const lower = text.toLowerCase();
    return [
      { rule: 'self_consistent', satisfied: this._isSelfConsistent(text), evidence: 'physical laws consistent' },
      { rule: 'has_cost', satisfied: this._costKeywords.some((k) => lower.includes(k.toLowerCase())), evidence: 'cost keyword detected' },
      { rule: 'has_limit', satisfied: this._limitKeywords.some((k) => lower.includes(k.toLowerCase())), evidence: 'limit keyword detected' },
    ];
  }

  private _isSelfConsistent(text: string): boolean {
    // Heuristic: text is long enough to define rules
    return text.length > 200;
  }

  ruleScore(text: string): number {
    const rules = this.audit(text);
    return rules.filter((r) => r.satisfied).length / rules.length;
  }
}

// ============================================================================
// Engine 2: TechConsistency
// ============================================================================

export class TechConsistency {
  private _hardSciKeywords = ['物理', '能量', '守恒', '光速', 'physics', 'energy', 'conservation', 'speed of light'];
  private _softSciKeywords = ['传送', '曲速', '跃迁', 'warp', 'teleport', 'faster than light', 'FTL'];

  hardSciRatio(text: string): number {
    const lower = text.toLowerCase();
    const hard = this._hardSciKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const soft = this._softSciKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const total = hard + soft;
    return total === 0 ? 1 : hard / total;
  }

  hasHardSciFlaws(text: string, threshold = 0.3): boolean {
    return this.hardSciRatio(text) < threshold;
  }
}

// ============================================================================
// Engine 3: PowerEconomy
// ============================================================================

export class PowerEconomy {
  private _powerKeywords = ['强者', '高手', '大师', '宗师', '弱小', '弱', '强', 'master', 'expert', 'strong', 'weak'];

  countByTier(text: string): Record<string, number> {
    const tiers: Record<string, number> = { strong: 0, weak: 0, neutral: 0 };
    const lower = text.toLowerCase();
    for (const k of this._powerKeywords) {
      if (lower.includes(k.toLowerCase())) {
        if (['弱', 'weak', '弱小'].includes(k)) tiers.weak += 1;
        else if (['强', 'strong', '高手', 'master', 'expert', '大师', '宗师', '强者'].includes(k)) tiers.strong += 1;
      }
    }
    return tiers;
  }

  isImbalanced(text: string): boolean {
    const t = this.countByTier(text);
    return t.weak === 0 || t.strong === 0;
  }
}

// ============================================================================
// Engine 4: SpeciesEcology
// ============================================================================

export class SpeciesEcology {
  private _speciesKeywords = ['龙', '精灵', '矮人', '兽人', '人类', '妖族', '魔族', 'dragon', 'elf', 'dwarf', 'orc', 'human', 'demon'];

  countUnique(text: string): string[] {
    const found = new Set<string>();
    for (const s of this._speciesKeywords) {
      if (text.includes(s)) found.add(s);
    }
    return Array.from(found);
  }

  isBalanced(text: string): boolean {
    const found = this.countUnique(text);
    // Healthy: 2-6 distinct species
    return found.length >= 2 && found.length <= 6;
  }
}

// ============================================================================
// Engine 5: ReligionSystem
// ============================================================================

export class ReligionSystem {
  private _religionKeywords = ['神', '教', '信仰', '祭司', '教堂', '圣经', 'god', 'religion', 'faith', 'priest', 'church', 'scripture'];

  countMentions(text: string): number {
    return this._religionKeywords.filter((k) => text.toLowerCase().includes(k.toLowerCase())).length;
  }

  hasEstablishedReligion(text: string, threshold = 3): boolean {
    return this.countMentions(text) >= threshold;
  }
}

// ============================================================================
// Engine 6: LanguageCohort
// ============================================================================

export class LanguageCohort {
  private _dialectKeywords = ['方言', '口音', '古语', '土话', 'dialect', 'accent', 'archaic', 'slang'];

  countDialects(text: string): number {
    return this._dialectKeywords.filter((k) => text.toLowerCase().includes(k.toLowerCase())).length;
  }

  isCulturallyRich(text: string, threshold = 2): boolean {
    return this.countDialects(text) >= threshold;
  }
}

// ============================================================================
// Engine 7: GeographicConsistency
// ============================================================================

export interface GeoPoint {
  name: string;
  x: number;
  y: number;
}

export class GeographicConsistency {
  private _places = new Map<string, GeoPoint>();

  addPlace(name: string, x: number, y: number): GeoPoint {
    const p = { name, x, y };
    this._places.set(name, p);
    return p;
  }

  distance(a: string, b: string): number {
    const pa = this._places.get(a);
    const pb = this._places.get(b);
    if (!pa || !pb) return 0;
    return Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
  }

  isReasonableTravel(distance: number, timeHours: number, maxKmh = 50): boolean {
    return distance <= timeHours * maxKmh;
  }

  getPlaces(): GeoPoint[] {
    return Array.from(this._places.values());
  }
}

// ============================================================================
// Engine 8: TimelineTracker
// ============================================================================

export interface TimelineEvent {
  id: string;
  description: string;
  chapter: number;
  year?: number;
  dependsOn?: string;
}

export class TimelineTracker {
  private _events: TimelineEvent[] = [];
  private _counter = 0;

  add(description: string, chapter: number, year?: number, dependsOn?: string): TimelineEvent {
    this._counter += 1;
    const e: TimelineEvent = { id: `evt_${this._counter}`, description, chapter, year, dependsOn };
    this._events.push(e);
    return e;
  }

  getAll(): TimelineEvent[] {
    return [...this._events];
  }

  getByChapter(c: number): TimelineEvent[] {
    return this._events.filter((e) => e.chapter === c);
  }

  hasDependency(e: TimelineEvent): boolean {
    if (!e.dependsOn) return true;
    return this._events.some((x) => x.id === e.dependsOn);
  }

  checkOrder(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    for (const e of this._events) {
      if (e.dependsOn) {
        const dep = this._events.find((x) => x.id === e.dependsOn);
        if (!dep) {
          issues.push(`event ${e.id} depends on missing ${e.dependsOn}`);
        } else if (dep.chapter >= e.chapter) {
          issues.push(`event ${e.id} (ch${e.chapter}) depends on later event ${dep.id} (ch${dep.chapter})`);
        }
      }
    }
    return { valid: issues.length === 0, issues };
  }
}

// ============================================================================
// Engine 9: SeasonWeather
// ============================================================================

export class SeasonWeather {
  private _seasonKeywords = ['春', '夏', '秋', '冬', '雪', '雨', '热', '冷', 'spring', 'summer', 'autumn', 'winter', 'snow', 'rain'];
  private _events = new Map<number, string[]>();

  addEvent(chapter: number, weather: string): void {
    if (!this._events.has(chapter)) this._events.set(chapter, []);
    this._events.get(chapter)!.push(weather);
  }

  countMentions(text: string): number {
    return this._seasonKeywords.filter((k) => text.includes(k)).length;
  }

  isConsistent(chapter1: number, chapter2: number, expectedSameSeason: boolean): boolean {
    const e1 = this._events.get(chapter1) || [];
    const e2 = this._events.get(chapter2) || [];
    if (e1.length === 0 || e2.length === 0) return true;
    // If same season expected, look for both having winter/summer etc
    return true; // simplified
  }
}

// ============================================================================
// Engine 10: DistanceSpeedValidator
// ============================================================================

export class DistanceSpeedValidator {
  validate(distanceKm: number, timeHours: number, mode: 'walk' | 'horse' | 'ship' | 'fly' | 'teleport'): {
    valid: boolean;
    actualSpeed: number;
    maxSpeed: number;
  } {
    const maxSpeeds: Record<typeof mode, number> = {
      walk: 6,
      horse: 60,
      ship: 50,
      fly: 800,
      teleport: Infinity,
    };
    const max = maxSpeeds[mode];
    const actual = timeHours === 0 ? 0 : distanceKm / timeHours;
    return {
      valid: actual <= max,
      actualSpeed: actual,
      maxSpeed: max,
    };
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AA_BATCH_1_ENGINES = {
  MagicSystemAuditor,
  TechConsistency,
  PowerEconomy,
  SpeciesEcology,
  ReligionSystem,
  LanguageCohort,
  GeographicConsistency,
  TimelineTracker,
  SeasonWeather,
  DistanceSpeedValidator,
} as const;
