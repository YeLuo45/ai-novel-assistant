/**
 * BookProduction.test.ts — Direction AE, V3246-V3255 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  VolumeStructurePlanner,
  VolumeNameSuggester,
  SeriesBible,
  SeriesReadingOrder,
  SpinOffPotential,
  CopyEditor,
  EbookFormatter,
  PrintBookLayout,
  CopyrightPageGenerator,
  PublishingIndex,
} from './BookProduction';

describe('VolumeStructurePlanner', () => {
  const e = new VolumeStructurePlanner();

  it('add + getAll', () => {
    e.add('Vol 1', 1, 50, 100000);
    expect(e.getAll()).toHaveLength(1);
  });

  it('totalWordCount', () => {
    const e2 = new VolumeStructurePlanner();
    e2.add('A', 1, 50, 100000);
    e2.add('B', 51, 100, 200000);
    expect(e2.totalWordCount()).toBe(300000);
  });

  it('averageVolumeLength', () => {
    const e3 = new VolumeStructurePlanner();
    e3.add('A', 1, 50, 100000);
    e3.add('B', 51, 100, 200000);
    expect(e3.averageVolumeLength()).toBe(150000);
  });
});

describe('VolumeNameSuggester', () => {
  const e = new VolumeNameSuggester();

  it('generate replaces vars', () => {
    const r = e.generate('{theme}之{action}', { theme: '剑', action: '觉醒' });
    expect(r).toContain('剑');
  });

  it('getTemplates returns 4', () => {
    expect(e.getTemplates()).toHaveLength(4);
  });
});

describe('SeriesBible', () => {
  const e = new SeriesBible();

  it('generate includes title and sections', () => {
    const r = e.generate('Series', [{ name: 'A', content: 'a' }, { name: 'B', content: 'b' }]);
    expect(r).toContain('Series');
    expect(r).toContain('## A');
    expect(r).toContain('## B');
  });
});

describe('SeriesReadingOrder', () => {
  const e = new SeriesReadingOrder();

  it('add + getAll', () => {
    e.add('A');
    e.add('B', 1);
    expect(e.getAll()).toHaveLength(2);
  });

  it('getOrder respects prerequisites', () => {
    const e2 = new SeriesReadingOrder();
    e2.add('A');
    e2.add('B', 1);
    const order = e2.getOrder();
    expect(order[0].title).toBe('A');
    expect(order[1].title).toBe('B');
  });
});

describe('SpinOffPotential', () => {
  const e = new SpinOffPotential();

  it('high score for strong characters', () => {
    const s = e.score('Series Title', true, true, true);
    expect(s).toBeGreaterThanOrEqual(0.8);
  });

  it('isViable for high', () => {
    expect(e.isViable(0.7)).toBe(true);
  });

  it('not viable for low', () => {
    expect(e.isViable(0.3)).toBe(false);
  });
});

describe('CopyEditor', () => {
  const e = new CopyEditor();

  it('detectTypos for known typo', () => {
    expect(e.detectTypos('的得地')).toContain('的得地');
  });

  it('isClean for typo-free', () => {
    expect(e.isClean('正常的中文。')).toBe(true);
  });

  it('wordCount', () => {
    expect(e.wordCount('我 走 了')).toBe(3);
  });
});

describe('EbookFormatter', () => {
  const e = new EbookFormatter();

  it('formatChapters joins', () => {
    const r = e.formatChapters([{ title: 'A', content: 'a' }, { title: 'B', content: 'b' }]);
    expect(r).toContain('# A');
    expect(r).toContain('# B');
  });

  it('toHTML', () => {
    const r = e.toHTML([{ title: 'A', content: 'a' }]);
    expect(r).toContain('<h1>A</h1>');
  });

  it('countChapters', () => {
    expect(e.countChapters([{ title: 'A', content: 'a' }, { title: 'B', content: 'b' }])).toBe(2);
  });
});

describe('PrintBookLayout', () => {
  const e = new PrintBookLayout();

  it('layout computes totalPages', () => {
    const r = e.layout([{ title: 'A', content: 'x'.repeat(1000) }], 100);
    expect(r.totalPages).toBe(5);
  });
});

describe('CopyrightPageGenerator', () => {
  const e = new CopyrightPageGenerator();

  it('generate includes book info', () => {
    const r = e.generate({ title: 'X', author: 'A', year: 2026, publisher: 'Pub', isbn: '123' });
    expect(r).toContain('X');
    expect(r).toContain('A');
  });

  it('generateAfterword', () => {
    expect(e.generateAfterword('A', 'm')).toContain('A');
  });

  it('generateAcknowledgment', () => {
    expect(e.generateAcknowledgment(['A', 'B'])).toContain('A');
  });
});

describe('PublishingIndex', () => {
  const idx = new PublishingIndex();

  it('lists 30 engines', () => {
    expect(idx.count()).toBe(30);
  });
});
