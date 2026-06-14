import { describe, it, expect } from 'vitest';
import { createMemoryAdapterState, toJSON, toYAML, toMarkdown, toPlain, toTokens, adaptFormat, memoryAdapterHealth } from './MemoryAdapter';

describe('V2174 MemoryAdapter', () => {
  it('should create empty state', () => {
    const s = createMemoryAdapterState();
    expect(s.formatCounts.json).toBe(0);
  });

  it('should convert to JSON', () => {
    const r = toJSON({ x: 1 });
    expect(r.kind).toBe('json');
    expect(r.content).toContain('"x"');
  });

  it('should convert to YAML', () => {
    const r = toYAML({ x: 1, y: 2 });
    expect(r.kind).toBe('yaml');
    expect(r.content).toContain('x: 1');
  });

  it('should convert to Markdown', () => {
    const r = toMarkdown({ x: 1 });
    expect(r.kind).toBe('markdown');
    expect(r.content).toContain('# Memory');
  });

  it('should convert to plain', () => {
    const r = toPlain('hello');
    expect(r.content).toBe('hello');
  });

  it('should count tokens', () => {
    const r = toTokens('hello world test');
    expect(r.tokens).toBeGreaterThan(0);
  });

  it('should adapt format and count', () => {
    let s = createMemoryAdapterState();
    s = adaptFormat(s, 'json', {});
    s = adaptFormat(s, 'json', {});
    expect(s.formatCounts.json).toBe(2);
  });

  it('should compute health', () => {
    let s = createMemoryAdapterState();
    s = adaptFormat(s, 'json', {});
    const h = memoryAdapterHealth(s);
    expect(h.health).toBe(1);
  });
});
