// V4946-V4955: CM Offline Edit Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  OfflineDocument,
  LocalStorageAdapter,
  IndexedDBAdapter,
  DiffEngine,
  MergeEngine,
  ConflictResolver,
  SyncQueue,
  OperationLog,
  SnapshotManager,
  OfflineEditCoreIndex,
  CM_BATCH_1_ENGINES
} from './OfflineEditCore';

describe('OfflineDocument', () => {
  it('apply + version + modifiedAt', async () => {
    const d = new OfflineDocument('hello');
    expect(d.version).toBe(0);
    const v = d.apply('world');
    expect(v).toBe(1);
    expect(d.content).toBe('world');
    expect(d.length()).toBe(5);
    await new Promise(r => setTimeout(r, 5));
    d.apply('x');
    expect(d.modifiedAt).toBeGreaterThan(0);
  });

  it('applyPatch', () => {
    const d = new OfflineDocument('hello world');
    const v = d.applyPatch(6, 11, 'there');
    expect(d.content).toBe('hello there');
    expect(v).toBe(1);
  });

  it('clone', () => {
    const a = new OfflineDocument('x');
    a.apply('y');
    const b = a.clone();
    expect(b.content).toBe('y');
    expect(b.version).toBe(a.version);
  });
});

describe('LocalStorageAdapter', () => {
  it('set + get + has + keys + size + clear', () => {
    const ls = new LocalStorageAdapter();
    ls.set('a', '1');
    ls.set('b', '2');
    expect(ls.get('a')).toBe('1');
    expect(ls.has('b')).toBe(true);
    expect(ls.keys()).toEqual(['a', 'b']);
    expect(ls.size()).toBe(2);
    expect(ls.delete('a')).toBe(true);
    expect(ls.get('missing')).toBeNull();
    ls.clear();
    expect(ls.size()).toBe(0);
  });
});

describe('IndexedDBAdapter', () => {
  it('put + get + has + delete + tableSize + tableCount', () => {
    const idb = new IndexedDBAdapter();
    idb.put('users', '1', { name: 'alice' });
    expect(idb.get('users', '1')).toEqual({ name: 'alice' });
    expect(idb.has('users', '1')).toBe(true);
    expect(idb.tableSize('users')).toBe(1);
    expect(idb.tableCount()).toBe(1);
    expect(idb.delete('users', '1')).toBe(true);
    expect(idb.has('users', '1')).toBe(false);
  });
});

describe('DiffEngine', () => {
  it('diffLines + diffChars + isEqual', () => {
    const d = new DiffEngine();
    const r = d.diffLines('a\nb', 'a\nc');
    expect(r.some(x => x.op === 'equal')).toBe(true);
    const c = d.diffChars('hello', 'help');
    expect(c.common).toBe(3);
    expect(c.diffA).toBe(2);
    expect(c.diffB).toBe(1);
    expect(d.isEqual('a', 'a')).toBe(true);
    expect(d.isEqual('a', 'b')).toBe(false);
  });

  it('diffLines empty inputs', () => {
    const d = new DiffEngine();
    // ''.split('\n') = [''], 'x'.split('\n') = ['x'] → mismatch → remove '' + add 'x'
    const r1 = d.diffLines('', 'x');
    expect(r1.some(x => x.op === 'add' && x.text === 'x')).toBe(true);
    // 'x'.split = ['x'], ''.split = [''] → mismatch → remove 'x' + add ''
    const r2 = d.diffLines('x', '');
    expect(r2.some(x => x.op === 'remove' && x.text === 'x')).toBe(true);
    // ''.split = [''], ''.split = [''] → equal '' (single empty line)
    const r3 = d.diffLines('', '');
    expect(r3.every(x => x.op === 'equal')).toBe(true);
    // 'a' exhausted first → adds the rest of 'b'
    const r4 = d.diffLines('a', 'a\nb');
    expect(r4.some(x => x.op === 'add' && x.text === 'b')).toBe(true);
    // 'b' exhausted first → removes the rest of 'a'
    const r5 = d.diffLines('a\nb', 'a');
    expect(r5.some(x => x.op === 'remove' && x.text === 'b')).toBe(true);
  });
});

