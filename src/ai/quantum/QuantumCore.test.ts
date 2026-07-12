// V5396-V5405: Quantum Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  QubitManager,
  AnnealingScheduler,
  EntanglementGraph,
  QuantumGate,
  QuantumCircuit,
  SuperpositionState,
  MeasurementEngine,
  QuantumRandom,
  QuantumOptimizerBase,
  QuantumCoreIndex,
  Qubit,
  OptimizationResult
} from './QuantumCore';

describe('QubitManager', () => {
  it('create initializes |0>', () => {
    const m = new QubitManager();
    const q = m.create(1);
    expect(q.alpha).toEqual({ real: 1, imag: 0 });
    expect(q.beta).toEqual({ real: 0, imag: 0 });
  });

  it('probabilityZero starts at 1', () => {
    const m = new QubitManager();
    m.create(1);
    expect(m.probabilityZero(1)).toBe(1);
    expect(m.probabilityOne(1)).toBe(0);
  });

  it('setState updates probabilities', () => {
    const m = new QubitManager();
    m.create(1);
    m.setState(1, { real: 1 / Math.sqrt(2), imag: 0 }, { real: 1 / Math.sqrt(2), imag: 0 });
    expect(m.probabilityZero(1)).toBeCloseTo(0.5);
    expect(m.probabilityOne(1)).toBeCloseTo(0.5);
  });

  it('get returns null for missing', () => {
    const m = new QubitManager();
    expect(m.get(99)).toBeNull();
  });

  it('reset clears all qubits', () => {
    const m = new QubitManager();
    m.create(1);
    m.create(2);
    m.reset();
    expect(m.totalQubits()).toBe(0);
  });
});

describe('AnnealingScheduler', () => {
  it('configure and currentTemp decays', () => {
    const s = new AnnealingScheduler();
    s.configure({ steps: 100, initialTemp: 10, finalTemp: 0.01, coolingRate: 0.95 });
    expect(s.currentTemp(0)).toBeCloseTo(10);
    expect(s.currentTemp(1)).toBeLessThan(10);
  });

  it('shouldAccept negative delta always true', () => {
    const s = new AnnealingScheduler();
    expect(s.shouldAccept(-1, 0)).toBe(true);
  });

  it('shouldAccept positive delta may be false at low temp', () => {
    const s = new AnnealingScheduler();
    s.configure({ steps: 100, initialTemp: 0.0001, finalTemp: 0.00001, coolingRate: 0.95 });
    expect(s.shouldAccept(10, 5)).toBe(false);
  });

  it('record and bestEnergy', () => {
    const s = new AnnealingScheduler();
    s.record(0, 10);
    s.record(1, 5);
    s.record(2, 8);
    expect(s.bestEnergy()).toBe(5);
  });

  it('reset clears history', () => {
    const s = new AnnealingScheduler();
    s.record(0, 10);
    s.reset();
    expect(s.bestEnergy()).toBe(Infinity);
  });
});

describe('EntanglementGraph', () => {
  it('entangle creates edge', () => {
    const g = new EntanglementGraph();
    g.entangle(1, 2, 0.8);
    expect(g.totalEdges()).toBe(1);
  });

  it('entangledWith finds neighbors', () => {
    const g = new EntanglementGraph();
    g.entangle(1, 2);
    g.entangle(1, 3);
    expect(g.entangledWith(1).length).toBe(2);
  });

  it('degreeOf counts edges', () => {
    const g = new EntanglementGraph();
    g.entangle(1, 2);
    g.entangle(1, 3);
    g.entangle(2, 3);
    expect(g.degreeOf(1)).toBe(2);
    expect(g.degreeOf(3)).toBe(2);
  });

  it('disentangle removes edge', () => {
    const g = new EntanglementGraph();
    g.entangle(1, 2);
    expect(g.disentangle(1, 2)).toBe(true);
    expect(g.disentangle(1, 2)).toBe(false);
  });

  it('strongestPair finds max strength', () => {
    const g = new EntanglementGraph();
    g.entangle(1, 2, 0.3);
    g.entangle(2, 3, 0.9);
    expect(g.strongestPair()?.strength).toBe(0.9);
  });
});

