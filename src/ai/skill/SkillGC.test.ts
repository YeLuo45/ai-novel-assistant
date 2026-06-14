import { describe, it, expect } from 'vitest';
import { createSkillGCState, addSkillGCNode, addSkillRoot, runSkillGC, skillGCHealth } from './SkillGC';

describe('V2310 SkillGC', () => {
  it('should create empty state', () => {
    const s = createSkillGCState();
    expect(s.nodes.size).toBe(0);
  });

  it('should add node', () => {
    let s = createSkillGCState();
    s = addSkillGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should add root', () => {
    let s = createSkillGCState();
    s = addSkillGCNode(s, 'a');
    s = addSkillRoot(s, 'a');
    expect(s.roots.size).toBe(1);
  });

  it('should not add duplicate', () => {
    let s = createSkillGCState();
    s = addSkillGCNode(s, 'a');
    s = addSkillGCNode(s, 'a');
    expect(s.nodes.size).toBe(1);
  });

  it('should GC unreachable', () => {
    let s = createSkillGCState();
    s = addSkillGCNode(s, 'a', ['b']);
    s = addSkillGCNode(s, 'b');
    s = addSkillGCNode(s, 'c');
    s = addSkillRoot(s, 'a');
    s = runSkillGC(s);
    expect(s.nodes.size).toBe(2);
  });

  it('should compute health', () => {
    const s = createSkillGCState();
    const h = skillGCHealth(s);
    expect(h.health).toBe(0.5);
  });
});
