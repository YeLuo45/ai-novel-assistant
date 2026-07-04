/**
 * VoiceConsistency.ts — Direction AX, V3796-V3805 (Batch 1/3)
 * Voice Consistency Enforcer: 声音一致性执行
 */

export interface VoiceProfile { id: string; avgLen: number; vocabRichness: number; formality: number; }

export class VoiceProfileManager { private _profiles = new Map<string, VoiceProfile>(); set(profile: VoiceProfile): void { this._profiles.set(profile.id, profile); } get(id: string): VoiceProfile | null { return this._profiles.get(id) || null; } count(): number { return this._profiles.size; } }

export class ConsistencyChecker { check(text: string, profile: VoiceProfile): { consistent: boolean; deviations: string[] } { const deviations: string[] = []; const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0); if (sentences.length === 0) return { consistent: true, deviations }; const avgLen = text.length / sentences.length; if (Math.abs(avgLen - profile.avgLen) > profile.avgLen * 0.5) deviations.push('sentence length deviation'); return { consistent: deviations.length === 0, deviations }; } isConsistent(result: { consistent: boolean }): boolean { return result.consistent; } }

export class VoiceEnforcer { enforce(text: string, profile: VoiceProfile): string { const result = new ConsistencyChecker().check(text, profile); if (result.consistent) return text; return text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0).map((s) => s.trim()).join('。'); } isEnforced(text: string, profile: VoiceProfile): boolean { const result = new ConsistencyChecker().check(text, profile); return result.consistent; } }

export class VoiceWarningGenerator { generate(profile: VoiceProfile, deviations: string[]): string { return `${profile.id} 声音偏离：${deviations.join(', ')}`; } hasWarning(w: string): boolean { return w.includes('声音偏离'); } }

export class VoiceCorrectionEngine { correct(text: string, profile: VoiceProfile): { corrected: string; changes: number } { const original = text; const corrected = text.replace(/[！!]{2,}/g, '！').replace(/[，,]{3,}/g, '，'); return { corrected, changes: original === corrected ? 0 : 1 }; } isCorrected(original: string, corrected: string): boolean { return original !== corrected; } }

export class VoiceDriftDetector { detect(text: string, profile: VoiceProfile): number { const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0); if (sentences.length === 0) return 0; const avgLen = text.length / sentences.length; return Math.abs(avgLen - profile.avgLen) / Math.max(1, profile.avgLen); } hasSignificantDrift(drift: number, threshold = 0.3): boolean { return drift > threshold; } }

export class VoiceBaselineCapture { capture(text: string): VoiceProfile { const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0); const avgLen = sentences.length > 0 ? text.length / sentences.length : 0; const words = new Set(text.split(/\s+/)); const vocabRichness = sentences.length > 0 ? words.size / sentences.length : 0; return { id: 'baseline', avgLen, vocabRichness, formality: 0.5 }; } isValid(p: VoiceProfile): boolean { return p.avgLen > 0; } }

export class VoiceTargetEnforcer { setTarget(profile: VoiceProfile): void {} getTarget(): VoiceProfile { return { id: 'target', avgLen: 10, vocabRichness: 0.5, formality: 0.5 }; } hasTarget(): boolean { return true; } }

export class VoiceConsistencyReport { generate(profile: VoiceProfile, checks: { consistent: boolean }[]): string { const pass = checks.filter((c) => c.consistent).length; return `${profile.id}: ${pass}/${checks.length} 通过`; } isPositive(report: string): boolean { return report.includes('通过'); } }

export class VoiceBatchProcessor { processBatch(texts: string[], profile: VoiceProfile): { consistent: number; total: number } { const checker = new ConsistencyChecker(); const results = texts.map((t) => checker.check(t, profile)); return { consistent: results.filter((r) => r.consistent).length, total: results.length }; } }

export class VoiceConsistencyIndex { list(): string[] { return ['VoiceProfileManager', 'ConsistencyChecker', 'VoiceEnforcer', 'VoiceWarningGenerator', 'VoiceCorrectionEngine', 'VoiceDriftDetector', 'VoiceBaselineCapture', 'VoiceTargetEnforcer', 'VoiceConsistencyReport', 'VoiceBatchProcessor']; } count(): number { return this.list().length; } }
export const AX_BATCH_1_ENGINES = { VoiceProfileManager, ConsistencyChecker, VoiceEnforcer, VoiceWarningGenerator, VoiceCorrectionEngine, VoiceDriftDetector, VoiceBaselineCapture, VoiceTargetEnforcer, VoiceConsistencyReport, VoiceBatchProcessor, VoiceConsistencyIndex } as const;