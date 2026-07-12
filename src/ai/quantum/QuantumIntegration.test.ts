// V5416-V5425: Quantum Integration Batch 3/3 tests
import { describe, it, expect } from 'vitest';
import {
  QuantumBackend,
  QuantumCompiler,
  QuantumJobScheduler,
  QuantumResultAggregator,
  QuantumNoiseSimulator,
  QuantumBenchmark,
  QuantumMigration,
  QuantumIntegrationIndex,
  QuantumMasterIndex,
  DCQuantumBridge
} from './QuantumIntegration';
import { QubitManager } from './QuantumCore';
import { GroverAmplifier, QAOAOptimizer } from './QuantumAdvanced';

describe('QuantumBackend', () => {
  it('registerBackend and availableBackends', () => {
    const b = new QuantumBackend();
    b.registerBackend('simulator');
    b.registerBackend('ibm-quantum');
    expect(b.availableBackends().sort()).toEqual(['ibm-quantum', 'simulator']);
  });

  it('submit and run lifecycle', () => {
    const b = new QuantumBackend();
    const job = b.submit('H(0)', 1, 100);
    expect(job.status).toBe('queued');
    expect(b.run(job.id)).toBe(true);
    expect(b.jobs()[0].status).toBe('completed');
  });

  it('run fails on missing job', () => {
    const b = new QuantumBackend();
    expect(b.run('missing')).toBe(false);
  });

  it('fail marks job', () => {
    const b = new QuantumBackend();
    const job = b.submit('X(0)', 1);
    expect(b.fail(job.id)).toBe(true);
    expect(b.jobsByStatus('failed').length).toBe(1);
  });

  it('jobsByStatus filters', () => {
    const b = new QuantumBackend();
    const j1 = b.submit('H(0)', 1);
    b.run(j1.id);
    b.submit('X(0)', 1);
    expect(b.jobsByStatus('completed').length).toBe(1);
    expect(b.jobsByStatus('queued').length).toBe(1);
  });
});

describe('QuantumCompiler', () => {
  it('compile reduces gate count', () => {
    const c = new QuantumCompiler();
    const result = c.compile(10, 4);
    expect(result.optimizedGates).toBeLessThan(result.originalGates);
    expect(result.depth).toBe(3);
  });

  it('optimizeGates cancels adjacent duplicates', () => {
    const c = new QuantumCompiler();
    expect(c.optimizeGates(['H', 'H', 'X', 'X', 'H']).join(',')).toBe('H');
  });

  it('transpileToBackend adds suffix', () => {
    const c = new QuantumCompiler();
    expect(c.transpileToBackend(['H'], 'ibm-quantum')).toEqual(['H-ibm-quantum']);
  });

  it('estimatedRuntime scales with gates', () => {
    const c = new QuantumCompiler();
    expect(c.estimatedRuntime(100)).toBe(10);
  });

  it('compressionRatio is 0 when no gates', () => {
    const c = new QuantumCompiler();
    expect(c.compressionRatio(c.compile(0, 2))).toBe(0);
  });
});

describe('QuantumJobScheduler', () => {
  it('enqueue and pending', () => {
    const s = new QuantumJobScheduler();
    s.enqueue('job-1', 5);
    expect(s.totalPending()).toBe(1);
  });

  it('nextJob returns highest priority (lowest number)', () => {
    const s = new QuantumJobScheduler();
    s.enqueue('low', 10);
    s.enqueue('high', 1);
    s.enqueue('med', 5);
    expect(s.nextJob()?.jobId).toBe('high');
  });

  it('pop removes and returns', () => {
    const s = new QuantumJobScheduler();
    s.enqueue('job-1', 5);
    s.enqueue('job-2', 1);
    const first = s.pop();
    expect(first?.jobId).toBe('job-2');
    expect(s.totalPending()).toBe(1);
  });

  it('nextJob returns null when empty', () => {
    const s = new QuantumJobScheduler();
    expect(s.nextJob()).toBeNull();
  });

  it('byPriority sorts ascending', () => {
    const s = new QuantumJobScheduler();
    s.enqueue('a', 5);
    s.enqueue('b', 1);
    expect(s.byPriority()[0].jobId).toBe('b');
  });
});

