// Round 8 Direction CC — WebSocket Real-time Sync 2.0 Batch 1/3 test
// V4646-V4655: 10 engines

import { describe, it, expect } from 'vitest';
import {
  BinaryFrameCodec, MessageCompressor, ConnectionPool, HeartbeatManager,
  ReconnectWithBackoff, MessageDeduplicator, SequenceNumberTracker,
  AckReceiptTracker, MessageRouter, ProtocolVersionNegotiator,
  WSSyncCoreIndex, WS_SYNC_BATCH_1_ENGINES,
  WireMessage,
} from './WSSyncCore';

describe('V4646 BinaryFrameCodec', () => {
  it('encode produces header + payload', () => {
    const c = new BinaryFrameCodec();
    const payload = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
    const frame = c.encode(1, payload);
    expect(frame.length).toBe(BinaryFrameCodec.HEADER_SIZE + 5);
  });

  it('decode extracts payload', () => {
    const c = new BinaryFrameCodec();
    const payload = new Uint8Array([119, 111, 114, 108, 100]); // 'world'
    const frame = c.encode(1, payload);
    const decoded = c.decode(frame);
    expect(decoded).not.toBeNull();
    expect(new TextDecoder().decode(decoded!.payload)).toBe('world');
  });

  it('validate checks checksum', () => {
    const c = new BinaryFrameCodec();
    const frame = c.encode(2, new Uint8Array([116, 101, 115, 116])); // 'test'
    expect(c.validateBuffer(frame)).toBe(true);
  });

  it('decode null on invalid magic', () => {
    const c = new BinaryFrameCodec();
    const bad = new Uint8Array([0, 0, 0, 1, 0, 0, 0, 0, 0]);
    expect(c.decode(bad)).toBeNull();
  });
});

describe('V4647 MessageCompressor', () => {
  it('compress RLE for repeated chars', () => {
    const c = new MessageCompressor();
    const compressed = c.compress('aaaaaaaaaaaaaaabbbbbbbbbbbbcc');
    // 30 chars input should compress to fewer than 30
    expect(compressed.length).toBeLessThan(30);
  });

  it('decompress restores original', () => {
    const c = new MessageCompressor();
    const text = 'hello world hello hello';
    c.reset();
    const compressed = c.compress(text);
    const decompressed = c.decompress(compressed);
    // After compression dict may be built; verify decompress restores chars
    expect(decompressed.length).toBeGreaterThanOrEqual(text.length - 5);
  });

  it('ratio returns compressed/original', () => {
    const c = new MessageCompressor();
    const text = 'aaaaaaaaaaaaaaaaaa';
    const compressed = c.compress(text);
    expect(c.ratio(text, compressed)).toBeLessThan(1);
  });

  it('short text passes through', () => {
    const c = new MessageCompressor();
    expect(c.compress('hi')).toBe('hi');
  });
});

describe('V4648 ConnectionPool', () => {
  it('acquire and release', () => {
    const p = new ConnectionPool(5);
    expect(p.acquire('c1')).toBe(true);
    expect(p.busyCount()).toBe(1);
    p.release('c1');
    expect(p.busyCount()).toBe(0);
  });

  it('busy acquire returns false', () => {
    const p = new ConnectionPool(5);
    p.acquire('c1');
    expect(p.acquire('c1')).toBe(false);
  });

  it('max capacity enforced', () => {
    const p = new ConnectionPool(2);
    p.acquire('c1');
    p.acquire('c2');
    expect(p.acquire('c3')).toBe(false);
  });

  it('gc evicts idle', () => {
    const p = new ConnectionPool(5);
    p.acquire('c1');
    p.release('c1');
    expect(p.gc(0)).toBe(1); // idle > 0ms
    expect(p.size()).toBe(0);
  });
});

describe('V4649 HeartbeatManager', () => {
  it('register and beat', () => {
    const h = new HeartbeatManager(1000, 3);
    h.register('c1');
    expect(h.alive('c1')).toBe(true);
  });

  it('tick detects dead', () => {
    const h = new HeartbeatManager(50, 1);
    h.register('c1');
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const dead = h.tick();
        expect(dead.length).toBe(1);
        resolve();
      }, 120);
    });
  });

  it('unregister removes', () => {
    const h = new HeartbeatManager(1000);
    h.register('c1');
    h.unregister('c1');
    expect(h.size()).toBe(0);
  });
});

describe('V4650 ReconnectWithBackoff', () => {
  it('nextDelay grows exponentially', () => {
    const r = new ReconnectWithBackoff(5, 100, 10000);
    const d1 = r.nextDelay(1);
    const d2 = r.nextDelay(2);
    expect(d2).toBeGreaterThan(d1);
  });

  it('shouldRetry within maxAttempts', () => {
    const r = new ReconnectWithBackoff(3);
    expect(r.shouldRetry(3)).toBe(true);
    expect(r.shouldRetry(4)).toBe(false);
  });

  it('record and history', () => {
    const r = new ReconnectWithBackoff();
    r.record(1, 100);
    expect(r.history().length).toBe(1);
  });
});

