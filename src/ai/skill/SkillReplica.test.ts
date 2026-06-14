import { describe, it, expect } from 'vitest';
import { createSkillReplicaState, setSkillPrimary, addSkillReplica, recordSkillSync, setSkillReplicaOnline, onlineSkillReplicas, skillReplicaHealth } from './SkillReplica';

describe('V2305 SkillReplica', () => {
  it('should create empty state', () => {
    const s = createSkillReplicaState();
    expect(s.primaryRegion).toBe(null);
  });

  it('should set primary', () => {
    const s = setSkillPrimary(createSkillReplicaState(), 'us-east');
    expect(s.primaryRegion).toBe('us-east');
  });

  it('should add replica', () => {
    let s = createSkillReplicaState();
    s = addSkillReplica(s, 'eu-west');
    expect(s.replicas.size).toBe(1);
  });

  it('should record sync', () => {
    let s = createSkillReplicaState();
    s = addSkillReplica(s, 'eu-west');
    s = recordSkillSync(s, 'eu-west', 50);
    expect(s.replicas.get('eu-west')?.lag).toBe(50);
  });

  it('should toggle online', () => {
    let s = createSkillReplicaState();
    s = addSkillReplica(s, 'eu-west');
    s = setSkillReplicaOnline(s, 'eu-west', false);
    expect(onlineSkillReplicas(s)).toHaveLength(0);
  });

  it('should compute health', () => {
    let s = createSkillReplicaState();
    s = addSkillReplica(s, 'a');
    s = recordSkillSync(s, 'a', 50);
    const h = skillReplicaHealth(s);
    expect(h.health).toBe(1);
  });
});
