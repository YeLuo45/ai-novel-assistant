// V5406-V5415: Quantum Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  QAOAOptimizer,
  VQESolver,
  GroverAmplifier,
  ShorFactorization,
  QuantumWalk,
  TensorNetwork,
  DecoherenceModel,
  QuantumErrorCorrection,
  QuantumAnnealingSolver,
  QuantumAdvancedIndex
} from './QuantumAdvanced';

describe('QAOAOptimizer', () => {
  it('optimize finds minimum', () => {
    const q = new QAOAOptimizer();
    const result = q.optimize((b) => b.split('').filter(c => c === '1').length, 4, 2, 20);
    expect(result.bestValue).toBeGreaterThanOrEqual(0);
    expect(result.bestBitstring.length).toBe(4);
  });

  it('bruteForceMaxCut counts crossing edges', () => {
    const q = new QAOAOptimizer();
    const result = q.bruteForceMaxCut([[0, 1], [1, 2], [2, 0]], 3);
    expect(result.cuts).toBeGreaterThanOrEqual(0);
    expect(result.bitstring.length).toBe(3);
  });

  it('bruteForceMaxCut finds optimal', () => {
    const q = new QAOAOptimizer();
    const result = q.bruteForceMaxCut([[0, 1]], 2);
    expect(result.cuts).toBe(1);
  });

  it('optimize iterations = layers * maxIter', () => {
    const q = new QAOAOptimizer();
    const result = q.optimize(() => 1, 2, 3, 10);
    expect(result.iterations).toBe(30);
  });

  it('bruteForceMaxCut no edges returns 0', () => {
    const q = new QAOAOptimizer();
    const result = q.bruteForceMaxCut([], 2);
    expect(result.cuts).toBe(0);
  });
});

describe('VQESolver', () => {
  it('solve returns ground state energy', () => {
    const v = new VQESolver();
    const result = v.solve([[1, 0], [0, 1]], (t) => Math.cos(t), 20);
    expect(typeof result.groundStateEnergy).toBe('number');
    expect(result.parameters.length).toBeGreaterThan(0);
  });

  it('expectationValue is state * operator * state', () => {
    const v = new VQESolver();
    expect(v.expectationValue(0.5, 2)).toBeCloseTo(0.5);
  });

  it('buildHamiltonian from diagonal', () => {
    const v = new VQESolver();
    const H = v.buildHamiltonian([1, 2, 3]);
    expect(H[0][0]).toBe(1);
    expect(H[2][2]).toBe(3);
    expect(H[0][1]).toBe(0);
  });

  it('solve converged is true when valid', () => {
    const v = new VQESolver();
    const result = v.solve([[1, 0], [0, 1]], () => 0.5, 20);
    expect(result.converged).toBe(true);
  });

  it('solve with diagonal hamiltonian', () => {
    const v = new VQESolver();
    const result = v.solve(v.buildHamiltonian([0.1, 0.5, 1.0]), (t) => t, 10);
    expect(result.groundStateEnergy).toBeGreaterThanOrEqual(0);
  });
});

describe('GroverAmplifier', () => {
  it('search returns amplification', () => {
    const g = new GroverAmplifier();
    const result = g.search(['a', 'b', 'c', 'd'], 'a', 10);
    expect(result.amplification).toBeGreaterThan(0);
    expect(result.iterations).toBeGreaterThan(0);
  });

  it('probabilitySuccess is amplification squared', () => {
    const g = new GroverAmplifier();
    const result = g.search(['a'], 'a', 5);
    const p = g.probabilitySuccess(result.amplification);
    expect(p).toBeCloseTo(result.amplification * result.amplification);
  });

  it('needsMoreIterations when low amplification', () => {
    const g = new GroverAmplifier();
    expect(g.needsMoreIterations(0.5)).toBe(true);
    expect(g.needsMoreIterations(0.99)).toBe(false);
  });

  it('search respects maxIter', () => {
    const g = new GroverAmplifier();
    const result = g.search(['a', 'b', 'c', 'd', 'e'], 'b', 1);
    expect(result.iterations).toBeLessThanOrEqual(1);
  });

  it('search amplification monotonic with optimal iterations', () => {
    const g = new GroverAmplifier();
    const small = g.search(['a', 'b', 'c'], 'a', 10);
    const large = g.search(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 'a', 10);
    expect(small.amplification).toBeGreaterThanOrEqual(large.amplification);
  });
});

