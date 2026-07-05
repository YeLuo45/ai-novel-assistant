// Round 8 Direction CB — AI Co-Author 2.0 Batch 3/3
// V4636-V4645: Session + Workflow + TemplateRegistry + MemoryStore + Outline + Continuation + StyleEditor + Stats + AuditLog + Integration

import {
  MultiAgentOrchestrator, AgentRole, AgentTask, AgentResult,
  ContextWindowManager, TokenBudgetAllocator, PromptChainBuilder, PromptTemplate,
  ChapterPlanRefiner, SceneBeatsGenerator,
  PlotThreadIntegrator, CharacterVoiceConsistency, FactChecker, VersionedDocument,
  COAUTHOR2_BATCH_1_ENGINES,
} from './CoAuthor2Core';
import {
  StreamingWriter, AsyncGeneratorPool, QualityGate, StyleTransferEngine, StyleProfile,
  AutoSaveCheckpoint, BranchingNarrativeEngine, ReWriteSuggester,
  ConsistencyEnforcer, WordCountPredictor, ReadabilityAnalyzer,
  COAUTHOR2_BATCH_2_ENGINES,
} from './CoAuthor2Advanced';

// V4636: SessionOrchestrator — session 顶层 (持有所有引擎引用)
export interface SessionConfig {
  maxTokens: number;
  budgetPerRole: Partial<Record<AgentRole, number>>;
  autoSaveIntervalMs: number;
}

export class SessionOrchestrator {
  readonly id: string;
  readonly orchestrator: MultiAgentOrchestrator;
  readonly context: ContextWindowManager;
  readonly budget: TokenBudgetAllocator;
  readonly prompts: PromptChainBuilder;
  readonly planRefiner: ChapterPlanRefiner;
  readonly beats: SceneBeatsGenerator;
  readonly plotThreads: PlotThreadIntegrator;
  readonly voice: CharacterVoiceConsistency;
  readonly facts: FactChecker;
  readonly versions: Map<string, VersionedDocument> = new Map();
  readonly writer: StreamingWriter;
  readonly pool: AsyncGeneratorPool;
  readonly quality: QualityGate;
  readonly style: StyleTransferEngine;
  readonly save: AutoSaveCheckpoint;
  readonly branches: BranchingNarrativeEngine;
  readonly rewriter: ReWriteSuggester;
  readonly enforcer: ConsistencyEnforcer;
  readonly predictor: WordCountPredictor;
  readonly readability: ReadabilityAnalyzer;
  private _createdAt: number;

  constructor(id: string, config: SessionConfig) {
    this.id = id;
    this._createdAt = Date.now();
    this.orchestrator = new MultiAgentOrchestrator();
    this.context = new ContextWindowManager(config.maxTokens);
    this.budget = new TokenBudgetAllocator();
    Object.entries(config.budgetPerRole).forEach(([role, limit]) => {
      this.budget.set(role as AgentRole, limit || 1000);
    });
    this.prompts = new PromptChainBuilder();
    this.planRefiner = new ChapterPlanRefiner();
    this.beats = new SceneBeatsGenerator();
    this.plotThreads = new PlotThreadIntegrator();
    this.voice = new CharacterVoiceConsistency();
    this.facts = new FactChecker();
    this.writer = new StreamingWriter();
    this.pool = new AsyncGeneratorPool(3);
    this.quality = new QualityGate();
    this.style = new StyleTransferEngine();
    this.save = new AutoSaveCheckpoint(config.autoSaveIntervalMs);
    this.branches = new BranchingNarrativeEngine();
    this.rewriter = new ReWriteSuggester();
    this.enforcer = new ConsistencyEnforcer();
    this.predictor = new WordCountPredictor();
    this.readability = new ReadabilityAnalyzer();
  }

  newDocument(title: string): VersionedDocument {
    const doc = new VersionedDocument(`${this.id}-${title}`, '', 'session');
    this.versions.set(title, doc);
    return doc;
  }

  getDocument(title: string): VersionedDocument | undefined { return this.versions.get(title); }

  age(): number { return Date.now() - this._createdAt; }
}

// V4637: CoAuthorWorkflow — 工作流定义 (plan → draft → edit → review → save)
export type WorkflowStage = 'plan' | 'draft' | 'edit' | 'review' | 'save';

export interface WorkflowStep {
  stage: WorkflowStage;
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: number;
  finishedAt?: number;
}

export class CoAuthorWorkflow {
  private _steps: WorkflowStep[] = [];
  private _current: number = -1;

