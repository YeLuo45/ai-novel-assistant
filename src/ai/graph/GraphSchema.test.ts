import { describe, it, expect } from 'vitest';
import { createGraphSchemaState, addNodeSchema, addEdgeSchema, validateNodeSchema, validateEdgeSchema, graphSchemaHealth } from './GraphSchema';

describe('V2180 GraphSchema', () => {
  it('should create empty state', () => {
    const s = createGraphSchemaState();
    expect(s.nodes.size).toBe(0);
  });

  it('should add node schema', () => {
    let s = createGraphSchemaState();
    s = addNodeSchema(s, { label: 'Person', requiredProps: [{ name: 'name', kind: 'string' }] });
    expect(s.nodes.size).toBe(1);
  });

  it('should add edge schema', () => {
    let s = createGraphSchemaState();
    s = addEdgeSchema(s, { edgeLabel: 'knows', fromLabel: 'Person', toLabel: 'Person' });
    expect(s.edges.size).toBe(1);
  });

  it('should validate valid node', () => {
    let s = createGraphSchemaState();
    s = addNodeSchema(s, { label: 'Person', requiredProps: [{ name: 'name', kind: 'string' }] });
    const r = validateNodeSchema(s, 'Person', { name: 'Alice' });
    expect(r.valid).toBe(true);
  });

  it('should detect missing prop', () => {
    let s = createGraphSchemaState();
    s = addNodeSchema(s, { label: 'Person', requiredProps: [{ name: 'name', kind: 'string' }] });
    const r = validateNodeSchema(s, 'Person', {});
    expect(r.valid).toBe(false);
  });

  it('should detect type mismatch', () => {
    let s = createGraphSchemaState();
    s = addNodeSchema(s, { label: 'Person', requiredProps: [{ name: 'age', kind: 'number' }] });
    const r = validateNodeSchema(s, 'Person', { age: 'old' });
    expect(r.valid).toBe(false);
  });

  it('should reject unknown label', () => {
    const s = createGraphSchemaState();
    const r = validateNodeSchema(s, 'Unknown', {});
    expect(r.valid).toBe(false);
  });

  it('should validate valid edge', () => {
    let s = createGraphSchemaState();
    s = addEdgeSchema(s, { edgeLabel: 'knows', fromLabel: 'Person', toLabel: 'Person' });
    const r = validateEdgeSchema(s, 'knows', 'Person', 'Person');
    expect(r.valid).toBe(true);
  });

  it('should reject wrong edge endpoints', () => {
    let s = createGraphSchemaState();
    s = addEdgeSchema(s, { edgeLabel: 'works_at', fromLabel: 'Person', toLabel: 'Company' });
    const r = validateEdgeSchema(s, 'works_at', 'Person', 'Animal');
    expect(r.valid).toBe(false);
  });

  it('should compute health', () => {
    let s = createGraphSchemaState();
    s = addNodeSchema(s, { label: 'Person', requiredProps: [] });
    const h = graphSchemaHealth(s);
    expect(h.health).toBe(1);
  });
});
