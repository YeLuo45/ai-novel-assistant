/**
 * PolityEconomy.ts — Direction AA, V3116-V3125 (Batch 2/3)
 * Worldbuilding Coherence: 政治经济/法律教育/军事/文化/社会
 *
 * 10 engines:
 * 1.  PoliticalSystem — 政治体系
 * 2.  EconomicBalance — 经济平衡
 * 3.  LawSystemAuditor — 法律审计
 * 4.  EducationKnowledge — 教育/知识
 * 5.  MilitaryWarLogic — 军事/战争逻辑
 * 6.  CustomsCulture — 习俗/文化
 * 7.  FoodAgriculture — 食物/农业
 * 8.  ClothingStyle — 服装/风格
 * 9.  SocialHierarchy — 社会阶层
 * 10. PropTracker — 道具流转追踪
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: PoliticalSystem
// ============================================================================

export type Government = 'monarchy' | 'democracy' | 'theocracy' | 'oligarchy' | 'anarchy' | 'empire';

export class PoliticalSystem {
  private _govKeywords: Record<Government, string[]> = {
    monarchy: ['国王', '王后', '皇室', 'king', 'queen', 'royal'],
    democracy: ['议会', '投票', '选举', 'parliament', 'vote', 'election'],
    theocracy: ['教皇', '大主教', '圣殿', 'pope', 'high priest', 'temple'],
    oligarchy: ['长老', '贵族', '议会', 'elder', 'noble', 'council'],
    anarchy: ['无政府', '混乱', 'anarchy', 'chaos', 'no ruler'],
    empire: ['皇帝', '帝国', '皇朝', 'emperor', 'empire', 'imperial'],
  };

  detect(text: string): Government {
    const lower = text.toLowerCase();
    let best: Government = 'monarchy';
    let bestCount = 0;
    for (const [gov, keywords] of Object.entries(this._govKeywords)) {
      const count = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
      if (count > bestCount) {
        bestCount = count;
        best = gov as Government;
      }
    }
    return best;
  }

  isStable(government: Government): boolean {
    return government !== 'anarchy';
  }
}

// ============================================================================
// Engine 2: EconomicBalance
// ============================================================================

export class EconomicBalance {
  private _currencyKeywords = ['金币', '银币', '铜币', '元宝', 'gold', 'silver', 'coin', 'money'];
  private _tradeKeywords = ['交易', '买卖', '商人', '市场', 'trade', 'merchant', 'market', 'shop'];

  countMentions(text: string): { currency: number; trade: number } {
    const lower = text.toLowerCase();
    const currency = this._currencyKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const trade = this._tradeKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    return { currency, trade };
  }

  hasEconomy(text: string, threshold = 1): boolean {
    const c = this.countMentions(text);
    return c.currency + c.trade >= threshold;
  }
}

// ============================================================================
// Engine 3: LawSystemAuditor
// ============================================================================

export class LawSystemAuditor {
  private _lawKeywords = ['法', '律', '禁止', '允许', '刑罚', '法官', 'law', 'rule', 'forbidden', 'permitted', 'punishment', 'judge'];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._lawKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  hasLawSystem(text: string, threshold = 2): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 4: EducationKnowledge
// ============================================================================

export class EducationKnowledge {
  private _educationKeywords = ['学校', '学院', '老师', '学生', '知识', '学习', 'school', 'academy', 'teacher', 'student', 'knowledge', 'learn'];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._educationKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  hasEducation(text: string, threshold = 2): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 5: MilitaryWarLogic
// ============================================================================

export class MilitaryWarLogic {
  private _militaryKeywords = ['军', '士兵', '将军', '战争', '战役', 'army', 'soldier', 'general', 'war', 'battle'];

  countMentions(text: string): number {
    const lower = text.toLowerCase();
    return this._militaryKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  isWarFocused(text: string, threshold = 3): boolean {
    return this.countMentions(text) >= threshold;
  }
}

// ============================================================================
// Engine 6: CustomsCulture
// ============================================================================

export class CustomsCulture {
  private _customKeywords = ['习俗', '传统', '节日', '祭祀', '婚礼', '葬礼', 'custom', 'tradition', 'festival', 'ritual', 'wedding', 'funeral'];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._customKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  isCulturallyRich(text: string, threshold = 2): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 7: FoodAgriculture
// ============================================================================

export class FoodAgriculture {
  private _foodKeywords = ['米', '面', '肉', '鱼', '蔬菜', '酒', '茶', 'rice', 'noodle', 'meat', 'fish', 'vegetable', 'wine', 'tea'];

  countUnique(text: string): string[] {
    const found = new Set<string>();
    for (const f of this._foodKeywords) {
      if (text.includes(f)) found.add(f);
    }
    return Array.from(found);
  }

  isDiverse(text: string, threshold = 3): boolean {
    return this.countUnique(text).length >= threshold;
  }
}

// ============================================================================
// Engine 8: ClothingStyle
// ============================================================================

export class ClothingStyle {
  private _clothingKeywords = ['衣', '袍', '裙', '甲', '帽', '鞋', '袍', 'clothes', 'robe', 'dress', 'armor', 'hat', 'shoe'];

  countMentions(text: string): number {
    return this._clothingKeywords.filter((k) => text.includes(k)).length;
  }

  hasDistinctCostume(text: string, threshold = 2): boolean {
    return this.countMentions(text) >= threshold;
  }

  periodConsistency(text: string, era: 'ancient' | 'modern' | 'future'): boolean {
    const ancient = ['袍', '甲', '衣'];
    const modern = ['西装', '衬衫', '裤子'];
    const future = ['太空服', '全息', 'holo'];
    const lower = text.toLowerCase();
    if (era === 'ancient') return ancient.some((k) => text.includes(k));
    if (era === 'modern') return modern.some((k) => text.includes(k)) || !ancient.some((k) => text.includes(k));
    if (era === 'future') return future.some((k) => lower.includes(k.toLowerCase()));
    return true;
  }
}

// ============================================================================
// Engine 9: SocialHierarchy
// ============================================================================

export class SocialHierarchy {
  private _hierarchyKeywords = ['皇帝', '贵族', '平民', '奴隶', 'emperor', 'noble', 'commoner', 'slave', 'peasant'];

  countMentions(text: string): number {
    const lower = text.toLowerCase();
    return this._hierarchyKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  hasHierarchy(text: string, threshold = 2): boolean {
    return this.countMentions(text) >= threshold;
  }
}

// ============================================================================
// Engine 10: PropTracker
// ============================================================================

export interface Prop {
  id: string;
  name: string;
  introducedChapter: number;
  lastChapter: number;
  status: 'active' | 'lost' | 'destroyed' | 'stored';
}

export class PropTracker {
  private _props = new Map<string, Prop>();
  private _counter = 0;

  introduce(name: string, chapter: number): Prop {
    this._counter += 1;
    const p: Prop = { id: `p_${this._counter}`, name, introducedChapter: chapter, lastChapter: chapter, status: 'active' };
    this._props.set(name, p);
    return p;
  }

  use(name: string, chapter: number): boolean {
    const p = this._props.get(name);
    if (!p) return false;
    p.lastChapter = chapter;
    return true;
  }

  destroy(name: string): boolean {
    const p = this._props.get(name);
    if (!p) return false;
    p.status = 'destroyed';
    return true;
  }

  getActive(): Prop[] {
    return Array.from(this._props.values()).filter((p) => p.status === 'active');
  }

  getAll(): Prop[] {
    return Array.from(this._props.values());
  }

  findLost(threshold = 20): Prop[] {
    return Array.from(this._props.values()).filter((p) => p.status === 'active' && p.lastChapter < threshold);
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AA_BATCH_2_ENGINES = {
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
} as const;
