// V2117 SharedWorkerRouter - Direction A Iter 2/30
// SharedWorker 路由 - 多标签页同步协调
// Source: thunderbolt (SharedWorker + multi-tab sync)

export type TabAspect = 'leader' | 'follower' | 'standby' | 'closed';

/**
 * Tab connection - represents a browser tab/client in the sync mesh
 */
export interface TabConnection {
  tabId: string;
  aspect: TabAspect;
  connectedAt: number;
  lastHeartbeat: number;
  messageCount: number;
  channelLatencyMs: number;
}

export interface RouterConfig {
  heartbeatIntervalMs: number;
  leaderTimeoutMs: number;
  maxTabs: number;
}

export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  heartbeatIntervalMs: 5000,
  leaderTimeoutMs: 15000,
  maxTabs: 8,
};

export function createRouterState(): { tabs: TabConnection[]; config: RouterConfig } {
  return { tabs: [], config: { ...DEFAULT_ROUTER_CONFIG } };
}

/** Register a new tab; first tab is auto-leader */
export function registerTab(
  state: { tabs: TabConnection[]; config: RouterConfig },
  tabId: string
): { tabs: TabConnection[]; config: RouterConfig } {
  if (state.tabs.some((t) => t.tabId === tabId)) return state;
  if (state.tabs.length >= state.config.maxTabs) return state;
  const isFirst = state.tabs.length === 0;
  const tab: TabConnection = {
    tabId,
    aspect: isFirst ? 'leader' : 'follower',
    connectedAt: Date.now(),
    lastHeartbeat: Date.now(),
    messageCount: 0,
    channelLatencyMs: 0,
  };
  return { ...state, tabs: [...state.tabs, tab] };
}

/** Record heartbeat from a tab */
export function recordHeartbeat(
  state: { tabs: TabConnection[]; config: RouterConfig },
  tabId: string,
  latencyMs = 0
): { tabs: TabConnection[]; config: RouterConfig } {
  return {
    ...state,
    tabs: state.tabs.map((t) =>
      t.tabId === tabId
        ? { ...t, lastHeartbeat: Date.now(), channelLatencyMs: latencyMs }
        : t
    ),
  };
}

/** Elect a new leader if current leader timed out */
export function electLeader(
  state: { tabs: TabConnection[]; config: RouterConfig },
  now = Date.now()
): { tabs: TabConnection[]; config: RouterConfig } {
  const leader = state.tabs.find((t) => t.aspect === 'leader');
  if (leader && now - leader.lastHeartbeat <= state.config.leaderTimeoutMs) {
    return state;
  }
  const fallback = state.tabs
    .filter((t) => t.aspect !== 'closed')
    .sort((a, b) => a.connectedAt - b.connectedAt)[0];
  if (!fallback) return state;
  return {
    ...state,
    tabs: state.tabs.map((t) => ({
      ...t,
      aspect: t.tabId === fallback.tabId ? 'leader' : 'follower',
    })),
  };
}

/** Unregister a tab; promote new leader if needed */
export function unregisterTab(
  state: { tabs: TabConnection[]; config: RouterConfig },
  tabId: string
): { tabs: TabConnection[]; config: RouterConfig } {
  const removed = state.tabs.find((t) => t.tabId === tabId);
  const tabs = state.tabs.filter((t) => t.tabId !== tabId);
  let next = { ...state, tabs };
  if (removed && removed.aspect === 'leader') {
    next = electLeader(next);
  }
  return next;
}

/** Count broadcast messages received */
export function countBroadcast(
  state: { tabs: TabConnection[]; config: RouterConfig },
  tabId: string
): { tabs: TabConnection[]; config: RouterConfig } {
  return {
    ...state,
    tabs: state.tabs.map((t) =>
      t.tabId === tabId ? { ...t, messageCount: t.messageCount + 1 } : t
    ),
  };
}

/** Get master health metric for router mesh */
export function routerHealth(state: { tabs: TabConnection[]; config: RouterConfig }): {
  activeTabs: number;
  leaderPresent: boolean;
  avgLatency: number;
  healthScore: number;
} {
  const active = state.tabs.filter((t) => t.aspect !== 'closed');
  const leader = active.find((t) => t.aspect === 'leader');
  const avgLatency =
    active.length > 0
      ? active.reduce((s, t) => s + t.channelLatencyMs, 0) / active.length
      : 0;
  const healthScore = Math.min(1, active.length / 3) * (leader ? 1 : 0.3);
  return {
    activeTabs: active.length,
    leaderPresent: !!leader,
    avgLatency,
    healthScore,
  };
}
