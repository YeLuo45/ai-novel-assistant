/**
 * VoiceDictationCore.ts — Direction BU, V4406-V4415 (Batch 1/3)
 * Voice Dictation Engine: 语音听写核心
 */

export class WebSpeechRecognizer { recognize(audio: { blob: string }): string { return `[RECOGNIZED] ${audio.blob}`; } isRecognized(s: string): boolean { return s.startsWith('[RECOGNIZED]'); } }
export class WhisperTranscriber { transcribe(audio: { blob: string; language: string }): string { return `[WHISPER] ${audio.blob} (${audio.language})`; } isTranscribed(s: string): boolean { return s.startsWith('[WHISPER]'); } }
export class AudioRecorder { private _recordings: { id: string; blob: string }[] = []; start(): string { const id = `rec_${Date.now()}`; this._recordings.push({ id, blob: '' }); return id; } stop(id: string, blob: string): void { const r = this._recordings.find((x) => x.id === id); if (r) r.blob = blob; } getRecording(id: string): string { return this._recordings.find((r) => r.id === id)?.blob || ''; } }
export class AudioEncoder { encode(blob: string, format: 'webm' | 'wav' | 'mp3'): string { return `${format}:${blob}`; } isValid(s: string): boolean { return s.includes(':'); } }
export class RealtimeTranscriber { transcribe(stream: string[]): string { return stream.join(' '); } isRealtime(s: string): boolean { return s.length > 0; } }
export class BatchTranscriber { private _results: string[] = []; transcribe(audios: string[]): string[] { const r = audios.map((a) => `[BATCH] ${a}`); this._results = r; return r; } count(): number { return this._results.length; } }
export class LanguageDetector { detect(text: string): 'zh' | 'en' | 'other' { if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'; if (/^[a-zA-Z\s]+$/.test(text)) return 'en'; return 'other'; } isValid(l: string): boolean { return ['zh', 'en', 'other'].includes(l); } }
export class PunctuationRestorer { restore(text: string): string { return text + '。'; } hasPunctuation(s: string): boolean { return /[。.!?！？]/.test(s); } }
export class SpeakerDiarization { private _speakers: string[] = []; add(speaker: string): void { this._speakers.push(speaker); } count(): number { return Array.from(new Set(this._speakers)).length; } isMultiple(): boolean { return this.count() > 1; } }
export class VoiceActivityDetector { detect(amplitude: number, threshold: number = 0.5): boolean { return amplitude > threshold; } hasVoice(amp: number): boolean { return this.detect(amp); } }
export class VoiceDictationCoreIndex { list(): string[] { return ['WebSpeechRecognizer', 'WhisperTranscriber', 'AudioRecorder', 'AudioEncoder', 'RealtimeTranscriber', 'BatchTranscriber', 'LanguageDetector', 'PunctuationRestorer', 'SpeakerDiarization', 'VoiceActivityDetector']; } count(): number { return this.list().length; } }
export const BU_BATCH_1_ENGINES = { WebSpeechRecognizer, WhisperTranscriber, AudioRecorder, AudioEncoder, RealtimeTranscriber, BatchTranscriber, LanguageDetector, PunctuationRestorer, SpeakerDiarization, VoiceActivityDetector, VoiceDictationCoreIndex } as const;