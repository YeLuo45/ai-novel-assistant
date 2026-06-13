import { describe, it, expect } from 'vitest';
import {
  createRouterState,
  registerTab,
  recordHeartbeat,
  electLeader,
  unregisterTab,
  countBroadcast,
  routerHealth,
} from './SharedWorkerRouter';

describe('V2117 SharedWorkerRouter', () => {
  it('should initialize empty router state', () => {
    const s = createRouterState();
    expect(s.tabs).toEqual([]);
    expect(s.config.maxTabs).toBe(8);
  });

  it('should auto-elect first tab as leader', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    expect(s.tabs[0].aspect).toBe('leader');
  });

  it('should register followers', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    s = registerTab(s, 'tab2');
    expect(s.tabs[1].aspect).toBe('follower');
    expect(s.tabs).toHaveLength(2);
  });

  it('should record heartbeat with latency', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    s = recordHeartbeat(s, 'tab1', 42);
    expect(s.tabs[0].channelLatencyMs).toBe(42);
  });

  it('should elect new leader after timeout', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    s = registerTab(s, 'tab2');
    const future = Date.now() + 999999;
    s = electLeader(s, future);
    const leader = s.tabs.find((t) => t.aspect === 'leader');
    expect(leader?.tabId).toBe('tab1');
  });

  it('should unregister and promote new leader if needed', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    s = registerTab(s, 'tab2');
    s = unregisterTab(s, 'tab1');
    expect(s.tabs).toHaveLength(1);
    expect(s.tabs[0].aspect).toBe('leader');
  });

  it('should count broadcasts per tab', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    s = countBroadcast(s, 'tab1');
    s = countBroadcast(s, 'tab1');
    expect(s.tabs[0].messageCount).toBe(2);
  });

  it('should not register duplicate tab', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    s = registerTab(s, 'tab1');
    expect(s.tabs).toHaveLength(1);
  });

  it('should not exceed maxTabs limit', () => {
    let s = createRouterState();
    s = { ...s, config: { ...s.config, maxTabs: 2 } };
    s = registerTab(s, 'tab1');
    s = registerTab(s, 'tab2');
    s = registerTab(s, 'tab3');
    expect(s.tabs).toHaveLength(2);
  });

  it('should report health with leader presence and avg latency', () => {
    let s = createRouterState();
    s = registerTab(s, 'tab1');
    s = registerTab(s, 'tab2');
    s = recordHeartbeat(s, 'tab1', 10);
    s = recordHeartbeat(s, 'tab2', 30);
    const h = routerHealth(s);
    expect(h.activeTabs).toBe(2);
    expect(h.leaderPresent).toBe(true);
    expect(h.avgLatency).toBe(20);
    expect(h.healthScore).toBeGreaterThan(0);
  });
});
