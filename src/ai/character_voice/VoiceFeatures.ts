/**
 * VoiceFeatures.ts — Direction AH, V3316-V3325 (Batch 1/3)
 * Character Voice Differentiator: 角色声音特征提取
 *
 * 10 engines:
 * 1.  CharacterSpeechPattern — 角色说话模式
 * 2.  SentenceLengthByCharacter — 角色句长
 * 3.  VocabularyRichnessByCharacter — 词汇丰富度
 * 4.  QuestionFrequencyByCharacter — 提问频率
 * 5.  ExclamationByCharacter — 感叹频率
 * 6.  FillerWordsByCharacter — 口头禅
 * 7.  FormalityByCharacter — 正式度
 * 8.  DialectByCharacter — 方言
 * 9.  SlangByCharacter — 俚语
 * 10. VoiceFeaturesIndex — 收口
 *
 * 灵感：长篇多 POV 刚需 / 量化角色 voice fingerprint
 */

export interface CharacterLines {
  character: string;
  lines: string[];
}

// ============================================================================
// Engine 1: CharacterSpeechPattern
// ============================================================================

export class CharacterSpeechPattern {
  extract(character: string, lines: string[]): { avgLen: number; avgWords: number; pattern: string } {
    const totalLen = lines.reduce((s, l) => s + l.length, 0);
    const avgLen = lines.length > 0 ? totalLen / lines.length : 0;
    const totalWords = lines.reduce((s, l) => s + l.split(/\s+/).filter((w) => w.length > 0).length, 0);
    const avgWords = lines.length > 0 ? totalWords / lines.length : 0;
    let pattern = 'normal';
    if (avgLen < 10) pattern = 'terse';
    else if (avgLen > 50) pattern = 'verbose';
    return { avgLen, avgWords, pattern };
  }

  classify(avgLen: number): 'terse' | 'normal' | 'verbose' {
    if (avgLen < 10) return 'terse';
    if (avgLen > 50) return 'verbose';
    return 'normal';
  }
}

// ============================================================================
// Engine 2: SentenceLengthByCharacter
// ============================================================================

export class SentenceLengthByCharacter {
  compute(lines: string[]): { mean: number; stdev: number; median: number } {
    if (lines.length === 0) return { mean: 0, stdev: 0, median: 0 };
    const lengths = lines.map((l) => l.length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((s, l) => s + (l - mean) ** 2, 0) / lengths.length;
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return { mean, stdev: Math.sqrt(variance), median };
  }
}

// ============================================================================
// Engine 3: VocabularyRichnessByCharacter
// ============================================================================

export class VocabularyRichnessByCharacter {
  compute(lines: string[]): { ttr: number; uniqueWords: number; totalWords: number } {
    const words = lines.join(' ').split(/[\s，。！？,.\!?]+/).filter((w) => w.length > 0);
    const unique = new Set(words.map((w) => w.toLowerCase()));
    return {
      ttr: words.length === 0 ? 0 : unique.size / words.length,
      uniqueWords: unique.size,
      totalWords: words.length,
    };
  }

  isRich(lines: string[], threshold = 0.6): boolean {
    return this.compute(lines).ttr >= threshold;
  }
}

// ============================================================================
// Engine 4: QuestionFrequencyByCharacter
// ============================================================================

export class QuestionFrequencyByCharacter {
  private _questionPatterns = [/[？?]/, /什么/, /怎么/, /为什么/, /哪/, /谁/, /what/i, /why/i, /how/i, /who/i, /where/i];

  count(lines: string[]): number {
    let count = 0;
    for (const line of lines) {
      for (const p of this._questionPatterns) {
        if (p.test(line)) {
          count += 1;
          break;
        }
      }
    }
    return count;
  }

  rate(lines: string[]): number {
    if (lines.length === 0) return 0;
    return this.count(lines) / lines.length;
  }
}

// ============================================================================
// Engine 5: ExclamationByCharacter
// ============================================================================

export class ExclamationByCharacter {
  count(lines: string[]): number {
    let count = 0;
    for (const line of lines) {
      if (/[！!]/.test(line)) count += 1;
    }
    return count;
  }

