// Round 8 Direction CB — AI Co-Author 2.0 Batch 3/3 test
// V4636-V4645: 10 engines + integration demo

import { describe, it, expect } from 'vitest';
import { COAUTHOR2_BATCH_1_ENGINES } from './CoAuthor2Core';
import { COAUTHOR2_BATCH_2_ENGINES } from './CoAuthor2Advanced';
import {
  SessionOrchestrator, CoAuthorWorkflow, PromptTemplateRegistry,
  MemoryStore, OutlineBuilder, SceneContinuationEngine,
  StyleProfileEditor, CoAuthorStats, CollaborationAuditLog, CoAuthor2Integration,
  CoAuthor2IntegrationIndex, CoAuthor2MasterIndex, COAUTHOR2_BATCH_3_ENGINES,
} from './CoAuthor2Integration';

describe('V4636 SessionOrchestrator', () => {
  it('construct with config sets up all engines', () => {
    const s = new SessionOrchestrator('s1', { maxTokens: 4000, budgetPerRole: { planner: 1000 }, autoSaveIntervalMs: 5000 });
    expect(s.id).toBe('s1');
    expect(s.budget.remaining('planner')).toBe(1000);
    expect(s.context).toBeDefined();
  });

  it('newDocument and getDocument', () => {
    const s = new SessionOrchestrator('s1', { maxTokens: 1000, budgetPerRole: {}, autoSaveIntervalMs: 5000 });
    const doc = s.newDocument('Ch1');
    expect(doc.id()).toBe('s1-Ch1');
    expect(s.getDocument('Ch1')?.id()).toBe('s1-Ch1');
  });

  it('age returns positive number', () => {
    const s = new SessionOrchestrator('s1', { maxTokens: 100, budgetPerRole: {}, autoSaveIntervalMs: 100 });
    expect(s.age()).toBeGreaterThanOrEqual(0);
  });
});

describe('V4637 CoAuthorWorkflow', () => {
  it('define creates 5 stages', () => {
    const w = new CoAuthorWorkflow();
    w.define();
    expect(w.steps().length).toBe(5);
  });

  it('advance moves to next stage', () => {
    const w = new CoAuthorWorkflow();
    w.define();
    expect(w.currentStage()).toBe('plan');
    w.advance();
    expect(w.currentStage()).toBe('draft');
  });

  it('progress reflects completion', () => {
    const w = new CoAuthorWorkflow();
    w.define();
    expect(w.progress()).toBe(0);
    w.advance();
    w.advance();
    expect(w.progress()).toBeCloseTo(0.4);
  });

  it('fail marks current stage failed', () => {
    const w = new CoAuthorWorkflow();
    w.define();
    w.fail('error');
    expect(w.steps()[0].status).toBe('failed');
  });

  it('isComplete when all done', () => {
    const w = new CoAuthorWorkflow();
    w.define();
    let safety = 0;
    while (!w.isComplete() && safety++ < 10) w.advance();
    expect(w.isComplete()).toBe(true);
  });
});

describe('V4638 PromptTemplateRegistry', () => {
  it('register and get', () => {
    const r = new PromptTemplateRegistry();
    r.register({ id: 't1', template: 'Hi {name}', variables: ['name'] });
    expect(r.get('t1')?.template).toBe('Hi {name}');
  });

  it('byTag filters templates', () => {
    const r = new PromptTemplateRegistry();
    r.register({ id: 'a', template: 'A', variables: [] }, ['writing']);
    r.register({ id: 'b', template: 'B', variables: [] }, ['planning']);
    expect(r.byTag('writing').length).toBe(1);
  });

  it('search by keyword', () => {
    const r = new PromptTemplateRegistry();
    r.register({ id: 'x', template: 'outline planning template', variables: [] });
    r.register({ id: 'y', template: 'dialog template', variables: [] });
    expect(r.search('outline').length).toBe(1);
  });

  it('count and tags list', () => {
    const r = new PromptTemplateRegistry();
    r.register({ id: 'a', template: 'A', variables: [] }, ['t1', 't2']);
    expect(r.count()).toBe(1);
    expect(r.tags()).toEqual(['t1', 't2']);
  });
});

