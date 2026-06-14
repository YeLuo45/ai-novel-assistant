import { describe, it, expect } from 'vitest';
import { createMemoryQueryState, addRecord, executeQuery, recordCount, memoryQueryHealth, type MemoryQueryExpr } from './MemoryQuery';

describe('V2154 MemoryQuery', () => {
  it('should create empty state', () => {
    const s = createMemoryQueryState();
    expect(recordCount(s)).toBe(0);
  });

  it('should add record', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { age: 30, name: 'Alice' });
    expect(recordCount(s)).toBe(1);
  });

  it('should query with eq', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { name: 'Alice' });
    s = addRecord(s, 'r2', { name: 'Bob' });
    const r = executeQuery(s, { query: { field: 'name', op: 'eq', value: 'Alice' } });
    expect(r).toHaveLength(1);
  });

  it('should query with gt', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { age: 30 });
    s = addRecord(s, 'r2', { age: 20 });
    const r = executeQuery(s, { query: { field: 'age', op: 'gt', value: 25 } });
    expect(r).toHaveLength(1);
  });

  it('should query with in', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { kind: 'episodic' });
    s = addRecord(s, 'r2', { kind: 'semantic' });
    const r = executeQuery(s, { query: { field: 'kind', op: 'in', value: ['episodic', 'working'] } });
    expect(r).toHaveLength(1);
  });

  it('should query with contains', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { text: 'hello world' });
    const r = executeQuery(s, { query: { field: 'text', op: 'contains', value: 'world' } });
    expect(r).toHaveLength(1);
  });

  it('should query with between', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { age: 30 });
    s = addRecord(s, 'r2', { age: 20 });
    const r = executeQuery(s, { query: { field: 'age', op: 'between', value: [25, 35] } });
    expect(r).toHaveLength(1);
  });

  it('should query with AND', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { age: 30, kind: 'episodic' });
    s = addRecord(s, 'r2', { age: 30, kind: 'semantic' });
    const expr: MemoryQueryExpr = { and: [{ query: { field: 'age', op: 'gt', value: 25 } }, { query: { field: 'kind', op: 'eq', value: 'episodic' } }] };
    const r = executeQuery(s, expr);
    expect(r).toHaveLength(1);
  });

  it('should query with OR', () => {
    let s = createMemoryQueryState();
    s = addRecord(s, 'r1', { kind: 'episodic' });
    s = addRecord(s, 'r2', { kind: 'semantic' });
    const r = executeQuery(s, { or: [{ query: { field: 'kind', op: 'eq', value: 'episodic' } }, { query: { field: 'kind', op: 'eq', value: 'semantic' } }] });
    expect(r).toHaveLength(2);
  });

  it('should compute health', () => {
    const s = createMemoryQueryState();
    const h = memoryQueryHealth(s);
    expect(h.health).toBe(0.5);
  });
});
