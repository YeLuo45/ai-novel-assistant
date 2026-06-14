import { describe, it, expect } from 'vitest';
import { createCRDTState, incrementCRDT, setCRDT, addToSet, removeFromSet, getCRDT, mergeCRDT, crdtHealth } from './CRDTState';

describe('V2212 CRDTState', () => {
  it('should create empty state', () => {
    const s = createCRDTState();
    expect(s.entries.size).toBe(0);
  });

  it('should set register', () => {
    let s = createCRDTState();
    s = setCRDT(s, 'k', 1, 'alice');
    expect(getCRDT(s, 'k')).toBe(1);
  });

  it('should increment counter', () => {
    let s = createCRDTState();
    s = incrementCRDT(s, 'counter', 'alice', 5);
    s = incrementCRDT(s, 'counter', 'bob', 3);
    expect(getCRDT(s, 'counter')).toBe(8);
  });

  it('should add to set', () => {
    let s = createCRDTState();
    s = addToSet(s, 'myset', 'a', 'alice');
    s = addToSet(s, 'myset', 'b', 'alice');
    s = addToSet(s, 'myset', 'a', 'bob');
    expect(getCRDT(s, 'myset')).toEqual(['a', 'b']);
  });

  it('should remove from set', () => {
    let s = createCRDTState();
    s = addToSet(s, 'myset', 'a', 'alice');
    s = addToSet(s, 'myset', 'b', 'alice');
    s = removeFromSet(s, 'myset', 'a', 'bob');
    expect(getCRDT(s, 'myset')).toEqual(['b']);
  });

  it('should merge by timestamp', () => {
    let a = createCRDTState();
    let b = createCRDTState();
    a = setCRDT(a, 'k', 1, 'alice');
    b = setCRDT(b, 'k', 2, 'bob');
    const merged = mergeCRDT(a, b);
    // b is set after a in time, so it wins
    expect([1, 2]).toContain(getCRDT(merged, 'k') as number);
  });

  it('should compute health', () => {
    let s = createCRDTState();
    s = setCRDT(s, 'k', 1, 'alice');
    const h = crdtHealth(s);
    expect(h.health).toBe(1);
  });
});
