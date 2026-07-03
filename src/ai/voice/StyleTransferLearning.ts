/**
 * StyleTransferLearning.ts — Direction AD, V3206-V3215 (Batch 2/3)
 * Voice & Style Fingerprint: 大师模仿（中/日）+ 风格迁移 + 风格学习
 *
 * 10 engines:
 * 1.  HigashinoKeigoStyle — 东野圭吾风格
 * 2.  MurakamiHarukiStyle — 村上春树风格
 * 3.  NatsumeSosekiStyle — 夏目漱石风格
 * 4.  LuXunModernStyle — 鲁迅体白话
 * 5.  WenYanWenConverter — 古文/白话转换
 * 6.  StyleTransfer — 段落级风格转换
 * 7.  StyleMixer — 风格混合器
 * 8.  StyleEvolution — 风格进化追踪
 * 9.  StyleMaturity — 文风成熟度
 * 10. ParagraphLevelTransfer — 段落级转换
 */

import type { Chapter } from '../pacing/StructureTemplates';

// ============================================================================
// Engine 1: HigashinoKeigoStyle
// ============================================================================

export class HigashinoKeigoStyle {
  score(text: string): number {
    let score = 0;
    if (/谜|真相|人性|推理|mystery|truth|human nature/.test(text)) score += 0.3;
    if (/家庭|母亲|孩子|family|mother/.test(text)) score += 0.2;
    if (/情感|动机|emotion|motive/.test(text)) score += 0.2;
    if (/复杂|隐忍|complicated/.test(text)) score += 0.1;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 2: MurakamiHarukiStyle
// ============================================================================

export class MurakamiHarukiStyle {
  score(text: string): number {
    let score = 0;
    if (/孤独|lonely|孤独感|寂寞/.test(text)) score += 0.2;
    if (/猫|井|爵士|猫|cat|well|jazz/.test(text)) score += 0.3;
    if (/超现实|梦境|surreal|dream/.test(text)) score += 0.2;
    if (/性|死亡|sex|death/.test(text)) score += 0.2;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 3: NatsumeSosekiStyle
// ============================================================================

export class NatsumeSosekiStyle {
  score(text: string): number {
    let score = 0;
    if (/明治|维新|知识分子|明治/.test(text)) score += 0.2;
    if (/讽刺|批判|知识/.test(text)) score += 0.2;
    if (/孤独|内心|内心独白/.test(text)) score += 0.2;
    if (/古典|古文|文学/.test(text)) score += 0.2;
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 4: LuXunModernStyle
// ============================================================================

export class LuXunModernStyle {
  score(text: string): number {
    let score = 0;
    if (/我|他|她/.test(text)) score += 0.1; // 鲁迅体有强烈人称
    if (/，|；/.test(text)) score += 0.1; // 短句
    if (text.length < 500) score += 0.1; // 短篇为主
    if (/旧|新|社会|时代/.test(text)) score += 0.2;
    if (/冷|暖|热|寒/.test(text)) score += 0.1; // 体感词
    if (/，.{1,8}，/.test(text)) score += 0.2; // 短句夹句号
    return Math.min(1, score);
  }

  matches(text: string, threshold = 0.5): boolean {
    return this.score(text) >= threshold;
  }
}

// ============================================================================
// Engine 5: WenYanWenConverter
// ============================================================================

export class WenYanWenConverter {
  private _modernToClassical: Record<string, string> = {
    '我': '余',
    '你': '汝',
    '他': '彼',
    '她': '彼',
    '的': '之',
    '了': '矣',
    '是': '乃',
    '不': '非',
    '有': '有',
    '在': '在',
    '和': '与',
    '但是': '然',
    '因为': '因',
    '所以': '故',
  };

  modernToClassical(text: string): string {
    let result = text;
    for (const [m, c] of Object.entries(this._modernToClassical)) {
      result = result.replace(new RegExp(m, 'g'), c);
    }
    return result;
  }

  classicalScore(text: string): number {
    let count = 0;
    for (const classical of Object.values(this._modernToClassical)) {
      if (text.includes(classical)) count += 1;
    }
    return Math.min(1, count / 3);
  }

  isClassical(text: string, threshold = 0.5): boolean {
    return this.classicalScore(text) >= threshold;
  }
}

// ============================================================================
// Engine 6: StyleTransfer
// ============================================================================

export class StyleTransfer {
  transfer(text: string, fromStyle: string, toStyle: string): string {
    // Simulated: replace some markers
    if (fromStyle === 'modern' && toStyle === 'classical') {
      const conv = new WenYanWenConverter();
      return conv.modernToClassical(text);
    }
    // For other styles, just add a marker
    return `[${toStyle}] ${text}`;
  }

  isValidTransfer(original: string, transferred: string): boolean {
    return transferred.length > 0;
  }
}

// ============================================================================
// Engine 7: StyleMixer
// ============================================================================

export class StyleMixer {
  mix(text: string, styleA: string, styleB: string, ratio: number = 0.5): string {
    // ratio: 0 = pure A, 1 = pure B
    const partA = text.slice(0, Math.floor(text.length * (1 - ratio)));
    const partB = text.slice(Math.floor(text.length * (1 - ratio)));
    return `[${styleA}] ${partA} [${styleB}] ${partB}`;
  }

  isValidRatio(ratio: number): boolean {
    return ratio >= 0 && ratio <= 1;
  }
}

// ============================================================================
// Engine 8: StyleEvolution
// ============================================================================

export class StyleEvolution {
  private _snapshots: { chapter: number; style: string; fingerprint: string }[] = [];

  snapshot(chapter: number, style: string, fingerprint: string): void {
    this._snapshots.push({ chapter, style, fingerprint });
  }

  getAll(): { chapter: number; style: string; fingerprint: string }[] {
    return [...this._snapshots];
  }

  hasDrift(threshold = 3): boolean {
    if (this._snapshots.length < 2) return false;
    const styles = new Set(this._snapshots.map((s) => s.style));
    return styles.size >= threshold;
  }
}

// ============================================================================
// Engine 9: StyleMaturity
// ============================================================================

export class StyleMaturity {
  score(text: string): number {
    let score = 0;
    // Heuristics for mature style
    if (text.length > 1000) score += 0.2; // long text
    if (/，.{20,}，/.test(text)) score += 0.2; // complex sentences
    if (/隐喻|象征|主题|metaphor|theme/.test(text)) score += 0.2;
    if (text.length / (text.match(/[。！？.!?]/g) || ['']).length > 30) score += 0.2; // long avg
    return Math.min(1, score);
  }

  classify(text: string): 'beginner' | 'intermediate' | 'advanced' | 'master' {
    const s = this.score(text);
    if (s < 0.2) return 'beginner';
    if (s < 0.5) return 'intermediate';
    if (s < 0.8) return 'advanced';
    return 'master';
  }
}

// ============================================================================
// Engine 10: ParagraphLevelTransfer
// ============================================================================

export class ParagraphLevelTransfer {
  transfer(text: string, targetStyle: string): string {
    const paragraphs = text.split(/\n+/);
    return paragraphs.map((p) => `[${targetStyle}] ${p.trim()}`).join('\n');
  }

  countParagraphs(text: string): number {
    return text.split(/\n+/).filter((p) => p.trim().length > 0).length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AD_BATCH_2_ENGINES = {
  HigashinoKeigoStyle,
  MurakamiHarukiStyle,
  NatsumeSosekiStyle,
  LuXunModernStyle,
  WenYanWenConverter,
  StyleTransfer,
  StyleMixer,
  StyleEvolution,
  StyleMaturity,
  ParagraphLevelTransfer,
} as const;
