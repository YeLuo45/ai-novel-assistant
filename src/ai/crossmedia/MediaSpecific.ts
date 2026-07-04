/**
 * MediaSpecific.ts — Direction AM, V3476-V3485 (Batch 2/3)
 * Cross-Media Adaptation: 媒体特定工具
 *
 * 10 engines:
 * 1.  AnimeEpisodeDesigner — 动画集设计
 * 2.  TVDramaEpisodeSplitter — 电视剧分集
 * 3.  MovieScreenplayAdapter — 电影剧本改编
 * 4.  WebComicPanelDesigner — 网络漫画分镜
 * 5.  AudiobookChapterDesigner — 有声书章节
 * 6.  PodcastScriptWriter — 播客脚本
 * 7.  GameQuestDesigner — 游戏任务
 * 8.  RPGDialogueWriter — RPG 对白
 * 9.  VisualNovelScriptWriter — 视觉小说脚本
 * 10. MediaSpecificIndex — 收口
 *
 * 灵感：IP 衍生 / 各种媒介
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: AnimeEpisodeDesigner
// ============================================================================

export class AnimeEpisodeDesigner {
  design(episodeNumber: number, content: string): { episode: number; duration: number; scenes: number; hook: string } {
    const sentences = content.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    const hook = sentences[0] || '';
    return {
      episode: episodeNumber,
      duration: 24,
      scenes: Math.min(20, Math.max(5, sentences.length / 5)),
      hook,
    };
  }
}

// ============================================================================
// Engine 2: TVDramaEpisodeSplitter
// ============================================================================

export class TVDramaEpisodeSplitter {
  private _targetMinutes = 45;

  split(chapters: Chapter[], wordsPerMinute = 300): { episode: number; chapters: number[]; minutes: number }[] {
    const episodes: { episode: number; chapters: number[]; minutes: number }[] = [];
    let current: number[] = [];
    let currentWords = 0;
    const targetWords = this._targetMinutes * wordsPerMinute;
    for (let i = 0; i < chapters.length; i++) {
      const wc = (chapters[i].content?.length || 0) / 2; // rough Chinese estimate
      if (currentWords + wc > targetWords && current.length > 0) {
        episodes.push({ episode: episodes.length + 1, chapters: current, minutes: currentWords / wordsPerMinute });
        current = [];
        currentWords = 0;
      }
      current.push(i);
      currentWords += wc;
    }
    if (current.length > 0) {
      episodes.push({ episode: episodes.length + 1, chapters: current, minutes: currentWords / wordsPerMinute });
    }
    return episodes;
  }
}

// ============================================================================
// Engine 3: MovieScreenplayAdapter
// ============================================================================

export class MovieScreenplayAdapter {
  private _targetScenes = 40;

  adapt(chapters: Chapter[]): { act: number; scenes: string[] } {
    const allText = chapters.map((c) => c.content || '').join('\n');
    const sentences = allText.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    const scenesPerAct = Math.ceil(this._targetScenes / 3);
    return {
      act: 1,
      scenes: sentences.slice(0, scenesPerAct),
    };
  }

  countActs(): number {
    return 3;
  }
}

// ============================================================================
// Engine 4: WebComicPanelDesigner
// ============================================================================

export class WebComicPanelDesigner {
  design(panelCount: number, scrollable: boolean = true): { panels: number; layout: string; recommendedHeight: number } {
    const layout = scrollable ? 'vertical scroll' : 'grid';
    return {
      panels: panelCount,
      layout,
      recommendedHeight: panelCount * 400,
    };
  }
}

// ============================================================================
// Engine 5: AudiobookChapterDesigner
// ============================================================================

export class AudiobookChapterDesigner {
  design(chapter: Chapter, wordsPerMinute = 200): { durationMinutes: number; narratorNotes: string[] } {
    const words = (chapter.content?.length || 0) / 2;
    return {
      durationMinutes: words / wordsPerMinute,
      narratorNotes: ['Pause at dialogue changes', 'Adjust tone for emotion'],
    };
  }
}

// ============================================================================
// Engine 6: PodcastScriptWriter
// ============================================================================

export class PodcastScriptWriter {
  writeScript(topic: string, duration: number): { intro: string; main: string; outro: string } {
    return {
      intro: `欢迎来到本期播客，今天我们聊${topic}`,
      main: `主要讨论${topic}的核心内容（约${duration - 5}分钟）`,
      outro: '感谢收听，我们下次再见',
    };
  }
}

// ============================================================================
// Engine 7: GameQuestDesigner
// ============================================================================

export class GameQuestDesigner {
  design(name: string, objective: string, reward: string): { name: string; objective: string; reward: string; steps: string[] } {
    return {
      name,
      objective,
      reward,
      steps: ['接受任务', '完成任务目标', '返回交付', '获得奖励'],
    };
  }
}

// ============================================================================
// Engine 8: RPGDialogueWriter
// ============================================================================

export class RPGDialogueWriter {
  write(character: string, state: 'greeting' | 'quest' | 'trade' | 'farewell'): string {
    const dialogues: Record<string, string> = {
      greeting: `你好，旅行者。我是${character}。`,
      quest: `我有一个任务给你。`,
      trade: `想看看我的商品吗？`,
      farewell: `再见，勇者。`,
    };
    return dialogues[state];
  }
}

// ============================================================================
// Engine 9: VisualNovelScriptWriter
// ============================================================================

export class VisualNovelScriptWriter {
  write(scene: string, character: string, emotion: string, line: string): { scene: string; character: string; emotion: string; line: string; background: string } {
    return {
      scene,
      character,
      emotion,
      line,
      background: `${scene}_bg.png`,
    };
  }
}

// ============================================================================
// Engine 10: MediaSpecificIndex
// ============================================================================

export class MediaSpecificIndex {
  list(): string[] {
    return [
      'AnimeEpisodeDesigner', 'TVDramaEpisodeSplitter', 'MovieScreenplayAdapter',
      'WebComicPanelDesigner', 'AudiobookChapterDesigner', 'PodcastScriptWriter',
      'GameQuestDesigner', 'RPGDialogueWriter', 'VisualNovelScriptWriter',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AM_BATCH_2_ENGINES = {
  AnimeEpisodeDesigner,
  TVDramaEpisodeSplitter,
  MovieScreenplayAdapter,
  WebComicPanelDesigner,
  AudiobookChapterDesigner,
  PodcastScriptWriter,
  GameQuestDesigner,
  RPGDialogueWriter,
  VisualNovelScriptWriter,
  MediaSpecificIndex,
} as const;

export type { Chapter };
