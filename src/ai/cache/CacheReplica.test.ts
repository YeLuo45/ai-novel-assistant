import { describe, it, expect } from 'vitest';
import { createCacheReplicaState, setCachePrimary, addCacheReplica, recordCacheSync, setCacheReplicaOnline, onlineCacheReplicas, cacheReplicaHealth } from './CacheReplica';

describe('V2245 CacheReplica', () => {
  it('should create empty state', () => {
    const s = createCacheReplicaState();
    expect(s.primaryRegion).toBe(null);
  });

  it('should set primary', () => {
    const s = setCachePrimary(createCacheReplicaState(), 'us-east');
    expect(s.primaryRegion).toBe('us-east');
  });

  it('should add replica', () => {
    let s = createCacheReplicaState();
    s = addCacheReplica(s, 'eu-west');
    expect(s.replicas.size).toBe(1);
  });

  it('should record sync', () => {
    let s = createCacheReplicaState();
    s = addCacheReplica(s, 'eu-west');
    s = recordCacheSync(s, 'eu-west', 50);
    expect(s.replicas.get('eu-west')?.lag).toBe(50);
  });

  it('should toggle online', () => {
    let s = createCacheReplicaState();
    s = addCacheReplica(s, 'eu-west');
    s = setCacheReplicaOnline(s, 'eu-west', false);
    expect(onlineCacheReplicas(s)).toHaveLength(0);
  });

  it('should compute health', () => {
    let s = createCacheReplicaState();
    s = addCacheReplica(s, 'a');
    s = recordCacheSync(s, 'a', 50);
    const h = cacheReplicaHealth(s);
    expect(h.health).toBe(1);
  });
});
