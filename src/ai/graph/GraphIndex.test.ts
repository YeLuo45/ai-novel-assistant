import { describe, it, expect } from 'vitest';
import { createGraphIndexState, indexNode, lookupByLabel, lookupByProp, removeFromIndex, indexSize, graphIndexHealth } from './GraphIndex';

describe('V2190 GraphIndex', () => {
  it('should create empty state', () => {
    const s = createGraphIndexState();
    expect(indexSize(s)).toBe(0);
  });

  it('should index node by label', () => {
    let s = createGraphIndexState();
    s = indexNode(s, 'n1', 'Person', {});
    expect(lookupByLabel(s, 'Person')).toEqual(['n1']);
  });

  it('should index node by property', () => {
    let s = createGraphIndexState();
    s = indexNode(s, 'n1', 'Person', { age: 30 });
    expect(lookupByProp(s, 'age', 30)).toEqual(['n1']);
  });

  it('should not duplicate index', () => {
    let s = createGraphIndexState();
    s = indexNode(s, 'n1', 'Person', {});
    s = indexNode(s, 'n1', 'Person', {});
    expect(lookupByLabel(s, 'Person')).toEqual(['n1']);
  });

  it('should remove from index', () => {
    let s = createGraphIndexState();
    s = indexNode(s, 'n1', 'Person', { age: 30 });
    s = removeFromIndex(s, 'n1', 'Person', { age: 30 });
    expect(lookupByLabel(s, 'Person')).toEqual([]);
  });

  it('should return empty for unknown', () => {
    const s = createGraphIndexState();
    expect(lookupByLabel(s, 'Unknown')).toEqual([]);
    expect(lookupByProp(s, 'age', 30)).toEqual([]);
  });

  it('should compute health', () => {
    let s = createGraphIndexState();
    s = indexNode(s, 'n1', 'Person', {});
    const h = graphIndexHealth(s);
    expect(h.health).toBe(1);
  });
});
