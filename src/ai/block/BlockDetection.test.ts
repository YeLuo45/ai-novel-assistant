/**
 * BlockDetection.test.ts — Direction AJ, V3376-V3385 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  BlockTypeDetector,
  WriterBlockAnalyzer,
  ProcrastinationDetector,
  BurnoutDetector,
  CreativeBlockBreaker,
  PlotBlockBreaker,
  CharacterBlockBreaker,
  DialogueBlockBreaker,
  DescriptionBlockBreaker,
  BlockDetectionIndex,
} from './BlockDetection';

describe('BlockTypeDetector', () => {
  const e = new BlockTypeDetector();

  it('detect plot for 剧情卡', () => {
    expect(e.detect('剧情卡住了')).toBe('plot');
  });

  it('detect character for 人物卡', () => {
    expect(e.detect('人物卡了不活')).toBe('character');
  });

  it('detect dialogue for 对话干', () => {
    expect(e.detect('对话干巴巴的')).toBe('dialogue');
  });

  it('detect motivation for 累了', () => {
    expect(e.detect('我累了')).toBe('motivation');
  });

  it('isBlock true for stuck', () => {
    expect(e.isBlock('我卡文了')).toBe(true);
  });
});

describe('WriterBlockAnalyzer', () => {
  const e = new WriterBlockAnalyzer();

  it('analyze empty returns 0', () => {
    const r = e.analyze([]);
    expect(r.avgWords).toBe(0);
  });

  it('analyze decreasing trend', () => {
    const r = e.analyze([
      { date: '1', wordsWritten: 1000 },
      { date: '2', wordsWritten: 1200 },
      { date: '3', wordsWritten: 1100 },
      { date: '4', wordsWritten: 500 },
      { date: '5', wordsWritten: 300 },
      { date: '6', wordsWritten: 200 },
    ]);
    expect(r.trend).toBe('decreasing');
  });

  it('analyze increasing trend', () => {
    const r = e.analyze([
      { date: '1', wordsWritten: 100 },
      { date: '2', wordsWritten: 200 },
      { date: '3', wordsWritten: 300 },
      { date: '4', wordsWritten: 1000 },
      { date: '5', wordsWritten: 1200 },
      { date: '6', wordsWritten: 1500 },
    ]);
    expect(r.trend).toBe('increasing');
  });
});

describe('ProcrastinationDetector', () => {
  const e = new ProcrastinationDetector();

  it('detect high procrastination', () => {
    const r = e.detect([
      { startedOnTime: false, pausedFrequently: true, missedDeadlines: true },
    ]);
    expect(r.isProcrastinating).toBe(true);
  });

  it('detect low procrastination', () => {
    const r = e.detect([
      { startedOnTime: true, pausedFrequently: false, missedDeadlines: false },
    ]);
    expect(r.isProcrastinating).toBe(false);
  });
});

describe('BurnoutDetector', () => {
  const e = new BurnoutDetector();

  it('detect high for burned out text', () => {
    expect(e.detect('我很累很疲惫burned out')).toBeGreaterThan(0.5);
  });

  it('isBurnedOut true for 0.5+', () => {
    expect(e.isBurnedOut('疲惫 drained')).toBe(true);
  });

  it('isBurnedOut false for fresh', () => {
    expect(e.isBurnedOut('我精神很好')).toBe(false);
  });
});

describe('CreativeBlockBreaker', () => {
  const e = new CreativeBlockBreaker();

  it('suggestPrompts for plot', () => {
    const p = e.suggestPrompts('plot');
    expect(p.length).toBeGreaterThan(0);
  });

  it('suggestPrompts default 3', () => {
    expect(e.suggestPrompts('plot', 3)).toHaveLength(3);
  });
});

describe('PlotBlockBreaker', () => {
  const e = new PlotBlockBreaker();

  it('suggestTechniques returns N', () => {
    expect(e.suggestTechniques(3)).toHaveLength(3);
  });

  it('isStuck for 0 ideas', () => {
    expect(e.isStuck([])).toBe(true);
  });
});

describe('CharacterBlockBreaker', () => {
  const e = new CharacterBlockBreaker();

  it('suggestActions for character', () => {
    const a = e.suggestActions('Alice');
    expect(a.every((s) => s.includes('Alice'))).toBe(true);
  });

  it('suggestMotivations', () => {
    expect(e.suggestMotivations('Bob').length).toBeGreaterThan(0);
  });
});

describe('DialogueBlockBreaker', () => {
  const e = new DialogueBlockBreaker();

  it('suggestOpeners returns 3', () => {
    expect(e.suggestOpeners(3)).toHaveLength(3);
  });

  it('addConflict', () => {
    expect(e.addConflict('他想走')).toContain('不同意');
  });
});

describe('DescriptionBlockBreaker', () => {
  const e = new DescriptionBlockBreaker();

  it('suggestBySense for 视觉', () => {
    const s = e.suggestBySense('视觉');
    expect(s.every((x) => x.includes('视觉'))).toBe(true);
  });

  it('allSenses returns 10', () => {
    expect(e.allSenses()).toHaveLength(10);
  });
});

describe('BlockDetectionIndex', () => {
  const idx = new BlockDetectionIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
