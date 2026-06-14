import { describe, it, expect } from 'vitest';
import { createGraphReplicaState, setGraphPrimary, addGraphReplica, recordGraphSync, setGraphReplicaOnline, onlineGraphReplicas, graphReplicaHealth } from './GraphReplica';

describe('V2185 GraphReplica', () => {
  it('should create empty state', () => {
    const s = createGraphReplicaState();
    expect(s.primaryRegion).toBe(null);
  });

  it('should set primary', () => {
    const s = setGraphPrimary(createGraphReplicaState(), 'us-east');
    expect(s.primaryRegion).toBe('us-east');
  });

  it('should add replica', () => {
    let s = createGraphReplicaState();
    s = addGraphReplica(s, 'eu-west');
    expect(s.replicas.size).toBe(1);
  });

  it('should record sync', () => {
    let s = createGraphReplicaState();
    s = addGraphReplica(s, 'eu-west');
    s = recordGraphSync(s, 'eu-west', 50);
    expect(s.replicas.get('eu-west')?.lag).toBe(50);
  });

  it('should set online', () => {
    let s = createGraphReplicaState();
    s = addGraphReplica(s, 'eu-west');
    s = setGraphReplicaOnline(s, 'eu-west', false);
    expect(onlineGraphReplicas(s)).toHaveLength(0);
  });

  it('should compute health', () => {
    let s = createGraphReplicaState();
    s = addGraphReplica(s, 'a');
    s = recordGraphSync(s, 'a', 10);
    const h = graphReplicaHealth(s);
    expect(h.health).toBe(1);
  });
});
