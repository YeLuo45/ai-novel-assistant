import { describe, it, expect } from 'vitest';
import { createHNSWState, insertNode, searchKNN, nodeCount, getNode, hnswHealth } from './MemoryIndex';

describe('V2149 MemoryIndex', () => {
  it('should create empty HNSW', () => {
    const s = createHNSWState();
    expect(nodeCount(s)).toBe(0);
  });

  it('should insert node', () => {
    let s = createHNSWState();
    s = insertNode(s, 'a', [0.1, 0.2]);
    expect(nodeCount(s)).toBe(1);
    expect(s.entryPoint).toBe('a');
  });

  it('should insert multiple nodes', () => {
    let s = createHNSWState();
    s = insertNode(s, 'a', [0.1]);
    s = insertNode(s, 'b', [0.2]);
    s = insertNode(s, 'c', [0.15]);
    expect(nodeCount(s)).toBe(3);
  });

  it('should search KNN', () => {
    let s = createHNSWState();
    s = insertNode(s, 'a', [0.1]);
    s = insertNode(s, 'b', [0.9]);
    s = insertNode(s, 'c', [0.5]);
    const r = searchKNN(s, [0.12], 2);
    expect(r.length).toBe(2);
    expect(r[0]).toBe('a');
  });

  it('should return empty for empty index', () => {
    const s = createHNSWState();
    expect(searchKNN(s, [0.1], 5)).toEqual([]);
  });

  it('should get node by id', () => {
    let s = createHNSWState();
    s = insertNode(s, 'a', [0.1]);
    expect(getNode(s, 'a')?.id).toBe('a');
  });

  it('should return undefined for missing node', () => {
    const s = createHNSWState();
    expect(getNode(s, 'nope')).toBeUndefined();
  });

  it('should compute health', () => {
    let s = createHNSWState();
    s = insertNode(s, 'a', [0.1]);
    const h = hnswHealth(s);
    expect(h.entryPoint).toBe(true);
    expect(h.health).toBe(1);
  });
});
