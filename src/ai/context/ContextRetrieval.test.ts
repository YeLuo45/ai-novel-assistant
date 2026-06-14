import { describe, it, expect } from 'vitest';
import { createContextRetrievalState, indexVector, indexKeyword, indexGraphEdge, retrieveContext, contextRetrievalHealth } from './ContextRetrieval';

describe('V2268 ContextRetrieval', () => {
  it('should create empty state', () => {
    const s = createContextRetrievalState();
    expect(s.vectorIndex.size).toBe(0);
  });

  it('should index vector', () => {
    let s = createContextRetrievalState();
    s = indexVector(s, 'k1', [1, 0, 0]);
    expect(s.vectorIndex.size).toBe(1);
  });

  it('should index keyword', () => {
    let s = createContextRetrievalState();
    s = indexKeyword(s, 'k1', 'hello world');
    expect(s.keywordIndex.get('hello')?.has('k1')).toBe(true);
  });

  it('should index graph edge', () => {
    let s = createContextRetrievalState();
    s = indexGraphEdge(s, 'k1', 'k2');
    expect(s.graphEdges.get('k1')?.has('k2')).toBe(true);
  });

  it('should retrieve by vector', () => {
    let s = createContextRetrievalState();
    s = indexVector(s, 'k1', [1, 0, 0]);
    s = indexVector(s, 'k2', [0, 1, 0]);
    const hits = retrieveContext(s, { vector: [1, 0, 0] });
    expect(hits.length).toBeGreaterThan(0);
  });

  it('should retrieve by keyword', () => {
    let s = createContextRetrievalState();
    s = indexKeyword(s, 'k1', 'hello world');
    const hits = retrieveContext(s, { keywords: ['hello'] });
    expect(hits).toHaveLength(1);
  });

  it('should retrieve by graph', () => {
    let s = createContextRetrievalState();
    s = indexGraphEdge(s, 'k1', 'k2');
    const hits = retrieveContext(s, { graphKey: 'k1' });
    expect(hits).toHaveLength(1);
  });

  it('should combine signals', () => {
    let s = createContextRetrievalState();
    s = indexVector(s, 'k1', [1, 0, 0]);
    s = indexKeyword(s, 'k1', 'hello');
    s = indexGraphEdge(s, 'k1', 'k2');
    const hits = retrieveContext(s, { vector: [1, 0, 0], keywords: ['hello'], graphKey: 'k1' });
    expect(hits[0].matchedOn.length).toBeGreaterThan(1);
  });

  it('should compute health', () => {
    let s = createContextRetrievalState();
    s = indexVector(s, 'k1', [1, 0, 0]);
    const h = contextRetrievalHealth(s);
    expect(h.health).toBe(1);
  });
});
