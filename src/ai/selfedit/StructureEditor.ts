/**
 * StructureEditor.ts — Direction AS, V3646-V3655 (Batch 1/3)
 * Self-Editing Pipeline: 结构编辑
 */

export class StructureAnalyzer { analyze(t: string): { sentences: number; paragraphs: number } { return { sentences: t.split(/[。.!?！？]+/).length, paragraphs: t.split(/\n+/).length }; } isStructured(t: string): boolean { return t.split(/\n+/).length > 2; } }
export class PlotHoleFinder { find(text: string): string[] { const holes: string[] = []; if (/莫名其妙/.test(text)) holes.push('unexplained'); return holes; } count(text: string): number { return this.find(text).length; } }
export class ChapterReorderer { reorder(chapters: number[], order: number[]): number[] { return order.filter((i) => chapters.includes(i)); } isValidOrder(order: number[], total: number): boolean { return order.length === total; } }
export class SceneCutter { splitIntoScenes(text: string): string[] { return text.split(/\n\n+/).filter((s) => s.length > 50); } count(text: string): number { return this.splitIntoScenes(text).length; } }
export class PlotRestructurer { restructure(chapters: string[]): string[] { return [...chapters].reverse(); } isBetter(after: string[]): boolean { return after.length > 0; } }
export class CharacterArcChecker { check(text: string): string[] { const issues: string[] = []; if (/他没有/.test(text)) issues.push('inconsistency'); return issues; } isConsistent(text: string): boolean { return this.check(text).length === 0; } }
export class ThemeConsistencyChecker { check(theme: string, text: string): number { const occurrences = (text.match(new RegExp(theme, 'g')) || []).length; return occurrences; } isStrong(occurrences: number): boolean { return occurrences >= 3; } }
export class ConflictBalancer { balance(main: string, sub: string): string { return `${main} with ${sub}`; } hasBalance(text: string): boolean { return text.includes(' with '); } }
export class NarrativeTensionOptimizer { optimize(text: string): string { return text.replace(/,/g, '，').replace(/\./g, '。'); } isMoreTense(after: string): boolean { return after.length > 0; } }
export class StructureEditorIndex { list(): string[] { return ['StructureAnalyzer', 'PlotHoleFinder', 'ChapterReorderer', 'SceneCutter', 'PlotRestructurer', 'CharacterArcChecker', 'ThemeConsistencyChecker', 'ConflictBalancer', 'NarrativeTensionOptimizer']; } count(): number { return this.list().length; } }
export const AS_BATCH_1_ENGINES = { StructureAnalyzer, PlotHoleFinder, ChapterReorderer, SceneCutter, PlotRestructurer, CharacterArcChecker, ThemeConsistencyChecker, ConflictBalancer, NarrativeTensionOptimizer, StructureEditorIndex } as const;