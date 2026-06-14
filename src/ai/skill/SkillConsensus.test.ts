import { describe, it, expect } from 'vitest';
import { createSkillConsensusState, proposeSkill, openSkillVoting, voteSkill, tallySkillConsensus, skillConsensusHealth } from './SkillConsensus';

describe('V2318 SkillConsensus', () => {
  it('should create empty state', () => {
    const s = createSkillConsensusState();
    expect(s.proposals.size).toBe(0);
  });

  it('should propose', () => {
    let s = createSkillConsensusState();
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should not duplicate', () => {
    let s = createSkillConsensusState();
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    expect(s.proposals.size).toBe(1);
  });

  it('should open voting', () => {
    let s = createSkillConsensusState();
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    s = openSkillVoting(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('voting');
  });

  it('should vote', () => {
    let s = createSkillConsensusState();
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    s = openSkillVoting(s, 'p1');
    s = voteSkill(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.get('bob')).toBe(true);
  });

  it('should not vote on non-voting', () => {
    let s = createSkillConsensusState();
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    s = voteSkill(s, 'p1', 'bob', true);
    expect(s.proposals.get('p1')?.votes.size).toBe(0);
  });

  it('should commit on majority', () => {
    let s = createSkillConsensusState(2);
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    s = openSkillVoting(s, 'p1');
    s = voteSkill(s, 'p1', 'a', true);
    s = voteSkill(s, 'p1', 'b', true);
    s = tallySkillConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('committed');
  });

  it('should reject on majority no', () => {
    let s = createSkillConsensusState(2);
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    s = openSkillVoting(s, 'p1');
    s = voteSkill(s, 'p1', 'a', false);
    s = voteSkill(s, 'p1', 'b', false);
    s = tallySkillConsensus(s, 'p1');
    expect(s.proposals.get('p1')?.phase).toBe('rejected');
  });

  it('should compute health', () => {
    let s = createSkillConsensusState();
    s = proposeSkill(s, 'p1', 'k1', 'alice');
    const h = skillConsensusHealth(s);
    expect(h.health).toBe(1);
  });
});
