/**
 * HoleDetection.ts — Direction AV, V3736-V3745 (Batch 1/3)
 * Plot Hole Auto-Fixer: 漏洞检测自动化
 */

export type HoleType = 'motivation' | 'logic' | 'continuity' | 'setting' | 'unexplained';

export interface PlotHole {
  type: HoleType;
  location: string;
  description: string;
  severity: number;
}

export class HoleAutoDetector {
  private _patterns: Record<HoleType, RegExp[]> = {
    motivation: [/为什么.*没有/, /莫名其妙/],
    logic: [/不合理/, /说不通/],
    continuity: [/突然出现/, /突然消失/],
    setting: [/违和/, /不符合/],
    unexplained: [/不知道为什么/, /没有解释/],
  };

  detect(text: string): PlotHole[] {
    const holes: PlotHole[] = [];
    for (const [type, patterns] of Object.entries(this._patterns) as [HoleType, RegExp[]][]) {
      for (const p of patterns) {
        if (p.test(text)) holes.push({ type, location: 'chapter', description: p.source, severity: 0.5 });
      }
    }
    return holes;
  }

  count(text: string): number { return this.detect(text).length; }
}

export class HoleCategorizer { categorize(holes: PlotHole[]): Record<HoleType, number> { const c: Record<HoleType, number> = { motivation: 0, logic: 0, continuity: 0, setting: 0, unexplained: 0 }; for (const h of holes) c[h.type] += 1; return c; } dominant(holes: PlotHole[]): HoleType { if (holes.length === 0) return 'motivation'; const c = this.categorize(holes); let max = 0; let dom: HoleType = 'motivation'; for (const [k, v] of Object.entries(c)) if (v > max) { max = v; dom = k as HoleType; } return dom; } }

export class HolePriorityRanker { rank(holes: PlotHole[]): PlotHole[] { return [...holes].sort((a, b) => b.severity - a.severity); } topN(holes: PlotHole[], n: number): PlotHole[] { return this.rank(holes).slice(0, n); } }

export class AutoFixSuggester { suggest(hole: PlotHole): string { const map: Record<HoleType, string> = { motivation: '添加角色内心独白解释动机', logic: '补充因果链，让逻辑通顺', continuity: '回顾前文，确保角色/物品连续', setting: '检查设定一致性', unexplained: '加入说明性段落' }; return map[hole.type] || '手动修改'; } isValid(s: string): boolean { return s.length > 0; } }

export class FixConfidenceScorer { score(hole: PlotHole, fix: string): number { return fix.length > 5 ? 0.7 : 0.3; } isHighConfidence(c: number, threshold = 0.6): boolean { return c >= threshold; } }

export class ManualReviewQueue { private _queue: PlotHole[] = []; enqueue(hole: PlotHole): void { if (hole.severity > 0.6) this._queue.push(hole); } size(): number { return this._queue.length; } drain(): PlotHole[] { const r = [...this._queue]; this._queue = []; return r; } }

export class FixAttemptTracker { private _attempts: { holeId: string; success: boolean }[] = []; record(holeId: string, success: boolean): void { this._attempts.push({ holeId, success }); } successRate(): number { if (this._attempts.length === 0) return 0; return this._attempts.filter((a) => a.success).length / this._attempts.length; } }

export class DiffVisualizer { generate(before: string, after: string): string { return `Before: ${before.length} chars\nAfter: ${after.length} chars\nΔ ${after.length - before.length}`; } hasChanges(before: string, after: string): boolean { return before !== after; } }

export class HoleLinkageDetector { detect(text: string): PlotHole[] { const link = /(但是|然而)[^。]*。/g; const m = text.match(link); return (m || []).map((s) => ({ type: 'logic' as HoleType, location: '?', description: s, severity: 0.4 })); } count(text: string): number { return this.detect(text).length; } }

export class HoleDetectionIndex { list(): string[] { return ['HoleAutoDetector', 'HoleCategorizer', 'HolePriorityRanker', 'AutoFixSuggester', 'FixConfidenceScorer', 'ManualReviewQueue', 'FixAttemptTracker', 'DiffVisualizer', 'HoleLinkageDetector']; } count(): number { return this.list().length; } }
export const AV_BATCH_1_ENGINES = { HoleAutoDetector, HoleCategorizer, HolePriorityRanker, AutoFixSuggester, FixConfidenceScorer, ManualReviewQueue, FixAttemptTracker, DiffVisualizer, HoleLinkageDetector, HoleDetectionIndex } as const;