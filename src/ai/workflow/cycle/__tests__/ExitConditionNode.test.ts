/**
 * V2090 ExitConditionNode tests - 50 tests covering construction,
 * evaluation of every condition kind, composite composition,
 * NOT / AND / OR helpers, validation, and inspection helpers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createExitCondition,
  evaluate,
  evaluateWithLabel,
  andConditions,
  orConditions,
  notCondition,
  validateConditions,
  normalizeMetrics,
  clamp,
  isFiniteNumber,
  isKnownType,
  conditionSize,
  collectIds,
  describeCondition,
  nextConditionId,
  resetConditionIdCounter,
  type ExitConditionNode,
  type LoopMetrics,
} from '../ExitConditionNode';

beforeEach(() => {
  resetConditionIdCounter();
});

const baseMetrics: LoopMetrics = { quality: 0.5, diffMagnitude: 0.1, iterationCount: 3 };

/* ========================================================================== */
/* Construction                                                                */
/* ========================================================================== */

describe('ExitConditionNode - createExitCondition', () => {
  it('creates quality node with id and params', () => {
    const n = createExitCondition('quality', { qualityThreshold: 0.7 });
    expect(n.type).toBe('quality');
    expect(n.params.qualityThreshold).toBe(0.7);
    expect(n.id).toMatch(/^quality_/);
  });

  it('creates threshold node', () => {
    const n = createExitCondition('threshold', { qualityThreshold: 0.8 });
    expect(n.type).toBe('threshold');
    expect(n.params.qualityThreshold).toBe(0.8);
  });

  it('creates diff node', () => {
    const n = createExitCondition('diff', { diffThreshold: 0.05 });
    expect(n.type).toBe('diff');
    expect(n.params.diffThreshold).toBe(0.05);
  });

  it('creates count node', () => {
    const n = createExitCondition('count', { maxCount: 10 });
    expect(n.type).toBe('count');
    expect(n.params.maxCount).toBe(10);
  });

  it('creates composite node with empty children', () => {
    const n = createExitCondition('composite', { children: [] });
    expect(n.type).toBe('composite');
    expect(n.params.children).toEqual([]);
  });

  it('honours provided id and label', () => {
    const n = createExitCondition(
      'count',
      { maxCount: 5 },
      { id: 'my_id', label: 'iter cap' }
    );
    expect(n.id).toBe('my_id');
    expect(n.label).toBe('iter cap');
  });

  it('throws on unknown condition type', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createExitCondition('bogus' as any, { qualityThreshold: 0.5 })
    ).toThrow(/unknown condition type/);
  });

  it('throws on invalid quality threshold above 1', () => {
    expect(() =>
      createExitCondition('quality', { qualityThreshold: 1.5 })
    ).toThrow(/qualityThreshold/);
  });

  it('throws on invalid quality threshold below 0', () => {
    expect(() =>
      createExitCondition('quality', { qualityThreshold: -0.1 })
    ).toThrow(/qualityThreshold/);
  });

  it('throws on invalid diff threshold below 0', () => {
    expect(() =>
      createExitCondition('diff', { diffThreshold: -1 })
    ).toThrow(/diffThreshold/);
  });

  it('throws on invalid maxCount below 0', () => {
    expect(() =>
      createExitCondition('count', { maxCount: -2 })
    ).toThrow(/maxCount/);
  });

  it('throws when composite child is invalid', () => {
    expect(() =>
      createExitCondition('composite', {
        children: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { id: '', type: 'count', params: { maxCount: 5 } } as any,
        ],
      })
    ).toThrow();
  });
});

/* ========================================================================== */
/* Evaluation - per kind                                                       */
/* ========================================================================== */

describe('ExitConditionNode - evaluate quality', () => {
  it('returns true when quality meets threshold', () => {
    const n = createExitCondition('quality', { qualityThreshold: 0.7 });
    expect(evaluate(n, { ...baseMetrics, quality: 0.7 })).toBe(true);
  });

  it('returns true when quality exceeds threshold', () => {
    const n = createExitCondition('quality', { qualityThreshold: 0.7 });
    expect(evaluate(n, { ...baseMetrics, quality: 0.9 })).toBe(true);
  });

  it('returns false when quality is below threshold', () => {
    const n = createExitCondition('quality', { qualityThreshold: 0.7 });
    expect(evaluate(n, { ...baseMetrics, quality: 0.6 })).toBe(false);
  });

  it('treats missing qualityThreshold as 0', () => {
    const n: ExitConditionNode = {
      id: 'q',
      type: 'quality',
      params: {},
    };
    expect(evaluate(n, baseMetrics)).toBe(true);
  });
});

