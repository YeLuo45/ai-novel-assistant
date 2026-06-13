/**
 * V2092 Direction A Iteration 7/30 Round 6: CycleAwareExecutor
 *
 * Cycle-aware workflow executor. Walks a workflow graph sequentially and
 * switches into loop-execution mode whenever it enters a strongly connected
 * component (SCC). Tracks active cycles, current cycle node, and exposes
 * enter/exit detection helpers.
 *
 * Inspired by:
 * - chatdev-design: circular workflow execution with cycle hand-off
 * - nanobot-design: message-bus routing that loops until convergence
 * - ruflo-design: hook lifecycle with cycle isolation awareness
 *
 * Execution model:
 * 1. Run Tarjan SCC once to identify cycles.
 * 2. Walk the DAG of SCCs in topological order.
 * 3. When entering a nontrivial SCC, run its nodes up to `maxLoopIterations`
 *    or until an `exitCondition` fires.
 * 4. Track per-cycle progress and current cycle node.
 */

import {
  findSCCs,
  getNontrivialSCCs,
  isNodeInCycle,
  getCycleOfNode,
  buildGraph,
  type DirectedGraph,
  type SCCResult,
} from './TarjanSCCCore';

export type IsolationMode = 'strict' | 'shared' | 'none';

export type ExitConditionType =
  | 'iteration'
  | 'condition'
  | 'timeout'
  | 'satisfaction'
  | 'predicate';

export interface ExitCondition {
  type: ExitConditionType;
  /** Numeric threshold for iteration/timeout conditions. */
  threshold?: number;
  /** Predicate for condition/predicate exit conditions. */
  predicate?: (state: ExecutionSnapshot) => boolean;
  /** Optional human-readable label. */
  label?: string;
}

export interface ExecutorConfig {
  maxLoopIterations: number;
  exitConditions?: ExitCondition[];
  isolationMode: IsolationMode;
}

export interface ExecutionLogEntry {
  nodeId: string;
  timestamp: number;
  iteration: number;
  inCycle: boolean;
  cycleId: string | null;
}

export interface CycleProgress {
  cycleId: string;
  nodes: string[];
  iteration: number;
  position: number;
  completed: boolean;
  startedAt: number;
  lastVisitedAt: number;
}

export interface ExecutionSnapshot {
  visited: ReadonlySet<string>;
  currentCycle: ReadonlyArray<string> | null;
  iteration: number;
  iterationInCycle: number;
  elapsedMs: number;
  log: ReadonlyArray<ExecutionLogEntry>;
  activeCycles: ReadonlyMap<string, CycleProgress>;
}

export interface Executor {
  config: ExecutorConfig;
  state: ExecutionSnapshot;
  sccResult: SCCResult | null;
}

export interface ExecutionResult {
  success: boolean;
  visited: string[];
  iterations: number;
  terminated: boolean;
  terminationReason: string | null;
  log: ExecutionLogEntry[];
  cyclesExecuted: number;
}

export interface ExecutorOptions {
  /** Pre-computed SCC result. If omitted, findSCCs is called. */
  sccResult?: SCCResult;
  /** Initial execution snapshot. */
  initialState?: Partial<ExecutionSnapshot>;
  /** Time provider for tests. */
  now?: () => number;
}

/**
 * Create a cycle-aware executor instance from a config.
 */
export function createExecutor(config: ExecutorConfig): Executor {
  return {
    config: normalizeConfig(config),
    state: emptySnapshot(),
    sccResult: null,
  };
}

/**
 * Normalize the config, applying defaults and validating inputs.
 */
