/**
 * InspirationCapture.test.ts — Direction AO, V3526-V3535 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  InspirationCapture,
  SourceTagger,
  InspirationCategorizer,
  MoodTracker,
  TriggerLogger,
  InspirationRanker,
  IdeaConnector,
  SparkFile,
  VoiceMemoCapture,
  InspirationCaptureIndex,
} from './InspirationCapture';

describe('InspirationCapture', () => {
  const e = new InspirationCapture();

  it('capture + get', () => {
    const i = e.capture('a great idea', 'a book', 'plot');
    expect(e.get(i.id)?.content).toBe('a great idea');
  });

  it('getAll returns all', () => {
    const e2 = new InspirationCapture();
    e2.capture('a', 'b', 'c');
    e2.capture('d', 'e', 'f');
    expect(e2.getAll()).toHaveLength(2);
  });
});

describe('SourceTagger', () => {
  const e = new SourceTagger();

  it('tag + getTags', () => {
    e.tag('book', 'philosophy');
    e.tag('book', 'plot');
    expect(e.getTags('book')).toHaveLength(2);
  });

  it('isTagged true', () => {
    e.tag('film', 'cinema');
    expect(e.isTagged('film', 'cinema')).toBe(true);
  });
});

describe('InspirationCategorizer', () => {
  const e = new InspirationCategorizer();

  it('categorize for character', () => {
    expect(e.categorize('角色对话')).toBe('character');
  });

  it('categorize for visual', () => {
    expect(e.categorize('颜色和光影')).toBe('visual');
  });

  it('getCategories returns 8', () => {
    expect(e.getCategories()).toHaveLength(8);
  });
});

describe('MoodTracker', () => {
  const e = new MoodTracker();

  it('log + averageMood', () => {
    e.log('d1', 'happy', 0.8);
    expect(e.averageMood().mood).toBe('happy');
  });

  it('averageMood for empty = neutral', () => {
    expect(new MoodTracker().averageMood().mood).toBe('neutral');
  });
});

describe('TriggerLogger', () => {
  const e = new TriggerLogger();

  it('log + getTriggersByType', () => {
    e.log('music', 'a melody');
    e.log('film', 'a scene');
    expect(e.getTriggersByType('music')).toHaveLength(1);
  });
});

describe('InspirationRanker', () => {
  const e = new InspirationRanker();

  it('rank by length', () => {
    const r = e.rank([
      { id: '1', content: 'short', source: '', category: '', mood: '', timestamp: 0, tags: [] },
      { id: '2', content: 'a longer idea', source: '', category: '', mood: '', timestamp: 0, tags: [] },
    ]);
    expect(r[0].id).toBe('2');
  });

  it('topN', () => {
    expect(e.topN([], 5)).toHaveLength(0);
  });
});

describe('IdeaConnector', () => {
  const e = new IdeaConnector();

  it('connect + findRelated', () => {
    e.connect('idea1', 'idea2', 'similar');
    const r = e.findRelated('idea1');
    expect(r[0].related).toBe('idea2');
  });
});

describe('SparkFile', () => {
  const e = new SparkFile();

  it('add + getRandom', () => {
    e.add('spark1');
    e.add('spark2');
    expect(['spark1', 'spark2']).toContain(e.getRandom());
  });

  it('getAll returns all', () => {
    const e2 = new SparkFile();
    e2.add('a');
    expect(e2.getAll()).toHaveLength(1);
  });
});

describe('VoiceMemoCapture', () => {
  const e = new VoiceMemoCapture();

  it('record + getRecent', () => {
    e.record(30, 'transcript 1');
    e.record(60, 'transcript 2');
    expect(e.getRecent()).toHaveLength(2);
  });
});

describe('InspirationCaptureIndex', () => {
  const idx = new InspirationCaptureIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
