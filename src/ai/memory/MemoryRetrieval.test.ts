import { describe, it, expect } from 'vitest';
import { createRetrievalState, indexDocument, retrieve, docCount, retrievalHealth } from './MemoryRetrieval';

describe('V2148 MemoryRetrieval', () => {
  it('should create empty retrieval state', () => {
    const s = createRetrievalState();
    expect(docCount(s)).toBe(0);
  });

  it('should index document', () => {
    let s = createRetrievalState();
    s = indexDocument(s, 'd1', 'hello world');
    expect(docCount(s)).toBe(1);
  });

  it('should retrieve by keyword', () => {
    let s = createRetrievalState();
    s = indexDocument(s, 'd1', 'The quick brown fox');
    const r = retrieve(s, 'fox');
    expect(r.results.length).toBe(1);
  });

  it('should retrieve by vector similarity', () => {
    let s = createRetrievalState();
    s = indexDocument(s, 'd1', 'foo bar');
    s = indexDocument(s, 'd2', 'different content here');
    const r = retrieve(s, 'foo');
    expect(r.results.length).toBeGreaterThan(0);
  });

  it('should return empty for no match', () => {
    let s = createRetrievalState();
    s = indexDocument(s, 'd1', 'a b c');
    const r = retrieve(s, 'xyzzzz');
    expect(r.results).toEqual([]);
  });

  it('should limit to topK', () => {
    let s = createRetrievalState();
    for (let i = 0; i < 20; i++) s = indexDocument(s, `d${i}`, `document ${i}`);
    const r = retrieve(s, 'document', 3);
    expect(r.results.length).toBeLessThanOrEqual(3);
  });

  it('should increment query count', () => {
    let s = createRetrievalState();
    s = indexDocument(s, 'd1', 'foo');
    s = retrieve(s, 'foo');
    s = retrieve(s, 'bar');
    expect(s.queryCount).toBe(2);
  });

  it('should compute health', () => {
    const s = createRetrievalState();
    const h = retrievalHealth(s);
    expect(h.health).toBe(0.5);
  });
});
