/**
 * PacingSubplot.ts — Direction AB, V3036-V3045 (Batch 3/3 收口)
 * 节奏曲线 + 子线编织 + 收口 helper
 *
 * 10 engines:
 * 1.  TensionCurve — 张力曲线
 * 2.  ConflictEscalationCurve — 冲突升级曲线
 * 3.  PacingVisualizer — 节奏可视化（slow-burn/fast-pace 判定）
 * 4.  SceneSummaryRatio — 场景-总结比
 * 5.  SubplotWeaver — 子线编织
 * 6.  SubplotInterleaveValidator — 子线交错合理性
 * 7.  POVSwitchingReasonableness — 视角切换合理性
 * 8.  TimeJumpAuditor — 时间跳跃审计
 * 9.  PacingStructureDemo — 收口 demo
 * 10. PacingStructureIndex — 收口 public API barrel
 */

import type { Chapter } from './StructureTemplates';

// ============================================================================
// Engine 1: TensionCurve
// ============================================================================

export interface TensionPoint {
  chapter: number;
  tension: number; // 0-1
}

export class TensionCurve {
  private _points: TensionPoint[] = [];

  addPoint(chapter: number, tension: number): TensionPoint {
    const p = { chapter, tension: Math.max(0, Math.min(1, tension)) };
    this._points.push(p);
    return p;
  }

  getPoints(): TensionPoint[] {
    return [...this._points];
  }

  averageTension(): number {
    if (this._points.length === 0) return 0;
    return this._points.reduce((sum, p) => sum + p.tension, 0) / this._points.length;
  }

  peakTension(): number {
    if (this._points.length === 0) return 0;
    return this._points.reduce((max, p) => Math.max(max, p.tension), 0);
  }

  isEscalating(threshold = 0.05): boolean {
    if (this._points.length < 2) return false;
    let escalating = 0;
    for (let i = 1; i < this._points.length; i++) {
      const diff = this._points[i].tension - this._points[i - 1].tension;
      if (diff > threshold) escalating += 1;
    }
    return escalating >= this._points.length / 2;
  }
}

// ============================================================================
// Engine 2: ConflictEscalationCurve
// ============================================================================

export interface ConflictPoint {
  chapter: number;
  conflict: number;
  type: 'person' | 'self' | 'society' | 'nature' | 'fate';
}

export class ConflictEscalationCurve {
  private _points: ConflictPoint[] = [];

  addPoint(chapter: number, conflict: number, type: ConflictPoint['type']): ConflictPoint {
    const p = { chapter, conflict: Math.max(0, Math.min(1, conflict)), type };
    this._points.push(p);
    return p;
  }

  getPoints(): ConflictPoint[] {
    return [...this._points];
  }

  distributionByType(): Record<ConflictPoint['type'], number> {
    const dist: Record<ConflictPoint['type'], number> = {
      person: 0,
      self: 0,
      society: 0,
      nature: 0,
      fate: 0,
    };
    for (const p of this._points) dist[p.type] += 1;
    return dist;
  }

  totalConflictMass(): number {
    return this._points.reduce((sum, p) => sum + p.conflict, 0);
  }
}

// ============================================================================
// Engine 3: PacingVisualizer
// ============================================================================

export type PacingType = 'slow_burn' | 'fast_pace' | 'variable' | 'even';

export class PacingVisualizer {
  private _varianceThreshold = 0.15;

  classify(tensionValues: number[]): PacingType {
    if (tensionValues.length === 0) return 'even';
    if (tensionValues.length === 1) return 'even';
    const mean = tensionValues.reduce((s, v) => s + v, 0) / tensionValues.length;
    const variance = tensionValues.reduce((s, v) => s + (v - mean) ** 2, 0) / tensionValues.length;
    const std = Math.sqrt(variance);
    const cv = mean === 0 ? 0 : std / mean;
    if (cv < this._varianceThreshold) return 'even';
    const trend = tensionValues[tensionValues.length - 1] - tensionValues[0];
    if (trend > 0.3) return 'slow_burn';
    if (trend < -0.3) return 'fast_pace';
    return 'variable';
  }

  generateASCII(values: number[]): string {
    if (values.length === 0) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const heights = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    return values
      .map((v) => {
        const idx = Math.round(((v - min) / range) * (heights.length - 1));
        return heights[idx];
      })
      .join('');
  }
}

// ============================================================================
// Engine 4: SceneSummaryRatio
// ============================================================================

export interface SceneSummaryReport {
  sceneCount: number;
  summaryCount: number;
  ratio: number; // scene / (scene + summary)
  recommendation: string;
}

