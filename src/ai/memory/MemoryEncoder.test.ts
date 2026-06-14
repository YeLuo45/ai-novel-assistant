import { describe, it, expect } from 'vitest';
import { createMemoryEncoder, encode, markIndexed, markStale, archive, setWeight, totalMemories, activeMemories, memoryHealth } from './MemoryEncoder';

describe('V2146 MemoryEncoder', () => {
  it('should create empty encoder', () => {
    const s = createMemoryEncoder();
    expect(totalMemories(s)).toBe(0);
  });

  it('should encode memory', () => {
    const { state, mem } = encode(createMemoryEncoder(), 'hello world');
    expect(mem.vec).toHaveLength(8);
    expect(mem.tags.length).toBeGreaterThan(0);
    expect(mem.aspect).toBe('encoded');
  });

  it('should mark indexed', () => {
    let s = createMemoryEncoder();
    const { state, mem } = encode(s, 'test');
    s = markIndexed(state, mem.id);
    expect(s.memories.get(mem.id)?.aspect).toBe('indexed');
  });

  it('should mark stale and reduce weight', () => {
    let s = createMemoryEncoder();
    const { state, mem } = encode(s, 'x');
    s = markStale(state, mem.id);
    expect(s.memories.get(mem.id)?.aspect).toBe('stale');
    expect(s.memories.get(mem.id)?.weight).toBe(0.5);
  });

  it('should archive memory', () => {
    let s = createMemoryEncoder();
    const { state, mem } = encode(s, 'x');
    s = archive(state, mem.id);
    expect(s.memories.get(mem.id)?.aspect).toBe('archived');
  });

  it('should set weight within 0-1', () => {
    let s = createMemoryEncoder();
    const { state, mem } = encode(s, 'x');
    s = setWeight(state, mem.id, 0.7);
    expect(s.memories.get(mem.id)?.weight).toBe(0.7);
    s = setWeight(s, mem.id, 2);
    expect(s.memories.get(mem.id)?.weight).toBe(1);
  });

  it('should count active memories', () => {
    let s = createMemoryEncoder();
    const a = encode(s, 'a'); s = a.state;
    const b = encode(s, 'b'); s = b.state;
    s = archive(s, a.mem.id);
    expect(activeMemories(s)).toBe(1);
  });

  it('should compute health', () => {
    const s = createMemoryEncoder();
    const h = memoryHealth(s);
    expect(h.total).toBe(0);
    expect(h.health).toBe(1);
  });
});
