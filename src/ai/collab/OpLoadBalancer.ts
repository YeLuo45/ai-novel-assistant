// V2220 OpLoadBalancer - Direction H Iter 15/30
// Load balance ops across workers
// Source: nanobot
export interface WorkerInfo {
  workerId: string;
  load: number;
  capacity: number;
}

export interface LoadBalancerState {
  workers: Map<string, WorkerInfo>;
  strategy: 'round_robin' | 'least_loaded' | 'random';
  counter: number;
}

export function createLoadBalancerState(strategy: 'round_robin' | 'least_loaded' | 'random' = 'least_loaded'): LoadBalancerState {
  return { workers: new Map(), strategy, counter: 0 };
}

export function addWorker(state: LoadBalancerState, workerId: string, capacity = 100): LoadBalancerState {
  if (state.workers.has(workerId)) return state;
  const workers = new Map(state.workers);
  workers.set(workerId, { workerId, load: 0, capacity });
  return { ...state, workers };
}

export function removeWorker(state: LoadBalancerState, workerId: string): LoadBalancerState {
  const workers = new Map(state.workers);
  workers.delete(workerId);
  return { ...state, workers };
}

export function updateWorkerLoad(state: LoadBalancerState, workerId: string, load: number): LoadBalancerState {
  const w = state.workers.get(workerId);
  if (!w) return state;
  const workers = new Map(state.workers);
  workers.set(workerId, { ...w, load });
  return { ...state, workers };
}

export function pickWorker(state: LoadBalancerState): string | null {
  if (state.workers.size === 0) return null;
  if (state.strategy === 'round_robin') {
    const list = Array.from(state.workers.keys());
    const idx = state.counter % list.length;
    return list[idx];
  }
  if (state.strategy === 'least_loaded') {
    return Array.from(state.workers.values()).reduce((min, w) => w.load / w.capacity < min.load / min.capacity ? w : min, Array.from(state.workers.values())[0]).workerId;
  }
  // random
  const list = Array.from(state.workers.keys());
  return list[Math.floor(Math.random() * list.length)];
}

export function assignOp(state: LoadBalancerState, opId: string): { state: LoadBalancerState; worker: string | null } {
  const w = pickWorker(state);
  if (!w) return { state, worker: null };
  const info = state.workers.get(w)!;
  return { state: updateWorkerLoad(state, w, info.load + 1), worker: w };
}

export function totalLoad(state: LoadBalancerState): number {
  return Array.from(state.workers.values()).reduce((s, w) => s + w.load, 0);
}

export function loadBalancerHealth(state: LoadBalancerState): { workers: number; totalLoad: number; health: number } {
  return { workers: state.workers.size, totalLoad: totalLoad(state), health: state.workers.size > 0 ? 1 : 0 };
}
