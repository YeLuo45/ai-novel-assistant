/**
 * InspirationNetwork.ts — Direction AO, V3536-V3545 (Batch 2/3)
 * Inspiration Network: 灵感网络分析
 *
 * 10 engines:
 * 1.  InfluenceMap — 影响图
 * 2.  CrossAuthorAnalyzer — 跨作者分析
 * 3.  StyleGenealogy — 风格谱系
 * 4.  InspirationWeb — 灵感网络
 * 5.  BorrowingTracker — 借鉴追踪
 * 6.  OriginalityMeter — 原创度计
 * 7.  ThemeClusterer — 主题聚类
 * 8.  MotifTracker — 母题追踪
 * 9.  IdeaEvolutionMapper — 想法进化
 * 10. InspirationNetworkIndex — 收口
 */

import type { Inspiration } from './InspirationCapture';

// ============================================================================
// Engine 1: InfluenceMap
// ============================================================================

export class InfluenceMap {
  private _influences: { from: string; to: string; strength: number }[] = [];

  addInfluence(from: string, to: string, strength: number): void {
    this._influences.push({ from, to, strength: Math.max(0, Math.min(1, strength)) });
  }

  getInfluencesOf(author: string): { from: string; strength: number }[] {
    return this._influences
      .filter((i) => i.to === author)
      .map((i) => ({ from: i.from, strength: i.strength }));
  }

  topInfluencers(author: string, n: number = 3): { from: string; strength: number }[] {
    return this.getInfluencesOf(author).sort((a, b) => b.strength - a.strength).slice(0, n);
  }
}

// ============================================================================
// Engine 2: CrossAuthorAnalyzer
// ============================================================================

export class CrossAuthorAnalyzer {
  private _styles: Map<string, string[]> = new Map();

  addAuthor(name: string, samples: string[]): void {
    this._styles.set(name, samples);
  }

  similarity(a: string, b: string): number {
    const sa = this._styles.get(a) || [];
    const sb = this._styles.get(b) || [];
    const allWords = new Set([...sa, ...sb].map((s) => s.toLowerCase()));
    let shared = 0;
    for (const w of allWords) {
      if (sa.some((s) => s.toLowerCase().includes(w)) && sb.some((s) => s.toLowerCase().includes(w))) {
        shared += 1;
      }
    }
    return allWords.size === 0 ? 0 : shared / allWords.size;
  }

  isSimilar(a: string, b: string, threshold = 0.3): boolean {
    return this.similarity(a, b) > threshold;
  }
}

// ============================================================================
// Engine 3: StyleGenealogy
// ============================================================================

export class StyleGenealogy {
  private _tree: { parent: string; child: string }[] = [];

  addRelation(parent: string, child: string): void {
    this._tree.push({ parent, child });
  }

  ancestorsOf(style: string): string[] {
    const result: string[] = [];
    let current: string | undefined = style;
    while (current) {
      const parent = this._tree.find((t) => t.child === current)?.parent;
      if (parent && !result.includes(parent)) result.push(parent);
      current = parent;
    }
    return result;
  }
}

// ============================================================================
// Engine 4: InspirationWeb
// ============================================================================

export class InspirationWeb {
  private _nodes = new Map<string, string[]>();

  addNode(name: string, related: string[]): void {
    this._nodes.set(name, related);
  }

  connect(a: string, b: string): void {
    if (!this._nodes.has(a)) this._nodes.set(a, []);
    if (!this._nodes.has(b)) this._nodes.set(b, []);
    if (!this._nodes.get(a)!.includes(b)) this._nodes.get(a)!.push(b);
    if (!this._nodes.get(b)!.includes(a)) this._nodes.get(b)!.push(a);
  }

  shortestPath(from: string, to: string): string[] {
    if (!this._nodes.has(from) || !this._nodes.has(to)) return [];
    if (from === to) return [from];
    const visited = new Set<string>([from]);
    const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];
    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      const neighbors = this._nodes.get(node) || [];
      for (const n of neighbors) {
        if (n === to) return [...path, n];
        if (!visited.has(n)) {
          visited.add(n);
          queue.push({ node: n, path: [...path, n] });
        }
      }
    }
    return [];
  }
}

// ============================================================================
// Engine 5: BorrowingTracker
// ============================================================================

export class BorrowingTracker {
  private _borrowings: { source: string; borrowed: string; chapter: string }[] = [];

  record(source: string, borrowed: string, chapter: string): void {
    this._borrowings.push({ source, borrowed, chapter });
  }

  countBySource(source: string): number {
    return this._borrowings.filter((b) => b.source === source).length;
  }

  isOverused(source: string, threshold = 5): boolean {
    return this.countBySource(source) > threshold;
  }
}

// ============================================================================
// Engine 6: OriginalityMeter
// ============================================================================

export class OriginalityMeter {
  measure(text: string, commonPatterns: string[]): number {
    let cliche = 0;
    for (const p of commonPatterns) {
      if (text.includes(p)) cliche += 1;
    }
    return Math.max(0, 1 - cliche / Math.max(1, commonPatterns.length));
  }

  isOriginal(text: string, commonPatterns: string[], threshold = 0.7): boolean {
    return this.measure(text, commonPatterns) >= threshold;
  }
}

// ============================================================================
// Engine 7: ThemeClusterer
// ============================================================================

export class ThemeClusterer {
  private _themes: Map<string, string[]> = new Map();

  addTheme(theme: string, items: string[]): void {
    this._themes.set(theme, items);
  }

  cluster(items: string[]): string {
    for (const [theme, themeItems] of this._themes) {
      const matches = items.filter((i) => themeItems.some((t) => i.includes(t))).length;
      if (matches > items.length / 2) return theme;
    }
    return 'unclustered';
  }
}

// ============================================================================
// Engine 8: MotifTracker
// ============================================================================

export class MotifTracker {
  private _motifs: Map<string, number> = new Map();

  track(motif: string): void {
    this._motifs.set(motif, (this._motifs.get(motif) || 0) + 1);
  }

  topMotifs(n: number = 5): { motif: string; count: number }[] {
    return Array.from(this._motifs.entries())
      .map(([motif, count]) => ({ motif, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }
}

// ============================================================================
// Engine 9: IdeaEvolutionMapper
// ============================================================================

export class IdeaEvolutionMapper {
  private _evolution: { idea: string; version: number; description: string }[] = [];

  record(idea: string, version: number, description: string): void {
    this._evolution.push({ idea, version, description });
  }

  getEvolution(idea: string): { idea: string; version: number; description: string }[] {
    return this._evolution.filter((e) => e.idea === idea).sort((a, b) => a.version - b.version);
  }
}

// ============================================================================
// Engine 10: InspirationNetworkIndex
// ============================================================================

export class InspirationNetworkIndex {
  list(): string[] {
    return [
      'InfluenceMap', 'CrossAuthorAnalyzer', 'StyleGenealogy',
      'InspirationWeb', 'BorrowingTracker', 'OriginalityMeter',
      'ThemeClusterer', 'MotifTracker', 'IdeaEvolutionMapper',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AO_BATCH_2_ENGINES = {
  InfluenceMap,
  CrossAuthorAnalyzer,
  StyleGenealogy,
  InspirationWeb,
  BorrowingTracker,
  OriginalityMeter,
  ThemeClusterer,
  MotifTracker,
  IdeaEvolutionMapper,
  InspirationNetworkIndex,
} as const;

export type { Inspiration };
