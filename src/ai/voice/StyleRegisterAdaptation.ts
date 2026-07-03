/**
 * StyleRegisterAdaptation.ts — Direction AD, V3216-V3225 (Batch 3/3 收口)
 * Voice & Style Fingerprint: 文体识别/转换 + 训练数据 + 收口
 *
 * 10 engines:
 * 1.  StyleTrainingDataGenerator — 训练数据生成
 * 2.  StyleComparison — 两作者相似度
 * 3.  StyleDriftDetector — 风格漂移检测
 * 4.  StyleConsistencyScorer — 一致性评分
 * 5.  AuthorIdentifier — 猜作者
 * 6.  GenreStyleRecognizer — 文体识别
 * 7.  EraStyleRecognizer — 时代风格
 * 8.  SentenceLevelTransfer — 句级转换
 * 9.  ParagraphMixer — 段落混合
 * 10. VoiceStyleIndex — 30 engines 收口
 */

// ============================================================================
// Engine 1: StyleTrainingDataGenerator
// ============================================================================

export class StyleTrainingDataGenerator {
  generate(author: string, samples: string[]): { author: string; text: string; features: Record<string, number> }[] {
    return samples.map((text) => ({
      author,
      text,
      features: this._extractFeatures(text),
    }));
  }

  private _extractFeatures(text: string): Record<string, number> {
    const sentences = text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/[\s，。！？,.\!?]+/).filter((w) => w.length > 0);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    return {
      avgSentenceLength: sentences.length > 0 ? text.length / sentences.length : 0,
      sentenceCount: sentences.length,
      uniqueWordRatio: words.length > 0 ? uniqueWords.size / words.length : 0,
    };
  }
}

// ============================================================================
// Engine 2: StyleComparison
// ============================================================================

export class StyleComparison {
  compare(a: string, b: string): number {
    const featuresA = this._extract(a);
    const featuresB = this._extract(b);
    let diff = 0;
    let count = 0;
    for (const k of Object.keys(featuresA)) {
      if (k in featuresB) {
        diff += Math.abs(featuresA[k] - featuresB[k]);
        count += 1;
      }
    }
    return count > 0 ? diff / count : 1;
  }

  isSimilar(a: string, b: string, threshold = 5): boolean {
    return this.compare(a, b) < threshold;
  }

  private _extract(text: string): Record<string, number> {
    const sentences = text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/[\s，。！？,.\!?]+/).filter((w) => w.length > 0);
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    return {
      avgLen: sentences.length > 0 ? text.length / sentences.length : 0,
      diversity: words.length > 0 ? uniqueWords.size / words.length : 0,
    };
  }
}

// ============================================================================
// Engine 3: StyleDriftDetector
// ============================================================================

export class StyleDriftDetector {
  private _fingerprints: { chapter: number; features: Record<string, number> }[] = [];

  track(chapter: number, features: Record<string, number>): void {
    this._fingerprints.push({ chapter, features });
  }

  detectDrift(threshold = 0.3): { driftChapter: number; severity: number } | null {
    if (this._fingerprints.length < 2) return null;
    for (let i = 1; i < this._fingerprints.length; i++) {
      const prev = this._fingerprints[i - 1].features;
      const curr = this._fingerprints[i].features;
      let diff = 0;
      let count = 0;
      for (const k of Object.keys(prev)) {
        if (k in curr) {
          diff += Math.abs(prev[k] - curr[k]);
          count += 1;
        }
      }
      const avg = count > 0 ? diff / count : 0;
      if (avg > threshold) {
        return { driftChapter: this._fingerprints[i].chapter, severity: avg };
      }
    }
    return null;
  }
}

// ============================================================================
// Engine 4: StyleConsistencyScorer
// ============================================================================

export class StyleConsistencyScorer {
  score(fingerprints: Record<string, number>[]): number {
    if (fingerprints.length < 2) return 1;
    let totalDiff = 0;
    let comparisons = 0;
    for (let i = 1; i < fingerprints.length; i++) {
      const prev = fingerprints[i - 1];
      const curr = fingerprints[i];
      let diff = 0;
      let count = 0;
      for (const k of Object.keys(prev)) {
        if (k in curr) {
          diff += Math.abs(prev[k] - curr[k]);
          count += 1;
        }
      }
      totalDiff += count > 0 ? diff / count : 0;
      comparisons += 1;
    }
    const avgDiff = comparisons > 0 ? totalDiff / comparisons : 0;
    return Math.max(0, 1 - avgDiff);
  }

  isConsistent(fingerprints: Record<string, number>[], threshold = 0.7): boolean {
    return this.score(fingerprints) >= threshold;
  }
}

// ============================================================================
// Engine 5: AuthorIdentifier
// ============================================================================

export class AuthorIdentifier {
  private _candidates: { name: string; sample: string }[] = [];

  addCandidate(name: string, sample: string): void {
    this._candidates.push({ name, sample });
  }

