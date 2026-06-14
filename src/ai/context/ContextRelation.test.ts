import { describe, it, expect } from 'vitest';
import { createContextRelationState, addContextRelation, relationsFrom, relationsTo, relationsByKind, contextRelationHealth } from './ContextRelation';

describe('V2272 ContextRelation', () => {
  it('should create empty state', () => {
    const s = createContextRelationState();
    expect(s.edges).toEqual([]);
  });

  it('should add relation', () => {
    let s = createContextRelationState();
    s = addContextRelation(s, 'a', 'b', 'cites');
    expect(s.edges).toHaveLength(1);
  });

  it('should not duplicate', () => {
    let s = createContextRelationState();
    s = addContextRelation(s, 'a', 'b', 'cites');
    s = addContextRelation(s, 'a', 'b', 'cites');
    expect(s.edges).toHaveLength(1);
  });

  it('should query from', () => {
    let s = createContextRelationState();
    s = addContextRelation(s, 'a', 'b', 'cites');
    s = addContextRelation(s, 'a', 'c', 'derives');
    expect(relationsFrom(s, 'a')).toHaveLength(2);
  });

  it('should query to', () => {
    let s = createContextRelationState();
    s = addContextRelation(s, 'a', 'b', 'cites');
    s = addContextRelation(s, 'c', 'b', 'cites');
    expect(relationsTo(s, 'b')).toHaveLength(2);
  });

  it('should query by kind', () => {
    let s = createContextRelationState();
    s = addContextRelation(s, 'a', 'b', 'cites');
    s = addContextRelation(s, 'a', 'c', 'derives');
    expect(relationsByKind(s, 'cites')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createContextRelationState();
    s = addContextRelation(s, 'a', 'b', 'cites');
    const h = contextRelationHealth(s);
    expect(h.health).toBe(1);
  });
});
