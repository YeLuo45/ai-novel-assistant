import { describe, it, expect } from 'vitest';
import { createMemoryReplicaState, setPrimary, addReplica, recordSync, setReplicaOnline, onlineReplicas, maxLag, replicaHealth } from './MemoryReplica';

describe('V2156 MemoryReplica', () => {
  it('should create empty state', () => {
    const s = createMemoryReplicaState();
    expect(s.primaryRegion).toBe(null);
  });

  it('should set primary', () => {
    const s = setPrimary(createMemoryReplicaState(), 'us-east');
    expect(s.primaryRegion).toBe('us-east');
  });

  it('should add replica', () => {
    let s = createMemoryReplicaState();
    s = addReplica(s, 'eu-west');
    expect(s.replicas.size).toBe(1);
  });

  it('should not add duplicate replica', () => {
    let s = createMemoryReplicaState();
    s = addReplica(s, 'eu-west');
    s = addReplica(s, 'eu-west');
    expect(s.replicas.size).toBe(1);
  });

  it('should record sync and increment counter', () => {
    let s = createMemoryReplicaState();
    s = addReplica(s, 'eu-west');
    s = recordSync(s, 'eu-west', 50);
    expect(s.totalReplications).toBe(1);
    expect(s.replicas.get('eu-west')?.lag).toBe(50);
  });

  it('should toggle online', () => {
    let s = createMemoryReplicaState();
    s = addReplica(s, 'eu-west');
    s = setReplicaOnline(s, 'eu-west', false);
    expect(onlineReplicas(s)).toHaveLength(0);
  });

  it('should compute max lag', () => {
    let s = createMemoryReplicaState();
    s = addReplica(s, 'a');
    s = addReplica(s, 'b');
    s = recordSync(s, 'a', 100);
    s = recordSync(s, 'b', 200);
    expect(maxLag(s)).toBe(200);
  });

  it('should compute health', () => {
    let s = createMemoryReplicaState();
    s = addReplica(s, 'a');
    s = recordSync(s, 'a', 50);
    const h = replicaHealth(s);
    expect(h.health).toBe(1);
  });
});
