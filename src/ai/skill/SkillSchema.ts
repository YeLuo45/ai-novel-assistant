// V2300 SkillSchema - Direction K Iter 5/30
// Skill entry schema validation
// Source: thunderbolt
export type SkillFieldKind = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'markdown';

export interface SkillFieldSpec {
  name: string;
  kind: SkillFieldKind;
  required: boolean;
}

export interface SkillSchema {
  name: string;
  fields: SkillFieldSpec[];
  version: number;
}

export interface SkillSchemaState {
  schemas: Map<string, SkillSchema>;
}

export function createSkillSchemaState(): SkillSchemaState {
  return { schemas: new Map() };
}

export function addSkillSchema(state: SkillSchemaState, schema: SkillSchema): SkillSchemaState {
  const schemas = new Map(state.schemas);
  schemas.set(schema.name, schema);
  return { ...state, schemas };
}

export function validateSkillEntry(state: SkillSchemaState, schemaName: string, entry: Record<string, unknown>): { valid: boolean; errors: string[] } {
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

function fieldKind(v: unknown): SkillFieldKind {
  if (typeof v === 'string' && v.includes('#')) return 'markdown';
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'object';
  return typeof v as SkillFieldKind;
}

export function skillSchemaHealth(state: SkillSchemaState): { schemas: number; health: number } {
  return { schemas: state.schemas.size, health: state.schemas.size > 0 ? 1 : 0.5 };
}
