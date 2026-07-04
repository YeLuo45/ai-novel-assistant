/**
 * BetaReaderSimulation.ts — Direction AL, V3446-V3455 (Batch 2/3)
 * Beta Reader Persona: 模拟反馈
 *
 * 10 engines:
 * 1.  MultiReaderFeedback — 多读者反馈
 * 2.  FeedbackAggregator — 反馈聚合
 * 3.  CriticalIssuesExtractor — 关键问题提取
 * 4.  PositiveFeedbackExtractor — 正面反馈
 * 5.  ConsensusDetector — 共识检测
 * 6.  OutlierFeedbackDetector — 异常反馈检测
 * 7.  ReaderPanel — 读者小组
 * 8.  FeedbackReportGenerator — 反馈报告
 * 9.  ImprovementSuggestions — 改进建议
 * 10. BetaReaderSimulationIndex — 收口
 *
 * 灵感：模拟 3 类读者反馈 / 出版前自检
 */

import type { BetaReader } from './BetaReaderProfiles';

// ============================================================================
// Engine 1: MultiReaderFeedback
// ============================================================================

export interface ReaderFeedback {
  reader: BetaReader;
  rating: number;
  issues: string[];
  positives: string[];
}

export class MultiReaderFeedback {
  private _feedbacks: ReaderFeedback[] = [];

  add(feedback: ReaderFeedback): void {
    this._feedbacks.push(feedback);
  }

  getAll(): ReaderFeedback[] {
    return [...this._feedbacks];
  }

  averageRating(): number {
    if (this._feedbacks.length === 0) return 0;
    return this._feedbacks.reduce((s, f) => s + f.rating, 0) / this._feedbacks.length;
  }
}

// ============================================================================
// Engine 2: FeedbackAggregator
// ============================================================================

export class FeedbackAggregator {
  aggregate(feedbacks: ReaderFeedback[]): { commonIssues: string[]; avgRating: number } {
    const counts: Record<string, number> = {};
    for (const f of feedbacks) {
      for (const i of f.issues) counts[i] = (counts[i] || 0) + 1;
    }
    const commonIssues = Object.entries(counts)
      .filter(([_, c]) => c >= Math.max(1, feedbacks.length / 2))
      .map(([issue]) => issue);
    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;
    return { commonIssues, avgRating };
  }
}

// ============================================================================
// Engine 3: CriticalIssuesExtractor
// ============================================================================

