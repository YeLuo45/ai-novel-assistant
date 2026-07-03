/**
 * PolityEconomy.test.ts — Direction AA, V3116-V3125 (Batch 2/3)
 * 10 engines × 3+ assertions = 30+ assertions
 */

import { describe, it, expect } from 'vitest';
import {
  PoliticalSystem,
  EconomicBalance,
  LawSystemAuditor,
  EducationKnowledge,
  MilitaryWarLogic,
  CustomsCulture,
  FoodAgriculture,
  ClothingStyle,
  SocialHierarchy,
  PropTracker,
} from './PolityEconomy';

describe('PoliticalSystem', () => {
  const e = new PoliticalSystem();

  it('detects monarchy', () => {
    expect(e.detect('国王和王后统治着王国。')).toBe('monarchy');
  });

  it('detects empire', () => {
    expect(e.detect('皇帝和皇朝统治帝国。')).toBe('empire');
  });

  it('isStable false for anarchy', () => {
    expect(e.isStable('anarchy')).toBe(false);
  });
});

describe('EconomicBalance', () => {
  const e = new EconomicBalance();

  it('counts currency + trade', () => {
    const c = e.countMentions('他在市场用金币买酒，商人做了交易。');
    expect(c.currency).toBeGreaterThan(0);
    expect(c.trade).toBeGreaterThan(0);
  });

  it('hasEconomy true for any', () => {
    expect(e.hasEconomy('金币闪闪发光。')).toBe(true);
  });
});

describe('LawSystemAuditor', () => {
  const e = new LawSystemAuditor();

  it('counts law keywords', () => {
    expect(e.count('法官和法律禁止某些行为。')).toBeGreaterThanOrEqual(3);
  });

  it('hasLawSystem for 2+', () => {
    expect(e.hasLawSystem('法和律。')).toBe(true);
  });
});

describe('EducationKnowledge', () => {
  const e = new EducationKnowledge();

  it('counts education', () => {
    expect(e.count('学院里老师教学生学习知识。')).toBeGreaterThanOrEqual(4);
  });

  it('hasEducation for 2+', () => {
    expect(e.hasEducation('学校老师。')).toBe(true);
  });
});

describe('MilitaryWarLogic', () => {
  const e = new MilitaryWarLogic();

  it('counts military', () => {
    expect(e.countMentions('将军和士兵参与战争战役。')).toBeGreaterThanOrEqual(4);
  });

  it('isWarFocused for 3+', () => {
    expect(e.isWarFocused('军、士兵、将军。')).toBe(true);
  });
});

describe('CustomsCulture', () => {
  const e = new CustomsCulture();

  it('counts customs', () => {
    expect(e.count('传统习俗包括婚礼和葬礼。')).toBeGreaterThanOrEqual(4);
  });

  it('isCulturallyRich for 2+', () => {
    expect(e.isCulturallyRich('节日和祭祀。')).toBe(true);
  });
});

describe('FoodAgriculture', () => {
  const e = new FoodAgriculture();

  it('countUnique detects multiple', () => {
    const u = e.countUnique('米，面，肉，鱼。');
    expect(u.length).toBeGreaterThanOrEqual(4);
  });

  it('isDiverse for 3+', () => {
    expect(e.isDiverse('米，面，肉。')).toBe(true);
  });
});

describe('ClothingStyle', () => {
  const e = new ClothingStyle();

  it('countMentions', () => {
    expect(e.countMentions('他穿袍子和帽。')).toBeGreaterThanOrEqual(2);
  });

  it('hasDistinctCostume for 2+', () => {
    expect(e.hasDistinctCostume('袍和甲。')).toBe(true);
  });

  it('periodConsistency ancient', () => {
    expect(e.periodConsistency('他穿袍子。', 'ancient')).toBe(true);
  });
});

describe('SocialHierarchy', () => {
  const e = new SocialHierarchy();

  it('counts hierarchy', () => {
    expect(e.countMentions('皇帝、贵族、平民、奴隶。')).toBeGreaterThanOrEqual(3);
  });

  it('hasHierarchy for 2+', () => {
    expect(e.hasHierarchy('皇帝和贵族。')).toBe(true);
  });
});

describe('PropTracker', () => {
  const e = new PropTracker();

  it('introduce + use', () => {
    e.introduce('sword', 1);
    e.use('sword', 5);
    const p = e.getAll()[0];
    expect(p.lastChapter).toBe(5);
  });

  it('destroy changes status', () => {
    const e2 = new PropTracker();
    e2.introduce('ring', 1);
    e2.destroy('ring');
    expect(e2.getAll()[0].status).toBe('destroyed');
  });

  it('findLost for 20+ chapters ago', () => {
    const e3 = new PropTracker();
    e3.introduce('amulet', 1);
    expect(e3.findLost(20).length).toBe(1);
  });

  it('getActive filters destroyed', () => {
    const e4 = new PropTracker();
    e4.introduce('a', 1);
    e4.introduce('b', 1);
    e4.destroy('a');
    expect(e4.getActive().length).toBe(1);
  });
});
