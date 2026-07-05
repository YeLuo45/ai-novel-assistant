/**
 * VoiceDictationAdvanced.ts — Direction BU, V4416-V4425 (Batch 2/3)
 * Voice Dictation Engine: 高级工具
 */

export class WhisperPromptOptimizer { optimize(text: string, context: string): string { return `[${context}] ${text}`; } isOptimized(s: string): boolean { return s.startsWith('['); } }
export class DictationCorrector { correct(text: string, errors: string[]): string { let result = text; for (const e of errors) result = result.replace(new RegExp(e, 'g'), '*'); return result; } hasCorrected(original: string, corrected: string): boolean { return original !== corrected; } }
export class DictationPunctuation { punctuate(text: string): string { return text.split(' ').join('，') + '。'; } hasPunctuation(s: string): boolean { return s.includes('。'); } }
export class DictationParagraph { paragraphize(text: string, maxLen: number = 100): string[] { const sentences = text.split('。'); const paras: string[] = []; let current = ''; for (const s of sentences) { if ((current + s).length > maxLen) { paras.push(current); current = s; } else current += s; } if (current) paras.push(current); return paras; } isParagraphed(paras: string[]): boolean { return paras.length > 0; } }
export class DictationFormatter { format(text: string): string { return text.replace(/。/g, '.\n'); } isFormatted(s: string): boolean { return s.includes('\n'); } }
export class DictationSpeedAdjuster { speed: number = 1.0; set(s: number): void { this.speed = Math.max(0.5, Math.min(2.0, s)); } isFast(): boolean { return this.speed > 1.5; } }
export class DictationNoiseFilter { filter(audio: string, threshold: number = 0.3): string { return audio.length > threshold * 1000 ? audio : ''; } hasContent(audio: string): boolean { return audio.length > 0; } }
export class DictationConfidence { score(text: string): number { return Math.min(1, text.length / 100); } isHigh(score: number, threshold: number = 0.5): boolean { return score >= threshold; } }
export class DictationHistory { private _history: { id: string; text: string }[] = []; add(text: string): string { const id = `d_${Date.now()}`; this._history.push({ id, text }); return id; } getAll(): { id: string; text: string }[] { return [...this._history]; } count(): number { return this._history.length; } }
export class DictationExport { export(text: string, format: 'txt' | 'md' | 'docx'): string { return `[${format}]\n${text}`; } isValid(s: string): boolean { return s.startsWith('['); } }
export class VoiceDictationAdvancedIndex { list(): string[] { return ['WhisperPromptOptimizer', 'DictationCorrector', 'DictationPunctuation', 'DictationParagraph', 'DictationFormatter', 'DictationSpeedAdjuster', 'DictationNoiseFilter', 'DictationConfidence', 'DictationHistory', 'DictationExport']; } count(): number { return this.list().length; } }
export const BU_BATCH_2_ENGINES = { WhisperPromptOptimizer, DictationCorrector, DictationPunctuation, DictationParagraph, DictationFormatter, DictationSpeedAdjuster, DictationNoiseFilter, DictationConfidence, DictationHistory, DictationExport, VoiceDictationAdvancedIndex } as const;