export class CriticalIssuesExtractor {
  extract(feedbacks: ReaderFeedback[]): { issue: string; severity: number }[] {
    const counts: Record<string, number> = {};
    for (const f of feedbacks) {
      for (const i of f.issues) counts[i] = (counts[i] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([issue, count]) => ({ issue, severity: count / feedbacks.length }))
      .sort((a, b) => b.severity - a.severity);
  }

  topN(feedbacks: ReaderFeedback[], n: number): { issue: string; severity: number }[] {
    return this.extract(feedbacks).slice(0, n);
  }
}

// ============================================================================
// Engine 4: PositiveFeedbackExtractor
// ============================================================================

export class PositiveFeedbackExtractor {
  extract(feedbacks: ReaderFeedback[]): { positive: string; frequency: number }[] {
    const counts: Record<string, number> = {};
    for (const f of feedbacks) {
      for (const p of f.positives) counts[p] = (counts[p] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([positive, frequency]) => ({ positive, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }
}

// ============================================================================
// Engine 5: ConsensusDetector
// ============================================================================

export class ConsensusDetector {
  detect(feedbacks: ReaderFeedback[]): { consensusIssues: string[]; consensusPositives: string[] } {
    const issues: Record<string, number> = {};
    const positives: Record<string, number> = {};
    for (const f of feedbacks) {
      for (const i of f.issues) issues[i] = (issues[i] || 0) + 1;
      for (const p of f.positives) positives[p] = (positives[p] || 0) + 1;
    }
    const consensusIssues = Object.entries(issues).filter(([_, c]) => c >= feedbacks.length * 0.7).map(([i]) => i);
    const consensusPositives = Object.entries(positives).filter(([_, c]) => c >= feedbacks.length * 0.7).map(([p]) => p);
    return { consensusIssues, consensusPositives };
  }
}

// ============================================================================
// Engine 6: OutlierFeedbackDetector
// ============================================================================

export class OutlierFeedbackDetector {
  detect(feedbacks: ReaderFeedback[]): { outlierReader: string; rating: number } | null {
    if (feedbacks.length < 3) return null;
    const ratings = feedbacks.map((f) => f.rating);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const stdev = Math.sqrt(ratings.reduce((s, r) => s + (r - avg) ** 2, 0) / ratings.length);
    for (const f of feedbacks) {
      if (Math.abs(f.rating - avg) > stdev * 1.5) {
        return { outlierReader: f.reader.name, rating: f.rating };
      }
    }
    return null;
  }
}

// ============================================================================
// Engine 7: ReaderPanel
// ============================================================================

export class ReaderPanel {
  private _readers: BetaReader[] = [];

  addReader(reader: BetaReader): void {
    this._readers.push(reader);
  }

  size(): number {
    return this._readers.length;
  }

  types(): string[] {
    return Array.from(new Set(this._readers.map((r) => r.type)));
  }

  isDiverse(): boolean {
    return this.types().length >= 3;
  }
}

// ============================================================================
// Engine 8: FeedbackReportGenerator
// ============================================================================

export class FeedbackReportGenerator {
  generate(feedbacks: ReaderFeedback[]): string {
    const consensus = new ConsensusDetector().detect(feedbacks);
    const critical = new CriticalIssuesExtractor().topN(feedbacks, 3);
    const positives = new PositiveFeedbackExtractor().extract(feedbacks).slice(0, 3);
    const avg = feedbacks.length > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;
    let report = `# Beta Reader Report\n\n`;
    report += `## Overall\n平均评分: ${avg.toFixed(2)}/5\n\n`;
    report += `## 共识问题\n${consensus.consensusIssues.map((i) => `- ${i}`).join('\n') || '无'}\n\n`;
    report += `## 关键问题\n${critical.map((c) => `- ${c.issue} (严重度 ${c.severity.toFixed(2)})`).join('\n') || '无'}\n\n`;
    report += `## 正面反馈\n${positives.map((p) => `- ${p.positive} (${p.frequency})`).join('\n') || '无'}\n`;
    return report;
  }
}

// ============================================================================
// Engine 9: ImprovementSuggestions
// ============================================================================

export class ImprovementSuggestions {
  suggest(issue: string): string {
    const map: Record<string, string> = {
      'chapter too short': '增加场景细节和人物内心独白',
      'no 爽点': '添加打脸/逆袭/升级等爽点',
      'lacks depth': '增加隐喻、象征、主题层次',
      'too much tell': '用 show don\'t tell 改写',
      'lacks genre elements': '增加类型标志场景',
      'boring': '加入冲突、悬念、转折',
      'too dark': '加入希望、幽默或温暖',
      'lacks depth': '增加人物背景和情感',
      'not unique': '寻找独特视角或设定',
      'too literary': '简化语言，加动作场景',
    };
    return map[issue] || '针对此问题进行专门修改';
  }

  forTopIssues(issues: { issue: string; severity: number }[]): string[] {
    return issues.map((i) => this.suggest(i.issue));
  }
}

// ============================================================================
// Engine 10: BetaReaderSimulationIndex
// ============================================================================

export class BetaReaderSimulationIndex {
  list(): string[] {
    return [
      'MultiReaderFeedback', 'FeedbackAggregator', 'CriticalIssuesExtractor',
      'PositiveFeedbackExtractor', 'ConsensusDetector', 'OutlierFeedbackDetector',
      'ReaderPanel', 'FeedbackReportGenerator', 'ImprovementSuggestions',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AL_BATCH_2_ENGINES = {
  MultiReaderFeedback,
  FeedbackAggregator,
  CriticalIssuesExtractor,
  PositiveFeedbackExtractor,
  ConsensusDetector,
  OutlierFeedbackDetector,
  ReaderPanel,
  FeedbackReportGenerator,
  ImprovementSuggestions,
  BetaReaderSimulationIndex,
} as const;

export type { BetaReader };
