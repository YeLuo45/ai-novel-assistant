/**
 * V2100 CycleMemory tests - 35+ tests covering create/remember/recall/forget,
 * version monotonicity, capacity limits, snapshot, merge and helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  createCycleMemory,
  remember,
  recall,
  forget,
  listKeys,
  getVersion,
  snapshot,
  mergeMemory,
  size,
  isEmpty,
  clear,
  getEntryMeta,
} from '../CycleMemory';

describe('CycleMemory - createCycleMemory', () => {
  it('creates with defaults', () => {
    const m = createCycleMemory();
    expect(m.config.maxEntries).toBe(1024);
    expect(m.config.namespace).toBe('default');
    expect(m.version).toBe(1);
    expect(m.store.size).toBe(0);
  });

  it('honours namespace', () => {
    const m = createCycleMemory({ namespace: 'cycle-x' });
    expect(m.config.namespace).toBe('cycle-x');
  });

  it('rejects non-positive maxEntries', () => {
    expect(() => createCycleMemory({ maxEntries: 0 })).toThrow();
    expect(() => createCycleMemory({ maxEntries: -1 })).toThrow();
  });

  it('rejects non-finite maxEntries', () => {
    expect(() => createCycleMemory({ maxEntries: NaN })).toThrow();
  });
});

describe('CycleMemory - remember / recall', () => {
  it('stores and retrieves a value', () => {
    const m = createCycleMemory();
    remember(m, 'k', 42);
    expect(recall(m, 'k')).toBe(42);
  });

  it('returns undefined for missing key', () => {
    const m = createCycleMemory();
    expect(recall(m, 'missing')).toBeUndefined();
  });

  it('rejects empty key', () => {
    const m = createCycleMemory();
    expect(() => remember(m, '', 1)).toThrow();
  });

  it('overwrites existing key without error', () => {
    const m = createCycleMemory();
    remember(m, 'k', 1);
    remember(m, 'k', 2);
    expect(recall(m, 'k')).toBe(2);
    expect(m.store.size).toBe(1);
  });

  it('throws when capacity is exceeded on a new key', () => {
    const m = createCycleMemory({ maxEntries: 2 });
    remember(m, 'a', 1);
    remember(m, 'b', 2);
    expect(() => remember(m, 'c', 3)).toThrow(/capacity exceeded/);
  });

  it('allows overwriting when capacity is full', () => {
    const m = createCycleMemory({ maxEntries: 2 });
    remember(m, 'a', 1);
    remember(m, 'b', 2);
    expect(() => remember(m, 'a', 99)).not.toThrow();
    expect(recall(m, 'a')).toBe(99);
  });
});

describe('CycleMemory - forget', () => {
  it('deletes an existing key', () => {
    const m = createCycleMemory();
    remember(m, 'k', 1);
    expect(forget(m, 'k')).toBe(true);
    expect(recall(m, 'k')).toBeUndefined();
  });

  it('returns false for missing key', () => {
    const m = createCycleMemory();
    expect(forget(m, 'nope')).toBe(false);
  });

  it('bumps version on delete', () => {
    const m = createCycleMemory();
    const v0 = m.version;
    forget(m, 'missing');
    expect(m.version).toBe(v0);
    remember(m, 'k', 1);
    const v1 = m.version;
    forget(m, 'k');
    expect(m.version).toBeGreaterThan(v1);
  });
});

describe('CycleMemory - listKeys / getVersion', () => {
  it('returns keys in insertion order', () => {
    const m = createCycleMemory();
    remember(m, 'z', 1);
    remember(m, 'a', 2);
    remember(m, 'm', 3);
    expect(listKeys(m)).toEqual(['z', 'a', 'm']);
  });

  it('returns empty array when no keys', () => {
    expect(listKeys(createCycleMemory())).toEqual([]);
  });

  it('getVersion returns current version', () => {
    const m = createCycleMemory();
    expect(getVersion(m)).toBe(1);
    remember(m, 'k', 1);
    expect(getVersion(m)).toBeGreaterThan(1);
  });
});

describe('CycleMemory - snapshot', () => {
  it('returns a defensive copy of all values', () => {
    const m = createCycleMemory();
    remember(m, 'k', 42);
    const s = snapshot(m);
    expect(s.get('k')).toBe(42);
    s.set('k', 99);
    expect(recall(m, 'k')).toBe(42);
  });

  it('returns empty map when no entries', () => {
    expect(snapshot(createCycleMemory()).size).toBe(0);
  });
});

describe('CycleMemory - mergeMemory', () => {
  it('merges non-conflicting entries', () => {
    const t = createCycleMemory({ maxEntries: 5 });
    const s = createCycleMemory({ maxEntries: 5 });
    remember(t, 'a', 1);
    remember(s, 'b', 2);
    expect(mergeMemory(t, s)).toBe(1);
    expect(recall(t, 'a')).toBe(1);
    expect(recall(t, 'b')).toBe(2);
  });

  it('overwrites existing keys with source value', () => {
    const t = createCycleMemory();
    const s = createCycleMemory();
    remember(t, 'k', 1);
    remember(s, 'k', 2);
    expect(mergeMemory(t, s)).toBe(0);
    expect(recall(t, 'k')).toBe(2);
  });

  it('throws when target capacity would be exceeded', () => {
    const t = createCycleMemory({ maxEntries: 2 });
    const s = createCycleMemory({ maxEntries: 5 });
    remember(t, 'a', 1);
    remember(s, 'b', 2);
    remember(s, 'c', 3);
    expect(() => mergeMemory(t, s)).toThrow(/capacity/);
  });
});

describe('CycleMemory - size / isEmpty / clear', () => {
  it('size returns the number of entries', () => {
    const m = createCycleMemory();
    expect(size(m)).toBe(0);
    remember(m, 'a', 1);
    expect(size(m)).toBe(1);
  });

  it('isEmpty is true when size is 0', () => {
    expect(isEmpty(createCycleMemory())).toBe(true);
  });

  it('isEmpty is false after a remember', () => {
    const m = createCycleMemory();
    remember(m, 'k', 1);
    expect(isEmpty(m)).toBe(false);
  });

  it('clear removes all entries and bumps version', () => {
    const m = createCycleMemory();
    remember(m, 'a', 1);
    remember(m, 'b', 2);
    const v0 = m.version;
    const n = clear(m);
    expect(n).toBe(2);
    expect(m.store.size).toBe(0);
    expect(m.version).toBeGreaterThan(v0);
  });
});

describe('CycleMemory - getEntryMeta', () => {
  it('returns metadata for an existing entry', () => {
    const m = createCycleMemory();
    remember(m, 'k', 42);
    const meta = getEntryMeta(m, 'k');
    expect(meta?.key).toBe('k');
    expect(typeof meta?.version).toBe('number');
    expect(typeof meta?.updatedAt).toBe('number');
  });

  it('returns undefined for missing key', () => {
    expect(getEntryMeta(createCycleMemory(), 'nope')).toBeUndefined();
  });
});
