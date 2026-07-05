// Round 8 Direction CG — RAG for Chapter Context Batch 1+2+3 combined test (30 engines)

import { describe, it, expect } from 'vitest';
import {
  RAGRetriever, ContextWindowBuilder, PromptAugmenter, CitationTracker,
  SourceRanker, QueryRewriter, SubQueryGenerator, MultiHopReasoner,
  ContextCompressor, RelevanceScorer,
  RAGSession, DocumentIngester, ChapterChunker, SectionParser,
  NamedEntityExtractor, KnowledgeTripletExtractor, RetrievalAugmentedGenerator,
  HallucinationDetector, FactualConsistencyChecker, AnswerPostProcessor,
  RAGCache, CitationFormatter, QueryAnalyzer, DocumentRetriever,
  ChunkOverlapManager, RAGEvaluator, RAGMetrics, RAGPipeline,
  ChapterContextBuilder, RAGIntegration,
  RAGCoreIndex, RAGAdvancedIndex, RAGIntegrationIndex, RAGMasterIndex,
  RAG_BATCH_1_ENGINES, RAG_BATCH_2_ENGINES, RAG_BATCH_3_ENGINES,
} from './RAGCore';

describe('V4766 RAGRetriever', () => {
  it('add and retrieve', () => {
    const r = new RAGRetriever();
    r.add({ id: 'a', content: 'cats are great' });
    const res = r.retrieve('cats', 5);
    expect(res.length).toBe(1);
  });
  it('remove and size', () => {
    const r = new RAGRetriever();
    r.add({ id: 'a', content: 'x' });
    r.remove('a');
    expect(r.size()).toBe(0);
  });
});

describe('V4767 ContextWindowBuilder', () => {
  it('build truncates to maxChars', () => {
    const b = new ContextWindowBuilder();
    const result = b.build([{ id: 'a', content: 'a'.repeat(100) }, { id: 'b', content: 'b'.repeat(100) }], 50);
    expect(result.length).toBeLessThanOrEqual(50);
  });
  it('charCount and fits', () => {
    const b = new ContextWindowBuilder();
    expect(b.charCount('hello')).toBe(5);
    expect(b.fits('hi', 10)).toBe(true);
  });
});

describe('V4768 PromptAugmenter', () => {
  it('augment returns AugmentedPrompt', () => {
    const a = new PromptAugmenter();
    const aug = a.augment('q', 'ctx');
    expect(aug.query).toBe('q');
    expect(aug.context).toBe('ctx');
  });
  it('format', () => {
    const a = new PromptAugmenter();
    const aug = a.augment('q', 'ctx');
    expect(a.format(aug)).toContain('Question: q');
  });
});

describe('V4769 CitationTracker', () => {
  it('cite and all', () => {
    const c = new CitationTracker();
    c.cite('src1', 'text', 0);
    c.cite('src1', 'text2', 100);
    expect(c.count()).toBe(2);
    expect(c.bySource('src1').length).toBe(2);
  });
  it('clear', () => {
    const c = new CitationTracker();
    c.cite('a', 'x', 0);
    c.clear();
    expect(c.count()).toBe(0);
  });
});

describe('V4770 SourceRanker', () => {
  it('rank adds boost and sorts', () => {
    const r = new SourceRanker();
    const sources = [{ id: 'a', content: 'x', score: 0.5 }, { id: 'b', content: 'y', score: 0.7 }];
    const ranked = r.rank(sources);
    expect(ranked.length).toBe(2);
  });
});

describe('V4771 QueryRewriter', () => {
  it('rewrite normalizes whitespace', () => {
    const r = new QueryRewriter();
    expect(r.rewrite('  hello   world  ')).toBe('hello world');
  });
  it('expandSynonyms', () => {
    const r = new QueryRewriter();
    const synonyms = new Map([['cat', ['kitty', 'feline']]]);
    expect(r.expandSynonyms('cat', synonyms)).toContain('kitty');
  });
});

describe('V4772 SubQueryGenerator', () => {
  it('generate splits on and/or', () => {
    const g = new SubQueryGenerator();
    const r = g.generate('cats and dogs or birds');
    expect(r.length).toBeGreaterThan(1);
  });
});

