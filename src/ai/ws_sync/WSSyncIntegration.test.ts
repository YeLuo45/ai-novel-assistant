// Round 8 Direction CC — WebSocket Real-time Sync 2.0 Batch 3/3 test
// V4666-V4675: 10 engines + integration demo

import { describe, it, expect } from 'vitest';
import {
  SyncSession, EndpointRegistry, SyncRoom, PresenceBeacon,
  DocumentSync, CursorSync, AwarenessProtocol, BackoffRetry,
  PartialDiffSync, SyncIntegration,
  WSSyncIntegrationIndex, WSSyncMasterIndex, WS_SYNC_BATCH_3_ENGINES,
} from './WSSyncIntegration';
import { WS_SYNC_BATCH_1_ENGINES } from './WSSyncCore';
import { WS_SYNC_BATCH_2_ENGINES } from './WSSyncAdvanced';

describe('V4666 SyncSession', () => {
  it('construct with config sets up all engines', () => {
    const s = new SyncSession('s1', { maxConnections: 5, heartbeatMs: 1000, bandwidthWindowMs: 1000 });
    expect(s.id).toBe('s1');
    expect(s.codec).toBeDefined();
    expect(s.metrics).toBeDefined();
  });

  it('age returns positive', () => {
    const s = new SyncSession('s1', { maxConnections: 5, heartbeatMs: 1000, bandwidthWindowMs: 1000 });
    expect(s.age()).toBeGreaterThanOrEqual(0);
  });
});

describe('V4667 EndpointRegistry', () => {
  it('register and route', () => {
    const r = new EndpointRegistry();
    r.register({ path: '/sync', method: 'POST', handler: (p) => p });
    expect(r.route('/sync', 'POST')).toBeDefined();
    expect(r.route('/sync', 'GET')).toBeUndefined();
  });

  it('paths returns unique', () => {
    const r = new EndpointRegistry();
    r.register({ path: '/a', method: 'GET', handler: () => '' });
    r.register({ path: '/a', method: 'POST', handler: () => '' });
    expect(r.paths().length).toBe(1);
  });

  it('unregister removes', () => {
    const r = new EndpointRegistry();
    r.register({ path: '/x', method: 'GET', handler: () => '' });
    expect(r.unregister('/x', 'GET')).toBe(true);
    expect(r.size()).toBe(0);
  });
});

describe('V4668 SyncRoom', () => {
  it('join and leave', () => {
    const r = new SyncRoom('r1');
    r.join('u1');
    expect(r.size()).toBe(1);
    r.leave('u1');
    expect(r.size()).toBe(0);
  });

  it('heartbeat updates lastActiveAt', () => {
    const r = new SyncRoom('r1');
    r.join('u1');
    const before = r.members()[0].lastActiveAt;
    return new Promise<void>(resolve => {
      setTimeout(() => {
        r.heartbeat('u1');
        expect(r.members()[0].lastActiveAt).toBeGreaterThanOrEqual(before);
        resolve();
      }, 10);
    });
  });

  it('activeMembers filter idle', () => {
    const r = new SyncRoom('r1');
    r.join('u1');
    expect(r.activeMembers(0).length).toBe(0);
    r.heartbeat('u1');
    expect(r.activeMembers(5000).length).toBe(1);
  });

  it('evict removes idle', () => {
    const r = new SyncRoom('r1');
    r.join('u1');
    expect(r.evict(0)).toBe(1);
  });
});

describe('V4669 PresenceBeacon', () => {
  it('update and get', () => {
    const p = new PresenceBeacon();
    p.update('u1', 'online');
    expect(p.get('u1')?.status).toBe('online');
  });

  it('online filters status', () => {
    const p = new PresenceBeacon();
    p.update('u1', 'online');
    p.update('u2', 'away');
    p.update('u3', 'offline');
    expect(p.online().length).toBe(1);
    expect(p.away().length).toBe(1);
    expect(p.offline().length).toBe(1);
  });

  it('cleanup removes stale', () => {
    const p = new PresenceBeacon();
    p.update('u1', 'online');
    expect(p.cleanup(0)).toBe(1);
    expect(p.count()).toBe(0);
  });

  it('set updates existing', () => {
    const p = new PresenceBeacon();
    p.update('u1', 'online');
    p.set('u1', 'away');
    expect(p.get('u1')?.status).toBe('away');
  });
});

