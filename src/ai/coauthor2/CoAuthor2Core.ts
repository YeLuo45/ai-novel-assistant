// Round 8 Direction CB — AI Co-Author 2.0 Batch 1/3
// V4616-V4625: Multi-Agent Orchestrator + Context Window + Token Budget + Prompt Chain + Chapter Plan + Scene Beats + Plot Thread + Character Voice + Fact Checker + Versioned Doc
// 3-files × 10-engines pattern (P-97)

export type AgentRole = 'planner' | 'writer' | 'editor' | 'reviewer' | 'continuity' | 'voice' | 'fact' | 'style' | 'pacing' | 'researcher';

export interface AgentTask {
  id: string;
  role: AgentRole;
  input: string;
  priority: number;
  dependsOn: string[];
}

export interface AgentResult {
  taskId: string;
  role: AgentRole;
  output: string;
  tokensUsed: number;
  durationMs: number;
  status: 'success' | 'partial' | 'failed';
}

// V4616: MultiAgentOrchestrator — 并行/串行调度多 agent task
export class MultiAgentOrchestrator {
  private _tasks: AgentTask[] = [];
  private _results: Map<string, AgentResult> = new Map();
  private _handlers: Map<AgentRole, (input: string) => Promise<AgentResult>> = new Map();

  registerHandler(role: AgentRole, handler: (input: string) => Promise<AgentResult>): void {
    this._handlers.set(role, handler);
  }

  submit(task: AgentTask): void {
    this._tasks.push(task);
  }

  pending(): AgentTask[] {
    return this._tasks.filter(t => !this._results.has(t.id));
  }

  completed(): AgentResult[] {
    return Array.from(this._results.values());
  }

  readyTasks(): AgentTask[] {
    return this.pending().filter(t => t.dependsOn.every(dep => this._results.has(dep)));
  }

  async runOnce(): Promise<AgentResult[]> {
    const ready = this.readyTasks();
    const out: AgentResult[] = [];
    for (const t of ready) {
      const handler = this._handlers.get(t.role);
      if (!handler) {
        const r: AgentResult = { taskId: t.id, role: t.role, output: '', tokensUsed: 0, durationMs: 0, status: 'failed' };
        this._results.set(t.id, r);
        out.push(r);
        continue;
      }
      const result = await handler(t.input);
      this._results.set(t.id, result);
      out.push(result);
    }
    return out;
  }

  async runAll(maxIters = 50): Promise<AgentResult[]> {
    let all: AgentResult[] = [];
    for (let i = 0; i < maxIters && this.pending().length > 0; i++) {
      const batch = await this.runOnce();
      if (batch.length === 0) break;
      all = all.concat(batch);
    }
    return all;
  }

  reset(): void {
    this._tasks = [];
    this._results.clear();
  }

  count(): number { return this._tasks.length; }
}

// V4617: ContextWindowManager — 滑动窗口 + 摘要 + 截断
export interface ContextChunk {
  id: string;
  text: string;
  tokens: number;
  priority: number; // higher = keep longer
  pinned?: boolean;
}

export class ContextWindowManager {
  private _chunks: ContextChunk[] = [];
  private _maxTokens: number;

  constructor(maxTokens = 4000) { this._maxTokens = maxTokens; }

  add(chunk: ContextChunk): void {
    if (chunk.pinned) {
      this._chunks.unshift(chunk);
      return;
    }
    this._chunks.push(chunk);
    this._enforceLimit();
  }

  remove(id: string): void {
    this._chunks = this._chunks.filter(c => c.id !== id);
  }

  pin(id: string, pinned = true): void {
    const c = this._chunks.find(x => x.id === id);
    if (c) {
      c.pinned = pinned;
      if (pinned) this._chunks.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }
  }

  private _enforceLimit(): void {
    const pinned = this._chunks.filter(c => c.pinned);
    const movable = this._chunks.filter(c => !c.pinned).sort((a, b) => b.priority - a.priority);
    let total = pinned.reduce((s, c) => s + c.tokens, 0);
    const kept: ContextChunk[] = [];
    for (const c of movable) {
      if (total + c.tokens <= this._maxTokens) {
        kept.push(c);
        total += c.tokens;
      }
    }
    this._chunks = [...pinned, ...kept];
  }

