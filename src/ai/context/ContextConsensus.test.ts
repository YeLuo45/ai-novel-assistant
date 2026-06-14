import { describe, it, expect } from 'vitest';
import { createContextConsensusState, proposeContext, openContextVoting, voteContext, tallyContextConsensus, contextConsensusHealth } from './ContextConsensus';

describe('V2288 ContextConsensus', () => {
  it('should create empty state', () => {
    const s = createContextConsensusState();
    expect(s.proposals.size).toBe(0);
  });

  it('should propose', () => {
    let s = createContextConsensusState();
    s = proposeContext(s, 'p1', 'k1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should not duplicate', () => {
    let s = createContextConsensusState();
    s = proposeContext(s, 'p1', 'k1', 'alice');
    s = proposeContext(s, 'p1', 'k1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should open voting', () => {
    let s = createContextConsensusState();
    s = proposeContext(s, 'p1', 'k1', 'alice');
    s = openContextVoting(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('voting');
  });

  it('should vote', () => {
    let s = createContextConsensusState();
    s = proposeContext(s, 'p1', 'k1', 'alice');
    s = openContextVoting(s, 'p1');
    s = voteContext(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.get('bob')).toBe(true);
  });

  it('should not vote on non-voting', () => {
    let s = createContextConsensusState();
    s = proposeContext(s, 'p1', 'k1', 'alice');
    s = voteContext(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.size).toBe(0);
  });

  it('should commit on majority', () => {
    let s = createContextConsensusState(2);
    s = proposeContext(s, 'p1', 'k1', 'alice');
    s = openContextVoting(s, 'p1');
    s = voteContext(s, 'p1', 'a', true);
    s = voteContext(s, 'p1', 'b', true);
    s = tallyContextConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('committed');
  });

  it('should reject on majority no', () => {
    let s = createContextConsensusState(2);
    s = proposeContext(s, 'p1', 'k1', 'alice');
    s = openContextVoting(s, 'p1');
    s = voteContext(s, 'p1', 'a', false);
    s = voteContext(s, 'p1', 'b', false);
    s = tallyContextConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('rejected');
  });

  it('should compute health', () => {
    let s = createContextConsensusState();
    s = proposeContext(s, 'p1', 'k1', 'alice');
    const h = contextConsensusHealth(s);
    expect(h.health).toBe(1);
  });
});