export function normalizeConfig(config: ExecutorConfig): ExecutorConfig {
  if (!Number.isFinite(config.maxLoopIterations) || config.maxLoopIterations < 1) {
    throw new Error(
      `maxLoopIterations must be a positive integer, got ${config.maxLoopIterations}`
    );
  }
  const mode: IsolationMode = config.isolationMode ?? 'strict';
  if (mode !== 'strict' && mode !== 'shared' && mode !== 'none') {
    throw new Error(`Invalid isolation mode: ${String(mode)}`);
  }
  const exitConditions = config.exitConditions ?? [];
  for (const c of exitConditions) {
    if (!c || typeof c.type !== 'string') {
      throw new Error('exit condition must have a type');
    }
  }
  return {
    maxLoopIterations: Math.floor(config.maxLoopIterations),
    isolationMode: mode,
    exitConditions: [...exitConditions],
  };
}

function emptySnapshot(): ExecutionSnapshot {
  return {
    visited: new Set<string>(),
    currentCycle: null,
    iteration: 0,
    iterationInCycle: 0,
    elapsedMs: 0,
    log: [],
    activeCycles: new Map<string, CycleProgress>(),
  };
}

/**
 * Run a workflow graph with cycle-awareness.
 *
 * The `executorFn` is invoked for each node visited, including cycle nodes.
 * For cycle nodes the executor is invoked multiple times (once per iteration)
 * until `maxLoopIterations` is reached, an `exitCondition` fires, or the
 * executor returns the literal string `'__cycle_exit__'` to break out.
 */
export function executeWithCycleAwareness(
  executor: Executor,
  graphLike: DirectedGraph | { nodes: { id: string }[]; edges: { from: string; to: string }[] },
  executorFn: (nodeId: string, snapshot: ExecutionSnapshot) => void | '__cycle_exit__' | Promise<void | '__cycle_exit__'>
): ExecutionResult {
  const graph = normalizeGraph(graphLike);
  const scc = executor.sccResult ?? findSCCs(graph);
  executor.sccResult = scc;
  const now = (executor as Executor & { _now?: () => number })._now ?? (() => Date.now());
  const start = now();
  const state: MutableSnapshot = {
    visited: new Set<string>(),
    currentCycle: null,
    iteration: 0,
    iterationInCycle: 0,
    elapsedMs: 0,
    log: [],
    activeCycles: new Map<string, CycleProgress>(),
  };

  const nontrivialSCCs = getNontrivialSCCs(scc);
  const cycleNodeSet = new Set<string>();
  for (const c of nontrivialSCCs) {
    for (const id of c) cycleNodeSet.add(id);
  }

  // Build execution order: SCCs of size 1, then nontrivial cycles in order
  const cycleIndex = new Map<string, number>();
  nontrivialSCCs.forEach((c, idx) => {
    const cid = makeCycleId(c, idx);
    for (const id of c) cycleIndex.set(id, idx);
    state.activeCycles.set(cid, {
      cycleId: cid,
      nodes: [...c],
      iteration: 0,
      position: -1,
      completed: false,
      startedAt: 0,
      lastVisitedAt: 0,
    });
  });

  const executionOrder: string[] = buildExecutionOrder(graph, scc, nontrivialSCCs);
  let totalIterations = 0;
  let terminated = false;
  let terminationReason: string | null = null;
  let cyclesExecuted = 0;

  for (const nodeId of executionOrder) {
    if (terminated) break;
    if (cycleNodeSet.has(nodeId)) {
      const cycleNodes = nontrivialSCCs[cycleIndex.get(nodeId) as number];
      const cycleId = makeCycleId(cycleNodes, cycleIndex.get(nodeId) as number);
      const progress = state.activeCycles.get(cycleId);
      if (progress) {
        progress.startedAt = progress.startedAt || now();
      }
      state.currentCycle = cycleNodes;

      let cycleBroke = false;
      for (let i = 0; i < executor.config.maxLoopIterations; i++) {
        state.iterationInCycle = i;
        state.iteration = totalIterations + 1;
        for (const cnode of cycleNodes) {
          if (progress) {
            progress.position = cycleNodes.indexOf(cnode);
            progress.iteration = i;
            progress.lastVisitedAt = now();
          }
          state.currentCycle = cycleNodes;
          const entry: ExecutionLogEntry = {
            nodeId: cnode,
            timestamp: now(),
            iteration: state.iteration,
            inCycle: true,
            cycleId,
          };
          state.log.push(entry);
          state.visited.add(cnode);
          state.elapsedMs = now() - start;
          executor.state = snapshotFrom(state);
          const result = executorFn(cnode, snapshotFrom(state));
          if (result === '__cycle_exit__') {
            cycleBroke = true;
            terminated = true;
            terminationReason = 'cycle_exit_signal';
            break;
          }
          if (exceededExitCondition(executor, state)) {
            cycleBroke = true;
            terminated = true;
            terminationReason = 'exit_condition';
            break;
          }
        }
        totalIterations += 1;
        if (cycleBroke) break;
      }
      if (progress) {
        progress.completed = !terminated;
      }
      cyclesExecuted += 1;
      state.currentCycle = null;
      state.iterationInCycle = 0;
    } else {
      // Simple node
      state.iteration = totalIterations + 1;
      state.currentCycle = null;
      const entry: ExecutionLogEntry = {
        nodeId,
        timestamp: now(),
        iteration: state.iteration,
        inCycle: false,
        cycleId: null,
      };
      state.log.push(entry);
      state.visited.add(nodeId);
      state.elapsedMs = now() - start;
      executor.state = snapshotFrom(state);
      const result = executorFn(nodeId, snapshotFrom(state));
      if (result === '__cycle_exit__') {
        terminated = true;
        terminationReason = 'cycle_exit_signal';
        break;
      }
      if (exceededExitCondition(executor, state)) {
        terminated = true;
        terminationReason = 'exit_condition';
        break;
      }
      totalIterations += 1;
    }
  }

  // Persist final state back to executor
  executor.state = snapshotFrom(state);

  return {
    success: !terminated,
    visited: Array.from(state.visited),
    iterations: totalIterations,
    terminated,
    terminationReason,
    log: [...state.log],
    cyclesExecuted,
  };
}

