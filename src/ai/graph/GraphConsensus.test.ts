import { describe, it, expect } from 'vitest';
import { createGraphConsensusState, proposeGraph, openGraphVoting, voteGraph, tallyGraphConsensus, graphConsensusHealth } from './GraphConsensus';

describe('V2198 GraphConsensus', () => {
  it('should create empty state', () => {
    const s = createGraphConsensusState();
    expect(s.proposals.size).toBe(0);
  });

  it('should propose', () => {
    let s = createGraphConsensusState();
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should not duplicate proposal', () => {
    let s = createGraphConsensusState();
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should open voting', () => {
    let s = createGraphConsensusState();
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    s = openGraphVoting(s, 'p1');
    expect(s.proposals.get('p1')?.state).toBe('voting');
  });

  it('should record vote', () => {
    let s = createGraphConsensusState();
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    s = openGraphVoting(s, 'p1');
    s = voteGraph(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.get('bob')).toBe(true);
  });

  it('should not vote on non-voting', () => {
    let s = createGraphConsensusState();
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    s = voteGraph(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.size).toBe(0);
  });

  it('should commit on majority', () => {
    let s = createGraphConsensusState(2);
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    s = openGraphVoting(s, 'p1');
    s = voteGraph(s, 'p1', 'a', true);
    s = voteGraph(s, 'p1', 'b', true);
    s = tallyGraphConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.state).toBe('committed');
  });

  it('should reject on majority no', () => {
    let s = createGraphConsensusState(2);
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    s = openGraphVoting(s, 'p1');
    s = voteGraph(s, 'p1', 'a', false);
    s = voteGraph(s, 'p1', 'b', false);
    s = tallyGraphConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.state).toBe('rejected');
  });

  it('should compute health', () => {
    let s = createGraphConsensusState();
    s = proposeGraph(s, 'p1', 'g1', 'alice');
    const h = graphConsensusHealth(s);
    expect(h.health).toBe(1);
  });
});
