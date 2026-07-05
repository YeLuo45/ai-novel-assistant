// Round 8 Direction CB — AI Co-Author 2.0 Batch 1/3 test
// V4616-V4625: 10 engines, ~30 assertions

import { describe, it, expect } from 'vitest';
import {
  MultiAgentOrchestrator, ContextWindowManager, TokenBudgetAllocator,
  PromptChainBuilder, ChapterPlanRefiner, SceneBeatsGenerator,
  PlotThreadIntegrator, CharacterVoiceConsistency, FactChecker, VersionedDocument,
  CoAuthor2CoreIndex, COAUTHOR2_BATCH_1_ENGINES,
} from './CoAuthor2Core';

describe('V4616 MultiAgentOrchestrator', () => {
  it('register handler and submit task', () => {
    const o = new MultiAgentOrchestrator();
    o.registerHandler('planner', async (input) => ({
      taskId: 't1', role: 'planner', output: input.toUpperCase(), tokensUsed: 10, durationMs: 5, status: 'success',
    }));
    o.submit({ id: 't1', role: 'planner', input: 'plan', priority: 1, dependsOn: [] });
    expect(o.count()).toBe(1);
    expect(o.pending().length).toBe(1);
  });

  it('runOnce executes ready tasks', async () => {
    const o = new MultiAgentOrchestrator();
    o.registerHandler('writer', async (input) => ({
      taskId: 't1', role: 'writer', output: 'wrote: ' + input, tokensUsed: 5, durationMs: 3, status: 'success',
    }));
    o.submit({ id: 't1', role: 'writer', input: 'hello', priority: 1, dependsOn: [] });
    const results = await o.runOnce();
    expect(results.length).toBe(1);
    expect(results[0].output).toContain('hello');
  });

  it('dependency ordering via dependsOn', async () => {
    const o = new MultiAgentOrchestrator();
    o.registerHandler('planner', async (i) => ({ taskId: 'p', role: 'planner', output: 'plan:' + i, tokensUsed: 1, durationMs: 1, status: 'success' }));
    o.registerHandler('writer', async (i) => ({ taskId: 'w', role: 'writer', output: 'write:' + i, tokensUsed: 1, durationMs: 1, status: 'success' }));
    o.submit({ id: 'p', role: 'planner', input: 'a', priority: 1, dependsOn: [] });
    o.submit({ id: 'w', role: 'writer', input: 'b', priority: 2, dependsOn: ['p'] });
    await o.runAll();
    expect(o.completed().length).toBe(2);
  });

  it('runAll handles dependencies and max iterations', async () => {
    const o = new MultiAgentOrchestrator();
    o.registerHandler('editor', async (i) => ({ taskId: 'e', role: 'editor', output: 'edit:' + i, tokensUsed: 1, durationMs: 1, status: 'success' }));
    o.submit({ id: 'e', role: 'editor', input: 'a', priority: 1, dependsOn: [] });
    const results = await o.runAll(5);
    expect(results.length).toBe(1);
  });
});

describe('V4617 ContextWindowManager', () => {
  it('add chunks and compute totalTokens', () => {
    const w = new ContextWindowManager(100);
    w.add({ id: 'a', text: 'aa', tokens: 30, priority: 1 });
    w.add({ id: 'b', text: 'bb', tokens: 40, priority: 2 });
    expect(w.totalTokens()).toBe(70);
    expect(w.size()).toBe(2);
  });

  it('pinned chunks stay first', () => {
    const w = new ContextWindowManager(200);
    w.add({ id: 'a', text: 'first', tokens: 10, priority: 1 });
    w.add({ id: 'b', text: 'pinned', tokens: 20, priority: 1, pinned: true });
    expect(w.renderText().startsWith('pinned')).toBe(true);
  });

  it('enforces max tokens by priority', () => {
    const w = new ContextWindowManager(50);
    w.add({ id: 'a', text: 'aa', tokens: 30, priority: 1 });
    w.add({ id: 'b', text: 'bb', tokens: 30, priority: 2 });
    expect(w.totalTokens()).toBe(30); // higher priority kept
  });

  it('remove and pin toggling', () => {
    const w = new ContextWindowManager(100);
    w.add({ id: 'a', text: 'x', tokens: 10, priority: 1 });
    w.remove('a');
    expect(w.size()).toBe(0);
    w.add({ id: 'b', text: 'y', tokens: 10, priority: 1 });
    w.pin('b');
    w.pin('b', false);
    expect(w.size()).toBe(1);
  });

  it('remaining returns capacity', () => {
    const w = new ContextWindowManager(100);
    w.add({ id: 'a', text: 'x', tokens: 40, priority: 1 });
    expect(w.remaining()).toBe(60);
  });
});

