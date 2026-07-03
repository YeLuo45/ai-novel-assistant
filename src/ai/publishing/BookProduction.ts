/**
 * BookProduction.ts — Direction AE, V3246-V3255 (Batch 3/3 收口)
 * Publishing & Marketing: 系列出版 + 成书 + 收口
 *
 * 10 engines:
 * 1.  VolumeStructurePlanner — 卷/部规划
 * 2.  VolumeNameSuggester — 卷名建议
 * 3.  SeriesBible — 系列圣经
 * 4.  SeriesReadingOrder — 系列阅读顺序
 * 5.  SpinOffPotential — 衍生潜力
 * 6.  CopyEditor — 校对
 * 7.  EbookFormatter — 电子书排版
 * 8.  PrintBookLayout — 实体书排版
 * 9.  CopyrightPageGenerator — 版权页生成
 * 10. PublishingIndex — 30 engines 收口
 */

// ============================================================================
// Engine 1: VolumeStructurePlanner
// ============================================================================

export interface Volume {
  index: number;
  title: string;
  startChapter: number;
  endChapter: number;
  wordCount: number;
}

export class VolumeStructurePlanner {
  private _volumes: Volume[] = [];
  private _counter = 0;

  add(title: string, startChapter: number, endChapter: number, wordCount: number): Volume {
    this._counter += 1;
    const v: Volume = { index: this._counter, title, startChapter, endChapter, wordCount };
    this._volumes.push(v);
    return v;
  }

  getAll(): Volume[] {
    return [...this._volumes];
  }

  totalWordCount(): number {
    return this._volumes.reduce((s, v) => s + v.wordCount, 0);
  }

  averageVolumeLength(): number {
    if (this._volumes.length === 0) return 0;
    return this.totalWordCount() / this._volumes.length;
  }
}

// ============================================================================
// Engine 2: VolumeNameSuggester
// ============================================================================

export class VolumeNameSuggester {
  private _templates = [
    '{theme}之{action}',
    '{hero}的{adventure}',
    '{place}卷',
    '{event}篇',
  ];

  generate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return result;
  }

  getTemplates(): string[] {
    return [...this._templates];
  }
}

// ============================================================================
// Engine 3: SeriesBible
// ============================================================================

export class SeriesBible {
  generate(title: string, sections: { name: string; content: string }[]): string {
    const lines = [`# ${title} - Series Bible\n`];
    for (const s of sections) {
      lines.push(`## ${s.name}\n${s.content}\n`);
    }
    return lines.join('\n');
  }
}

// ============================================================================
// Engine 4: SeriesReadingOrder
// ============================================================================

export interface BookInSeries {
  index: number;
  title: string;
  prerequisite?: number;
}

export class SeriesReadingOrder {
  private _books: BookInSeries[] = [];

  add(title: string, prerequisite?: number): BookInSeries {
    const index = this._books.length + 1;
    const b: BookInSeries = { index, title, prerequisite };
    this._books.push(b);
    return b;
  }

  getAll(): BookInSeries[] {
    return [...this._books];
  }

  getOrder(): BookInSeries[] {
    // Topological sort
    const sorted: BookInSeries[] = [];
    const visited = new Set<number>();
    const visit = (b: BookInSeries) => {
      if (visited.has(b.index)) return;
      visited.add(b.index);
      if (b.prerequisite) {
        const pre = this._books.find((x) => x.index === b.prerequisite);
        if (pre) visit(pre);
      }
      sorted.push(b);
    };
    for (const b of this._books) visit(b);
    return sorted;
  }
}

// ============================================================================
// Engine 5: SpinOffPotential
// ============================================================================

export class SpinOffPotential {
  score(title: string, hasStrongSideCharacters: boolean, hasOpenWorld: boolean, hasMagic: boolean): number {
    let score = 0;
    if (hasStrongSideCharacters) score += 0.4;
    if (hasOpenWorld) score += 0.3;
    if (hasMagic) score += 0.2;
    if (title.length > 5) score += 0.1; // strong title
    return Math.min(1, score);
  }

