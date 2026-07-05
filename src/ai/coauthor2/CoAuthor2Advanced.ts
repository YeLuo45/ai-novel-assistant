// Round 8 Direction CB — AI Co-Author 2.0 Batch 2/3
// V4626-V4635: StreamingWriter + AsyncGenPool + QualityGate + StyleTransfer + AutoSave + BranchingNarrative + ReWrite + Consistency + WordCount + Readability

export interface StreamChunk {
  id: string;
  content: string;
  index: number;
  timestamp: number;
}

export interface StreamCheckpoint {
  id: string;
  lastIndex: number;
  content: string;
  timestamp: number;
}

// V4626: StreamingWriter — 流式写入器 + 中断恢复
export class StreamingWriter {
  private _chunks: StreamChunk[] = [];
  private _checkpoint: StreamCheckpoint | null = null;

  append(content: string): StreamChunk {
    const chunk: StreamChunk = {
      id: `c-${this._chunks.length}`,
      content,
      index: this._chunks.length,
      timestamp: Date.now(),
    };
    this._chunks.push(chunk);
    return chunk;
  }

  checkpoint(): StreamCheckpoint {
    const full = this.fullText();
    this._checkpoint = {
      id: `cp-${Date.now()}`,
      lastIndex: this._chunks.length - 1,
      content: full,
      timestamp: Date.now(),
    };
    return this._checkpoint;
  }

  restore(cp: StreamCheckpoint): void {
    this._chunks = [{ id: 'restored', content: cp.content, index: 0, timestamp: cp.timestamp }];
  }

  fullText(): string { return this._chunks.map(c => c.content).join(''); }

  chunkCount(): number { return this._chunks.length; }

  getCheckpoint(): StreamCheckpoint | null { return this._checkpoint; }
}

// V4627: AsyncGeneratorPool — 异步生成器池
type AsyncGenFn = () => Promise<string>;

export class AsyncGeneratorPool {
  private _gens: Map<string, AsyncGenFn> = new Map();
  private _running = 0;
  private _max: number;

  constructor(max = 3) { this._max = max; }

  register(id: string, fn: AsyncGenFn): void { this._gens.set(id, fn); }

  async run(id: string): Promise<string> {
    while (this._running >= this._max) await new Promise(r => setTimeout(r, 5));
    const fn = this._gens.get(id);
    if (!fn) throw new Error(`Generator ${id} not found`);
    this._running++;
    try { return await fn(); } finally { this._running--; }
  }

  async runAll(ids: string[]): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    await Promise.all(ids.map(async id => { out[id] = await this.run(id); }));
    return out;
  }

  running(): number { return this._running; }
  capacity(): number { return this._max; }
  registered(): string[] { return Array.from(this._gens.keys()); }
}

// V4628: QualityGate — 质量门槛（多维度扣分制）
export interface QualityReport {
  score: number;
  issues: string[];
  passed: boolean;
  threshold: number;
}

export class QualityGate {
  private _checks: Map<string, (text: string) => string[]> = new Map();

  addCheck(name: string, fn: (text: string) => string[]): void { this._checks.set(name, fn); }

  evaluate(text: string, threshold = 0.8): QualityReport {
    const issues: string[] = [];
    let totalChecks = 0;
    let failed = 0;
    this._checks.forEach((fn, name) => {
      totalChecks++;
      const problems = fn(text);
      if (problems.length > 0) {
        failed++;
        issues.push(...problems.map(p => `${name}: ${p}`));
      }
    });
    const score = totalChecks === 0 ? 1 : (totalChecks - failed) / totalChecks;
    return { score, issues, passed: score >= threshold, threshold };
  }
}

// V4629: StyleTransferEngine — 风格迁移（提示词 + 关键词替换）
export interface StyleProfile {
  name: string;
  keywords: Map<string, string>;
  tone: 'formal' | 'casual' | 'poetic' | 'terse';
  sentenceAvgLen: number;
}

export class StyleTransferEngine {
  private _profiles: Map<string, StyleProfile> = new Map();

  register(p: StyleProfile): void { this._profiles.set(p.name, p); }