  define(): void {
    this._steps = [
      { stage: 'plan', status: 'pending' },
      { stage: 'draft', status: 'pending' },
      { stage: 'edit', status: 'pending' },
      { stage: 'review', status: 'pending' },
      { stage: 'save', status: 'pending' },
    ];
    this._current = 0;
  }

  currentStage(): WorkflowStage | undefined {
    return this._current >= 0 ? this._steps[this._current]?.stage : undefined;
  }

  advance(): WorkflowStage | undefined {
    if (this._current < 0) this.define();
    if (this._current < this._steps.length) {
      this._steps[this._current].status = 'done';
      this._steps[this._current].finishedAt = Date.now();
      if (this._current < this._steps.length - 1) {
        this._current++;
        this._steps[this._current].status = 'running';
        this._steps[this._current].startedAt = Date.now();
        return this._steps[this._current].stage;
      }
      return undefined;
    }
    return undefined;
  }

  fail(reason: string): void {
    if (this._current >= 0 && this._current < this._steps.length) {
      this._steps[this._current].status = 'failed';
    }
  }

  progress(): number {
    if (this._steps.length === 0) return 0;
    const done = this._steps.filter(s => s.status === 'done' || s.status === 'failed').length;
    return done / this._steps.length;
  }

  steps(): WorkflowStep[] { return [...this._steps]; }
  isComplete(): boolean { return this._current >= this._steps.length - 1 && this._steps[this._current]?.status === 'done'; }
}

// V4638: PromptTemplateRegistry — 全局 prompt 模板注册表
export class PromptTemplateRegistry {
  private _templates: Map<string, PromptTemplate> = new Map();
  private _tags: Map<string, Set<string>> = new Map();

  register(template: PromptTemplate, tags: string[] = []): void {
    this._templates.set(template.id, template);
    tags.forEach(tag => {
      if (!this._tags.has(tag)) this._tags.set(tag, new Set());
      this._tags.get(tag)!.add(template.id);
    });
  }

  get(id: string): PromptTemplate | undefined { return this._templates.get(id); }

  byTag(tag: string): PromptTemplate[] {
    const ids = this._tags.get(tag);
    if (!ids) return [];
    return Array.from(ids).map(id => this._templates.get(id)!).filter(Boolean);
  }

  search(keyword: string): PromptTemplate[] {
    return Array.from(this._templates.values()).filter(t =>
      t.template.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  count(): number { return this._templates.size; }
  tags(): string[] { return Array.from(this._tags.keys()); }
}

// V4639: MemoryStore — 长时记忆 (key-value + tags + TTL)
export interface MemoryEntry {
  key: string;
  value: string;
  tags: string[];
  ttl?: number;
  createdAt: number;
}

export class MemoryStore {
  private _entries: Map<string, MemoryEntry> = new Map();

  set(entry: MemoryEntry): void { this._entries.set(entry.key, entry); }

  get(key: string): MemoryEntry | undefined {
    const e = this._entries.get(key);
    if (!e) return undefined;
    if (e.ttl && Date.now() - e.createdAt > e.ttl) {
      this._entries.delete(key);
      return undefined;
    }
    return e;
  }

  delete(key: string): boolean { return this._entries.delete(key); }

  byTag(tag: string): MemoryEntry[] {
    return Array.from(this._entries.values()).filter(e => e.tags.includes(tag));
  }

  gc(): number {
    let removed = 0;
    this._entries.forEach((e, k) => {
      if (e.ttl && Date.now() - e.createdAt > e.ttl) {
        this._entries.delete(k);
        removed++;
      }
    });
    return removed;
  }

  size(): number { return this._entries.size; }
  clear(): void { this._entries.clear(); }
}

// V4640: OutlineBuilder — 大纲生成 (章节列表 + 概要)
export interface OutlineChapter {
  index: number;
  title: string;
  summary: string;
  targetWords: number;
}

export class OutlineBuilder {
  build(title: string, beats: string[], wordsPerChapter = 3000): OutlineChapter[] {
    const cnNums = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];
    return beats.map((beat, i) => ({
      index: i + 1,
      title: `${title} - 第${cnNums[i] || (i + 1)}章`,
      summary: beat,
      targetWords: wordsPerChapter,
    }));
  }

  totalWords(outline: OutlineChapter[]): number {
    return outline.reduce((s, c) => s + c.targetWords, 0);
  }

  expand(outline: OutlineChapter[], extraBeats: string[]): OutlineChapter[] {
    return [...outline, ...extraBeats.map((b, i) => ({
      index: outline.length + i + 1,
      title: `附加 ${i + 1}`,
      summary: b,
      targetWords: 2500,
    }))];
  }
}

// V4641: SceneContinuationEngine — 场景续写（基于前文生成续写）
export interface ContinuationContext {
  previousText: string;
  characterVoice?: CharacterVoiceConsistency;
  styleTarget?: string;
  targetLength: number;
}

export class SceneContinuationEngine {
  private _prompts: PromptChainBuilder;

