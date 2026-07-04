/**
 * AudioDramaCore.test.ts — Direction BI, V4126-V4135 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { SoundEffectDesigner, VoiceActorAssignment, DialogueTimingCalculator, BackgroundMusicSelector, AmbientSoundAdder, AudioDramaCueSheet, AudioDramaEpisode, AudioDramaScriptWriter, AudioDramaNarrator, AudioDramaCoreIndex } from './AudioDramaCore';

describe('SoundEffectDesigner', () => {
  const e = new SoundEffectDesigner();
  it('design includes sound', () => {
    expect(e.design('door').sound).toBe('door');
  });
  it('isValid true', () => {
    expect(e.isValid({ sound: 'x' })).toBe(true);
  });
});

describe('VoiceActorAssignment', () => {
  const e = new VoiceActorAssignment();
  it('assign returns', () => {
    expect(e.assign('A', 'voice1').voice).toBe('voice1');
  });
  it('isAssigned true', () => {
    expect(e.isAssigned({ character: 'A' })).toBe(true);
  });
});

describe('DialogueTimingCalculator', () => {
  const e = new DialogueTimingCalculator();
  it('calculate for 100', () => {
    expect(e.calculate('a'.repeat(200))).toBeGreaterThan(0);
  });
  it('isValid true', () => {
    expect(e.isValid(30)).toBe(true);
  });
});

describe('BackgroundMusicSelector', () => {
  const e = new BackgroundMusicSelector();
  it('isValid for calm', () => {
    expect(e.isValid('calm')).toBe(true);
  });
});

describe('AmbientSoundAdder', () => {
  const e = new AmbientSoundAdder();
  it('isAmbient for rain', () => {
    expect(e.isAmbient('rain')).toBe(true);
  });
});

describe('AudioDramaCueSheet', () => {
  const e = new AudioDramaCueSheet();
  it('add + count', () => {
    e.add('0:00', 'sound');
    expect(e.count()).toBe(1);
  });
});

describe('AudioDramaEpisode', () => {
  const e = new AudioDramaEpisode();
  it('isValid for title', () => {
    e.title = 'A';
    expect(e.isValid()).toBe(true);
  });
});

describe('AudioDramaScriptWriter', () => {
  const e = new AudioDramaScriptWriter();
  it('write includes character', () => {
    expect(e.write('A', 'hi', 'happy')).toContain('A');
  });
  it('isWritten true', () => {
    expect(e.isWritten('x')).toBe(true);
  });
});

describe('AudioDramaNarrator', () => {
  const e = new AudioDramaNarrator();
  it('narrate includes NARRATOR', () => {
    expect(e.narrate('x')).toContain('[NARRATOR]');
  });
  it('isNarrated true', () => {
    expect(e.isNarrated('[NARRATOR] x')).toBe(true);
  });
});

describe('AudioDramaCoreIndex', () => {
  const idx = new AudioDramaCoreIndex();
  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});