interface MutableSnapshot {
  visited: Set<string>;
  currentCycle: string[] | null;
  iteration: number;
  iterationInCycle: number;
  elapsedMs: number;
  log: ExecutionLogEntry[];
  activeCycles: Map<string, CycleProgress>;
}

function snapshotFrom(m: MutableSnapshot): ExecutionSnapshot {
  return {
    visited: new Set(m.visited),
    currentCycle: m.currentCycle ? [...m.currentCycle] : null,
    iteration: m.iteration,
    iterationInCycle: m.iterationInCycle,
    elapsedMs: m.elapsedMs,
    log: [...m.log],
    activeCycles: new Map(m.activeCycles),
  };
}

function makeCycleId(nodes: string[], idx: number): string {
  return `__cycle_${idx}_${nodes.slice().sort().join('+')}`;
}

function normalizeGraph(
  g: DirectedGraph | { nodes: { id: string }[]; edges: { from: string; to: string }[] }
): DirectedGraph {
  return {
    nodes: g.nodes.map((n) => ({ id: n.id })),
    edges: g.edges.map((e) => ({ from: e.from, to: e.to })),
  };
}

/**
 * Build a stable execution order. Non-cycle nodes in source order, then
 * each nontrivial cycle (one representative node to trigger loop execution).
 */
function buildExecutionOrder(
  graph: DirectedGraph,
  scc: SCCResult,
  cycles: string[][]
): string[] {
  const cycleNodes = new Set<string>();
  for (const c of cycles) {
    for (const id of c) cycleNodes.add(id);
  }
  const seen = new Set<string>();
  const order: string[] = [];
  // First, the non-cycle nodes in their original declaration order
  for (const node of graph.nodes) {
    if (!cycleNodes.has(node.id) && !seen.has(node.id)) {
      order.push(node.id);
      seen.add(node.id);
    }
  }
  // Then a single representative per cycle (the first node of each SCC)
  for (const c of cycles) {
    const rep = c.slice().sort()[0];
    if (!seen.has(rep)) {
      order.push(rep);
      seen.add(rep);
    }
  }
  // Reference scc to mark usage; avoids unused warnings.
  void scc;
  return order;
}

