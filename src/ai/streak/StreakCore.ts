/**
 * StreakCore.ts — Direction AN, V3496-V3505 (Batch 1/3)
 * Writing Streak Optimizer: 连续写作核心
 *
 * 10 engines:
 * 1.  StreakCalculator — 连续天数计算
 * 2.  StreakRecord — 连续记录
 * 3.  HabitLoopBuilder — 习惯循环构建
 * 4.  DailyGoalSuggester — 每日目标推荐
 * 5.  ProgressVisualizer — 进度可视化
 * 6.  StreakMilestone — 里程碑
 * 7.  StreakRecovery — 连续恢复
 * 8.  HabitStackingEngine — 习惯堆叠
 * 9.  TriggerRoutineBuilder — 触发器 + 惯例
 * 10. StreakCoreIndex — 收口
 *
 * 灵感：Atomic Habits / 写作马拉松 / 习惯养成心理学
 */

export interface WritingSession {
  date: string;
  words: number;
  durationMinutes: number;
  quality: number; // 0-1
}

// ============================================================================
// Engine 1: StreakCalculator
// ============================================================================

export class StreakCalculator {
  private _dates: string[] = [];

  record(date: string): void {
    if (!this._dates.includes(date)) this._dates.push(date);
    this._dates.sort();
  }

  currentStreak(today: string): number {
    if (this._dates.length === 0) return 0;
    const last = this._dates[this._dates.length - 1];
    if (last !== today) return 0;
    let count = 1;
    for (let i = this._dates.length - 2; i >= 0; i--) {
      const prev = new Date(this._dates[i]);
      const curr = new Date(this._dates[i + 1]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) count += 1;
      else break;
    }
    return count;
  }

  bestStreak(): number {
    if (this._dates.length === 0) return 0;
    let best = 1;
    let current = 1;
    for (let i = 1; i < this._dates.length; i++) {
      const prev = new Date(this._dates[i - 1]);
      const curr = new Date(this._dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) current += 1;
      else current = 1;
      best = Math.max(best, current);
    }
    return best;
  }
}

// ============================================================================
// Engine 2: StreakRecord
// ============================================================================

export class StreakRecord {
  private _sessions: WritingSession[] = [];

  addSession(session: WritingSession): void {
    this._sessions.push(session);
  }

  getAll(): WritingSession[] {
    return [...this._sessions];
  }

  totalWords(): number {
    return this._sessions.reduce((s, sess) => s + sess.words, 0);
  }

  averageQuality(): number {
    if (this._sessions.length === 0) return 0;
    return this._sessions.reduce((s, sess) => s + sess.quality, 0) / this._sessions.length;
  }
}

// ============================================================================
// Engine 3: HabitLoopBuilder
// ============================================================================

export class HabitLoopBuilder {
  build(cue: string, routine: string, reward: string): { cue: string; routine: string; reward: string } {
    return { cue, routine, reward };
  }

  isComplete(loop: { cue: string; routine: string; reward: string }): boolean {
    return loop.cue.length > 0 && loop.routine.length > 0 && loop.reward.length > 0;
  }
}

// ============================================================================
// Engine 4: DailyGoalSuggester
// ============================================================================

export class DailyGoalSuggester {
  suggest(currentAvg: number, energyLevel: number = 0.5): number {
    const base = Math.max(100, Math.floor(currentAvg * 1.1));
    const adjusted = base * (0.5 + energyLevel);
    return Math.floor(adjusted);
  }

  isAmbitious(goal: number, current: number): boolean {
    return goal > current * 2;
  }

  isRealistic(goal: number): boolean {
    return goal >= 100 && goal <= 5000;
  }
}

// ============================================================================
// Engine 5: ProgressVisualizer
// ============================================================================

export class ProgressVisualizer {
  renderCalendar(dates: string[]): string {
    return dates.map((d) => '█').join('');
  }

  renderProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round(percentage * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  }

  renderStreak(streak: number, max: number = 30): string {
    return '🔥'.repeat(Math.min(streak, max));
  }
}

// ============================================================================
// Engine 6: StreakMilestone
// ============================================================================

export class StreakMilestone {
  private _milestones = [3, 7, 14, 30, 60, 100, 365];

  check(streak: number): { achieved: number[]; nextTarget: number | null } {
    const achieved = this._milestones.filter((m) => streak >= m);
    const nextTarget = this._milestones.find((m) => streak < m) || null;
    return { achieved, nextTarget };
  }

  isMajorMilestone(streak: number): boolean {
    return [7, 30, 100, 365].includes(streak);
  }
}

// ============================================================================
// Engine 7: StreakRecovery
// ============================================================================

export class StreakRecovery {
  recommend(breakDays: number): string {
    if (breakDays === 1) return '休息 1 天不算断，调整明天继续';
    if (breakDays <= 3) return '快速恢复：从今天开始 5 分钟自由写';
    if (breakDays <= 7) return '中等恢复：先 200 字热身，慢慢加量';
    return '长期断：从最小习惯开始（5 分钟 / 100 字）';
  }

  isRecoverable(breakDays: number): boolean {
    return breakDays <= 30;
  }
}

// ============================================================================
// Engine 8: HabitStackingEngine
// ============================================================================

export class HabitStackingEngine {
  stack(newHabit: string, existingHabit: string): string {
    return `在${existingHabit}之后，我立即${newHabit}`;
  }

  isValidStack(stack: string): boolean {
    return stack.includes('之后') && stack.length > 5;
  }

  suggestAnchor(habit: string): string[] {
    return ['起床后', '午饭后', '晚饭后', '睡前', '喝咖啡时'];
  }
}

// ============================================================================
// Engine 9: TriggerRoutineBuilder
// ============================================================================

export class TriggerRoutineBuilder {
  build(anchor: string, action: string, reward: string): { trigger: string; routine: string; reward: string } {
    return {
      trigger: anchor,
      routine: action,
      reward,
    };
  }

  isComplete(tr: { trigger: string; routine: string; reward: string }): boolean {
    return tr.trigger.length > 0 && tr.routine.length > 0 && tr.reward.length > 0;
  }
}

// ============================================================================
// Engine 10: StreakCoreIndex
// ============================================================================

export class StreakCoreIndex {
  list(): string[] {
    return [
      'StreakCalculator', 'StreakRecord', 'HabitLoopBuilder',
      'DailyGoalSuggester', 'ProgressVisualizer', 'StreakMilestone',
      'StreakRecovery', 'HabitStackingEngine', 'TriggerRoutineBuilder',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AN_BATCH_1_ENGINES = {
  StreakCalculator,
  StreakRecord,
  HabitLoopBuilder,
  DailyGoalSuggester,
  ProgressVisualizer,
  StreakMilestone,
  StreakRecovery,
  HabitStackingEngine,
  TriggerRoutineBuilder,
  StreakCoreIndex,
} as const;
