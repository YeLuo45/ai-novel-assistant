/**
 * RomanceHorrorEtc.ts — Direction Z, V3186-V3195 (Batch 3/3 收口)
 * Genre Masters: 言情/恐怖/文学 + 跨类型 + 收口
 *
 * 10 engines:
 * 1.  HEAPathPlanner — HE/HEA 路径规划
 * 2.  SugarKnifeRatio — 糖刀比例
 * 3.  MisunderstandingAuditor — 误会审计
 * 4.  RelationshipMilestoneTracker — 关系里程碑
 * 5.  HorrorAtmosphere — 恐怖氛围
 * 6.  ThrillerCountdownManager — 惊悚倒计时
 * 7.  LiteraryDepthScorer — 文学深度评分
 * 8.  TropeAvoidanceAdvisor — 套路规避建议
 * 9.  GenrePacingTemplate — 类型节奏模板
 * 10. GenreMasterIndex — 30 engines 收口
 */

// ============================================================================
// Engine 1: HEAPathPlanner
// ============================================================================

export class HEAPathPlanner {
  private _milestones: string[] = [
    '相遇', '相识', '心动', '暧昧', '告白', '在一起', '误会', '危机', '解决', '圆满',
  ];

  getMilestones(): string[] {
    return [...this._milestones];
  }

  countAchieved(text: string): number {
    return this._milestones.filter((m) => text.includes(m)).length;
  }

  isHE(ending: string): boolean {
    return /(圆满|在一起|happy ending|HE|happy)/i.test(ending);
  }

  isHEA(ending: string): boolean {
    return this.isHE(ending) && /(forever|永远|forever after)/i.test(ending);
  }
}

// ============================================================================
// Engine 2: SugarKnifeRatio
// ============================================================================

export class SugarKnifeRatio {
  private _sugarKeywords = ['甜蜜', '心动', '温柔', '喜欢', 'sweet', 'tender', 'affection'];
  private _knifeKeywords = ['心碎', '痛苦', '虐', '悲伤', 'heartbreak', 'pain', 'agony'];

  ratio(text: string): { sugar: number; knife: number; balance: number } {
    const lower = text.toLowerCase();
    const s = this._sugarKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const k = this._knifeKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const total = s + k;
    return { sugar: s, knife: k, balance: total === 0 ? 0.5 : s / total };
  }

  isBalanced(text: string, threshold = 0.7): boolean {
    const b = this.ratio(text).balance;
    return b < threshold && b > 1 - threshold;
  }

  classify(text: string): 'sweet' | 'angst' | 'balanced' {
    const r = this.ratio(text);
    if (r.sugar > r.knife * 3) return 'sweet';
    if (r.knife > r.sugar * 3) return 'angst';
    return 'balanced';
  }
}

// ============================================================================
// Engine 3: MisunderstandingAuditor
// ============================================================================

export class MisunderstandingAuditor {
  private _patterns = [
    /他以为[^，。]*，但实际/g,
    /她以为[^，。]*，但其实/g,
    /误会/g,
    /误会解开/g,
    /原来是[^，。]*，不是/g,
  ];

  count(text: string): number {
    let count = 0;
    for (const p of this._patterns) {
      const m = text.match(p);
      if (m) count += m.length;
    }
    return count;
  }

  isOverMisunderstood(text: string, threshold = 3): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 4: RelationshipMilestoneTracker
// ============================================================================

export class RelationshipMilestoneTracker {
  private _milestones: { chapter: number; type: string; description: string }[] = [];

  add(chapter: number, type: string, description: string): void {
    this._milestones.push({ chapter, type, description });
  }

  getAll(): { chapter: number; type: string; description: string }[] {
    return [...this._milestones];
  }

  countByType(type: string): number {
    return this._milestones.filter((m) => m.type === type).length;
  }

  progressionRate(): number {
    // Heuristic: completed milestones
    const total = 10;
    return Math.min(1, this._milestones.length / total);
  }
}

// ============================================================================
// Engine 5: HorrorAtmosphere
// ============================================================================

export class HorrorAtmosphere {
  private _horrorKeywords = ['恐惧', '阴影', '黑暗', '诡异', '不安', '骷髅', '血', 'fear', 'shadow', 'darkness', 'eerie', 'unease', 'skull', 'blood'];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._horrorKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  density(text: string): number {
    if (text.length === 0) return 0;
    return this.count(text) / text.length;
  }