  rate(lines: string[]): number {
    if (lines.length === 0) return 0;
    return this.count(lines) / lines.length;
  }
}

// ============================================================================
// Engine 6: FillerWordsByCharacter
// ============================================================================

export class FillerWordsByCharacter {
  private _fillerWords = ['呃', '嗯', '啊', '那个', '这个', 'um', 'uh', 'like', 'you know', 'well'];

  count(lines: string[]): { word: string; count: number }[] {
    const text = lines.join(' ').toLowerCase();
    return this._fillerWords
      .map((w) => ({ word: w, count: (text.match(new RegExp(w.toLowerCase(), 'g')) || []).length }))
      .filter((x) => x.count > 0);
  }

  isFillerHeavy(lines: string[], threshold = 3): boolean {
    const total = this.count(lines).reduce((s, x) => s + x.count, 0);
    return total >= threshold;
  }
}

// ============================================================================
// Engine 7: FormalityByCharacter
// ============================================================================

export class FormalityByCharacter {
  private _formalMarkers = ['的', '了', '是', '在', '并且', '而且', '因此', '故', 'shall', 'therefore', 'furthermore', 'hence'];
  private _informalMarkers = ['啥', '咋', '甭', '俺', '嘚', 'gonna', 'wanna', 'yeah', 'nope'];

  score(lines: string[]): number {
    const text = lines.join(' ').toLowerCase();
    const f = this._formalMarkers.filter((m) => text.includes(m.toLowerCase())).length;
    const i = this._informalMarkers.filter((m) => text.includes(m.toLowerCase())).length;
    const total = f + i;
    return total === 0 ? 0.5 : f / total;
  }

  classify(score: number): 'formal' | 'casual' | 'neutral' {
    if (score > 0.7) return 'formal';
    if (score < 0.3) return 'casual';
    return 'neutral';
  }
}

// ============================================================================
// Engine 8: DialectByCharacter
// ============================================================================

export class DialectByCharacter {
  private _dialectKeywords: Record<string, string[]> = {
    northern: ['儿', '咱', '北京', '胡同', 'nothern'],
    southern: ['侬', '嘎', '上海', '广州', 'southern'],
    western: ['额', '咧', '西安', '成都', 'western'],
  };

  detect(lines: string[]): string | null {
    const text = lines.join(' ');
    for (const [dialect, keywords] of Object.entries(this._dialectKeywords)) {
      if (keywords.some((k) => text.includes(k))) return dialect;
    }
    return null;
  }

  hasDialect(lines: string[]): boolean {
    return this.detect(lines) !== null;
  }
}

// ============================================================================
// Engine 9: SlangByCharacter
// ============================================================================

export class SlangByCharacter {
  private _slangWords = ['666', '绝绝子', 'yyds', '躺平', '内卷', 'pua', 'emo', 'social', 'stan'];

  count(lines: string[]): { word: string; count: number }[] {
    const text = lines.join(' ');
    return this._slangWords
      .map((w) => ({ word: w, count: (text.match(new RegExp(w, 'g')) || []).length }))
      .filter((x) => x.count > 0);
  }

  isSlangHeavy(lines: string[], threshold = 2): boolean {
    const total = this.count(lines).reduce((s, x) => s + x.count, 0);
    return total >= threshold;
  }
}

// ============================================================================
// Engine 10: VoiceFeaturesIndex
// ============================================================================

export class VoiceFeaturesIndex {
  list(): string[] {
    return [
      'CharacterSpeechPattern', 'SentenceLengthByCharacter', 'VocabularyRichnessByCharacter',
      'QuestionFrequencyByCharacter', 'ExclamationByCharacter', 'FillerWordsByCharacter',
      'FormalityByCharacter', 'DialectByCharacter', 'SlangByCharacter',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AH_BATCH_1_ENGINES = {
  CharacterSpeechPattern,
  SentenceLengthByCharacter,
  VocabularyRichnessByCharacter,
  QuestionFrequencyByCharacter,
  ExclamationByCharacter,
  FillerWordsByCharacter,
  FormalityByCharacter,
  DialectByCharacter,
  SlangByCharacter,
  VoiceFeaturesIndex,
} as const;
