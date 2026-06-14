import { describe, it, expect } from 'vitest';
import { createContextGCState, addContextGCNode, addContextRoot, runContextGC, contextGCHealth } from './ContextGC';

describe('V2280 ContextGC', () => {
  it('should create empty state', () => {
    const s = createContextGCState();
    expect(s.nodes.size).toBe(0);
  });

  it('should add node', () => {
    let s = createContextGCState();
    s = addContextGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should add root', () => {
    let s = createContextGCState();
    s = addContextGCNode(s, 'a');
    s = addContextRoot(s, 'a');
    expect(s.roots.size).toBe(1);
  });

  it('should not add duplicate', () => {
    let s = createContextGCState();
    s = addContextGCNode(s, 'a');
    s = addContextGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should GC unreachable', () => {
    let s = createContextGCState();
    s = addContextGCNode(s, 'a', ['b']);
    s = addContextGCNode(s, 'b');
    s = addContextGCNode(s, 'c');
    s = addContextRoot(s, 'a');
    s = runContextGC(s);
    expect(s.nodes.size).toBe(2);
  });

  it('should compute health', () => {
    const s = createContextGCState();
    const h = contextGCHealth(s);
    expect(h.health).toBe(0.5);
  });
});
