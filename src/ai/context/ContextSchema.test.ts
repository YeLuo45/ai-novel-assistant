import { describe, it, expect } from 'vitest';
import { createContextSchemaState, addContextSchema, validateContextEntry, contextSchemaHealth } from './ContextSchema';

describe('V2270 ContextSchema', () => {
  it('should create empty state', () => {
    const s = createContextSchemaState();
    expect(s.schemas.size).toBe(0);
  });

  it('should add schema', () => {
    let s = createContextSchemaState();
    s = addContextSchema(s, { name: 'ctx', fields: [{ name: 'role', kind: 'string', required: true }], version: 1 });
    expect(s.schemas.size).toBe(1);
  });

  it('should validate valid entry', () => {
    let s = createContextSchemaState();
    s = addContextSchema(s, { name: 'ctx', fields: [{ name: 'role', kind: 'string', required: true }], version: 1 });
    expect(validateContextEntry(s, 'ctx', { role: 'user' }).valid).toBe(true);
  });

  it('should detect missing field', () => {
    let s = createContextSchemaState();
    s = addContextSchema(s, { name: 'ctx', fields: [{ name: 'role', kind: 'string', required: true }], version: 1 });
    expect(validateContextEntry(s, 'ctx', {}).valid).toBe(false);
  });

  it('should reject unknown schema', () => {
    const s = createContextSchemaState();
    expect(validateContextEntry(s, 'unknown', {}).valid).toBe(false);
  });

  it('should detect embedding field', () => {
    let s = createContextSchemaState();
    s = addContextSchema(s, { name: 'ctx', fields: [{ name: 'emb', kind: 'embedding', required: true }], version: 1 });
    expect(validateContextEntry(s, 'ctx', { emb: [0.1, 0.2] }).valid).toBe(true);
  });

  it('should compute health', () => {
    let s = createContextSchemaState();
    s = addContextSchema(s, { name: 'ctx', fields: [], version: 1 });
    const h = contextSchemaHealth(s);
    expect(h.health).toBe(1);
  });
});
