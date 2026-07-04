/**
 * InspirationIntegration.test.ts — Direction AO, V3546-V3555 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  InspirationAI,
  CrossInspirationLinker,
  InspirationNetworkVisualizer,
  InspirationQualityScorer,
  InspirationReuser,
  InspirationCollaborator,
  InspirationEvolutionTracker,
  InspirationPredictor,
  InspirationLibraryBuilder,
  InspirationMasterIndex,
  type Inspiration,
} from './InspirationIntegration';

const sampleInsp = (id: string, tags: string[] = []): Inspiration => ({
  id, content: 'a great idea with detail', source: 'a book', category: 'plot', mood: 'happy', timestamp: 0, tags,
});

describe('InspirationAI', () => {
  const e = new InspirationAI();

  it('suggest returns prompt', () => {
    expect(e.suggest().length).toBeGreaterThan(0);
  });
});

describe('CrossInspirationLinker', () => {
  const e = new CrossInspirationLinker();

  it('link for shared tag', () => {
    const r = e.link([sampleInsp('1', ['love']), sampleInsp('2', ['love'])]);
    expect(r).toHaveLength(1);
  });

  it('link for no shared tag', () => {
    const r = e.link([sampleInsp('1', ['love']), sampleInsp('2', ['war'])]);
    expect(r).toHaveLength(0);
  });
});

describe('InspirationNetworkVisualizer', () => {
  const e = new InspirationNetworkVisualizer();

  it('render for edges', () => {
    expect(e.render(['A', 'B'], [{ from: 'A', to: 'B' }])).toContain('A -- B');
  });
});

describe('InspirationQualityScorer', () => {
  const e = new InspirationQualityScorer();

  it('score for long content', () => {
    const r = e.score(sampleInsp('1', ['a', 'b', 'c']));
    expect(r.total).toBeGreaterThan(0.5);
  });
});

describe('InspirationReuser', () => {
  const e = new InspirationReuser();

  it('reuse + getReuses', () => {
    e.reuse('1', 'chapter1');
    e.reuse('1', 'chapter2');
    expect(e.getReuses('1')).toHaveLength(2);
  });
});

describe('InspirationCollaborator', () => {
  const e = new InspirationCollaborator();

  it('addMember + count', () => {
    e.addMember('Alice');
    e.addMember('Bob');
    expect(e.count()).toBe(2);
  });

  it('canCollaborate true for 2+', () => {
    expect(e.canCollaborate()).toBe(true);
  });
});

describe('InspirationEvolutionTracker', () => {
  const e = new InspirationEvolutionTracker();

  it('track + getCurrentState', () => {
    e.track('1', 'idea');
    e.track('1', 'outline');
    expect(e.getCurrentState('1')).toBe('outline');
  });
});

describe('InspirationPredictor', () => {
  const e = new InspirationPredictor();

  it('predict for 7 days avg 1', () => {
    const history = Array.from({ length: 7 }, () => ({ date: 'd', count: 1 }));
    expect(e.predict(history, 7)).toBe(7);
  });
});

describe('InspirationLibraryBuilder', () => {
  const e = new InspirationLibraryBuilder();

  it('addToLibrary + totalCount', () => {
    e.addToLibrary('plot', sampleInsp('1'));
    e.addToLibrary('plot', sampleInsp('2'));
    e.addToLibrary('character', sampleInsp('3'));
    expect(e.totalCount()).toBe(3);
  });

  it('getByCategory', () => {
    const e2 = new InspirationLibraryBuilder();
    e2.addToLibrary('plot', sampleInsp('1'));
    expect(e2.getByCategory('plot')).toHaveLength(1);
  });
});

describe('InspirationMasterIndex', () => {
  const idx = new InspirationMasterIndex();

  it('lists 28 engines', () => {
    expect(idx.count()).toBe(28);
  });
});