describe('V4639 MemoryStore', () => {
  it('set and get', () => {
    const m = new MemoryStore();
    m.set({ key: 'k1', value: 'v1', tags: ['character'], createdAt: Date.now() });
    expect(m.get('k1')?.value).toBe('v1');
  });

  it('TTL expiration', () => {
    const m = new MemoryStore();
    m.set({ key: 'k1', value: 'v1', tags: [], ttl: 50, createdAt: Date.now() - 100 });
    expect(m.get('k1')).toBeUndefined();
  });

  it('byTag filters', () => {
    const m = new MemoryStore();
    m.set({ key: 'a', value: '1', tags: ['plot'], createdAt: Date.now() });
    m.set({ key: 'b', value: '2', tags: ['character'], createdAt: Date.now() });
    expect(m.byTag('plot').length).toBe(1);
  });

  it('gc removes expired', () => {
    const m = new MemoryStore();
    m.set({ key: 'a', value: '1', tags: [], ttl: 50, createdAt: Date.now() - 100 });
    expect(m.gc()).toBe(1);
    expect(m.size()).toBe(0);
  });

  it('clear empties store', () => {
    const m = new MemoryStore();
    m.set({ key: 'a', value: '1', tags: [], createdAt: Date.now() });
    m.clear();
    expect(m.size()).toBe(0);
  });
});

describe('V4640 OutlineBuilder', () => {
  it('build from beats', () => {
    const o = new OutlineBuilder();
    const outline = o.build('Novel', ['setup', 'conflict', 'resolution'], 3000);
    expect(outline.length).toBe(3);
    expect(outline[0].title).toContain('第一章');
  });

  it('totalWords sums targets', () => {
    const o = new OutlineBuilder();
    const outline = o.build('N', ['a', 'b'], 3000);
    expect(o.totalWords(outline)).toBe(6000);
  });

  it('expand adds more chapters', () => {
    const o = new OutlineBuilder();
    const outline = o.build('N', ['a'], 1000);
    const expanded = o.expand(outline, ['b', 'c']);
    expect(expanded.length).toBe(3);
  });
});

describe('V4641 SceneContinuationEngine', () => {
  it('continue appends text', () => {
    const c = new SceneContinuationEngine();
    const out = c.continue({ previousText: '你好世界。', targetLength: 10 });
    expect(out.length).toBeGreaterThan('你好世界。'.length);
  });

  it('estimateContinuationWords counts chars', () => {
    const c = new SceneContinuationEngine();
    // '你好。世界！' → split by [。！？.!?] → ['你好', '世界'] → 4 chars total
    const w = c.estimateContinuationWords('你好。世界！');
    expect(w).toBe(4);
  });
});

describe('V4642 StyleProfileEditor', () => {
  it('createProfile and apply', () => {
    const c = new CoAuthor2Integration({ maxTokens: 1000, budgetPerRole: {}, autoSaveIntervalMs: 5000 });
    const editor = c.session().style ? new StyleProfileEditor(c.session().style) : null;
    expect(editor).not.toBeNull();
    if (editor) {
      const p = editor.createProfile('p1', 'formal', { '你好': '您好' }, 20);
      editor.apply(p);
      expect(c.session().style.styles()).toContain('p1');
    }
  });
});

describe('V4643 CoAuthorStats', () => {
  it('record and aggregate', () => {
    const s = new CoAuthorStats();
    s.recordChars(100);
    s.recordChars(200);
    s.recordEdit();
    s.recordTime(60000);
    expect(s.totalChars()).toBe(300);
    expect(s.totalEdits()).toBe(1);
    expect(s.charsPerMinute()).toBe(300);
  });

  it('reset clears all', () => {
    const s = new CoAuthorStats();
    s.recordChars(100);
    s.reset();
    expect(s.totalChars()).toBe(0);
  });

  it('sessions counter', () => {
    const s = new CoAuthorStats();
    s.completeSession();
    s.completeSession();
    expect(s.sessions()).toBe(2);
  });
});