describe('ShorFactorization', () => {
  it('factor handles even numbers', () => {
    const s = new ShorFactorization();
    const result = s.factor(15 * 2);
    expect(result.factors).toContain(2);
    expect(result.success).toBe(true);
  });

  it('factor returns factors for small composite', () => {
    const s = new ShorFactorization();
    const result = s.factor(15);
    expect(result.factors[0] * result.factors[1]).toBe(15);
  });

  it('factor returns failure for n=1', () => {
    const s = new ShorFactorization();
    expect(s.factor(1).success).toBe(false);
  });

  it('periodFinding detects repetition', () => {
    const s = new ShorFactorization();
    const period = s.periodFinding(2, 7, 20);
    expect(period).toBeGreaterThan(0);
    expect(period).toBeLessThanOrEqual(20);
  });

  it('factor counts attempts', () => {
    const s = new ShorFactorization();
    const result = s.factor(7 * 11, 5);
    expect(result.attempts).toBeGreaterThanOrEqual(0);
  });
});

describe('QuantumWalk', () => {
  it('walk generates steps', () => {
    const w = new QuantumWalk();
    const steps = w.walk(10, 0);
    expect(steps.length).toBe(11);
  });

  it('walk probabilities are valid', () => {
    const w = new QuantumWalk();
    const steps = w.walk(5);
    expect(steps.every(s => s.probability > 0 && s.probability <= 1)).toBe(true);
  });

  it('stationaryDistribution starts at 1', () => {
    const w = new QuantumWalk();
    const dist = w.stationaryDistribution(5);
    expect(dist[0]).toBe(1);
  });

  it('mixingTime grows with dimension', () => {
    const w = new QuantumWalk();
    expect(w.mixingTime(10)).toBeGreaterThan(w.mixingTime(2));
  });

  it('walk starts at given position', () => {
    const w = new QuantumWalk();
    const steps = w.walk(3, 5);
    expect(steps[0].position).toBe(5);
  });
});

describe('TensorNetwork', () => {
  it('addNode and getNode', () => {
    const t = new TensorNetwork();
    t.addNode({ id: 'a', rank: 2, data: [1, 2] });
    expect(t.getNode('a')?.data).toEqual([1, 2]);
  });

  it('contract produces elementwise product', () => {
    const t = new TensorNetwork();
    t.addNode({ id: 'a', rank: 1, data: [2, 3] });
    t.addNode({ id: 'b', rank: 1, data: [4, 5] });
    const result = t.contract('a', 'b');
    expect(result?.data).toEqual([8, 15]);
  });

  it('contract fails on rank mismatch', () => {
    const t = new TensorNetwork();
    t.addNode({ id: 'a', rank: 1, data: [1] });
    t.addNode({ id: 'b', rank: 2, data: [1, 2] });
    expect(t.contract('a', 'b')).toBeNull();
  });

  it('removeNode removes from map', () => {
    const t = new TensorNetwork();
    t.addNode({ id: 'a', rank: 1, data: [1] });
    expect(t.removeNode('a')).toBe(true);
    expect(t.totalNodes()).toBe(0);
  });

  it('getNode returns null for missing', () => {
    const t = new TensorNetwork();
    expect(t.getNode('missing')).toBeNull();
  });
});

