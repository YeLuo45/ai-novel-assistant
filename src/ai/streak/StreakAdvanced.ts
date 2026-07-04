/**
 * StreakAdvanced.ts — Direction AN, V3506-V3515 (Batch 2/3)
 * Writing Streak Optimizer: 高级优化
 *
 * 10 engines:
 * 1.  StreakPredictor — 连续预测
 * 2.  EnergyLevelPredictor — 能量预测
 * 3.  OptimalWritingTime — 最佳写作时间
 * 4.  StreakRewardSystem — 奖励系统
 * 5.  HabitResistancePredictor — 抗干扰预测
 * 6.  ProductivityAnalyzer — 生产力分析
 * 7.  WritingEnvironmentOptimizer — 环境优化
 * 8.  DistractionBlocker — 干扰拦截
 * 9.  MomentumTracker — 动量追踪
 * 10. StreakAdvancedIndex — 收口
 */

import type { WritingSession } from './StreakCore';

// ============================================================================
// Engine 1: StreakPredictor
// ============================================================================

export class StreakPredictor {
  predict(history: { date: string; wrote: boolean }[], futureDays: number = 7): number {
    if (history.length === 0) return 0.5;
    const recent = history.slice(-7);
    const wroteDays = recent.filter((h) => h.wrote).length;
    return wroteDays / Math.max(1, futureDays);
  }

  isOnTrackToExtend(currentStreak: number, successRate: number): boolean {
    return successRate > 0.7 || currentStreak < 3;
  }
}

// ============================================================================
// Engine 2: EnergyLevelPredictor
// ============================================================================

export class EnergyLevelPredictor {
  predict(hour: number, dayOfWeek: number): number {
    let energy = 0.5;
    // Peak hours: 9-11 AM, 3-5 PM
    if (hour >= 9 && hour <= 11) energy += 0.3;
    if (hour >= 15 && hour <= 17) energy += 0.2;
    // Weekday vs weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) energy += 0.1;
    return Math.min(1, energy);
  }

  isPeakHour(hour: number): boolean {
    return (hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17);
  }
}

// ============================================================================
// Engine 3: OptimalWritingTime
// ============================================================================

export class OptimalWritingTime {
  recommend(historicalSessions: { hour: number; words: number }[]): { hour: number; confidence: number } {
    if (historicalSessions.length === 0) return { hour: 9, confidence: 0 };
    const hourProductivity: Record<number, number> = {};
    for (const s of historicalSessions) {
      hourProductivity[s.hour] = (hourProductivity[s.hour] || 0) + s.words;
    }
    let bestHour = 0;
    let bestWords = 0;
    for (const [h, w] of Object.entries(hourProductivity)) {
      if (w > bestWords) {
        bestWords = w;
        bestHour = parseInt(h);
      }
    }
    return { hour: bestHour, confidence: bestWords / 1000 };
  }
}

// ============================================================================
// Engine 4: StreakRewardSystem
// ============================================================================

export class StreakRewardSystem {
  private _rewards: { streak: number; reward: string }[] = [
    { streak: 3, reward: '请自己吃顿好的' },
    { streak: 7, reward: '买一本想要的书' },
    { streak: 30, reward: '短期旅行' },
    { streak: 100, reward: '一件大礼物' },
  ];

  getReward(streak: number): string {
    const achieved = this._rewards.filter((r) => streak >= r.streak);
    if (achieved.length === 0) return '继续努力！';
    return achieved[achieved.length - 1].reward;
  }

  nextMilestone(streak: number): { streak: number; reward: string } | null {
    return this._rewards.find((r) => streak < r.streak) || null;
  }
}

// ============================================================================
// Engine 5: HabitResistancePredictor
// ============================================================================

export class HabitResistancePredictor {
  predict(distractions: { type: string; intensity: number }[]): number {
    return Math.min(1, distractions.reduce((s, d) => s + d.intensity, 0) / 5);
  }

  isHighRisk(resistance: number): boolean {
    return resistance > 0.7;
  }
}

// ============================================================================
// Engine 6: ProductivityAnalyzer
// ============================================================================

export class ProductivityAnalyzer {
  analyze(sessions: WritingSession[]): { wordsPerHour: number; avgQuality: number; trend: 'up' | 'down' | 'stable' } {
    if (sessions.length === 0) return { wordsPerHour: 0, avgQuality: 0, trend: 'stable' };
    const totalWords = sessions.reduce((s, sess) => s + sess.words, 0);
    const totalMinutes = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
    const wph = totalMinutes > 0 ? (totalWords / totalMinutes) * 60 : 0;
    const avgQ = sessions.reduce((s, sess) => s + sess.quality, 0) / sessions.length;
    const recent = sessions.slice(-3);
    const older = sessions.slice(0, Math.max(1, sessions.length - 3));
    const recentAvg = recent.reduce((s, sess) => s + sess.words, 0) / recent.length;
    const olderAvg = older.reduce((s, sess) => s + sess.words, 0) / older.length;
    const trend = recentAvg > olderAvg * 1.2 ? 'up' : recentAvg < olderAvg * 0.8 ? 'down' : 'stable';
    return { wordsPerHour: wph, avgQuality: avgQ, trend };
  }
}

// ============================================================================
// Engine 7: WritingEnvironmentOptimizer
// ============================================================================

export class WritingEnvironmentOptimizer {
  private _factors = ['noise', 'lighting', 'temperature', 'chair', 'screen', 'music'];

  optimize(environment: { factor: string; rating: number }[]): { issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    for (const e of environment) {
      if (e.rating < 0.5) {
        issues.push(`${e.factor} 不佳`);
        suggestions.push(`改善 ${e.factor}`);
      }
    }
    return { issues, suggestions };
  }
}

// ============================================================================
// Engine 8: DistractionBlocker
// ============================================================================

export class DistractionBlocker {
  private _distractions: { source: string; frequency: number }[] = [];

  record(source: string): void {
    const existing = this._distractions.find((d) => d.source === source);
    if (existing) existing.frequency += 1;
    else this._distractions.push({ source, frequency: 1 });
  }

  topDistractions(n: number = 3): { source: string; frequency: number }[] {
    return [...this._distractions].sort((a, b) => b.frequency - a.frequency).slice(0, n);
  }
}

// ============================================================================
// Engine 9: MomentumTracker
// ============================================================================

export class MomentumTracker {
  private _momentum: number = 0;

  recordSession(words: number): void {
    this._momentum = Math.max(0, Math.min(1, this._momentum + words / 1000));
  }

  recordSkip(): void {
    this._momentum = Math.max(0, this._momentum - 0.2);
  }

  getMomentum(): number {
    return this._momentum;
  }

  isHighMomentum(threshold = 0.7): boolean {
    return this._momentum >= threshold;
  }
}

// ============================================================================
// Engine 10: StreakAdvancedIndex
// ============================================================================

export class StreakAdvancedIndex {
  list(): string[] {
    return [
      'StreakPredictor', 'EnergyLevelPredictor', 'OptimalWritingTime',
      'StreakRewardSystem', 'HabitResistancePredictor', 'ProductivityAnalyzer',
      'WritingEnvironmentOptimizer', 'DistractionBlocker', 'MomentumTracker',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AN_BATCH_2_ENGINES = {
  StreakPredictor,
  EnergyLevelPredictor,
  OptimalWritingTime,
  StreakRewardSystem,
  HabitResistancePredictor,
  ProductivityAnalyzer,
  WritingEnvironmentOptimizer,
  DistractionBlocker,
  MomentumTracker,
  StreakAdvancedIndex,
} as const;

export type { WritingSession };
