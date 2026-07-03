/**
 * PlatformAdaptation.ts — Direction AE, V3226-V3235 (Batch 1/3)
 * Publishing & Marketing: 平台适配 + 营销文案
 *
 * 10 engines:
 * 1.  PlatformWordcountAdapter — 平台字数适配
 * 2.  PlatformFormat — 平台格式
 * 3.  PlatformTone — 平台调性
 * 4.  PlatformSensitivity — 违禁词检测
 * 5.  PlatformContractCheck — 平台合同检查
 * 6.  SynopsisGenerator — 简介生成（3 风格）
 * 7.  TitleClickbait — 标题党生成器
 * 8.  SellingPointExtractor — 卖点提炼
 * 9.  KeywordSEO — SEO 关键词
 * 10. RecommendationGenerator — 编辑推荐语
 */

// ============================================================================
// Engine 1: PlatformWordcountAdapter
// ============================================================================

export type Platform = 'qidian' | 'fanqie' | 'jinjiang' | 'zongheng' | 'general';

export interface WordcountSpec {
  min: number;
  max: number;
  preferred: number;
}

export class PlatformWordcountAdapter {
  private _specs: Record<Platform, WordcountSpec> = {
    qidian: { min: 2000, max: 3000, preferred: 2500 },
    fanqie: { min: 1500, max: 2500, preferred: 2000 },
    jinjiang: { min: 3000, max: 5000, preferred: 4000 },
    zongheng: { min: 2000, max: 3500, preferred: 2800 },
    general: { min: 1000, max: 5000, preferred: 2500 },
  };

  getSpec(platform: Platform): WordcountSpec {
    return { ...this._specs[platform] };
  }

  isValidLength(platform: Platform, length: number): boolean {
    const spec = this._specs[platform];
    return length >= spec.min && length <= spec.max;
  }

  recommendAdjustment(platform: Platform, currentLength: number): string {
    const spec = this._specs[platform];
    if (currentLength < spec.min) return `需增加 ${spec.min - currentLength} 字`;
    if (currentLength > spec.max) return `需删减 ${currentLength - spec.max} 字`;
    return `字数 ${currentLength} 在 ${spec.min}-${spec.max} 范围内`;
  }
}

// ============================================================================
// Engine 2: PlatformFormat
// ============================================================================

export class PlatformFormat {
  // Different platforms have different formatting rules
  private _rules: Record<Platform, { lineBreaks: number; paragraphIndent: string }> = {
    qidian: { lineBreaks: 1, paragraphIndent: '　　' },
    fanqie: { lineBreaks: 0, paragraphIndent: '' },
    jinjiang: { lineBreaks: 1, paragraphIndent: '　　' },
    zongheng: { lineBreaks: 1, paragraphIndent: '　　' },
    general: { lineBreaks: 1, paragraphIndent: '　　' },
  };

  format(platform: Platform, text: string): string {
    const rule = this._rules[platform];
    const paragraphs = text.split(/\n+/);
    const formatted = paragraphs.map((p) => rule.paragraphIndent + p.trim()).join('\n'.repeat(rule.lineBreaks + 1));
    return formatted;
  }

  getRules(platform: Platform): { lineBreaks: number; paragraphIndent: string } {
    return { ...this._rules[platform] };
  }
}

// ============================================================================
// Engine 3: PlatformTone
// ============================================================================

export class PlatformTone {
  private _tones: Record<Platform, { gender: 'male' | 'female' | 'neutral'; themes: string[] }> = {
    qidian: { gender: 'male', themes: ['升级', '爽点', '争霸', '扮猪吃虎'] },
    fanqie: { gender: 'male', themes: ['爽点', '快节奏', '金手指'] },
    jinjiang: { gender: 'female', themes: ['爱情', '情感', 'CP', '虐心'] },
    zongheng: { gender: 'male', themes: ['热血', '战争', '英雄'] },
    general: { gender: 'neutral', themes: ['通用'] },
  };

  getTone(platform: Platform): { gender: 'male' | 'female' | 'neutral'; themes: string[] } {
    return { ...this._tones[platform] };
  }

  isThemed(platform: Platform, theme: string): boolean {
    return this._tones[platform].themes.includes(theme);
  }
}

// ============================================================================
// Engine 4: PlatformSensitivity
// ============================================================================

export class PlatformSensitivity {
  private _bannedKeywords: Record<Platform, string[]> = {
    qidian: ['色情', '暴力', '政治', 'porn', 'violence'],
    fanqie: ['色情', '暴力', 'porn', 'violence'],
    jinjiang: ['露骨', 'exposed'],
    zongheng: ['政治', 'political'],
    general: [],
  };

  detect(text: string, platform: Platform): string[] {
    const lower = text.toLowerCase();
    return this._bannedKeywords[platform].filter((k) => lower.includes(k.toLowerCase()));
  }

  isClean(text: string, platform: Platform): boolean {
    return this.detect(text, platform).length === 0;
  }
}

