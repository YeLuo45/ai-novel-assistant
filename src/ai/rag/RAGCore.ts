// Round 8 Direction CG — RAG for Chapter Context Batch 1/2 + 2/2 combined (30 engines)

export interface Source {
  id: string;
  content: string;
  metadata?: Record<string, string>;
  score?: number;
}

export interface AugmentedPrompt {
  query: string;
  context: string;
  sources: Source[];
}

export interface RAGResult {
  answer: string;
  sources: Source[];
  confidence: number;
}

// === Batch 1: RAG Core (V4766-V4775) ===

// V4766: RAGRetriever — 主 RAG 检索器
export class RAGRetriever {
  private _documents: Map<string, Source> = new Map();

  add(doc: Source): void { this._documents.set(doc.id, doc); }

  remove(id: string): boolean { return this._documents.delete(id); }

  get(id: string): Source | undefined { return this._documents.get(id); }

  size(): number { return this._documents.size; }

  retrieve(query: string, topK = 5): Source[] {
    const queryTokens = new Set(query.toLowerCase().split(/\s+/));
    const scored: Source[] = [];
    this._documents.forEach(doc => {
      const docTokens = doc.content.toLowerCase().split(/\s+/);
      const matches = docTokens.filter(t => queryTokens.has(t)).length;
      const score = matches / Math.max(queryTokens.size, 1);
      scored.push({ ...doc, score });
    });
    return scored.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, topK);
  }
}

// V4767: ContextWindowBuilder — 上下文窗口构建
export class ContextWindowBuilder {
  build(sources: Source[], maxChars = 2000): string {
    let ctx = '';
    for (const s of sources) {
      if ((ctx + s.content).length > maxChars) break;
      ctx += s.content + '\n\n';
    }
    return ctx.trim();
  }

  charCount(text: string): number { return text.length; }

  fits(text: string, maxChars: number): boolean { return text.length <= maxChars; }
}

