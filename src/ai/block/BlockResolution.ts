/**
 * BlockResolution.ts — Direction AJ, V3386-V3395 (Batch 2/3)
 * Author Block Breaker: 瓶颈解决方案
 *
 * 10 engines:
 * 1.  BlockSolutionRecommender — 瓶颈解决推荐
 * 2.  FreewritePromptGenerator — 自由写作 prompt
 * 3.  WritingWarmupGenerator — 热身生成
 * 4.  InspirationScraper — 灵感抓取
 * 5.  WritingExerciseLibrary — 写作练习库
 * 6.  BlockJournalTracker — 瓶颈日志
 * 7.  MotivationRestorer — 动力恢复
 * 8.  FocusSessionManager — 专注会话
 * 9.  WritingStreakTracker — 连续写作追踪
 * 10. BlockResolutionIndex — 收口
 *
 * 灵感：写作教练 / 创作瓶颈突破
 */

import type { BlockType } from './BlockDetection';

// ============================================================================
// Engine 1: BlockSolutionRecommender
// ============================================================================

export class BlockSolutionRecommender {
  private _solutions: Record<BlockType, string[]> = {
    plot: ['改变一个角色的秘密', '引入新角色', '让旧敌变成新盟友', '时间跳跃'],
    character: ['让角色做出违背性格的事', '揭示隐藏的过去', '加入家人或朋友'],
    dialogue: ['让角色沉默', '加入肢体语言', '让对话被打断'],
    description: ['用 5 感描写', '从角色视角描写', '对比强烈色彩'],
    motivation: ['设定小目标', '和朋友写作', '回忆初心'],
    general: ['休息一下', '自由写作 10 分钟', '读喜欢的书'],
  };

  recommend(blockType: BlockType, n: number = 3): string[] {
    return (this._solutions[blockType] || []).slice(0, n);
  }

  hasSolution(blockType: BlockType): boolean {
    return (this._solutions[blockType] || []).length > 0;
  }
}

// ============================================================================
// Engine 2: FreewritePromptGenerator
// ============================================================================

export class FreewritePromptGenerator {
  private _prompts = [
    '写 5 分钟关于今天的心情',
    '用 200 字描述你童年的房间',
    '写一段角色最疯狂的梦想',
    '描述一个不存在的城市',
  ];

  generate(): string {
    return this._prompts[Math.floor(Math.random() * this._prompts.length)];
  }

  generateBatch(n: number): string[] {
    return Array.from({ length: n }, () => this.generate());
  }

  getAll(): string[] {
    return [...this._prompts];
  }
}

// ============================================================================
// Engine 3: WritingWarmupGenerator
// ============================================================================

export class WritingWarmupGenerator {
  private _exercises = [
    '写 3 句关于你窗外的景物',
    '用 5 个动词描述一个动作',
    '写一段对话（不写思考）',
    '列出 10 个形容词',
  ];

  generate(): string {
    return this._exercises[Math.floor(Math.random() * this._exercises.length)];
  }

  morningRoutine(): string[] {
    return [
      '晨间 5 分钟自由写',
      '回顾昨日 1 段',
      '设定今日 1 个小目标',
      '深呼吸，开始',
    ];
  }
}

// ============================================================================
// Engine 4: InspirationScraper
// ============================================================================

export class InspirationScraper {
  private _sources = ['news', 'dreams', 'songs', 'movies', 'conversations', 'nature', 'books', 'news', 'songs'];

  suggestSource(): string {
    return this._sources[Math.floor(Math.random() * this._sources.length)];
  }

  suggestBatch(n: number): string[] {
    const seen = new Set<string>();
    while (seen.size < n) seen.add(this.suggestSource());
    return Array.from(seen).slice(0, n);
  }
}

// ============================================================================
// Engine 5: WritingExerciseLibrary
// ============================================================================

export class WritingExerciseLibrary {
  private _exercises: { name: string; description: string; duration: number }[] = [
    { name: 'flash_fiction', description: '写 100 字短篇', duration: 15 },
    { name: 'character_interview', description: '采访自己的角色', duration: 30 },
    { name: 'setting_practice', description: '描写一个陌生地点', duration: 20 },
  ];

