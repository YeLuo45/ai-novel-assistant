// V2150 MemorySchema - Direction F Iter 5/30
// Memory record schema validator
// Source: thunderbolt
export type FieldKind = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface SchemaField {
  name: string;
  kind: FieldKind;
  required: boolean;
}

export interface MemorySchema {
  name: string;
  fields: SchemaField[];
  version: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function createSchema(name: string, fields: SchemaField[]): MemorySchema {
  return { name, fields, version: 1 };
}

function fieldType(v: unknown): FieldKind {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'object';
  return typeof v as FieldKind;
}

export function validate(schema: MemorySchema, data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  for (const field of schema.fields) {
    if (field.required && !(field.name in data)) {
      errors.push(`missing required field: ${field.name}`);
      continue;
    }
    if (field.name in data) {
      const actual = fieldType(data[field.name]);
      if (actual !== field.kind) errors.push(`field ${field.name} expected ${field.kind} got ${actual}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function addField(schema: MemorySchema, field: SchemaField): MemorySchema {
  if (schema.fields.some((f) => f.name === field.name)) return schema;
  return { ...schema, fields: [...schema.fields, field], version: schema.version + 1 };
}

export function removeField(schema: MemorySchema, name: string): MemorySchema {
  return { ...schema, fields: schema.fields.filter((f) => f.name !== name), version: schema.version + 1 };
}

export function requiredFields(schema: MemorySchema): string[] {
  return schema.fields.filter((f) => f.required).map((f) => f.name);
}

export function optionalFields(schema: MemorySchema): string[] {
  return schema.fields.filter((f) => !f.required).map((f) => f.name);
}

export function schemaHealth(schema: MemorySchema): { fields: number; required: number; version: number; health: number } {
  return { fields: schema.fields.length, required: requiredFields(schema).length, version: schema.version, health: schema.fields.length > 0 ? 1 : 0 };
}
