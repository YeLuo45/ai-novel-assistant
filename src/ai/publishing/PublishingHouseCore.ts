/**
 * PublishingHouseCore.ts — Direction BL, V4216-V4225 (Batch 1/3)
 * Publishing House Matcher: 出版社匹配
 */

export class PublishingHouse { name: string = ''; genre: string = ''; requirements: string = ''; isValid(): boolean { return this.name.length > 0; } }
export class PublishingHouseLibrary { private _houses = new Map<string, PublishingHouse>(); add(house: PublishingHouse): void { this._houses.set(house.name, house); } find(name: string): PublishingHouse | null { return this._houses.get(name) || null; } count(): number { return this._houses.size; } }
export class GenreMatcher { match(house: { genre: string }, book: { genre: string }): number { return house.genre === book.genre ? 1 : 0.3; } isMatch(score: number, threshold = 0.5): boolean { return score >= threshold; } }
export class RequirementsChecker { check(house: { requirements: string }, book: { wordCount: number }): boolean { return book.wordCount >= 50000; } isValid(r: boolean): boolean { return r; } }
export class SubmissionGuidelinesProvider { guidelines: string = ''; provide(house: string): string { return `${house} 投稿要求: 字数 5万+, 题材符合, 完整大纲`; } isProvided(g: string): boolean { return g.length > 0; } }
export class AcceptanceRatePredictor { predict(house: { name: string; rate: number }): number { return house.rate; } isLikely(r: number, threshold = 0.1): boolean { return r >= threshold; } }
export class CompensationCalculator { calc(house: { rate: number; advance: number }, book: { wordCount: number }): { royalty: number; advance: number } { return { royalty: house.rate * book.wordCount, advance: house.advance }; } isFair(c: { royalty: number }, threshold = 1000): boolean { return c.royalty >= threshold; } }
export class PublisherContact { contacts = new Map<string, string>(); add(house: string, contact: string): void { this.contacts.set(house, contact); } get(house: string): string | undefined { return this.contacts.get(house); } has(house: string): boolean { return this.contacts.has(house); } }
export class PublisherRanking { rank(houses: { name: string; rate: number }[]): { name: string; rate: number }[] { return [...houses].sort((a, b) => b.rate - a.rate); } topN(n: number, houses: { name: string; rate: number }[]): { name: string; rate: number }[] { return this.rank(houses).slice(0, n); } }
export class PublishingHouseCoreIndex { list(): string[] { return ['PublishingHouse', 'PublishingHouseLibrary', 'GenreMatcher', 'RequirementsChecker', 'SubmissionGuidelinesProvider', 'AcceptanceRatePredictor', 'CompensationCalculator', 'PublisherContact', 'PublisherRanking']; } count(): number { return this.list().length; } }
export const BL_BATCH_1_ENGINES = { PublishingHouse, PublishingHouseLibrary, GenreMatcher, RequirementsChecker, SubmissionGuidelinesProvider, AcceptanceRatePredictor, CompensationCalculator, PublisherContact, PublisherRanking, PublishingHouseCoreIndex } as const;