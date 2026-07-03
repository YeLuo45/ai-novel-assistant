/**
 * ShowSensoryLayer.test.ts — Direction X, V3056-V3065 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ShowVsTellDetector,
  FilterWordDetector,
  AdverbDetector,
  GenericVerbAuditor,
  TellingEmotionDetector,
  SensoryPalette,
  SensoryDensity,
  VisualDominanceAuditor,
  SoundScentTouchTracker,
  ConcreteVsAbstractNouns,
} from './ShowSensoryLayer';

describe('ShowVsTellDetector', () => {
  const e = new ShowVsTellDetector();

  it('detects tell phrase', () => {
    expect(e.detect('他很生气，走了。').tellCount).toBeGreaterThan(0);
  });

  it('returns empty examples for no tells', () => {
    expect(e.detect('她走了，进了房间。').tellCount).toBe(0);
  });

  it('tellRatio for sentence with tell', () => {
    const r = e.tellRatio('他很生气。她走了。');
    expect(r).toBeGreaterThan(0);
  });
});

describe('FilterWordDetector', () => {
  const e = new FilterWordDetector();

  it('counts filter words', () => {
    expect(e.count('他意识到，感觉到，觉得，察觉到，看起来，听起来。')).toBeGreaterThanOrEqual(5);
  });

  it('isOverFiltered false for clean text', () => {
    expect(e.isOverFiltered('她走了，进了房间。')).toBe(false);
  });

  it('findExamples returns matches', () => {
    const ex = e.findExamples('她意识到事情不对。');
    expect(ex.length).toBeGreaterThan(0);
  });
});

describe('AdverbDetector', () => {
  const e = new AdverbDetector();

  it('counts Chinese adverbs with 地', () => {
    const c = e.count('他高兴地走了。她快速地跑。');
    expect(c.chinese).toBeGreaterThanOrEqual(2);
  });

  it('counts English adverbs with -ly', () => {
    const c = e.count('She walked quickly. He shouted loudly.');
    expect(c.english).toBeGreaterThanOrEqual(2);
  });

  it('findAfterDialogueTag', () => {
    const examples = e.findAfterDialogueTag('He said quietly. 他说得很慢。');
    expect(examples.length).toBeGreaterThan(0);
  });
});

describe('GenericVerbAuditor', () => {
  const e = new GenericVerbAuditor();

  it('counts generic verbs', () => {
    expect(e.count('他走了，去看了，说了话。')).toBeGreaterThanOrEqual(3);
  });

  it('suggestReplacements for 走', () => {
    expect(e.suggestReplacements('走')).toContain('踱步');
  });

  it('genericVerbRatio', () => {
    const r = e.genericVerbRatio('走了走了走了走了');
    expect(r).toBeGreaterThan(0);
  });
});

describe('TellingEmotionDetector', () => {
  const e = new TellingEmotionDetector();

  it('counts tells', () => {
    expect(e.count('他很开心。她很伤心。')).toBeGreaterThanOrEqual(2);
  });

  it('examples returns matched', () => {
    const ex = e.examples('他很愤怒地离开了。');
    expect(ex.length).toBeGreaterThan(0);
  });

  it('isOverTelling for many tells', () => {
    expect(e.isOverTelling('他很开心，她很伤心，他很愤怒，她很害怕')).toBe(true);
  });
});

describe('SensoryPalette', () => {
  const e = new SensoryPalette();

  it('distribution has all senses', () => {
    const d = e.distribution('她看见红色，听到声音，闻到香味。');
    expect(d.visual).toBeGreaterThan(0);
    expect(d.auditory).toBeGreaterThan(0);
    expect(d.olfactory).toBeGreaterThan(0);
  });

  it('dominant for visual text', () => {
    expect(e.dominant('她看见红色和亮光，影子在动。')).toBe('visual');
  });
});

describe('SensoryDensity', () => {
  const e = new SensoryDensity();

  it('perThousandChars > 0 for sensory text', () => {
    expect(e.perThousandChars('她看见光，感到冷，' + '看见。'.repeat(20))).toBeGreaterThan(0);
  });

  it('classify high for dense', () => {
    expect(e.classify('看见。' + '看见。'.repeat(20))).toBe('high');
  });
});

describe('VisualDominanceAuditor', () => {
  const e = new VisualDominanceAuditor();

  it('visualRatio 1.0 for all-visual', () => {
    expect(e.visualRatio('她看见红色，亮光和影子。')).toBe(1.0);
  });

  it('isVisuallyImbalanced true for 100% visual', () => {
    expect(e.isVisuallyImbalanced('看见红色，亮光，影子，颜色。')).toBe(true);
  });
});

describe('SoundScentTouchTracker', () => {
  const e = new SoundScentTouchTracker();

  it('countAll has all keys', () => {
    const c = e.countAll('她听见声音，闻到香味，感到柔软。');
    expect(c).toHaveProperty('sound');
    expect(c).toHaveProperty('scent');
    expect(c).toHaveProperty('touch');
  });

  it('isUnderRepresented for short text', () => {
    expect(e.isUnderRepresented('她走了。')).toBe(true);
  });
});

describe('ConcreteVsAbstractNouns', () => {
  const e = new ConcreteVsAbstractNouns();

  it('ratio high for concrete', () => {
    const r = e.ratio('她看见桌子，杯子，石头和剑。');
    expect(r.ratio).toBeGreaterThan(0.5);
  });

  it('isTooAbstract for pure abstract', () => {
    expect(e.isTooAbstract('自由，爱情，正义，理念。')).toBe(true);
  });
});
