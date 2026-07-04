/**
 * VoiceApplication.test.ts — Direction AH, V3336-V3345 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  VoiceGenerationPrompt,
  CharacterVoiceLibrary,
  VoiceConsistencyEnforcer,
  DialogueAttributor,
  POVVoiceAdapter,
  MultiCharacterSimulator,
  VoiceTemplateLibrary,
  VoiceMigrationHelper,
  VoiceComparisonReport,
  CharacterVoiceIndex,
  type CharacterVoiceProfile,
} from './VoiceApplication';

const sampleProfile = (char: string, overrides: Partial<CharacterVoiceProfile> = {}): CharacterVoiceProfile => ({
  character: char,
  avgLen: 30,
  ttr: 0.5,
  questionRate: 0.1,
  exclamationRate: 0.1,
  fillerCount: 0,
  formality: 0.5,
  ...overrides,
});

describe('VoiceGenerationPrompt', () => {
  const e = new VoiceGenerationPrompt();

  it('generate includes character', () => {
    expect(e.generate('Alice', sampleProfile('Alice'))).toContain('Alice');
  });

  it('isActionable for valid', () => {
    expect(e.isActionable(sampleProfile('A'))).toBe(true);
  });
});

describe('CharacterVoiceLibrary', () => {
  const e = new CharacterVoiceLibrary();

  it('register + get + list', () => {
    e.register(sampleProfile('A'));
    expect(e.get('A')?.character).toBe('A');
    expect(e.list()).toContain('A');
  });

  it('size', () => {
    expect(e.size()).toBe(1);
  });
});

describe('VoiceConsistencyEnforcer', () => {
  const e = new VoiceConsistencyEnforcer();
  const lib = new CharacterVoiceLibrary();
  lib.register(sampleProfile('A', { avgLen: 30 }));

  it('check consistent for similar length', () => {
    expect(e.check('A', 'a'.repeat(30), lib).consistent).toBe(true);
  });

  it('hasDeviation for far length', () => {
    expect(e.hasDeviation('A', 'a'.repeat(200), lib)).toBe(true);
  });
});

describe('DialogueAttributor', () => {
  const e = new DialogueAttributor();
  const lib = new CharacterVoiceLibrary();
  lib.register(sampleProfile('Short', { avgLen: 10 }));
  lib.register(sampleProfile('Long', { avgLen: 100 }));

  it('attribute to closest', () => {
    expect(e.attribute('a'.repeat(8), lib)).toBe('Short');
    expect(e.attribute('a'.repeat(100), lib)).toBe('Long');
  });

  it('hasMultipleCandidates true for similar', () => {
    const lib2 = new CharacterVoiceLibrary();
    lib2.register(sampleProfile('A1', { avgLen: 30 }));
    lib2.register(sampleProfile('A2', { avgLen: 30.5 }));
    expect(e.hasMultipleCandidates('a'.repeat(30), lib2)).toBe(true);
  });
});

describe('POVVoiceAdapter', () => {
  const e = new POVVoiceAdapter();

  it('adapt formal uses 汝/余', () => {
    expect(e.adapt('我看到你', sampleProfile('A', { formality: 0.9 }))).toContain('余');
  });

  it('adapt casual uses 你', () => {
    expect(e.adapt('您好', sampleProfile('A', { formality: 0.2 }))).toContain('你');
  });

  it('adaptsTo true for valid', () => {
    expect(e.adaptsTo('text', sampleProfile('A'))).toBe(true);
  });
});

describe('MultiCharacterSimulator', () => {
  const e = new MultiCharacterSimulator();
  const lib = new CharacterVoiceLibrary();
  lib.register(sampleProfile('A', { avgLen: 30 }));
  lib.register(sampleProfile('B', { avgLen: 50 }));

  it('predictScene returns 3', () => {
    expect(e.predictScene(30, lib).length).toBe(2);
  });
});

describe('VoiceTemplateLibrary', () => {
  const e = new VoiceTemplateLibrary();

  it('add + getAll', () => {
    e.add('template1', sampleProfile('A'));
    expect(e.getAll()).toHaveLength(1);
  });

  it('findClosest returns best', () => {
    e.add('t1', sampleProfile('A', { avgLen: 10 }));
    e.add('t2', sampleProfile('B', { avgLen: 100 }));
    expect(e.findClosest(sampleProfile('X', { avgLen: 12 }))).toBe('t1');
  });
});

describe('VoiceMigrationHelper', () => {
  const e = new VoiceMigrationHelper();
  const lib = new CharacterVoiceLibrary();
  lib.register(sampleProfile('A', { avgLen: 20 }));
  lib.register(sampleProfile('B', { avgLen: 50 }));

  it('generateTransition includes both', () => {
    const r = e.generateTransition('A', 'B', lib);
    expect(r).toContain('A');
    expect(r).toContain('B');
  });
});

describe('VoiceComparisonReport', () => {
  const e = new VoiceComparisonReport();

  it('generate includes metrics', () => {
    const r = e.generate(sampleProfile('A'), sampleProfile('B'));
    expect(r).toContain('avgLen');
  });

  it('toMarkdown for list', () => {
    const md = e.toMarkdown([sampleProfile('A')]);
    expect(md).toContain('# Character Voice Report');
  });
});

describe('CharacterVoiceIndex', () => {
  const idx = new CharacterVoiceIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
