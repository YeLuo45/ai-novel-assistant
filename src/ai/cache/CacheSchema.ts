// V2241 CacheSchema - Direction I Iter 6/30
// Cache entry schema validation
// Source: thunderbolt
export type FieldKind = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface CacheFieldSpec {
  name: string;
  kind: FieldKind;
  required: boolean;
}

export interface CacheSchema {
  name: string;
  fields: CacheFieldSpec[];
  version: number;
}

export interface CacheSchemaState {
  schemas: Map<string, CacheSchema>;
}

export function createCacheSchemaState(): CacheSchemaState {
  return { schemas: new Map() };
}

export function addCacheSchema(state: CacheSchemaState, schema: CacheSchema): CacheSchemaState {
  const schemas = new Map(state.schemas);
  schemas.set(schema.name, schema);
  return { ...state, schemas };
}

export function validateCacheEntry(state: CacheSchemaState, schemaName: string, entry: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const schema = state.schemas.get(schemaName);
  if (!schema) return { valid: false, errors: [`unknown schema: ${schemaName}`] };
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (field.required && !(field.name in entry)) {
      errors.push(`missing required field: ${field.name}`);
      continue;
    }
    if (field.name in entry) {
      const actual = fieldKind(entry[field.name]);
      if (actual !== field.kind) errors.push(`field ${field.name} expected ${field.kind} got ${actual}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

function fieldKind(v: unknown): FieldKind {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'object';
  return typeof v as FieldKind;
}

export function cacheSchemaHealth(state: CacheSchemaState): { schemas: number; health: number } {
  return { schemas: state.schemas.size, health: state.schemas.size > 0 ? 1 : 0.5 };
}
