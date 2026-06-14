import { describe, it, expect } from 'vitest';
import { createGraphAdapterState, toGraphJSON, toCypher, toRDF, toGraphML, toJSONLD, adaptGraphFormat, graphAdapterHealth } from './GraphAdapter';

describe('V2204 GraphAdapter', () => {
  it('should create empty state', () => {
    const s = createGraphAdapterState();
    expect(s.formatCounts.json).toBe(0);
  });

  it('should convert to JSON', () => {
    const r = toGraphJSON(['a', 'b'], [{ from: 'a', to: 'b' }]);
    expect(r.kind).toBe('json');
    expect(r.nodeCount).toBe(2);
  });

  it('should convert to Cypher', () => {
    const r = toCypher(['a'], [{ from: 'a', to: 'b' }]);
    expect(r.kind).toBe('cypher');
    expect(r.content).toContain('CREATE');
  });

  it('should convert to RDF', () => {
    const r = toRDF(['a'], [{ from: 'a', to: 'b' }]);
    expect(r.kind).toBe('rdf');
    expect(r.content).toContain('@prefix');
  });

  it('should convert to GraphML', () => {
    const r = toGraphML(['a'], [{ from: 'a', to: 'b' }]);
    expect(r.kind).toBe('graphml');
    expect(r.content).toContain('<graphml>');
  });

  it('should convert to JSON-LD', () => {
    const r = toJSONLD(['a'], [{ from: 'a', to: 'b' }]);
    expect(r.kind).toBe('jsonld');
    expect(r.content).toContain('@type');
  });

  it('should adapt and count', () => {
    let s = createGraphAdapterState();
    s = adaptGraphFormat(s, 'json');
    s = adaptGraphFormat(s, 'json');
    expect(s.formatCounts.json).toBe(2);
  });

  it('should compute health', () => {
    let s = createGraphAdapterState();
    s = adaptGraphFormat(s, 'json');
    const h = graphAdapterHealth(s);
    expect(h.health).toBe(1);
  });
});
