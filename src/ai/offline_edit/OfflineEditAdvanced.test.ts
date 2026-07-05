// V4956-V4965: CM Offline Edit Advanced Batch 2/3 tests
import { describe, it, expect } from 'vitest';
import {
  CRDTDocument,
  VectorClock,
  LamportClock,
  OperationalTransform,
  DeltaEncoder,
  DeltaDecoder,
  CompressionCodec,
  EncryptedChannel,
  PresenceTracker,
  OfflineEditAdvancedIndex,
  CM_BATCH_2_ENGINES
} from './OfflineEditAdvanced';

describe('CRDTDocument', () => {
  it('set + get + ts + delete + size + keys', async () => {
    const d = new CRDTDocument();
    d.set('a', '1', 100);
    d.set('b', '2', 200);
    expect(d.get('a')).toBe('1');
    expect(d.ts('a')).toBe(100);
    expect(d.size()).toBe(2);
    expect(d.keys().sort()).toEqual(['a', 'b']);
    await new Promise(r => setTimeout(r, 5));
    d.set('a', 'newer', 50); // older → ignored
    expect(d.get('a')).toBe('1');
    d.set('a', 'updated', 150); // newer → wins
    expect(d.get('a')).toBe('updated');
    expect(d.delete('a')).toBe(true);
    expect(d.get('a')).toBeNull();
  });

  it('merge takes newer wins', () => {
    const a = new CRDTDocument();
    a.set('x', 'A', 100);
    const b = new CRDTDocument();
    b.set('x', 'B', 200);
    a.merge(b);
    expect(a.get('x')).toBe('B');
  });

  it('merge handles missing local', () => {
    const a = new CRDTDocument();
    const b = new CRDTDocument();
    b.set('x', 'B', 200);
    a.merge(b);
    expect(a.get('x')).toBe('B');
  });
});

describe('VectorClock', () => {
  it('increment + get + merge', () => {
    const v = new VectorClock();
    v.increment('a');
    v.increment('a');
    v.increment('b');
    expect(v.get('a')).toBe(2);
    expect(v.get('b')).toBe(1);

    const other = new VectorClock();
    other.increment('a');
    other.increment('c');
    v.merge(other);
    expect(v.get('a')).toBe(2);
    expect(v.get('c')).toBe(1);
  });

  it('compare before/after/equal/concurrent', () => {
    const a = new VectorClock();
    a.increment('x');
    a.increment('y');
    const b = new VectorClock();
    b.increment('x');
    b.increment('y');
    b.increment('y');
    expect(a.compare(b)).toBe('before');
    expect(b.compare(a)).toBe('after');
    expect(a.compare(a)).toBe('equal');
    const c = new VectorClock();
    c.increment('x');
    c.increment('z');
    const d = new VectorClock();
    d.increment('y');
    expect(c.compare(d)).toBe('concurrent');
  });

  it('toMap', () => {
    const v = new VectorClock();
    v.increment('a');
    expect(v.toMap()).toEqual({ a: 1 });
  });
});

describe('LamportClock', () => {
  it('tick + observe + current', () => {
    const c = new LamportClock();
    expect(c.current()).toBe(0);
    expect(c.tick()).toBe(1);
    expect(c.tick()).toBe(2);
    expect(c.observe(10)).toBe(11);
    expect(c.current()).toBe(11);
  });
});