  setMaxTokens(n: number): void {
    this._maxTokens = n;
    this._enforceLimit();
  }

  totalTokens(): number { return this._chunks.reduce((s, c) => s + c.tokens, 0); }
  remaining(): number { return this._maxTokens - this.totalTokens(); }
  renderText(): string { return this._chunks.map(c => c.text).join('\n\n'); }
  size(): number { return this._chunks.length; }
}

// V4618: TokenBudgetAllocator — 按 agent 分配预算 + 超限拒绝
export interface BudgetEntry {
  agentRole: AgentRole;
  limit: number;
  used: number;
}

export class TokenBudgetAllocator {
  private _entries: Map<AgentRole, BudgetEntry> = new Map();

  set(role: AgentRole, limit: number): void {
    this._entries.set(role, { agentRole: role, limit, used: 0 });
  }

  consume(role: AgentRole, amount: number): boolean {
    const e = this._entries.get(role);
    if (!e) return false;
    if (e.used + amount > e.limit) return false;
    e.used += amount;
    return true;
  }

  remaining(role: AgentRole): number {
    const e = this._entries.get(role);
    return e ? e.limit - e.used : 0;
  }

  reset(role?: AgentRole): void {
    if (role) {
      const e = this._entries.get(role);
      if (e) e.used = 0;
    } else {
      this._entries.forEach(e => { e.used = 0; });
    }
  }

  totalLimit(): number {
    let sum = 0;
    this._entries.forEach(e => { sum += e.limit; });
    return sum;
  }

  totalUsed(): number {
    let sum = 0;
    this._entries.forEach(e => { sum += e.used; });
    return sum;
  }
}

// V4619: PromptChainBuilder — 链式 prompt 模板 + 变量注入
export interface PromptTemplate {
  id: string;
  template: string;
  variables: string[];
}

export class PromptChainBuilder {
  private _templates: Map<string, PromptTemplate> = new Map();

  addTemplate(t: PromptTemplate): void { this._templates.set(t.id, t); }

  get(id: string): PromptTemplate | undefined { return this._templates.get(id); }

  build(id: string, vars: Record<string, string>): string {
    const t = this._templates.get(id);
    if (!t) throw new Error(`Template ${id} not found`);
    let result = t.template;
    for (const k of t.variables) {
      const v = vars[k] ?? '';
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return result;
  }

  chain(templateIds: string[], vars: Record<string, string>): string {
    return templateIds.map(id => this.build(id, vars)).join('\n\n---\n\n');
  }

  extractVariables(template: string): string[] {
    const matches = template.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.slice(1, -1))));
  }
}

// V4620: ChapterPlanRefiner — 章节计划迭代优化
export interface ChapterPlan {
  id: string;
  title: string;
  summary: string;
  beats: string[];
  targetWords: number;
}

export class ChapterPlanRefiner {
  private _history: Map<string, ChapterPlan[]> = new Map();

  refine(plan: ChapterPlan, feedback: string): ChapterPlan {
    const newPlan: ChapterPlan = {
      ...plan,
      summary: plan.summary + ' [refined: ' + feedback.slice(0, 50) + ']',
      beats: [...plan.beats, 'address: ' + feedback.slice(0, 30)],
    };
    const hist = this._history.get(plan.id) || [];
    hist.push(newPlan);
    this._history.set(plan.id, hist);
    return newPlan;
  }

  history(id: string): ChapterPlan[] { return this._history.get(id) || []; }

  bestVersion(id: string): ChapterPlan | undefined {
    const hist = this._history.get(id);
    if (!hist || hist.length === 0) return undefined;
    return hist[hist.length - 1];
  }

  iterationCount(id: string): number {
    return (this._history.get(id) || []).length;
  }

  reset(id: string): void { this._history.delete(id); }
}

