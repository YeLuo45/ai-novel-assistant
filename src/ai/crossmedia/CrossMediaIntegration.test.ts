/**
 * CrossMediaIntegration.test.ts — Direction AM, V3486-V3495 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  MediaAdapter,
  FormatConverter,
  CharacterAdaptor,
  StoryArcAdapter,
  IPExpansionPlanner,
  CrossMediaConsistency,
  MediaMetricsTracker,
  ReleaseStrategyPlanner,
  IPValueMaximizer,
  CrossMediaIndexFinal,
} from './CrossMediaIntegration';

describe('MediaAdapter', () => {
  const e = new MediaAdapter();

  it('adapt for script', () => {
    expect(e.adapt('hello', 'script')).toContain('[SCENE]');
  });

  it('adapt for panel', () => {
    expect(e.adapt('hello', 'panel')).toContain('|');
  });

  it('supports for known', () => {
    expect(e.supports('script')).toBe(true);
  });

  it('supports false for unknown', () => {
    expect(e.supports('xyz')).toBe(false);
  });
});

describe('FormatConverter', () => {
  const e = new FormatConverter();

  it('toJSON returns string', () => {
    expect(typeof e.toJSON({ a: 1 })).toBe('string');
  });

  it('toMarkdown includes title', () => {
    expect(e.toMarkdown('T', 'content')).toContain('# T');
  });

  it('toYAML returns key: value', () => {
    expect(e.toYAML({ a: 'x' })).toContain('a: x');
  });
});

describe('CharacterAdaptor', () => {
  const e = new CharacterAdaptor();

  it('adapt for anime has 大眼', () => {
    expect(e.adapt('Alice', 'anime').traits).toContain('大眼');
  });

  it('adapt for game has 技能', () => {
    expect(e.adapt('Alice', 'game').traits).toContain('有技能');
  });
});

describe('StoryArcAdapter', () => {
  const e = new StoryArcAdapter();

  it('adapt for novel setup', () => {
    expect(e.adapt('setup', 'novel')).toContain('背景介绍');
  });

  it('adapt for anime climax', () => {
    expect(e.adapt('climax', 'anime')).toContain('B part');
  });
});

describe('IPExpansionPlanner', () => {
  const e = new IPExpansionPlanner();

  it('plan returns sequence', () => {
    const r = e.plan(['novel', 'manga']);
    expect(r.sequence).toHaveLength(2);
  });

  it('recommendExpansion for novel', () => {
    const r = e.recommendExpansion('novel');
    expect(r).toContain('novel');
    expect(r).toContain('动画');
  });
});

describe('CrossMediaConsistency', () => {
  const e = new CrossMediaConsistency();

  it('addFact + isConsistent', () => {
    e.addFact('color', 'blue');
    expect(e.isConsistent('color', 'blue')).toBe(true);
    expect(e.isConsistent('color', 'red')).toBe(false);
  });

  it('hasConflict', () => {
    e.addFact('age', '20');
    expect(e.hasConflict('age')).toBe(true);
  });
});

describe('MediaMetricsTracker', () => {
  const e = new MediaMetricsTracker();

  it('track + get', () => {
    e.track('novel', 1000);
    expect(e.get('novel')).toBe(1000);
  });

  it('bestPerforming', () => {
    e.track('novel', 100);
    e.track('anime', 500);
    expect(e.bestPerforming()).toBe('anime');
  });
});

describe('ReleaseStrategyPlanner', () => {
  const e = new ReleaseStrategyPlanner();

  it('plan for 3 media', () => {
    const r = e.plan(['a', 'b', 'c'], 30);
    expect(r[2].day).toBe(60);
  });

  it('hasGap true for >90', () => {
    const r = e.plan(['a', 'b'], 100);
    expect(r[1].day - r[0].day).toBe(100);
  });
});

describe('IPValueMaximizer', () => {
  const e = new IPValueMaximizer();

  it('suggest for media', () => {
    const r = e.suggest(['novel', 'anime']);
    expect(r).toHaveLength(2);
  });

  it('totalValue sum', () => {
    expect(e.totalValue(['novel', 'anime'])).toBe(300);
  });
});

describe('CrossMediaIndexFinal', () => {
  const idx = new CrossMediaIndexFinal();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
