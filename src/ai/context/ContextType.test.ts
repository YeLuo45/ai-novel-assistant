import { describe, it, expect } from 'vitest';
import { createContextTypeState, setContextEntry, getContextEntry, getContextKind, entriesByKind, countByKind, contextTypeHealth } from './ContextType';

describe('V2271 ContextType', () => {
  it('should create empty state', () => {
    const s = createContextTypeState();
    expect(s.entries.size).toBe(0);
  });

  it('should set context entry', () => {
    let s = createContextTypeState();
    s = setContextEntry(s, 'k1', 'hello', 'message');
    expect(getContextKind(s, 'k1')).toBe('message');
  });

  it('should get content', () => {
    let s = createContextTypeState();
    s = setContextEntry(s, 'k1', 'hello', 'message');
    expect(getContextEntry(s, 'k1')).toBe('hello');
  });

  it('should list by kind', () => {
    let s = createContextTypeState();
    s = setContextEntry(s, 'a', 1, 'message');
    s = setContextEntry(s, 'b', 2, 'message');
    s = setContextEntry(s, 'c', 3, 'document');
    expect(entriesByKind(s, 'message')).toHaveLength(2);
  });

  it('should count by kind', () => {
    let s = createContextTypeState();
    s = setContextEntry(s, 'a', 1, 'message');
    s = setContextEntry(s, 'b', 2, 'message');
    const counts = countByKind(s);
    expect(counts.message).toBe(2);
  });

  it('should compute health', () => {
    let s = createContextTypeState();
    s = setContextEntry(s, 'k1', 1, 'message');
    const h = contextTypeHealth(s);
    expect(h.health).toBe(1);
  });
});