  isViable(score: number, threshold = 0.5): boolean {
    return score >= threshold;
  }
}

// ============================================================================
// Engine 6: CopyEditor
// ============================================================================

export class CopyEditor {
  private _typos: Record<string, string> = {
    '的得地': '的/得/地',
  };

  detectTypos(text: string): string[] {
    const found: string[] = [];
    for (const typo of Object.keys(this._typos)) {
      if (text.includes(typo)) found.push(typo);
    }
    return found;
  }

  isClean(text: string): boolean {
    return this.detectTypos(text).length === 0;
  }

  wordCount(text: string): number {
    return text.split(/[\s，。！？,.\!?]+/).filter((w) => w.length > 0).length;
  }
}

// ============================================================================
// Engine 7: EbookFormatter
// ============================================================================

export class EbookFormatter {
  formatChapters(chapters: { title: string; content: string }[]): string {
    return chapters.map((c) => `# ${c.title}\n\n${c.content}`).join('\n\n---\n\n');
  }

  toHTML(chapters: { title: string; content: string }[]): string {
    return chapters.map((c) => `<h1>${c.title}</h1>\n<p>${c.content}</p>`).join('\n');
  }

  countChapters(chapters: { title: string; content: string }[]): number {
    return chapters.length;
  }
}

// ============================================================================
// Engine 8: PrintBookLayout
// ============================================================================

export class PrintBookLayout {
  layout(chapters: { title: string; content: string }[], wordsPerPage = 300): { totalPages: number; pages: number[] } {
    const totalWords = chapters.reduce((s, c) => s + c.content.length / 2, 0); // rough Chinese estimate
    const totalPages = Math.ceil(totalWords / wordsPerPage);
    return { totalPages, pages: Array.from({ length: totalPages }, (_, i) => i + 1) };
  }
}

// ============================================================================
// Engine 9: CopyrightPageGenerator
// ============================================================================

export class CopyrightPageGenerator {
  generate(bookInfo: { title: string; author: string; year: number; publisher: string; isbn: string }): string {
    return `书名：${bookInfo.title}
作者：${bookInfo.author}
出版：${bookInfo.publisher}
${bookInfo.year}年
ISBN：${bookInfo.isbn}

版权所有，侵权必究。`;
  }

  generateAfterword(author: string, message: string): string {
    return `后记

作者：${author}

${message}`;
  }

  generateAcknowledgment(people: string[]): string {
    return `致谢

感谢：${people.join('、')}`;
  }
}

// ============================================================================
// Engine 10: PublishingIndex
// ============================================================================

export class PublishingIndex {
  list(): string[] {
    return [
      'PlatformWordcountAdapter', 'PlatformFormat', 'PlatformTone', 'PlatformSensitivity',
      'PlatformContractCheck', 'SynopsisGenerator', 'TitleClickbait', 'SellingPointExtractor',
      'KeywordSEO', 'RecommendationGenerator',
      'TargetReaderPersonaEngine', 'CompetitorAnalysis', 'HeatmapPredictor',
      'ReviewGenerator', 'ReaderFeedbackAnalyzer', 'WeiboCopywriter', 'XiaohongshuPost',
      'DouyinScript', 'BilibiliScript', 'PosterSlogan',
      'VolumeStructurePlanner', 'VolumeNameSuggester', 'SeriesBible',
      'SeriesReadingOrder', 'SpinOffPotential', 'CopyEditor',
      'EbookFormatter', 'PrintBookLayout', 'CopyrightPageGenerator',
      'PublishingIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AE_BATCH_3_ENGINES = {
  VolumeStructurePlanner,
  VolumeNameSuggester,
  SeriesBible,
  SeriesReadingOrder,
  SpinOffPotential,
  CopyEditor,
  EbookFormatter,
  PrintBookLayout,
  CopyrightPageGenerator,
  PublishingIndex,
} as const;