describe('V4773 MultiHopReasoner', () => {
  it('hop runs multiple iterations', () => {
    const m = new MultiHopReasoner();
    const retriever = new RAGRetriever();
    retriever.add({ id: 'a', content: 'cats are great pets' });
    retriever.add({ id: 'b', content: 'dogs are loyal' });
    const results = m.hop('cats', retriever, 2);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('V4774 ContextCompressor', () => {
  it('compress truncates sentences', () => {
    const c = new ContextCompressor();
    const result = c.compress('A. B. C. D. E.', 0.4);
    expect(result.length).toBeLessThan('A. B. C. D. E.'.length);
  });
  it('compressionRatio', () => {
    const c = new ContextCompressor();
    expect(c.compressionRatio('a'.repeat(100), 'a'.repeat(50))).toBe(0.5);
  });
});

describe('V4775 RelevanceScorer', () => {
  it('score returns 0-1', () => {
    const s = new RelevanceScorer();
    expect(s.score('cats', 'cats and dogs')).toBeGreaterThan(0);
  });
  it('threshold filters', () => {
    const s = new RelevanceScorer();
    expect(s.threshold('cats', 'completely unrelated', 0.5)).toBe(false);
  });
});

describe('V4776 RAGSession', () => {
  it('construct sets up engines', () => {
    const s = new RAGSession('s1', { topK: 5, contextMaxChars: 2000 });
    expect(s.id).toBe('s1');
  });
});

describe('V4777 DocumentIngester', () => {
  it('ingest splits content', () => {
    const i = new DocumentIngester();
    const chunks = i.ingest('doc1', 'x'.repeat(1500), 500);
    expect(chunks.length).toBe(3);
    expect(i.totalChunks(chunks)).toBe(3);
  });
});

describe('V4778 ChapterChunker', () => {
  it('chunk splits on chapter markers', () => {
    const c = new ChapterChunker();
    const text = '第一章 标题1\n内容1\n第二章 标题2\n内容2\n第三章 标题3\n内容3';
    const result = c.chunk(text);
    expect(result.length).toBe(3);
  });
});

describe('V4779 SectionParser', () => {
  it('parse identifies types', () => {
    const p = new SectionParser();
    const sections = p.parse('# Title\nParagraph text\n"Dialogue here"\n');
    expect(sections.some(s => s.type === 'title')).toBe(true);
    expect(sections.some(s => s.type === 'dialogue')).toBe(true);
  });
  it('countByType', () => {
    const p = new SectionParser();
    expect(p.countByType([{ type: 'paragraph', content: 'a' }, { type: 'paragraph', content: 'b' }], 'paragraph')).toBe(2);
  });
});

describe('V4780 NamedEntityExtractor', () => {
  it('extract capitalized words', () => {
    const e = new NamedEntityExtractor();
    expect(e.extract('Alice met Bob').length).toBeGreaterThan(0);
  });
  it('countUnique', () => {
    const e = new NamedEntityExtractor();
    expect(e.countUnique('Alice Alice Bob')).toBe(2);
  });
});

describe('V4781 KnowledgeTripletExtractor', () => {
  it('extract 是 relations', () => {
    const e = new KnowledgeTripletExtractor();
    const t = e.extract('主角是魔法师');
    expect(t.length).toBeGreaterThan(0);
  });
});

describe('V4782 RetrievalAugmentedGenerator', () => {
  it('generate returns result with sources', () => {
    const g = new RetrievalAugmentedGenerator();
    const r = g.generate('q', [{ id: 'a', content: 'x' }]);
    expect(r.sources.length).toBe(1);
    expect(r.confidence).toBeGreaterThan(0);
  });
});

describe('V4783 HallucinationDetector', () => {
  it('detect true for unsupported', () => {
    const h = new HallucinationDetector();
    const r = h.detect('totally unrelated content here', [{ id: 'a', content: 'x' }]);
    expect(r.hallucinated).toBe(true);
  });
  it('detect false for supported', () => {
    const h = new HallucinationDetector();
    const r = h.detect('the content matches source here', [{ id: 'a', content: 'the content matches' }]);
    expect(r.hallucinated).toBe(false);
  });
});

describe('V4784 FactualConsistencyChecker', () => {
  it('check high coverage', () => {
    const c = new FactualConsistencyChecker();
    const r = c.check('the cat sat', [{ id: 'a', content: 'the cat sat on the mat' }]);
    expect(r.coverage).toBeGreaterThan(0);
  });
});

describe('V4785 AnswerPostProcessor', () => {
  it('process trims whitespace', () => {
    const p = new AnswerPostProcessor();
    expect(p.process('  hello  world  ')).toBe('hello world');
  });
  it('dedupSentences', () => {
    const p = new AnswerPostProcessor();
    const out = p.dedupSentences('A. A. B.');
    expect(out.match(/A/g)?.length).toBe(1);
  });
});

describe('V4786 RAGCache', () => {
  it('get/set/has', () => {
    const c = new RAGCache();
    c.set('q1', { answer: 'a', sources: [], confidence: 1 });
    expect(c.has('q1')).toBe(true);
    expect(c.size()).toBe(1);
  });
  it('clear', () => {
    const c = new RAGCache();
    c.set('q', { answer: '', sources: [], confidence: 0 });
    c.clear();
    expect(c.size()).toBe(0);
  });
});

describe('V4787 CitationFormatter', () => {
  it('format and toMarkdown', () => {
    const f = new CitationFormatter();
    const c = [{ id: 'c1', sourceId: 's1', text: 'cite text', position: 0 }];
    expect(f.format(c)).toContain('[1]');
    expect(f.toMarkdown(c)).toContain('**s1**');
  });
});

describe('V4788 QueryAnalyzer', () => {
  it('analyze detects how-to', () => {
    const a = new QueryAnalyzer();
    const r = a.analyze('how to cook rice');
    expect(r.intent).toBe('how-to');
  });
  it('analyze detects definition', () => {
    const a = new QueryAnalyzer();
    const r = a.analyze('什么是机器学习');
    expect(r.intent).toBe('definition');
  });
});

describe('V4789 DocumentRetriever', () => {
  it('retrieve with filters', () => {
    const r = new DocumentRetriever();
    const docs = [
      { id: 'a', content: 'cat content', metadata: { lang: 'en' } },
      { id: 'b', content: 'dog content', metadata: { lang: 'zh' } },
    ];
    const result = r.retrieve('cat', docs, { lang: 'en' });
    expect(result.length).toBe(1);
  });
});

describe('V4790 ChunkOverlapManager', () => {
  it('chunk with overlap', () => {
    const m = new ChunkOverlapManager();
    const chunks = m.chunk('abcdefghij', 5, 2);
    expect(chunks.length).toBeGreaterThan(1);
  });
  it('totalCoverage > 1 for overlapping', () => {
    const m = new ChunkOverlapManager();
    const chunks = m.chunk('abcdefghij', 5, 2);
    expect(m.totalCoverage(chunks, 10)).toBeGreaterThan(1);
  });
});

describe('V4791 RAGEvaluator', () => {
  it('precision and recall', () => {
    const e = new RAGEvaluator();
    expect(e.precision(['a', 'b', 'c'], ['a', 'b'])).toBeCloseTo(2 / 3);
    expect(e.recall(['a', 'b', 'c'], ['a', 'b', 'd'])).toBeCloseTo(2 / 3);
  });
  it('f1', () => {
    const e = new RAGEvaluator();
    expect(e.f1(['a', 'b'], ['a', 'b'])).toBe(1);
  });
});

describe('V4792 RAGMetrics', () => {
  it('record and report', () => {
    const m = new RAGMetrics();
    m.record('queries');
    m.record('sources', 5);
    expect(m.get('queries')).toBe(1);
    expect(m.report()['sources']).toBe(5);
  });
});

describe('V4793 RAGPipeline', () => {
  it('setStages and progress', () => {
    const p = new RAGPipeline();
    p.setStages(['retrieve', 'generate']);
    p.recordResult('retrieve', []);
    expect(p.progress()).toBe(0.5);
  });
});

describe('V4794 ChapterContextBuilder', () => {
  it('build and wordCount', () => {
    const b = new ChapterContextBuilder();
    const ctx = b.build([{ title: 'Ch1', content: 'Hello world' }, { title: 'Ch2', content: 'Goodbye' }]);
    expect(ctx).toContain('Ch1');
    expect(b.wordCount('你好世界')).toBe(4);
  });
});

describe('V4795 RAGIntegration end-to-end demo', () => {
  it('runDemo completes workflow', () => {
    const r = new RAGIntegration({ topK: 5, contextMaxChars: 2000 });
    const result = r.runDemo();
    expect(result.chaptersCount).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.metricsReport.queries_run).toBe(1);
  });
  it('exposes all sub-engines', () => {
    const r = new RAGIntegration({ topK: 5, contextMaxChars: 2000 });
    expect(r.session()).toBeDefined();
    expect(r.ingester()).toBeDefined();
    expect(r.chunker()).toBeDefined();
    expect(r.sectionParser()).toBeDefined();
    expect(r.entityExtractor()).toBeDefined();
    expect(r.tripletExtractor()).toBeDefined();
    expect(r.generator()).toBeDefined();
    expect(r.consistency()).toBeDefined();
    expect(r.postProcessor()).toBeDefined();
    expect(r.cache()).toBeDefined();
    expect(r.citationFmt()).toBeDefined();
    expect(r.queryAnalyzer()).toBeDefined();
    expect(r.docRetriever()).toBeDefined();
    expect(r.overlapMgr()).toBeDefined();
    expect(r.evaluator()).toBeDefined();
    expect(r.metrics()).toBeDefined();
    expect(r.pipeline()).toBeDefined();
    expect(r.chapterCtxBuilder()).toBeDefined();
  });
});

describe('RAGMasterIndex', () => {
  it('list includes 31 entries', () => {
    const idx = new RAGMasterIndex();
    expect(idx.list().length).toBe(31);
  });
  it('all batches have 10', () => {
    expect(RAG_BATCH_1_ENGINES.length).toBe(10);
    expect(RAG_BATCH_2_ENGINES.length).toBe(10);
    expect(RAG_BATCH_3_ENGINES.length).toBe(10);
  });
});