export class SceneSummaryRatio {
  private _idealSceneRatio = 0.5; // 50/50 ideal

  compute(scenes: number, summaries: number): SceneSummaryReport {
    const total = scenes + summaries;
    const ratio = total === 0 ? 0 : scenes / total;
    let recommendation = 'balanced';
    if (ratio < 0.3) recommendation = 'too_much_summary';
    else if (ratio > 0.7) recommendation = 'too_much_scene';
    else if (Math.abs(ratio - this._idealSceneRatio) < 0.1) recommendation = 'ideal_50_50';
    return { sceneCount: scenes, summaryCount: summaries, ratio, recommendation };
  }
}

// ============================================================================
// Engine 5: SubplotWeaver
// ============================================================================

export interface Subplot {
  id: string;
  name: string;
  startChapter: number;
  endChapter: number | null;
  resolved: boolean;
}

export class SubplotWeaver {
  private _subplots = new Map<string, Subplot>();

  add(id: string, name: string, startChapter: number): Subplot {
    const s: Subplot = { id, name, startChapter, endChapter: null, resolved: false };
    this._subplots.set(id, s);
    return s;
  }

  resolve(id: string, chapter: number): Subplot | null {
    const s = this._subplots.get(id);
    if (!s) return null;
    s.endChapter = chapter;
    s.resolved = true;
    return s;
  }

  getActive(currentChapter: number): Subplot[] {
    return Array.from(this._subplots.values()).filter(
      (s) => s.startChapter <= currentChapter && (s.endChapter === null || s.endChapter >= currentChapter)
    );
  }

  getUnresolved(): Subplot[] {
    return Array.from(this._subplots.values()).filter((s) => !s.resolved);
  }
}

// ============================================================================
// Engine 6: SubplotInterleaveValidator
// ============================================================================

export interface SubplotAppearance {
  subplotId: string;
  chapter: number;
}

export class SubplotInterleaveValidator {
  private _appearances: SubplotAppearance[] = [];

  addAppearance(subplotId: string, chapter: number): void {
    this._appearances.push({ subplotId, chapter });
  }

  getAppearancesBySubplot(subplotId: string): SubplotAppearance[] {
    return this._appearances.filter((a) => a.subplotId === subplotId);
  }

  hasInterleaving(subplotA: string, subplotB: string): boolean {
    const a = this.getAppearancesBySubplot(subplotA).map((x) => x.chapter);
    const b = this.getAppearancesBySubplot(subplotB).map((x) => x.chapter);
    if (a.length === 0 || b.length === 0) return false;
    // interleaving: A appears between first and last of B
    const minB = Math.min(...b);
    const maxB = Math.max(...b);
    return a.some((c) => c > minB && c < maxB);
  }

  countSubplots(): number {
    return new Set(this._appearances.map((a) => a.subplotId)).size;
  }
}

// ============================================================================
// Engine 7: POVSwitchingReasonableness
// ============================================================================

export interface POVSwitch {
  fromCharacter: string;
  toCharacter: string;
  chapter: number;
  isHeadHopping: boolean;
}

export class POVSwitchingReasonableness {
  private _maxSwitchesPerChapter = 3;

  evaluate(switchesList: POVSwitch[]): { totalSwitches: number; isReasonable: boolean; headHopping: boolean } {
    const headHop = switchesList.some((s) => s.isHeadHopping);
    return {
      totalSwitches: switchesList.length,
      isReasonable: switchesList.length <= this._maxSwitchesPerChapter && !headHop,
      headHopping: headHop,
    };
  }

  detectHeadHop(sw: POVSwitch, paragraphsInCharacter: number, paragraphsTotal: number): boolean {
    if (paragraphsTotal === 0) return false;
    const ratio = paragraphsInCharacter / paragraphsTotal;
    return ratio < 0.7; // less than 70% in character = head hopping
  }
}

// ============================================================================
// Engine 8: TimeJumpAuditor
// ============================================================================

export interface TimeJump {
  fromChapter: number;
  toChapter: number;
  durationInDays: number;
  isExcessive: boolean;
}

export class TimeJumpAuditor {
  private _maxDaysBetweenChapters = 365; // 1 year max

  audit(fromChapter: number, toChapter: number, durationDays: number): TimeJump {
    return {
      fromChapter,
      toChapter,
      durationInDays: durationDays,
      isExcessive: durationDays > this._maxDaysBetweenChapters,
    };
  }

