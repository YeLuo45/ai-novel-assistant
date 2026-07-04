/**
 * BetaReaderProfiles.ts — Direction AL, V3436-V3445 (Batch 1/3)
 * Beta Reader Persona: 模拟读者画像
 *
 * 10 engines:
 * 1.  BetaReaderPersonaBuilder — 读者画像构建
 * 2.  WebNovelReader — 网文读者
 * 3.  LiteraryReader — 文学读者
 * 4.  GenreSpecificReader — 类型读者
 * 5.  YoungAdultReader — 年轻读者
 * 6.  MiddleAgedReader — 中年读者
 * 7.  CasualReader — 休闲读者
 * 8.  AvidReader — 书虫
 * 9.  CriticalReader — 严苛读者
 * 10. BetaReaderProfilesIndex — 收口
 *
 * 灵感：模拟 3 类读者反馈 / 出版前自检
 */

import type { Chapter } from '../pacing/StructureTemplates';

export type BetaReader = {
  name: string;
  type: 'web' | 'literary' | 'genre' | 'young' | 'middle' | 'casual' | 'avid' | 'critical';
  preferences: string[];
  painPoints: string[];
  rating: number;
  feedback: string;
};

// ============================================================================
// Engine 1: BetaReaderPersonaBuilder
// ============================================================================

export class BetaReaderPersonaBuilder {
  build(type: BetaReader['type'], name: string): BetaReader {
    const personas: Record<BetaReader['type'], Omit<BetaReader, 'name' | 'type'>> = {
      web: {
        preferences: ['爽点', '快节奏', '金手指'],
        painPoints: ['慢热', '文青', '慢更'],
        rating: 0,
        feedback: '',
      },
      literary: {
        preferences: ['文笔', '深度', '隐喻'],
        painPoints: ['套路', '注水', '低俗'],
        rating: 0,
        feedback: '',
      },
      genre: {
        preferences: ['类型要素', '节奏', '设定'],
        painPoints: ['偏离类型', 'OOC', '逻辑漏洞'],
        rating: 0,
        feedback: '',
      },
      young: {
        preferences: ['新鲜', '刺激', '浪漫'],
        painPoints: ['沉闷', '老套', '说教'],
        rating: 0,
        feedback: '',
      },
      middle: {
        preferences: ['深度', '真实', '情感'],
        painPoints: ['悬浮', '幼稚', '套路'],
        rating: 0,
        feedback: '',
      },
      casual: {
        preferences: ['易读', '不费脑', '娱乐'],
        painPoints: ['复杂', '沉重', '长篇'],
        rating: 0,
        feedback: '',
      },
      avid: {
        preferences: ['文笔', '情节', '深度'],
        painPoints: ['注水', '套路', '重复'],
        rating: 0,
        feedback: '',
      },
      critical: {
        preferences: ['完美', '创新', '深度'],
        painPoints: ['任何瑕疵'],
        rating: 0,
        feedback: '',
      },
    };
    return { name, type, ...personas[type] };
  }

  buildAll(): BetaReader[] {
    return [
      this.build('web', '网文读者小王'),
      this.build('literary', '文学读者李姐'),
      this.build('genre', '类型迷老张'),
    ];
  }
}

// ============================================================================
// Engine 2: WebNovelReader
// ============================================================================

export class WebNovelReader {
  rate(chapters: Chapter[]): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let totalScore = 5;
    for (const c of chapters) {
      if ((c.content?.length || 0) < 500) issues.push('chapter too short');
      if (c.content && !/[战斗|爽|金手指|扮猪吃虎|逆袭]/.test(c.content)) issues.push('no 爽点');
    }
    totalScore -= issues.length * 0.5;
    return { rating: Math.max(0, Math.min(5, totalScore)), issues };
  }

  isSatisfied(rating: number): boolean {
    return rating >= 4;
  }
}

// ============================================================================
// Engine 3: LiteraryReader
// ============================================================================

export class LiteraryReader {
  rate(text: string): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let score = 5;
    if (!/[隐喻|象征|主题|反思]/.test(text)) issues.push('lacks depth');
    if (text.length < 500) issues.push('too short');
    if (/他很|她很|感到|觉得/.test(text)) issues.push('too much tell');
    score -= issues.length * 0.5;
    return { rating: Math.max(0, Math.min(5, score)), issues };
  }
}

// ============================================================================
// Engine 4: GenreSpecificReader
// ============================================================================

