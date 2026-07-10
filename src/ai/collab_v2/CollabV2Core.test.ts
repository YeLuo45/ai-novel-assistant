// V5276-V5285: CX Real-time Collaboration 2.0 Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  OperationalTransform2,
  YjsStyleCRDT,
  PresenceEngine2,
  ConflictResolver2,
  HistoryManager,
  SnapshotSync,
  RealtimeSerializer,
  DeltaCompressor,
  NetworkOptimizer,
  CollabV2CoreIndex,
  CX_BATCH_1_ENGINES
} from './CollabV2Core';

describe('OperationalTransform2 + YjsStyleCRDT + PresenceEngine2', () => {
  it('OperationalTransform2 transform + apply', () => {
    const ot = new OperationalTransform2();
    // format type: passthrough
    const fmt = ot.transform({ type: 'format', pos: 5, attrs: { bold: 'true' } }, { type: 'insert', pos: 3, text: 'YY' });
    expect(fmt).toEqual({ type: 'format', pos: 5, attrs: { bold: 'true' } });
    // insert vs insert: pos >= against.pos → shift right
    const result1 = ot.transform({ type: 'insert', pos: 5, text: 'X' }, { type: 'insert', pos: 3, text: 'YY' });
    expect(result1.pos).toBe(7);
    // insert vs insert: pos < against.pos → unchanged
    const result2 = ot.transform({ type: 'insert', pos: 2, text: 'X' }, { type: 'insert', pos: 5, text: 'YY' });
    expect(result2.pos).toBe(2);
    // insert vs delete: pos within delete range
    const result3 = ot.transform({ type: 'insert', pos: 5, text: 'X' }, { type: 'delete', pos: 3, length: 4 });
    expect(result3.pos).toBe(3);
    // insert vs delete: pos after delete range
    const result4 = ot.transform({ type: 'insert', pos: 10, text: 'X' }, { type: 'delete', pos: 3, length: 4 });
    expect(result4.pos).toBe(6);
    // insert vs delete: pos before delete range
    const result4b = ot.transform({ type: 'insert', pos: 1, text: 'X' }, { type: 'delete', pos: 3, length: 4 });
    expect(result4b.pos).toBe(1);
    // delete vs insert: pos >= against.pos → shift right
    const result5 = ot.transform({ type: 'delete', pos: 5, length: 2 }, { type: 'insert', pos: 3, text: 'YY' });
    expect(result5.pos).toBe(7);
    // delete vs insert: pos < against.pos → unchanged
    const result5b = ot.transform({ type: 'delete', pos: 1, length: 2 }, { type: 'insert', pos: 3, text: 'YY' });
    expect(result5b.pos).toBe(1);
    // delete vs delete: pos >= against end → shift left
    const result6 = ot.transform({ type: 'delete', pos: 10, length: 2 }, { type: 'delete', pos: 5, length: 3 });
    expect(result6.pos).toBe(7);
    // delete vs delete: overlap (op.pos < against.pos + against.length) → unchanged
    const result7 = ot.transform({ type: 'delete', pos: 6, length: 2 }, { type: 'delete', pos: 5, length: 3 });
    expect(result7.pos).toBe(6);
    // delete vs delete: pos < against.pos (deleted nothing) → unchanged
    const result7b = ot.transform({ type: 'delete', pos: 1, length: 2 }, { type: 'delete', pos: 5, length: 3 });
    expect(result7b.pos).toBe(1);
    // apply insert
    expect(ot.apply('hello world', { type: 'insert', pos: 5, text: ' beautiful' })).toBe('hello beautiful world');
    // apply delete
    expect(ot.apply('hello world', { type: 'delete', pos: 5, length: 6 })).toBe('hello');
    // apply invalid op
    expect(ot.apply('hello', { type: 'insert' as const, pos: 0 })).toBe('hello');
  });

  it('YjsStyleCRDT set + get + mergeRemote + export + size + clock', () => {
    const a = new YjsStyleCRDT();
    expect(a.set('k1', 'v1')).toBe(1);
    expect(a.set('k2', 'v2')).toBe(2);
    expect(a.get('k1')).toBe('v1');
    expect(a.get('missing')).toBeNull();
    expect(a.size()).toBe(2);
    expect(a.clock()).toBe(2);
    a.mergeRemote([{ key: 'k1', value: 'remote-v1', clock: 5 }]);
    expect(a.get('k1')).toBe('remote-v1'); // remote clock 5 > local 1
    expect(a.clock()).toBe(5);
    expect(a.export()).toHaveLength(2);
    // mergeRemote with lower clock → no update
    a.mergeRemote([{ key: 'k1', value: 'stale', clock: 1 }]);
    expect(a.get('k1')).toBe('remote-v1');
    // mergeRemote with new key
    a.mergeRemote([{ key: 'k3', value: 'v3', clock: 10 }]);
    expect(a.get('k3')).toBe('v3');
    expect(a.size()).toBe(3);
  });

  it('PresenceEngine2 heartbeat + peers + cursor + selection + active + timeout', () => {
    const p = new PresenceEngine2(100);
    p.heartbeat('p1', 5, [1, 10]);
    p.heartbeat('p2', 20);
    expect(p.peers().sort()).toEqual(['p1', 'p2']);
    expect(p.cursor('p1')).toBe(5);
    expect(p.selection('p1')).toEqual([1, 10]);
    expect(p.active(Date.now() + 50)).toEqual(['p1', 'p2']);
    expect(p.active(Date.now() + 200)).toEqual([]);
    expect(p.timeout()).toBe(100);
    // Missing peer
    expect(p.cursor('missing')).toBe(0);
    expect(p.selection('missing')).toEqual([0, 0]);
  });
});