// V4621: SceneBeatsGenerator — 场景节拍生成
export interface SceneBeat {
  id: string;
  type: 'setup' | 'complication' | 'crisis' | 'climax' | 'resolution';
  description: string;
  duration: number;
}

export class SceneBeatsGenerator {
  private _templates: Map<string, string[]> = new Map([
    ['action', ['setup stakes', 'introduce obstacle', 'escalate conflict', 'reach climax', 'resolve aftermath']],
    ['romance', ['establish connection', 'develop tension', 'misunderstanding', 'confession', 'commitment']],
    ['mystery', ['present puzzle', 'gather clues', 'red herring', 'reveal truth', 'tie loose ends']],
  ]);

  generate(type: 'action' | 'romance' | 'mystery', count = 5): SceneBeat[] {
    const tmpl = this._templates.get(type) || [];
    return tmpl.slice(0, count).map((desc, i) => ({
      id: `${type}-${i}`,
      type: ['setup', 'complication', 'crisis', 'climax', 'resolution'][i] as SceneBeat['type'],
      description: desc,
      duration: 100 + i * 50,
    }));
  }

  totalDuration(beats: SceneBeat[]): number {
    return beats.reduce((s, b) => s + b.duration, 0);
  }

  validate(beats: SceneBeat[]): string[] {
    const issues: string[] = [];
    if (beats.length < 3) issues.push('too few beats');
    if (beats.length > 10) issues.push('too many beats');
    if (!beats.some(b => b.type === 'climax')) issues.push('missing climax');
    return issues;
  }
}

// V4622: PlotThreadIntegrator — 多情节线交织
export interface PlotThread {
  id: string;
  name: string;
  chapterStarts: number[];
  weight: number;
}

export class PlotThreadIntegrator {
  private _threads: PlotThread[] = [];

  add(t: PlotThread): void { this._threads.push(t); }

  threadsAtChapter(chapter: number): PlotThread[] {
    return this._threads.filter(t => t.chapterStarts.some(c => Math.abs(c - chapter) <= 1));
  }

  interleavingSchedule(totalChapters: number): Map<number, PlotThread[]> {
    const result = new Map<number, PlotThread[]>();
    for (let ch = 1; ch <= totalChapters; ch++) {
      result.set(ch, this.threadsAtChapter(ch));
    }
    return result;
  }

  dominantThread(): PlotThread | undefined {
    if (this._threads.length === 0) return undefined;
    return this._threads.reduce((a, b) => (a.weight >= b.weight ? a : b));
  }

  coverage(): number {
    if (this._threads.length === 0) return 0;
    const total = this._threads.reduce((s, t) => s + t.weight, 0);
    return total / this._threads.length;
  }
}

// V4623: CharacterVoiceConsistency — 人物声音指纹一致性
export interface VoiceFingerprint {
  characterId: string;
  avgSentenceLen: number;
  vocabulary: string[];
  catchphrases: string[];
  formality: number; // 0-1
}

export class CharacterVoiceConsistency {
  private _profiles: Map<string, VoiceFingerprint> = new Map();

  setProfile(p: VoiceFingerprint): void { this._profiles.set(p.characterId, p); }

  fingerprint(text: string, characterId: string): VoiceFingerprint {
    const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    const avgLen = sentences.length > 0 ? text.length / sentences.length : 0;
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    const vocabulary = Array.from(new Set(words)).slice(0, 20);
    const formality = this._estimateFormality(text);
    const fp: VoiceFingerprint = {
      characterId,
      avgSentenceLen: avgLen,
      vocabulary,
      catchphrases: vocabulary.slice(0, 3),
      formality,
    };
    this._profiles.set(characterId, fp);
    return fp;
  }

  consistency(characterId: string, text: string): number {
    const stored = this._profiles.get(characterId);
    if (!stored) return 0;
    const current = this.fingerprint(text, characterId);
    let score = 1.0;
    if (Math.abs(stored.avgSentenceLen - current.avgSentenceLen) > 10) score -= 0.3;
    if (Math.abs(stored.formality - current.formality) > 0.3) score -= 0.3;
    const overlap = stored.vocabulary.filter(v => current.vocabulary.includes(v)).length;
    if (overlap / Math.max(stored.vocabulary.length, 1) < 0.2) score -= 0.4;
    return Math.max(0, score);
  }

