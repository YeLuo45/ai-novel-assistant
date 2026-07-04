/**
 * BlockIntegration.ts — Direction AJ, V3396-V3405 (Batch 3/3 收口)
 * Author Block Breaker: 集成 + 收口
 *
 * 10 engines:
 * 1.  ComprehensiveBlockAnalyzer — 综合瓶颈分析
 * 2.  BlockPreventionPredictor — 瓶颈预防预测
 * 3.  BlockRecoveryPlan — 瓶颈恢复计划
 * 4.  WritingHabitTracker — 写作习惯追踪
 * 5.  EnergyMonitor — 能量监控
 * 6.  BlockAlertSystem — 瓶颈预警
 * 7.  WriterProfileTracker — 写作者画像
 * 8.  BlockCategoryReport — 瓶颈分类报告
 * 9.  BlockAIDirector — AI 瓶颈突破导演
 * 10. BlockBreakerIndex — 28 engines 收口
 *
 * 灵感：写作者个人化助手
 */

import type { BlockType } from './BlockDetection';
import { BlockJournalTracker } from './BlockResolution';

export type { BlockType };

// ============================================================================
// Engine 1: ComprehensiveBlockAnalyzer
// ============================================================================

export class ComprehensiveBlockAnalyzer {
  analyze(signals: { type: BlockType; severity: number; date: string }[]): {
    primaryType: BlockType;
    totalSeverity: number;
    durationDays: number;
  } {
    if (signals.length === 0) return { primaryType: 'general', totalSeverity: 0, durationDays: 0 };
    const total = signals.reduce((s, sig) => s + sig.severity, 0);
    const counts: Record<string, number> = {};
    for (const s of signals) counts[s.type] = (counts[s.type] || 0) + s.severity;
    const primary = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as BlockType;
    const dates = signals.map((s) => new Date(s.date).getTime());
    const duration = Math.max(0, (Math.max(...dates) - Math.min(...dates)) / 86400000);
    return { primaryType: primary, totalSeverity: total, durationDays: duration };
  }
}

// ============================================================================
// Engine 2: BlockPreventionPredictor
// ============================================================================

export class BlockPreventionPredictor {
  predict(history: { wordsWritten: number; date: string }[]): { risk: number; recommendation: string } {
    if (history.length < 3) return { risk: 0, recommendation: 'Need more data' };
    const recent = history.slice(-3);
    const avg = recent.reduce((s, h) => s + h.wordsWritten, 0) / recent.length;
    const risk = avg < 500 ? 0.7 : avg < 1000 ? 0.4 : 0.2;
    const rec = risk > 0.5 ? '建议休息 1 天' : '继续写作';
    return { risk, recommendation: rec };
  }
}

// ============================================================================
// Engine 3: BlockRecoveryPlan
// ============================================================================

export class BlockRecoveryPlan {
  generate(severity: number, blockType: BlockType): { steps: string[]; duration: string } {
    if (severity < 0.3) {
      return { steps: ['继续写作', '短休 10 分钟'], duration: '30 分钟' };
    } else if (severity < 0.7) {
      return { steps: ['自由写作 15 分钟', '回顾设定', '列下一章大纲'], duration: '1 小时' };
    }
    return { steps: ['休息 1 天', '读书充电', '和朋友讨论剧情', '重写大纲'], duration: '3 天' };
  }
}

// ============================================================================
// Engine 4: WritingHabitTracker
// ============================================================================

export class WritingHabitTracker {
  private _habits = new Map<string, { count: number; avgWords: number }>();

  record(date: string, wordsWritten: number): void {
    const existing = this._habits.get(date);
    if (existing) {
      existing.count += 1;
      existing.avgWords = (existing.avgWords + wordsWritten) / existing.count;
    } else {
      this._habits.set(date, { count: 1, avgWords: wordsWritten });
    }
  }

  getHabit(date: string): { count: number; avgWords: number } | null {
    return this._habits.get(date) || null;
  }

  isConsistent(threshold = 5): boolean {
    return this._habits.size >= threshold;
  }
}

// ============================================================================
// Engine 5: EnergyMonitor
// ============================================================================

export class EnergyMonitor {
  private _logs: { date: string; level: number }[] = [];

  log(date: string, level: number): void {
    this._logs.push({ date, level: Math.max(0, Math.min(1, level)) });
  }

