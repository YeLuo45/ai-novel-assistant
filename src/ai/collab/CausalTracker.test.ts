import { describe, it, expect } from 'vitest';
import { createCausalTrackerState, addCausalEdge, isCausallyBefore, causallyBeforeSet, causallyAfterSet, directChildren, directParents, edgeCount, causalTrackerHealth } from './CausalTracker';

describe('V2210 CausalTracker', () => {
  it('should create empty state', () => {
    const s = createCausalTrackerState();
    expect(edgeCount(s)).toBe(0);
  });

  it('should add edge', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'b');
    expect(edgeCount(s)).toBe(1);
  });

  it('should not add duplicate edge', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'b');
    s = addCausalEdge(s, 'a', 'b');
    expect(edgeCount(s)).toBe(1);
  });

  it('should check causally before', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'b');
    expect(isCausallyBefore(s, 'a', 'b')).toBe(true);
  });

  it('should not be causally before itself', () => {
    const s = createCausalTrackerState();
    expect(isCausallyBefore(s, 'a', 'a')).toBe(false);
  });

  it('should not be causally before for non-edge', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'b');
    expect(isCausallyBefore(s, 'b', 'a')).toBe(false);
  });

  it('should get before set', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'c');
    s = addCausalEdge(s, 'b', 'c');
    expect(causallyBeforeSet(s, 'c').size).toBe(2);
  });

  it('should get after set', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'b');
    s = addCausalEdge(s, 'a', 'c');
    expect(causallyAfterSet(s, 'a').size).toBe(2);
  });

  it('should find direct children', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'b');
    s = addCausalEdge(s, 'a', 'c');
    expect(directChildren(s, 'a')).toHaveLength(2);
  });

  it('should find direct parents', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'c');
    s = addCausalEdge(s, 'b', 'c');
    expect(directParents(s, 'c')).toHaveLength(2);
  });

  it('should compute health', () => {
    let s = createCausalTrackerState();
    s = addCausalEdge(s, 'a', 'b');
    const h = causalTrackerHealth(s);
    expect(h.health).toBe(1);
  });
});