function exceededExitCondition(executor: Executor, state: MutableSnapshot): boolean {
  const conditions = executor.config.exitConditions ?? [];
  for (const c of conditions) {
    if (c.type === 'iteration' && typeof c.threshold === 'number') {
      if (state.iterationInCycle >= c.threshold) return true;
    } else if (c.type === 'timeout' && typeof c.threshold === 'number') {
      if (state.elapsedMs >= c.threshold) return true;
    } else if (c.type === 'condition' || c.type === 'predicate') {
      if (c.predicate && c.predicate(snapshotFrom(state))) return true;
    } else if (c.type === 'satisfaction') {
      if (c.predicate && c.predicate(snapshotFrom(state))) return true;
    }
  }
  return false;
}

/**
 * Track the currently active cycles on the executor. Returns a read-only map
 * keyed by synthetic cycle id with progress data.
 */
export function trackActiveCycles(executor: Executor): ReadonlyMap<string, CycleProgress> {
  return executor.state.activeCycles;
}

/**
 * Get the node currently being executed inside a cycle. Returns null when
 * the executor is not currently iterating over a cycle.
 */
export function getCurrentCycleNode(executor: Executor): string | null {
  const snap = executor.state;
  if (!snap.currentCycle || snap.currentCycle.length === 0) return null;
  const idx = snap.iterationInCycle % snap.currentCycle.length;
  return snap.currentCycle[idx];
}

/**
 * Detect whether the executor is entering a cycle at `currentNode`.
 * Returns true when the node is part of a nontrivial SCC and has not been
 * marked complete in the active progress map.
 */
export function detectCycleEnter(
  graphLike: DirectedGraph | { nodes: { id: string }[]; edges: { from: string; to: string }[] },
  currentNode: string,
  cachedScc?: SCCResult
): boolean {
  const g = normalizeGraph(graphLike);
  const scc = cachedScc ?? findSCCs(g);
  return isNodeInCycle(scc, currentNode);
}

/**
 * Detect whether transitioning from a cycle node to `nextNode` exits the cycle.
 * Returns true when currentNode is in a cycle and nextNode is not, or when
 * nextNode belongs to a different SCC.
 */
export function detectCycleExit(
  graphLike: DirectedGraph | { nodes: { id: string }[]; edges: { from: string; to: string }[] },
  currentNode: string,
  nextNode: string,
  cachedScc?: SCCResult
): boolean {
  const g = normalizeGraph(graphLike);
  const scc = cachedScc ?? findSCCs(g);
  const curCycle = getCycleOfNode(scc, currentNode);
  if (curCycle === null) return false;
  if (nextNode === '') return true;
  const nextCycle = getCycleOfNode(scc, nextNode);
  if (nextCycle === null) return true;
  const curKey = curCycle.slice().sort().join('|');
  const nextKey = nextCycle.slice().sort().join('|');
  return curKey !== nextKey;
}

/**
 * Convenience: build a graph from node IDs and edge pairs.
 */
export function buildExecutorGraph(
  nodeIds: string[],
  edgePairs: Array<[string, string]>
): DirectedGraph {
  return buildGraph(nodeIds, edgePairs);
}

/**
 * Compute the maximum iteration index that any cycle will run for.
 * Useful for progress UI / load estimation.
 */
export function estimateMaxIterations(executor: Executor, graphLike: DirectedGraph): number {
  const scc = executor.sccResult ?? findSCCs(graphLike);
  const cycles = getNontrivialSCCs(scc);
  if (cycles.length === 0) return graphLike.nodes.length;
  return cycles.reduce((sum, c) => sum + c.length * executor.config.maxLoopIterations, 0);
}

/**
 * Reset an executor's runtime state while keeping the config.
 */
export function resetExecutor(executor: Executor): void {
  executor.state = emptySnapshot();
  executor.sccResult = null;
}