describe('V4670 DocumentSync', () => {
  it('initial version on construct', () => {
    const d = new DocumentSync('d1', 'init', 'a');
    expect(d.versionCount()).toBe(1);
  });

  it('update appends version', () => {
    const d = new DocumentSync('d1', 'a', 'a');
    d.update('b', 'u');
    expect(d.versionCount()).toBe(2);
  });

  it('applyRemote with correct version', () => {
    const d = new DocumentSync('d1', 'a', 'a');
    const ok = d.applyRemote({ version: 2, content: 'b', author: 'u', timestamp: 1 });
    expect(ok).toBe(true);
    expect(d.versionCount()).toBe(2);
  });

  it('applyRemote rejects out-of-order', () => {
    const d = new DocumentSync('d1', 'a', 'a');
    const ok = d.applyRemote({ version: 5, content: 'b', author: 'u', timestamp: 1 });
    expect(ok).toBe(false);
  });
});

describe('V4671 CursorSync', () => {
  it('update and get', () => {
    const c = new CursorSync();
    c.update({ userId: 'u1', x: 10, y: 20 });
    const pos = c.get('u1');
    expect(pos?.x).toBe(10);
  });

  it('all returns active', () => {
    const c = new CursorSync(5000);
    c.update({ userId: 'u1', x: 1, y: 2 });
    c.update({ userId: 'u2', x: 3, y: 4 });
    expect(c.all().length).toBe(2);
  });

  it('expired cursor returns undefined', () => {
    const c = new CursorSync(50);
    c.update({ userId: 'u1', x: 1, y: 2 });
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(c.get('u1')).toBeUndefined();
        resolve();
      }, 100);
    });
  });

  it('remove deletes cursor', () => {
    const c = new CursorSync();
    c.update({ userId: 'u1', x: 1, y: 2 });
    c.remove('u1');
    expect(c.size()).toBe(0);
  });
});

describe('V4672 AwarenessProtocol', () => {
  it('setState and getState', () => {
    const a = new AwarenessProtocol();
    a.setState({ userId: 'u1', status: 'focused', activity: 'editing', updatedAt: 0 });
    expect(a.getState('u1')?.activity).toBe('editing');
  });

  it('statesForActivity filters', () => {
    const a = new AwarenessProtocol();
    a.setState({ userId: 'u1', status: 'focused', activity: 'editing', updatedAt: 0 });
    a.setState({ userId: 'u2', status: 'focused', activity: 'reading', updatedAt: 0 });
    expect(a.statesForActivity('editing').length).toBe(1);
  });

  it('focused and unfocused counts', () => {
    const a = new AwarenessProtocol();
    a.setState({ userId: 'u1', status: 'focused', activity: 'a', updatedAt: 0 });
    a.setState({ userId: 'u2', status: 'unfocused', activity: 'a', updatedAt: 0 });
    expect(a.focused().length).toBe(1);
    expect(a.unfocused().length).toBe(1);
  });
});

describe('V4673 BackoffRetry', () => {
  it('run succeeds first try', async () => {
    const r = new BackoffRetry();
    const result = await r.run(async () => 42);
    expect(result).toBe(42);
  });

  it('run retries on failure', async () => {
    const r = new BackoffRetry(3, 1);
    let attempts = 0;
    try {
      await r.run(async () => { attempts++; throw new Error('fail'); });
    } catch (e) {
      expect(attempts).toBe(3);
    }
  });

  it('reset clears attempts', () => {
    const r = new BackoffRetry();
    r.reset();
    expect(r.attempt()).toBe(0);
  });
});