  identify(text: string): { author: string; confidence: number } {
    if (this._candidates.length === 0) return { author: 'unknown', confidence: 0 };
    const comp = new StyleComparison();
    let bestName = this._candidates[0].name;
    let bestDiff = comp.compare(text, this._candidates[0].sample);
    for (const c of this._candidates.slice(1)) {
      const diff = comp.compare(text, c.sample);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestName = c.name;
      }
    }
    return { author: bestName, confidence: Math.max(0, 1 - bestDiff / 10) };
  }
}

// ============================================================================
// Engine 6: GenreStyleRecognizer
// ============================================================================

export class GenreStyleRecognizer {
  private _genres: Record<string, string[]> = {
    novel: ['人物', '情节', '场景', 'character', 'plot'],
    poem: ['押韵', '意象', '分行', 'rhyme', 'imagery'],
    essay: ['观点', '论证', '反思', 'argument', 'reflection'],
    drama: ['对话', '舞台', '动作', 'dialogue', 'stage'],
  };

  recognize(text: string): string | null {
    const lower = text.toLowerCase();
    let best = 'novel';
    let bestCount = 0;
    for (const [genre, keywords] of Object.entries(this._genres)) {
      const count = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
      if (count > bestCount) {
        bestCount = count;
        best = genre;
      }
    }
    return best;
  }

  isGenre(text: string, genre: string, threshold = 2): boolean {
    const lower = text.toLowerCase();
    const keywords = this._genres[genre] || [];
    return keywords.filter((k) => lower.includes(k.toLowerCase())).length >= threshold;
  }
}

// ============================================================================
// Engine 7: EraStyleRecognizer
// ============================================================================

export class EraStyleRecognizer {
  private _eras: Record<string, string[]> = {
    ancient: ['之', '乎', '者', '矣', '焉', '乃', '古'],
    classical: ['的', '了', '是', '在', '他', '她'],
    modern: ['的', '了', '是', '在', '并且', '而且'],
    future: ['AI', '芯片', '全息', 'holo', 'chip', 'neural'],
  };

  recognize(text: string): string | null {
    let best = 'modern';
    let bestCount = 0;
    for (const [era, keywords] of Object.entries(this._eras)) {
      const count = keywords.filter((k) => text.includes(k)).length;
      if (count > bestCount) {
        bestCount = count;
        best = era;
      }
    }
    return best;
  }

  isEra(text: string, era: string, threshold = 2): boolean {
    const keywords = this._eras[era] || [];
    return keywords.filter((k) => text.includes(k)).length >= threshold;
  }
}

// ============================================================================
// Engine 8: SentenceLevelTransfer
// ============================================================================

export class SentenceLevelTransfer {
  transfer(text: string, targetStyle: string): string {
    const sentences = text.split(/([。！？.!?]+)/);
    return sentences.map((s) => {
      if (/[。！？.!?]/.test(s)) return s;
      return s.trim() ? `[${targetStyle}] ${s}` : s;
    }).join('');
  }

  countSentences(text: string): number {
    return text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0).length;
  }
}

// ============================================================================
// Engine 9: ParagraphMixer
// ============================================================================

export class ParagraphMixer {
  mix(paragraphs: string[]): string {
    // Alternate first half and second half
    if (paragraphs.length < 2) return paragraphs.join('\n');
    const result: string[] = [];
    const maxLen = Math.max(...paragraphs.map((p) => p.length));
    for (let i = 0; i < maxLen; i++) {
      for (const p of paragraphs) {
        if (i < p.length) result.push(p[i]);
      }
    }
    return result.join('');
  }

  isValidInput(paragraphs: string[]): boolean {
    return paragraphs.length > 0 && paragraphs.every((p) => p.length > 0);
  }
}

// ============================================================================
// Engine 10: VoiceStyleIndex
// ============================================================================

export class VoiceStyleIndex {
  list(): string[] {
    return [
      'AuthorStyleFingerprint', 'LuXunStyle', 'LaoSheStyle', 'ZhangAilingStyle',
      'JinYongStyle', 'GuLongStyle', 'HemingwayStyle', 'FitzgeraldStyle',
      'JKRowlingStyle', 'StyleSimilarity',
      'HigashinoKeigoStyle', 'MurakamiHarukiStyle', 'NatsumeSosekiStyle', 'LuXunModernStyle',
      'WenYanWenConverter', 'StyleTransfer', 'StyleMixer', 'StyleEvolution',
      'StyleMaturity', 'ParagraphLevelTransfer',
      'StyleTrainingDataGenerator', 'StyleComparison', 'StyleDriftDetector',
      'StyleConsistencyScorer', 'AuthorIdentifier', 'GenreStyleRecognizer',
      'EraStyleRecognizer', 'SentenceLevelTransfer', 'ParagraphMixer',
      'VoiceStyleIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AD_BATCH_3_ENGINES = {
  StyleTrainingDataGenerator,
  StyleComparison,
  StyleDriftDetector,
  StyleConsistencyScorer,
  AuthorIdentifier,
  GenreStyleRecognizer,
  EraStyleRecognizer,
  SentenceLevelTransfer,
  ParagraphMixer,
  VoiceStyleIndex,
} as const;
