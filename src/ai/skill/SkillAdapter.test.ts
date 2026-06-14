import { describe, it, expect } from 'vitest';
import { createSkillAdapterState, toSkillMarkdown, toSkillMDX, toSkillPlain, toSkillTokens, toSkillJSON, adaptSkillFormat, skillAdapterHealth } from './SkillAdapter';

describe('V2324 SkillAdapter', () => {
  it('should create empty state', () => {
    const s = createSkillAdapterState();
    expect(s.formatCounts.markdown).toBe(0);
  });

  it('should convert to markdown', () => {
    const r = toSkillMarkdown('# Title');
    expect(r.kind).toBe('markdown');
  });

  it('should convert to mdx', () => {
    const r = toSkillMDX('# Title');
    expect(r.kind).toBe('mdx');
  });

  it('should convert to plain', () => {
    const r = toSkillPlain('Hello');
    expect(r.kind).toBe('plain');
  });

  it('should convert to tokens', () => {
    const r = toSkillTokens('Hello world');
    expect(r.kind).toBe('tokens');
  });

  it('should convert to JSON', () => {
    const r = toSkillJSON({ x: 1 });
    expect(r.kind).toBe('json');
  });

  it('should adapt and count', () => {
    let s = createSkillAdapterState();
    s = adaptSkillFormat(s, 'markdown');
    s = adaptSkillFormat(s, 'markdown');
    expect(s.formatCounts.markdown).toBe(2);
  });

  it('should compute health', () => {
    let s = createSkillAdapterState();
    s = adaptSkillFormat(s, 'markdown');
    const h = skillAdapterHealth(s);
    expect(h.health).toBe(1);
  });
});