describe('MergeEngine', () => {
  it('threeWayMerge same', () => {
    const m = new MergeEngine();
    const r = m.threeWayMerge('a', 'b', 'b');
    expect(r.merged).toBe('b');
    expect(r.conflicts).toEqual([]);
  });

  it('threeWayMerge conflict', () => {
    const m = new MergeEngine();
    const r = m.threeWayMerge('a', 'b', 'c');
    expect(r.merged).toContain('<<<<<<<');
    expect(r.conflicts.length).toBeGreaterThan(0);
    expect(m.hasConflicts(r.merged)).toBe(true);
  });

  it('takeOurs / takeTheirs', () => {
    const m = new MergeEngine();
    expect(m.takeOurs('a', 'b')).toBe('a');
    expect(m.takeTheirs('a', 'b')).toBe('b');
  });
});

describe('ConflictResolver', () => {
  it('resolve strategies', () => {
    const c = new ConflictResolver();
    expect(c.resolve('a', 'b', 'local')).toBe('a');
    expect(c.resolve('a', 'b', 'remote')).toBe('b');
    expect(c.resolve('a', 'b', 'newer')).toBe('a');
    expect(c.resolve('a', 'b', 'merge')).toBe('a\nb');
  });

  it('detect + autoResolvable', () => {
    const c = new ConflictResolver();
    expect(c.detectConflict('a', 'b', 'base')).toBe(true);
    expect(c.detectConflict('a', 'a', 'base')).toBe(false);
    expect(c.autoResolvable('a', 'b', 'base')).toBe(false);
    expect(c.autoResolvable('base', 'b', 'base')).toBe(true);
    expect(c.autoResolvable('a', 'base', 'base')).toBe(true);
    expect(c.autoResolvable('a', 'a', 'base')).toBe(true);
  });
});

describe('SyncQueue', () => {
  it('enqueue + dequeue + size + remove + clear', () => {
    const q = new SyncQueue();
    const id1 = q.enqueue('create', { x: 1 });
    q.enqueue('update', { x: 2 });
    expect(q.size()).toBe(2);
    const first = q.dequeue();
    expect(first?.id).toBe(id1);
    expect(q.size()).toBe(1);
    expect(q.peek()).toHaveLength(1);
    expect(q.remove(id1)).toBe(false);
    expect(q.clear()).toBeUndefined();
    expect(q.size()).toBe(0);
  });
});

describe('OperationLog', () => {
  it('record + entries + byOp + count + clear', () => {
    const log = new OperationLog();
    log.record('create', { x: 1 });
    log.record('update', { x: 2 });
    log.record('create', { x: 3 });
    expect(log.count()).toBe(3);
    expect(log.byOp('create')).toHaveLength(2);
    expect(log.entries()[0].op).toBe('create');
    log.clear();
    expect(log.count()).toBe(0);
  });
});

describe('SnapshotManager', () => {
  it('save + load + age + has + delete + count + list', () => {
    const s = new SnapshotManager();
    s.save('a', 'content');
    expect(s.load('a')).toBe('content');
    expect(s.age('a')).toBeGreaterThanOrEqual(0);
    expect(s.has('a')).toBe(true);
    expect(s.list()).toEqual(['a']);
    expect(s.count()).toBe(1);
    expect(s.delete('a')).toBe(true);
    expect(s.load('missing')).toBeNull();
    expect(s.age('missing')).toBe(-1);
  });
});

describe('OfflineEditCoreIndex', () => {
  it('list has 10', () => {
    expect(new OfflineEditCoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new OfflineEditCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('OfflineDocument')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CM_BATCH_1_ENGINES const has 10', () => {
    expect(CM_BATCH_1_ENGINES).toHaveLength(10);
  });
});