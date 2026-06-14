// V2206 OperationEncoder - Direction H Iter 1/30
// Encode CRDT operations to compact wire format
// Source: thunderbolt
export type OpKind = 'set' | 'add' | 'remove' | 'increment' | 'append' | 'delete';

export interface CRDTOperation {
  id: string;
  kind: OpKind;
  target: string;
  value: unknown;
  authorId: string;
  lamport: number;
  ts: number;
}

export interface OpEncoderState {
  ops: Map<string, CRDTOperation>;
  byAuthor: Map<string, string[]>;
  counter: number;
}

export function createOpEncoderState(): OpEncoderState {
  return { ops: new Map(), byAuthor: new Map(), counter: 0 };
}

export function encodeOp(state: OpEncoderState, kind: OpKind, target: string, value: unknown, authorId: string): { state: OpEncoderState; op: CRDTOperation } {
  state.counter++;
  const op: CRDTOperation = {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    target,
    value,
    authorId,
    lamport: state.counter,
    ts: Date.now(),
  };
  const ops = new Map(state.ops);
  ops.set(op.id, op);
  const byAuthor = new Map(state.byAuthor);
  const list = byAuthor.get(authorId) || [];
  byAuthor.set(authorId, [...list, op.id]);
  return { state: { ...state, ops, byAuthor }, op };
}

export function getOp(state: OpEncoderState, opId: string): CRDTOperation | undefined {
  return state.ops.get(opId);
}

export function opsByAuthor(state: OpEncoderState, authorId: string): CRDTOperation[] {
  return (state.byAuthor.get(authorId) || []).map((id) => state.ops.get(id)!).filter(Boolean);
}

export function latestOp(state: OpEncoderState): CRDTOperation | undefined {
  if (state.ops.size === 0) return undefined;
  return Array.from(state.ops.values()).sort((a, b) => b.lamport - a.lamport)[0];
}

export function opCount(state: OpEncoderState): number {
  return state.ops.size;
}

export function opEncoderHealth(state: OpEncoderState): { count: number; authors: number; health: number } {
  return { count: state.ops.size, authors: state.byAuthor.size, health: state.ops.size > 0 ? 1 : 0.5 };
}
