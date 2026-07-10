// V5256-V5265: CW Multi-Modal Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  DiffusionPipeline,
  GANPipeline,
  VoiceCloner,
  MusicGenerator,
  SubtitleGenerator,
  SpeechToText,
  OCREngine,
  CaptionGenerator,
  MultimodalComposer,
  MultiModalAdvancedIndex,
  CW_BATCH_2_ENGINES
} from './MultiModalAdvanced';

describe('DiffusionPipeline + GANPipeline + VoiceCloner + MusicGenerator', () => {
  it('DiffusionPipeline run + get + totalSteps + count', () => {
    const d = new DiffusionPipeline();
    d.run('p1', 30, 7.5);
    d.run('p2', 50, 5.0);
    expect(d.totalSteps()).toBe(80);
    expect(d.count()).toBe(2);
    expect(d.get('missing')).toBeNull();
  });

  it('GANPipeline run + get + count', () => {
    const g = new GANPipeline();
    const id = g.run('gen-style', 'disc-critic');
    expect(g.get(id)?.generator).toBe('gen-style');
    expect(g.get('missing')).toBeNull();
    expect(g.count()).toBe(1);
  });

  it('VoiceCloner clone + get + names + averageSimilarity + count', () => {
    const v = new VoiceCloner();
    v.clone('alice', 'http://a.wav', 0.9).clone('bob', 'http://b.wav', 0.85);
    expect(v.get('alice')?.similarity).toBe(0.9);
    expect(v.names().sort()).toEqual(['alice', 'bob']);
    expect(v.averageSimilarity()).toBeCloseTo(0.875);
    expect(v.count()).toBe(2);
    expect(v.get('missing')).toBeNull();
    expect(new VoiceCloner().averageSimilarity()).toBe(0);
  });

  it('MusicGenerator generate + get + totalDuration + count', () => {
    const m = new MusicGenerator();
    m.generate(120, 'C', 180000);
    m.generate(140, 'D', 240000);
    expect(m.totalDurationMs()).toBe(420000);
    expect(m.count()).toBe(2);
  });
});

describe('SubtitleGenerator + SpeechToText + OCREngine + CaptionGenerator + MultimodalComposer', () => {
  it('SubtitleGenerator generateCues + toSRT', () => {
    const s = new SubtitleGenerator();
    const cues = s.generateCues('the quick brown fox jumps over the lazy dog and runs', 2);
    expect(cues.length).toBeGreaterThan(0);
    expect(s.toSRT(cues)).toContain('-->');
  });

  it('SpeechToText transcribe + batch + isValid', () => {
    const s = new SpeechToText();
    expect(s.transcribe('http://a.mp3').length).toBeGreaterThan(0);
    expect(s.transcribeBatch(['a', 'b'])).toHaveLength(2);
    expect(s.isValidTranscription('hello world')).toBe(true);
  });

  it('OCREngine recognize + batch + isValid', () => {
    const o = new OCREngine();
    expect(o.recognize('http://img.png').length).toBeGreaterThan(0);
    expect(o.recognizeBatch(['a', 'b'])).toHaveLength(2);
    expect(o.isValidText('text')).toBe(true);
    expect(o.isValidText('')).toBe(false);
  });

  it('CaptionGenerator generate + generateDetailed', () => {
    const c = new CaptionGenerator();
    expect(c.generate([])).toBe('');
    expect(c.generate(['cat', 'mat'])).toContain('cat');
    expect(c.generateDetailed(['cat'], ['indoors'])).toContain('indoors');
  });

  it('MultimodalComposer compose + composeStructured', () => {
    const c = new MultimodalComposer();
    const result = c.compose([{ type: 'text', content: 'hello' }, { type: 'image', content: 'cat.png' }]);
    expect(result).toContain('[text]');
    expect(result).toContain('[image]');
    const structured = c.composeStructured([{ type: 'text', content: 'hi' }]);
    expect(structured.text).toBe('hi');
  });
});

describe('MultiModalAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new MultiModalAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new MultiModalAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('DiffusionPipeline')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CW_BATCH_2_ENGINES const has 10', () => {
    expect(CW_BATCH_2_ENGINES).toHaveLength(10);
  });
});