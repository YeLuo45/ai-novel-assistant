import { describe, it, expect } from 'vitest';
import { createContextWindowState, pushContext, getContextWindow, getWindowTokens, isContextWindowFull, clearContextWindow, contextWindowHealth } from './ContextWindow';

describe('V2279 ContextWindow', () => {
  it('should create empty state', () => {
    const s = createContextWindowState();
    expect(getContextWindow(s)).toEqual([]);
  });

  it('should push context', () => {
    let s = createContextWindowState(1000);
    s = pushContext(s, 'k1', 100);
    expect(getContextWindow(s)).toHaveLength(1);
  });

  it('should evict old on overflow', () => {
    let s = createContextWindowState(200);
    s = pushContext(s, 'a', 100);
    s = pushContext(s, 'b', 100);
    s = pushContext(s, 'c', 100);
    expect(getContextWindow(s).map((e) => e.key)).toEqual(['b', 'c']);
  });

  it('should track tokens', () => {
    let s = createContextWindowState(1000);
    s = pushContext(s, 'a', 100);
    s = pushContext(s, 'b', 200);
    expect(getWindowTokens(s)).toBe(300);
  });

  it('should detect full', () => {
    let s = createContextWindowState(100);
    s = pushContext(s, 'a', 100);
    expect(isContextWindowFull(s)).toBe(true);
  });

  it('should clear', () => {
    let s = createContextWindowState(1000);
    s = pushContext(s, 'a', 100);
    s = clearContextWindow(s);
    expect(getContextWindow(s)).toEqual([]);
  });

  it('should compute health', () => {
    let s = createContextWindowState(1000);
    s = pushContext(s, 'a', 100);
    const h = contextWindowHealth(s);
    expect(h.health).toBe(1);
  });
});
