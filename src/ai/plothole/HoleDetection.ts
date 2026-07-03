/**
 * HoleDetection.ts — Direction AF, V3266-V3275 (Batch 2/3)
 * Plot Hole Detector: 漏洞检测深度 + 建议
 *
 * 10 engines:
 * 1.  HoleSeverityRanker — 漏洞严重度排序
 * 2.  HoleTypeDistribution — 漏洞类型分布
 * 3.  HoleChainBuilder — 漏洞链构建
 * 4.  ForeshadowPayoffVerifier — 伏笔回收验证
 * 5.  CharacterArcConsistency — 角色弧一致性
 * 6.  PlotThreadTracker — 情节线追踪
 * 7.  SetupPayoffRatio — 铺垫-回收比
 * 8.  PlantStrengthCalculator — 铺垫强度计算
 * 9.  SubplotHoleDetector — 子线漏洞检测
 * 10. HoleFixSuggester — 漏洞修复建议
 *
 * 灵感：推理小说 / 漫威编剧室 / 网文穿帮
 */

import type { PlotHole } from './LogicChain';

// ============================================================================
// Engine 1: HoleSeverityRanker
// ============================================================================

export class HoleSeverityRanker {
  rank(holes: PlotHole[]): PlotHole[] {
    const order = { critical: 0, major: 1, minor: 2 };
    return [...holes].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  topN(holes: PlotHole[], n: number): PlotHole[] {
    return this.rank(holes).slice(0, n);
  }

  isAcceptable(holes: PlotHole[]): boolean {
    return !holes.some((h) => h.severity === 'critical');
  }
}

// ============================================================================
// Engine 2: HoleTypeDistribution
// ============================================================================

export class HoleTypeDistribution {
  distribution(holes: PlotHole[]): Record<PlotHole['type'], number> {
    const dist: Record<PlotHole['type'], number> = {
      motivation: 0,
      logic: 0,
      continuity: 0,
      setting: 0,
      unexplained: 0,
    };
    for (const h of holes) dist[h.type] += 1;
    return dist;
  }