describe('V4618 TokenBudgetAllocator', () => {
  it('set and consume within limit', () => {
    const b = new TokenBudgetAllocator();
    b.set('planner', 100);
    expect(b.consume('planner', 30)).toBe(true);
    expect(b.remaining('planner')).toBe(70);
  });

  it('reject over-limit', () => {
    const b = new TokenBudgetAllocator();
    b.set('writer', 50);
    expect(b.consume('writer', 30)).toBe(true);
    expect(b.consume('writer', 25)).toBe(false);
    expect(b.remaining('writer')).toBe(20);
  });

  it('reset specific role', () => {
    const b = new TokenBudgetAllocator();
    b.set('editor', 50);
    b.consume('editor', 40);
    b.reset('editor');
    expect(b.remaining('editor')).toBe(50);
  });

  it('totalLimit and totalUsed aggregation', () => {
    const b = new TokenBudgetAllocator();
    b.set('planner', 100);
    b.set('writer', 200);
    b.consume('planner', 50);
    b.consume('writer', 100);
    expect(b.totalLimit()).toBe(300);
    expect(b.totalUsed()).toBe(150);
  });
});

describe('V4619 PromptChainBuilder', () => {
  it('build with single template', () => {
    const p = new PromptChainBuilder();
    p.addTemplate({ id: 't1', template: 'Hello {name}!', variables: ['name'] });
    expect(p.build('t1', { name: 'World' })).toBe('Hello World!');
  });

  it('chain multiple templates', () => {
    const p = new PromptChainBuilder();
    p.addTemplate({ id: 'a', template: 'A:{x}', variables: ['x'] });
    p.addTemplate({ id: 'b', template: 'B:{y}', variables: ['y'] });
    const result = p.chain(['a', 'b'], { x: '1', y: '2' });
    expect(result).toContain('A:1');
    expect(result).toContain('B:2');
  });

  it('extractVariables parses template', () => {
    const p = new PromptChainBuilder();
    const vars = p.extractVariables('Hi {name}, age {age}, role {name}');
    expect(vars).toEqual(['name', 'age']);
  });

  it('missing template throws', () => {
    const p = new PromptChainBuilder();
    expect(() => p.build('missing', {})).toThrow();
  });
});

describe('V4620 ChapterPlanRefiner', () => {
  it('refine appends feedback', () => {
    const r = new ChapterPlanRefiner();
    const plan = { id: 'c1', title: 'Chapter 1', summary: 'init', beats: ['setup'], targetWords: 3000 };
    const refined = r.refine(plan, 'add conflict');
    expect(refined.summary).toContain('refined');
    expect(refined.beats.length).toBe(2);
  });

  it('history tracks all versions', () => {
    const r = new ChapterPlanRefiner();
    const plan = { id: 'c1', title: 'X', summary: 's', beats: [], targetWords: 1000 };
    r.refine(plan, 'a');
    r.refine(r.refine(plan, 'a'), 'b');
    expect(r.history('c1').length).toBe(3);
  });

  it('bestVersion returns latest', () => {
    const r = new ChapterPlanRefiner();
    const plan = { id: 'c1', title: 'X', summary: 's', beats: [], targetWords: 1000 };
    r.refine(plan, 'first');
    r.refine(r.refine(plan, 'first'), 'second');
    expect(r.bestVersion('c1')?.summary).toContain('second');
  });

  it('iterationCount reflects history', () => {
    const r = new ChapterPlanRefiner();
    expect(r.iterationCount('c1')).toBe(0);
    r.refine({ id: 'c1', title: 'x', summary: '', beats: [], targetWords: 1 }, 'a');
    expect(r.iterationCount('c1')).toBe(1);
  });
});

describe('V4621 SceneBeatsGenerator', () => {
  it('generate action beats', () => {
    const g = new SceneBeatsGenerator();
    const beats = g.generate('action', 5);
    expect(beats.length).toBe(5);
    expect(beats[0].type).toBe('setup');
    expect(beats[3].type).toBe('climax');
  });

  it('totalDuration sums durations', () => {
    const g = new SceneBeatsGenerator();
    const beats = g.generate('romance', 3);
    const total = g.totalDuration(beats);
    expect(total).toBeGreaterThan(0);
  });

  it('validate catches missing climax', () => {
    const g = new SceneBeatsGenerator();
    const issues = g.validate([{ id: 'x', type: 'setup', description: 'a', duration: 10 }]);
    expect(issues.some(i => i.includes('climax'))).toBe(true);
  });

  it('validate catches too many beats', () => {
    const g = new SceneBeatsGenerator();
    const many = Array.from({ length: 15 }, (_, i) => ({ id: 'b' + i, type: 'setup' as const, description: 'x', duration: 1 }));
    expect(g.validate(many).some(i => i.includes('too many'))).toBe(true);
  });
});