// ============================================================================
// Engine 5: PlatformContractCheck
// ============================================================================

export class PlatformContractCheck {
  check(platform: Platform, requirements: { totalWords: number; exclusive: boolean; updateFrequency: string }): {
    meets: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const specs: Record<Platform, number> = {
      qidian: 100000, fanqie: 50000, jinjiang: 50000, zongheng: 80000, general: 0,
    };
    if (requirements.totalWords < specs[platform]) {
      issues.push(`字数 ${requirements.totalWords} 低于 ${platform} 最低要求 ${specs[platform]}`);
    }
    if (platform === 'jinjiang' && !requirements.exclusive) {
      issues.push('晋江通常要求独家');
    }
    if (!requirements.updateFrequency) {
      issues.push('缺少更新频率说明');
    }
    return { meets: issues.length === 0, issues };
  }
}

// ============================================================================
// Engine 6: SynopsisGenerator
// ============================================================================

export class SynopsisGenerator {
  generate(title: string, genre: string, style: 'suspense' | 'selling' | 'emotional' = 'selling'): string {
    switch (style) {
      case 'suspense':
        return `${title}：当 ${genre} 的命运之轮开始转动，TA 必须面对一个无法回头的选择...`;
      case 'selling':
        return `${title}：一部 ${genre} 题材的精彩作品，带你进入一个充满想象的世界。`;
      case 'emotional':
        return `${title}：在命运的十字路口，TA 遇到了命中注定的那个人。`;
    }
  }

  generateAllStyles(title: string, genre: string): { style: string; synopsis: string }[] {
    return [
      { style: 'suspense', synopsis: this.generate(title, genre, 'suspense') },
      { style: 'selling', synopsis: this.generate(title, genre, 'selling') },
      { style: 'emotional', synopsis: this.generate(title, genre, 'emotional') },
    ];
  }
}

// ============================================================================
// Engine 7: TitleClickbait
// ============================================================================

export class TitleClickbait {
  private _clickbaitPatterns = [
    '{hero}在{place}意外获得{treasure}，从此{change}',
    '重生回{yesterday}，{hero}决定{action}',
    '{hero}觉醒{system}，{consequence}',
    '我{profession}了{family}十年，{reveal}',
  ];

  generate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return result;
  }

  getTemplates(): string[] {
    return [...this._clickbaitPatterns];
  }
}

// ============================================================================
// Engine 8: SellingPointExtractor
// ============================================================================

export class SellingPointExtractor {
  extract(text: string): string[] {
    const points: string[] = [];
    if (/金手指/.test(text)) points.push('有金手指');
    if (/重生/.test(text)) points.push('重生设定');
    if (/穿越/.test(text)) points.push('穿越题材');
    if (/系统/.test(text)) points.push('系统流');
    if (/无敌/.test(text)) points.push('无敌流');
    if (/扮猪吃虎/.test(text)) points.push('扮猪吃虎');
    if (/甜文/.test(text)) points.push('甜文');
    if (/虐文/.test(text)) points.push('虐心');
    return points;
  }

  countPoints(text: string): number {
    return this.extract(text).length;
  }
}

// ============================================================================
// Engine 9: KeywordSEO
// ============================================================================

export class KeywordSEO {
  private _trending = ['穿越', '重生', '金手指', '系统', '无敌', '甜宠', '虐恋', '复仇', '修仙', '玄幻'];

  getTrending(): string[] {
    return [...this._trending];
  }

  extractFromText(text: string): string[] {
    return this._trending.filter((k) => text.includes(k));
  }

  recommend(title: string, content: string): string[] {
    const fromContent = this.extractFromText(content);
    const fromTitle = this.extractFromText(title);
    const unique = Array.from(new Set([...fromTitle, ...fromContent]));
    // Pad with trending if too few
    while (unique.length < 5) {
      const next = this._trending.find((k) => !unique.includes(k));
      if (!next) break;
      unique.push(next);
    }
    return unique;
  }
}

// ============================================================================
// Engine 10: RecommendationGenerator
// ============================================================================

export class RecommendationGenerator {
  generate(title: string, genre: string, points: string[]): string {
    const pointStr = points.length > 0 ? `，融合了${points.join('、')}` : '';
    return `编辑推荐：《${title}》是一部精彩的${genre}作品${pointStr}，值得一读。`;
  }

  generateVariants(title: string, genre: string, points: string[]): string[] {
    return [
      this.generate(title, genre, points),
      `编辑力荐：${title} - ${genre}题材的良心之作`,
      `这本《${title}》讲述了一个引人入胜的${genre}故事。`,
    ];
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AE_BATCH_1_ENGINES = {
  PlatformWordcountAdapter,
  PlatformFormat,
  PlatformTone,
  PlatformSensitivity,
  PlatformContractCheck,
  SynopsisGenerator,
  TitleClickbait,
  SellingPointExtractor,
  KeywordSEO,
  RecommendationGenerator,
} as const;