describe('ConflictResolver2 + HistoryManager + SnapshotSync', () => {
  it('ConflictResolver2 resolve + hasConflict', () => {
    const c = new ConflictResolver2();
    expect(c.resolve('a', 'b', 'local')).toBe('a');
    expect(c.resolve('a', 'b', 'remote')).toBe('b');
    expect(c.resolve('a', 'b', 'merge')).toContain('---');
    // threeway: local unchanged from base → keep local; remote changed → keep remote
    expect(c.resolve('a', 'b', 'threeway', 'a')).toBe('a'); // local=base → return local
    expect(c.resolve('a', 'b', 'threeway', 'b')).toBe('b'); // remote=base → return remote
    expect(c.resolve('a', 'b', 'threeway', 'base')).toContain('<<<<<<<'); // both changed
    // threeway without base
    expect(c.resolve('a', 'b', 'threeway')).toBe('a'); // no base → return local
    expect(c.hasConflict('a', 'b', 'base')).toBe(true);
    expect(c.hasConflict('a', 'a', 'base')).toBe(false);
    expect(c.hasConflict('a', 'a', 'x')).toBe(false); // base undefined
  });

  it('HistoryManager push + undo + redo + canUndo + sizes', () => {
    const h = new HistoryManager();
    h.push('v1').push('v2').push('v3');
    expect(h.canUndo()).toBe(true);
    expect(h.undoSize()).toBe(3);
    // undo('current') pops last from undo (v3), pushes current to redo, returns v3
    expect(h.undo('current')).toBe('v3');
    expect(h.canRedo()).toBe(true);
    // undo stack: [v1, v2]; redo stack: ['current']
    // redo('v2') pushes v2 to undo, returns 'current' (last redo)
    expect(h.redo('v2')).toBe('current');
    expect(h.undoSize()).toBe(3);
    expect(h.redoSize()).toBe(0);
    // After push, redo is cleared
    h.push('v4');
    expect(h.canRedo()).toBe(false);
    // Empty undo/redo
    const h2 = new HistoryManager();
    expect(h2.canUndo()).toBe(false);
    expect(h2.canRedo()).toBe(false);
    expect(h2.undo('x')).toBeNull();
    expect(h2.redo('x')).toBeNull();
    // maxSize enforced
    const h3 = new HistoryManager(2);
    h3.push('v1').push('v2').push('v3');
    expect(h3.undoSize()).toBe(2);
  });

  it('SnapshotSync setCurrent + save + load + age + ids + count', () => {
    const s = new SnapshotSync();
    s.setCurrent('state1');
    s.save('s1');
    s.setCurrent('state2');
    expect(s.current()).toBe('state2');
    expect(s.load('s1')).toBe('state1');
    expect(s.current()).toBe('state1');
    expect(s.snapshotIds()).toEqual(['s1']);
    expect(s.load('missing')).toBeNull();
    expect(s.age('missing')).toBe(-1);
    expect(s.age('s1')).toBeGreaterThanOrEqual(0);
    expect(s.count()).toBe(1);
  });
});

describe('RealtimeSerializer + DeltaCompressor + NetworkOptimizer', () => {
  it('RealtimeSerializer serialize + deserialize + size', () => {
    const s = new RealtimeSerializer();
    const obj = { x: 1, y: [2, 3] };
    expect(s.deserialize(s.serialize(obj))).toEqual(obj);
    expect(s.size(obj)).toBeGreaterThan(0);
  });

  it('DeltaCompressor diff + patch + ratio', () => {
    const d = new DeltaCompressor();
    expect(d.diff('a', 'a')).toBe('');
    const delta = d.diff('hello', 'hello world');
    expect(d.patch('hello', delta)).toBe('hello world');
    expect(d.ratio('hello world', 'hello world')).toBe(0);
    expect(d.patch('hello', 'invalid-json')).toBe('hello');
    // Different common prefix/suffix
    const delta2 = d.diff('fooXbar', 'fooYbar');
    expect(d.patch('fooXbar', delta2)).toBe('fooYbar');
  });

  it('NetworkOptimizer optimalBatch + recommendCompression + estimateLatency', () => {
    const n = new NetworkOptimizer();
    expect(n.optimalBatch(10)).toBe(50);
    expect(n.optimalBatch(100)).toBe(25);
    expect(n.optimalBatch(500)).toBe(10);
    expect(n.recommendCompression(500)).toBe('none');
    expect(n.recommendCompression(5000)).toBe('fast');
    expect(n.recommendCompression(50000)).toBe('best');
    const lat = n.estimateLatency(1000, 50, 1000);
    expect(lat).toBeGreaterThanOrEqual(50);
  });
});

describe('CollabV2CoreIndex', () => {
  it('list has 10', () => {
    expect(new CollabV2CoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new CollabV2CoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('OperationalTransform2')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CX_BATCH_1_ENGINES const has 10', () => {
    expect(CX_BATCH_1_ENGINES).toHaveLength(10);
  });
});