  batchAudit(jumps: TimeJump[]): { totalJumps: number; excessiveJumps: number; excessiveRatio: number } {
    const excessive = jumps.filter((j) => j.isExcessive).length;
    return {
      totalJumps: jumps.length,
      excessiveJumps: excessive,
      excessiveRatio: jumps.length === 0 ? 0 : excessive / jumps.length,
    };
  }
}

// ============================================================================
// Engine 9: PacingStructureDemo (收口 - 演示综合使用)
// ============================================================================

export class PacingStructureDemo {
  run(chapters: Chapter[]): {
    pacingType: PacingType;
    ascii: string;
    tensionAvg: number;
    activeSubplots: number;
  } {
    const viz = new PacingVisualizer();
    const tensionValues = chapters.map((c, i) => {
      const text = c.content || '';
      return Math.min(1, (text.length % 100) / 100);
    });
    const pacingType = viz.classify(tensionValues);
    const ascii = viz.generateASCII(tensionValues);
    const tensionAvg = tensionValues.length > 0 ? tensionValues.reduce((s, v) => s + v, 0) / tensionValues.length : 0;
    const activeSubplots = Math.min(3, Math.floor(chapters.length / 5));
    return { pacingType, ascii, tensionAvg, activeSubplots };
  }
}

// ============================================================================
// Engine 10: PacingStructureIndex (收口 - public API)
// ============================================================================

export class PacingStructureIndex {
  list(): string[] {
    return [
      'ThreeActStructure',
      'HeroJourney12Stages',
      'SaveTheCat15Beats',
      'StoryGrid5Commandments',
      'SnowflakeMethod10Steps',
      'ScenePurpose',
      'MRUDetector',
      'SceneSequelBalance',
      'IncitingIncidentLocator',
      'MidpointDetector',
      'ClimaxMapper',
      'AllIsLostMoment',
      'DarkNightOfSoul',
      'MirrorMoment',
      'BStoryDetector',
      'FinaleConvergence',
      'ForeshadowPlanter',
      'ForeshadowPayoffTracker',
      'PlantPayoffLedger',
      'ChekhovGunAuditor',
      'TensionCurve',
      'ConflictEscalationCurve',
      'PacingVisualizer',
      'SceneSummaryRatio',
      'SubplotWeaver',
      'SubplotInterleaveValidator',
      'POVSwitchingReasonableness',
      'TimeJumpAuditor',
    ];
  }

  count(): number {
    return this.list().length;
  }

  describe(engineName: string): string {
    const map: Record<string, string> = {
      ThreeActStructure: '三幕结构分析器',
      HeroJourney12Stages: 'Campbell 英雄之旅 12 阶段',
      SaveTheCat15Beats: 'Blake Snyder 救猫咪 15 节拍',
      StoryGrid5Commandments: 'Story Grid 5 大戒律',
      SnowflakeMethod10Steps: 'Randy Ingermanson 雪花写作法 10 步',
      ScenePurpose: '场景目的（goal/conflict/disaster）',
      MRUDetector: 'Motivation-Reaction Unit 检测',
      SceneSequelBalance: '场景-后续比例平衡',
      IncitingIncidentLocator: '激励事件定位',
      MidpointDetector: '中点检测',
      TensionCurve: '张力曲线追踪',
      ConflictEscalationCurve: '冲突升级曲线',
      PacingVisualizer: '节奏可视化',
      SceneSummaryRatio: '场景-总结比',
      SubplotWeaver: '子线编织器',
      SubplotInterleaveValidator: '子线交错合理性',
      POVSwitchingReasonableness: '视角切换合理性',
      TimeJumpAuditor: '时间跳跃审计',
      ChekhovGunAuditor: '契诃夫之枪审计',
    };
    return map[engineName] || 'unknown engine';
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AB_BATCH_3_ENGINES = {
  TensionCurve,
  ConflictEscalationCurve,
  PacingVisualizer,
  SceneSummaryRatio,
  SubplotWeaver,
  SubplotInterleaveValidator,
  POVSwitchingReasonableness,
  TimeJumpAuditor,
  PacingStructureDemo,
  PacingStructureIndex,
} as const;

export const AB_ALL_ENGINES = {
  ...AB_BATCH_1_ENGINES_LIST,
  ...AB_BATCH_2_ENGINES_LIST,
  ...AB_BATCH_3_ENGINES,
} as const;

// Re-import to satisfy bundle (avoid circular)
import { AB_BATCH_1_ENGINES as AB_BATCH_1_ENGINES_LIST } from './StructureTemplates';
import { AB_BATCH_2_ENGINES as AB_BATCH_2_ENGINES_LIST } from './MomentsForeshadow';
