/**
 * InspirationCapture.ts — Direction AO, V3526-V3535 (Batch 1/3)
 * Inspiration Network: 灵感捕捉
 *
 * 10 engines:
 * 1.  InspirationCapture — 灵感捕捉
 * 2.  SourceTagger — 来源标签
 * 3.  InspirationCategorizer — 分类
 * 4.  MoodTracker — 情绪追踪
 * 5.  TriggerLogger — 触发器日志
 * 6.  InspirationRanker — 灵感排序
 * 7.  IdeaConnector — 想法连接
 * 8.  SparkFile — 火花文件
 * 9.  VoiceMemoCapture — 语音备忘
 * 10. InspirationCaptureIndex — 收口
 *
 * 灵感：创造力研究 / Steven Johnson《Where Good Ideas Come From》
 */

export interface Inspiration {
  id: string;
  content: string;
  source: string;
  category: string;
  mood: string;
  timestamp: number;
  tags: string[];
}

// ============================================================================
// Engine 1: InspirationCapture
// ============================================================================

export class InspirationCapture {
  private _inspirations: Inspiration[] = [];
  private _counter = 0;

  capture(content: string, source: string, category: string): Inspiration {
    this._counter += 1;
    const i: Inspiration = {
      id: `ins_${this._counter}`,
      content,
      source,
      category,
      mood: 'neutral',
      timestamp: Date.now(),
      tags: [],
    };
    this._inspirations.push(i);
    return i;
  }

  getAll(): Inspiration[] {
    return [...this._inspirations];
  }

  get(id: string): Inspiration | null {
    return this._inspirations.find((i) => i.id === id) || null;
  }
}

// ============================================================================
// Engine 2: SourceTagger
// ============================================================================

export class SourceTagger {
  private _tags = new Map<string, string[]>();

  tag(source: string, tag: string): void {
    if (!this._tags.has(source)) this._tags.set(source, []);
    if (!this._tags.get(source)!.includes(tag)) this._tags.get(source)!.push(tag);
  }

  getTags(source: string): string[] {
    return this._tags.get(source) || [];
  }

  isTagged(source: string, tag: string): boolean {
    return this.getTags(source).includes(tag);
  }
}

// ============================================================================
// Engine 3: InspirationCategorizer
// ============================================================================

export class InspirationCategorizer {
  private _categories = ['plot', 'character', 'setting', 'dialogue', 'theme', 'scene', 'visual', 'emotion'];

  categorize(text: string): string {
    const lower = text.toLowerCase();
    if (/剑|武|江湖/.test(text)) return 'plot';
    if (/人|角色|对话/.test(text)) return 'character';
    if (/城市|地方|背景|世界/.test(text)) return 'setting';
    if (/说|问|叫|喊/.test(text)) return 'dialogue';
    if (/爱|恨|情|主题/.test(text)) return 'theme';
    if (/场景|画面/.test(text)) return 'scene';
    if (/颜色|光|影|像/.test(text)) return 'visual';
    if (/感觉|心情|情绪/.test(text)) return 'emotion';
    return 'general';
  }

  getCategories(): string[] {
    return [...this._categories];
  }
}

// ============================================================================
// Engine 4: MoodTracker
// ============================================================================

export class MoodTracker {
  private _moods: { date: string; mood: string; intensity: number }[] = [];

  log(date: string, mood: string, intensity: number): void {
    this._moods.push({ date, mood, intensity: Math.max(0, Math.min(1, intensity)) });
  }

  averageMood(): { mood: string; intensity: number } {
    if (this._moods.length === 0) return { mood: 'neutral', intensity: 0 };
    const counts: Record<string, number> = {};
    let total = 0;
    for (const m of this._moods) {
      counts[m.mood] = (counts[m.mood] || 0) + m.intensity;
      total += m.intensity;
    }
    let best = 'neutral';
    let bestVal = 0;
    for (const [m, c] of Object.entries(counts)) {
      if (c > bestVal) { bestVal = c; best = m; }
    }
    return { mood: best, intensity: total / this._moods.length };
  }
}

// ============================================================================
// Engine 5: TriggerLogger
// ============================================================================

export class TriggerLogger {
  private _triggers: { trigger: string; idea: string; timestamp: number }[] = [];

  log(trigger: string, idea: string): void {
    this._triggers.push({ trigger, idea, timestamp: Date.now() });
  }

  getTriggersByType(type: string): { trigger: string; idea: string; timestamp: number }[] {
    return this._triggers.filter((t) => t.trigger.includes(type));
  }
}

// ============================================================================
// Engine 6: InspirationRanker
// ============================================================================

export class InspirationRanker {
  rank(inspirations: Inspiration[]): Inspiration[] {
    return [...inspirations].sort((a, b) => b.content.length - a.content.length);
  }

  topN(inspirations: Inspiration[], n: number): Inspiration[] {
    return this.rank(inspirations).slice(0, n);
  }
}

// ============================================================================
// Engine 7: IdeaConnector
// ============================================================================

export class IdeaConnector {
  private _connections: { a: string; b: string; relation: string }[] = [];

  connect(a: string, b: string, relation: string): void {
    this._connections.push({ a, b, relation });
  }

  findRelated(idea: string): { related: string; relation: string }[] {
    return this._connections
      .filter((c) => c.a === idea || c.b === idea)
      .map((c) => ({ related: c.a === idea ? c.b : c.a, relation: c.relation }));
  }
}

// ============================================================================
// Engine 8: SparkFile
// ============================================================================

export class SparkFile {
  private _sparks: string[] = [];

  add(spark: string): void {
    this._sparks.push(spark);
  }

  getRandom(): string {
    if (this._sparks.length === 0) return '';
    return this._sparks[Math.floor(Math.random() * this._sparks.length)];
  }

  getAll(): string[] {
    return [...this._sparks];
  }
}

// ============================================================================
// Engine 9: VoiceMemoCapture
// ============================================================================

export class VoiceMemoCapture {
  private _memos: { timestamp: number; duration: number; transcript: string }[] = [];

  record(duration: number, transcript: string): void {
    this._memos.push({ timestamp: Date.now(), duration, transcript });
  }

  getRecent(n: number = 5): { timestamp: number; duration: number; transcript: string }[] {
    return this._memos.slice(-n);
  }
}

// ============================================================================
// Engine 10: InspirationCaptureIndex
// ============================================================================

export class InspirationCaptureIndex {
  list(): string[] {
    return [
      'InspirationCapture', 'SourceTagger', 'InspirationCategorizer',
      'MoodTracker', 'TriggerLogger', 'InspirationRanker',
      'IdeaConnector', 'SparkFile', 'VoiceMemoCapture',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AO_BATCH_1_ENGINES = {
  InspirationCapture,
  SourceTagger,
  InspirationCategorizer,
  MoodTracker,
  TriggerLogger,
  InspirationRanker,
  IdeaConnector,
  SparkFile,
  VoiceMemoCapture,
  InspirationCaptureIndex,
} as const;
