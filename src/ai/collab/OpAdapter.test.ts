import { describe, it, expect } from 'vitest';
import { createOpAdapterState, toOpJSON, toOpMsgpack, toOpProtobuf, toOpCBOR, adaptOpFormat, opAdapterHealth } from './OpAdapter';

describe('V2234 OpAdapter', () => {
  it('should create empty state', () => {
    const s = createOpAdapterState();
    expect(s.formatCounts.json).toBe(0);
  });

  it('should convert to JSON', () => {
    const r = toOpJSON({ id: 'op1', kind: 'set', target: 'k', value: 1 });
    expect(r.kind).toBe('json');
  });

  it('should convert to msgpack', () => {
    const r = toOpMsgpack({ id: 'op1', kind: 'set', target: 'k', value: 1 });
    expect(r.kind).toBe('msgpack');
  });

  it('should convert to protobuf', () => {
    const r = toOpProtobuf({ id: 'op1', kind: 'set', target: 'k', value: 1 });
    expect(r.kind).toBe('protobuf');
  });

  it('should convert to CBOR', () => {
    const r = toOpCBOR({ id: 'op1', kind: 'set', target: 'k', value: 1 });
    expect(r.kind).toBe('cbor');
  });

  it('should adapt and count', () => {
    let s = createOpAdapterState();
    s = adaptOpFormat(s, 'json');
    s = adaptOpFormat(s, 'json');
    expect(s.formatCounts.json).toBe(2);
  });

  it('should compute health', () => {
    let s = createOpAdapterState();
    s = adaptOpFormat(s, 'json');
    const h = opAdapterHealth(s);
    expect(h.health).toBe(1);
  });
});
