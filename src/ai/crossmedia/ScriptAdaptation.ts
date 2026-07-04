/**
 * ScriptAdaptation.ts — Direction AM, V3466-V3475 (Batch 1/3)
 * Cross-Media Adaptation: 小说→剧本→漫画→游戏
 *
 * 10 engines:
 * 1.  ScriptFormatter — 剧本格式化
 * 2.  SceneToScriptConverter — 场景转剧本
 * 3.  DialogueToSpeechConverter — 对话转台词
 * 4.  NarrativeToPanelConverter — 叙事转分镜
 * 5.  PanelLayoutDesigner — 分镜布局设计
 * 6.  VoiceBubblePlacer — 对话气泡放置
 * 7.  EffectSFXDesigner — 音效设计
 * 8.  GameSceneConverter — 游戏场景转换
 * 9.  ChoiceBranchDesigner — 选择分支设计
 * 10. ScriptAdaptationIndex — 收口
 *
 * 灵感：IP 衍生 / 小说→剧本→漫画→游戏
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: ScriptFormatter
// ============================================================================

export class ScriptFormatter {
  formatToScript(text: string): string {
    const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    return sentences.map((s) => `[SCENE] ${s.trim()}`).join('\n');
  }

  hasActionLines(text: string): boolean {
    return /\[SCENE\]/.test(text);
  }
}

// ============================================================================
// Engine 2: SceneToScriptConverter
// ============================================================================

export interface ScriptScene {
  setting: string;
  action: string;
  dialogue: string[];
}

export class SceneToScriptConverter {
  convert(text: string): ScriptScene {
    const dialogues: string[] = [];
    const actionLines: string[] = [];
    const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    for (const s of sentences) {
      if (/[""「」]/.test(s)) dialogues.push(s.trim());
      else actionLines.push(s.trim());
    }
    return {
      setting: actionLines[0] || '',
      action: actionLines.slice(1).join(' '),
      dialogue: dialogues,
    };
  }
}

// ============================================================================
// Engine 3: DialogueToSpeechConverter
// ============================================================================

export class DialogueToSpeechConverter {
  convert(dialogue: string, character: string): { character: string; line: string; emotion: string } {
    const emotionKeywords: Record<string, string[]> = {
      angry: ['怒', '气', '愤'],
      sad: ['哭', '泪', '伤'],
      happy: ['笑', '开心', '快乐'],
      surprise: ['惊', '意外', '竟然'],
    };
    let emotion = 'neutral';
    for (const [e, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some((k) => dialogue.includes(k))) {
        emotion = e;
        break;
      }
    }
    return { character, line: dialogue, emotion };
  }

  batchConvert(dialogues: { character: string; line: string }[]): { character: string; line: string; emotion: string }[] {
    return dialogues.map((d) => this.convert(d.line, d.character));
  }
}

// ============================================================================
// Engine 4: NarrativeToPanelConverter
// ============================================================================

export interface Panel {
  description: string;
  dialogue: string;
  duration: number;
}

export class NarrativeToPanelConverter {
  convert(text: string, panelsPerPage: number = 4): Panel[] {
    const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    const panels: Panel[] = [];
    let currentDescription = '';
    let currentDialogue = '';
    for (const s of sentences) {
      if (/[""「」]/.test(s)) currentDialogue = s.trim();
      else currentDescription += s.trim() + '。';
      if (currentDescription.length > 50) {
        panels.push({
          description: currentDescription,
          dialogue: currentDialogue,
          duration: 5,
        });
        currentDescription = '';
        currentDialogue = '';
      }
    }
    if (currentDescription) {
      panels.push({ description: currentDescription, dialogue: currentDialogue, duration: 5 });
    }
    return panels.slice(0, panelsPerPage * 5);
  }
}

// ============================================================================
// Engine 5: PanelLayoutDesigner
// ============================================================================

export class PanelLayoutDesigner {
  design(panelCount: number): string {
    if (panelCount <= 4) return '2x2 grid';
    if (panelCount <= 6) return '3x2 grid';
    if (panelCount <= 9) return '3x3 grid';
    return 'dynamic flow';
  }

  recommendPanelSize(importance: number): 'small' | 'medium' | 'large' {
    if (importance > 0.7) return 'large';
    if (importance > 0.4) return 'medium';
    return 'small';
  }
}

// ============================================================================
// Engine 6: VoiceBubblePlacer
// ============================================================================

export class VoiceBubblePlacer {
  place(dialogue: string, panelArea: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right'): string {
    return `${panelArea}: "${dialogue}"`;
  }

  isValidPlacement(placement: string): boolean {
    return /^(top|bottom)-(left|right):/.test(placement);
  }
}

// ============================================================================
// Engine 7: EffectSFXDesigner
// ============================================================================

export class EffectSFXDesigner {
  private _sfxKeywords: Record<string, string> = {
    '战斗': 'sword clash',
    '爆炸': 'boom',
    '脚步': 'footsteps',
    '风': 'wind whoosh',
    '水': 'water flow',
  };

  suggest(text: string): string[] {
    const suggestions: string[] = [];
    for (const [k, sfx] of Object.entries(this._sfxKeywords)) {
      if (text.includes(k)) suggestions.push(sfx);
    }
    return suggestions;
  }

  hasSFX(text: string): boolean {
    return this.suggest(text).length > 0;
  }
}

// ============================================================================
// Engine 8: GameSceneConverter
// ============================================================================

export interface GameScene {
  location: string;
  characters: string[];
  actions: string[];
  objects: string[];
}

export class GameSceneConverter {
  convert(text: string): GameScene {
    const sentences = text.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);
    const location = sentences[0] || '';
    const characters: string[] = [];
    const actions: string[] = [];
    const objects: string[] = [];
    for (const s of sentences) {
      if (/(他|她|我|你|他们)/.test(s) && !/[""「」]/.test(s)) characters.push(s.trim());
      else if (/[""「」]/.test(s)) actions.push(s.trim());
      else objects.push(s.trim());
    }
    return { location, characters: Array.from(new Set(characters)), actions, objects };
  }
}

// ============================================================================
// Engine 9: ChoiceBranchDesigner
// ============================================================================

export class ChoiceBranchDesigner {
  designChoice(point: string, options: string[]): { point: string; options: { text: string; consequence: string }[] } {
    return {
      point,
      options: options.map((o) => ({ text: o, consequence: `leads to ${o} path` })),
    };
  }

  hasMeaningfulChoice(options: string[]): boolean {
    return options.length >= 2;
  }
}

// ============================================================================
// Engine 10: ScriptAdaptationIndex
// ============================================================================

export class ScriptAdaptationIndex {
  list(): string[] {
    return [
      'ScriptFormatter', 'SceneToScriptConverter', 'DialogueToSpeechConverter',
      'NarrativeToPanelConverter', 'PanelLayoutDesigner', 'VoiceBubblePlacer',
      'EffectSFXDesigner', 'GameSceneConverter', 'ChoiceBranchDesigner',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AM_BATCH_1_ENGINES = {
  ScriptFormatter,
  SceneToScriptConverter,
  DialogueToSpeechConverter,
  NarrativeToPanelConverter,
  PanelLayoutDesigner,
  VoiceBubblePlacer,
  EffectSFXDesigner,
  GameSceneConverter,
  ChoiceBranchDesigner,
  ScriptAdaptationIndex,
} as const;

export type { Chapter };
