/**
 * PublishingHouseAdvanced.ts — Direction BL, V4226-V4235 (Batch 2/3)
 * Publishing House Matcher: 高级工具
 */

import type { PublishingHouse } from './PublishingHouseCore';
import { PublishingHouseLibrary } from './PublishingHouseCore';
export class ContractAnalyzer { analyze(contract: { royalty: number; advance: number }): { fair: boolean; score: number } { return { fair: contract.advance >= 1000, score: contract.royalty * 0.5 + contract.advance * 0.001 }; } isFair(a: { fair: boolean }): boolean { return a.fair; } }
export class PublisherReputation { reputation: number = 0; set(r: number): void { this.reputation = Math.max(0, Math.min(5, r)); } isGood(): boolean { return this.reputation >= 3.5; } }
export class ManuscriptRequirements { requirements: string[] = []; add(r: string): void { this.requirements.push(r); } count(): number { return this.requirements.length; } }
export class ImprintMatcher { match(imprint: { focus: string }, book: { focus: string }): number { return imprint.focus === book.focus ? 1 : 0.5; } isMatch(score: number, threshold = 0.5): boolean { return score >= threshold; } }
export class PublisherMarketShare { market: string = ''; share: number = 0; isBig(): boolean { return this.share >= 0.1; } }
export class EditorMatcher { match(editor: { genres: string[] }, book: { genre: string }): boolean { return editor.genres.includes(book.genre); } isMatched(m: boolean): boolean { return m; } }
export class PublisherResponseTime { days: number = 0; set(d: number): void { this.days = d; } isFast(): boolean { return this.days <= 30; } }
export class PublisherSubmissionTracker { submissions: { house: string; date: string; status: string }[] = []; submit(house: string): void { this.submissions.push({ house, date: new Date().toISOString(), status: 'pending' }); } count(): number { return this.submissions.length; } }
export class PublisherSearchEngine { search(library: PublishingHouseLibrary, query: string): PublishingHouse[] { return Array.from(library['_houses'].values() as IterableIterator<PublishingHouse>).filter((h) => h.name.includes(query) || h.genre.includes(query)); } hasMatch(r: PublishingHouse[]): boolean { return r.length > 0; } }
export class PublishingHouseAdvancedIndex { list(): string[] { return ['ContractAnalyzer', 'PublisherReputation', 'ManuscriptRequirements', 'ImprintMatcher', 'PublisherMarketShare', 'EditorMatcher', 'PublisherResponseTime', 'PublisherSubmissionTracker', 'PublisherSearchEngine']; } count(): number { return this.list().length; } }
export const BL_BATCH_2_ENGINES = { ContractAnalyzer, PublisherReputation, ManuscriptRequirements, ImprintMatcher, PublisherMarketShare, EditorMatcher, PublisherResponseTime, PublisherSubmissionTracker, PublisherSearchEngine, PublishingHouseAdvancedIndex } as const;