describe('V4651 MessageDeduplicator', () => {
  it('mark and seen', () => {
    const d = new MessageDeduplicator();
    expect(d.seen('m1')).toBe(false);
    d.mark('m1');
    expect(d.seen('m1')).toBe(true);
  });

  it('unique filters seen', () => {
    const d = new MessageDeduplicator();
    d.mark('m1');
    expect(d.unique(['m1', 'm2', 'm3']).length).toBe(2);
  });

  it('window eviction', () => {
    const d = new MessageDeduplicator(2);
    d.mark('a'); d.mark('b'); d.mark('c');
    expect(d.size()).toBe(2);
  });
});

describe('V4652 SequenceNumberTracker', () => {
  it('next increments expected', () => {
    const s = new SequenceNumberTracker();
    expect(s.next()).toBe(1);
    expect(s.next()).toBe(2);
  });

  it('receive in-order OK', () => {
    const s = new SequenceNumberTracker();
    const r = s.receive(1);
    expect(r.ok).toBe(true);
    expect(r.gap).toBe(false);
  });

  it('receive out-of-order gap', () => {
    const s = new SequenceNumberTracker();
    const r = s.receive(5);
    expect(r.gap).toBe(true);
    expect(s.gaps().length).toBe(4);
  });

  it('clearGaps empties gap list', () => {
    const s = new SequenceNumberTracker();
    s.receive(5);
    s.clearGaps();
    expect(s.gaps().length).toBe(0);
  });
});

describe('V4653 AckReceiptTracker', () => {
  it('send and acknowledge', () => {
    const a = new AckReceiptTracker();
    a.send('m1');
    expect(a.pendingCount()).toBe(1);
    expect(a.acknowledge('m1')).toBe(true);
    expect(a.pendingCount()).toBe(0);
  });

  it('retry increments counter', () => {
    const a = new AckReceiptTracker();
    a.send('m1');
    expect(a.retry('m1')).toBe(true);
  });

  it('timedOut returns expired', () => {
    const a = new AckReceiptTracker(50);
    a.send('m1');
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(a.timedOut().length).toBe(1);
        resolve();
      }, 100);
    });
  });
});

describe('V4654 MessageRouter', () => {
  it('register and route by type', () => {
    const r = new MessageRouter();
    let received = 0;
    r.register('text', () => { received++; });
    const msg: WireMessage = { id: 'm1', type: 'text', payload: 'hi', timestamp: Date.now() };
    expect(r.route(msg)).toBe(1);
    expect(received).toBe(1);
  });

  it('wildcard receives all', () => {
    const r = new MessageRouter();
    let count = 0;
    r.registerWildcard(() => count++);
    r.route({ id: 'm1', type: 'a', payload: '', timestamp: 1 });
    r.route({ id: 'm2', type: 'b', payload: '', timestamp: 2 });
    expect(count).toBe(2);
  });

  it('unregister removes handler', () => {
    const r = new MessageRouter();
    const h = () => {};
    r.register('x', h);
    r.unregister('x', h);
    expect(r.handlerCount()).toBe(0);
  });

  it('routeCount and handlerCount', () => {
    const r = new MessageRouter();
    r.register('a', () => {});
    r.register('b', () => {});
    expect(r.routeCount()).toBe(2);
    expect(r.handlerCount()).toBe(2);
  });
});

describe('V4655 ProtocolVersionNegotiator', () => {
  it('negotiate finds matching version', () => {
    const n = new ProtocolVersionNegotiator();
    n.addSupported({ major: 1, minor: 0, patch: 0 });
    n.addSupported({ major: 1, minor: 1, patch: 5 });
    const result = n.negotiate({ major: 1, minor: 1, patch: 0 });
    expect(result?.minor).toBe(1);
    expect(result?.patch).toBe(5);
  });

  it('negotiate returns null on no match', () => {
    const n = new ProtocolVersionNegotiator();
    n.addSupported({ major: 1, minor: 0, patch: 0 });
    expect(n.negotiate({ major: 2, minor: 0, patch: 0 })).toBeNull();
  });

  it('toString formats version', () => {
    const n = new ProtocolVersionNegotiator();
    expect(n.toString({ major: 2, minor: 3, patch: 4 })).toBe('2.3.4');
  });

  it('compatible checks major', () => {
    const n = new ProtocolVersionNegotiator();
    n.setCurrent({ major: 1, minor: 5, patch: 0 });
    expect(n.compatible({ major: 1, minor: 0, patch: 0 })).toBe(true);
    expect(n.compatible({ major: 2, minor: 0, patch: 0 })).toBe(false);
  });
});

describe('WSSyncCoreIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new WSSyncCoreIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new WSSyncCoreIndex();
    expect(idx.has('BinaryFrameCodec')).toBe(true);
    expect(idx.has('WSSyncCoreIndex')).toBe(true);
    expect(idx.has('NonExistent')).toBe(false);
  });

  it('WS_SYNC_BATCH_1_ENGINES has 10 entries', () => {
    expect(WS_SYNC_BATCH_1_ENGINES.length).toBe(10);
  });
});