export class GenreSpecificReader {
  rate(genre: string, text: string): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let score = 5;
    const genreKeywords: Record<string, string[]> = {
      wuxia: ['剑', '江湖', '侠', '武功'],
      romance: ['爱', '情', '心', '约会'],
      mystery: ['谜', '案', '证据', '推理'],
      scifi: ['未来', '科技', '太空', 'AI'],
    };
    const keywords = genreKeywords[genre] || [];
    const matches = keywords.filter((k) => text.includes(k)).length;
    if (matches < 2) issues.push('not enough genre elements');
    if (matches > 5) issues.push('too many clichés');
    score = matches >= 2 && matches <= 5 ? score : score - 1;
    return { rating: Math.max(0, Math.min(5, score)), issues };
  }
}

// ============================================================================
// Engine 5: YoungAdultReader
// ============================================================================

export class YoungAdultReader {
  rate(text: string): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let score = 5;
    if (!/[刺激|浪漫|冒险|神秘|青春]/.test(text)) issues.push('boring');
    if (text.length > 5000) issues.push('too long for YA');
    if (/死亡|悲剧|绝望/.test(text)) issues.push('too dark');
    score -= issues.length * 0.5;
    return { rating: Math.max(0, Math.min(5, score)), issues };
  }
}

// ============================================================================
// Engine 6: MiddleAgedReader
// ============================================================================

export class MiddleAgedReader {
  rate(text: string): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let score = 5;
    if (!/[深度|真实|情感|家庭|职场]/.test(text)) issues.push('lacks depth');
    if (/金手指|系统|重生/.test(text)) issues.push('too tropey');
    score -= issues.length * 0.5;
    return { rating: Math.max(0, Math.min(5, score)), issues };
  }
}

// ============================================================================
// Engine 7: CasualReader
// ============================================================================

export class CasualReader {
  rate(text: string): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let score = 5;
    if (text.length > 2000) issues.push('too long for casual');
    if (!/[。！？.!?]/.test(text)) issues.push('not formatted');
    if (/[隐喻|象征|主题]/.test(text)) issues.push('too literary');
    score -= issues.length * 0.5;
    return { rating: Math.max(0, Math.min(5, score)), issues };
  }
}

// ============================================================================
// Engine 8: AvidReader
// ============================================================================

export class AvidReader {
  rate(text: string): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let score = 5;
    if (!/[独特|新颖|创新]/.test(text)) issues.push('not unique');
    if (text.length < 1000) issues.push('too short for avid');
    if (this._hasCliche(text)) issues.push('uses clichés');
    score -= issues.length * 0.5;
    return { rating: Math.max(0, Math.min(5, score)), issues };
  }

  private _hasCliche(text: string): boolean {
    const cliches = ['他很帅', '她很美', '突然出现', '他不知道'];
    return cliches.some((c) => text.includes(c));
  }
}

// ============================================================================
// Engine 9: CriticalReader
// ============================================================================

export class CriticalReader {
  rate(text: string): { rating: number; issues: string[] } {
    const issues: string[] = [];
    let score = 5;
    if (text.length < 500) issues.push('too short');
    if (/他很|她很|感到|觉得/.test(text)) issues.push('tell not show');
    if (/然后|接着/.test(text)) issues.push('lazy transitions');
    if (!/[,;:!?]/.test(text)) issues.push('no punctuation variety');
    if (/[他她]\w{1,3}(说|道)/.test(text)) issues.push('cliché dialogue tags');
    score -= issues.length * 0.5;
    return { rating: Math.max(0, Math.min(5, score)), issues };
  }
}

// ============================================================================
// Engine 10: BetaReaderProfilesIndex
// ============================================================================

export class BetaReaderProfilesIndex {
  list(): string[] {
    return [
      'BetaReaderPersonaBuilder', 'WebNovelReader', 'LiteraryReader',
      'GenreSpecificReader', 'YoungAdultReader', 'MiddleAgedReader',
      'CasualReader', 'AvidReader', 'CriticalReader',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AL_BATCH_1_ENGINES = {
  BetaReaderPersonaBuilder,
  WebNovelReader,
  LiteraryReader,
  GenreSpecificReader,
  YoungAdultReader,
  MiddleAgedReader,
  CasualReader,
  AvidReader,
  CriticalReader,
  BetaReaderProfilesIndex,
} as const;

export type { Chapter, BetaReader };
