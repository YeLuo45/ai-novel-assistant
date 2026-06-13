// V2121 SyncQueue - Direction A Iter 6/30
// 同步队列 - 离线操作缓冲 + 重试
// Source: thunderbolt (offline-first queue)

export type QueueItemStatus = 'pending' | 'in_flight' | 'failed' | 'done';

export interface QueueItem {
  id: string;
  payload: unknown;
  status: QueueItemStatus;
  enqueuedAt: number;
  attempts: number;
  lastError?: string;
}

export interface SyncQueueState {
  items: QueueItem[];
  maxRetries: number;
  backoffMs: number;
}

export function createQueue(maxRetries = 3, backoffMs = 1000): SyncQueueState {
  return { items: [], maxRetries, backoffMs };
}

export function enqueue(state: SyncQueueState, id: string, payload: unknown): SyncQueueState {
  if (state.items.some((i) => i.id === id)) return state;
  return {
    ...state,
    items: [...state.items, { id, payload, status: 'pending', enqueuedAt: Date.now(), attempts: 0 }],
  };
}

export function dequeue(state: SyncQueueState, id: string): SyncQueueState {
  return { ...state, items: state.items.filter((i) => i.id !== id) };
}

export function markInFlight(state: SyncQueueState, id: string): SyncQueueState {
  return {
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, status: 'in_flight' as const, attempts: i.attempts + 1 } : i)),
  };
}

export function markFailed(state: SyncQueueState, id: string, err: string): SyncQueueState {
  return {
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, status: 'failed' as const, lastError: err } : i)),
  };
}

export function markDone(state: SyncQueueState, id: string): SyncQueueState {
  return {
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, status: 'done' as const } : i)),
  };
}

export function pendingItems(state: SyncQueueState): QueueItem[] {
  return state.items.filter((i) => i.status === 'pending' || i.status === 'failed');
}

export function shouldRetry(item: QueueItem, maxRetries: number): boolean {
  return item.status === 'failed' && item.attempts < maxRetries;
}

export function nextRetryDelay(item: QueueItem, backoffMs: number): number {
  return backoffMs * Math.pow(2, item.attempts - 1);
}

export function queueDepth(state: SyncQueueState): { pending: number; inFlight: number; failed: number; done: number } {
  return {
    pending: state.items.filter((i) => i.status === 'pending').length,
    inFlight: state.items.filter((i) => i.status === 'in_flight').length,
    failed: state.items.filter((i) => i.status === 'failed').length,
    done: state.items.filter((i) => i.status === 'done').length,
  };
}

export function purgeDone(state: SyncQueueState): SyncQueueState {
  return { ...state, items: state.items.filter((i) => i.status !== 'done') };
}
