// Round 8 Direction CB — AI Co-Author 2.0 Batch 2/3 test
// V4626-V4635: 10 engines

import { describe, it, expect } from 'vitest';
import {
  StreamingWriter, AsyncGeneratorPool, QualityGate, StyleTransferEngine,
  AutoSaveCheckpoint, BranchingNarrativeEngine, ReWriteSuggester,
  ConsistencyEnforcer, WordCountPredictor, ReadabilityAnalyzer,
  CoAuthor2AdvancedIndex, COAUTHOR2_BATCH_2_ENGINES,
} from './CoAuthor2Advanced';

describe('V4626 StreamingWriter', () => {
  it('append chunks sequentially', () => {
    const w = new StreamingWriter();
    w.append('Hello ');
    w.append('World');
    expect(w.fullText()).toBe('Hello World');
    expect(w.chunkCount()).toBe(2);
  });

  it('checkpoint and restore', () => {
    const w = new StreamingWriter();
    w.append('line1\n');
    w.append('line2\n');
    const cp = w.checkpoint();
    w.append('line3\n');
    w.restore(cp);
    // restored as single chunk (P-105 compact restore)
    expect(w.chunkCount()).toBe(1);
    expect(w.fullText()).toBe('line1\nline2\n');
  });

  it('getCheckpoint returns last', () => {
    const w = new StreamingWriter();
    expect(w.getCheckpoint()).toBeNull();
    w.append('a');
    w.checkpoint();
    expect(w.getCheckpoint()).not.toBeNull();
  });
});

describe('V4627 AsyncGeneratorPool', () => {
  it('register and run a generator', async () => {
    const pool = new AsyncGeneratorPool(2);
    pool.register('g1', async () => 'result1');
    const out = await pool.run('g1');
    expect(out).toBe('result1');
  });

  it('runAll returns map of results', async () => {
    const pool = new AsyncGeneratorPool(3);
    pool.register('a', async () => 'A');
    pool.register('b', async () => 'B');
    const out = await pool.runAll(['a', 'b']);
    expect(out['a']).toBe('A');
    expect(out['b']).toBe('B');
  });

  it('capacity and registered lists', () => {
    const pool = new AsyncGeneratorPool(5);
    pool.register('x', async () => '');
    pool.register('y', async () => '');
    expect(pool.capacity()).toBe(5);
    expect(pool.registered()).toEqual(['x', 'y']);
  });
});

describe('V4628 QualityGate', () => {
  it('evaluate all-pass', () => {
    const g = new QualityGate();
    g.addCheck('no-empty', () => []);
    g.addCheck('len', (t) => t.length < 5 ? ['too short'] : []);
    const report = g.evaluate('long enough text', 0.5);
    expect(report.passed).toBe(true);
  });

  it('evaluate with failures', () => {
    const g = new QualityGate();
    g.addCheck('check1', () => ['issue1']);
    g.addCheck('check2', () => []);
    const report = g.evaluate('any', 0.8);
    expect(report.issues.length).toBe(1);
    expect(report.passed).toBe(false);
  });
});

describe('V4629 StyleTransferEngine', () => {
  it('transfer applies keyword replacement and tone tag', () => {
    const e = new StyleTransferEngine();
    // casual substitutes 嗨 for 你好; formal substitutes 您好 for 嗨
    e.register({ name: 'casual', keywords: new Map([['你好', '嗨']]), tone: 'casual', sentenceAvgLen: 10 });
    e.register({ name: 'formal', keywords: new Map([['嗨', '您好']]), tone: 'formal', sentenceAvgLen: 25 });
    // input 嗨世界 → apply formal.keywords: 嗨 → 您好
    const out = e.transfer('嗨世界', 'casual', 'formal');
    expect(out).toContain('[formal]');
    expect(out).toContain('您好世界');
  });

  it('distance between same style is 0', () => {
    const e = new StyleTransferEngine();
    e.register({ name: 'a', keywords: new Map(), tone: 'formal', sentenceAvgLen: 10 });
    e.register({ name: 'b', keywords: new Map(), tone: 'formal', sentenceAvgLen: 10 });
    expect(e.distance('a', 'b')).toBe(0);
  });

  it('styles returns all profile names', () => {
    const e = new StyleTransferEngine();
    e.register({ name: 'p1', keywords: new Map(), tone: 'formal', sentenceAvgLen: 10 });
    e.register({ name: 'p2', keywords: new Map(), tone: 'casual', sentenceAvgLen: 10 });
    expect(e.styles().length).toBe(2);
  });
});

describe('V4630 AutoSaveCheckpoint', () => {
  it('shouldSave by interval', () => {
    const s = new AutoSaveCheckpoint(50, 1000);
    expect(s.shouldSave(10)).toBe(true);
  });

  it('shouldSave by char threshold', () => {
    const s = new AutoSaveCheckpoint(100000, 100);
    expect(s.shouldSave(150)).toBe(true);
  });

  it('save and retrieve latest', () => {
    const s = new AutoSaveCheckpoint();
    s.save('a', 'manual');
    s.save('b', 'timer');
    expect(s.latest()?.content).toBe('b');
    expect(s.records().length).toBe(2);
  });

  it('setInterval and setCharThreshold update', () => {
    const s = new AutoSaveCheckpoint();
    s.save('init', 'manual'); // sets _lastSave to now
    s.setInterval(5000);
    s.setCharThreshold(2000);
    expect(s.shouldSave(1500)).toBe(false);
  });
});

