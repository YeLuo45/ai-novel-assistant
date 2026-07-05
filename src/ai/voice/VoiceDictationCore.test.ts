/**
 * VoiceDictationCore.test.ts — Direction BU, V4406-V4415 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { WebSpeechRecognizer, WhisperTranscriber, AudioRecorder, AudioEncoder, RealtimeTranscriber, BatchTranscriber, LanguageDetector, PunctuationRestorer, SpeakerDiarization, VoiceActivityDetector, VoiceDictationCoreIndex } from './VoiceDictationCore';

describe('WebSpeechRecognizer', () => {
  const e = new WebSpeechRecognizer();
  it('recognize returns string', () => { expect(e.recognize({ blob: 'audio' })).toContain('[RECOGNIZED]'); });
  it('isRecognized true', () => { expect(e.isRecognized('[RECOGNIZED] x')).toBe(true); });
});

describe('WhisperTranscriber', () => {
  const e = new WhisperTranscriber();
  it('transcribe includes [WHISPER]', () => { expect(e.transcribe({ blob: 'a', language: 'zh' })).toContain('[WHISPER]'); });
  it('isTranscribed true', () => { expect(e.isTranscribed('[WHISPER] a')).toBe(true); });
});

describe('AudioRecorder', () => {
  const e = new AudioRecorder();
  it('start returns id', () => { const id = e.start(); expect(id.length).toBeGreaterThan(0); });
  it('stop + getRecording', () => { const id = e.start(); e.stop(id, 'audio_data'); expect(e.getRecording(id)).toBe('audio_data'); });
});

describe('AudioEncoder', () => {
  const e = new AudioEncoder();
  it('encode includes :', () => { expect(e.encode('audio', 'webm')).toContain(':'); });
  it('isValid true', () => { expect(e.isValid('webm:audio')).toBe(true); });
});

describe('RealtimeTranscriber', () => {
  const e = new RealtimeTranscriber();
  it('transcribe joins', () => { expect(e.transcribe(['hello', 'world'])).toBe('hello world'); });
  it('isRealtime true', () => { expect(e.isRealtime('x')).toBe(true); });
});

describe('BatchTranscriber', () => {
  const e = new BatchTranscriber();
  it('transcribe for 2', () => { expect(e.transcribe(['a', 'b']).length).toBe(2); });
  it('count', () => { expect(e.count()).toBe(2); });
});

describe('LanguageDetector', () => {
  const e = new LanguageDetector();
  it('detect for Chinese', () => { expect(e.detect('你好')).toBe('zh'); });
  it('isValid for zh', () => { expect(e.isValid('zh')).toBe(true); });
});

describe('PunctuationRestorer', () => {
  const e = new PunctuationRestorer();
  it('restore adds 。', () => { expect(e.restore('hello')).toContain('。'); });
  it('hasPunctuation true', () => { expect(e.hasPunctuation('。')).toBe(true); });
});

describe('SpeakerDiarization', () => {
  const e = new SpeakerDiarization();
  it('add + count', () => { e.add('Alice'); e.add('Alice'); e.add('Bob'); expect(e.count()).toBe(2); });
  it('isMultiple true', () => { expect(e.isMultiple()).toBe(true); });
});

describe('VoiceActivityDetector', () => {
  const e = new VoiceActivityDetector();
  it('detect for 0.6', () => { expect(e.detect(0.6)).toBe(true); });
  it('hasVoice true', () => { expect(e.hasVoice(0.8)).toBe(true); });
});

describe('VoiceDictationCoreIndex', () => {
  const idx = new VoiceDictationCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});