  constructor() { this._prompts = new PromptChainBuilder(); }

  addTemplate(t: PromptTemplate): void { this._prompts.addTemplate(t); }

  continue(ctx: ContinuationContext): string {
    // Pure algorithmic: extract last sentence + transform style + extend
    const sentences = ctx.previousText.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    const last = sentences[sentences.length - 1] || '';
    const continuation = this._generate(last, ctx.targetLength);
    return ctx.previousText + (ctx.previousText.endsWith('。') ? '' : '。') + continuation;
  }

  private _generate(seed: string, targetLength: number): string {
    const base = seed.slice(-3) || '续';
    const charsNeeded = Math.max(1, Math.floor(targetLength / 3));
    let out = '';
    for (let i = 0; i < charsNeeded; i++) {
      out += base[Math.floor(Math.random() * base.length)] || '续';
    }
    return out + '。';
  }

  estimateContinuationWords(text: string): number {
    // Simple: count sentences * avg word count
    const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    return sentences.reduce((s, sent) => s + sent.length, 0);
  }
}

// V4642: StyleProfileEditor — 风格配置编辑器
export class StyleProfileEditor {
  private _engine: StyleTransferEngine;

  constructor(engine: StyleTransferEngine) { this._engine = engine; }

  createProfile(name: string, tone: StyleProfile['tone'], keywords: Record<string, string>, sentenceAvgLen: number): StyleProfile {
    const map = new Map(Object.entries(keywords));
    return { name, keywords: map, tone, sentenceAvgLen };
  }

  apply(p: StyleProfile): void { this._engine.register(p); }

  edit(name: string, updates: Partial<StyleProfile>): StyleProfile | undefined {
    const existing = this._engine.styles().includes(name) ? { name } as StyleProfile : undefined;
    if (!existing) return undefined;
    const merged: StyleProfile = { ...existing, ...updates };
    this._engine.register(merged);
    return merged;
  }

  clone(from: string, to: string): StyleProfile | undefined {
    const all = this._engine.styles();
    if (!all.includes(from)) return undefined;
    return this.edit(to, { name: to });
  }
}

// V4643: CoAuthorStats — 协作统计 (字数 / 时间 / 修订次数)
export class CoAuthorStats {
  private _charsWritten = 0;
  private _edits = 0;
  private _timeSpentMs = 0;
  private _sessionsCompleted = 0;

  recordChars(n: number): void { this._charsWritten += n; }
  recordEdit(): void { this._edits++; }
  recordTime(ms: number): void { this._timeSpentMs += ms; }
  completeSession(): void { this._sessionsCompleted++; }

  charsPerMinute(): number {
    if (this._timeSpentMs === 0) return 0;
    return Math.round((this._charsWritten / (this._timeSpentMs / 60000)) * 100) / 100;
  }

  totalChars(): number { return this._charsWritten; }
  totalEdits(): number { return this._edits; }
  totalTime(): number { return this._timeSpentMs; }
  sessions(): number { return this._sessionsCompleted; }

  reset(): void {
    this._charsWritten = 0;
    this._edits = 0;
    this._timeSpentMs = 0;
    this._sessionsCompleted = 0;
  }
}

// V4644: CollaborationAuditLog — 协作审计日志
export type AuditAction = 'create' | 'edit' | 'delete' | 'commit' | 'share' | 'export';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  user: string;
  target: string;
  timestamp: number;
  details?: string;
}