  averageLevel(): number {
    if (this._logs.length === 0) return 0;
    return this._logs.reduce((s, l) => s + l.level, 0) / this._logs.length;
  }

  isLow(threshold = 0.3): boolean {
    return this.averageLevel() < threshold;
  }
}

// ============================================================================
// Engine 6: BlockAlertSystem
// ============================================================================

export class BlockAlertSystem {
  private _alerts: { message: string; severity: 'low' | 'medium' | 'high' }[] = [];

  alert(message: string, severity: 'low' | 'medium' | 'high'): void {
    this._alerts.push({ message, severity });
  }

  getAlerts(): { message: string; severity: string }[] {
    return [...this._alerts];
  }

  hasHighAlert(): boolean {
    return this._alerts.some((a) => a.severity === 'high');
  }
}

// ============================================================================
// Engine 7: WriterProfileTracker
// ============================================================================

export class WriterProfileTracker {
  private _profile = { name: '', totalWords: 0, bestStreak: 0, preferredTime: 'morning' };

  setName(name: string): void {
    this._profile.name = name;
  }

  addWords(count: number): void {
    this._profile.totalWords += count;
  }

  setBestStreak(streak: number): void {
    this._profile.bestStreak = Math.max(this._profile.bestStreak, streak);
  }

  setPreferredTime(time: 'morning' | 'afternoon' | 'evening' | 'night'): void {
    this._profile.preferredTime = time;
  }

  getProfile(): { name: string; totalWords: number; bestStreak: number; preferredTime: string } {
    return { ...this._profile };
  }
}

// ============================================================================
// Engine 8: BlockCategoryReport
// ============================================================================

export class BlockCategoryReport {
  generate(signals: { type: BlockType; severity: number }[]): string {
    const counts: Record<string, { count: number; totalSeverity: number }> = {};
    for (const s of signals) {
      if (!counts[s.type]) counts[s.type] = { count: 0, totalSeverity: 0 };
      counts[s.type].count += 1;
      counts[s.type].totalSeverity += s.severity;
    }
    return Object.entries(counts)
      .map(([type, data]) => `${type}: ${data.count} 次, 平均严重度 ${(data.totalSeverity / data.count).toFixed(2)}`)
      .join('\n');
  }
}

// ============================================================================
// Engine 9: BlockAIDirector
// ============================================================================

export class BlockAIDirector {
  private _journal = new BlockJournalTracker();

  recommendSolution(blockType: BlockType, severity: number): string {
    const best = this._journal.mostEffectiveSolution(blockType);
    if (best) return `基于你的历史：${best}`;
    if (severity > 0.7) return '建议休息 1 天再战';
    if (severity > 0.4) return '尝试自由写作 10 分钟';
    return '继续当前进度';
  }

  hasHistory(blockType: BlockType): boolean {
    return this._journal.mostEffectiveSolution(blockType) !== null;
  }
}

// ============================================================================
// Engine 10: BlockBreakerIndex
// ============================================================================

export class BlockBreakerIndex {
  list(): string[] {
    return [
      'BlockTypeDetector', 'WriterBlockAnalyzer', 'ProcrastinationDetector',
      'BurnoutDetector', 'CreativeBlockBreaker', 'PlotBlockBreaker',
      'CharacterBlockBreaker', 'DialogueBlockBreaker', 'DescriptionBlockBreaker',
      'BlockSolutionRecommender', 'FreewritePromptGenerator', 'WritingWarmupGenerator',
      'InspirationScraper', 'WritingExerciseLibrary', 'BlockJournalTracker',
      'MotivationRestorer', 'FocusSessionManager', 'WritingStreakTracker',
      'ComprehensiveBlockAnalyzer', 'BlockPreventionPredictor', 'BlockRecoveryPlan',
      'WritingHabitTracker', 'EnergyMonitor', 'BlockAlertSystem',
      'WriterProfileTracker', 'BlockCategoryReport', 'BlockAIDirector',
      'BlockBreakerIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AJ_BATCH_3_ENGINES = {
  ComprehensiveBlockAnalyzer,
  BlockPreventionPredictor,
  BlockRecoveryPlan,
  WritingHabitTracker,
  EnergyMonitor,
  BlockAlertSystem,
  WriterProfileTracker,
  BlockCategoryReport,
  BlockAIDirector,
  BlockBreakerIndex,
} as const;
