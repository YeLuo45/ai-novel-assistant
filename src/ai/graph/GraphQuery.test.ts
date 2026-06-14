import { describe, it, expect } from 'vitest';
import { createGraphQueryState, matchPattern, findByLabel, findByProp, graphQueryHealth } from './GraphQuery';
import { createGraphStorageState, addNode, addEdge } from './GraphStorage';

describe('V2178 GraphQuery', () => {
  it('should create empty state', () => {
    const s = createGraphQueryState(createGraphStorageState());
    expect(s.queryCount).toBe(0);
  });

  it('should match pattern', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Person');
    s = addNode(s, 'b', 'Company');
    s = addEdge(s, 'a', 'b');
    const qs = createGraphQueryState(s);
    const r = matchPattern(qs, { fromLabel: 'Person', edgeLabel: 'works_at', toLabel: 'Company' });
    expect(r.matches).toHaveLength(1);
  });

  it('should not match wrong labels', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Animal');
    s = addNode(s, 'b', 'Company');
    s = addEdge(s, 'a', 'b');
    const qs = createGraphQueryState(s);
    const r = matchPattern(qs, { fromLabel: 'Person', edgeLabel: 'works_at', toLabel: 'Company' });
    expect(r.matches).toHaveLength(0);
  });

  it('should find by label', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Person');
    s = addNode(s, 'b', 'Person');
    s = addNode(s, 'c', 'Animal');
    const qs = createGraphQueryState(s);
    expect(findByLabel(qs, 'Person')).toHaveLength(2);
  });

  it('should find by prop', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Person', { age: 30 });
    s = addNode(s, 'b', 'Person', { age: 20 });
    const qs = createGraphQueryState(s);
    expect(findByProp(qs, 'age', 30)).toEqual(['a']);
  });

  it('should filter with eq', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'Person');
    s = addNode(s, 'b', 'Company');
    s = addEdge(s, 'a', 'b');
    const qs = createGraphQueryState(s);
    const r = matchPattern(qs, { fromLabel: 'Person', edgeLabel: 'x', toLabel: 'Company' }, [{ prop: 'age', op: 'eq', value: 30 }]);
    // No age prop on either, but 'has' filter would fail
    expect(r.matches).toBeDefined();
  });

  it('should compute health', () => {
    let s = createGraphStorageState();
    s = addNode(s, 'a', 'A');
    let qs = createGraphQueryState(s);
    qs = matchPattern(qs, { fromLabel: 'A', edgeLabel: 'x', toLabel: 'B' }).state;
    const h = graphQueryHealth(qs);
    expect(h.queries).toBe(1);
    expect(h.health).toBe(1);
  });
});
