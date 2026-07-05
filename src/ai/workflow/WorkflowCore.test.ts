// V4916-V4925: CL Workflow Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  WorkflowEngine,
  StepExecutor,
  StepRegistry,
  TransitionGuard,
  ErrorHandler,
  RetryPolicy,
  CompensationEngine,
  SagaCoordinator,
  TimeoutEnforcer,
  WorkflowCoreIndex,
  CL_BATCH_1_ENGINES
} from './WorkflowCore';

describe('WorkflowEngine', () => {
  it('addStep + getStep + stepStatus', () => {
    const e = new WorkflowEngine();
    e.addStep({ id: 's1', execute: () => ({ status: 'completed' as const }) });
    expect(e.getStep('s1')?.id).toBe('s1');
    expect(e.stepStatus('s1')).toBe('pending');
    expect(e.stepCount()).toBe(1);
    expect(e.order()).toEqual(['s1']);
    expect(e.setStatus('s1', 'completed')).toBe(true);
    expect(e.setStatus('missing', 'completed')).toBe(false);
  });

  it('reset', () => {
    const e = new WorkflowEngine();
    e.addStep({ id: 's1', execute: () => ({ status: 'completed' as const }) });
    e.setStatus('s1', 'completed');
    e.reset();
    expect(e.stepStatus('s1')).toBe('pending');
  });

  it('getStep null', () => {
    expect(new WorkflowEngine().getStep('missing')).toBeNull();
  });
});

describe('StepExecutor', () => {
  it('run success', async () => {
    const ex = new StepExecutor();
    const r = await ex.run({ id: 's', execute: () => ({ status: 'completed' as const, output: 42 }) }, null);
    expect(r.status).toBe('completed');
    expect(r.output).toBe(42);
  });

  it('run error caught', async () => {
    const ex = new StepExecutor();
    const r = await ex.run({ id: 's', execute: () => { throw new Error('boom'); } }, null);
    expect(r.status).toBe('failed');
    expect(r.error).toBe('boom');
  });

  it('runAll executes in order', async () => {
    const e = new WorkflowEngine();
    e.addStep({ id: 'a', execute: () => ({ status: 'completed' as const, output: 1 }) });
    e.addStep({ id: 'b', execute: () => ({ status: 'completed' as const, output: 2 }) });
    const ex = new StepExecutor();
    const r = await ex.runAll(e, null);
    expect(r).toHaveLength(2);
    expect(e.stepStatus('a')).toBe('completed');
    expect(e.stepStatus('b')).toBe('completed');
  });
});

describe('StepRegistry', () => {
  it('register + create + has + types + count', () => {
    const r = new StepRegistry();
    r.register('noop', () => ({ id: 'tmp', execute: () => ({ status: 'completed' as const }) }));
    const step = r.create('noop', 's1');
    expect(step?.id).toBe('s1');
    expect(r.has('noop')).toBe(true);
    expect(r.types()).toEqual(['noop']);
    expect(r.count()).toBe(1);
    expect(r.create('missing', 'x')).toBeNull();
  });
});

describe('TransitionGuard', () => {
  it('canTransition with no guard returns true', () => {
    expect(new TransitionGuard().canTransition('any', null)).toBe(true);
  });

  it('addGuard + canTransition', () => {
    const g = new TransitionGuard();
    g.addGuard('a', x => (x as number) > 0);
    expect(g.canTransition('a', 1)).toBe(true);
    expect(g.canTransition('a', -1)).toBe(false);
    expect(g.guards()).toEqual(['a']);
    g.clear();
    expect(g.guards()).toEqual([]);
  });
});

describe('ErrorHandler', () => {
  it('on + handle + default', () => {
    const h = new ErrorHandler();
    let captured = '';
    h.on('TypeError', e => { captured = e.message; });
    h.handle(new TypeError('bad'));
    expect(captured).toBe('bad');
  });

  it('handle with no handler uses default', () => {
    const h = new ErrorHandler();
    let captured = '';
    h.setDefault(e => { captured = e.message; });
    h.handle(new Error('default'));
    expect(captured).toBe('default');
  });

  it('handledCount', () => {
    expect(new ErrorHandler().handledCount()).toBe(0);
  });
});