  getAll(): { name: string; description: string; duration: number }[] {
    return [...this._exercises];
  }

  findByDuration(maxMinutes: number): { name: string; description: string; duration: number }[] {
    return this._exercises.filter((e) => e.duration <= maxMinutes);
  }
}

// ============================================================================
// Engine 6: BlockJournalTracker
// ============================================================================

export interface BlockEntry {
  date: string;
  blockType: string;
  solution: string;
  effectiveness: number; // 0-1
}

export class BlockJournalTracker {
  private _entries: BlockEntry[] = [];

  record(entry: BlockEntry): void {
    this._entries.push(entry);
  }

  getAll(): BlockEntry[] {
    return [...this._entries];
  }

  mostEffectiveSolution(blockType: string): string | null {
    const filtered = this._entries.filter((e) => e.blockType === blockType);
    if (filtered.length === 0) return null;
    return filtered.reduce((best, e) => (e.effectiveness > best.effectiveness ? e : best)).solution;
  }
}

// ============================================================================
// Engine 7: MotivationRestorer
// ============================================================================

export class MotivationRestorer {
  private _quotes = [
    '写作是一场马拉松，不是短跑',
    '每一个好故事都从烂初稿开始',
    '今天的你比昨天的你写得好',
  ];

  inspire(): string {
    return this._quotes[Math.floor(Math.random() * this._quotes.length)];
  }

  microGoal(): string {
    return '今天只写 100 字就好';
  }

  remindWhyYouStarted(reason: string): string {
    return `记住你开始的原因：${reason}`;
  }
}

// ============================================================================
// Engine 8: FocusSessionManager
// ============================================================================

export interface FocusSession {
  duration: number;
  wordsTarget: number;
  startTime: number | null;
  endTime: number | null;
}

export class FocusSessionManager {
  start(duration: number, wordsTarget: number): FocusSession {
    return { duration, wordsTarget, startTime: Date.now(), endTime: null };
  }

  end(session: FocusSession, wordsWritten: number): { success: boolean; rate: number } {
    session.endTime = Date.now();
    return {
      success: wordsWritten >= session.wordsTarget,
      rate: wordsWritten / session.duration,
    };
  }

  suggestDuration(energyLevel: 'low' | 'medium' | 'high'): number {
    if (energyLevel === 'low') return 15;
    if (energyLevel === 'medium') return 30;
    return 60;
  }
}

// ============================================================================
// Engine 9: WritingStreakTracker
// ============================================================================

export class WritingStreakTracker {
  private _streak = 0;
  private _bestStreak = 0;
  private _lastDay: string | null = null;

  recordWrite(date: string, wrote: boolean): number {
    if (!wrote) {
      this._streak = 0;
      return this._streak;
    }
    if (this._lastDay !== date) {
      this._streak += 1;
      this._lastDay = date;
      this._bestStreak = Math.max(this._bestStreak, this._streak);
    }
    return this._streak;
  }

  currentStreak(): number {
    return this._streak;
  }

  bestStreak(): number {
    return this._bestStreak;
  }
}

// ============================================================================
// Engine 10: BlockResolutionIndex
// ============================================================================

export class BlockResolutionIndex {
  list(): string[] {
    return [
      'BlockSolutionRecommender', 'FreewritePromptGenerator', 'WritingWarmupGenerator',
      'InspirationScraper', 'WritingExerciseLibrary', 'BlockJournalTracker',
      'MotivationRestorer', 'FocusSessionManager', 'WritingStreakTracker',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AJ_BATCH_2_ENGINES = {
  BlockSolutionRecommender,
  FreewritePromptGenerator,
  WritingWarmupGenerator,
  InspirationScraper,
  WritingExerciseLibrary,
  BlockJournalTracker,
  MotivationRestorer,
  FocusSessionManager,
  WritingStreakTracker,
  BlockResolutionIndex,
} as const;
