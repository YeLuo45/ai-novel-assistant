import { describe, it, expect } from 'vitest';
import { createCacheConsensusState, proposeCache, openCacheVoting, voteCache, tallyCacheConsensus, cacheConsensusHealth } from './CacheConsensus';

describe('V2258 CacheConsensus', () => {
  it('should create empty state', () => {
    const s = createCacheConsensusState();
    expect(s.proposals.size).toBe(0);
  });

  it('should propose', () => {
    let s = createCacheConsensusState();
    s = proposeCache(s, 'p1', 'k1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should not duplicate', () => {
    let s = createCacheConsensusState();
    s = proposeCache(s, 'p1', 'k1', 'alice');
    s = proposeCache(s, 'p1', 'k1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should open voting', () => {
    let s = createCacheConsensusState();
    s = proposeCache(s, 'p1', 'k1', 'alice');
    s = openCacheVoting(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('voting');
  });

  it('should vote', () => {
    let s = createCacheConsensusState();
    s = proposeCache(s, 'p1', 'k1', 'alice');
    s = openCacheVoting(s, 'p1');
    s = voteCache(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.get('bob')).toBe(true);
  });

  it('should not vote on non-voting', () => {
    let s = createCacheConsensusState();
    s = proposeCache(s, 'p1', 'k1', 'alice');
    s = voteCache(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.size).toBe(0);
  });

  it('should commit on majority', () => {
    let s = createCacheConsensusState(2);
    s = proposeCache(s, 'p1', 'k1', 'alice');
    s = openCacheVoting(s, 'p1');
    s = voteCache(s, 'p1', 'a', true);
    s = voteCache(s, 'p1', 'b', true);
    s = tallyCacheConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('committed');
  });

  it('should reject on majority no', () => {
    let s = createCacheConsensusState(2);
    s = proposeCache(s, 'p1', 'k1', 'alice');
    s = openCacheVoting(s, 'p1');
    s = voteCache(s, 'p1', 'a', false);
    s = voteCache(s, 'p1', 'b', false);
    s = tallyCacheConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('rejected');
  });

  it('should compute health', () => {
    let s = createCacheConsensusState();
    s = proposeCache(s, 'p1', 'k1', 'alice');
    const h = cacheConsensusHealth(s);
    expect(h.health).toBe(1);
  });
});
