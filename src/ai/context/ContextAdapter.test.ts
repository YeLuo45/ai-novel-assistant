import { describe, it, expect } from 'vitest';
import { createContextAdapterState, toContextMarkdown, toContextPlain, toContextTokens, toContextJSON, toContextYAML, adaptContextFormat, contextAdapterHealth } from './ContextAdapter';

describe('V2294 ContextAdapter', () => {
  it('should create empty state', () => {
    const s = createContextAdapterState();
    expect(s.formatCounts.markdown).toBe(0);
  });

  it('should convert to markdown', () => {
    const r = toContextMarkdown('# Hello');
    expect(r.kind).toBe('markdown');
  });

  it('should convert to plain', () => {
    const r = toContextPlain('Hello world');
    expect(r.kind).toBe('plain');
  });

  it('should convert to tokens', () => {
    const r = toContextTokens('Hello world');
    expect(r.kind).toBe('tokens');
  });

  it('should convert to JSON', () => {
    const r = toContextJSON({ x: 1 });
    expect(r.kind).toBe('json');
  });

  it('should convert to YAML', () => {
    const r = toContextYAML({ x: 1 });
    expect(r.kind).toBe('yaml');
  });

  it('should adapt and count', () => {
    let s = createContextAdapterState();
    s = adaptContextFormat(s, 'markdown');
    s = adaptContextFormat(s, 'markdown');
    expect(s.formatCounts.markdown).toBe(2);
  });

  it('should compute health', () => {
    let s = createContextAdapterState();
    s = adaptContextFormat(s, 'markdown');
    const h = contextAdapterHealth(s);
    expect(h.health).toBe(1);
  });
});
