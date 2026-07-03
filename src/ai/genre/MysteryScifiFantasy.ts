/**
 * MysteryScifiFantasy.ts — Direction Z, V3176-V3185 (Batch 2/3)
 * Genre Masters: 推理/科幻/奇幻垂直深度
 *
 * 10 engines:
 * 1.  FairPlayAuditor — 公平竞争审计（Van Dine 戒律）
 * 2.  ClueLedger — 线索账本
 * 3.  DeductionChainValidator — 推理链验证
 * 4.  LockedRoomLogic — 密室逻辑
 * 5.  RedHerringDetector — 红鲱鱼/误导检测
 * 6.  PhysicsHardnessChecker — 物理硬度检查
 * 7.  FTLConsistency — 超光速一致性
 * 8.  AIBehaviorAuditor — AI 行为审计
 * 9.  TimeParadoxValidator — 时间悖论验证
 * 10. MythologyFaithfulness — 神话忠实度
 */

// ============================================================================
// Engine 1: FairPlayAuditor (Knox/Van Dine 戒律)
// ============================================================================

export class FairPlayAuditor {
  private _rules = [
    { id: 1, text: '凶手必须在故事早期出现', check: (text: string) => /(凶手|杀手|嫌疑人|killer|murderer|suspect)/.test(text) },
    { id: 2, text: '不允许超自然解释', check: (text: string) => !/(魔法|神迹|超自然|magic|miracle|supernatural)/i.test(text) },
    { id: 3, text: '不允许密室无解', check: (text: string) => !/(不可能|impossible)/i.test(text) },
    { id: 4, text: '不允许未交代的线索', check: (text: string) => /(线索|clue|evidence)/.test(text) },
    { id: 5, text: '不允许双胞胎/替身', check: (text: string) => !/(双胞胎|替身|twin|impersonator)/i.test(text) },
  ];

  audit(text: string): { satisfied: number; total: number; violations: number[] } {
    const violations: number[] = [];
    let satisfied = 0;
    for (const rule of this._rules) {
      if (rule.check(text)) satisfied += 1;
      else violations.push(rule.id);
    }
    return { satisfied, total: this._rules.length, violations };
  }

  ruleScore(text: string): number {
    return this.audit(text).satisfied / this.audit(text).total;
  }
}

// ============================================================================
// Engine 2: ClueLedger
// ============================================================================

export interface Clue {
  id: string;
  description: string;
  introducedChapter: number;
  usedFor: string | null;
}

export class ClueLedger {
  private _clues: Clue[] = [];
  private _counter = 0;

  add(description: string, chapter: number): Clue {
    this._counter += 1;
    const c: Clue = { id: `clue_${this._counter}`, description, introducedChapter: chapter, usedFor: null };
    this._clues.push(c);
    return c;
  }

  use(clueId: string, purpose: string): boolean {
    const c = this._clues.find((x) => x.id === clueId);
    if (!c) return false;
    c.usedFor = purpose;
    return true;
  }

  getUnused(): Clue[] {
    return this._clues.filter((c) => !c.usedFor);
  }

  usageRate(): number {
    if (this._clues.length === 0) return 0;
    return this._clues.filter((c) => c.usedFor).length / this._clues.length;
  }
}

// ============================================================================
// Engine 3: DeductionChainValidator
// ============================================================================

export class DeductionChainValidator {
  private _chain: { step: string; premise: string; conclusion: string }[] = [];

  addStep(step: string, premise: string, conclusion: string): void {
    this._chain.push({ step, premise, conclusion });
  }

  isValid(): boolean {
    // Simplified: each step must reference previous conclusion
    for (let i = 1; i < this._chain.length; i++) {
      if (!this._chain[i].premise.includes(this._chain[i - 1].conclusion.slice(0, 10))) {
        return false;
      }
    }
    return true;
  }

  getChainLength(): number {
    return this._chain.length;
  }
}

// ============================================================================
// Engine 4: LockedRoomLogic
// ============================================================================

export class LockedRoomLogic {
  private _explanations = [
    'secret passage',
    'window from outside',
    'key hidden in room',
    'committed before locked',
    'unlocked from inside',
  ];

  hasValidExplanation(explanation: string): boolean {
    return this._explanations.some((e) => explanation.toLowerCase().includes(e));
  }

  isCheating(explanation: string): boolean {
    return !this.hasValidExplanation(explanation) && explanation.length > 0;
  }
}

// ============================================================================
// Engine 5: RedHerringDetector
// ============================================================================

export class RedHerringDetector {
  private _suspects: { name: string; suspicion: number; actual: boolean }[] = [];

  addSuspect(name: string, suspicion: number, isActual: boolean): void {
    this._suspects.push({ name, suspicion, actual: isActual });
  }

  findRedHerrings(): string[] {
    return this._suspects.filter((s) => !s.actual && s.suspicion > 0.5).map((s) => s.name);
  }

