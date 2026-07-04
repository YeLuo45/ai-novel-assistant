/**
 * BlockDetection.ts — Direction AJ, V3376-V3385 (Batch 1/3)
 * Author Block Breaker: 创作瓶颈检测
 *
 * 10 engines:
 * 1.  BlockTypeDetector — 瓶颈类型检测
 * 2.  WriterBlockAnalyzer — 写作瓶颈分析
 * 3.  ProcrastinationDetector — 拖延检测
 * 4.  BurnoutDetector — 倦怠检测
 * 5.  CreativeBlockBreaker — 创意瓶颈突破
 * 6.  PlotBlockBreaker — 情节瓶颈突破
 * 7.  CharacterBlockBreaker — 角色瓶颈突破
 * 8.  DialogueBlockBreaker — 对话瓶颈突破
 * 9.  DescriptionBlockBreaker — 描写瓶颈突破
 * 10. BlockDetectionIndex — 收口
 *
 * 灵感：写作者心理 / 创作瓶颈突破
 */

export type BlockType = 'plot' | 'character' | 'dialogue' | 'description' | 'motivation' | 'general';

// ============================================================================
// Engine 1: BlockTypeDetector
// ============================================================================

export class BlockTypeDetector {
  private _indicators: Record<BlockType, string[]> = {
    plot: ['不知道接下来', '剧情卡', '主线不清', 'plot stuck', 'no idea what happens'],
    character: ['角色不活了', '人物卡', '写不出角色', 'character stuck', 'character flat'],
    dialogue: ['对话干', '不会写对话', '对话像说明文', 'dialogue stuck', 'dialogue awkward'],
    description: ['描写不会', '环境写不出', '不会写景', 'description hard', 'setting blank'],
    motivation: ['不想写', '没动力', '累了', 'no motivation', 'tired', 'exhausted'],
    general: ['卡文', '写不动', 'block', 'stuck'],
  };

  detect(text: string): BlockType {
    const lower = text.toLowerCase();
    for (const [type, indicators] of Object.entries(this._indicators)) {
      if (indicators.some((k) => lower.includes(k.toLowerCase()))) {
        return type as BlockType;
      }
    }
    return 'general';
  }

  isBlock(text: string): boolean {
    return this.detect(text) !== 'general' || /卡文|stuck|block/.test(text.toLowerCase());
  }
}

// ============================================================================
// Engine 2: WriterBlockAnalyzer
// ============================================================================

export class WriterBlockAnalyzer {
  analyze(writingHistory: { date: string; wordsWritten: number }[]): {
    avgWords: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    blockSeverity: number;
  } {
    if (writingHistory.length === 0) return { avgWords: 0, trend: 'stable', blockSeverity: 0 };
    const total = writingHistory.reduce((s, h) => s + h.wordsWritten, 0);
    const avg = total / writingHistory.length;
    const recent = writingHistory.slice(-3);
    const older = writingHistory.slice(0, Math.max(1, writingHistory.length - 3));
    const recentAvg = recent.reduce((s, h) => s + h.wordsWritten, 0) / recent.length;
    const olderAvg = older.reduce((s, h) => s + h.wordsWritten, 0) / older.length;
    const trend = recentAvg > olderAvg * 1.2 ? 'increasing' : recentAvg < olderAvg * 0.8 ? 'decreasing' : 'stable';
    const blockSeverity = trend === 'decreasing' ? Math.min(1, (olderAvg - recentAvg) / olderAvg) : 0;
    return { avgWords: avg, trend, blockSeverity };
  }
}

// ============================================================================
// Engine 3: ProcrastinationDetector
// ============================================================================

export class ProcrastinationDetector {
  detect(signals: { startedOnTime: boolean; pausedFrequently: boolean; missedDeadlines: boolean }[]): {
    procrastinationScore: number;
    isProcrastinating: boolean;
  } {
    const score = signals.reduce((s, sig) => {
      let v = 0;
      if (!sig.startedOnTime) v += 0.3;
      if (sig.pausedFrequently) v += 0.3;
      if (sig.missedDeadlines) v += 0.4;
      return s + v;
    }, 0) / Math.max(1, signals.length);
    return {
      procrastinationScore: Math.min(1, score),
      isProcrastinating: score > 0.5,
    };
  }
}

// ============================================================================
// Engine 4: BurnoutDetector
// ============================================================================

