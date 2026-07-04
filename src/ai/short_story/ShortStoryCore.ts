/**
 * ShortStoryCore.ts — Direction BH, V4096-V4105 (Batch 1/3)
 * Short Story Adapter: 短篇改编
 */

export class StoryCondenser { condense(text: string, targetWords: number): string { const words = text.length / 2; if (words <= targetWords) return text; return text.slice(0, targetWords * 2) + '...'; } isCondensed(original: string, condensed: string): boolean { return condensed.length < original.length; } }
export class ThemeExtracter { extract(text: string): string[] { const matches = text.match(/[\u4e00-\u9fa5]{2,4}/g) || []; return Array.from(new Set(matches)).slice(0, 5); } isRich(themes: string[]): boolean { return themes.length >= 2; } }
export class PlotCompressor { compress(plot: string[]): string { return plot.filter((p) => p.length > 0).join(' ').slice(0, 100); } isCompressed(compressed: string): boolean { return compressed.length > 0; } }
export class CharacterReducer { reduce(characters: { name: string }[]): { name: string }[] { return characters.slice(0, 3); } isReduced(original: number, reduced: number): boolean { return reduced < original; } }
export class ScenePacker { pack(scenes: string[]): string { return scenes.join(' | '); } isPacked(packed: string): boolean { return packed.includes('|'); } }
export class WordBudgetEnforcer { enforce(text: string, budget: number): string { return text.length > budget ? text.slice(0, budget) : text; } isWithinBudget(text: string, budget: number): boolean { return text.length <= budget; } }
export class ImpactMaximizer { maximize(text: string): string { return text + ' (高潮)'; } isMaximized(text: string): boolean { return text.includes('高潮'); } }
export class ShortStoryHook { hook(topic: string): string { return `[HOOK] ${topic}`; } isHook(h: string): boolean { return h.includes('[HOOK]'); } }
export class ShortStoryPacing { pace(text: string, targetMinutes: number): string { const words = text.length / 2; const wpm = words / targetMinutes; return `需要 ${targetMinutes} 分钟, 当前 ${Math.round(wpm)} wpm`; } isValidPacing(p: string): boolean { return p.includes('分钟'); } }
export class ShortStoryCoreIndex { list(): string[] { return ['StoryCondenser', 'ThemeExtracter', 'PlotCompressor', 'CharacterReducer', 'ScenePacker', 'WordBudgetEnforcer', 'ImpactMaximizer', 'ShortStoryHook', 'ShortStoryPacing']; } count(): number { return this.list().length; } }
export const BH_BATCH_1_ENGINES = { StoryCondenser, ThemeExtracter, PlotCompressor, CharacterReducer, ScenePacker, WordBudgetEnforcer, ImpactMaximizer, ShortStoryHook, ShortStoryPacing, ShortStoryCoreIndex } as const;