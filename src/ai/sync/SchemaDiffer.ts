// V2119 SchemaDiffer - Direction A Iter 4/30
// Schema 差异检测 - 表结构演化追踪
// Source: thunderbolt (Schema evolution)

export type FieldChange = 'added' | 'removed' | 'type_changed' | 'unchanged';

export interface FieldDiff {
  fieldName: string;
  change: FieldChange;
  oldType?: string;
  newType?: string;
}

export interface TableSchema {
  tableName: string;
  fields: Record<string, string>; // field name → type
  version: number;
}

export interface SchemaDiff {
  tableName: string;
  fieldDiffs: FieldDiff[];
  addedCount: number;
  removedCount: number;
  typeChangedCount: number;
  isCompatible: boolean;
}

export function createSchemaDiff(tableName: string): SchemaDiff {
  return {
    tableName,
    fieldDiffs: [],
    addedCount: 0,
    removedCount: 0,
    typeChangedCount: 0,
    isCompatible: true,
  };
}

/** Compute diff between old and new schema */
export function diffSchemas(oldSchema: TableSchema, newSchema: TableSchema): SchemaDiff {
  let diff = createSchemaDiff(newSchema.tableName);
  const allFields = new Set([...Object.keys(oldSchema.fields), ...Object.keys(newSchema.fields)]);
  for (const field of allFields) {
    const oldType = oldSchema.fields[field];
    const newType = newSchema.fields[field];
    if (oldType === undefined) {
      diff.fieldDiffs.push({ fieldName: field, change: 'added', newType });
      diff.addedCount++;
    } else if (newType === undefined) {
      diff.fieldDiffs.push({ fieldName: field, change: 'removed', oldType });
      diff.removedCount++;
      diff.isCompatible = false;
    } else if (oldType !== newType) {
      diff.fieldDiffs.push({ fieldName: field, change: 'type_changed', oldType, newType });
      diff.typeChangedCount++;
      diff.isCompatible = false;
    } else {
      diff.fieldDiffs.push({ fieldName: field, change: 'unchanged' });
    }
  }
  return diff;
}

/** Apply a diff to a schema (forward migration) */
export function applyDiff(schema: TableSchema, diff: SchemaDiff): TableSchema {
  const fields: Record<string, string> = { ...schema.fields };
  for (const fd of diff.fieldDiffs) {
    if (fd.change === 'added' && fd.newType) fields[fd.fieldName] = fd.newType;
    else if (fd.change === 'removed') delete fields[fd.fieldName];
    else if (fd.change === 'type_changed' && fd.newType) fields[fd.fieldName] = fd.newType;
  }
  return { ...schema, fields, version: schema.version + 1 };
}

/** Check if schema is empty */
export function isEmptySchema(schema: TableSchema): boolean {
  return Object.keys(schema.fields).length === 0;
}

/** Get field names in alphabetical order */
export function sortedFieldNames(schema: TableSchema): string[] {
  return Object.keys(schema.fields).sort();
}

/** Count breaking changes */
export function breakingChangeCount(diff: SchemaDiff): number {
  return diff.removedCount + diff.typeChangedCount;
}

/** Master schema health metric */
export function schemaHealth(schema: TableSchema): {
  fieldCount: number;
  version: number;
  health: number;
} {
  const fieldCount = Object.keys(schema.fields).length;
  const health = Math.min(1, fieldCount / 10) * Math.min(1, schema.version / 5);
  return { fieldCount, version: schema.version, health };
}
