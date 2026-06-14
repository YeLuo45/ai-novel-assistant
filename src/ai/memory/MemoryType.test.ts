import { describe, it, expect } from 'vitest';
import { createMemoryTypeState, addTypedMemory, accessMemory, setImportance, byKind, totalByKind, mostAccessed, evictLeastImportant, memoryTypeHealth } from './MemoryType';

describe('V2151 MemoryType', () => {
  it('should create empty state', () => {
    const s = createMemoryTypeState();
    expect(s.byKind.size).toBe(0);
  });

  it('should add typed memory', () => {
    let s = createMemoryTypeState();
    s = addTypedMemory(s, { id: 'm1', kind: 'episodic', content: 'x', createdAt: 0, importance: 0.5 });
    expect(byKind(s, 'episodic')).toHaveLength(1);
  });

  it('should access memory and bump count', () => {
    let s = createMemoryTypeState();
    s = addTypedMemory(s, { id: 'm1', kind: 'working', content: 'x', createdAt: 0, importance: 0.5 });
    s = accessMemory(s, 'm1');
    s = accessMemory(s, 'm1');
    const mem = byKind(s, 'working')[0];
    expect(mem.accessCount).toBe(2);
  });

  it('should set importance clamped 0-1', () => {
    let s = createMemoryTypeState();
    s = addTypedMemory(s, { id: 'm1', kind: 'semantic', content: 'x', createdAt: 0, importance: 0.5 });
    s = setImportance(s, 'm1', 2);
    expect(byKind(s, 'semantic')[0].importance).toBe(1);
  });

  it('should count by kind', () => {
    let s = createMemoryTypeState();
    s = addTypedMemory(s, { id: 'm1', kind: 'episodic', content: 'x', createdAt: 0, importance: 0.5 });
    s = addTypedMemory(s, { id: 'm2', kind: 'semantic', content: 'x', createdAt: 0, importance: 0.5 });
    s = addTypedMemory(s, { id: 'm3', kind: 'episodic', content: 'x', createdAt: 0, importance: 0.5 });
    const counts = totalByKind(s);
    expect(counts.episodic).toBe(2);
  });

  it('should rank most accessed', () => {
    let s = createMemoryTypeState();
    s = addTypedMemory(s, { id: 'a', kind: 'episodic', content: 'x', createdAt: 0, importance: 0.5 });
    s = addTypedMemory(s, { id: 'b', kind: 'episodic', content: 'x', createdAt: 0, importance: 0.5 });
    s = accessMemory(s, 'a');
    s = accessMemory(s, 'a');
    const top = mostAccessed(s, 1);
    expect(top[0].id).toBe('a');
  });

  it('should evict least important', () => {
    let s = createMemoryTypeState();
    s = addTypedMemory(s, { id: 'a', kind: 'episodic', content: 'x', createdAt: 0, importance: 0.1 });
    s = addTypedMemory(s, { id: 'b', kind: 'episodic', content: 'x', createdAt: 0, importance: 0.9 });
    s = evictLeastImportant(s, 'episodic', 1);
    expect(byKind(s, 'episodic')).toHaveLength(1);
    expect(byKind(s, 'episodic')[0].id).toBe('b');
  });

  it('should compute health', () => {
    const s = createMemoryTypeState();
    const h = memoryTypeHealth(s);
    expect(h.health).toBe(0.5);
  });
});