describe('QuantumGate', () => {
  it('X gate swaps alpha and beta', () => {
    const g = new QuantumGate();
    const qubits = new Map<number, Qubit>();
    const q = { id: 1, alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
    qubits.set(1, q);
    g.applyGate(qubits, { type: 'X', qubits: [1] });
    expect(q.alpha.real).toBe(0);
    expect(q.beta.real).toBe(1);
  });

  it('Z gate negates beta', () => {
    const g = new QuantumGate();
    const qubits = new Map<number, Qubit>();
    const q = { id: 1, alpha: { real: 1, imag: 0 }, beta: { real: 0.5, imag: 0 } };
    qubits.set(1, q);
    g.applyGate(qubits, { type: 'Z', qubits: [1] });
    expect(q.beta.real).toBe(-0.5);
  });

  it('H gate creates superposition', () => {
    const g = new QuantumGate();
    const qubits = new Map<number, Qubit>();
    const q = { id: 1, alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
    qubits.set(1, q);
    g.applyGate(qubits, { type: 'H', qubits: [1] });
    expect(q.alpha.real).toBeCloseTo(1 / Math.sqrt(2));
    expect(q.beta.real).toBeCloseTo(1 / Math.sqrt(2));
  });

  it('returns false for missing qubit', () => {
    const g = new QuantumGate();
    expect(g.applyGate(new Map(), { type: 'X', qubits: [99] })).toBe(false);
  });

  it('returns false for empty qubits array', () => {
    const g = new QuantumGate();
    expect(g.applyGate(new Map(), { type: 'X', qubits: [] })).toBe(false);
  });
});

describe('QuantumCircuit', () => {
  it('addQubit and addStep', () => {
    const c = new QuantumCircuit();
    c.addQubit(1);
    c.addStep([{ type: 'H', qubits: [1] }]);
    expect(c.totalQubits()).toBe(1);
    expect(c.steps().length).toBe(1);
  });

  it('execute runs circuit', () => {
    const c = new QuantumCircuit();
    c.addQubit(1);
    c.addStep([{ type: 'X', qubits: [1] }]);
    expect(c.execute()).toBe(true);
    expect(c.qubitState(1)?.beta.real).toBe(1);
  });

  it('execute returns false for missing qubit', () => {
    const c = new QuantumCircuit();
    c.addStep([{ type: 'X', qubits: [99] }]);
    expect(c.execute()).toBe(false);
  });

  it('qubitState returns null for missing', () => {
    const c = new QuantumCircuit();
    expect(c.qubitState(99)).toBeNull();
  });

  it('steps preserve order', () => {
    const c = new QuantumCircuit();
    c.addQubit(1);
    c.addStep([{ type: 'H', qubits: [1] }]);
    c.addStep([{ type: 'X', qubits: [1] }]);
    expect(c.steps().map(s => s.stepNumber)).toEqual([0, 1]);
  });
});

describe('SuperpositionState', () => {
  it('setAmplitude and probability', () => {
    const s = new SuperpositionState();
    s.setAmplitude('00', 1 / Math.sqrt(2));
    s.setAmplitude('11', 1 / Math.sqrt(2));
    expect(s.probability('00')).toBeCloseTo(0.5);
  });

  it('basisStates returns keys', () => {
    const s = new SuperpositionState();
    s.setAmplitude('00', 1);
    s.setAmplitude('11', 1);
    expect(s.basisStates().sort()).toEqual(['00', '11']);
  });

  it('totalProbability sums squared amplitudes', () => {
    const s = new SuperpositionState();
    s.setAmplitude('00', 0.5);
    s.setAmplitude('11', 0.5);
    expect(s.totalProbability()).toBeCloseTo(0.5);
  });

  it('normalize divides by sqrt of total', () => {
    const s = new SuperpositionState();
    s.setAmplitude('00', 2);
    s.setAmplitude('11', 1);
    s.normalize();
    expect(s.totalProbability()).toBeCloseTo(1);
  });

  it('normalize no-op when total is 0', () => {
    const s = new SuperpositionState();
    s.normalize();
    expect(s.totalProbability()).toBe(0);
  });
});

describe('MeasurementEngine', () => {
  it('measure returns 0 or 1', () => {
    const m = new MeasurementEngine();
    const q = { id: 1, alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } };
    expect(m.measure(q)).toBe(0);
  });

  it('measureBasis returns probability', () => {
    const m = new MeasurementEngine();
    const s = new SuperpositionState();
    s.setAmplitude('00', 0.5);
    expect(m.measureBasis(s, '00')).toBeCloseTo(0.25);
  });

  it('sampleOutcomes buckets by outcome string', () => {
    const m = new MeasurementEngine();
    const qubits = [{ id: 1, alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } }];
    const results = m.sampleOutcomes(qubits, 100);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.count > 0)).toBe(true);
  });

  it('collapseProbability returns p0, p1', () => {
    const m = new MeasurementEngine();
    const q = { id: 1, alpha: { real: 1 / Math.sqrt(2), imag: 0 }, beta: { real: 1 / Math.sqrt(2), imag: 0 } };
    const p = m.collapseProbability(q);
    expect(p.p0).toBeCloseTo(0.5);
    expect(p.p1).toBeCloseTo(0.5);
  });
});

