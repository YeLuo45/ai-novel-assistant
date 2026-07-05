/**
 * PublishingHouseIntegration.ts — Direction BL, V4236-V4245 (Batch 3/3 收口)
 * Publishing House Matcher: 集成 + 收口
 */

import type { PublishingHouse } from './PublishingHouseCore';
import { PublishingHouseLibrary } from './PublishingHouseCore';

export class PublishingMatcher { match(library: PublishingHouseLibrary, book: { genre: string; wordCount: number }): PublishingHouse[] { return Array.from(library['_houses'].values() as IterableIterator<PublishingHouse>).filter((h) => h.genre === book.genre && book.wordCount >= 50000); } hasMatch(r: PublishingHouse[]): boolean { return r.length > 0; } }
export class SubmissionPipeline { steps: string[] = ['match', 'prepare', 'submit', 'track', 'follow_up']; isComplete(step: string): boolean { return this.steps[this.steps.length - 1] === step; } next(step: string): string { const i = this.steps.indexOf(step); return i >= 0 && i < this.steps.length - 1 ? this.steps[i + 1] : 'done'; } }
export class PublishingDirector { decide(state: { matched: boolean; submitted: boolean }): string { if (!state.matched) return 'find_match'; if (!state.submitted) return 'submit'; return 'wait'; } }
export class PublishingReport { generate(stats: { matched: number; submitted: number }): string { return `匹配 ${stats.matched} 家, 已投 ${stats.submitted} 家`; } hasReport(s: string): boolean { return s.includes('匹配'); } }
export class PublishingLibrary { private _library = new PublishingHouseLibrary(); save(key: string, data: PublishingHouse): void { this._library.add(data); } get(name: string): PublishingHouse | null { return this._library.find(name); } count(): number { return this._library.count(); } }
export class PublishingValidator { validate(house: PublishingHouse): { valid: boolean; issues: string[] } { const issues: string[] = []; if (!house.name) issues.push('no name'); return { valid: issues.length === 0, issues }; } isValid(r: { valid: boolean }): boolean { return r.valid; } }
export class PublishingTools { tools: string[] = ['QueryTracker', 'PublisherMarketplace', 'ManuscriptSubmit']; isAvailable(t: string): boolean { return this.tools.includes(t); } count(): number { return this.tools.length; } }
export class PublishingQualityGate { gate(house: PublishingHouse): boolean { return house.name.length > 0 && house.genre.length > 0; } }
export class PublishingExport { export(library: PublishingHouseLibrary): string { return JSON.stringify(Array.from(library['_houses'].values())); } isValid(s: string): boolean { return s.startsWith('['); } }
export class PublishingHouseMasterIndex { list(): string[] { return ['PublishingHouse', 'PublishingHouseLibrary', 'GenreMatcher', 'RequirementsChecker', 'SubmissionGuidelinesProvider', 'AcceptanceRatePredictor', 'CompensationCalculator', 'PublisherContact', 'PublisherRanking', 'ContractAnalyzer', 'PublisherReputation', 'ManuscriptRequirements', 'ImprintMatcher', 'PublisherMarketShare', 'EditorMatcher', 'PublisherResponseTime', 'PublisherSubmissionTracker', 'PublisherSearchEngine', 'PublishingMatcher', 'SubmissionPipeline', 'PublishingDirector', 'PublishingReport', 'PublishingLibrary', 'PublishingValidator', 'PublishingTools', 'PublishingQualityGate', 'PublishingExport', 'PublishingHouseMasterIndex']; } count(): number { return this.list().length; } }
export const BL_BATCH_3_ENGINES = { PublishingMatcher, SubmissionPipeline, PublishingDirector, PublishingReport, PublishingLibrary, PublishingValidator, PublishingTools, PublishingQualityGate, PublishingExport, PublishingHouseMasterIndex } as const;