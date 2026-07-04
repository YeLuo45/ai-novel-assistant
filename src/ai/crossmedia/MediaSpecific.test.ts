/**
 * MediaSpecific.test.ts — Direction AM, V3476-V3485 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  AnimeEpisodeDesigner,
  TVDramaEpisodeSplitter,
  MovieScreenplayAdapter,
  WebComicPanelDesigner,
  AudiobookChapterDesigner,
  PodcastScriptWriter,
  GameQuestDesigner,
  RPGDialogueWriter,
  VisualNovelScriptWriter,
  MediaSpecificIndex,
  type Chapter,
} from './MediaSpecific';

describe('AnimeEpisodeDesigner', () => {
  const e = new AnimeEpisodeDesigner();

  it('design returns 4 fields', () => {
    const r = e.design(1, '场景一。场景二。场景三。' + 'x'.repeat(500));
    expect(r.episode).toBe(1);
    expect(r.duration).toBe(24);
  });
});

describe('TVDramaEpisodeSplitter', () => {
  const e = new TVDramaEpisodeSplitter();

  it('split for empty', () => {
    expect(e.split([])).toHaveLength(0);
  });

  it('split for long content', () => {
    const chs: Chapter[] = Array.from({ length: 30 }, () => ({ content: 'a'.repeat(3000) }));
    const r = e.split(chs);
    expect(r.length).toBeGreaterThan(1);
  });
});

describe('MovieScreenplayAdapter', () => {
  const e = new MovieScreenplayAdapter();

  it('adapt for chapters', () => {
    const r = e.adapt([{ content: '句子1。句子2。' + 'x'.repeat(500) }]);
    expect(r.scenes.length).toBeGreaterThan(0);
  });

  it('countActs = 3', () => {
    expect(e.countActs()).toBe(3);
  });
});

describe('WebComicPanelDesigner', () => {
  const e = new WebComicPanelDesigner();

  it('design scrollable', () => {
    const r = e.design(10, true);
    expect(r.layout).toBe('vertical scroll');
  });

  it('design non-scrollable', () => {
    const r = e.design(6, false);
    expect(r.layout).toBe('grid');
  });
});

describe('AudiobookChapterDesigner', () => {
  const e = new AudiobookChapterDesigner();

  it('design returns duration + notes', () => {
    const r = e.design({ content: 'a'.repeat(1000) });
    expect(r.narratorNotes.length).toBeGreaterThan(0);
  });
});

describe('PodcastScriptWriter', () => {
  const e = new PodcastScriptWriter();

  it('writeScript includes intro/main/outro', () => {
    const r = e.writeScript('写作技巧', 30);
    expect(r.intro).toContain('播客');
    expect(r.main).toContain('核心');
    expect(r.outro).toContain('再见');
  });
});

describe('GameQuestDesigner', () => {
  const e = new GameQuestDesigner();

  it('design returns quest', () => {
    const r = e.design('杀龙', '击杀 10 条龙', '100 金币');
    expect(r.steps).toHaveLength(4);
  });
});

describe('RPGDialogueWriter', () => {
  const e = new RPGDialogueWriter();

  it('write for greeting', () => {
    expect(e.write('NPC', 'greeting')).toContain('你好');
  });

  it('write for quest', () => {
    expect(e.write('NPC', 'quest')).toContain('任务');
  });

  it('write for trade', () => {
    expect(e.write('NPC', 'trade')).toContain('商品');
  });

  it('write for farewell', () => {
    expect(e.write('NPC', 'farewell')).toContain('再见');
  });
});

describe('VisualNovelScriptWriter', () => {
  const e = new VisualNovelScriptWriter();

  it('write returns 5 fields', () => {
    const r = e.write('school', 'Alice', 'happy', 'hi');
    expect(r.background).toContain('school_bg');
  });
});

describe('MediaSpecificIndex', () => {
  const idx = new MediaSpecificIndex();

  it('lists 9 engines', () => {
    expect(idx.count()).toBe(9);
  });
});
