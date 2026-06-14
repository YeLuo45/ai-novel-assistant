import { describe, it, expect } from 'vitest';
import { createOpSerializerState, serializeOpJson, deserializeOpJson, serializeOpHex, deserializeOpHex, serializeOps, deserializeOps, setOpFormat, opSerializerHealth } from './OpSerializer';
import type { CRDTOperation } from './OperationEncoder';

const op: CRDTOperation = { id: 'op1', kind: 'set', target: 'k', value: 1, authorId: 'alice', lamport: 1, ts: 1 };

describe('V2217 OpSerializer', () => {
  it('should create state', () => {
    const s = createOpSerializerState();
    expect(s.format).toBe('json');
  });

  it('should serialize json', () => {
    const s = serializeOpJson(op);
    expect(s).toContain('alice');
  });

  it('should deserialize json', () => {
    const s = serializeOpJson(op);
    expect(deserializeOpJson(s).id).toBe('op1');
  });

  it('should roundtrip hex', () => {
    const s = serializeOpHex(op);
    expect(deserializeOpHex(s).target).toBe('k');
  });

  it('should serialize batch', () => {
    const s = createOpSerializerState();
    const r = serializeOps(s, [op]);
    expect(r.data).toContain('op1');
  });

  it('should deserialize batch', () => {
    const s = createOpSerializerState();
    const r = serializeOps(s, [op]);
    expect(deserializeOps(s, r.data)).toHaveLength(1);
  });

  it('should set format', () => {
    let s = createOpSerializerState();
    s = setOpFormat(s, 'hex');
    expect(s.format).toBe('hex');
  });

  it('should compute health', () => {
    const s = createOpSerializerState();
    const h = opSerializerHealth(s);
    expect(h.health).toBe(0.5);
  });
});
