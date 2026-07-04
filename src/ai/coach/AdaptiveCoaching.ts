/**
 * AdaptiveCoaching.ts — Direction AK, V3416-V3425 (Batch 2/3)
 * Adaptive Writing Coach: 自适应教练
 *
 * 10 engines:
 * 1.  AdaptiveDifficultyEngine — 自适应难度
 * 2.  ProgressTracker — 进度追踪
 * 3.  GoalRecommender — 目标推荐
 * 4.  SkillTreeBuilder — 技能树构建
 * 5.  LessonPlanGenerator — 课程计划
 * 6.  PracticeExerciseSelector — 练习选择
 * 7.  FeedbackPersonalizer — 反馈个性化
 * 8.  CoachAIDirector — AI 教练总监
 * 9.  ImprovementPlanGenerator — 改进计划
 * 10. AdaptiveCoachingIndex — 收口
 *
 * 灵感：个人化写作教练 / 学习曲线
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: AdaptiveDifficultyEngine
// ============================================================================

export class AdaptiveDifficultyEngine {
  // Adjust difficulty based on recent success rate
  adjust(currentLevel: number, successRate: number): number {
    if (successRate > 0.85) return Math.min(1, currentLevel + 0.1);
    if (successRate < 0.5) return Math.max(0, currentLevel - 0.1);
    return currentLevel;
  }

  recommendExercise(skill: number): 'easy' | 'medium' | 'hard' {
    if (skill < 0.3) return 'easy';
    if (skill < 0.7) return 'medium';
    return 'hard';
  }
}

// ============================================================================
// Engine 2: ProgressTracker
// ============================================================================

export class ProgressTracker {
  private _history: { date: string; wordsWritten: number; skillsImproved: string[] }[] = [];

  record(date: string, wordsWritten: number, skillsImproved: string[]): void {
    this._history.push({ date, wordsWritten, skillsImproved });
  }

  getHistory(): { date: string; wordsWritten: number; skillsImproved: string[] }[] {
    return [...this._history];
  }

  totalWords(): number {
    return this._history.reduce((s, h) => s + h.wordsWritten, 0);
  }

  skillsImprovedCount(): number {
    const set = new Set<string>();
    for (const h of this._history) for (const s of h.skillsImproved) set.add(s);
    return set.size;
  }
}

// ============================================================================
// Engine 3: GoalRecommender
// ============================================================================

export class GoalRecommender {
  recommend(dailyAvg: number): { daily: number; weekly: number; monthly: number } {
    return {
      daily: Math.max(100, Math.floor(dailyAvg * 1.1)),
      weekly: Math.max(1000, Math.floor(dailyAvg * 7 * 1.1)),
      monthly: Math.max(5000, Math.floor(dailyAvg * 30 * 1.1)),
    };
  }

  isAmbitious(target: number, current: number): boolean {
    return target > current * 1.5;
  }
}

// ============================================================================
// Engine 4: SkillTreeBuilder
// ============================================================================

export interface Skill {
  name: string;
  level: number; // 0-1
  prerequisites: string[];
}

export class SkillTreeBuilder {
  private _skills = new Map<string, Skill>();

  addSkill(name: string, prerequisites: string[] = []): void {
    this._skills.set(name, { name, level: 0, prerequisites });
  }

  setLevel(name: string, level: number): void {
    const s = this._skills.get(name);
    if (s) s.level = Math.max(0, Math.min(1, level));
  }

  getSkill(name: string): Skill | null {
    return this._skills.get(name) || null;
  }

  availableSkills(completed: string[]): Skill[] {
    return Array.from(this._skills.values()).filter(
      (s) => !completed.includes(s.name) && s.prerequisites.every((p) => completed.includes(p))
    );
  }
}

// ============================================================================
// Engine 5: LessonPlanGenerator
// ============================================================================

export class LessonPlanGenerator {
  private _lessons: { topic: string; duration: number; difficulty: string }[] = [
    { topic: 'Show vs Tell', duration: 30, difficulty: 'easy' },
    { topic: 'Dialogue Writing', duration: 45, difficulty: 'medium' },
    { topic: 'Plot Structure', duration: 60, difficulty: 'hard' },
  ];

  recommend(skill: number): { topic: string; duration: number; difficulty: string } | null {
    let pool: typeof this._lessons = [];
    if (skill < 0.3) pool = this._lessons.filter((l) => l.difficulty === 'easy');
    else if (skill < 0.7) pool = this._lessons.filter((l) => l.difficulty === 'medium');
    else pool = this._lessons.filter((l) => l.difficulty === 'hard');
    return pool[0] || this._lessons[0] || null;
  }
}

// ============================================================================
// Engine 6: PracticeExerciseSelector
// ============================================================================

export class PracticeExerciseSelector {
  select(weakness: string, available: string[]): string {
    return available.find((e) => e.toLowerCase().includes(weakness.toLowerCase())) || available[0] || 'default';
  }

  isSuitable(exercise: string, skill: number): boolean {
    if (skill < 0.3 && exercise.includes('advanced')) return false;
    if (skill > 0.7 && exercise.includes('beginner')) return false;
    return true;
  }
}

// ============================================================================
// Engine 7: FeedbackPersonalizer
// ============================================================================

export class FeedbackPersonalizer {
  private _feedbackTemplates: Record<string, string[]> = {
    encouragement: ['做得好！', '继续！', '你正在进步！'],
    critique: ['试试改进 X', 'Y 可以更强', '注意 Z 的平衡'],
    praise: ['这段写得很好', '我喜欢你的节奏', '角色很鲜活'],
  };

  generate(type: 'encouragement' | 'critique' | 'praise', context: string): string {
    const templates = this._feedbackTemplates[type];
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    return `${tpl} - ${context}`;
  }
}

// ============================================================================
// Engine 8: CoachAIDirector
// ============================================================================

export class CoachAIDirector {
  private _tracker = new ProgressTracker();
  private _adaptive = new AdaptiveDifficultyEngine();

  decideNextStep(): 'practice' | 'lesson' | 'rest' {
    const history = this._tracker.getHistory();
    if (history.length === 0) return 'practice';
    const total = this._tracker.totalWords();
    if (total < 500) return 'practice';
    if (total > 5000) return 'rest';
    return 'lesson';
  }

  getTracker(): ProgressTracker {
    return this._tracker;
  }
}

// ============================================================================
// Engine 9: ImprovementPlanGenerator
// ============================================================================

export class ImprovementPlanGenerator {
  generate(weaknesses: string[]): { week: number; focus: string; exercise: string }[] {
    return weaknesses.map((w, i) => ({
      week: i + 1,
      focus: w,
      exercise: `每日练习 ${w} 30 分钟`,
    }));
  }

  totalDuration(plan: { week: number; focus: string; exercise: string }[]): number {
    return plan.length;
  }
}

// ============================================================================
// Engine 10: AdaptiveCoachingIndex
// ============================================================================

export class AdaptiveCoachingIndex {
  list(): string[] {
    return [
      'AdaptiveDifficultyEngine', 'ProgressTracker', 'GoalRecommender',
      'SkillTreeBuilder', 'LessonPlanGenerator', 'PracticeExerciseSelector',
      'FeedbackPersonalizer', 'CoachAIDirector', 'ImprovementPlanGenerator',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AK_BATCH_2_ENGINES = {
  AdaptiveDifficultyEngine,
  ProgressTracker,
  GoalRecommender,
  SkillTreeBuilder,
  LessonPlanGenerator,
  PracticeExerciseSelector,
  FeedbackPersonalizer,
  CoachAIDirector,
  ImprovementPlanGenerator,
  AdaptiveCoachingIndex,
} as const;

export type { Chapter };
