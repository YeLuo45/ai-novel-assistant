/**
 * V2112 Direction A Iteration 27/30 Round 6: CycleDebugger
 *
 * Lightweight in-process cycle debugger. Captures snapshots of cycle
 * execution state, supports breakpoints, and replays recorded frames.
 *
 * Inspired by:
 * - claude-code-design: debug infrastructure
 * - nanobot-design: inspect / replay
 */

import { findSCCs, type DirectedGraph } from './TarjanSCCCore';

export interface DebugFrame {
  id: number;
  cycleId: string;
  iteration: number;
  currentNode: string | null;
  visitedNodes: string[];
  timestamp: number;
  note: string;
}

export interface DebugSnapshot {
  cycleId: string;
  frames: DebugFrame[];
  breakpoints: Set<string>;
  pausedAt: number | null;
}

export function createDebugger(cycleId: string): DebugSnapshot {
  return { cycleId, frames: [], breakpoints: new Set<string>(), pausedAt: null };
}

export function recordFrame(
  dbg: DebugSnapshot,
  currentNode: string | null,
  visitedNodes: string[],
  iteration: number,
  note: string = '',
  now: () => number = () => Date.now()
): DebugFrame {
  const frame: DebugFrame = {
    id: dbg.frames.length + 1,
    cycleId: dbg.cycleId,
    iteration,
    currentNode,
    visitedNodes: [...visitedNodes],
    timestamp: now(),
    note,
  };
  dbg.frames.push(frame);
  return frame;
}

export function setBreakpoint(dbg: DebugSnapshot, nodeId: string): void {
  dbg.breakpoints.add(nodeId);
}

export function clearBreakpoint(dbg: DebugSnapshot, nodeId: string): boolean {
  return dbg.breakpoints.delete(nodeId);
}

export function shouldPause(dbg: DebugSnapshot, currentNode: string | null): boolean {
  if (!currentNode) return false;
  return dbg.breakpoints.has(currentNode);
}

export function pause(dbg: DebugSnapshot, now: () => number = () => Date.now()): void {
  dbg.pausedAt = now();
}

export function resume(dbg: DebugSnapshot): void {
  dbg.pausedAt = null;
}

export function isPaused(dbg: DebugSnapshot, now: () => number = () => Date.now()): boolean {
  void now;
  return dbg.pausedAt !== null;
}

export function replayFrames(dbg: DebugSnapshot, from: number = 0): DebugFrame[] {
  return dbg.frames.slice(from);
}

export function describeSnapshot(dbg: DebugSnapshot, graph: DirectedGraph): string {
  const scc = findSCCs(graph);
  const cycleCount = scc.nontrivialCount;
  const lines: string[] = [];
  lines.push(`Debugger cycle=${dbg.cycleId} frames=${dbg.frames.length} paused=${dbg.pausedAt !== null}`);
  lines.push(`  scc components: ${scc.components.length} (nontrivial: ${cycleCount})`);
  lines.push(`  breakpoints: ${Array.from(dbg.breakpoints).join(', ') || '(none)'}`);
  return lines.join('\n');
}

export function findFrameByIteration(dbg: DebugSnapshot, iteration: number): DebugFrame | null {
  for (let i = dbg.frames.length - 1; i >= 0; i--) {
    if (dbg.frames[i].iteration === iteration) return dbg.frames[i];
  }
  return null;
}
