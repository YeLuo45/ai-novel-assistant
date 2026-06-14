// V2234 OpAdapter - Direction H Iter 29/30
// Format adapter (msgpack/json/binary)
// Source: generic-agent
export type OpAdapterFormat = 'json' | 'msgpack' | 'protobuf' | 'cbor';

export interface AdaptedOp {
  kind: OpAdapterFormat;
  payload: string;
  size: number;
}

export interface OpAdapterState {
  formatCounts: Record<OpAdapterFormat, number>;
}

export function createOpAdapterState(): OpAdapterState {
  return { formatCounts: { json: 0, msgpack: 0, protobuf: 0, cbor: 0 } };
}

export function toOpJSON(op: { id: string; kind: string; target: string; value: unknown }): AdaptedOp {
  const payload = JSON.stringify(op);
  return { kind: 'json', payload, size: payload.length };
}

export function toOpMsgpack(op: { id: string; kind: string; target: string; value: unknown }): AdaptedOp {
  // Simplified msgpack emulation
  const payload = JSON.stringify(op);
  return { kind: 'msgpack', payload: Buffer.from(payload).toString('base64'), size: payload.length };
}

export function toOpProtobuf(op: { id: string; kind: string; target: string; value: unknown }): AdaptedOp {
  // Simplified protobuf emulation
  const payload = `${op.id}|${op.kind}|${op.target}|${JSON.stringify(op.value)}`;
  return { kind: 'protobuf', payload, size: payload.length };
}

export function toOpCBOR(op: { id: string; kind: string; target: string; value: unknown }): AdaptedOp {
  const payload = JSON.stringify(op);
  return { kind: 'cbor', payload: Buffer.from(payload).toString('hex'), size: payload.length };
}

export function adaptOpFormat(state: OpAdapterState, kind: OpAdapterFormat): OpAdapterState {
  return { ...state, formatCounts: { ...state.formatCounts, [kind]: state.formatCounts[kind] + 1 } };
}

export function opAdapterHealth(state: OpAdapterState): { total: number; formats: number; health: number } {
  const total = Object.values(state.formatCounts).reduce((s, n) => s + n, 0);
  return { total, formats: Object.values(state.formatCounts).filter((n) => n > 0).length, health: total > 0 ? 1 : 0.5 };
}
