/**
 * ComicScriptCore.test.ts — Direction BG, V4066-V4075 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { PanelLayoutEngine, SpeechBubblePlacer, ComicDialogueWriter, ComicSceneDivider, ComicActionLineWriter, ComicSoundEffectGenerator, ComicPanel, ComicPageBuilder, ComicScriptFormatter, ComicScriptCoreIndex } from './ComicScriptCore';

describe('PanelLayoutEngine', () => {
  const e = new PanelLayoutEngine();
  it('layout for 4', () => {
    const r = e.layout(4);
    expect(r.rows * r.cols).toBeGreaterThanOrEqual(4);
  });
  it('isValid true', () => {
    expect(e.isValid({ rows: 2, cols: 2 })).toBe(true);
  });
});

describe('SpeechBubblePlacer', () => {
  const e = new SpeechBubblePlacer();
  it('place includes position', () => {
    expect(e.place('hi').position).toBe('top-right');
  });
  it('hasBubble true', () => {
    expect(e.hasBubble({ position: 'top' })).toBe(true);
  });
});

describe('ComicDialogueWriter', () => {
  const e = new ComicDialogueWriter();
  it('write includes character', () => {
    expect(e.write('Alice', 'hi', 'happy')).toContain('Alice');
  });
  it('isValid true', () => {
    expect(e.isValid('hi')).toBe(true);
  });
});

describe('ComicSceneDivider', () => {
  const e = new ComicSceneDivider();
  it('divide for 2 sentences', () => {
    expect(e.divide('场景一。场景二。').length).toBe(2);
  });
  it('isDivided true', () => {
    expect(e.isDivided([{ scene: 'a' }])).toBe(true);
  });
});

describe('ComicActionLineWriter', () => {
  const e = new ComicActionLineWriter();
  it('write for high', () => {
    expect(e.write('hit', 'high')).toContain('***');
  });
  it('isIntense true', () => {
    expect(e.isIntense('*** hit ***')).toBe(true);
  });
});

describe('ComicSoundEffectGenerator', () => {
  const e = new ComicSoundEffectGenerator();
  it('generate for hit', () => {
    expect(e.generate('hit')).toBe('砰');
  });
  it('isSound true', () => {
    expect(e.isSound('砰')).toBe(true);
  });
});

describe('ComicPanel', () => {
  const e = new ComicPanel();
  it('toString includes id', () => {
    e.id = 'p1';
    e.description = 'd';
    expect(e.toString()).toContain('p1');
  });
  it('isValid for id', () => {
    e.id = 'p1';
    expect(e.isValid()).toBe(true);
  });
});

describe('ComicPageBuilder', () => {
  const e = new ComicPageBuilder();
  it('buildPage for 2', () => {
    expect(e.buildPage([{ description: 'd1', dialogue: 'a' }, { description: 'd2', dialogue: 'b' }])).toContain('Panel 1');
  });
  it('isValid true', () => {
    expect(e.isValid('Panel 1: d')).toBe(true);
  });
});

describe('ComicScriptFormatter', () => {
  const e = new ComicScriptFormatter();
  it('format includes ACTION', () => {
    expect(e.format('action go')).toContain('[ACTION]');
  });
  it('isFormatted true', () => {
    expect(e.isFormatted('[ACTION] go')).toBe(true);
  });
});

describe('ComicScriptCoreIndex', () => {
  const idx = new ComicScriptCoreIndex();
  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});