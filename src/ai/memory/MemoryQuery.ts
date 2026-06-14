// V2154 MemoryQuery - Direction F Iter 9/30
// Structured memory query language
// Source: nanobot
export type QueryOp = 'eq' | 'gt' | 'lt' | 'in' | 'contains' | 'between';

export interface MemoryQuery {
  field: string;
  op: QueryOp;
  value: unknown;
}

export interface QueryAnd {
  and: MemoryQueryExpr[];
}
export interface QueryOr {
  or: MemoryQueryExpr[];
}
export interface QueryCond {
  query: MemoryQuery;
}
export type MemoryQueryExpr = QueryAnd | QueryOr | QueryCond;

export interface MemoryRecord {
  id: string;
  fields: Record<string, unknown>;
}

export interface MemoryQueryState {
  records: MemoryRecord[];
}

export function createMemoryQueryState(): MemoryQueryState {
  return { records: [] };
}

export function addRecord(state: MemoryQueryState, id: string, fields: Record<string, unknown>): MemoryQueryState {
  return { ...state, records: [...state.records, { id, fields }] };
}

function matchesQuery(record: MemoryRecord, q: MemoryQuery): boolean {
  const v = record.fields[q.field];
  switch (q.op) {
    case 'eq': return v === q.value;
    case 'gt': return typeof v === 'number' && v > (q.value as number);
    case 'lt': return typeof v === 'number' && v < (q.value as number);
    case 'in': return Array.isArray(q.value) && (q.value as unknown[]).includes(v);
    case 'contains': return typeof v === 'string' && typeof q.value === 'string' && v.includes(q.value);
    case 'between': {
      if (!Array.isArray(q.value) || q.value.length !== 2) return false;
      return typeof v === 'number' && v >= (q.value[0] as number) && v <= (q.value[1] as number);
    }
    default: return false;
  }
}

function matchesExpr(record: MemoryRecord, expr: MemoryQueryExpr): boolean {
  if ('and' in expr) return expr.and.every((e) => matchesExpr(record, e));
  if ('or' in expr) return expr.or.some((e) => matchesExpr(record, e));
  if ('query' in expr) return matchesQuery(record, expr.query);
  return false;
}

export function executeQuery(state: MemoryQueryState, expr: MemoryQueryExpr): MemoryRecord[] {
  return state.records.filter((r) => matchesExpr(r, expr));
}

export function recordCount(state: MemoryQueryState): number {
  return state.records.length;
}

export function memoryQueryHealth(state: MemoryQueryState): { records: number; health: number } {
  return { records: state.records.length, health: state.records.length > 0 ? 1 : 0.5 };
}