describe('RetryPolicy', () => {
  it('shouldRetry + backoff', () => {
    const r = new RetryPolicy(3, 100);
    expect(r.shouldRetry(0)).toBe(true);
    expect(r.shouldRetry(2)).toBe(true);
    expect(r.shouldRetry(3)).toBe(false);
    expect(r.backoff(0)).toBe(100);
    expect(r.backoff(2)).toBe(400);
    expect(r.maxAttempts()).toBe(3);
    r.setMaxAttempts(5);
    expect(r.maxAttempts()).toBe(5);
  });

  it('retry succeeds', async () => {
    const r = new RetryPolicy(3, 1);
    let n = 0;
    const out = await r.retry(async () => {
      n += 1;
      if (n < 2) throw new Error('x');
      return 'ok';
    });
    expect(out).toBe('ok');
    expect(n).toBe(2);
  });

  it('retry throws after max', async () => {
    const r = new RetryPolicy(2, 1);
    await expect(r.retry(async () => { throw new Error('always'); })).rejects.toThrow('always');
  });
});

describe('CompensationEngine', () => {
  it('add + compensate runs reverse', async () => {
    const c = new CompensationEngine();
    const log: number[] = [];
    c.add(() => { log.push(1); }).add(() => { log.push(2); }).add(() => { log.push(3); });
    await c.compensate(null);
    expect(log).toEqual([3, 2, 1]);
    expect(c.count()).toBe(3);
    c.clear();
    expect(c.count()).toBe(0);
  });
});

describe('SagaCoordinator', () => {
  it('run success', async () => {
    const s = new SagaCoordinator();
    let ran = 0;
    s.addStep('a', async () => { ran += 1; }, async () => {});
    s.addStep('b', async () => { ran += 1; }, async () => {});
    expect(await s.run()).toBe(true);
    expect(ran).toBe(2);
    expect(s.completed()).toEqual(['a', 'b']);
  });

  it('run failure triggers compensation', async () => {
    const s = new SagaCoordinator();
    let undone = 0;
    s.addStep('a', async () => {}, async () => { undone += 1; });
    s.addStep('b', async () => { throw new Error('fail'); }, async () => {});
    expect(await s.run()).toBe(false);
    expect(undone).toBe(1);
    expect(s.completed()).toEqual([]);
  });
});

describe('TimeoutEnforcer', () => {
  it('setDeadline + isExpired + remaining + clear', async () => {
    const t = new TimeoutEnforcer();
    t.setDeadline('a', 20);
    expect(t.isExpired('a')).toBe(false);
    expect(t.trackedCount()).toBe(1);
    expect(t.remainingMs('a')).toBeGreaterThanOrEqual(0);
    await new Promise(r => setTimeout(r, 30));
    expect(t.isExpired('a')).toBe(true);
    expect(t.clear('a')).toBe(true);
    expect(t.trackedCount()).toBe(0);
  });

  it('isExpired for untracked returns false', () => {
    expect(new TimeoutEnforcer().isExpired('missing')).toBe(false);
    expect(new TimeoutEnforcer().remainingMs('missing')).toBe(0);
  });

  it('withTimeout success', async () => {
    const r = await new TimeoutEnforcer().withTimeout(Promise.resolve('ok'), 100);
    expect(r).toBe('ok');
  });

  it('withTimeout rejects', async () => {
    await expect(new TimeoutEnforcer().withTimeout(new Promise(r => setTimeout(r, 200)), 20)).rejects.toThrow('Timeout');
  });
});

describe('WorkflowCoreIndex', () => {
  it('list has 10', () => {
    expect(new WorkflowCoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new WorkflowCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('WorkflowEngine')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CL_BATCH_1_ENGINES const has 10', () => {
    expect(CL_BATCH_1_ENGINES).toHaveLength(10);
  });
});