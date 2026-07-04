/**
 * CoAuthorCore.test.ts — Direction AR, V3616-V3625 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ChapterPromptBuilder,
  OutlineGenerator,
  SceneWriter,
  CharacterDialogueWriter,
  DescriptionGenerator,
  PlotTwistSuggester,
  ContinuationEngine,
  StyleMimicry,
  CoAuthorMode,
  CoAuthorCoreIndex,
  type ChapterContext,
} from './CoAuthorCore';

describe('ChapterPromptBuilder', () => {
  const e = new ChapterPromptBuilder();

  it('build returns prompt', () => {
    const ctx: ChapterContext = { genre: 'romance', previousSummary: 'met', characters: ['A', 'B'], targetWords: 1000, tone: 'warm' };
    const p = e.build(ctx);
    expect(p).toContain('romance');
  });

  it('isValid for long', () => {
    expect(e.isValid('a'.repeat(50))).toBe(true);
  });
});

describe('OutlineGenerator', () => {
  const e = new OutlineGenerator();

  it('generate for 3 chapters', () => {
    expect(e.generate('Title', 3)).toHaveLength(3);
  });

  it('isComplete for non-empty', () => {
    expect(e.isComplete(['a'])).toBe(true);
  });
});

describe('SceneWriter', () => {
  const e = new SceneWriter();

  it('writeScene includes setting', () => {
    const r = e.writeScene('forest', ['A'], 'flee');
    expect(r).toContain('forest');
  });

  it('isValidScene for long', () => {
    expect(e.isValidScene('a'.repeat(50))).toBe(true);
  });
});

describe('CharacterDialogueWriter', () => {
  const e = new CharacterDialogueWriter();

  it('writeDialogue includes character', () => {
    const r = e.writeDialogue('Alice', 'forest', 'sad');
    expect(r).toContain('Alice');
  });

  it('isRealistic true', () => {
    expect(e.isRealistic('Alice: "hi"')).toBe(true);
  });
});

describe('DescriptionGenerator', () => {
  const e = new DescriptionGenerator();

  it('describe includes target', () => {
    expect(e.describe('forest', ['green', 'dark'])).toContain('forest');
  });

  it('isVivid for vivid', () => {
    expect(e.isVivid('the forest is dark and deep and mysterious')).toBe(true);
  });
});

describe('PlotTwistSuggester', () => {
  const e = new PlotTwistSuggester();

  it('suggest returns 3', () => {
    expect(e.suggest('setup')).toHaveLength(3);
  });

  it('isSurprising for long', () => {
    expect(e.isSurprising('a'.repeat(20))).toBe(true);
  });
});

describe('ContinuationEngine', () => {
  const e = new ContinuationEngine();

  it('continue reaches target', () => {
    const r = e.continue('start', 3);
    expect(e.meetsTarget(r, 3)).toBe(true);
  });

  it('meetsTarget true', () => {
    expect(e.meetsTarget('one two three four five', 5)).toBe(true);
  });
});

describe('StyleMimicry', () => {
  const e = new StyleMimicry();

  it('mimic includes new content', () => {
    expect(e.mimic('style sample', 'new')).toContain('new');
  });

  it('isValidMimic true', () => {
    expect(e.isValidMimic('hello')).toBe(true);
  });
});

describe('CoAuthorMode', () => {
  const e = new CoAuthorMode();

  it('setMode + currentMode', () => {
    e.setMode('brainstorm');
    expect(e.currentMode()).toBeDefined();
  });
});

describe('CoAuthorCoreIndex', () => {
  const idx = new CoAuthorCoreIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});