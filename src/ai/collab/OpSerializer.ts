// V2217 OpSerializer - Direction H Iter 12/30
// Serialize/deserialize ops (binary/json)
// Source: nanobot
import type { CRDTOperation } from './OperationEncoder';

export type OpFormat = 'json' | 'msgpack' | 'binary' | 'hex';

export interface OpSerializerState {
  format: OpFormat;
  totalSerializations: number;
}

export function createOpSerializerState(format: OpFormat = 'json'): OpSerializerState {
  return { format, totalSerializations: 0 };
}

export function serializeOpJson(op: CRDTOperation): string {
  return JSON.stringify(op);
}

export function deserializeOpJson(s: string): CRDTOperation {
  return JSON.parse(s);
}

export function serializeOpMsgpack(op: CRDTOperation): Buffer {
  // Simple msgpack-like: prefix + json
  const json = JSON.stringify(op);
  return Buffer.from(json, 'utf-8');
}

export function deserializeOpMsgpack(b: Buffer): CRDTOperation {
  return JSON.parse(b.toString('utf-8'));
}

export function serializeOpBinary(op: CRDTOperation): Buffer {
  const json = JSON.stringify(op);
  // Simple: utf-8 bytes
  return Buffer.from(json, 'utf-8');
}

export function deserializeOpBinary(b: Buffer): CRDTOperation {
  return JSON.parse(b.toString('utf-8'));
}

export function serializeOpHex(op: CRDTOperation): string {
  const json = JSON.stringify(op);
  return Buffer.from(json, 'utf-8').toString('hex');
}

export function deserializeOpHex(hex: string): CRDTOperation {
  return JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'));
}

export function serializeOps(state: OpSerializerState, ops: CRDTOperation[]): { state: OpSerializerState; data: string } {
  if (state.format === 'json') return { state: { ...state, totalSerializations: state.totalSerializations + 1 }, data: JSON.stringify(ops) };
  if (state.format === 'hex') return { state: { ...state, totalSerializations: state.totalSerializations + 1 }, data: serializeOpHex({ id: 'batch', kind: 'set', target: 'batch', value: ops, authorId: 'sys', lamport: 0, ts: 0 }) };
  return { state: { ...state, totalSerializations: state.totalSerializations + 1 }, data: Buffer.from(JSON.stringify(ops)).toString('base64') };
}

export function deserializeOps(state: OpSerializerState, data: string): CRDTOperation[] {
  if (state.format === 'json') return JSON.parse(data);
  if (state.format === 'hex') {
    const batch = deserializeOpHex(data);
    return batch.value as CRDTOperation[];
  }
  return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
}

export function setOpFormat(state: OpSerializerState, format: OpFormat): OpSerializerState {
  return { ...state, format };
}

export function opSerializerHealth(state: OpSerializerState): { format: OpFormat; total: number; health: number } {
  return { format: state.format, total: state.totalSerializations, health: state.totalSerializations > 0 ? 1 : 0.5 };
}
