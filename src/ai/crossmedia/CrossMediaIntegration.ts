/**
 * CrossMediaIntegration.ts — Direction AM, V3486-V3495 (Batch 3/3 收口)
 * Cross-Media Adaptation: 集成 + 收口
 *
 * 10 engines:
 * 1.  MediaAdapter — 媒体适配器
 * 2.  FormatConverter — 格式转换器
 * 3.  CharacterAdaptor — 角色适配
 * 4.  StoryArcAdapter — 故事弧适配
 * 5.  IPExpansionPlanner — IP 扩展规划
 * 6.  CrossMediaConsistency — 跨媒体一致性
 * 7.  MediaMetricsTracker — 媒体指标追踪
 * 8.  ReleaseStrategyPlanner — 发布策略
 * 9.  IPValueMaximizer — IP 价值最大化
 * 10. CrossMediaIndexFinal — 28 engines 收口
 *
 * 灵感：IP 衍生 / 跨媒体运营
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: MediaAdapter
// ============================================================================

export class MediaAdapter {
  private _adapters: Record<string, (text: string) => string> = {
    script: (text) => `[SCENE] ${text}`,
    panel: (text) => `|${text}|`,
    dialogue: (text) => `"${text}"`,
  };

  adapt(text: string, target: string): string {
    const adapter = this._adapters[target];
    return adapter ? adapter(text) : text;
  }

  supports(target: string): boolean {
    return target in this._adapters;
  }
}

// ============================================================================
// Engine 2: FormatConverter
// ============================================================================

export class FormatConverter {
  toJSON(data: Record<string, unknown>): string {
    return JSON.stringify(data, null, 2);
  }

  toMarkdown(title: string, content: string): string {
    return `# ${title}\n\n${content}`;
  }

  toYAML(data: Record<string, unknown>): string {
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n');
  }
}

// ============================================================================
// Engine 3: CharacterAdaptor
// ============================================================================

export class CharacterAdaptor {
  adapt(character: string, targetMedium: 'anime' | 'drama' | 'game' | 'novel'): { name: string; traits: string[]; visualCues: string[] } {
    const traitsMap: Record<string, string[]> = {
      anime: ['大眼', '夸张表情', '高饱和色彩'],
      drama: ['现实主义', '微妙表情', '自然光'],
      game: ['可互动', '有技能', '可升级'],
      novel: ['内心独白', '复杂动机', '深层心理'],
    };
    return {
      name: character,
      traits: traitsMap[targetMedium] || [],
      visualCues: targetMedium === 'anime' ? ['大眼睛', '彩色头发'] : [],
    };
  }
}

// ============================================================================
// Engine 4: StoryArcAdapter
// ============================================================================

export class StoryArcAdapter {
  adapt(arc: 'setup' | 'rising' | 'climax' | 'resolution', medium: 'novel' | 'anime' | 'game'): string[] {
    const novelArc = ['背景介绍', '冲突建立', '高潮', '解决'];
    const animeArc = ['OP', 'A part', 'B part', 'ED'];
    const gameArc = ['tutorial', 'quest 1', 'boss', 'credits'];
    const arcs: Record<string, string[]> = {
      novel: novelArc,
      anime: animeArc,
      game: gameArc,
    };
    const arcIndex = ['setup', 'rising', 'climax', 'resolution'].indexOf(arc);
    return [arcs[medium]?.[arcIndex] || ''];
  }
}

// ============================================================================
// Engine 5: IPExpansionPlanner
// ============================================================================

export class IPExpansionPlanner {
  plan(media: string[]): { sequence: string[]; totalDuration: string } {
    return {
      sequence: media,
      totalDuration: `${media.length * 6} 个月`,
    };
  }

  recommendExpansion(coreMedia: string): string[] {
    return [coreMedia, '漫画', '动画', '游戏', '周边'];
  }
}

// ============================================================================
// Engine 6: CrossMediaConsistency
// ============================================================================

export class CrossMediaConsistency {
  private _facts = new Map<string, string>();

  addFact(key: string, value: string): void {
    this._facts.set(key, value);
  }

  isConsistent(key: string, value: string): boolean {
    return this._facts.get(key) === value;
  }

  hasConflict(key: string): boolean {
    return this._facts.has(key);
  }
}

// ============================================================================
// Engine 7: MediaMetricsTracker
// ============================================================================

export class MediaMetricsTracker {
  private _metrics = new Map<string, number>();

  track(medium: string, metric: number): void {
    this._metrics.set(medium, metric);
  }

  get(medium: string): number {
    return this._metrics.get(medium) || 0;
  }

  bestPerforming(): string | null {
    let best: string | null = null;
    let bestVal = -1;
    for (const [m, v] of this._metrics) {
      if (v > bestVal) {
        bestVal = v;
        best = m;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 8: ReleaseStrategyPlanner
// ============================================================================

export class ReleaseStrategyPlanner {
  plan(media: string[], intervalDays: number = 30): { media: string; day: number }[] {
    return media.map((m, i) => ({ media: m, day: i * intervalDays }));
  }

  hasGap(schedule: { media: string; day: number }[], maxGap = 90): boolean {
    for (let i = 1; i < schedule.length; i++) {
      if (schedule[i].day - schedule[i - 1].day > maxGap) return true;
    }
    return false;
  }
}

// ============================================================================
// Engine 9: IPValueMaximizer
// ============================================================================

export class IPValueMaximizer {
  suggest(media: string[]): { media: string; value: number }[] {
    return media.map((m) => ({ media: m, value: this._baseValue(m) }));
  }

  private _baseValue(media: string): number {
    const values: Record<string, number> = {
      novel: 100,
      manga: 80,
      anime: 200,
      game: 300,
      film: 500,
      merchandise: 150,
    };
    return values[media] || 50;
  }

  totalValue(media: string[]): number {
    return this.suggest(media).reduce((s, m) => s + m.value, 0);
  }
}

// ============================================================================
// Engine 10: CrossMediaIndexFinal
// ============================================================================

export class CrossMediaIndexFinal {
  list(): string[] {
    return [
      'ScriptFormatter', 'SceneToScriptConverter', 'DialogueToSpeechConverter',
      'NarrativeToPanelConverter', 'PanelLayoutDesigner', 'VoiceBubblePlacer',
      'EffectSFXDesigner', 'GameSceneConverter', 'ChoiceBranchDesigner',
      'AnimeEpisodeDesigner', 'TVDramaEpisodeSplitter', 'MovieScreenplayAdapter',
      'WebComicPanelDesigner', 'AudiobookChapterDesigner', 'PodcastScriptWriter',
      'GameQuestDesigner', 'RPGDialogueWriter', 'VisualNovelScriptWriter',
      'MediaAdapter', 'FormatConverter', 'CharacterAdaptor',
      'StoryArcAdapter', 'IPExpansionPlanner', 'CrossMediaConsistency',
      'MediaMetricsTracker', 'ReleaseStrategyPlanner', 'IPValueMaximizer',
      'CrossMediaIndexFinal',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AM_BATCH_3_ENGINES = {
  MediaAdapter,
  FormatConverter,
  CharacterAdaptor,
  StoryArcAdapter,
  IPExpansionPlanner,
  CrossMediaConsistency,
  MediaMetricsTracker,
  ReleaseStrategyPlanner,
  IPValueMaximizer,
  CrossMediaIndexFinal,
} as const;

export type { Chapter };