  transfer(text: string, fromStyle: string, toStyle: string): string {
    const from = this._profiles.get(fromStyle);
    const to = this._profiles.get(toStyle);
    if (!from || !to) return text;
    let result = text;
    // Apply to.keywords directly: convert to-style vocabulary
    to.keywords.forEach((v, k) => { result = result.replace(new RegExp(k, 'g'), v); });
    result = `[${to.tone}] ${result}`;
    return result;
  }

  distance(s1: string, s2: string): number {
    const a = this._profiles.get(s1);
    const b = this._profiles.get(s2);
    if (!a || !b) return 1;
    let d = 0;
    if (a.tone !== b.tone) d += 0.5;
    d += Math.abs(a.sentenceAvgLen - b.sentenceAvgLen) / 100;
    return Math.min(1, d);
  }

  styles(): string[] { return Array.from(this._profiles.keys()); }
}

// V4630: AutoSaveCheckpoint — 自动保存 + 间隔触发
export interface SaveRecord {
  id: string;
  content: string;
  timestamp: number;
  trigger: 'timer' | 'chars' | 'manual';
}

export class AutoSaveCheckpoint {
  private _records: SaveRecord[] = [];
  private _lastSave = 0;
  private _interval: number;
  private _charThreshold: number;

  constructor(intervalMs = 5000, charThreshold = 500) {
    this._interval = intervalMs;
    this._charThreshold = charThreshold;
  }

  shouldSave(currentChars: number): boolean {
    const now = Date.now();
    if (now - this._lastSave >= this._interval) return true;
    if (currentChars >= this._charThreshold) return true;
    return false;
  }

  save(content: string, trigger: SaveRecord['trigger']): SaveRecord {
    const r: SaveRecord = { id: `s-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, content, timestamp: Date.now(), trigger };
    this._records.push(r);
    this._lastSave = r.timestamp;
    return r;
  }

  latest(): SaveRecord | undefined {
    return this._records[this._records.length - 1];
  }

  records(): SaveRecord[] { return [...this._records]; }

  setInterval(ms: number): void { this._interval = ms; }
  setCharThreshold(n: number): void { this._charThreshold = n; }
}

// V4631: BranchingNarrativeEngine — 分支叙事
export interface BranchNode {
  id: string;
  parentId: string | null;
  content: string;
  choices: string[];
}

export class BranchingNarrativeEngine {
  private _nodes: Map<string, BranchNode> = new Map();
  private _root: string | null = null;

  addRoot(content: string): BranchNode {
    const node: BranchNode = { id: `root-${Date.now()}`, parentId: null, content, choices: [] };
    this._nodes.set(node.id, node);
    this._root = node.id;
    return node;
  }

  branch(parentId: string, content: string, choices: string[]): BranchNode {
    const node: BranchNode = { id: `b-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, parentId, content, choices };
    this._nodes.set(node.id, node);
    return node;
  }

  get(id: string): BranchNode | undefined { return this._nodes.get(id); }

  children(parentId: string): BranchNode[] {
    return Array.from(this._nodes.values()).filter(n => n.parentId === parentId);
  }

  path(leafId: string): BranchNode[] {
    const path: BranchNode[] = [];
    let current = this._nodes.get(leafId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? this._nodes.get(current.parentId) : undefined;
    }
    return path;
  }

  root(): BranchNode | undefined { return this._root ? this._nodes.get(this._root) : undefined; }

  totalBranches(): number {
    return Array.from(this._nodes.values()).filter(n => n.parentId !== null).length;
  }
}