describe('ExitConditionNode - evaluate threshold (strict)', () => {
  it('returns false when quality equals threshold', () => {
    const n = createExitCondition('threshold', { qualityThreshold: 0.8 });
    expect(evaluate(n, { ...baseMetrics, quality: 0.8 })).toBe(false);
  });

  it('returns true when quality is just above threshold', () => {
    const n = createExitCondition('threshold', { qualityThreshold: 0.8 });
    expect(evaluate(n, { ...baseMetrics, quality: 0.8000001 })).toBe(true);
  });
});

describe('ExitConditionNode - evaluate diff (convergence)', () => {
  it('exits when |diff| is within threshold', () => {
    const n = createExitCondition('diff', { diffThreshold: 0.05 });
    expect(evaluate(n, { ...baseMetrics, diffMagnitude: 0.01 })).toBe(true);
  });

  it('does not exit when |diff| exceeds threshold', () => {
    const n = createExitCondition('diff', { diffThreshold: 0.05 });
    expect(evaluate(n, { ...baseMetrics, diffMagnitude: 0.1 })).toBe(false);
  });

  it('handles negative diffs via absolute value', () => {
    const n = createExitCondition('diff', { diffThreshold: 0.05 });
    expect(evaluate(n, { ...baseMetrics, diffMagnitude: -0.02 })).toBe(true);
  });
});

describe('ExitConditionNode - evaluate count', () => {
  it('exits when iterationCount reaches maxCount', () => {
    const n = createExitCondition('count', { maxCount: 10 });
    expect(evaluate(n, { ...baseMetrics, iterationCount: 10 })).toBe(true);
  });

  it('does not exit before reaching maxCount', () => {
    const n = createExitCondition('count', { maxCount: 10 });
    expect(evaluate(n, { ...baseMetrics, iterationCount: 9 })).toBe(false);
  });
});

describe('ExitConditionNode - evaluate composite', () => {
  it('AND of two quality constraints', () => {
    const a = createExitCondition('quality', { qualityThreshold: 0.5 });
    const b = createExitCondition('quality', { qualityThreshold: 0.9 });
    const c = andConditions(a, b);
    expect(evaluate(c, { ...baseMetrics, quality: 0.95 })).toBe(true);
    expect(evaluate(c, { ...baseMetrics, quality: 0.7 })).toBe(false);
  });

  it('returns true for empty composite (vacuous)', () => {
    const n = createExitCondition('composite', { children: [] });
    expect(evaluate(n, baseMetrics)).toBe(true);
  });

  it('returns false for empty OR composite', () => {
    const n = createExitCondition('composite', {
      children: [],
      logic: 'OR',
    });
    expect(evaluate(n, baseMetrics)).toBe(false);
  });

  it('composite logic=OR evaluates as OR', () => {
    const a = createExitCondition('count', { maxCount: 1000 });
    const b = createExitCondition('count', { maxCount: 1 });
    const orNode = createExitCondition('composite', {
      children: [a, b],
      logic: 'OR',
    });
    expect(evaluate(orNode, baseMetrics)).toBe(true);
  });
});

/* ========================================================================== */
/* Helpers - AND / OR / NOT                                                    */
/* ========================================================================== */

describe('ExitConditionNode - andConditions / orConditions / notCondition', () => {
  it('AND returns true when both true', () => {
    const a = createExitCondition('count', { maxCount: 1 });
    const b = createExitCondition('quality', { qualityThreshold: 0.0 });
    expect(evaluate(andConditions(a, b), baseMetrics)).toBe(true);
  });

  it('AND returns false when one false', () => {
    const a = createExitCondition('count', { maxCount: 1000 });
    const b = createExitCondition('quality', { qualityThreshold: 0.99 });
    expect(evaluate(andConditions(a, b), baseMetrics)).toBe(false);
  });

  it('OR returns true when at least one true', () => {
    const a = createExitCondition('count', { maxCount: 1000 });
    const b = createExitCondition('count', { maxCount: 1 });
    expect(evaluate(orConditions(a, b), baseMetrics)).toBe(true);
  });

  it('OR returns false when both false', () => {
    const a = createExitCondition('count', { maxCount: 1000 });
    const b = createExitCondition('count', { maxCount: 1000 });
    expect(evaluate(orConditions(a, b), baseMetrics)).toBe(false);
  });

  it('NOT inverts true → false', () => {
    const a = createExitCondition('count', { maxCount: 1 });
    const negated = notCondition(a);
    expect(evaluateWithLabel(negated, baseMetrics)).toBe(false);
  });

  it('NOT inverts false → true', () => {
    const a = createExitCondition('count', { maxCount: 1000 });
    const negated = notCondition(a);
    expect(evaluateWithLabel(negated, baseMetrics)).toBe(true);
  });

  it('NOT inside AND short-circuits correctly', () => {
    const inner = createExitCondition('count', { maxCount: 1000 });
    const negated = notCondition(inner);
    const exitOnQuality = createExitCondition('quality', { qualityThreshold: 0 });
    // (NOT inner) AND qualityAlwaysTrue → true
    const c = andConditions(negated, exitOnQuality);
    expect(evaluateWithLabel(c, baseMetrics)).toBe(true);
  });

  it('NOT inside OR inverts correctly', () => {
    const inner = createExitCondition('count', { maxCount: 1000 });
    const negated = notCondition(inner);
    const other = createExitCondition('count', { maxCount: 1000 });
    // (NOT inner) OR other = !false OR false = true
    const c = orConditions(negated, other);
    expect(evaluateWithLabel(c, baseMetrics)).toBe(true);
  });
});

