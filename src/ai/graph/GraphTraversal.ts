// V2179 GraphTraversal - Direction G Iter 4/30
// BFS/DFS graph traversal with depth limit
// Source: thunderbolt
export type TraversalKind = 'bfs' | 'dfs';

export interface TraversalState {
  visited: Set<string>;
  order: string[];
  edges: { from: string; to: string }[];
}

export function createTraversalState(): TraversalState {
  return { visited: new Set(), order: [], edges: [] };
}

export function traverse(
  storage: import('./GraphStorage').GraphStorageState,
  startId: string,
  kind: TraversalKind,
  maxDepth = 5
): TraversalState {
  const state = createTraversalState();
  if (!storage.nodes.has(startId)) return state;
  if (kind === 'bfs') bfs(storage, startId, maxDepth, state);
  else dfs(storage, startId, maxDepth, state);
  return state;
}

function bfs(storage: import('./GraphStorage').GraphStorageState, start: string, maxDepth: number, state: TraversalState): void {
  const queue: { id: string; depth: number }[] = [{ id: start, depth: 0 }];
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (state.visited.has(id)) continue;
    state.visited.add(id);
    state.order.push(id);
    if (depth >= maxDepth) continue;
    const next = storage.adj.get(id) || [];
    for (const n of next) {
      if (!state.visited.has(n)) {
        state.edges.push({ from: id, to: n });
        queue.push({ id: n, depth: depth + 1 });
      }
    }
  }
}

function dfs(storage: import('./GraphStorage').GraphStorageState, start: string, maxDepth: number, state: TraversalState): void {
  const stack: { id: string; depth: number }[] = [{ id: start, depth: 0 }];
  while (stack.length > 0) {
    const { id, depth } = stack.pop()!;
    if (state.visited.has(id)) continue;
    state.visited.add(id);
    state.order.push(id);
    if (depth >= maxDepth) continue;
    const next = storage.adj.get(id) || [];
    for (const n of next) {
      if (!state.visited.has(n)) {
        state.edges.push({ from: id, to: n });
        stack.push({ id: n, depth: depth + 1 });
      }
    }
  }
}

export function shortestPath(storage: import('./GraphStorage').GraphStorageState, fromId: string, toId: string): string[] {
  if (fromId === toId) return [fromId];
  const visited = new Set<string>([fromId]);
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];
  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const next = storage.adj.get(id) || [];
    for (const n of next) {
      if (visited.has(n)) continue;
      const newPath = [...path, n];
      if (n === toId) return newPath;
      visited.add(n);
      queue.push({ id: n, path: newPath });
    }
  }
  return [];
}

export function reachableFrom(storage: import('./GraphStorage').GraphStorageState, startId: string, maxDepth = 10): string[] {
  return traverse(storage, startId, 'bfs', maxDepth).order;
}

export function graphTraversalHealth(state: TraversalState): { visited: number; depth: number; health: number } {
  return { visited: state.visited.size, depth: state.order.length, health: state.order.length > 0 ? 1 : 0 };
}