  isScary(text: string, threshold = 0.005): boolean {
    return this.density(text) > threshold;
  }
}

// ============================================================================
// Engine 6: ThrillerCountdownManager
// ============================================================================

export class ThrillerCountdownManager {
  private _events: { name: string; time: number; chapter: number }[] = [];

  addEvent(name: string, time: number, chapter: number): void {
    this._events.push({ name, time, chapter });
  }

  getCountdown(currentChapter: number): { name: string; remainingTime: number }[] {
    return this._events
      .filter((e) => e.chapter >= currentChapter)
      .map((e) => ({ name: e.name, remainingTime: Math.max(0, e.time - currentChapter) }))
      .sort((a, b) => a.remainingTime - b.remainingTime);
  }

  isUrgent(currentChapter: number, threshold = 5): boolean {
    const cd = this.getCountdown(currentChapter);
    return cd.some((c) => c.remainingTime <= threshold);
  }
}

// ============================================================================
// Engine 7: LiteraryDepthScorer
// ============================================================================

export class LiteraryDepthScorer {
  private _depthKeywords = ['象征', '隐喻', '主题', '反思', '哲学', '存在', 'symptom', 'metaphor', 'theme', 'reflection', 'philosophy', 'existence'];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._depthKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  score(text: string): number {
    if (text.length === 0) return 0;
    return Math.min(1, this.count(text) / 3);
  }

  classify(text: string): 'shallow' | 'moderate' | 'deep' {
    const s = this.score(text);
    if (s < 0.2) return 'shallow';
    if (s < 0.5) return 'moderate';
    return 'deep';
  }
}

// ============================================================================
// Engine 8: TropeAvoidanceAdvisor
// ============================================================================

export interface TropeSuggestion {
  trope: string;
  avoidanceStrategy: string;
}

export class TropeAvoidanceAdvisor {
  private _tropes: Record<string, string> = {
    'love_triangle': '给出独特动机，让 3 个角色都有合理理由',
    'chosen_one': '让主角有独特缺陷或代价',
    'damsel_in_distress': '让女主有自救能力',
    'instant_love': '延长时间线，让感情逐步发展',
    'villain_monologue': '反派有独立目标，行动快速',
  };

  getStrategies(): TropeSuggestion[] {
    return Object.entries(this._tropes).map(([trope, avoidanceStrategy]) => ({ trope, avoidanceStrategy }));
  }

  suggest(trope: string): string | null {
    return this._tropes[trope] || null;
  }
}

// ============================================================================
// Engine 9: GenrePacingTemplate
// ============================================================================

export class GenrePacingTemplate {
  private _templates: Record<string, number[]> = {
    mystery: [0.1, 0.3, 0.5, 0.8, 1.0], // 5 tension peaks
    romance: [0.2, 0.4, 0.5, 0.6, 0.9],
    horror: [0.1, 0.2, 0.4, 0.7, 0.95],
    wuxia: [0.1, 0.3, 0.4, 0.6, 0.85, 1.0],
    scifi: [0.1, 0.2, 0.5, 0.8, 1.0],
  };

  getTemplate(genre: string): number[] {
    return [...(this._templates[genre] || [0.1, 0.5, 1.0])];
  }

  countPeaks(genre: string): number {
    return this.getTemplate(genre).length;
  }
}

// ============================================================================
// Engine 10: GenreMasterIndex
// ============================================================================

export class GenreMasterIndex {
  list(): string[] {
    return [
      'HuanDianScheduler', 'FaceSlapEngine', 'PretendWeakHiddenStrong', 'SystemFlowRPG',
      'InfiniteFlowDesigner', 'PowerUpMoment', 'WuxiaLevelSystem', 'XianxiaRealm',
      'SystemTaskDesigner', 'GenreConventionAuditor',
      'FairPlayAuditor', 'ClueLedger', 'DeductionChainValidator', 'LockedRoomLogic',
      'RedHerringDetector', 'PhysicsHardnessChecker', 'FTLConsistency', 'AIBehaviorAuditor',
      'TimeParadoxValidator', 'MythologyFaithfulness',
      'HEAPathPlanner', 'SugarKnifeRatio', 'MisunderstandingAuditor',
      'RelationshipMilestoneTracker', 'HorrorAtmosphere', 'ThrillerCountdownManager',
      'LiteraryDepthScorer', 'TropeAvoidanceAdvisor', 'GenrePacingTemplate',
      'GenreMasterIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const Z_BATCH_3_ENGINES = {
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
} as const;
