/**
 * PlotStructureAnalysis.ts — Direction AF, V3276-V3285 (Batch 3/3 收口)
 * Plot Hole Detector: 复杂结构分析 + 收口
 *
 * 10 engines:
 * 1.  MultiChapterHoleAggregator — 跨章漏洞聚合
 * 2.  SetupPayoffChainVisualizer — 铺垫回收链可视化
 * 3.  MysteryLogicAuditor — 推理逻辑审计
 * 4.  CharacterKnowledgeCheck — 角色知识检查
 * 5.  ObjectContinuityAuditor — 物品连续性
 * 6.  FactionGoalAuditor — 阵营目标审计
 * 7.  GeographicLogicAuditor — 地理逻辑
 * 8.  TemporalLogicAuditor — 时间逻辑
 * 9.  PlotComplexityScorer — 情节复杂度
 * 10. PlotHoleIndex — 30 engines 收口
 *
 * 灵感：推理小说 / 编剧室 / 跨章分析
 */

import type { PlotHole } from './LogicChain';
import type { Chapter } from '../pacing/StructureTemplates';

export type { PlotHole } from './LogicChain';

// ============================================================================
// Engine 1: MultiChapterHoleAggregator
// ============================================================================

export class MultiChapterHoleAggregator {
  aggregate(holes: PlotHole[]): { byChapter: Map<number, PlotHole[]>; total: number } {
    const byChapter = new Map<number, PlotHole[]>();
    for (const h of holes) {
      if (!byChapter.has(h.chapter)) byChapter.set(h.chapter, []);
      byChapter.get(h.chapter)!.push(h);
    }
    return { byChapter, total: holes.length };
  }

  chaptersWithMultipleHoles(holes: PlotHole[]): number[] {
    const { byChapter } = this.aggregate(holes);
    return Array.from(byChapter.entries()).filter(([_, arr]) => arr.length > 1).map(([c]) => c);
  }

  holeDensity(holes: PlotHole[], totalChapters: number): number {
    if (totalChapters === 0) return 0;
    return holes.length / totalChapters;
  }
}

// ============================================================================
// Engine 2: SetupPayoffChainVisualizer
// ============================================================================

export class SetupPayoffChainVisualizer {
  private _setupKeywords = ['暗示', '似乎', '线索', '伏笔', 'hint', 'clue', 'foreshadowing'];
  private _payoffKeywords = ['果然', '果然不出', '正如', '果然如此', 'confirms', 'as expected'];

  isSetup(text: string): boolean {
    const lower = text.toLowerCase();
    return this._setupKeywords.some((k) => lower.includes(k.toLowerCase()));
  }

  isPayoff(text: string): boolean {
    const lower = text.toLowerCase();
    return this._payoffKeywords.some((k) => lower.includes(k.toLowerCase()));
  }

  chainRatio(chapters: Chapter[]): { setupCount: number; payoffCount: number; ratio: number } {
    let setupCount = 0;
    let payoffCount = 0;
    for (const c of chapters) {
      if (this.isSetup(c.content || '')) setupCount += 1;
      if (this.isPayoff(c.content || '')) payoffCount += 1;
    }
    return { setupCount, payoffCount, ratio: setupCount === 0 ? 0 : payoffCount / setupCount };
  }
}

// ============================================================================
// Engine 3: MysteryLogicAuditor
// ============================================================================

export class MysteryLogicAuditor {
  private _clueKeywords = ['线索', '证据', '指纹', '脚印', 'clue', 'evidence', 'fingerprint'];
  private _motiveKeywords = ['动机', '理由', '原因', 'motive', 'reason', 'cause'];
  private _opportunityKeywords = ['机会', '时间', '在场', 'opportunity', 'time', 'present'];

  hasClue(text: string): boolean {
    const lower = text.toLowerCase();
    return this._clueKeywords.some((k) => lower.includes(k.toLowerCase()));
  }

  hasMotive(text: string): boolean {
    const lower = text.toLowerCase();
    return this._motiveKeywords.some((k) => lower.includes(k.toLowerCase()));
  }

  hasOpportunity(text: string): boolean {
    const lower = text.toLowerCase();
    return this._opportunityKeywords.some((k) => lower.includes(k.toLowerCase()));
  }

  isValidMystery(text: string): boolean {
    return this.hasClue(text) && this.hasMotive(text) && this.hasOpportunity(text);
  }

  completenessScore(text: string): number {
    return (this.hasClue(text) ? 0.4 : 0) + (this.hasMotive(text) ? 0.3 : 0) + (this.hasOpportunity(text) ? 0.3 : 0);
  }
}

// ============================================================================
// Engine 4: CharacterKnowledgeCheck
// ============================================================================

export class CharacterKnowledgeCheck {
  private _knowledge = new Map<string, Set<string>>();

  knows(character: string, info: string): void {
    if (!this._knowledge.has(character)) this._knowledge.set(character, new Set());
    this._knowledge.get(character)!.add(info);
  }

  references(info: string, character: string, text: string): boolean {
    // If character references info in text, they must know it
    return text.includes(info);
  }

  hasKnowledgeGap(character: string, info: string, text: string): boolean {
    const knows = this._knowledge.get(character);
    const knowsIt = knows ? knows.has(info) : false;
    const references = this.references(info, character, text);
    return references && !knowsIt; // character talks about info they shouldn't know
  }
}

// ============================================================================
// Engine 5: ObjectContinuityAuditor
// ============================================================================

export class ObjectContinuityAuditor {
  private _objects = new Map<string, { introduced: number; location: string; owner: string | null }>();

