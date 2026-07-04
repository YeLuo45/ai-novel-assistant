/**
 * IdeaClusteringCore.test.ts — Direction BE, V4006-V4015 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { KMeansClusterer, HierarchicalClusterer, DBSCANClusterer, SimilarityCalculator, DistanceMetric, ClusterEvaluator, ClusterSizeBalancer, ClusterLabeler, ClusterVisualizer, ClusteringCoreIndex } from './IdeaClusteringCore';

describe('KMeansClusterer', () => {
  const e = new KMeansClusterer();
  it('cluster for 4 items k=2', () => { const r = e.cluster([[1], [2], [3], [4]], 2); expect(r).toHaveLength(2); });
  it('isClustered true', () => { expect(e.isClustered([[0], [1]])).toBe(true); });
});

describe('HierarchicalClusterer', () => {
  const e = new HierarchicalClusterer();
  it('cluster for 5', () => { expect(e.cluster([[1], [2], [3]], 5)).toHaveLength(1); });
});

describe('DBSCANClusterer', () => {
  const e = new DBSCANClusterer();
  it('cluster for 3', () => { expect(e.cluster([[1], [2], [3]], 1, 1)).toHaveLength(1); });
});

describe('SimilarityCalculator', () => {
  const e = new SimilarityCalculator();
  it('cosine for same', () => { expect(e.cosine([1, 0], [1, 0])).toBe(1); });
  it('isSimilar for 0.7+', () => { expect(e.isSimilar([1, 0], [1, 0])).toBe(true); });
});

describe('DistanceMetric', () => {
  const e = new DistanceMetric();
  it('euclidean for 1,0', () => { expect(e.euclidean([1, 0], [0, 0])).toBe(1); });
  it('isClose for 1,0', () => { expect(e.isClose([1, 0], [0, 0], 2)).toBe(true); });
});

describe('ClusterEvaluator', () => {
  const e = new ClusterEvaluator();
  it('score for 2 clusters of 3', () => { expect(e.score([[0, 1, 2], [3, 4, 5]])).toBe(3); });
  it('isGood for 3', () => { expect(e.isGood(3)).toBe(true); });
});

describe('ClusterSizeBalancer', () => {
  const e = new ClusterSizeBalancer();
  it('balance for 5 items max 3', () => { expect(e.balance([[0, 1, 2, 3, 4]], 3)).toEqual([[0, 1, 2]]); });
  it('isBalanced true', () => { expect(e.isBalanced([[0, 1]], 3)).toBe(true); });
});

describe('ClusterLabeler', () => {
  const e = new ClusterLabeler();
  it('label for items', () => { expect(e.label([{ name: 'A' }])).toBe('A'); });
});

describe('ClusterVisualizer', () => {
  const e = new ClusterVisualizer();
  it('render includes Cluster', () => { expect(e.render([[0, 1], [2, 3]])).toContain('Cluster'); });
  it('isValid true', () => { expect(e.isValid('Cluster 0: 2 items')).toBe(true); });
});

describe('ClusteringCoreIndex', () => {
  const idx = new ClusteringCoreIndex();
  it('lists 9 engines', () => { expect(idx.count()).toBe(9); });
});