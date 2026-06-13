import { describe, it, expect } from 'vitest';
import {
  createSchemaDiff,
  diffSchemas,
  applyDiff,
  isEmptySchema,
  sortedFieldNames,
  breakingChangeCount,
  schemaHealth,
} from './SchemaDiffer';

describe('V2119 SchemaDiffer', () => {
  it('should create empty diff', () => {
    const d = createSchemaDiff('t');
    expect(d.addedCount).toBe(0);
    expect(d.isCompatible).toBe(true);
  });

  it('should detect added fields', () => {
    const a = { tableName: 't', fields: { x: 'int' }, version: 1 };
    const b = { tableName: 't', fields: { x: 'int', y: 'str' }, version: 2 };
    const d = diffSchemas(a, b);
    expect(d.addedCount).toBe(1);
    expect(d.isCompatible).toBe(true);
  });

  it('should detect removed fields and mark incompatible', () => {
    const a = { tableName: 't', fields: { x: 'int', y: 'str' }, version: 1 };
    const b = { tableName: 't', fields: { x: 'int' }, version: 2 };
    const d = diffSchemas(a, b);
    expect(d.removedCount).toBe(1);
    expect(d.isCompatible).toBe(false);
  });

  it('should detect type changes and mark incompatible', () => {
    const a = { tableName: 't', fields: { x: 'int' }, version: 1 };
    const b = { tableName: 't', fields: { x: 'str' }, version: 2 };
    const d = diffSchemas(a, b);
    expect(d.typeChangedCount).toBe(1);
    expect(d.isCompatible).toBe(false);
  });

  it('should apply diff forward (add and remove)', () => {
    const a = { tableName: 't', fields: { x: 'int', y: 'str' }, version: 1 };
    const b = { tableName: 't', fields: { x: 'int', z: 'bool' }, version: 2 };
    const d = diffSchemas(a, b);
    const applied = applyDiff(a, d);
    expect(applied.fields).toEqual({ x: 'int', z: 'bool' });
    expect(applied.version).toBe(2);
  });

  it('should report empty schema', () => {
    const s = { tableName: 't', fields: {}, version: 1 };
    expect(isEmptySchema(s)).toBe(true);
  });

  it('should sort field names alphabetically', () => {
    const s = { tableName: 't', fields: { z: 'int', a: 'str', m: 'bool' }, version: 1 };
    expect(sortedFieldNames(s)).toEqual(['a', 'm', 'z']);
  });

  it('should count breaking changes', () => {
    const a = { tableName: 't', fields: { x: 'int', y: 'str' }, version: 1 };
    const b = { tableName: 't', fields: { x: 'str' }, version: 2 };
    const d = diffSchemas(a, b);
    expect(breakingChangeCount(d)).toBe(2);
  });

  it('should compute schema health metric', () => {
    const s = { tableName: 't', fields: { a: 'int', b: 'str' }, version: 1 };
    const h = schemaHealth(s);
    expect(h.fieldCount).toBe(2);
    expect(h.version).toBe(1);
    expect(h.health).toBeGreaterThan(0);
  });
});