describe('V4622 PlotThreadIntegrator', () => {
  it('threadsAtChapter finds overlapping', () => {
    const p = new PlotThreadIntegrator();
    p.add({ id: 't1', name: 'main', chapterStarts: [1, 5, 10], weight: 0.6 });
    p.add({ id: 't2', name: 'sub', chapterStarts: [3, 7], weight: 0.4 });
    // chapter 5: t1 has [5] within ±1 (|5-5|=0) → match; t2 has [3,7] both |2| > 1 → no
    expect(p.threadsAtChapter(5).length).toBe(1);
    // chapter 8: t1 [10] |2| no; t2 [7] |1| yes
    expect(p.threadsAtChapter(8).length).toBe(1);
  });

  it('dominantThread by weight', () => {
    const p = new PlotThreadIntegrator();
    p.add({ id: 'a', name: 'A', chapterStarts: [1], weight: 0.3 });
    p.add({ id: 'b', name: 'B', chapterStarts: [1], weight: 0.7 });
    expect(p.dominantThread()?.id).toBe('b');
  });

  it('coverage = avg weight', () => {
    const p = new PlotThreadIntegrator();
    p.add({ id: 'a', name: 'A', chapterStarts: [1], weight: 0.5 });
    p.add({ id: 'b', name: 'B', chapterStarts: [2], weight: 0.5 });
    expect(p.coverage()).toBeCloseTo(0.5);
  });
});

describe('V4623 CharacterVoiceConsistency', () => {
  it('fingerprint computes avg sentence length', () => {
    const c = new CharacterVoiceConsistency();
    const fp = c.fingerprint('你好。世界！', 'char1');
    expect(fp.avgSentenceLen).toBeGreaterThan(0);
  });

  it('consistency is high for similar style', () => {
    const c = new CharacterVoiceConsistency();
    c.fingerprint('你好世界。我是他。', 'char1');
    const score = c.consistency('char1', '你好世界。他是我。');
    expect(score).toBeGreaterThan(0.5);
  });

  it('consistency 0 for unknown character', () => {
    const c = new CharacterVoiceConsistency();
    expect(c.consistency('unknown', 'something')).toBe(0);
  });

  it('profile returns stored fingerprint', () => {
    const c = new CharacterVoiceConsistency();
    c.setProfile({ characterId: 'x', avgSentenceLen: 10, vocabulary: ['a'], catchphrases: ['a'], formality: 0.5 });
    expect(c.profile('x')?.avgSentenceLen).toBe(10);
  });
});

describe('V4624 FactChecker', () => {
  it('add and verify', () => {
    const f = new FactChecker();
    f.add({ id: '1', claim: '天是蓝的', context: 'nature', verified: false });
    f.verify('1', true, 'observation');
    expect(f.verified().length).toBe(1);
  });

  it('check returns matches and contradictions', () => {
    const f = new FactChecker();
    f.add({ id: '1', claim: '太阳从东方升起', context: 'astronomy', verified: true });
    const result = f.check('太阳从东方升起', 'astronomy');
    expect(result.matches.length).toBe(1);
  });

  it('ratio = verified / total', () => {
    const f = new FactChecker();
    f.add({ id: '1', claim: 'x', context: 'c', verified: true });
    f.add({ id: '2', claim: 'y', context: 'c', verified: false });
    expect(f.ratio()).toBeCloseTo(0.5);
  });

  it('unverified returns unverified facts', () => {
    const f = new FactChecker();
    f.add({ id: '1', claim: 'x', context: 'c', verified: false });
    expect(f.unverified().length).toBe(1);
  });
});

describe('V4625 VersionedDocument', () => {
  it('initial version on construct', () => {
    const d = new VersionedDocument('d1', 'hello', 'alice');
    expect(d.versionCount()).toBe(1);
    expect(d.current().content).toBe('hello');
  });

  it('commit appends new version', () => {
    const d = new VersionedDocument('d1', 'a', 'alice');
    d.commit('b', 'bob', 'updated');
    expect(d.versionCount()).toBe(2);
  });

  it('diff shows line changes', () => {
    const d = new VersionedDocument('d1', 'line1\nline2', 'a');
    d.commit('line1\nline3', 'a', 'edit');
    const diff = d.diff(1, 2);
    expect(diff).toContain('- line2');
    expect(diff).toContain('+ line3');
  });

  it('history returns all versions', () => {
    const d = new VersionedDocument('d1', 'x', 'a');
    d.commit('y', 'b', 'msg');
    expect(d.history().length).toBe(2);
  });
});

describe('CoAuthor2CoreIndex', () => {
  it('list includes all 11 entries (P-83/P-110)', () => {
    const idx = new CoAuthor2CoreIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new CoAuthor2CoreIndex();
    expect(idx.has('MultiAgentOrchestrator')).toBe(true);
    expect(idx.has('CoAuthor2CoreIndex')).toBe(true);
    expect(idx.has('NonExistent')).toBe(false);
  });

  it('COAUTHOR2_BATCH_1_ENGINES has 10 entries', () => {
    expect(COAUTHOR2_BATCH_1_ENGINES.length).toBe(10);
  });
});