  dominantType(holes: PlotHole[]): PlotHole['type'] | null {
    if (holes.length === 0) return null;
    const dist = this.distribution(holes);
    let best: PlotHole['type'] = 'motivation';
    let max = 0;
    for (const k of Object.keys(dist) as PlotHole['type'][]) {
      if (dist[k] > max) {
        max = dist[k];
        best = k;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 3: HoleChainBuilder
// ============================================================================

export class HoleChainBuilder {
  private _chains: PlotHole[][] = [];

  buildChain(holes: PlotHole[]): PlotHole[] {
    // Build chain by chapter order
    return [...holes].sort((a, b) => a.chapter - b.chapter);
  }

  groupByType(holes: PlotHole[]): Record<PlotHole['type'], PlotHole[]> {
    const groups: Record<PlotHole['type'], PlotHole[]> = {
      motivation: [],
      logic: [],
      continuity: [],
      setting: [],
      unexplained: [],
    };
    for (const h of holes) groups[h.type].push(h);
    return groups;
  }
}

// ============================================================================
// Engine 4: ForeshadowPayoffVerifier
// ============================================================================

export interface ForeshadowRecord {
  id: string;
  description: string;
  plantedChapter: number;
  paidOffChapter: number | null;
}

export class ForeshadowPayoffVerifier {
  private _records: ForeshadowRecord[] = [];
  private _counter = 0;

  plant(description: string, chapter: number): ForeshadowRecord {
    this._counter += 1;
    const r: ForeshadowRecord = { id: `f_${this._counter}`, description, plantedChapter: chapter, paidOffChapter: null };
    this._records.push(r);
    return r;
  }

  payOff(id: string, chapter: number): boolean {
    const r = this._records.find((x) => x.id === id);
    if (!r) return false;
    r.paidOffChapter = chapter;
    return true;
  }

  getOrphans(): ForeshadowRecord[] {
    return this._records.filter((r) => r.paidOffChapter === null);
  }

  getResolved(): ForeshadowRecord[] {
    return this._records.filter((r) => r.paidOffChapter !== null);
  }

  fulfillmentRate(): number {
    if (this._records.length === 0) return 1;
    return this.getResolved().length / this._records.length;
  }
}

// ============================================================================
// Engine 5: CharacterArcConsistency
// ============================================================================

export class CharacterArcConsistency {
  private _arcs = new Map<string, { trait: string; chapter: number; change: number }[]>();

  trackChange(character: string, trait: string, chapter: number, change: number): void {
    if (!this._arcs.has(character)) this._arcs.set(character, []);
    this._arcs.get(character)!.push({ trait, chapter, change });
  }

  isConsistent(character: string): boolean {
    const changes = this._arcs.get(character) || [];
    if (changes.length < 2) return true;
    // Large sudden changes are suspicious
    for (let i = 1; i < changes.length; i++) {
      if (Math.abs(changes[i].change - changes[i - 1].change) > 0.8) return false;
    }
    return true;
  }

  isFlat(character: string): boolean {
    return (this._arcs.get(character) || []).length === 0;
  }
}

// ============================================================================
// Engine 6: PlotThreadTracker
// ============================================================================

export interface PlotThread {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'resolved' | 'abandoned';
  chapters: number[];
}

export class PlotThreadTracker {
  private _threads: PlotThread[] = [];
  private _counter = 0;

  add(name: string): PlotThread {
    this._counter += 1;
    const t: PlotThread = { id: `t_${this._counter}`, name, status: 'active', chapters: [] };
    this._threads.push(t);
    return t;
  }

  advance(id: string, chapter: number): void {
    const t = this._threads.find((x) => x.id === id);
    if (t) t.chapters.push(chapter);
  }

  resolve(id: string): void {
    const t = this._threads.find((x) => x.id === id);
    if (t) t.status = 'resolved';
  }

  getAbandoned(currentChapter: number, threshold = 50): PlotThread[] {
    return this._threads.filter((t) => {
      if (t.status !== 'active') return false;
      const last = t.chapters[t.chapters.length - 1] || 0;
      return currentChapter - last > threshold;
    });
  }
}

// ============================================================================
// Engine 7: SetupPayoffRatio
// ============================================================================

export class SetupPayoffRatio {
  compute(setups: number, payoffs: number): { ratio: number; isBalanced: boolean } {
    const ratio = setups === 0 ? 0 : payoffs / setups;
    return { ratio, isBalanced: ratio >= 0.7 && ratio <= 1.3 };
  }

  recommend(setups: number, payoffs: number): 'add_payoff' | 'add_setup' | 'balanced' {
    if (payoffs < setups * 0.7) return 'add_payoff';
    if (payoffs > setups * 1.3) return 'add_setup';
    return 'balanced';
  }
}

// ============================================================================
// Engine 8: PlantStrengthCalculator
// ============================================================================

export class PlantStrengthCalculator {
  private _plantKeywords = ['暗示', '似乎', '仿佛', '或许', '可能', '线索', '伏笔', 'hint', 'perhaps', 'maybe', 'clue'];

  score(plantText: string): number {
    const lower = plantText.toLowerCase();
    return Math.min(1, this._plantKeywords.filter((k) => lower.includes(k.toLowerCase())).length / 3);
  }

  isStrongPlant(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }

  isSubtlePlant(text: string): boolean {
    // Too subtle if no keywords at all
    return this.score(text) < 0.2;
  }
}

// ============================================================================
// Engine 9: SubplotHoleDetector
// ============================================================================

export class SubplotHoleDetector {
  detect(threads: PlotThread[]): { abandoned: PlotThread[]; unresolved: PlotThread[] } {
    const abandoned = threads.filter((t) => t.status === 'abandoned');
    const unresolved = threads.filter((t) => t.status === 'active');
    return { abandoned, unresolved };
  }

  hasOrphaned(threads: PlotThread[]): boolean {
    return threads.some((t) => t.status === 'abandoned');
  }
}

// Re-export PlotHole for convenience
export type { PlotHole } from './LogicChain';

// ============================================================================
// Engine 10: HoleFixSuggester
// ============================================================================

export interface FixSuggestion {
  type: PlotHole['type'];
  suggestion: string;
}

export class HoleFixSuggester {
  private _suggestions: Record<PlotHole['type'], string> = {
    motivation: '补充角色内心独白或行为理由，说明 why',
    logic: '重新排列事件顺序，确保 A 先于 B 发生',
    continuity: '检查前文设定，保持事实/细节一致',
    setting: '明确设定规则，让世界规则贯穿全文',
    unexplained: '增加过渡段落或对话解释事件触发原因',
  };

  suggest(type: PlotHole['type']): string {
    return this._suggestions[type];
  }

  suggestAll(holes: PlotHole[]): FixSuggestion[] {
    return holes.map((h) => ({ type: h.type, suggestion: this.suggest(h.type) }));
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AF_BATCH_2_ENGINES = {
  HoleSeverityRanker,
  HoleTypeDistribution,
  HoleChainBuilder,
  ForeshadowPayoffVerifier,
  CharacterArcConsistency,
  PlotThreadTracker,
  SetupPayoffRatio,
  PlantStrengthCalculator,
  SubplotHoleDetector,
  HoleFixSuggester,
} as const;
