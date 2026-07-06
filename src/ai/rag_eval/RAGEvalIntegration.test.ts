// V5086-V5095: CQ RAG Evaluation Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  RAGEvalDashboard,
  RAGEvalReport,
  RAGEvalBenchmark,
  RAGEvalLeaderboard,
  RAGEvalConfig,
  RAGEvalAudit,
  RAGEvalProfile,
  RAGEvalRun,
  RAGEvalIntegrationIndex,
  RAGEvalMasterIndex,
  CQ_BATCH_3_ENGINES,
  CQ_ALL_ENGINES
} from './RAGEvalIntegration';

describe('RAGEvalDashboard', () => {
  it('setPanel + getPanel + panelNames + panelCount + removePanel', () => {
    const d = new RAGEvalDashboard();
    d.setPanel('recall', 'Recall', 0.92).setPanel('faith', 'Faithfulness', 0.85);
    expect(d.getPanel('recall')).toEqual({ title: 'Recall', value: 0.92 });
    expect(d.getPanel('missing')).toBeNull();
    expect(d.panelNames().sort()).toEqual(['faith', 'recall']);
    expect(d.panelCount()).toBe(2);
    expect(d.removePanel('recall')).toBe(true);
  });
});

describe('RAGEvalReport + RAGEvalBenchmark', () => {
  it('Report generate + toCSV + rank', () => {
    const r = new RAGEvalReport();
    expect(r.generate('Q1 Eval', { recall: 0.9, faith: 0.85 })).toContain('# Q1 Eval');
    expect(r.toCSV({ a: 1 })).toContain('metric,value');
    const ranked = r.rank([{ name: 'A', score: 0.7 }, { name: 'B', score: 0.9 }]);
    expect(ranked[0].name).toBe('B');
    expect(ranked[0].rank).toBe(1);
  });

  it('Benchmark record + average + bestFor + systems', () => {
    const b = new RAGEvalBenchmark();
    b.record('sysA', 'recall', 0.9).record('sysA', 'recall', 0.8);
    b.record('sysB', 'recall', 0.95);
    expect(b.average('sysA', 'recall')).toBeCloseTo(0.85);
    expect(b.average('sysB', 'recall')).toBe(0.95);
    expect(b.bestFor('recall')).toBe('sysB');
    expect(b.bestFor('missing')).toBe('sysA');
    expect(b.systems().sort()).toEqual(['sysA', 'sysB']);
  });
});

describe('RAGEvalLeaderboard + RAGEvalConfig + RAGEvalAudit + RAGEvalProfile + RAGEvalRun', () => {
  it('Leaderboard setScore + getScore + rank + size', () => {
    const lb = new RAGEvalLeaderboard();
    lb.setScore('sysA', 0.8).setScore('sysB', 0.9);
    expect(lb.getScore('sysA')).toBe(0.8);
    expect(lb.getScore('missing')).toBe(0);
    expect(lb.rank(5)[0].system).toBe('sysB');
    expect(lb.rank(1).length).toBe(1);
    expect(lb.size()).toBe(2);
  });

  it('Config typed accessors', () => {
    const c = new RAGEvalConfig();
    c.set('topK', 10).set('metric', 'recall').set('enabled', true);
    expect(c.getNumber('topK')).toBe(10);
    expect(c.getString('metric')).toBe('recall');
    expect(c.getBoolean('enabled')).toBe(true);
    expect(c.getNumber('missing', 99)).toBe(99);
    expect(c.getString('missing', 'fb')).toBe('fb');
    expect(c.getBoolean('missing', false)).toBe(false);
    expect(c.size()).toBe(3);
  });

  it('Audit record + records + forSystem + count + clear', () => {
    const a = new RAGEvalAudit();
    a.record('u1', 'run', 'sysA').record('u2', 'run', 'sysB');
    expect(a.count()).toBe(2);
    expect(a.forSystem('sysA')).toHaveLength(1);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('Profile record + runs + averageScore + averageDuration', () => {
    const p = new RAGEvalProfile();
    p.record('sysA', 100, 0.9).record('sysA', 200, 0.8);
    expect(p.runs('sysA').length).toBe(2);
    expect(p.averageScore('sysA')).toBeCloseTo(0.85);
    expect(p.averageDuration('sysA')).toBe(150);
    expect(p.averageScore('missing')).toBe(0);
  });

  it('Run start + complete + result + age + count', async () => {
    const r = new RAGEvalRun();
    const id = r.start('sysA');
    expect(r.result(id)).toEqual({ systemId: 'sysA' });
    expect(r.complete(id, { score: 0.9 })).toBe(true);
    expect(r.complete('missing', {})).toBe(false);
    expect(r.result(id)).toEqual({ score: 0.9 });
    await new Promise(rs => setTimeout(rs, 5));
    expect(r.age(id)).toBeGreaterThan(0);
    expect(r.age('missing')).toBe(-1);
    expect(r.count()).toBe(1);
  });
});

describe('RAGEvalIntegrationIndex', () => {
  it('list has 10', () => {
    expect(new RAGEvalIntegrationIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new RAGEvalIntegrationIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('RAGEvalDashboard')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CQ_BATCH_3_ENGINES const has 10', () => {
    expect(CQ_BATCH_3_ENGINES).toHaveLength(10);
  });
});

describe('RAGEvalMasterIndex', () => {
  it('list contains all 30 engines', () => {
    expect(new RAGEvalMasterIndex().list()).toHaveLength(30);
  });

  it('count 30', () => {
    expect(new RAGEvalMasterIndex().count()).toBe(30);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new RAGEvalMasterIndex();
    expect(idx.has('RAGEvaluator')).toBe(true);
    expect(idx.has('BERTScore')).toBe(true);
    expect(idx.has('RAGEvalDashboard')).toBe(true);
  });

  it('CQ_ALL_ENGINES const has 30', () => {
    expect(CQ_ALL_ENGINES).toHaveLength(30);
  });
});