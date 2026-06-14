import { describe, it, expect } from 'vitest';
import { createHNSWState, addHNSWNode, hnswSearch, hnswNodeCount, hnswIndexHealth } from './ContextIndex';

describe('V2269 ContextIndex', () => {
  it('should create empty state', () => {
    const s = createHNSWState();
    expect(hnswNodeCount(s)).toBe(0);
  });

  it('should add node', () => {
    let s = createHNSWState();
    s = addHNSWNode(s, 'n1', [1, 0, 0]);
    expect(hnswNodeCount(s)).toBe(1);
  });

  it('should set entry point on first add', () => {
    let s = createHNSWState();
    s = addHNSWNode(s, 'n1', [1, 0, 0]);
    expect(s.entryPoint).toBe('n1');
  });

  it('should search', () => {
    let s = createHNSWState();
    s = addHNSWNode(s, 'n1', [1, 0, 0]);
    s = addHNSWNode(s, 'n2', [0, 1, 0]);
    const hits = hnswSearch(s, [1, 0, 0], 2);
    expect(hits).toHaveLength(2);
  });

  it('should return empty for empty', () => {
    const s = createHNSWState();
    expect(hnswSearch(s, [1, 0, 0])).toEqual([]);
  });

  it('should rank by similarity', () => {
    let s = createHNSWState();
    s = addHNSWNode(s, 'a', [1, 0, 0]);
    s = addHNSWNode(s, 'b', [0, 1, 0]);
    const hits = hnswSearch(s, [1, 0, 0], 2);
    expect(hits[0].id).toBe('a');
  });

  it('should compute health', () => {
    let s = createHNSWState();
    s = addHNSWNode(s, 'n1', [1, 0, 0]);
    const h = hnswIndexHealth(s);
    expect(h.health).toBe(1);
  });
});
