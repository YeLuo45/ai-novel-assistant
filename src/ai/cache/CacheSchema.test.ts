import { describe, it, expect } from 'vitest';
import { createCacheSchemaState, addCacheSchema, validateCacheEntry, cacheSchemaHealth } from './CacheSchema';

describe('V2241 CacheSchema', () => {
  it('should create empty state', () => {
    const s = createCacheSchemaState();
    expect(s.schemas.size).toBe(0);
  });

  it('should add schema', () => {
    let s = createCacheSchemaState();
    s = addCacheSchema(s, { name: 'user', fields: [{ name: 'id', kind: 'string', required: true }], version: 1 });
    expect(s.schemas.size).toBe(1);
  });

  it('should validate valid entry', () => {
    let s = createCacheSchemaState();
    s = addCacheSchema(s, { name: 'user', fields: [{ name: 'id', kind: 'string', required: true }], version: 1 });
    const r = validateCacheEntry(s, 'user', { id: 'u1' });
    expect(r.valid).toBe(true);
  });

  it('should detect missing field', () => {
    let s = createCacheSchemaState();
    s = addCacheSchema(s, { name: 'user', fields: [{ name: 'id', kind: 'string', required: true }], version: 1 });
    const r = validateCacheEntry(s, 'user', {});
    expect(r.valid).toBe(false);
  });

  it('should reject unknown schema', () => {
    const s = createCacheSchemaState();
    const r = validateCacheEntry(s, 'unknown', {});
    expect(r.valid).toBe(false);
  });

  it('should compute health', () => {
    let s = createCacheSchemaState();
    s = addCacheSchema(s, { name: 'user', fields: [], version: 1 });
    const h = cacheSchemaHealth(s);
    expect(h.health).toBe(1);
  });
});