describe('QuantumResultAggregator', () => {
  it('addShot and aggregate', () => {
    const a = new QuantumResultAggregator();
    a.addShot('job-1', 1);
    a.addShot('job-1', 2);
    a.addShot('job-1', 3);
    const r = a.aggregate('job-1');
    expect(r?.meanValue).toBe(2);
    expect(r?.totalShots).toBe(3);
  });

  it('aggregate returns null when no shots', () => {
    const a = new QuantumResultAggregator();
    expect(a.aggregate('missing')).toBeNull();
  });

  it('bestResult finds highest mean', () => {
    const a = new QuantumResultAggregator();
    a.addShot('a', 1);
    a.addShot('b', 5);
    expect(a.bestResult(['a', 'b'])?.jobId).toBe('b');
  });

  it('successRate counts positive values', () => {
    const a = new QuantumResultAggregator();
    a.addShot('j', 1);
    a.addShot('j', 0);
    a.addShot('j', -1);
    expect(a.aggregate('j')?.successRate).toBeCloseTo(1 / 3);
  });

  it('totalShots sums across jobs', () => {
    const a = new QuantumResultAggregator();
    a.addShot('a', 1);
    a.addShot('b', 2);
    expect(a.totalShots()).toBe(2);
  });
});

describe('QuantumNoiseSimulator', () => {
  it('addChannel and totalChannels', () => {
    const n = new QuantumNoiseSimulator();
    n.addChannel({ type: 'bit-flip', probability: 0.1 });
    expect(n.totalChannels()).toBe(1);
  });

  it('applyNoise false when no channels', () => {
    const n = new QuantumNoiseSimulator();
    expect(n.applyNoise()).toBe(false);
  });

  it('applyNoise may be true with high probability', () => {
    const n = new QuantumNoiseSimulator();
    n.addChannel({ type: 'bit-flip', probability: 1 });
    let triggered = 0;
    for (let i = 0; i < 10; i++) {
      if (n.applyNoise()) triggered++;
    }
    expect(triggered).toBeGreaterThan(5);
  });

  it('errorRate sums probabilities', () => {
    const n = new QuantumNoiseSimulator();
    n.addChannel({ type: 'bit-flip', probability: 0.1 });
    n.addChannel({ type: 'phase-flip', probability: 0.05 });
    expect(n.errorRate()).toBeCloseTo(0.15);
  });

  it('removeChannel filters by type', () => {
    const n = new QuantumNoiseSimulator();
    n.addChannel({ type: 'bit-flip', probability: 0.1 });
    n.addChannel({ type: 'phase-flip', probability: 0.1 });
    expect(n.removeChannel('bit-flip')).toBe(true);
    expect(n.totalChannels()).toBe(1);
  });
});

describe('QuantumBenchmark', () => {
  it('record and fastestFor', () => {
    const b = new QuantumBenchmark();
    b.record({ backend: 'sim', qubits: 4, gateCount: 100, executionMs: 50, fidelity: 0.99 });
    b.record({ backend: 'sim', qubits: 4, gateCount: 100, executionMs: 30, fidelity: 0.95 });
    expect(b.fastestFor(4)?.executionMs).toBe(30);
  });

  it('fastestFor returns null when no match', () => {
    const b = new QuantumBenchmark();
    expect(b.fastestFor(99)).toBeNull();
  });

  it('averageFidelity computes', () => {
    const b = new QuantumBenchmark();
    b.record({ backend: 'sim', qubits: 4, gateCount: 100, executionMs: 50, fidelity: 0.9 });
    b.record({ backend: 'sim', qubits: 4, gateCount: 100, executionMs: 30, fidelity: 1.0 });
    expect(b.averageFidelity('sim')).toBeCloseTo(0.95);
  });

  it('byBackend counts', () => {
    const b = new QuantumBenchmark();
    b.record({ backend: 'sim', qubits: 2, gateCount: 10, executionMs: 5, fidelity: 0.99 });
    b.record({ backend: 'ibm', qubits: 4, gateCount: 20, executionMs: 10, fidelity: 0.95 });
    expect(b.byBackend()).toEqual({ sim: 1, ibm: 1 });
  });

  it('totalBenchmarks counts', () => {
    const b = new QuantumBenchmark();
    b.record({ backend: 'sim', qubits: 1, gateCount: 1, executionMs: 1, fidelity: 1 });
    expect(b.totalBenchmarks()).toBe(1);
  });
});

