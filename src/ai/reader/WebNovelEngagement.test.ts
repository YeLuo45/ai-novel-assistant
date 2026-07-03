/**
 * WebNovelEngagement.test.ts — Direction Y, V3096-V3105 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  HuanDianDensity,
  FaceSlapDetector,
  PowerUpMoment,
  CoolPointVisualizer,
  EngagementCurveSimulator,
  RetentionCurvePredictor,
  ChapterVitalityHeatmap,
  CliffNotesGenerator,
  TropePositiveNegative,
  RelatabilityScorer,
  ReaderPsychologyIndex,
  type Chapter,
} from './WebNovelEngagement';

describe('HuanDianDensity', () => {
  const e = new HuanDianDensity();

  it('counts 爽点 keywords', () => {
    expect(e.count('太爽了！主角太牛逼，击败敌人。')).toBeGreaterThanOrEqual(3);
  });

  it('perKChar > 0 for dense', () => {
    expect(e.perKChar('爽，牛逼，击败，碾压，痛快，' + 'x'.repeat(50))).toBeGreaterThan(0);
  });

  it('classify high for very dense', () => {
    const t = '爽' + 'x'.repeat(20);
    expect(e.classify(e.perKChar(t))).toBe('high');
  });
});

describe('FaceSlapDetector', () => {
  const e = new FaceSlapDetector();

  it('counts face slap', () => {
    expect(e.count('怎么可能！不可能！简直不敢相信，目瞪口呆！')).toBeGreaterThanOrEqual(3);
  });

  it('hasFaceSlap true for 2+', () => {
    expect(e.hasFaceSlap('怎么可能！不可能！')).toBe(true);
  });

  it('hasFaceSlap false for no keywords', () => {
    expect(e.hasFaceSlap('她走了。')).toBe(false);
  });
});

describe('PowerUpMoment', () => {
  const e = new PowerUpMoment();

  it('counts power up', () => {
    expect(e.count('他突破瓶颈，升级了，觉醒血脉！')).toBeGreaterThanOrEqual(3);
  });

  it('isPowerUp for dense', () => {
    expect(e.isPowerUp('突破，升级，觉醒。')).toBe(true);
  });
});

describe('CoolPointVisualizer', () => {
  const e = new CoolPointVisualizer();

  it('profile > 0 for cool text', () => {
    expect(e.profile('一刀秒杀，瞬间恐怖。')).toBeGreaterThan(0);
  });

  it('visualize returns string', () => {
    const s = e.visualize([0.1, 0.5, 0.9]);
    expect(s.length).toBe(3);
  });
});

describe('EngagementCurveSimulator', () => {
  const e = new EngagementCurveSimulator();

  it('simulate returns per-chapter', () => {
    const chs: Chapter[] = [{ content: '她走了。' }, { content: '突然！为什么？！' }];
    const v = e.simulate(chs);
    expect(v).toHaveLength(2);
    expect(v[1]).toBeGreaterThan(v[0]);
  });

  it('average computed', () => {
    const v = [0.5, 0.6, 0.7];
    expect(e.average(v)).toBeCloseTo(0.6, 5);
  });
});

describe('RetentionCurvePredictor', () => {
  const e = new RetentionCurvePredictor();

  it('predict returns decreasing curve', () => {
    const r = e.predict([0.5, 0.5, 0.5, 0.5]);
    expect(r[0]).toBe(1);
    expect(r[r.length - 1]).toBeLessThan(1);
  });

  it('isHealthyDrop for engaging', () => {
    const r = e.predict([0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]);
    expect(e.isHealthyDrop(r)).toBe(true);
  });
});

describe('ChapterVitalityHeatmap', () => {
  const e = new ChapterVitalityHeatmap();

  it('build returns per chapter', () => {
    const chs: Chapter[] = [{ content: 'a。' }, { content: 'a。b。c。d。e。' }];
    const cells = e.build(chs);
    expect(cells).toHaveLength(2);
  });

  it('renderASCII returns string', () => {
    const chs: Chapter[] = [{ content: 'x' }, { content: 'a。b。c。d。e。f。g。h。i。j。k。' }];
    const cells = e.build(chs);
    const s = e.renderASCII(cells);
    expect(s.length).toBe(2);
  });
});

describe('CliffNotesGenerator', () => {
  const e = new CliffNotesGenerator();

  it('generate returns first sentences', () => {
    const chs: Chapter[] = [{ content: '她走进房间。后面很长。' }];
    const notes = e.generate(chs);
    expect(notes[0]).toBe('她走进房间');
  });

  it('isMemorable for character name', () => {
    expect(e.isMemorable('李雷走进房间')).toBe(true);
  });
});

describe('TropePositiveNegative', () => {
  const e = new TropePositiveNegative();

  it('countPositive for long text', () => {
    expect(e.countPositive('a'.repeat(200))).toBeGreaterThan(0);
  });

  it('countNegative for long text', () => {
    expect(e.countNegative('a'.repeat(200))).toBeGreaterThan(0);
  });
});

describe('RelatabilityScorer', () => {
  const e = new RelatabilityScorer();

  it('counts relatable', () => {
    expect(e.count('他加班到深夜，挤地铁回家，点外卖。')).toBeGreaterThanOrEqual(3);
  });

  it('score > 0 for relatable', () => {
    expect(e.score('加班，外租，挤地铁。')).toBeGreaterThan(0);
  });
});

describe('ReaderPsychologyIndex', () => {
  const idx = new ReaderPsychologyIndex();

  it('lists 30 engines', () => {
    expect(idx.count()).toBe(30);
  });

  it('describe returns Chinese name', () => {
    expect(idx.describe('ChapterOpenerHook')).toContain('钩子');
  });
});