export class BurnoutDetector {
  private _burnoutKeywords = ['累', '疲惫', '筋疲力尽', 'burned out', 'exhausted', 'tired', 'drained', 'no energy', 'apathy'];

  detect(text: string): number {
    const lower = text.toLowerCase();
    return Math.min(1, this._burnoutKeywords.filter((k) => lower.includes(k.toLowerCase())).length / 3);
  }

  isBurnedOut(text: string, threshold = 0.5): boolean {
    return this.detect(text) >= threshold;
  }
}

// ============================================================================
// Engine 5: CreativeBlockBreaker
// ============================================================================

export class CreativeBlockBreaker {
  private _prompts = [
    '想想你的主角最害怕什么',
    '把场景倒着写',
    '加入一个不速之客',
    '让角色做出最不寻常的选择',
    '改变场景的时间',
  ];

  suggestPrompts(blockType: BlockType, n: number = 3): string[] {
    const prompts: Record<BlockType, string[]> = {
      plot: ['改变一个角色的秘密', '加一个新角色', '让旧敌变成新盟友'],
      character: ['让角色做出违背性格的事', '揭示隐藏的过去', '加入家人'],
      dialogue: ['让角色沉默', '加入肢体语言', '让对话被打断'],
      description: ['用 5 感描写', '从角色视角描写', '对比强烈色彩'],
      motivation: ['设定小目标', '和朋友写作', '回忆初心'],
      general: this._prompts,
    };
    return (prompts[blockType] || this._prompts).slice(0, n);
  }
}

// ============================================================================
// Engine 6: PlotBlockBreaker
// ============================================================================

export class PlotBlockBreaker {
  private _techniques = [
    '加入新角色',
    '让秘密被揭露',
    '时间跳跃',
    '引入新地点',
    '让主角失败',
    '反派获胜',
  ];

  suggestTechniques(n: number = 3): string[] {
    return this._techniques.slice(0, n);
  }

  isStuck(ideas: string[], threshold = 1): boolean {
    return ideas.length < threshold;
  }
}

// ============================================================================
// Engine 7: CharacterBlockBreaker
// ============================================================================

export class CharacterBlockBreaker {
  suggestActions(character: string, n: number = 3): string[] {
    return [
      `${character} 突然做出反常的事`,
      `${character} 遇到家人`,
      `${character} 获得新能力`,
    ].slice(0, n);
  }

  suggestMotivations(character: string): string[] {
    return [
      `${character} 想要保护某人`,
      `${character} 想要复仇`,
      `${character} 想要证明自己`,
    ];
  }
}

// ============================================================================
// Engine 8: DialogueBlockBreaker
// ============================================================================

export class DialogueBlockBreaker {
  private _openers = [
    '你为什么...',
    '我从来没有...',
    '如果我们...',
    '我记得...',
    '也许...',
  ];

  suggestOpeners(n: number = 3): string[] {
    return this._openers.slice(0, n);
  }

  addConflict(situation: string): string {
    return `${situation} 但对方不同意`;
  }
}

// ============================================================================
// Engine 9: DescriptionBlockBreaker
// ============================================================================

export class DescriptionBlockBreaker {
  private _senses = ['视觉', '听觉', '嗅觉', '触觉', '味觉', 'sight', 'sound', 'smell', 'touch', 'taste'];

  suggestBySense(sense: string, n: number = 3): string[] {
    return [`${sense}描写：`, `${sense}变化：`, `${sense}对比：`].slice(0, n);
  }

  allSenses(): string[] {
    return [...this._senses];
  }
}

// ============================================================================
// Engine 10: BlockDetectionIndex
// ============================================================================

export class BlockDetectionIndex {
  list(): string[] {
    return [
      'BlockTypeDetector', 'WriterBlockAnalyzer', 'ProcrastinationDetector',
      'BurnoutDetector', 'CreativeBlockBreaker', 'PlotBlockBreaker',
      'CharacterBlockBreaker', 'DialogueBlockBreaker', 'DescriptionBlockBreaker',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AJ_BATCH_1_ENGINES = {
  BlockTypeDetector,
  WriterBlockAnalyzer,
  ProcrastinationDetector,
  BurnoutDetector,
  CreativeBlockBreaker,
  PlotBlockBreaker,
  CharacterBlockBreaker,
  DialogueBlockBreaker,
  DescriptionBlockBreaker,
  BlockDetectionIndex,
} as const;
