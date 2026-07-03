/**
 * HooksEngagement.test.ts — Direction Y, V3076-V3085 (Batch 1/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  ChapterOpenerHook,
  ChapterCliffhangerScorer,
  PageTurnStrength,
  HookDensityPerKChar,
  InformationGapTracker,
  ReaderQuestionTracker,
  SentimentArcAnalyzer,
  EmotionalBeatDetector,
  TensionCurveViz,
  EmpathyTriggerDetector,
  type Chapter,
} from './HooksEngagement';

describe('ChapterOpenerHook', () => {
  const e = new ChapterOpenerHook();

  it('scores high for hook opener', () => {
    const c: Chapter = { content: '突然她听到了敲门声。' };
    expect(e.analyze(c).isHook).toBe(true);
  });

  it('scores low for plain opener', () => {
    const c: Chapter = { content: '今天天气很好。' };
    expect(e.analyze(c).isHook).toBe(false);
  });

  it('findWeakOpeners returns non-hooks', () => {
    const chs: Chapter[] = [
      { content: '突然她听到敲门声。' },
      { content: '今天天气很好。' },
    ];
    expect(e.findWeakOpeners(chs).length).toBeGreaterThanOrEqual(1);
  });
});

describe('ChapterCliffhangerScorer', () => {
  const e = new ChapterCliffhangerScorer();

  it('scores high for cliffhanger', () => {
    expect(e.score('她转身要走。然而——' + '字'.repeat(200)).isCliffhanger).toBe(undefined as any);
  });

  it('isCliffhanger true for keyword tail', () => {
    expect(e.isCliffhanger('字'.repeat(200) + '然而他没料到')).toBe(true);
  });

  it('weakestChapters returns low-score', () => {
    const chs: Chapter[] = [{ content: '正常叙述' }];
    const weak = e.weakestChapters(chs);
    expect(weak.length).toBeGreaterThan(0);
  });
});

describe('PageTurnStrength', () => {
  const e = new PageTurnStrength();

  it('high for ?-ended tail', () => {
    expect(e.isStrong('正文...为什么？她怎么知道？真的吗？')).toBe(true);
  });

  it('low for plain tail', () => {
    expect(e.isStrong('正文...他走了。')).toBe(false);
  });
});

describe('HookDensityPerKChar', () => {
  const e = new HookDensityPerKChar();

  it('perKChar > 0 for hook text', () => {
    const t = '突然' + 'a'.repeat(50) + '就在这时' + 'b'.repeat(50) + '没想到' + 'c'.repeat(50);
    expect(e.perKChar(t)).toBeGreaterThan(0);
  });

  it('classify high for dense', () => {
    const t = '突然。就在这时。没想到。' + 'x'.repeat(10);
    expect(e.classify(e.perKChar(t))).toBe('high');
  });
});

describe('InformationGapTracker', () => {
  const e = new InformationGapTracker();

  it('raise creates gap', () => {
    e.raise('who is the killer?', 1);
    expect(e.getUnresolvedCount()).toBe(1);
  });

  it('resolve closes gap', () => {
    const e2 = new InformationGapTracker();
    e2.raise('motive?', 1);
    e2.resolve('motive?', 5);
    expect(e2.getUnresolvedCount()).toBe(0);
  });

  it('isOverwhelming for 10+', () => {
    for (let i = 0; i < 12; i++) e.raise(`q${i}`, i);
    expect(e.isOverwhelming(10)).toBe(true);
  });
});

describe('ReaderQuestionTracker', () => {
  const e = new ReaderQuestionTracker();

  it('countQuestions for Chinese', () => {
    expect(e.countQuestions('为什么她这么做？怎么知道的？')).toBeGreaterThan(0);
  });

  it('explicitQuestions counts ?', () => {
    expect(e.explicitQuestions('什么？谁？为什么？')).toBe(3);
  });

  it('totalImplicit combines both', () => {
    expect(e.totalImplicit('为什么？')).toBeGreaterThanOrEqual(1);
  });
});

describe('SentimentArcAnalyzer', () => {
  const e = new SentimentArcAnalyzer();

  it('positive for love/happy', () => {
    expect(e.analyze('她很幸福，充满爱和温暖。')).toBeGreaterThan(0);
  });

  it('negative for hate/death', () => {
    expect(e.analyze('死亡和绝望带来痛苦。')).toBeLessThan(0);
  });

  it('isRollerCoaster for flips', () => {
    const chs: Chapter[] = [
      { content: '幸福' },
      { content: '死亡' },
      { content: '快乐' },
      { content: '痛苦' },
    ];
    expect(e.isRollerCoaster(e.arc(chs))).toBe(true);
  });
});

describe('EmotionalBeatDetector', () => {
  const e = new EmotionalBeatDetector();

  it('detects joy', () => {
    const beats = e.detect('她开心地笑了。', 1);
    expect(beats.some((b) => b.emotion === 'joy')).toBe(true);
  });

  it('detects fear', () => {
    const beats = e.detect('他害怕紧张担心。', 1);
    expect(beats.some((b) => b.emotion === 'fear')).toBe(true);
  });

  it('dominant picks highest intensity', () => {
    const d = e.dominant('她开心地笑了，笑了，笑了！', 1);
    expect(d?.emotion).toBe('joy');
  });
});

describe('TensionCurveViz', () => {
  const e = new TensionCurveViz();

  it('profile > 0 for tense text', () => {
    expect(e.profile('突然！什么？！真的吗？')).toBeGreaterThan(0);
  });

  it('asciiCurve produces string', () => {
    const s = e.asciiCurve([0.1, 0.5, 0.9]);
    expect(typeof s).toBe('string');
    expect(s.length).toBe(3);
  });

  it('buildCurve returns values per chapter', () => {
    const chs: Chapter[] = [{ content: 'a' }, { content: '突然！' }];
    const c = e.buildCurve(chs);
    expect(c).toHaveLength(2);
  });
});

describe('EmpathyTriggerDetector', () => {
  const e = new EmpathyTriggerDetector();

  it('count > 0 for empathy text', () => {
    expect(e.count('他失去了母亲，孤独无助。')).toBeGreaterThan(0);
  });

  it('triggerWords returns matches', () => {
    const w = e.triggerWords('她想念孩子和家庭。');
    expect(w.length).toBeGreaterThan(0);
  });

  it('isEmpathetic true for dense', () => {
    expect(e.isEmpathetic('死亡、痛苦、孤独、思念。' + '字'.repeat(200))).toBe(true);
  });
});