  introduce(name: string, chapter: number, location: string, owner: string | null = null): void {
    this._objects.set(name, { introduced: chapter, location, owner });
  }

  moveTo(name: string, newLocation: string): boolean {
    const obj = this._objects.get(name);
    if (!obj) return false;
    obj.location = newLocation;
    return true;
  }

  changeOwner(name: string, newOwner: string): boolean {
    const obj = this._objects.get(name);
    if (!obj) return false;
    obj.owner = newOwner;
    return true;
  }

  hasInconsistency(name: string, currentLocation: string): boolean {
    const obj = this._objects.get(name);
    if (!obj) return false;
    return obj.location !== currentLocation;
  }
}

// ============================================================================
// Engine 6: FactionGoalAuditor
// ============================================================================

export interface Faction {
  name: string;
  goals: string[];
  actions: string[];
}

export class FactionGoalAuditor {
  private _factions = new Map<string, Faction>();

  addFaction(name: string, goals: string[]): void {
    this._factions.set(name, { name, goals, actions: [] });
  }

  addAction(faction: string, action: string): void {
    const f = this._factions.get(faction);
    if (f) f.actions.push(action);
  }

  isGoalAligned(faction: string, action: string): boolean {
    const f = this._factions.get(faction);
    if (!f) return false;
    return f.goals.some((g) => action.includes(g) || g.includes(action));
  }

  unalignedActions(faction: string): string[] {
    const f = this._factions.get(faction);
    if (!f) return [];
    return f.actions.filter((a) => !this.isGoalAligned(faction, a));
  }
}

// ============================================================================
// Engine 7: GeographicLogicAuditor
// ============================================================================

export class GeographicLogicAuditor {
  private _locations = new Map<string, { x: number; y: number }>();

  addLocation(name: string, x: number, y: number): void {
    this._locations.set(name, { x, y });
  }

  distance(a: string, b: string): number {
    const la = this._locations.get(a);
    const lb = this._locations.get(b);
    if (!la || !lb) return 0;
    return Math.sqrt((la.x - lb.x) ** 2 + (la.y - lb.y) ** 2);
  }

  isReasonableTravel(a: string, b: string, hours: number, maxKmh = 30): boolean {
    return this.distance(a, b) <= hours * maxKmh;
  }
}

// ============================================================================
// Engine 8: TemporalLogicAuditor
// ============================================================================

export class TemporalLogicAuditor {
  private _events: { name: string; timestamp: number; chapter: number; duration: number }[] = [];

  addEvent(name: string, timestamp: number, chapter: number, duration: number = 1): void {
    this._events.push({ name, timestamp, chapter, duration });
  }

  hasOverlappingEvents(): boolean {
    for (let i = 0; i < this._events.length; i++) {
      for (let j = i + 1; j < this._events.length; j++) {
        const a = this._events[i];
        const b = this._events[j];
        if (a.timestamp < b.timestamp + b.duration && b.timestamp < a.timestamp + a.duration) {
          return true; // overlap
        }
      }
    }
    return false;
  }

  hasCausalityViolation(): boolean {
    // Effect before cause
    for (let i = 0; i < this._events.length; i++) {
      for (let j = 0; j < i; j++) {
        if (this._events[i].timestamp < this._events[j].timestamp) return true;
      }
    }
    return false;
  }
}

// ============================================================================
// Engine 9: PlotComplexityScorer
// ============================================================================

export class PlotComplexityScorer {
  score(chapters: Chapter[]): { threads: number; totalLength: number; complexity: number } {
    const totalLength = chapters.reduce((s, c) => s + (c.content?.length || 0), 0);
    const threads = Math.min(10, Math.floor(totalLength / 5000));
    const complexity = Math.min(1, threads / 5);
    return { threads, totalLength, complexity };
  }

  classify(complexity: number): 'simple' | 'moderate' | 'complex' {
    if (complexity < 0.3) return 'simple';
    if (complexity < 0.7) return 'moderate';
    return 'complex';
  }
}

// ============================================================================
// Engine 10: PlotHoleIndex
// ============================================================================

export class PlotHoleIndex {
  list(): string[] {
    return [
      'CausalChainBuilder', 'CausalChainValidator', 'EventPreconditionChecker',
      'PlotHoleDetector', 'MotivationAuditor', 'ContradictionFinder',
      'TimelineLogicChecker', 'CharacterActionJustifier', 'SettingRuleEnforcer',
      'HoleSeverityRanker', 'HoleTypeDistribution', 'HoleChainBuilder',
      'ForeshadowPayoffVerifier', 'CharacterArcConsistency', 'PlotThreadTracker',
      'SetupPayoffRatio', 'PlantStrengthCalculator', 'SubplotHoleDetector',
      'HoleFixSuggester', 'MultiChapterHoleAggregator', 'SetupPayoffChainVisualizer',
      'MysteryLogicAuditor', 'CharacterKnowledgeCheck', 'ObjectContinuityAuditor',
      'FactionGoalAuditor', 'GeographicLogicAuditor', 'TemporalLogicAuditor',
      'PlotComplexityScorer',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AF_BATCH_3_ENGINES = {
  MultiChapterHoleAggregator,
  SetupPayoffChainVisualizer,
  MysteryLogicAuditor,
  CharacterKnowledgeCheck,
  ObjectContinuityAuditor,
  FactionGoalAuditor,
  GeographicLogicAuditor,
  TemporalLogicAuditor,
  PlotComplexityScorer,
  PlotHoleIndex,
} as const;

export type { Chapter };