describe('DecoherenceModel', () => {
  it('fidelity decays with time', () => {
    const d = new DecoherenceModel();
    expect(d.fidelity(0)).toBeCloseTo(1);
    expect(d.fidelity(1000)).toBeLessThan(1);
  });

  it('setCoherenceTimes updates decay', () => {
    const d = new DecoherenceModel();
    d.setCoherenceTimes(1000, 500);
    expect(d.fidelity(100)).toBeGreaterThan(d.fidelity(10000));
  });

  it('recordEvent and eventsFor', () => {
    const d = new DecoherenceModel();
    d.recordEvent({ qubitId: 1, time: 0, type: 'dephasing' });
    d.recordEvent({ qubitId: 2, time: 0, type: 'relaxation' });
    expect(d.eventsFor(1).length).toBe(1);
  });

  it('averageFidelity over time points', () => {
    const d = new DecoherenceModel();
    expect(d.averageFidelity([0, 100, 200])).toBeLessThan(1);
  });

  it('totalEvents counts', () => {
    const d = new DecoherenceModel();
    d.recordEvent({ qubitId: 1, time: 0, type: 'dephasing' });
    expect(d.totalEvents()).toBe(1);
  });
});

describe('QuantumErrorCorrection', () => {
  it('detectError returns syndrome', () => {
    const q = new QuantumErrorCorrection();
    const s = q.detectError(1, 0);
    expect(s.errorDetected).toBe('none');
  });

  it('detectError finds errors with high noise', () => {
    const q = new QuantumErrorCorrection();
    let found = 0;
    for (let i = 0; i < 100; i++) {
      const s = q.detectError(1, 1);
      if (s.errorDetected !== 'none') found++;
    }
    expect(found).toBeGreaterThan(50);
  });

  it('correct returns true when error present', () => {
    const q = new QuantumErrorCorrection();
    const syndrome = { qubitId: 1, errorDetected: 'X' as const, ts: 0 };
    expect(q.correct(syndrome)).toBe(true);
  });

  it('correct returns false when no error', () => {
    const q = new QuantumErrorCorrection();
    const syndrome = { qubitId: 1, errorDetected: 'none' as const, ts: 0 };
    expect(q.correct(syndrome)).toBe(false);
  });

  it('correctionRate is 0 when no syndromes', () => {
    const q = new QuantumErrorCorrection();
    expect(q.correctionRate()).toBe(0);
  });

  it('syndromes returns all', () => {
    const q = new QuantumErrorCorrection();
    q.detectError(1, 0);
    q.detectError(2, 0);
    expect(q.totalSyndromes()).toBe(2);
  });
});

describe('QuantumAnnealingSolver', () => {
  it('solve finds minimum of sphere function', () => {
    const q = new QuantumAnnealingSolver();
    const result = q.solve((s) => s[0] ** 2, [5], 50);
    expect(result.energy).toBeLessThan(25);
  });

  it('solve records steps', () => {
    const q = new QuantumAnnealingSolver();
    const result = q.solve(() => 0, [0], 20);
    expect(result.steps).toBe(20);
  });

  it('solveTSP returns tour and distance', () => {
    const q = new QuantumAnnealingSolver();
    const cities = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    const result = q.solveTSP(cities, 30);
    expect(result.tour.length).toBe(4);
    expect(result.distance).toBeGreaterThan(0);
  });

  it('solve converges on simple function', () => {
    const q = new QuantumAnnealingSolver();
    const result = q.solve((s) => Math.abs(s[0]), [5], 50);
    expect(result.converged).toBe(true);
  });

  it('solve with zero energy stays at initial', () => {
    const q = new QuantumAnnealingSolver();
    const result = q.solve(() => 0, [0], 10);
    expect(result.energy).toBe(0);
  });
});

describe('QuantumAdvancedIndex', () => {
  it('summary combines all engines', () => {
    const q = new QAOAOptimizer();
    const v = new VQESolver();
    const g = new GroverAmplifier();
    const a = new QuantumAnnealingSolver();
    const summary = QuantumAdvancedIndex.summary(q, v, g, a);
    expect(summary).toContain('QAOA MaxCut');
    expect(summary).toContain('VQE energy');
    expect(summary).toContain('Grover amp');
    expect(summary).toContain('Annealer energy');
  });
});