  private _estimateFormality(text: string): number {
    const formalWords = (text.match(/您|请|之|其/g) || []).length;
    const informal = (text.match(/我|哈|啊|嘿/g) || []).length;
    const total = formalWords + informal;
    return total === 0 ? 0.5 : formalWords / total;
  }

  profile(id: string): VoiceFingerprint | undefined { return this._profiles.get(id); }
}

// V4624: FactChecker — 事实一致性核查
export interface FactEntry {
  id: string;
  claim: string;
  context: string;
  verified: boolean;
  source?: string;
}

export class FactChecker {
  private _facts: Map<string, FactEntry> = new Map();

  add(fact: FactEntry): void { this._facts.set(fact.id, fact); }

  verify(id: string, verified: boolean, source?: string): void {
    const f = this._facts.get(id);
    if (f) {
      f.verified = verified;
      if (source) f.source = source;
    }
  }

  check(claim: string, context: string): { matches: FactEntry[]; contradictions: FactEntry[] } {
    const matches: FactEntry[] = [];
    const contradictions: FactEntry[] = [];
    this._facts.forEach(f => {
      if (f.context === context) {
        if (f.claim.toLowerCase().includes(claim.toLowerCase()) || claim.toLowerCase().includes(f.claim.toLowerCase())) {
          if (f.verified) matches.push(f);
          else contradictions.push(f);
        }
      }
    });
    return { matches, contradictions };
  }

  verified(): FactEntry[] {
    return Array.from(this._facts.values()).filter(f => f.verified);
  }

  unverified(): FactEntry[] {
    return Array.from(this._facts.values()).filter(f => !f.verified);
  }

  ratio(): number {
    const total = this._facts.size;
    if (total === 0) return 0;
    return this.verified().length / total;
  }
}

// V4625: VersionedDocument — 文档版本控制 + diff
export interface DocVersion {
  version: number;
  content: string;
  author: string;
  timestamp: number;
  message: string;
}

export class VersionedDocument {
  private _versions: DocVersion[] = [];
  private _id: string;

  constructor(id: string, initialContent = '', author = 'system') {
    this._id = id;
    this._versions.push({ version: 1, content: initialContent, author, timestamp: Date.now(), message: 'init' });
  }

  commit(content: string, author: string, message: string): DocVersion {
    const v: DocVersion = {
      version: this._versions.length + 1,
      content,
      author,
      timestamp: Date.now(),
      message,
    };
    this._versions.push(v);
    return v;
  }

  get(v: number): DocVersion | undefined {
    return this._versions.find(x => x.version === v);
  }

  current(): DocVersion { return this._versions[this._versions.length - 1]; }

  diff(v1: number, v2: number): string {
    const a = this.get(v1);
    const b = this.get(v2);
    if (!a || !b) return '';
    const linesA = a.content.split('\n');
    const linesB = b.content.split('\n');
    const diff: string[] = [];
    const max = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < max; i++) {
      if (linesA[i] !== linesB[i]) {
        diff.push(`- ${linesA[i] || ''}`);
        diff.push(`+ ${linesB[i] || ''}`);
      }
    }
    return diff.join('\n');
  }

  history(): DocVersion[] { return [...this._versions]; }
  id(): string { return this._id; }
  versionCount(): number { return this._versions.length; }
}

// CoAuthor2CoreIndex — P-83/P-110 自包含清单
export const COAUTHOR2_BATCH_1_ENGINES = [
  'MultiAgentOrchestrator', 'ContextWindowManager', 'TokenBudgetAllocator',
  'PromptChainBuilder', 'ChapterPlanRefiner', 'SceneBeatsGenerator',
  'PlotThreadIntegrator', 'CharacterVoiceConsistency', 'FactChecker', 'VersionedDocument',
] as const;

export class CoAuthor2CoreIndex {
  list(): string[] { return [...COAUTHOR2_BATCH_1_ENGINES, 'CoAuthor2CoreIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}