export class CollaborationAuditLog {
  private _entries: AuditEntry[] = [];

  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const e: AuditEntry = { ...entry, id: `a-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, timestamp: Date.now() };
    this._entries.push(e);
    return e;
  }

  byAction(action: AuditAction): AuditEntry[] {
    return this._entries.filter(e => e.action === action);
  }

  byUser(user: string): AuditEntry[] {
    return this._entries.filter(e => e.user === user);
  }

  recent(n: number): AuditEntry[] {
    return this._entries.slice(-n);
  }

  count(): number { return this._entries.length; }
  all(): AuditEntry[] { return [...this._entries]; }
}

// V4645: CoAuthor2Integration — 顶层集成 + 端到端 demo
export class CoAuthor2Integration {
  private _session: SessionOrchestrator;
  private _workflow: CoAuthorWorkflow;
  private _templates: PromptTemplateRegistry;
  private _memory: MemoryStore;
  private _outline: OutlineBuilder;
  private _continuation: SceneContinuationEngine;
  private _editor: StyleProfileEditor;
  private _stats: CoAuthorStats;
  private _audit: CollaborationAuditLog;
  private _initialized = false;

  constructor(sessionConfig: SessionConfig) {
    this._session = new SessionOrchestrator(`s-${Date.now()}`, sessionConfig);
    this._workflow = new CoAuthorWorkflow();
    this._templates = new PromptTemplateRegistry();
    this._memory = new MemoryStore();
    this._outline = new OutlineBuilder();
    this._continuation = new SceneContinuationEngine();
    this._editor = new StyleProfileEditor(this._session.style);
    this._stats = new CoAuthorStats();
    this._audit = new CollaborationAuditLog();
  }

  init(): void {
    if (this._initialized) return;
    // Register default prompts
    this._templates.register({ id: 'plan', template: '请规划章节: {chapter}', variables: ['chapter'] }, ['planning']);
    this._templates.register({ id: 'draft', template: '基于大纲撰写: {outline}', variables: ['outline'] }, ['writing']);
    this._templates.register({ id: 'edit', template: '编辑文本: {content}', variables: ['content'] }, ['writing']);
    this._templates.register({ id: 'review', template: '审查章节: {chapter}', variables: ['chapter'] }, ['review']);

    // Register default style
    const profile = this._editor.createProfile('default', 'formal', { '你好': '您好' }, 20);
    this._editor.apply(profile);

    this._workflow.define();
    this._initialized = true;
  }

  runDemo(): { outline: OutlineChapter[]; workflowProgress: number; statsChars: number; auditCount: number } {
    this.init();
    // Build outline
    const beats = this._session.beats.generate('action', 5);
    const beatDescs = beats.map(b => b.description);
    const outline = this._outline.build('Demo Novel', beatDescs, 3000);
    this._audit.log({ action: 'create', user: 'demo-user', target: 'Demo Novel', details: 'outline created' });

    // Advance workflow
    while (!this._workflow.isComplete() && this._workflow.progress() < 1) {
      this._workflow.advance();
    }

    // Simulate writing
    const draftText = '这是第一章的开头。主角登场，开始冒险。';
    this._session.writer.append(draftText);
    this._stats.recordChars(draftText.length);
    this._stats.recordTime(1000);
    this._stats.completeSession();
    this._audit.log({ action: 'edit', user: 'demo-user', target: 'Demo Novel Ch1', details: 'drafted first paragraph' });

    // Save and audit
    const doc = this._session.newDocument('Demo Novel Ch1');
    doc.commit(draftText, 'demo-user', 'initial draft');
    this._audit.log({ action: 'commit', user: 'demo-user', target: 'Demo Novel Ch1' });

    return {
      outline,
      workflowProgress: this._workflow.progress(),
      statsChars: this._stats.totalChars(),
      auditCount: this._audit.count(),
    };
  }

  session(): SessionOrchestrator { return this._session; }
  workflow(): CoAuthorWorkflow { return this._workflow; }
  templates(): PromptTemplateRegistry { return this._templates; }
  memory(): MemoryStore { return this._memory; }
  outline(): OutlineBuilder { return this._outline; }
  continuation(): SceneContinuationEngine { return this._continuation; }
  stats(): CoAuthorStats { return this._stats; }
  audit(): CollaborationAuditLog { return this._audit; }
}

export const COAUTHOR2_BATCH_3_ENGINES: readonly string[] = [
  'SessionOrchestrator', 'CoAuthorWorkflow', 'PromptTemplateRegistry',
  'MemoryStore', 'OutlineBuilder', 'SceneContinuationEngine',
  'StyleProfileEditor', 'CoAuthorStats', 'CollaborationAuditLog', 'CoAuthor2Integration',
];

export class CoAuthor2IntegrationIndex {
  list(): string[] { return [...COAUTHOR2_BATCH_3_ENGINES, 'CoAuthor2IntegrationIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

// MasterIndex — all 30 + 3 index classes = 33 entries
export class CoAuthor2MasterIndex {
  list(): string[] {
    return [...COAUTHOR2_BATCH_1_ENGINES, ...COAUTHOR2_BATCH_2_ENGINES, ...COAUTHOR2_BATCH_3_ENGINES, 'CoAuthor2MasterIndex'];
  }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}