// V2249 CacheWarming - Direction I Iter 14/30
// Cache prewarming for known hot keys
// Source: nanobot
export interface WarmingTask {
  taskId: string;
  key: string;
  status: 'pending' | 'warming' | 'warmed' | 'failed';
  ts: number;
}

export interface CacheWarmingState {
  tasks: Map<string, WarmingTask>;
  warmedKeys: Set<string>;
  totalWarmed: number;
}

export function createCacheWarmingState(): CacheWarmingState {
  return { tasks: new Map(), warmedKeys: new Set(), totalWarmed: 0 };
}

export function addWarmingTask(state: CacheWarmingState, taskId: string, key: string): CacheWarmingState {
  const tasks = new Map(state.tasks);
  tasks.set(taskId, { taskId, key, status: 'pending', ts: Date.now() });
  return { ...state, tasks };
}

export function startWarming(state: CacheWarmingState, taskId: string): CacheWarmingState {
  const t = state.tasks.get(taskId);
  if (!t) return state;
  const tasks = new Map(state.tasks);
  tasks.set(taskId, { ...t, status: 'warming' });
  return { ...state, tasks };
}

export function completeWarming(state: CacheWarmingState, taskId: string): CacheWarmingState {
  const t = state.tasks.get(taskId);
  if (!t) return state;
  const tasks = new Map(state.tasks);
  tasks.set(taskId, { ...t, status: 'warmed' });
  const warmedKeys = new Set(state.warmedKeys);
  warmedKeys.add(t.key);
  return { ...state, tasks, warmedKeys, totalWarmed: state.totalWarmed + 1 };
}

export function failWarming(state: CacheWarmingState, taskId: string): CacheWarmingState {
  const t = state.tasks.get(taskId);
  if (!t) return state;
  const tasks = new Map(state.tasks);
  tasks.set(taskId, { ...t, status: 'failed' });
  return { ...state, tasks };
}

export function isWarmed(state: CacheWarmingState, key: string): boolean {
  return state.warmedKeys.has(key);
}

export function warmedCount(state: CacheWarmingState): number {
  return state.warmedKeys.size;
}

export function cacheWarmingHealth(state: CacheWarmingState): { tasks: number; warmed: number; health: number } {
  return { tasks: state.tasks.size, warmed: state.totalWarmed, health: state.totalWarmed > 0 ? 1 : 0.5 };
}
