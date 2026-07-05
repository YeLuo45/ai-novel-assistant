// V4926-V4935: CL Workflow Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  BranchStep,
  ParallelStep,
  JoinStep,
  ConditionalStep,
  LoopStep,
  SubWorkflow,
  WaitStep,
  SignalStep,
  WorkflowStateMachine,
  WorkflowAdvancedIndex,
  CL_BATCH_2_ENGINES
} from './WorkflowAdvanced';

describe('BranchStep', () => {
  it('addBranch + execute + default', () => {
    const b = new BranchStep();
    b.addBranch('a', () => 'A').addBranch('b', () => 'B');
    expect(b.execute('a', null)).toBe('A');
    expect(b.execute('b', null)).toBe('B');
    expect(b.execute('missing', null)).toBeNull();
    expect(b.branchCount()).toBe(2);
    expect(b.hasBranch('a')).toBe(true);
    b.setDefault(() => 'def');
    expect(b.execute('missing', null)).toBe('def');
  });
});

describe('ParallelStep', () => {
  it('add + run + reset', async () => {
    const p = new ParallelStep();
    p.add(async x => (x as number) + 1);
    p.add(async x => (x as number) * 2);
    const r = await p.run(5);
    expect(r).toEqual([6, 10]);
    expect(p.taskCount()).toBe(2);
    p.reset();
    expect(p.taskCount()).toBe(0);
  });
});

describe('JoinStep', () => {
  it('arrive + isComplete + results + reset', () => {
    const j = new JoinStep(3);
    expect(j.isComplete()).toBe(false);
    expect(j.arrive('a')).toBe(false);
    expect(j.arrive('b')).toBe(false);
    expect(j.arrive('c')).toBe(true);
    expect(j.results()).toEqual(['a', 'b', 'c']);
    expect(j.expected()).toBe(3);
    j.reset();
    expect(j.isComplete()).toBe(false);
  });
});

describe('ConditionalStep', () => {
  it('evaluate + then + negate', () => {
    const c = new ConditionalStep(x => (x as number) > 0);
    expect(c.evaluate(5)).toBe(true);
    expect(c.evaluate(-5)).toBe(false);
    expect(c.then(5, () => 'pos', () => 'neg')).toBe('pos');
    expect(c.then(-5, () => 'pos', () => 'neg')).toBe('neg');
    expect(c.negate(5)).toBe(false);
  });
});

describe('LoopStep', () => {
  it('iterate + iterateAsync', async () => {
    const l = new LoopStep(3);
    const items = [1, 2, 3, 4, 5];
    const log: number[] = [];
    const n = l.iterate(items, x => log.push(x));
    expect(n).toBe(3);
    expect(log).toEqual([1, 2, 3]);

    const log2: number[] = [];
    const n2 = await l.iterateAsync([1, 2], async x => { log2.push(x); });
    expect(n2).toBe(2);
    expect(log2).toEqual([1, 2]);
    expect(l.maxIterations()).toBe(3);
  });
});

describe('SubWorkflow', () => {
  it('register + invoke + names + count', async () => {
    const s = new SubWorkflow();
    s.register('a', async () => 'A');
    s.register('b', async () => 'B');
    expect(await s.invoke('a')).toBe('A');
    expect(await s.invoke('missing')).toBeNull();
    expect(s.names()).toEqual(['a', 'b']);
    expect(s.count()).toBe(2);
  });
});

describe('WaitStep', () => {
  it('wait', async () => {
    const w = new WaitStep();
    const start = Date.now();
    await w.wait(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });

  it('waitUntil success', async () => {
    let n = 0;
    const result = await new WaitStep().waitUntil(() => { n += 1; return n >= 3; }, 10, 1000);
    expect(result).toBe(true);
  });

  it('waitUntil timeout', async () => {
    const result = await new WaitStep().waitUntil(() => false, 10, 30);
    expect(result).toBe(false);
  });

  it('waitFor signal', async () => {
    const sig = { resolved: false };
    setTimeout(() => { sig.resolved = true; }, 20);
    const r = await new WaitStep().waitFor(sig, 500);
    expect(r).toBe(true);
  });
});

describe('SignalStep', () => {
  it('emit + on + history + listenerCount + clear', () => {
    const s = new SignalStep();
    let captured: unknown = null;
    s.on('go', p => { captured = p; });
    s.emit('go', 42);
    expect(captured).toBe(42);
    expect(s.history('go')).toEqual([42]);
    expect(s.listenerCount('go')).toBe(1);
    const off = s.on('go', () => {});
    off();
    expect(s.listenerCount('go')).toBe(1);
    expect(s.listenerCount('missing')).toBe(0);
    s.clear();
    expect(s.history('go')).toEqual([]);
  });
});

describe('WorkflowStateMachine', () => {
  it('addTransition + canTransition + transition', () => {
    const m = new WorkflowStateMachine();
    m.addTransition('a', 'b').addTransition('b', 'c');
    m.setInitial('a');
    expect(m.current()).toBe('a');
    expect(m.canTransition('b')).toBe(true);
    expect(m.canTransition('c')).toBe(false);
    expect(m.transition('b')).toBe(true);
    expect(m.transition('c')).toBe(true);
    expect(m.transition('a')).toBe(false);
    expect(m.states()).toContain('a');
    expect(m.reachable('a')).toEqual(['b']);
  });
});

describe('WorkflowAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new WorkflowAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new WorkflowAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('BranchStep')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CL_BATCH_2_ENGINES const has 10', () => {
    expect(CL_BATCH_2_ENGINES).toHaveLength(10);
  });
});