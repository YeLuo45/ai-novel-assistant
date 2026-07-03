/**
 * StructureTemplates.test.ts — Direction AB, V3016-V3025 (Batch 1/3)
 * 10 engines × 3+ assertions per engine = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ThreeActStructure,
  HeroJourney12Stages,
  SaveTheCat15Beats,
  StoryGrid5Commandments,
  SnowflakeMethod10Steps,
  ScenePurpose,
  MRUDetector,
  SceneSequelBalance,
  IncitingIncidentLocator,
  MidpointDetector,
  type Chapter,
} from './StructureTemplates';

describe('ThreeActStructure', () => {
  const t = new ThreeActStructure();

  it('classifies act 1 at progress 0.1', () => {
    expect(t.classify(0.1).act).toBe(1);
  });

  it('classifies act 2 at progress 0.5', () => {
    expect(t.classify(0.5).act).toBe(2);
  });

  it('classifies act 3 at progress 1.0', () => {
    expect(t.classify(1.0).act).toBe(3);
  });

  it('getActNumber returns 3 for 0.9', () => {
    expect(t.getActNumber(0.9)).toBe(3);
  });

  it('returns 5 markers', () => {
    expect(t.getAllMarkers()).toHaveLength(5);
  });
});

describe('HeroJourney12Stages', () => {
  const h = new HeroJourney12Stages();

  it('returns 12 stages', () => {
    expect(h.getAllStages()).toHaveLength(12);
  });

  it('stage at progress 0.5 is ordeal or approach', () => {
    const s = h.getStageAt(0.5);
    expect([6, 7]).toContain(s.index);
  });

  it('findStage returns undefined for unknown', () => {
    expect(h.findStage('xyz')).toBeUndefined();
  });
});

describe('SaveTheCat15Beats', () => {
  const stc = new SaveTheCat15Beats();

  it('returns 15 beats', () => {
    expect(stc.getBeats()).toHaveLength(15);
  });

  it('opening_image is at 1%', () => {
    expect(stc.findBeat('opening_image')?.pagePercent).toBe(1);
  });

  it('midpoint at 50%', () => {
    expect(stc.findBeat('midpoint')?.pagePercent).toBe(50);
  });

  it('getBeatsBetween returns in range', () => {
    const beats = stc.getBeatsBetween(40, 60);
    expect(beats.every((b) => b.pagePercent >= 40 && b.pagePercent <= 60)).toBe(true);
  });
});

describe('StoryGrid5Commandments', () => {
  const sg = new StoryGrid5Commandments();

  it('returns 5 commandments', () => {
    expect(sg.getCommandments()).toHaveLength(5);
  });

  it('check with all true scores 5', () => {
    const c = sg.check({
      hasIncitingIncident: true,
      hasProgressiveComplications: true,
      hasCrisis: true,
      hasClimax: true,
      hasResolution: true,
    });
    expect(c.score).toBe(5);
  });

  it('grade 5 is excellent', () => {
    expect(sg.grade(5)).toBe('excellent');
  });

  it('grade 0 is poor', () => {
    expect(sg.grade(0)).toBe('poor');
  });
});

describe('SnowflakeMethod10Steps', () => {
  const sm = new SnowflakeMethod10Steps();

  it('returns 10 steps', () => {
    expect(sm.getSteps()).toHaveLength(10);
  });

  it('first step is one_sentence', () => {
    expect(sm.getStepAt(0)?.step).toBe('one_sentence');
  });

  it('progressAt index 4 is 0.5', () => {
    expect(sm.progressAt(4)).toBeCloseTo(0.5, 5);
  });
});

describe('ScenePurpose', () => {
  const sp = new ScenePurpose();

  it('complete scene has goal + conflict', () => {
    const a = sp.analyze({ goal: 'find key', conflict: 'guard blocks' });
    expect(a.isComplete).toBe(true);
  });

  it('missing conflict → incomplete', () => {
    const a = sp.analyze({ goal: 'find key' });
    expect(a.isComplete).toBe(false);
  });

  it('diagnose missing_goal + missing_disaster', () => {
    const a = sp.analyze({});
    const issues = sp.diagnose(a);
    expect(issues).toContain('missing_goal');
    expect(issues).toContain('missing_disaster');
  });
});

describe('MRUDetector', () => {
  const m = new MRUDetector();

  it('detects motivation+reaction+decision', () => {
    const r = m.detect('她看到地上有血，决定去找警察，于是离开了房间');
    expect(r.hasAll).toBe(true);
  });

  it('missing motivation', () => {
    const r = m.detect('他决定去喝酒');
    expect(r.hasAll).toBe(false);
  });

  it('scoreText counts keyword hits', () => {
    const s = m.scoreText('他意识到，决定，然后');
    expect(s).toBeGreaterThanOrEqual(3);
  });
});

describe('SceneSequelBalance', () => {
  const ssb = new SceneSequelBalance();

  it('6 scenes 4 sequels = 0.6 ratio balanced', () => {
    const r = ssb.compute(6, 4);
    expect(r.ratio).toBeCloseTo(0.6, 5);
    expect(r.isBalanced).toBe(true);
  });

  it('9 scenes 1 sequel = not balanced (too much scene)', () => {
    const r = ssb.compute(9, 1);
    expect(r.isBalanced).toBe(false);
  });

  it('recommend more_scene at 0.5', () => {
    expect(ssb.recommend(0.5)).toBe('more_scene');
  });
});

describe('IncitingIncidentLocator', () => {
  const loc = new IncitingIncidentLocator();

  it('scores high for sudden events', () => {
    expect(loc.score('突然她听到了敲门声')).toBeGreaterThan(0);
  });

  it('locates from chapter list', () => {
    const chapters: Chapter[] = [
      { content: '平凡的一天' },
      { content: '突然一道闪电击中房子' },
      { content: '她决定去调查' },
    ];
    const found = loc.locate(chapters);
    expect(found?.chapter).toBe(1);
  });
});

describe('MidpointDetector', () => {
  const md = new MidpointDetector();

  it('ideal range 0.5 is true midpoint', () => {
    expect(md.isInIdealRange(0.5)).toBe(true);
  });

  it('detects chapter 5 of 11 with reversal', () => {
    const r = md.detect(5, 11, '她发现了真相');
    expect(r.isTrueMidpoint).toBe(true);
  });

  it('chapter 1 of 10 is not midpoint', () => {
    const r = md.detect(1, 10, '普通');
    expect(r.isTrueMidpoint).toBe(false);
  });
});
