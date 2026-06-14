import { describe, it, expect } from 'vitest';
import { createContextReplicaState, setContextPrimary, addContextReplica, recordContextSync, setContextReplicaOnline, onlineContextReplicas, contextReplicaHealth } from './ContextReplica';

describe('V2275 ContextReplica', () => {
  it('should create empty state', () => {
    const s = createContextReplicaState();
    expect(s.primaryRegion).toBe(null);
  });

  it('should set primary', () => {
    const s = setContextPrimary(createContextReplicaState(), 'us-east');
    expect(s.primaryRegion).toBe('us-east');
  });

  it('should add replica', () => {
    let s = createContextReplicaState();
    s = addContextReplica(s, 'eu-west');
    expect(s.replicas.size).toBe(1);
  });

  it('should record sync', () => {
    let s = createContextReplicaState();
    s = addContextReplica(s, 'eu-west');
    s = recordContextSync(s, 'eu-west', 50);
    expect(s.replicas.get('eu-west')?.lag).toBe(50);
  });

  it('should toggle online', () => {
    let s = createContextReplicaState();
    s = addContextReplica(s, 'eu-west');
    s = setContextReplicaOnline(s, 'eu-west', false);
    expect(onlineContextReplicas(s)).toHaveLength(0);
  });

  it('should compute health', () => {
    let s = createContextReplicaState();
    s = addContextReplica(s, 'a');
    s = recordContextSync(s, 'a', 50);
    const h = contextReplicaHealth(s);
    expect(h.health).toBe(1);
  });
});