describe('V4644 CollaborationAuditLog', () => {
  it('log creates entry with id and timestamp', () => {
    const l = new CollaborationAuditLog();
    const e = l.log({ action: 'create', user: 'alice', target: 'doc1' });
    expect(e.id).toBeDefined();
    expect(e.timestamp).toBeGreaterThan(0);
  });

  it('byAction filters', () => {
    const l = new CollaborationAuditLog();
    l.log({ action: 'edit', user: 'u', target: 't' });
    l.log({ action: 'create', user: 'u', target: 't' });
    expect(l.byAction('edit').length).toBe(1);
  });

  it('byUser filters', () => {
    const l = new CollaborationAuditLog();
    l.log({ action: 'edit', user: 'alice', target: 't' });
    l.log({ action: 'edit', user: 'bob', target: 't' });
    expect(l.byUser('alice').length).toBe(1);
  });

  it('recent returns last N', () => {
    const l = new CollaborationAuditLog();
    for (let i = 0; i < 5; i++) l.log({ action: 'edit', user: 'u', target: 't' });
    expect(l.recent(2).length).toBe(2);
  });
});

describe('V4645 CoAuthor2Integration end-to-end demo', () => {
  it('runDemo completes workflow and produces stats', () => {
    const c = new CoAuthor2Integration({ maxTokens: 4000, budgetPerRole: { planner: 1000 }, autoSaveIntervalMs: 5000 });
    const result = c.runDemo();
    expect(result.outline.length).toBeGreaterThan(0);
    expect(result.workflowProgress).toBe(1);
    expect(result.statsChars).toBeGreaterThan(0);
    expect(result.auditCount).toBeGreaterThan(0);
  });

  it('init is idempotent', () => {
    const c = new CoAuthor2Integration({ maxTokens: 1000, budgetPerRole: {}, autoSaveIntervalMs: 100 });
    c.init();
    c.init(); // should not throw or duplicate
    expect(c.templates().count()).toBe(4);
  });

  it('exposes all sub-engines', () => {
    const c = new CoAuthor2Integration({ maxTokens: 1000, budgetPerRole: {}, autoSaveIntervalMs: 100 });
    expect(c.session()).toBeDefined();
    expect(c.workflow()).toBeDefined();
    expect(c.memory()).toBeDefined();
    expect(c.outline()).toBeDefined();
    expect(c.continuation()).toBeDefined();
    expect(c.stats()).toBeDefined();
    expect(c.audit()).toBeDefined();
  });
});

describe('CoAuthor2IntegrationIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new CoAuthor2IntegrationIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new CoAuthor2IntegrationIndex();
    expect(idx.has('SessionOrchestrator')).toBe(true);
    expect(idx.has('CoAuthor2IntegrationIndex')).toBe(true);
  });

  it('COAUTHOR2_BATCH_3_ENGINES has 10 entries', () => {
    expect(COAUTHOR2_BATCH_3_ENGINES.length).toBe(10);
  });
});

describe('CoAuthor2MasterIndex', () => {
  it('list includes all 31 entries (10+10+10+1)', () => {
    const idx = new CoAuthor2MasterIndex();
    expect(idx.list().length).toBe(31);
    expect(idx.count()).toBe(31);
  });

  it('has() checks presence of all batch engines', () => {
    const idx = new CoAuthor2MasterIndex();
    expect(idx.has('MultiAgentOrchestrator')).toBe(true);
    expect(idx.has('StreamingWriter')).toBe(true);
    expect(idx.has('SessionOrchestrator')).toBe(true);
    expect(idx.has('CoAuthor2MasterIndex')).toBe(true);
    expect(idx.has('NonExistent')).toBe(false);
  });

  it('BATCH_1 has 10, BATCH_2 has 10, BATCH_3 has 10', () => {
    expect(COAUTHOR2_BATCH_1_ENGINES.length).toBe(10);
    expect(COAUTHOR2_BATCH_2_ENGINES.length).toBe(10);
    expect(COAUTHOR2_BATCH_3_ENGINES.length).toBe(10);
  });
});