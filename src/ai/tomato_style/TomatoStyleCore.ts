/**
 * TomatoStyleCore.ts — Direction BW, V4466-V4475 (Batch 1/3)
 * Tomato Style Adapter: 番茄风格适配核心
 */

export class TomatoChapterLengthAdjuster { adjust(text: string, target: number = 2000): string { return text.length > target ? text.slice(0, target) : text; } isValidLength(text: string, min: number = 1500, max: number = 3000): boolean { return text.length >= min && text.length <= max; } }
export class TomatoTitleStyleMatcher { style(title: string): 'clickbait' | 'literary' | 'balanced' { if (/[！!]|\d+|震惊|逆袭/.test(title)) return 'clickbait'; if (/[\u4e00-\u9fa5]{6,}/.test(title)) return 'literary'; return 'balanced'; } isClickbait(s: string): boolean { return s === 'clickbait'; } }
export class TomatoOpeningHookGenerator { generate(genre: string): string { return `${genre} 故事开始了，危机随之降临...`; } isGenerated(s: string): boolean { return s.length > 0; } }
export class TomatoConflictPacer { insert(text: string, every: number = 500): string { return text + ' [CONFLICT] '; } hasConflict(s: string): boolean { return s.includes('[CONFLICT]'); } }
export class TomatoCliffhangerInserter { insert(ending: string): string { return ending + ' 她到底会如何抉择？'; } isCliffhanger(s: string): boolean { return s.includes('？'); } }
export class TomatoForeshadowDensity { ratio: number = 0.1; set(r: number): void { this.ratio = r; } isBalanced(): boolean { return this.ratio >= 0.05 && this.ratio <= 0.3; } }
export class TomatoDialogueRatioBalancer { ratio: number = 0.5; set(r: number): void { this.ratio = r; } isBalanced(min: number = 0.4, max: number = 0.6): boolean { return this.ratio >= min && this.ratio <= max; } }
export class TomatoPOVOptimizer { pov: 'first' | 'third' = 'third'; set(p: 'first' | 'third'): void { this.pov = p; } isValid(p: string): boolean { return p === 'first' || p === 'third'; } }
export class TomatoNameFormatValidator { isValid(name: string): boolean { return /^[\u4e00-\u9fa5]{2,4}$/.test(name); } }
export class TomatoPunctuationFormatter { format(text: string): string { return text.replace(/,/g, '，').replace(/\./g, '。'); } isFormatted(s: string): boolean { return s.includes('，') || s.includes('。'); } }
export class TomatoStyleCoreIndex { list(): string[] { return ['TomatoChapterLengthAdjuster', 'TomatoTitleStyleMatcher', 'TomatoOpeningHookGenerator', 'TomatoConflictPacer', 'TomatoCliffhangerInserter', 'TomatoForeshadowDensity', 'TomatoDialogueRatioBalancer', 'TomatoPOVOptimizer', 'TomatoNameFormatValidator', 'TomatoPunctuationFormatter']; } count(): number { return this.list().length; } }
export const BW_BATCH_1_ENGINES = { TomatoChapterLengthAdjuster, TomatoTitleStyleMatcher, TomatoOpeningHookGenerator, TomatoConflictPacer, TomatoCliffhangerInserter, TomatoForeshadowDensity, TomatoDialogueRatioBalancer, TomatoPOVOptimizer, TomatoNameFormatValidator, TomatoPunctuationFormatter, TomatoStyleCoreIndex } as const;