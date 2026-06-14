// V2270 ContextSchema - Direction J Iter 5/30
// Context entry schema validation
// Source: thunderbolt
export type CtxFieldKind = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'embedding';

export interface CtxFieldSpec {
  name: string;
  kind: CtxFieldKind;
  required: boolean;
}

export interface CtxSchema {
  name: string;
  fields: CtxFieldSpec[];
  version: number;
}

export interface ContextSchemaState {
  schemas: Map<string, CtxSchema>;
}

export function createContextSchemaState(): ContextSchemaState {
  return { schemas: new Map() };
}

export function addContextSchema(state: ContextSchemaState, schema: CtxSchema): ContextSchemaState {
  const schemas = new Map(state.schemas);
  schemas.set(schema.name, schema);
  return { ...state, schemas };
}

export function validateContextEntry(state: ContextSchemaState, schemaName: string, entry: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const schema = state.schemas.get(schemaName);
  if (!schema) return { valid: false, errors: [`unknown schema: ${schemaName}`] };
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (field.required && !(field.name in entry)) { errors.push(`missing required field: ${field.name}`); continue; }
    if (field.name in entry) {
      const actual = fieldKind(entry[field.name]);
      if (actual !== field.kind) errors.push(`field ${field.name} expected ${field.kind} got ${actual}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

function fieldKind(v: unknown): CtxFieldKind {
  if (Array.isArray(v)) return v.every((x) => typeof x === 'number') ? 'embedding' : 'array';
  if (v === null) return 'object';
  return typeof v as CtxFieldKind;
}

export function contextSchemaHealth(state: ContextSchemaState): { schemas: number; health: number } {
  return { schemas: state.schemas.size, health: state.schemas.size > 0 ? 1 : 0.5 };
}