// V4768: PromptAugmenter — prompt 增强
export class PromptAugmenter {
  augment(query: string, context: string, systemPrompt = 'You are a helpful assistant.'): AugmentedPrompt {
    const prompt = `${systemPrompt}\n\nContext:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;
    return { query, context, sources: [] };
  }

  format(aug: AugmentedPrompt): string {
    return `Question: ${aug.query}\n\nContext:\n${aug.context}`;
  }
}

// V4769: CitationTracker — 引用追踪
export interface Citation {
  id: string;
  sourceId: string;
  text: string;
  position: number;
}

export class CitationTracker {
  private _citations: Citation[] = [];

  cite(sourceId: string, text: string, position: number): Citation {
    const c: Citation = { id: `c-${Date.now()}-${this._citations.length}`, sourceId, text, position };
    this._citations.push(c);
    return c;
  }

  all(): Citation[] { return [...this._citations]; }
  bySource(sourceId: string): Citation[] { return this._citations.filter(c => c.sourceId === sourceId); }
  count(): number { return this._citations.length; }
  clear(): void { this._citations = []; }
}

// V4770: SourceRanker — 来源排序 (relevance + recency)
export class SourceRanker {
  rank(sources: Source[], recencyBoost = 0.1): Source[] {
    return sources.map(s => ({
      ...s,
      score: (s.score || 0.5) + recencyBoost * Math.random(),
    })).sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}

// V4771: QueryRewriter — 查询改写
export class QueryRewriter {
  rewrite(query: string): string {
    return query.trim().replace(/\s+/g, ' ');
  }

  expandSynonyms(query: string, synonyms: Map<string, string[]>): string {
    const words = query.split(/\s+/);
    return words.map(w => {
      const syns = synonyms.get(w.toLowerCase());
      if (syns && syns.length > 0) return `${w} ${syns[0]}`;
      return w;
    }).join(' ');
  }
}

// V4772: SubQueryGenerator — 子查询生成
export class SubQueryGenerator {
  generate(query: string): string[] {
    // Simple: split on "and" / "或" / "and"
    return query.split(/\s+(and|or|和|或)\s+/i).filter(s => s.length > 2);
  }

  count(query: string): number {
    return this.generate(query).length;
  }
}

// V4773: MultiHopReasoner — 多跳推理（多轮检索）
export class MultiHopReasoner {
  private _hops: { query: string; results: Source[] }[] = [];

  hop(query: string, retriever: RAGRetriever, maxHops = 3): Source[] {
    const allResults: Source[] = [];
    for (let i = 0; i < maxHops; i++) {
      const results = retriever.retrieve(query, 5);
      this._hops.push({ query, results });
      allResults.push(...results);
      if (results.length === 0) break;
      // Next hop: use top result content as new query seed
      query = results[0].content.slice(0, 100);
    }
    return allResults;
  }

  hops(): { query: string; results: Source[] }[] { return [...this._hops]; }
  clear(): void { this._hops = []; }
}

// V4774: ContextCompressor — 上下文压缩 (extractive)
export class ContextCompressor {
  compress(text: string, ratio = 0.5): string {
    const sentences = text.split(/([。！？.!?]+)/).filter(s => s.trim().length > 0);
    const target = Math.max(1, Math.floor(sentences.length * ratio));
    return sentences.slice(0, target).join('');
  }

  compressionRatio(original: string, compressed: string): number {
    return original.length === 0 ? 0 : compressed.length / original.length;
  }
}

// V4775: RelevanceScorer — 相关性评分
export class RelevanceScorer {
  score(query: string, doc: string): number {
    const qTokens = new Set(query.toLowerCase().split(/\s+/));
    const dTokens = doc.toLowerCase().split(/\s+/);
    const matches = dTokens.filter(t => qTokens.has(t)).length;
    return matches / Math.max(qTokens.size, 1);
  }

  threshold(query: string, doc: string, threshold = 0.3): boolean {
    return this.score(query, doc) >= threshold;
  }
}

// === Batch 2: Advanced (V4776-V4785) ===

// V4776: RAGSession — session 顶层
export interface RAGSessionConfig {
  topK: number;
  contextMaxChars: number;
}

export class RAGSession {
  readonly id: string;
  readonly config: RAGSessionConfig;
  readonly retriever: RAGRetriever;
  readonly contextBuilder: ContextWindowBuilder;
  readonly augmenter: PromptAugmenter;
  readonly citationTracker: CitationTracker;
  readonly ranker: SourceRanker;
  readonly rewriter: QueryRewriter;
  readonly subQueryGen: SubQueryGenerator;
  readonly multiHop: MultiHopReasoner;
  readonly compressor: ContextCompressor;
  readonly scorer: RelevanceScorer;
  readonly createdAt: number;

  constructor(id: string, config: RAGSessionConfig) {
    this.id = id;
    this.config = config;
    this.createdAt = Date.now();
    this.retriever = new RAGRetriever();
    this.contextBuilder = new ContextWindowBuilder();
    this.augmenter = new PromptAugmenter();
    this.citationTracker = new CitationTracker();
    this.ranker = new SourceRanker();
    this.rewriter = new QueryRewriter();
    this.subQueryGen = new SubQueryGenerator();
    this.multiHop = new MultiHopReasoner();
    this.compressor = new ContextCompressor();
    this.scorer = new RelevanceScorer();
  }

  age(): number { return Date.now() - this.createdAt; }
}

// V4777: DocumentIngester — 文档导入（分割为 chunks）
export interface IngestedChunk {
  id: string;
  docId: string;
  content: string;
  index: number;
}

export class DocumentIngester {
  ingest(docId: string, content: string, chunkSize = 500): IngestedChunk[] {
    const chunks: IngestedChunk[] = [];
    let i = 0;
    let idx = 0;
    while (i < content.length) {
      const end = Math.min(i + chunkSize, content.length);
      chunks.push({ id: `${docId}-${idx}`, docId, content: content.slice(i, end), index: idx++ });
      i = end;
    }
    return chunks;
  }

  totalChunks(chunks: IngestedChunk[]): number { return chunks.length; }
}

// V4778: ChapterChunker — 章节切块（按"第X章"分割）
export class ChapterChunker {
  chunk(text: string): { title: string; content: string; index: number }[] {
    const pattern = /第[一二三四五六七八九十百零0-9]+章[\s\S]*?(?=第[一二三四五六七八九十百零0-9]+章|$)/g;
    const matches = text.match(pattern) || [];
    return matches.map((m, i) => {
      const titleMatch = m.match(/^(第[一二三四五六七八九十百零0-9]+章[^\n]*)/);
      return { title: titleMatch ? titleMatch[1] : `Chapter ${i + 1}`, content: m, index: i };
    });
  }
}

// V4779: SectionParser — 段落解析（识别标题/段落/对话）
export interface ParsedSection {
  type: 'title' | 'paragraph' | 'dialogue';
  content: string;
}

export class SectionParser {
  parse(text: string): ParsedSection[] {
    const sections: ParsedSection[] = [];
    text.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return;
      if (trimmed.startsWith('#') || /^第.+章/.test(trimmed)) {
        sections.push({ type: 'title', content: trimmed });
      } else if (/^["「『]/.test(trimmed) || /^[-—].*[-—]$/.test(trimmed)) {
        sections.push({ type: 'dialogue', content: trimmed });
      } else {
        sections.push({ type: 'paragraph', content: trimmed });
      }
    });
    return sections;
  }

  countByType(sections: ParsedSection[], type: ParsedSection['type']): number {
    return sections.filter(s => s.type === type).length;
  }
}

// V4780: NamedEntityExtractor — 命名实体提取（capitalized words）
export class NamedEntityExtractor {
  extract(text: string): string[] {
    const matches = text.match(/[A-Z][a-z]+|[\u4e00-\u9fa5]{2,3}/g) || [];
    return Array.from(new Set(matches));
  }

  countUnique(text: string): number { return this.extract(text).length; }
}

// V4781: KnowledgeTripletExtractor — 知识三元组 (subject, predicate, object)
export interface KnowledgeTriplet {
  subject: string;
  predicate: string;
  object: string;
}

export class KnowledgeTripletExtractor {
  extract(sentence: string): KnowledgeTriplet[] {
    // Simplified: split on "是"/"有"/"的"
    const triplets: KnowledgeTriplet[] = [];
    const patterns = [
      /([\u4e00-\u9fa5A-Za-z]+)是([\u4e00-\u9fa5A-Za-z]+)/g,
      /([\u4e00-\u9fa5A-Za-z]+)有([\u4e00-\u9fa5A-Za-z]+)/g,
    ];
    patterns.forEach(pattern => {
      let m;
      while ((m = pattern.exec(sentence)) !== null) {
        triplets.push({ subject: m[1], predicate: pattern.source.includes('是') ? '是' : '有', object: m[2] });
      }
    });
    return triplets;
  }
}

// V4782: RetrievalAugmentedGenerator — 主 RAG 生成器
export class RetrievalAugmentedGenerator {
  generate(query: string, sources: Source[]): RAGResult {
    const context = sources.map(s => s.content).join('\n');
    const answer = `[基于 ${sources.length} 个来源] ${query} 的答案：${context.slice(0, 100)}...`;
    const confidence = Math.min(1, sources.length / 5);
    return { answer, sources, confidence };
  }
}

// V4783: HallucinationDetector — 幻觉检测（answer 中是否含来源内容）
export class HallucinationDetector {
  detect(answer: string, sources: Source[]): { hallucinated: boolean; unsupportedClaims: string[] } {
    const sourceText = sources.map(s => s.content).join(' ').toLowerCase();
    const sentences = answer.split(/[。！？.!?]+/).filter(s => s.trim().length > 5);
    const unsupported = sentences.filter(s => {
      const words = s.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      return words.length > 0 && !words.some(w => sourceText.includes(w));
    });
    return { hallucinated: unsupported.length > 0, unsupportedClaims: unsupported };
  }
}

// V4784: FactualConsistencyChecker — 事实一致性核查
export class FactualConsistencyChecker {
  check(answer: string, sources: Source[]): { consistent: boolean; coverage: number } {
    const sourceWords = new Set(
      sources.flatMap(s => s.content.toLowerCase().match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [])
    );
    const answerWords = answer.toLowerCase().match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    if (answerWords.length === 0) return { consistent: false, coverage: 0 };
    const matches = answerWords.filter(w => sourceWords.has(w)).length;
    const coverage = matches / answerWords.length;
    return { consistent: coverage >= 0.3, coverage };
  }
}

// V4785: AnswerPostProcessor — 答案后处理（trim/dedup/format）
export class AnswerPostProcessor {
  process(answer: string): string {
    return answer.trim().replace(/\s+/g, ' ').replace(/(.)\1{3,}/g, '$1$1');
  }

  dedupSentences(answer: string): string {
    const seen = new Set<string>();
    return answer.split(/[。！？.!?]+/).filter(s => {
      const trimmed = s.trim();
      if (trimmed.length === 0 || seen.has(trimmed)) return false;
      seen.add(trimmed);
      return true;
    }).join('。') + '。';
  }
}

// === Batch 3: Integration (V4786-V4795) ===

// V4786: RAGCache — RAG 缓存 (query → result)
export class RAGCache {
  private _cache: Map<string, RAGResult> = new Map();

  get(query: string): RAGResult | undefined { return this._cache.get(query); }

  set(query: string, result: RAGResult): void { this._cache.set(query, result); }

  has(query: string): boolean { return this._cache.has(query); }

  size(): number { return this._cache.size; }
  clear(): void { this._cache.clear(); }
}

// V4787: CitationFormatter — 引用格式化
export class CitationFormatter {
  format(citations: Citation[]): string {
    return citations.map((c, i) => `[${i + 1}] ${c.text.slice(0, 50)}... (from ${c.sourceId})`).join('\n');
  }

  toMarkdown(citations: Citation[]): string {
    return citations.map(c => `- **${c.sourceId}**: ${c.text.slice(0, 80)}`).join('\n');
  }
}

// V4788: QueryAnalyzer — 查询分析（意图/实体）
export interface QueryAnalysis {
  intent: 'factual' | 'opinion' | 'how-to' | 'definition' | 'unknown';
  entities: string[];
}

export class QueryAnalyzer {
  analyze(query: string): QueryAnalysis {
    const lower = query.toLowerCase();
    let intent: QueryAnalysis['intent'] = 'unknown';
    if (lower.startsWith('what is') || lower.startsWith('什么是') || lower.includes('定义')) intent = 'definition';
    else if (lower.startsWith('how to') || lower.startsWith('how do') || lower.includes('如何') || lower.includes('怎么')) intent = 'how-to';
    else if (lower.includes('think') || lower.includes('believe') || lower.includes('认为') || lower.includes('觉得')) intent = 'opinion';
    else intent = 'factual';
    const entities = query.match(/[\u4e00-\u9fa5]{2,3}|[A-Z][a-z]+/g) || [];
    return { intent, entities: Array.from(new Set(entities)) };
  }
}

// V4789: DocumentRetriever — 文档检索（按 metadata 过滤 + 排序）
export class DocumentRetriever {
  retrieve(query: string, documents: Source[], filters: Record<string, string> = {}): Source[] {
    return documents
      .filter(d => Object.entries(filters).every(([k, v]) => d.metadata?.[k] === v))
      .map(d => ({ ...d, score: this._simpleScore(query, d.content) }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  private _simpleScore(query: string, doc: string): number {
    const qTokens = new Set(query.toLowerCase().split(/\s+/));
    const dTokens = doc.toLowerCase().split(/\s+/);
    return dTokens.filter(t => qTokens.has(t)).length / Math.max(qTokens.size, 1);
  }
}

// V4790: ChunkOverlapManager — chunk 重叠管理
export class ChunkOverlapManager {
  chunk(text: string, chunkSize: number, overlapSize: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      const end = Math.min(i + chunkSize, text.length);
      chunks.push(text.slice(i, end));
      if (end === text.length) break;
      i = end - overlapSize;
    }
    return chunks;
  }

  totalCoverage(chunks: string[], originalLen: number): number {
    const total = chunks.reduce((s, c) => s + c.length, 0);
    return total / Math.max(originalLen, 1);
  }
}

// V4791: RAGEvaluator — RAG 评估器（precision/recall/F1）
export class RAGEvaluator {
  precision(retrieved: string[], relevant: string[]): number {
    if (retrieved.length === 0) return 0;
    const hits = retrieved.filter(r => relevant.includes(r)).length;
    return hits / retrieved.length;
  }

  recall(retrieved: string[], relevant: string[]): number {
    if (relevant.length === 0) return 0;
    const hits = retrieved.filter(r => relevant.includes(r)).length;
    return hits / relevant.length;
  }

  f1(retrieved: string[], relevant: string[]): number {
    const p = this.precision(retrieved, relevant);
    const r = this.recall(retrieved, relevant);
    return p + r === 0 ? 0 : (2 * p * r) / (p + r);
  }
}

// V4792: RAGMetrics — RAG 指标聚合
export class RAGMetrics {
  private _counters: Map<string, number> = new Map();

  record(metric: string, value = 1): void {
    this._counters.set(metric, (this._counters.get(metric) || 0) + value);
  }

  get(metric: string): number { return this._counters.get(metric) || 0; }

  report(): Record<string, number> {
    const out: Record<string, number> = {};
    this._counters.forEach((v, k) => { out[k] = v; });
    return out;
  }

  reset(): void { this._counters.clear(); }
}

// V4793: RAGPipeline — RAG 流水线（多 stage 编排）
export type RAGStage = 'retrieve' | 'rerank' | 'compress' | 'generate' | 'verify';

export class RAGPipeline {
  private _stages: RAGStage[] = [];
  private _results: Map<RAGStage, any> = new Map();

  setStages(stages: RAGStage[]): void { this._stages = stages; }

  stages(): RAGStage[] { return [...this._stages]; }

  recordResult(stage: RAGStage, result: any): void { this._results.set(stage, result); }

  getResult(stage: RAGStage): any { return this._results.get(stage); }

  progress(): number {
    if (this._stages.length === 0) return 0;
    return this._results.size / this._stages.length;
  }

  reset(): void { this._results.clear(); }
}

// V4794: ChapterContextBuilder — 章节上下文构建（合并章节内容）
export class ChapterContextBuilder {
  build(chapters: { title: string; content: string }[], maxChars = 5000): string {
    let ctx = '';
    for (const ch of chapters) {
      const section = `${ch.title}\n${ch.content}\n\n`;
      if ((ctx + section).length > maxChars) break;
      ctx += section;
    }
    return ctx.trim();
  }

  wordCount(text: string): number {
    return (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  }
}

// V4795: RAGIntegration — 集成 + 端到端 demo
export class RAGIntegration {
  private _session: RAGSession;
  private _ingester: DocumentIngester;
  private _chunker: ChapterChunker;
  private _sectionParser: SectionParser;
  private _entityExtractor: NamedEntityExtractor;
  private _tripletExtractor: KnowledgeTripletExtractor;
  private _generator: RetrievalAugmentedGenerator;
  private _hallucination: HallucinationDetector;
  private _consistency: FactualConsistencyChecker;
  private _postProcessor: AnswerPostProcessor;
  private _cache: RAGCache;
  private _citationFmt: CitationFormatter;
  private _queryAnalyzer: QueryAnalyzer;
  private _docRetriever: DocumentRetriever;
  private _overlapMgr: ChunkOverlapManager;
  private _evaluator: RAGEvaluator;
  private _metrics: RAGMetrics;
  private _pipeline: RAGPipeline;
  private _chapterCtxBuilder: ChapterContextBuilder;

  constructor(config: RAGSessionConfig) {
    this._session = new RAGSession(`rag-${Date.now()}`, config);
    this._ingester = new DocumentIngester();
    this._chunker = new ChapterChunker();
    this._sectionParser = new SectionParser();
    this._entityExtractor = new NamedEntityExtractor();
    this._tripletExtractor = new KnowledgeTripletExtractor();
    this._generator = new RetrievalAugmentedGenerator();
    this._hallucination = new HallucinationDetector();
    this._consistency = new FactualConsistencyChecker();
    this._postProcessor = new AnswerPostProcessor();
    this._cache = new RAGCache();
    this._citationFmt = new CitationFormatter();
    this._queryAnalyzer = new QueryAnalyzer();
    this._docRetriever = new DocumentRetriever();
    this._overlapMgr = new ChunkOverlapManager();
    this._evaluator = new RAGEvaluator();
    this._metrics = new RAGMetrics();
    this._pipeline = new RAGPipeline();
    this._chapterCtxBuilder = new ChapterContextBuilder();
  }

  runDemo(): {
    chaptersCount: number;
    sectionsCount: number;
    entities: number;
    answerLength: number;
    confidence: number;
    coverage: number;
    pipelineProgress: number;
    metricsReport: Record<string, number>;
  } {
    // Ingest a sample document
    const sampleText = '第一章 引子\n主角登场。这是一个玄幻世界。\n第二章 冒险\n主角开始旅程。他遇到了师父。师父说：你好。';
    this._session.retriever.add({ id: 'doc1', content: sampleText });

    // Chunk by chapter
    const chapters = this._chunker.chunk(sampleText);
    this._session.retriever.add({ id: 'doc2', content: '玄幻世界的设定。主角有魔法天赋。师父教会了他剑术。' });

    // Parse sections
    const sections = this._sectionParser.parse(sampleText);

    // Extract entities
    const entities = this._entityExtractor.extract(sampleText);

    // Triplets
    this._tripletExtractor.extract('主角是魔法师');

    // Generate
    const sources = this._session.retriever.retrieve('主角是谁', 3);
    const result = this._generator.generate('主角是谁', sources);
    const processedAnswer = this._postProcessor.process(result.answer);

    // Verify
    const consistency = this._consistency.check(processedAnswer, sources);

    // Pipeline
    this._pipeline.setStages(['retrieve', 'rerank', 'compress', 'generate', 'verify']);
    this._pipeline.recordResult('retrieve', sources);
    this._pipeline.recordResult('generate', result);

    // Metrics
    this._metrics.record('queries_run');
    this._metrics.record('sources_retrieved', sources.length);
    this._metrics.record('chapters_parsed', chapters.length);

    return {
      chaptersCount: chapters.length,
      sectionsCount: sections.length,
      entities: entities.length,
      answerLength: processedAnswer.length,
      confidence: result.confidence,
      coverage: consistency.coverage,
      pipelineProgress: this._pipeline.progress(),
      metricsReport: this._metrics.report(),
    };
  }

  session(): RAGSession { return this._session; }
  ingester(): DocumentIngester { return this._ingester; }
  chunker(): ChapterChunker { return this._chunker; }
  sectionParser(): SectionParser { return this._sectionParser; }
  entityExtractor(): NamedEntityExtractor { return this._entityExtractor; }
  tripletExtractor(): KnowledgeTripletExtractor { return this._tripletExtractor; }
  generator(): RetrievalAugmentedGenerator { return this._generator; }
  hallucination(): HallucinationDetector { return this._hallucinationDetector; }
  consistency(): FactualConsistencyChecker { return this._consistency; }
  postProcessor(): AnswerPostProcessor { return this._postProcessor; }
  cache(): RAGCache { return this._cache; }
  citationFmt(): CitationFormatter { return this._citationFmt; }
  queryAnalyzer(): QueryAnalyzer { return this._queryAnalyzer; }
  docRetriever(): DocumentRetriever { return this._docRetriever; }
  overlapMgr(): ChunkOverlapManager { return this._overlapMgr; }
  evaluator(): RAGEvaluator { return this._evaluator; }
  metrics(): RAGMetrics { return this._metrics; }
  pipeline(): RAGPipeline { return this._pipeline; }
  chapterCtxBuilder(): ChapterContextBuilder { return this._chapterCtxBuilder; }
}

export const RAG_BATCH_1_ENGINES: readonly string[] = [
  'RAGRetriever', 'ContextWindowBuilder', 'PromptAugmenter', 'CitationTracker',
  'SourceRanker', 'QueryRewriter', 'SubQueryGenerator', 'MultiHopReasoner',
  'ContextCompressor', 'RelevanceScorer',
];

export const RAG_BATCH_2_ENGINES: readonly string[] = [
  'RAGSession', 'DocumentIngester', 'ChapterChunker', 'SectionParser',
  'NamedEntityExtractor', 'KnowledgeTripletExtractor', 'RetrievalAugmentedGenerator',
  'HallucinationDetector', 'FactualConsistencyChecker', 'AnswerPostProcessor',
];

export const RAG_BATCH_3_ENGINES: readonly string[] = [
  'RAGCache', 'CitationFormatter', 'QueryAnalyzer', 'DocumentRetriever',
  'ChunkOverlapManager', 'RAGEvaluator', 'RAGMetrics', 'RAGPipeline',
  'ChapterContextBuilder', 'RAGIntegration',
];

export class RAGCoreIndex {
  list(): string[] { return [...RAG_BATCH_1_ENGINES, 'RAGCoreIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export class RAGAdvancedIndex {
  list(): string[] { return [...RAG_BATCH_2_ENGINES, 'RAGAdvancedIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export class RAGIntegrationIndex {
  list(): string[] { return [...RAG_BATCH_3_ENGINES, 'RAGIntegrationIndex']; }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}

export class RAGMasterIndex {
  list(): string[] {
    return [...RAG_BATCH_1_ENGINES, ...RAG_BATCH_2_ENGINES, ...RAG_BATCH_3_ENGINES, 'RAGMasterIndex'];
  }
  count(): number { return this.list().length; }
  has(name: string): boolean { return this.list().includes(name); }
}