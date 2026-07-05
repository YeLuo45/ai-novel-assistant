/**
 * SeriesContinuityIntegration.ts — Direction BO, V4326-V4335 (Batch 3/3 收口)
 * Series Continuity Validator: 集成 + 收口
 */

import { ContinuityTracker, CharacterStateTracker } from './SeriesContinuityCore';

export class ContinuityPipeline { steps: string[] = ['scan', 'detect', 'prioritize', 'fix', 'verify']; isComplete(step: string): boolean { return this.steps[this.steps.length - 1] === step; } next(step: string): string { const i = this.steps.indexOf(step); return i >= 0 && i < this.steps.length - 1 ? this.steps[i + 1] : 'done'; } }
export class ContinuityDirector { decide(state: { scanned: boolean; fixed: boolean }): string { if (!state.scanned) return 'scan'; if (!state.fixed) return 'fix'; return 'finalize'; } }
export class ContinuityReport2 { generate(stats: { books: number; issues: number; fixed: number }): string { return `${stats.books} 册, ${stats.issues} 问题, ${stats.fixed} 已修`; } hasReport(s: string): boolean { return s.includes('册'); } }
export class ContinuityLibrary { private _tracker = new ContinuityTracker(); save(book: number, event: string): void { this._tracker.addEvent(book, event); } get(book: number): string[] { return this._tracker.getEvents(book); } count(): number { return this._tracker.count(); } }
export class ContinuityValidator2 { validate(books: number, issues: number): { valid: boolean } { return { valid: books > 0 && issues < books * 10 }; } isValid(r: { valid: boolean }): boolean { return r.valid; } }
export class ContinuityTools { tools: string[] = ['ContinuityTracker', 'StoryBible', 'Plottr']; isAvailable(t: string): boolean { return this.tools.includes(t); } count(): number { return this.tools.length; } }
export class ContinuityADirector { decide(state: { hasTracker: boolean; hasReport: boolean }): string { if (!state.hasTracker) return 'init'; if (!state.hasReport) return 'report'; return 'finalize'; } }
export class ContinuityQualityGate { gate(stats: { books: number; issues: number }): boolean { return stats.books > 0 && stats.issues / stats.books <= 5; } }
export class ContinuityExport { export(tracker: ContinuityTracker): string { return JSON.stringify(Array.from(tracker['_events'].entries())); } isValid(s: string): boolean { return s.length > 0; } }
export class SeriesContinuityMasterIndex { list(): string[] { return ['ContinuityTracker', 'CharacterStateTracker', 'TimelineValidator', 'ForeshadowingTracker', 'WorldRuleValidator', 'PlotThreadTracker', 'CharacterArcValidator', 'ContinuityReport', 'ContinuityIssue', 'ContinuityIssueDetector', 'ContinuitySeverity', 'ContinuityFixer', 'ContinuitySuggestion', 'ContinuityChecker', 'ContinuityCrossReference', 'ContinuityMemory', 'ContinuityTimeline', 'ContinuitySearch', 'ContinuityPipeline', 'ContinuityDirector', 'ContinuityReport2', 'ContinuityLibrary', 'ContinuityValidator2', 'ContinuityTools', 'ContinuityADirector', 'ContinuityQualityGate', 'ContinuityExport', 'SeriesContinuityMasterIndex']; } count(): number { return this.list().length; } }
export const BO_BATCH_3_ENGINES = { ContinuityPipeline, ContinuityDirector, ContinuityReport2, ContinuityLibrary, ContinuityValidator2, ContinuityTools, ContinuityADirector, ContinuityQualityGate, ContinuityExport, SeriesContinuityMasterIndex } as const;