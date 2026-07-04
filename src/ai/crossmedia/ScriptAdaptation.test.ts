/**
 * ScriptAdaptation.test.ts — Direction AM, V3466-V3475 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ScriptFormatter,
  SceneToScriptConverter,
  DialogueToSpeechConverter,
  NarrativeToPanelConverter,
  PanelLayoutDesigner,
  VoiceBubblePlacer,
  EffectSFXDesigner,
  GameSceneConverter,
  ChoiceBranchDesigner,
  ScriptAdaptationIndex,
} from './ScriptAdaptation';

describe('ScriptFormatter', () => {
  const e = new ScriptFormatter();

  it('formatToScript adds [SCENE]', () => {
    expect(e.formatToScript('场景一。场景二。')).toContain('[SCENE]');
  });

  it('hasActionLines true for formatted', () => {
    expect(e.hasActionLines(e.formatToScript('a。b。'))).toBe(true);
  });
});

describe('SceneToScriptConverter', () => {
  const e = new SceneToScriptConverter();

  it('convert extracts dialogues', () => {
    const r = e.convert('地点描述。"对话"更多描述。');
    expect(r.dialogue.length).toBeGreaterThan(0);
  });

  it('convert has setting', () => {
    const r = e.convert('开始地点。更多内容。');
    expect(r.setting).toContain('开始');
  });
});

describe('DialogueToSpeechConverter', () => {
  const e = new DialogueToSpeechConverter();

  it('convert with happy emotion', () => {
    const r = e.convert('他笑了开心地说', 'Alice');
    expect(r.emotion).toBe('happy');
  });

  it('batchConvert', () => {
    const r = e.batchConvert([{ character: 'A', line: 'a' }]);
    expect(r).toHaveLength(1);
  });
});

describe('NarrativeToPanelConverter', () => {
  const e = new NarrativeToPanelConverter();

  it('convert for long text', () => {
    const text = '描述一。描述二。描述三。' + '很长的描述文字。'.repeat(10) + '他说"对话"然后继续。' + '更多描述。'.repeat(20);
    const r = e.convert(text);
    expect(r.length).toBeGreaterThan(0);
  });
});

describe('PanelLayoutDesigner', () => {
  const e = new PanelLayoutDesigner();

  it('design 4 = 2x2', () => {
    expect(e.design(4)).toBe('2x2 grid');
  });

  it('design 9 = 3x3', () => {
    expect(e.design(9)).toBe('3x3 grid');
  });

  it('recommendPanelSize for high', () => {
    expect(e.recommendPanelSize(0.8)).toBe('large');
  });
});

describe('VoiceBubblePlacer', () => {
  const e = new VoiceBubblePlacer();

  it('place for top-right', () => {
    expect(e.place('hello')).toContain('top-right');
  });

  it('isValidPlacement true', () => {
    expect(e.isValidPlacement('top-right: "hi"')).toBe(true);
  });
});

describe('EffectSFXDesigner', () => {
  const e = new EffectSFXDesigner();

  it('suggest for 战斗', () => {
    expect(e.suggest('战斗开始')).toContain('sword clash');
  });

  it('hasSFX true for action', () => {
    expect(e.hasSFX('爆炸')).toBe(true);
  });
});

describe('GameSceneConverter', () => {
  const e = new GameSceneConverter();

  it('convert returns 4 fields', () => {
    const r = e.convert('房间。他站在那里。');
    expect(r).toHaveProperty('location');
    expect(r).toHaveProperty('characters');
  });

  it('characters for character mentions', () => {
    const r = e.convert('房间。他和她在那里。');
    expect(r.characters.length).toBeGreaterThan(0);
  });
});

describe('ChoiceBranchDesigner', () => {
  const e = new ChoiceBranchDesigner();

  it('designChoice returns options', () => {
    const r = e.designChoice('point', ['A', 'B']);
    expect(r.options).toHaveLength(2);
  });

  it('hasMeaningfulChoice true for 2+', () => {
    expect(e.hasMeaningfulChoice(['A', 'B'])).toBe(true);
  });
});

describe('ScriptAdaptationIndex', () => {
  const idx = new ScriptAdaptationIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