/* ========================================================================== */
/* Validation                                                                  */
/* ========================================================================== */

describe('ExitConditionNode - validateConditions', () => {
  it('accepts a valid quality node', () => {
    const n = createExitCondition('quality', { qualityThreshold: 0.5 });
    expect(validateConditions(n).ok).toBe(true);
  });

  it('rejects missing id', () => {
    const r = validateConditions({
      id: '',
      type: 'quality',
      params: { qualityThreshold: 0.5 },
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /id/.test(e))).toBe(true);
  });

  it('rejects non-string id', () => {
    const r = validateConditions({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: 5 as any,
      type: 'quality',
      params: { qualityThreshold: 0.5 },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects unknown type', () => {
    const r = validateConditions({
      id: 'x',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: 'mystery' as any,
      params: {},
    });
    expect(r.ok).toBe(false);
  });

  it('rejects non-object node', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateConditions(undefined as any).ok).toBe(false);
  });

  it('rejects non-object params', () => {
    const r = validateConditions({
      id: 'x',
      type: 'quality',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: null as any,
    });
    expect(r.ok).toBe(false);
  });

  it('rejects NaN / Infinity threshold', () => {
    expect(
      validateConditions({
        id: 'x',
        type: 'quality',
        params: { qualityThreshold: Number.NaN },
      }).ok
    ).toBe(false);
    expect(
      validateConditions({
        id: 'x',
        type: 'quality',
        params: { qualityThreshold: Number.POSITIVE_INFINITY },
      }).ok
    ).toBe(false);
  });

  it('rejects NaN / Infinity threshold for threshold kind', () => {
    expect(
      validateConditions({
        id: 'x',
        type: 'threshold',
        params: { qualityThreshold: Number.NaN },
      }).ok
    ).toBe(false);
  });

  it('rejects NaN / Infinity diffThreshold', () => {
    expect(
      validateConditions({
        id: 'x',
        type: 'diff',
        params: { diffThreshold: Number.NaN },
      }).ok
    ).toBe(false);
    expect(
      validateConditions({
        id: 'x',
        type: 'diff',
        params: { diffThreshold: Number.POSITIVE_INFINITY },
      }).ok
    ).toBe(false);
  });

  it('rejects NaN / Infinity maxCount', () => {
    expect(
      validateConditions({
        id: 'x',
        type: 'count',
        params: { maxCount: Number.NaN },
      }).ok
    ).toBe(false);
  });

  it('rejects composite with non-array children', () => {
    const r = validateConditions({
      id: 'x',
      type: 'composite',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: { children: 'oops' as any },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects composite with invalid child', () => {
    const r = validateConditions({
      id: 'x',
      type: 'composite',
      params: {
        children: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { id: '', type: 'count', params: { maxCount: 5 } } as any,
        ],
      },
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/children\[0\]/);
  });

  it('rejects composite with invalid logic value', () => {
    const r = validateConditions({
      id: 'x',
      type: 'composite',
      params: {
        children: [createExitCondition('count', { maxCount: 1 })],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logic: 'XOR' as any,
      },
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/logic/);
  });

  it('accepts composite with logic AND or OR', () => {
    const andNode = createExitCondition('composite', {
      children: [createExitCondition('count', { maxCount: 1 })],
      logic: 'AND',
    });
    const orNode = createExitCondition('composite', {
      children: [createExitCondition('count', { maxCount: 1 })],
      logic: 'OR',
    });
    expect(validateConditions(andNode).ok).toBe(true);
    expect(validateConditions(orNode).ok).toBe(true);
  });
});

/* ========================================================================== */
/* Utilities                                                                  */
/* ========================================================================== */

describe('ExitConditionNode - normalizeMetrics', () => {
  it('returns zeros for undefined', () => {
    expect(normalizeMetrics(undefined)).toEqual({
      quality: 0,
      diffMagnitude: 0,
      iterationCount: 0,
    });
  });

  it('fills missing fields with 0', () => {
    expect(normalizeMetrics({ quality: 0.5 })).toEqual({
      quality: 0.5,
      diffMagnitude: 0,
      iterationCount: 0,
    });
  });

  it('keeps a fully populated input untouched', () => {
    const m: LoopMetrics = { quality: 0.7, diffMagnitude: 0.2, iterationCount: 4 };
    expect(normalizeMetrics(m)).toEqual(m);
  });
});

describe('ExitConditionNode - clamp / isFiniteNumber / isKnownType', () => {
  it('clamps below low', () => {
    expect(clamp(-3, 0, 1)).toBe(0);
  });
  it('clamps above high', () => {
    expect(clamp(2, 0, 1)).toBe(1);
  });
  it('passes through in range', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
  it('treats NaN as low', () => {
    expect(clamp(Number.NaN, 0, 1)).toBe(0);
  });

  it('isFiniteNumber recognises numbers', () => {
    expect(isFiniteNumber(5)).toBe(true);
    expect(isFiniteNumber(0.5)).toBe(true);
    expect(isFiniteNumber('5')).toBe(false);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('isKnownType matches all five kinds', () => {
    expect(isKnownType('quality')).toBe(true);
    expect(isKnownType('threshold')).toBe(true);
    expect(isKnownType('diff')).toBe(true);
    expect(isKnownType('count')).toBe(true);
    expect(isKnownType('composite')).toBe(true);
    expect(isKnownType('bogus')).toBe(false);
  });
});

/* ========================================================================== */
/* Inspection                                                                  */
/* ========================================================================== */

describe('ExitConditionNode - conditionSize / collectIds / describeCondition', () => {
  it('counts leaves as 1', () => {
    expect(conditionSize(createExitCondition('count', { maxCount: 5 }))).toBe(1);
  });

  it('counts composite children recursively', () => {
    const a = createExitCondition('count', { maxCount: 5 });
    const b = createExitCondition('quality', { qualityThreshold: 0.5 });
    const composite = createExitCondition('composite', { children: [a, b] });
    // composite + a + b = 3
    expect(conditionSize(composite)).toBe(3);
  });

  it('collectIds returns ids in pre-order', () => {
    const a = createExitCondition('count', { maxCount: 5 }, { id: 'a' });
    const b = createExitCondition('quality', { qualityThreshold: 0.5 }, { id: 'b' });
    const c = createExitCondition('composite', { children: [a, b] }, { id: 'c' });
    expect(collectIds(c)).toEqual(['c', 'a', 'b']);
  });

  it('describeCondition includes type and params', () => {
    const d = describeCondition(
      createExitCondition('quality', { qualityThreshold: 0.7 })
    );
    expect(d).toMatch(/quality/);
    expect(d).toMatch(/0\.7/);
  });

  it('describeCondition renders threshold kind', () => {
    const d = describeCondition(
      createExitCondition('threshold', { qualityThreshold: 0.9 })
    );
    expect(d).toMatch(/threshold/);
    expect(d).toMatch(/0\.9/);
  });

  it('describeCondition renders diff kind', () => {
    const d = describeCondition(
      createExitCondition('diff', { diffThreshold: 0.05 })
    );
    expect(d).toMatch(/diff/);
    expect(d).toMatch(/0\.05/);
  });

  it('describeCondition renders count kind', () => {
    const d = describeCondition(
      createExitCondition('count', { maxCount: 10 })
    );
    expect(d).toMatch(/count/);
    expect(d).toMatch(/10/);
  });

  it('describeCondition renders composites with children', () => {
    const c = createExitCondition('composite', {
      children: [
        createExitCondition('count', { maxCount: 5 }, { id: 'c1' }),
      ],
    });
    const d = describeCondition(c);
    expect(d).toMatch(/composite/);
    expect(d).toMatch(/count/);
  });

  it('describeCondition handles empty composite', () => {
    const d = describeCondition(
      createExitCondition('composite', { children: [] })
    );
    expect(d).toMatch(/\[\]/);
  });

  it('describeCondition respects depth param', () => {
    const d = describeCondition(
      createExitCondition('count', { maxCount: 5 }),
      2
    );
    expect(d.startsWith('    ')).toBe(true);
  });
});

/* ========================================================================== */
/* Misc                                                                       */
/* ========================================================================== */

describe('ExitConditionNode - nextConditionId', () => {
  it('produces strictly increasing unique ids', () => {
    const a = nextConditionId();
    const b = nextConditionId();
    expect(a).not.toBe(b);
  });

  it('honours custom prefix', () => {
    expect(nextConditionId('foo')).toMatch(/^foo_/);
  });
});

/* ------------------------------------------------------------------------- */
/* Branch coverage gap tests                                                  */
/* ------------------------------------------------------------------------- */

describe('ExitConditionNode - branch coverage: validateConditions params non-object', () => {
  it('rejects when params is a string', () => {
    const r = validateConditions({
      id: 'q1',
      type: 'quality',
      params: 'not-an-object' as unknown as Record<string, unknown>,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/params must be an object/);
  });

  it('rejects when params is a number', () => {
    const r = validateConditions({
      id: 'q2',
      type: 'quality',
      params: 42 as unknown as Record<string, unknown>,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/params must be an object/);
  });

  it('rejects when params is null', () => {
    const r = validateConditions({
      id: 'q3',
      type: 'quality',
      params: null as unknown as Record<string, unknown>,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/params must be an object/);
  });
});

describe('ExitConditionNode - branch coverage: composite children undefined', () => {
  it('conditionSize handles composite with undefined children', () => {
    const node = {
      id: 'c0',
      type: 'composite' as const,
      params: {} as Record<string, unknown>,
    };
    expect(conditionSize(node as unknown as ExitConditionNode)).toBe(1);
  });

  it('collectIds handles composite with undefined children', () => {
    const node = {
      id: 'c0',
      type: 'composite' as const,
      params: {} as Record<string, unknown>,
    };
    expect(collectIds(node as unknown as ExitConditionNode)).toEqual(['c0']);
  });

  it('describeCondition handles composite with undefined children', () => {
    const node = {
      id: 'c0',
      type: 'composite' as const,
      params: {} as Record<string, unknown>,
    };
    const s = describeCondition(node as unknown as ExitConditionNode);
    expect(s).toContain('c0');
    expect(s).toContain('[]');
  });
});

describe('ExitConditionNode - branch coverage: evaluate missing threshold params', () => {
  it('threshold type falls back to 0 when qualityThreshold is undefined', () => {
    const node: ExitConditionNode = {
      id: 't1',
      type: 'threshold',
      params: {} as Record<string, unknown>,
    };
    // m.quality > 0 should be true for quality=0.5
    expect(evaluate(node, { quality: 0.5, diffMagnitude: 0, iterationCount: 0 })).toBe(true);
    expect(evaluate(node, { quality: 0, diffMagnitude: 0, iterationCount: 0 })).toBe(false);
  });

  it('diff type falls back to 0 when diffThreshold is undefined', () => {
    const node: ExitConditionNode = {
      id: 'd1',
      type: 'diff',
      params: {} as Record<string, unknown>,
    };
    // |m.diffMagnitude| <= 0 → true only when diffMagnitude is exactly 0
    expect(evaluate(node, { quality: 0, diffMagnitude: 0, iterationCount: 0 })).toBe(true);
    expect(evaluate(node, { quality: 0, diffMagnitude: 0.1, iterationCount: 0 })).toBe(false);
  });

  it('count type falls back to 0 when maxCount is undefined', () => {
    const node: ExitConditionNode = {
      id: 'c1',
      type: 'count',
      params: {} as Record<string, unknown>,
    };
    // iterationCount >= 0 → always true
    expect(evaluate(node, { quality: 0, diffMagnitude: 0, iterationCount: 0 })).toBe(true);
    expect(evaluate(node, { quality: 0, diffMagnitude: 0, iterationCount: 5 })).toBe(true);
  });

  it('composite with undefined children and AND logic returns true (vacuous)', () => {
    const node: ExitConditionNode = {
      id: 'cmp1',
      type: 'composite',
      params: {} as Record<string, unknown>,
    };
    // Empty composite + AND = vacuously true
    expect(evaluate(node, { quality: 0, diffMagnitude: 0, iterationCount: 0 })).toBe(true);
  });

  it('composite with undefined children and OR logic returns false (vacuous)', () => {
    const node: ExitConditionNode = {
      id: 'cmp2',
      type: 'composite',
      params: { logic: 'OR' } as Record<string, unknown>,
    };
    // Empty composite + OR = vacuously false
    expect(evaluate(node, { quality: 0, diffMagnitude: 0, iterationCount: 0 })).toBe(false);
  });
});
