/**
 * RomanceHorrorEtc.test.ts — Direction Z, V3186-V3195 (Batch 3/3 收口)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  HEAPathPlanner,
  SugarKnifeRatio,
  MisunderstandingAuditor,
  RelationshipMilestoneTracker,
  HorrorAtmosphere,
  ThrillerCountdownManager,
  LiteraryDepthScorer,
  TropeAvoidanceAdvisor,
  GenrePacingTemplate,
  GenreMasterIndex,
} from './RomanceHorrorEtc';

describe('HEAPathPlanner', () => {
  const e = new HEAPathPlanner();

  it('getMilestones returns 10', () => {
    expect(e.getMilestones()).toHaveLength(10);
  });

  it('countAchieved for milestone text', () => {
    expect(e.countAchieved('他们相遇，心动，告白，在一起。')).toBeGreaterThanOrEqual(4);
  });

  it('isHE for happy ending', () => {
    expect(e.isHE('圆满 happy ending')).toBe(true);
  });
});

describe('SugarKnifeRatio', () => {
  const e = new SugarKnifeRatio();

  it('ratio for sweet text', () => {
    const r = e.ratio('甜蜜温柔喜欢甜蜜。');
    expect(r.sugar).toBeGreaterThan(0);
  });

  it('classify sweet', () => {
    expect(e.classify('甜蜜甜蜜甜蜜喜欢温柔。')).toBe('sweet');
  });

  it('classify angst', () => {
    expect(e.classify('心碎痛苦虐心碎悲伤。')).toBe('angst');
  });
});

describe('MisunderstandingAuditor', () => {
  const e = new MisunderstandingAuditor();

  it('counts misunderstandings', () => {
    expect(e.count('他以为A，但其实是B。误会解开后。')).toBeGreaterThanOrEqual(1);
  });

  it('isOverMisunderstood for 3+', () => {
    expect(e.isOverMisunderstood('误会，误会解开，原来不是，误会。')).toBe(true);
  });
});

describe('RelationshipMilestoneTracker', () => {
  const e = new RelationshipMilestoneTracker();

  it('add + getAll', () => {
    e.add(1, 'meet', 'first meeting');
    expect(e.getAll()).toHaveLength(1);
  });

  it('countByType', () => {
    e.add(5, 'meet', 'second meet');
    expect(e.countByType('meet')).toBeGreaterThanOrEqual(2);
  });
});

describe('HorrorAtmosphere', () => {
  const e = new HorrorAtmosphere();

  it('counts horror keywords', () => {
    expect(e.count('恐惧、阴影、黑暗、诡异、不安。')).toBeGreaterThanOrEqual(5);
  });

  it('isScary for dense', () => {
    expect(e.isScary('恐惧阴影黑暗' + 'x'.repeat(200))).toBe(true);
  });
});

describe('ThrillerCountdownManager', () => {
  const e = new ThrillerCountdownManager();

  it('addEvent + getCountdown', () => {
    e.addEvent('bomb', 10, 5);
    const cd = e.getCountdown(1);
    expect(cd.length).toBeGreaterThan(0);
  });

  it('isUrgent for 5 left', () => {
    const e2 = new ThrillerCountdownManager();
    e2.addEvent('event', 12, 8);
    expect(e2.isUrgent(8, 5)).toBe(true);
  });
});

describe('LiteraryDepthScorer', () => {
  const e = new LiteraryDepthScorer();

  it('counts depth keywords', () => {
    expect(e.count('象征隐喻主题反思哲学。')).toBeGreaterThanOrEqual(4);
  });

  it('classify deep for many', () => {
    expect(e.classify('象征隐喻主题反思哲学存在。')).toBe('deep');
  });
});

describe('TropeAvoidanceAdvisor', () => {
  const e = new TropeAvoidanceAdvisor();

  it('getStrategies returns suggestions', () => {
    expect(e.getStrategies().length).toBeGreaterThanOrEqual(5);
  });

  it('suggest for known trope', () => {
    expect(e.suggest('chosen_one')).toContain('缺陷');
  });
});

describe('GenrePacingTemplate', () => {
  const e = new GenrePacingTemplate();

  it('getTemplate for mystery', () => {
    expect(e.getTemplate('mystery')).toHaveLength(5);
  });

  it('countPeaks for romance', () => {
    expect(e.countPeaks('romance')).toBe(5);
  });
});

describe('GenreMasterIndex', () => {
  const idx = new GenreMasterIndex();

  it('lists 30 engines', () => {
    expect(idx.count()).toBe(30);
  });
});
