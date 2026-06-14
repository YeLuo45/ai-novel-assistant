import { describe, it, expect } from 'vitest';
import { createMemoryConsensusState, propose, openVoting, vote, tallyConsensus, getProposal, memoryConsensusHealth } from './MemoryConsensus';

describe('V2168 MemoryConsensus', () => {
  it('should create empty state', () => {
    const s = createMemoryConsensusState();
    expect(s.proposals.size).toBe(0);
  });

  it('should propose', () => {
    let s = createMemoryConsensusState();
    s = propose(s, 'p1', 'm1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should not duplicate proposal', () => {
    let s = createMemoryConsensusState();
    s = propose(s, 'p1', 'm1', 'alice');
    s = propose(s, 'p1', 'm1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should open voting', () => {
    let s = createMemoryConsensusState();
    s = propose(s, 'p1', 'm1', 'alice');
    s = openVoting(s, 'p1');
    expect(getProposal(s, 'p1')?.state).toBe('voting');
  });

  it('should record votes', () => {
    let s = createMemoryConsensusState();
    s = propose(s, 'p1', 'm1', 'alice');
    s = openVoting(s, 'p1');
    s = vote(s, 'p1', 'bob', true);
    expect(getProposal(s, 'p1')?.votes.get('bob')).toBe(true);
  });

  it('should not vote on non-voting proposal', () => {
    let s = createMemoryConsensusState();
    s = propose(s, 'p1', 'm1', 'alice');
    s = vote(s, 'p1', 'bob', true);
    expect(getProposal(s, 'p1')?.votes.size).toBe(0);
  });

  it('should commit on majority', () => {
    let s = createMemoryConsensusState(2);
    s = propose(s, 'p1', 'm1', 'alice');
    s = openVoting(s, 'p1');
    s = vote(s, 'p1', 'a', true);
    s = vote(s, 'p1', 'b', true);
    s = tallyConsensus(s, 'p1');
    expect(getProposal(s, 'p1')?.state).toBe('committed');
  });

  it('should reject on majority no', () => {
    let s = createMemoryConsensusState(2);
    s = propose(s, 'p1', 'm1', 'alice');
    s = openVoting(s, 'p1');
    s = vote(s, 'p1', 'a', false);
    s = vote(s, 'p1', 'b', false);
    s = tallyConsensus(s, 'p1');
    expect(getProposal(s, 'p1')?.state).toBe('rejected');
  });

  it('should compute health', () => {
    let s = createMemoryConsensusState();
    s = propose(s, 'p1', 'm1', 'alice');
    const h = memoryConsensusHealth(s);
    expect(h.health).toBe(1);
  });
});