describe('OperationalTransform', () => {
  it('apply insert + delete', () => {
    const ot = new OperationalTransform();
    expect(ot.apply({ type: 'insert', pos: 0, text: 'a' }, 'bc')).toBe('abc');
    // 'abcde' pos=1 length=2 → remove 'bc' → 'ade'
    expect(ot.apply({ type: 'delete', pos: 1, length: 2 }, 'abcde')).toBe('ade');
  });

  it('apply invalid op returns original', () => {
    const ot = new OperationalTransform();
    expect(ot.apply({ type: 'insert' as const, pos: 0 }, 'bc')).toBe('bc');
  });

  it('transform insert vs insert', () => {
    const ot = new OperationalTransform();
    // op1 at pos=1, op2 at pos=5 → op1 is before op2 → op1 unchanged
    const op1 = { type: 'insert' as const, pos: 1, text: 'a' };
    const op2 = { type: 'insert' as const, pos: 5, text: 'b' };
    expect(ot.transform(op1, op2)).toEqual(op1);
    // op1 at pos=5, op2 at pos=1 → op1 is after op2 → op1 shifts right by op2.text.length=1
    const op1b = { type: 'insert' as const, pos: 5, text: 'a' };
    const op2b = { type: 'insert' as const, pos: 1, text: 'b' };
    expect(ot.transform(op1b, op2b)).toEqual({ type: 'insert', pos: 6, text: 'a' });
  });

  it('transform delete vs delete', () => {
    const ot = new OperationalTransform();
    // op1 at pos=10 length=2, op2 at pos=5 length=3
    // op1.pos >= op2.pos + op2.length → op1.pos (10) >= 5+3 (8) → op1 shifts left by op2.length=3 → pos=7
    const op1 = { type: 'delete' as const, pos: 10, length: 2 };
    const op2 = { type: 'delete' as const, pos: 5, length: 3 };
    expect(ot.transform(op1, op2)).toEqual({ type: 'delete', pos: 7, length: 2 });
    // op1 overlaps op2 → fallback returns op1 unchanged
    const overlap = { type: 'delete' as const, pos: 6, length: 2 };
    expect(ot.transform(overlap, op2)).toEqual(overlap);
  });

  it('transform insert vs delete (and reverse)', () => {
    const ot = new OperationalTransform();
    const ins = { type: 'insert' as const, pos: 5, text: 'x' };
    const del = { type: 'delete' as const, pos: 5, length: 2 };
    expect(ot.transform(ins, del)).toEqual(ins);
    expect(ot.transform(del, ins)).toEqual(del);
  });
});

describe('DeltaEncoder', () => {
  it('encode + decode round-trip', () => {
    const enc = new DeltaEncoder();
    const d = enc.encode('hello', 'hello world');
    expect(d.op).toBe('insert');
    expect(enc.decode('hello', d)).toBe('hello world');

    const d2 = enc.encode('hello world', 'hello');
    expect(d2.op).toBe('delete');
    expect(enc.decode('hello world', d2)).toBe('hello');

    const d3 = enc.encode('hello', 'help');
    expect(d3.op).toBe('replace');
    expect(enc.decode('hello', d3)).toBe('help');

    expect(enc.encode('a', 'a').op).toBe('equal');
  });
});

describe('DeltaDecoder', () => {
  it('encode + decode round-trip', () => {
    const d = new DeltaDecoder();
    const encoded = d.encode('hello', 'help');
    expect(d.decode('hello', encoded)).toBe('help');
  });

  it('decode invalid returns original', () => {
    const d = new DeltaDecoder();
    expect(d.decode('hello', 'not-json')).toBe('hello');
  });
});

describe('CompressionCodec', () => {
  it('compress + decompress + ratio', () => {
    const c = new CompressionCodec();
    expect(c.compress('')).toBe('');
    expect(c.decompress(c.compress('hello'))).toBe('hello');
    const c2 = c.compress('héllo');
    expect(c.decompress(c2)).toBe('héllo');
    expect(c.ratio('hello', c2)).toBeGreaterThan(0);
  });
});

describe('EncryptedChannel', () => {
  it('encrypt + decrypt symmetric', () => {
    const ch = new EncryptedChannel(42);
    const enc = ch.encrypt('hello');
    expect(enc).not.toBe('hello');
    expect(ch.decrypt(enc)).toBe('hello');
  });

  it('setKey changes encryption', () => {
    const ch = new EncryptedChannel(1);
    const a = ch.encrypt('x');
    ch.setKey(2);
    const b = ch.encrypt('x');
    expect(a).not.toBe(b);
  });
});

describe('PresenceTracker', () => {
  it('heartbeat + peers + cursor + active + remove + size', () => {
    const p = new PresenceTracker(100);
    p.heartbeat('a', 10);
    p.heartbeat('b', 20);
    expect(p.size()).toBe(2);
    expect(p.peers().sort()).toEqual(['a', 'b']);
    expect(p.cursor('a')).toBe(10);
    expect(p.cursor('missing')).toBeNull();
    expect(p.active(Date.now() + 50)).toEqual(['a', 'b']);
    expect(p.active(Date.now() + 200)).toEqual([]);
    expect(p.remove('a')).toBe(true);
    expect(p.size()).toBe(1);
  });
});

describe('OfflineEditAdvancedIndex', () => {
  it('list has 10', () => {
    expect(new OfflineEditAdvancedIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new OfflineEditAdvancedIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('CRDTDocument')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CM_BATCH_2_ENGINES const has 10', () => {
    expect(CM_BATCH_2_ENGINES).toHaveLength(10);
  });
});