describe('V4631 BranchingNarrativeEngine', () => {
  it('addRoot creates root node', () => {
    const b = new BranchingNarrativeEngine();
    const root = b.addRoot('start');
    expect(root.parentId).toBeNull();
    expect(b.root()?.id).toBe(root.id);
  });

  it('branch creates child and counts', () => {
    const b = new BranchingNarrativeEngine();
    const root = b.addRoot('start');
    b.branch(root.id, 'pathA', ['continue', 'stop']);
    b.branch(root.id, 'pathB', ['continue', 'stop']);
    expect(b.totalBranches()).toBe(2);
  });

  it('children returns direct children', () => {
    const b = new BranchingNarrativeEngine();
    const root = b.addRoot('start');
    const c1 = b.branch(root.id, 'A', []);
    b.branch(c1.id, 'A1', []);
    expect(b.children(root.id).length).toBe(1);
    expect(b.children(c1.id).length).toBe(1);
  });

  it('path reconstructs from leaf to root', () => {
    const b = new BranchingNarrativeEngine();
    const root = b.addRoot('start');
    const c1 = b.branch(root.id, 'A', []);
    const leaf = b.branch(c1.id, 'A1', []);
    const path = b.path(leaf.id);
    expect(path.length).toBe(3);
    expect(path[0].id).toBe(root.id);
  });
});

describe('V4632 ReWriteSuggester', () => {
  it('suggest sorts by severity', () => {
    const s = new ReWriteSuggester();
    s.addRule('low', () => [{ original: 'a', suggestion: 'A', reason: 'caps', severity: 'low' }]);
    s.addRule('high', () => [{ original: 'b', suggestion: 'B', reason: 'clarity', severity: 'high' }]);
    const out = s.suggest('ab');
    expect(out[0].severity).toBe('high');
  });

  it('empty rules returns empty suggestions', () => {
    const s = new ReWriteSuggester();
    expect(s.suggest('text').length).toBe(0);
  });

  it('rules() returns rule names', () => {
    const s = new ReWriteSuggester();
    s.addRule('r1', () => []);
    s.addRule('r2', () => []);
    expect(s.rules().length).toBe(2);
  });
});

describe('V4633 ConsistencyEnforcer', () => {
  it('enforce applies required fixes', () => {
    const e = new ConsistencyEnforcer();
    e.addRule({ id: 'r1', pattern: /foo/g, fix: 'bar', required: true });
    const out = e.enforce('foo and foo');
    expect(out.fixed).toBe('bar and bar');
    expect(out.violations).toBe(2);
  });

  it('non-required rules count but do not fix', () => {
    const e = new ConsistencyEnforcer();
    e.addRule({ id: 'r1', pattern: /x/g, fix: 'y', required: false });
    const out = e.enforce('xxx');
    expect(out.violations).toBe(3);
    expect(out.fixed).toBe('xxx');
  });

  it('violationCount tracks per rule', () => {
    const e = new ConsistencyEnforcer();
    e.addRule({ id: 'a', pattern: /z/g, fix: 'q', required: false });
    e.enforce('zzz');
    expect(e.violationCount('a')).toBe(3);
  });
});

describe('V4634 WordCountPredictor', () => {
  it('record and predictRemaining', () => {
    const p = new WordCountPredictor();
    p.record(5, 2500);
    expect(p.predictRemaining(5, 10, 5000)).toBe(2500);
  });

  it('averagePerChapter', () => {
    const p = new WordCountPredictor();
    p.record(1, 1000);
    p.record(2, 1500);
    expect(p.averagePerChapter()).toBeCloseTo(1250);
  });

  it('willMeetTarget checks 90% threshold', () => {
    const p = new WordCountPredictor();
    p.record(5, 3000);
    expect(p.willMeetTarget(5, 10, 5000)).toBe(true);
  });

  it('history returns records', () => {
    const p = new WordCountPredictor();
    p.record(1, 100);
    expect(p.history().length).toBe(1);
  });
});

describe('V4635 ReadabilityAnalyzer', () => {
  it('analyze computes metrics', () => {
    const a = new ReadabilityAnalyzer();
    const m = a.analyze('你好世界。今天天气真好。我们去公园吧。');
    expect(m.sentenceCount).toBe(3);
    expect(m.charCount).toBeGreaterThan(0);
    expect(m.score).toBeGreaterThanOrEqual(0);
  });

  it('long sentences lower score', () => {
    const a = new ReadabilityAnalyzer();
    const long = '一个'.repeat(50) + '。';
    const m = a.analyze(long);
    expect(m.score).toBeLessThan(0.8);
  });

  it('diverse vocabulary raises score', () => {
    const a = new ReadabilityAnalyzer();
    // Use Chinese text with some repeated chars; expect moderate-high diversity
    const text = '苹果香蕉橙子葡萄西瓜芒果菠萝草莓蓝莓樱桃桃子梨子柿子李子杏子。';
    const m = a.analyze(text);
    expect(m.lexicalDiversity).toBeGreaterThan(0.6);
  });
});

describe('CoAuthor2AdvancedIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new CoAuthor2AdvancedIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new CoAuthor2AdvancedIndex();
    expect(idx.has('StreamingWriter')).toBe(true);
    expect(idx.has('CoAuthor2AdvancedIndex')).toBe(true);
  });

  it('COAUTHOR2_BATCH_2_ENGINES has 10 entries', () => {
    expect(COAUTHOR2_BATCH_2_ENGINES.length).toBe(10);
  });
});