describe('QuantumMigration', () => {
  it('planMigration creates plan', () => {
    const m = new QuantumMigration();
    const plan = m.planMigration('simulator', 'ibm-quantum', 5);
    expect(plan.steps.length).toBe(5);
    expect(plan.estimatedDuration).toBe(5000);
  });

  it('totalPlans counts', () => {
    const m = new QuantumMigration();
    m.planMigration('a', 'b', 1);
    m.planMigration('b', 'c', 1);
    expect(m.totalPlans()).toBe(2);
  });

  it('totalDuration sums', () => {
    const m = new QuantumMigration();
    m.planMigration('a', 'b', 5);
    m.planMigration('b', 'c', 3);
    expect(m.totalDuration()).toBe(8000);
  });

  it('longestPlan finds max duration', () => {
    const m = new QuantumMigration();
    m.planMigration('a', 'b', 5);
    m.planMigration('b', 'c', 10);
    expect(m.longestPlan()?.toBackend).toBe('c');
  });

  it('longestPlan returns null when empty', () => {
    const m = new QuantumMigration();
    expect(m.longestPlan()).toBeNull();
  });
});

describe('QuantumIntegrationIndex', () => {
  it('summary includes counts', () => {
    const backend = new QuantumBackend();
    const compiler = new QuantumCompiler();
    const scheduler = new QuantumJobScheduler();
    const benchmark = new QuantumBenchmark();
    backend.submit('H', 1);
    scheduler.enqueue('j', 5);
    benchmark.record({ backend: 'sim', qubits: 1, gateCount: 1, executionMs: 1, fidelity: 0.99 });
    const summary = QuantumIntegrationIndex.summary(backend, compiler, scheduler, benchmark);
    expect(summary).toContain('Jobs: 1');
    expect(summary).toContain('Pending: 1');
    expect(summary).toContain('Benchmarks: 1');
  });
});

describe('QuantumMasterIndex', () => {
  it('totalEngines returns count', () => {
    expect(QuantumMasterIndex.totalEngines()).toBeGreaterThan(20);
  });

  it('allModules includes core engines', () => {
    const modules = QuantumMasterIndex.allModules();
    expect(modules).toContain('QubitManager');
    expect(modules).toContain('QAOAOptimizer');
    expect(modules).toContain('QuantumBackend');
  });
});

describe('DCQuantumBridge', () => {
  it('qubitsToQubitMap creates map', () => {
    const mgr = new QubitManager();
    const map = DCQuantumBridge.qubitsToQubitMap(mgr, 3);
    expect(map.size).toBe(3);
    expect(mgr.totalQubits()).toBe(3);
  });

  it('qaoaSchedule configures scheduler', () => {
    const qaoa = new QAOAOptimizer();
    const scheduler = DCQuantumBridge.qaoaSchedule(qaoa, 5);
    expect(scheduler.currentTemp(0)).toBeCloseTo(10);
  });

  it('groverValidate returns confidence', () => {
    const grover = new GroverAmplifier();
    const r = DCQuantumBridge.groverValidate(grover, 'target');
    expect(r.valid).toBe(true);
    expect(r.confidence).toBeGreaterThanOrEqual(0);
  });
});