  isRealKillerTooObvious(threshold = 0.5): boolean {
    const real = this._suspects.find((s) => s.actual);
    return real ? real.suspicion > threshold : false;
  }
}

// ============================================================================
// Engine 6: PhysicsHardnessChecker
// ============================================================================

export class PhysicsHardnessChecker {
  private _violations: string[] = [
    '永动机', '违反能量守恒', 'perpetual motion', 'energy conservation violation',
  ];
  private _softSci = ['传送', '曲速', 'teleport', 'warp'];

  hardnessScore(text: string): number {
    const lower = text.toLowerCase();
    const violations = this._violations.filter((v) => lower.includes(v.toLowerCase())).length;
    const soft = this._softSci.filter((s) => lower.includes(s.toLowerCase())).length;
    if (soft === 0 && violations === 0) return 1.0; // pure hard sci
    return Math.max(0, 1 - soft * 0.2 - violations * 0.5);
  }

  isHardSci(text: string, threshold = 0.7): boolean {
    return this.hardnessScore(text) >= threshold;
  }
}

// ============================================================================
// Engine 7: FTLConsistency
// ============================================================================

export class FTLConsistency {
  private _ftlKeywords = ['超光速', '曲速', '跃迁', 'warp', 'FTL', 'faster than light', 'hyperspace'];
  private _limitKeywords = ['限制', '代价', '副作用', 'limit', 'cost', 'side effect'];

  isFTLUsed(text: string): boolean {
    return this._ftlKeywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));
  }

  hasLimitation(text: string): boolean {
    return this._limitKeywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));
  }

  isFTLResponsible(text: string): boolean {
    return this.isFTLUsed(text) && this.hasLimitation(text);
  }
}

// ============================================================================
// Engine 8: AIBehaviorAuditor
// ============================================================================

export class AIBehaviorAuditor {
  private _humanTraits = ['爱', '恨', '感情', '直觉', 'love', 'hate', 'emotion', 'intuition'];
  private _aiLimits = ['计算', '逻辑', '无感情', 'calculate', 'logic', 'no emotion'];

  hasHumanTraits(text: string): boolean {
    return this._humanTraits.some((k) => text.toLowerCase().includes(k.toLowerCase()));
  }

  hasAILimits(text: string): boolean {
    return this._aiLimits.some((k) => text.toLowerCase().includes(k.toLowerCase()));
  }

  isBalancedAI(text: string): boolean {
    return this.hasHumanTraits(text) && this.hasAILimits(text);
  }

  isTooHuman(aiText: string): boolean {
    return this.hasHumanTraits(aiText) && !this.hasAILimits(aiText);
  }
}

// ============================================================================
// Engine 9: TimeParadoxValidator
// ============================================================================

export class TimeParadoxValidator {
  private _paradoxKeywords = ['回到过去', '改变历史', '时间悖论', '祖父悖论', 'go back in time', 'change history', 'time paradox', 'grandfather paradox'];

  detectParadox(text: string): boolean {
    return this._paradoxKeywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));
  }

  hasResolution(text: string, resolutionKeywords = ['自洽', '多世界', '固定', 'self-consistent', 'multiverse', 'fixed']): boolean {
    return resolutionKeywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));
  }

  isResolvedParadox(text: string): boolean {
    return this.detectParadox(text) && this.hasResolution(text);
  }
}

// ============================================================================
// Engine 10: MythologyFaithfulness
// ============================================================================

export class MythologyFaithfulness {
  private _myths: Record<string, string[]> = {
    greek: ['zeus', 'athena', 'apollo', '宙斯', '雅典娜', '阿波罗'],
    norse: ['odin', 'thor', 'loki', '奥丁', '索尔', '洛基'],
    chinese: ['玉帝', '阎王', '观音', '哪吒', 'jade emperor', 'guanyin', 'nezha'],
    egyptian: ['ra', 'isis', 'anubis', '拉', '伊西斯', '阿努比斯'],
  };

  detectMythology(text: string): string | null {
    const lower = text.toLowerCase();
    for (const [myth, keywords] of Object.entries(this._myths)) {
      if (keywords.some((k) => lower.includes(k.toLowerCase()))) return myth;
    }
    return null;
  }

  hasCoreFigure(myth: string, text: string): boolean {
    const keywords = this._myths[myth] || [];
    const lower = text.toLowerCase();
    return keywords.some((k) => lower.includes(k.toLowerCase()));
  }

  isFaithful(myth: string, text: string, threshold = 0.3): boolean {
    const keywords = this._myths[myth] || [];
    if (keywords.length === 0) return false;
    const lower = text.toLowerCase();
    const matched = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
    return matched / keywords.length >= threshold;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const Z_BATCH_2_ENGINES = {
  FairPlayAuditor,
  ClueLedger,
  DeductionChainValidator,
  LockedRoomLogic,
  RedHerringDetector,
  PhysicsHardnessChecker,
  FTLConsistency,
  AIBehaviorAuditor,
  TimeParadoxValidator,
  MythologyFaithfulness,
} as const;
