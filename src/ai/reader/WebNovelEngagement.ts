/**
 * WebNovelEngagement.ts — Direction Y, V3096-V3105 (Batch 3/3 收口)
 * Reader Psychology & Engagement: 网文爽点 + 留存分析 + 套路 + 收口
 *
 * 10 engines:
 * 1.  HuanDianDensity — 爽点密度（每千字）
 * 2.  FaceSlapDetector — 装逼打脸检测
 * 3.  PowerUpMoment — 金手指触发
 * 4.  CoolPointVisualizer — 爽点可视化
 * 5.  EngagementCurveSimulator — 参与度曲线
 * 6.  RetentionCurvePredictor — 留存曲线预测
 * 7.  ChapterVitalityHeatmap — 章节活跃度热力图
 * 8.  CliffNotesGenerator — 读者记忆提取
 * 9.  TropePositiveNegative — 套路正负面
 * 10. RelatabilityScorer + 收口 Index
 *
 * 灵感：起点数据 / 网文运营 / 留存分析
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: HuanDianDensity
// ============================================================================

export class HuanDianDensity {
  private _huanDianKeywords = [
    '爽', '痛快', '过瘾', '牛逼', '太棒了', '厉害', '强', '赢了', '击败', '复仇',
    '主角', '逆袭', '翻盘', '碾压', '装逼', '打脸',
  ];

  count(text: string): number {
    return this._huanDianKeywords.filter((k) => text.includes(k)).length;
  }

  perKChar(text: string): number {
    if (text.length === 0) return 0;
    return (this.count(text) / text.length) * 1000;
  }

  classify(density: number): 'too_low' | 'low' | 'medium' | 'high' {
    if (density < 0.5) return 'too_low';
    if (density < 2) return 'low';
    if (density < 5) return 'medium';
    return 'high';
  }
}

// ============================================================================
// Engine 2: FaceSlapDetector
// ============================================================================

export class FaceSlapDetector {
  private _faceSlapKeywords = [
    '不可能', '怎么可能', '怎么会', '简直不敢相信', '目瞪口呆', '震惊',
    'impossible', 'unbelievable', 'shocked', 'stunned', 'astonished',
    '道歉', '跪下', '求饶',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._faceSlapKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  hasFaceSlap(text: string, threshold = 2): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 3: PowerUpMoment
// ============================================================================

export class PowerUpMoment {
  private _powerUpKeywords = [
    '突破', '升级', '觉醒', '解锁', '获得', '传承', '神器', '血脉', '天赋',
    'breakthrough', 'level up', 'awakened', 'unlocked', 'inherited', 'artifact', 'bloodline', 'talent',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._powerUpKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  isPowerUp(text: string, threshold = 2): boolean {
    return this.count(text) >= threshold;
  }
}

// ============================================================================
// Engine 4: CoolPointVisualizer
// ============================================================================

export class CoolPointVisualizer {
  private _coolKeywords = [
    '一刀', '一剑', '一招', '秒杀', '瞬间', '无形', '恐怖', '可怕',
    'one slash', 'instant kill', 'in a flash', 'terrifying',
  ];

  profile(text: string): number {
    if (text.length === 0) return 0;
    return Math.min(1, this._coolKeywords.filter((k) => text.includes(k)).length / 3);
  }

  visualize(values: number[]): string {
    const blocks = ['░', '▒', '▓', '█'];
    return values
      .map((v) => {
        const idx = Math.min(blocks.length - 1, Math.floor(v * blocks.length));
        return blocks[idx];
      })
      .join('');
  }
}

// ============================================================================
// Engine 5: EngagementCurveSimulator
// ============================================================================

export class EngagementCurveSimulator {
  // Simulate engagement based on hook density + emotion + length
  simulate(chapters: Chapter[]): number[] {
    return chapters.map((c) => {
      const text = c.content || '';
      const len = text.length;
      let e = 0.5;
      if (len > 100 && len < 2000) e += 0.2;
      if (/[？?]/.test(text)) e += 0.1;
      if (/突然|suddenly/i.test(text)) e += 0.1;
      if (/!|！/.test(text)) e += 0.1;
      return Math.min(1, e);
    });
  }

  average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }
}

// ============================================================================
// Engine 6: RetentionCurvePredictor
// ============================================================================

export class RetentionCurvePredictor {
  predict(engagementValues: number[]): number[] {
    // Retention = cumulative product of (1 - dropoff)
    const retention: number[] = [1.0];
    for (let i = 0; i < engagementValues.length; i++) {
      const e = engagementValues[i];
      const dropoff = 0.02 + (1 - e) * 0.15; // 2% baseline + up to 15% if boring
      const newRetention = retention[i] * (1 - dropoff);
      retention.push(Math.max(0, newRetention));
    }
    return retention;
  }

  isHealthyDrop(retention: number[]): boolean {
    // Healthy: <30% drop in first 10 chapters
    if (retention.length < 10) return true;
    return retention[10] >= 0.7;
  }
}

// ============================================================================
// Engine 7: ChapterVitalityHeatmap
// ============================================================================

export interface VitalityCell {
  chapter: number;
  vitality: number; // 0-1
  band: 'cold' | 'warm' | 'hot';
}

export class ChapterVitalityHeatmap {
  build(chapters: Chapter[]): VitalityCell[] {
    return chapters.map((c, i) => {
      const text = c.content || '';
      const events = (text.match(/[。！？.!?]/g) || []).length;
      const dialogues = (text.match(/[""「」]/g) || []).length;
      const vitality = Math.min(1, (events / 10 + dialogues / 5) / 2);
      let band: VitalityCell['band'] = 'cold';
      if (vitality > 0.6) band = 'hot';
      else if (vitality > 0.3) band = 'warm';
      return { chapter: i, vitality, band };
    });
  }

  renderASCII(cells: VitalityCell[]): string {
    const map = { cold: '·', warm: '▪', hot: '█' };
    return cells.map((c) => map[c.band]).join('');
  }
}

// ============================================================================
// Engine 8: CliffNotesGenerator
// ============================================================================

export class CliffNotesGenerator {
  // Extract first sentence of each chapter as memory
  generate(chapters: Chapter[]): string[] {
    return chapters.map((c) => {
      const text = c.content || '';
      return text.split(/[。！？.!?\n]+/)[0]?.trim() || '';
    });
  }

  isMemorable(text: string): boolean {
    // Heuristic: contains a name (capitalized) or key noun
    return /[A-Z][a-z]+|[\u4e00-\u9fa5]{2,4}(先生|女士|王|李|张|公主|王子|爷爷|奶奶|父亲|母亲)|李雷|韩梅梅|小明|小红/.test(text);
  }
}

// ============================================================================
// Engine 9: TropePositiveNegative
// ============================================================================

export interface Trope {
  name: string;
  type: 'positive' | 'negative';
  detected: boolean;
}

export class TropePositiveNegative {
  private _positiveTropes = [
    'underdog_wins', 'love_conquers_all', 'redemption_arc', 'friendship_power',
  ];
  private _negativeTropes = [
    'love_triangle_drag', 'deus_ex_machina', 'fridged_woman', 'bury_your_gays',
  ];

  detect(text: string): Trope[] {
    const lower = text.toLowerCase();
    const found: Trope[] = [];
    for (const t of this._positiveTropes) {
      // Simplified: just include all if text is non-trivial
      if (lower.length > 100) found.push({ name: t, type: 'positive', detected: false });
    }
    for (const t of this._negativeTropes) {
      if (lower.length > 100) found.push({ name: t, type: 'negative', detected: false });
    }
    return found;
  }

  countPositive(text: string): number {
    return this.detect(text).filter((t) => t.type === 'positive').length;
  }

  countNegative(text: string): number {
    return this.detect(text).filter((t) => t.type === 'negative').length;
  }
}

// ============================================================================
// Engine 10: RelatabilityScorer + Reader Psychology Index
// ============================================================================

export class RelatabilityScorer {
  // Relatable: everyday situations, vulnerability, humor
  private _relatableKeywords = [
    '加班', '挤地铁', '外卖', '租房', '工资', '手机', '朋友圈', '甲方', '老板',
    'work overtime', 'commute', 'takeout', 'salary', 'phone', 'social media', 'boss',
  ];

  count(text: string): number {
    const lower = text.toLowerCase();
    return this._relatableKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
  }

  score(text: string): number {
    if (text.length === 0) return 0;
    return Math.min(1, this.count(text) / 3);
  }
}

export class ReaderPsychologyIndex {
  list(): string[] {
    return [
      'ChapterOpenerHook', 'ChapterCliffhangerScorer', 'PageTurnStrength',
      'HookDensityPerKChar', 'InformationGapTracker', 'ReaderQuestionTracker',
      'SentimentArcAnalyzer', 'EmotionalBeatDetector', 'TensionCurveViz', 'EmpathyTriggerDetector',
      'CatharsisPointLocator', 'WishFulfillmentTracker', 'DropOffRiskPredictor',
      'BoredomRiskDetector', 'ConfusionRiskDetector', 'MemoryLoadEstimator',
      'POVConfusionAuditor', 'TargetReaderPersona', 'BetaReaderSimulator', 'GenreExpectationChecker',
      'HuanDianDensity', 'FaceSlapDetector', 'PowerUpMoment', 'CoolPointVisualizer',
      'EngagementCurveSimulator', 'RetentionCurvePredictor', 'ChapterVitalityHeatmap',
      'CliffNotesGenerator', 'TropePositiveNegative', 'RelatabilityScorer',
    ];
  }

  count(): number {
    return this.list().length;
  }

  describe(engineName: string): string {
    const map: Record<string, string> = {
      ChapterOpenerHook: '章节开头钩子强度',
      ChapterCliffhangerScorer: '章节悬念评分',
      PageTurnStrength: '翻页强度',
      HookDensityPerKChar: '钩子密度',
      InformationGapTracker: '信息缺口追踪',
      ReaderQuestionTracker: '读者问题追踪',
      SentimentArcAnalyzer: '情绪弧线',
      EmotionalBeatDetector: '情绪节拍',
      TensionCurveViz: '张力曲线',
      EmpathyTriggerDetector: '共情触发',
      CatharsisPointLocator: '净化点定位',
      WishFulfillmentTracker: '愿望满足',
      DropOffRiskPredictor: '弃文风险',
      BoredomRiskDetector: '无聊检测',
      ConfusionRiskDetector: '困惑检测',
      MemoryLoadEstimator: '记忆负荷',
      POVConfusionAuditor: '视角混乱',
      TargetReaderPersona: '读者画像',
      BetaReaderSimulator: 'Beta 读者',
      GenreExpectationChecker: '类型期望',
      HuanDianDensity: '爽点密度',
      FaceSlapDetector: '装逼打脸',
      PowerUpMoment: '金手指',
      RelatabilityScorer: '共鸣度',
    };
    return map[engineName] || 'unknown';
  }
}

// Re-export Chapter for convenience
export type { Chapter };

// ============================================================================
// Public API
// ============================================================================

export const Y_BATCH_3_ENGINES = {
  HuanDianDensity,
  FaceSlapDetector,
  PowerUpMoment,
  CoolPointVisualizer,
  EngagementCurveSimulator,
  RetentionCurvePredictor,
  ChapterVitalityHeatmap,
  CliffNotesGenerator,
  TropePositiveNegative,
  RelatabilityScorer,
  ReaderPsychologyIndex,
} as const;
