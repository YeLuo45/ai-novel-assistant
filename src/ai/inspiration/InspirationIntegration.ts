/**
 * InspirationIntegration.ts — Direction AO, V3546-V3555 (Batch 3/3 收口)
 * Inspiration Network: 集成 + 收口
 *
 * 10 engines:
 * 1.  InspirationAI — AI 灵感助手
 * 2.  CrossInspirationLinker — 跨灵感连接
 * 3.  InspirationNetworkVisualizer — 网络可视化
 * 4.  InspirationQualityScorer — 质量评分
 * 5.  InspirationReuser — 灵感复用
 * 6.  InspirationCollaborator — 协作器
 * 7.  InspirationEvolutionTracker — 进化追踪
 * 8.  InspirationPredictor — 灵感预测
 * 9.  InspirationLibraryBuilder — 库构建
 * 10. InspirationMasterIndex — 28 engines 收口
 */

import type { Inspiration } from './InspirationCapture';

// ============================================================================
// Engine 1: InspirationAI
// ============================================================================

export class InspirationAI {
  private _prompts = [
    '今天试试不同的视角',
    '把两个不相关的概念连接起来',
    '在旧作品中找新意',
    '从其他媒介获得灵感',
  ];

  suggest(): string {
    return this._prompts[Math.floor(Math.random() * this._prompts.length)];
  }
}

// ============================================================================
// Engine 2: CrossInspirationLinker
// ============================================================================

export class CrossInspirationLinker {
  link(inspirations: Inspiration[]): { a: string; b: string; relation: string }[] {
    const links: { a: string; b: string; relation: string }[] = [];
    for (let i = 0; i < inspirations.length; i++) {
      for (let j = i + 1; j < inspirations.length; j++) {
        if (this._shareTag(inspirations[i], inspirations[j])) {
          links.push({ a: inspirations[i].id, b: inspirations[j].id, relation: 'shared tag' });
        }
      }
    }
    return links;
  }

  private _shareTag(a: Inspiration, b: Inspiration): boolean {
    return a.tags.some((t) => b.tags.includes(t));
  }
}

// ============================================================================
// Engine 3: InspirationNetworkVisualizer
// ============================================================================

export class InspirationNetworkVisualizer {
  render(nodes: string[], edges: { from: string; to: string }[]): string {
    let result = '';
    for (const e of edges) {
      result += `${e.from} -- ${e.to}\n`;
    }
    return result;
  }
}

// ============================================================================
// Engine 4: InspirationQualityScorer
// ============================================================================

export class InspirationQualityScorer {
  score(inspiration: Inspiration): { content: number; detail: number; originality: number; total: number } {
    const content = Math.min(1, inspiration.content.length / 100);
    const detail = Math.min(1, (inspiration.tags.length + 1) / 5);
    const originality = inspiration.source ? 0.8 : 0.5;
    const total = (content + detail + originality) / 3;
    return { content, detail, originality, total };
  }
}

// ============================================================================
// Engine 5: InspirationReuser
// ============================================================================

export class InspirationReuser {
  private _reuseLog: { id: string; usedIn: string }[] = [];

  reuse(inspirationId: string, usedIn: string): void {
    this._reuseLog.push({ id: inspirationId, usedIn });
  }

  getReuses(inspirationId: string): string[] {
    return this._reuseLog.filter((r) => r.id === inspirationId).map((r) => r.usedIn);
  }
}

// ============================================================================
// Engine 6: InspirationCollaborator
// ============================================================================

export class InspirationCollaborator {
  private _members: string[] = [];

  addMember(name: string): void {
    this._members.push(name);
  }

  count(): number {
    return this._members.length;
  }

  canCollaborate(): boolean {
    return this._members.length >= 2;
  }
}

// ============================================================================
// Engine 7: InspirationEvolutionTracker
// ============================================================================

export class InspirationEvolutionTracker {
  private _history: { id: string; state: string; timestamp: number }[] = [];

  track(id: string, state: string): void {
    this._history.push({ id, state, timestamp: Date.now() });
  }

  getCurrentState(id: string): string | null {
    const filtered = this._history.filter((h) => h.id === id);
    return filtered.length > 0 ? filtered[filtered.length - 1].state : null;
  }
}

// ============================================================================
// Engine 8: InspirationPredictor
// ============================================================================

export class InspirationPredictor {
  predict(history: { date: string; count: number }[], futureDays: number = 7): number {
    if (history.length === 0) return 0;
    const recent = history.slice(-7);
    const avg = recent.reduce((s, h) => s + h.count, 0) / recent.length;
    return avg * futureDays;
  }
}

// ============================================================================
// Engine 9: InspirationLibraryBuilder
// ============================================================================

export class InspirationLibraryBuilder {
  private _library: Map<string, Inspiration[]> = new Map();

  addToLibrary(category: string, inspiration: Inspiration): void {
    if (!this._library.has(category)) this._library.set(category, []);
    this._library.get(category)!.push(inspiration);
  }

  getByCategory(category: string): Inspiration[] {
    return this._library.get(category) || [];
  }

  totalCount(): number {
    let total = 0;
    for (const arr of this._library.values()) total += arr.length;
    return total;
  }
}

// ============================================================================
// Engine 10: InspirationMasterIndex
// ============================================================================

export class InspirationMasterIndex {
  list(): string[] {
    return [
      'InspirationCapture', 'SourceTagger', 'InspirationCategorizer',
      'MoodTracker', 'TriggerLogger', 'InspirationRanker',
      'IdeaConnector', 'SparkFile', 'VoiceMemoCapture',
      'InfluenceMap', 'CrossAuthorAnalyzer', 'StyleGenealogy',
      'InspirationWeb', 'BorrowingTracker', 'OriginalityMeter',
      'ThemeClusterer', 'MotifTracker', 'IdeaEvolutionMapper',
      'InspirationAI', 'CrossInspirationLinker', 'InspirationNetworkVisualizer',
      'InspirationQualityScorer', 'InspirationReuser', 'InspirationCollaborator',
      'InspirationEvolutionTracker', 'InspirationPredictor', 'InspirationLibraryBuilder',
      'InspirationMasterIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AO_BATCH_3_ENGINES = {
  InspirationAI,
  CrossInspirationLinker,
  InspirationNetworkVisualizer,
  InspirationQualityScorer,
  InspirationReuser,
  InspirationCollaborator,
  InspirationEvolutionTracker,
  InspirationPredictor,
  InspirationLibraryBuilder,
  InspirationMasterIndex,
} as const;

export type { Inspiration };
