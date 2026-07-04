/**
 * LanguageEditor.ts — Direction AS, V3656-V3665 (Batch 2/3)
 * Self-Editing Pipeline: 语言编辑
 */

export class ProsePolisher { polish(t: string): string { return t.trim().replace(/\s+/g, ' ').replace(/然后/g, '接着'); } isPolished(a: string, b: string): boolean { return b.length > a.length * 0.8; } }
export class RedundancyRemover { remove(text: string): string { return text.replace(/非常/g, '').replace(/特别的/g, ''); } countRemoved(text: string): number { return (text.match(/非常/g) || []).length + (text.match(/特别的/g) || []).length; } }
export class VerbImprover { improve(t: string): string { return t.replace(/走/g, '迈步').replace(/看/g, '凝视'); } isImproved(a: string, b: string): boolean { return b !== a; } }
export class AdverbCutter { cut(text: string): string { return text.replace(/地/g, ''); } isAdverbFree(text: string): boolean { return !/地/.test(text); } }
export class ClichéRemover { remove(text: string): string { return text.replace(/他很帅/g, '他').replace(/她很美/g, '她'); } isClean(text: string): boolean { return !/他很帅|她很美/.test(text); } }
export class ToneAdjuster { adjust(text: string, tone: string): string { return `[${tone}] ${text}`; } hasTone(text: string): boolean { return /\[(formal|casual|poetic)\]/.test(text); } }
export class SentenceVariety { analyze(text: string): { avgLen: number } { const s = text.split(/[。.!?]+/).filter(x => x); return { avgLen: s.length ? text.length / s.length : 0 }; } isVaried(analysis: { avgLen: number }): boolean { return analysis.avgLen > 5; } }
export class ReadabilityScorer { score(text: string): number { return Math.min(1, text.length / 1000); } isReadable(score: number, threshold = 0.5): boolean { return score >= threshold; } }
export class DialogueTagger { tag(character: string, line: string): string { return `${character}说："${line}"`; } isValid(tagged: string): boolean { return tagged.includes('"'); } }
export class LanguageEditorIndex { list(): string[] { return ['ProsePolisher', 'RedundancyRemover', 'VerbImprover', 'AdverbCutter', 'ClichéRemover', 'ToneAdjuster', 'SentenceVariety', 'ReadabilityScorer', 'DialogueTagger']; } count(): number { return this.list().length; } }
export const AS_BATCH_2_ENGINES = { ProsePolisher, RedundancyRemover, VerbImprover, AdverbCutter, ClichéRemover, ToneAdjuster, SentenceVariety, ReadabilityScorer, DialogueTagger, LanguageEditorIndex } as const;