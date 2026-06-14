import { describe, it, expect } from 'vitest';
import { createSchema, validate, addField, removeField, requiredFields, optionalFields, schemaHealth } from './MemorySchema';

describe('V2150 MemorySchema', () => {
  it('should create schema', () => {
    const s = createSchema('user', [{ name: 'id', kind: 'string', required: true }]);
    expect(s.version).toBe(1);
  });

  it('should validate correct data', () => {
    const s = createSchema('user', [{ name: 'id', kind: 'string', required: true }, { name: 'age', kind: 'number', required: true }]);
    const r = validate(s, { id: 'u1', age: 30 });
    expect(r.valid).toBe(true);
  });

  it('should report missing required field', () => {
    const s = createSchema('user', [{ name: 'id', kind: 'string', required: true }]);
    const r = validate(s, {});
    expect(r.valid).toBe(false);
  });

  it('should report type mismatch', () => {
    const s = createSchema('user', [{ name: 'age', kind: 'number', required: false }]);
    const r = validate(s, { age: 'old' });
    expect(r.valid).toBe(false);
  });

  it('should add field', () => {
    let s = createSchema('user', []);
    s = addField(s, { name: 'name', kind: 'string', required: false });
    expect(s.fields).toHaveLength(1);
  });

  it('should not add duplicate field', () => {
    let s = createSchema('user', [{ name: 'id', kind: 'string', required: true }]);
    s = addField(s, { name: 'id', kind: 'number', required: true });
    expect(s.fields).toHaveLength(1);
  });

  it('should remove field', () => {
    let s = createSchema('user', [{ name: 'a', kind: 'string', required: true }, { name: 'b', kind: 'string', required: true }]);
    s = removeField(s, 'a');
    expect(s.fields).toHaveLength(1);
  });

  it('should list required and optional fields', () => {
    const s = createSchema('user', [
      { name: 'a', kind: 'string', required: true },
      { name: 'b', kind: 'string', required: false },
    ]);
    expect(requiredFields(s)).toEqual(['a']);
    expect(optionalFields(s)).toEqual(['b']);
  });

  it('should compute health', () => {
    const s = createSchema('user', [{ name: 'a', kind: 'string', required: true }]);
    const h = schemaHealth(s);
    expect(h.fields).toBe(1);
    expect(h.health).toBe(1);
  });
});