describe('QuantumRandom', () => {
  it('uniformSample within range', () => {
    const r = new QuantumRandom();
    for (let i = 0; i < 50; i++) {
      const v = r.uniformSample(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('gaussianSample has approximate mean', () => {
    const r = new QuantumRandom();
    let sum = 0;
    const n = 200;
    for (let i = 0; i < n; i++) sum += r.gaussianSample(5, 1);
    expect(sum / n).toBeCloseTo(5, 0);
  });

  it('discreteSample returns null for empty', () => {
    const r = new QuantumRandom();
    expect(r.discreteSample([], [])).toBeNull();
  });

  it('discreteSample returns item from list', () => {
    const r = new QuantumRandom();
    const item = r.discreteSample(['a', 'b', 'c'], [1, 1, 1]);
    expect(['a', 'b', 'c']).toContain(item);
  });

  it('discreteSample respects weights', () => {
    const r = new QuantumRandom();
    const item = r.discreteSample(['a', 'b'], [100, 0]);
    expect(item).toBe('a');
  });
});

describe('QuantumOptimizerBase', () => {
  it('abstract base runs and tracks best energy', () => {
    class SimpleOpt extends QuantumOptimizerBase {
      energy(solution: number[]): number {
        return solution.reduce((a, b) => a + b * b, 0);
      }
      step(temperature: number): number[] {
        const delta = (Math.random() - 0.5) * temperature;
        const cur = this._bestSolution.length > 0 ? this._bestSolution : [1, 1];
        return cur.map(x => x + delta);
      }
    }
    const opt = new SimpleOpt();
    const scheduler = new AnnealingScheduler();
    scheduler.configure({ steps: 50, initialTemp: 5, finalTemp: 0.01, coolingRate: 0.9 });
    const result = opt.run(scheduler, 30);
    expect(result.energy).toBeLessThan(Infinity);
    expect(result.iterations).toBeGreaterThan(0);
  });

  it('abstract result has solution and energy', () => {
    class TrivialOpt extends QuantumOptimizerBase {
      energy(s: number[]): number { return s[0]; }
      step(t: number): number[] { return [0]; }
    }
    const opt = new TrivialOpt();
    const scheduler = new AnnealingScheduler();
    const result: OptimizationResult = opt.run(scheduler, 10);
    expect(result.solution).toBeDefined();
    expect(typeof result.energy).toBe('number');
  });
});

describe('QuantumCoreIndex', () => {
  it('summary includes counts', () => {
    const q = new QubitManager();
    const s = new AnnealingScheduler();
    const g = new EntanglementGraph();
    q.create(1);
    q.create(2);
    s.record(0, 5);
    g.entangle(1, 2);
    const summary = QuantumCoreIndex.summary(q, s, g);
    expect(summary).toContain('Qubits: 2');
    expect(summary).toContain('Annealing steps: 1');
    expect(summary).toContain('Entanglements: 1');
  });
});