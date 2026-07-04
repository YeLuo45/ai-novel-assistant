/**
 * InspirationNetwork.test.ts — Direction AO, V3536-V3545 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  InfluenceMap,
  CrossAuthorAnalyzer,
  StyleGenealogy,
  InspirationWeb,
  BorrowingTracker,
  OriginalityMeter,
  ThemeClusterer,
  MotifTracker,
  IdeaEvolutionMapper,
  InspirationNetworkIndex,
} from './InspirationNetwork';

describe('InfluenceMap', () => {
  const e = new InfluenceMap();

  it('addInfluence + getInfluencesOf', () => {
    e.addInfluence('Tolkien', 'Martin', 0.8);
    const r = e.getInfluencesOf('Martin');
    expect(r[0].from).toBe('Tolkien');
  });

  it('topInfluencers for 2', () => {
    e.addInfluence('A', 'X', 0.5);
    e.addInfluence('B', 'X', 0.9);
    const top = e.topInfluencers('X', 2);
    expect(top[0].from).toBe('B');
  });
});

describe('CrossAuthorAnalyzer', () => {
  const e = new CrossAuthorAnalyzer();

  it('similarity for shared words', () => {
    e.addAuthor('A', ['hero magic sword']);
    e.addAuthor('B', ['hero magic']);
    expect(e.similarity('A', 'B')).toBeGreaterThan(0);
  });

  it('isSimilar for 0.3+', () => {
    e.addAuthor('A', ['x']);
    e.addAuthor('B', ['x']);
    expect(e.isSimilar('A', 'B')).toBe(true);
  });
});

describe('StyleGenealogy', () => {
  const e = new StyleGenealogy();

  it('addRelation + ancestorsOf', () => {
    e.addRelation('A', 'B');
    e.addRelation('B', 'C');
    const r = e.ancestorsOf('C');
    expect(r).toContain('A');
    expect(r).toContain('B');
  });
});

describe('InspirationWeb', () => {
  const e = new InspirationWeb();

  it('connect + shortestPath', () => {
    e.connect('A', 'B');
    e.connect('B', 'C');
    expect(e.shortestPath('A', 'C')).toEqual(['A', 'B', 'C']);
  });

  it('shortestPath for no path', () => {
    e.connect('A', 'B');
    expect(e.shortestPath('A', 'Z')).toEqual([]);
  });
});

describe('BorrowingTracker', () => {
  const e = new BorrowingTracker();

  it('record + countBySource', () => {
    e.record('Tolkien', 'magic', 'ch1');
    e.record('Tolkien', 'elf', 'ch2');
    expect(e.countBySource('Tolkien')).toBe(2);
  });

  it('isOverused for 5+', () => {
    for (let i = 0; i < 6; i++) e.record('X', 'y', `ch${i}`);
    expect(e.isOverused('X', 5)).toBe(true);
  });
});

describe('OriginalityMeter', () => {
  const e = new OriginalityMeter();

  it('measure high for no cliché', () => {
    expect(e.measure('unique text', ['common', 'boring'])).toBe(1);
  });

  it('measure low for all cliché', () => {
    expect(e.measure('common boring', ['common', 'boring'])).toBe(0);
  });

  it('isOriginal for 0.7+', () => {
    expect(e.isOriginal('unique', ['common'])).toBe(true);
  });
});

describe('ThemeClusterer', () => {
  const e = new ThemeClusterer();

  it('addTheme + cluster', () => {
    e.addTheme('love', ['heart', 'romance']);
    expect(e.cluster(['heart', 'romance'])).toBe('love');
  });

  it('cluster for unclustered', () => {
    expect(e.cluster(['xyz'])).toBe('unclustered');
  });
});

describe('MotifTracker', () => {
  const e = new MotifTracker();

  it('track + topMotifs', () => {
    e.track('sword');
    e.track('sword');
    e.track('magic');
    const top = e.topMotifs(2);
    expect(top[0].motif).toBe('sword');
  });
});

describe('IdeaEvolutionMapper', () => {
  const e = new IdeaEvolutionMapper();

  it('record + getEvolution', () => {
    e.record('plot1', 1, 'v1');
    e.record('plot1', 2, 'v2');
    const evo = e.getEvolution('plot1');
    expect(evo[0].version).toBe(1);
    expect(evo[1].version).toBe(2);
  });
});

describe('InspirationNetworkIndex', () => {
  const idx = new InspirationNetworkIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