describe('V4674 PartialDiffSync', () => {
  it('computeDiff returns changed lines', () => {
    const d = new PartialDiffSync();
    const diff = d.computeDiff('a\nb\nc', 'a\nB\nc');
    expect(diff.length).toBe(1);
    expect(diff[0].index).toBe(1);
    expect(diff[0].line).toBe('B');
  });

  it('applyDiff restores', () => {
    const d = new PartialDiffSync();
    const diff = d.computeDiff('a\nb\nc', 'a\nB\nc');
    expect(d.applyDiff('a\nb\nc', diff)).toBe('a\nB\nc');
  });

  it('diffSize sums lengths', () => {
    const d = new PartialDiffSync();
    const size = d.diffSize([{ index: 0, line: 'hello' }, { index: 1, line: 'world' }]);
    expect(size).toBe(10);
  });

  it('compressionRatio < 1 for partial change', () => {
    const d = new PartialDiffSync();
    const ratio = d.compressionRatio('a\nb\nc\nd\ne', 'a\nb\nC\nd\ne');
    expect(ratio).toBeLessThan(1);
  });
});

describe('V4675 SyncIntegration end-to-end demo', () => {
  it('runDemo completes workflow', () => {
    const s = new SyncIntegration({ maxConnections: 5, heartbeatMs: 1000, bandwidthWindowMs: 1000 });
    const result = s.runDemo();
    expect(result.roomCount).toBeGreaterThan(0);
    expect(result.docVersions).toBeGreaterThan(0);
    expect(result.endpoints).toBeGreaterThan(0);
    expect(result.metrics.counters['demo_runs']).toBe(1);
  });

  it('exposes all sub-engines', () => {
    const s = new SyncIntegration({ maxConnections: 5, heartbeatMs: 1000, bandwidthWindowMs: 1000 });
    expect(s.session()).toBeDefined();
    expect(s.endpoints()).toBeDefined();
    expect(s.presence()).toBeDefined();
    expect(s.cursors()).toBeDefined();
    expect(s.awareness()).toBeDefined();
    expect(s.partialDiff()).toBeDefined();
  });

  it('createRoom and getRoom', () => {
    const s = new SyncIntegration({ maxConnections: 5, heartbeatMs: 1000, bandwidthWindowMs: 1000 });
    s.createRoom('r1');
    expect(s.getRoom('r1')).toBeDefined();
  });

  it('createDocument and getDocument', () => {
    const s = new SyncIntegration({ maxConnections: 5, heartbeatMs: 1000, bandwidthWindowMs: 1000 });
    s.createDocument('d1', 'content');
    expect(s.getDocument('d1')?.current().content).toBe('content');
  });
});

describe('WSSyncIntegrationIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new WSSyncIntegrationIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new WSSyncIntegrationIndex();
    expect(idx.has('SyncSession')).toBe(true);
    expect(idx.has('WSSyncIntegrationIndex')).toBe(true);
  });

  it('WS_SYNC_BATCH_3_ENGINES has 10 entries', () => {
    expect(WS_SYNC_BATCH_3_ENGINES.length).toBe(10);
  });
});

describe('WSSyncMasterIndex', () => {
  it('list includes 31 entries', () => {
    const idx = new WSSyncMasterIndex();
    expect(idx.list().length).toBe(31);
    expect(idx.count()).toBe(31);
  });

  it('has() checks all batch engines', () => {
    const idx = new WSSyncMasterIndex();
    expect(idx.has('BinaryFrameCodec')).toBe(true);
    expect(idx.has('AdaptiveRateLimiter')).toBe(true);
    expect(idx.has('SyncSession')).toBe(true);
    expect(idx.has('WSSyncMasterIndex')).toBe(true);
    expect(idx.has('NonExistent')).toBe(false);
  });

  it('all 3 batches have 10 each', () => {
    expect(WS_SYNC_BATCH_1_ENGINES.length).toBe(10);
    expect(WS_SYNC_BATCH_2_ENGINES.length).toBe(10);
    expect(WS_SYNC_BATCH_3_ENGINES.length).toBe(10);
  });
});