import { describe, it, expect } from 'vitest';
import { createOpConsensusState, proposeOp, openOpVoting, voteOp, tallyOpConsensus, opConsensusHealth } from './OpConsensus';

describe('V2228 OpConsensus', () => {
  it('should create empty state', () => {
    const s = createOpConsensusState();
    expect(s.proposals.size).toBe(0);
  });

  it('should propose', () => {
    let s = createOpConsensusState();
    s = proposeOp(s, 'p1', 'op1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should not duplicate', () => {
    let s = createOpConsensusState();
    s = proposeOp(s, 'p1', 'op1', 'alice');
    s = proposeOp(s, 'p1', 'op1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should open voting', () => {
    let s = createOpConsensusState();
    s = proposeOp(s, 'p1', 'op1', 'alice');
    s = openOpVoting(s, 'p1');
    expect(s.proposals.get('p1')?.state).toBe('voting');
  });

  it('should vote', () => {
    let s = createOpConsensusState();
    s = proposeOp(s, 'p1', 'op1', 'alice');
    s = openOpVoting(s, 'p1');
    s = voteOp(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.get('bob')).toBe(true);
  });

  it('should not vote on non-voting', () => {
    let s = createOpConsensusState();
    s = proposeOp(s, 'p1', 'op1', 'alice');
    s = voteOp(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.size).toBe(0);
  });

  it('should commit on majority', () => {
    let s = createOpConsensusState(2);
    s = proposeOp(s, 'p1', 'op1', 'alice');
    s = openOpVoting(s, 'p1');
    s = voteOp(s, 'p1', 'a', true);
    s = voteOp(s, 'p1', 'b', true);
    s = tallyOpConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.state).toBe('committed');
  });

  it('should reject on majority no', () => {
    let s = createOpConsensusState(2);
    s = proposeOp(s, 'p1', 'op1', 'alice');
    s = openOpVoting(s, 'p1');
    s = voteOp(s, 'p1', 'a', false);
    s = voteOp(s, 'p1', 'b', false);
    s = tallyOpConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.state).toBe('rejected');
  });

  it('should compute health', () => {
    let s = createOpConsensusState();
    s = proposeOp(s, 'p1', 'op1', 'alice');
    const h = opConsensusHealth(s);
    expect(h.health).toBe(1);
  });
});