// V4632: ReWriteSuggester — 重写建议器
export interface RewriteSuggestion {
  original: string;
  suggestion: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export class ReWriteSuggester {
  private _rules: Map<string, (text: string) => RewriteSuggestion[]> = new Map();

  addRule(name: string, fn: (text: string) => RewriteSuggestion[]): void { this._rules.set(name, fn); }

  suggest(text: string): RewriteSuggestion[] {
    const out: RewriteSuggestion[] = [];
    this._rules.forEach((fn) => out.push(...fn(text)));
    return out.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  rules(): string[] { return Array.from(this._rules.keys()); }
}

// V4633: ConsistencyEnforcer — 一致性强制器
export interface ConsistencyRule {
  id: string;
  pattern: RegExp;
  fix: string;
  required: boolean;
}

export class ConsistencyEnforcer {
  private _rules: ConsistencyRule[] = [];
  private _violations: Map<string, number> = new Map();

  addRule(rule: ConsistencyRule): void { this._rules.push(rule); }

  enforce(text: string): { fixed: string; violations: number } {
    let fixed = text;
    let violations = 0;
    for (const rule of this._rules) {
      const matches = fixed.match(rule.pattern);
      if (matches) {
        violations += matches.length;
        this._violations.set(rule.id, (this._violations.get(rule.id) || 0) + matches.length);
        if (rule.required) {
          fixed = fixed.replace(rule.pattern, rule.fix);
        }
      }
    }
    return { fixed, violations };
  }

  violationCount(ruleId: string): number {
    return this._violations.get(ruleId) || 0;
  }

  ruleCount(): number { return this._rules.length; }
}

// V4634: WordCountPredictor — 字数预测（基于章节进度 + 平均速度）
export class WordCountPredictor {
  private _history: { chapter: number; words: number; timestamp: number }[] = [];

  record(chapter: number, words: number): void {
    this._history.push({ chapter, words, timestamp: Date.now() });
  }

  predictRemaining(currentChapter: number, totalChapters: number, targetTotalWords: number): number {
    if (this._history.length === 0) return targetTotalWords;
    const last = this._history[this._history.length - 1];
    const remainingChapters = totalChapters - currentChapter;
    if (remainingChapters <= 0) return 0;
    const avgPerChapter = last.words / Math.max(last.chapter, 1);
    return Math.round(avgPerChapter * remainingChapters);
  }

  averagePerChapter(): number {
    if (this._history.length === 0) return 0;
    const total = this._history.reduce((s, h) => s + h.words, 0);
    const lastChapter = Math.max(...this._history.map(h => h.chapter));
    return total / Math.max(lastChapter, 1);
  }

  willMeetTarget(currentChapter: number, totalChapters: number, targetTotalWords: number): boolean {
    const predicted = this.predictRemaining(currentChapter, totalChapters, targetTotalWords);
    const current = this._history.reduce((s, h) => s + h.words, 0);
    return current + predicted >= targetTotalWords * 0.9;
  }

  history(): { chapter: number; words: number }[] {
    return this._history.map(h => ({ chapter: h.chapter, words: h.words }));
  }
}

// V4635: ReadabilityAnalyzer — 可读性分析（句长 + 词汇多样度 + 句子数）
export interface ReadabilityMetrics {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLen: number;
  uniqueWords: number;
  lexicalDiversity: number; // unique/total
  score: number; // 0-1
}

export class ReadabilityAnalyzer {
  analyze(text: string): ReadabilityMetrics {
    const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    // Treat each Han character as a word token (P-107 style tokenization)
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    const wordCount = chineseChars.length + englishWords.length;
    const uniqueWords = new Set([...chineseChars, ...englishWords]).size;
    const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : 0;
    const lexicalDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;
    // 0-1 score: reward moderate sentence length (10-25 chars) + diversity > 0.3
    let score = 1.0;
    if (avgSentenceLen < 5 || avgSentenceLen > 40) score -= 0.4;
    if (lexicalDiversity < 0.2) score -= 0.3;
    if (lexicalDiversity > 0.8) score -= 0.2; // too diverse = disjointed
    score = Math.max(0, Math.min(1, score));
    return {
      charCount: text.length,
      wordCount,
      sentenceCount: sentences.length,
      avgSentenceLen,
      uniqueWords,
      lexicalDiversity,
      score,
    };
  }
}

export const COAUTHOR2_BATCH_2_ENGINES: readonly string[] = [
  'StreamingWriter', 'AsyncGeneratorPool', 'QualityGate', 'StyleTransferEngine',
  'AutoSaveCheckpoint', 'BranchingNarrativeEngine', 'ReWriteSuggester',
  'ConsistencyEnforcer', 'WordCountPredictor', 'ReadabilityAnalyzer',
];

export class CoAuthor2AdvancedIndex {
  list(): string[] { return [...COAUTHOR2_BATCH_2_ENGINES, 'CoAuthor2AdvancedIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}