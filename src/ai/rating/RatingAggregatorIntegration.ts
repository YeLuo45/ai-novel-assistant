/**
 * RatingAggregatorIntegration.ts — Direction BN, V4296-V4305 (Batch 3/3 收口)
 * Beta Reader Rating Aggregator: 集成 + 收口
 */

import type { RatingCollector } from './RatingAggregatorCore';

export class RatingPipeline { steps: string[] = ['collect', 'aggregate', 'analyze', 'report', 'act']; isComplete(step: string): boolean { return this.steps[this.steps.length - 1] === step; } next(step: string): string { const i = this.steps.indexOf(step); return i >= 0 && i < this.steps.length - 1 ? this.steps[i + 1] : 'done'; } }
export class RatingDirector2 { decide(state: { collected: boolean; analyzed: boolean }): string { if (!state.collected) return 'collect'; if (!state.analyzed) return 'analyze'; return 'act'; } }
export class RatingReport2 { generate(stats: { avg: number; count: number }): string { return `${stats.count} 位读者平均 ${stats.avg.toFixed(1)}`; } hasReport(s: string): boolean { return s.includes('读者'); } }
export class RatingLibrary { private _ratings = new Map<string, unknown>(); save(key: string, data: unknown): void { this._ratings.set(key, data); } get(key: string): unknown { return this._ratings.get(key); } count(): number { return this._ratings.size; } }
export class RatingValidator { validate(ratings: { rating: number }[]): { valid: boolean; issues: string[] } { const issues: string[] = []; if (ratings.length === 0) issues.push('no ratings'); return { valid: issues.length === 0, issues }; } isValid(r: { valid: boolean }): boolean { return r.valid; } }
export class RatingTools { tools: string[] = ['Typeform', 'Google Forms', 'SurveyMonkey']; isAvailable(t: string): boolean { return this.tools.includes(t); } count(): number { return this.tools.length; } }
export class RatingADirector2 { decide(state: { collected: boolean; reviewed: boolean }): string { if (!state.collected) return 'collect'; if (!state.reviewed) return 'review'; return 'finalize'; } }
export class RatingQualityGate { gate(stats: { count: number; avg: number }): boolean { return stats.count >= 3 && stats.avg >= 3; } }
export class RatingFilter { filter(ratings: { rating: number }[], min: number): { rating: number }[] { return ratings.filter((r) => r.rating >= min); } hasMatch(r: { rating: number }[]): boolean { return r.length > 0; } }
export class RatingMasterIndex { list(): string[] { return ['RatingCollector', 'RatingAverage', 'RatingMedian', 'RatingDistribution', 'RatingConsensus', 'RatingOutlier', 'RatingSummary', 'RatingReport', 'RatingTrend', 'WeightedRating', 'RatingCategory', 'RatingThreshold', 'RatingComparison', 'RatingNormalization', 'RatingAggregationEngine', 'RatingDashboard', 'RatingADirector', 'RatingReportGenerator', 'RatingPipeline', 'RatingDirector2', 'RatingReport2', 'RatingLibrary', 'RatingValidator', 'RatingTools', 'RatingADirector2', 'RatingQualityGate', 'RatingFilter', 'RatingMasterIndex']; } count(): number { return this.list().length; } }
export const BN_BATCH_3_ENGINES = { RatingPipeline, RatingDirector2, RatingReport2, RatingLibrary, RatingValidator, RatingTools, RatingADirector2, RatingQualityGate, RatingFilter, RatingMasterIndex } as const;