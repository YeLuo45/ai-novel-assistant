// V2192 GraphEventLog - Direction G Iter 17/30
// Append-only event sourcing
// Source: ruflo
export type GraphLogOp = 'add_node' | 'add_edge' | 'remove_node' | 'remove_edge' | 'update';

export interface GraphLogEvent {
  seq: number;
  op: GraphLogOp;
  nodeId: string;
  data: unknown;
  ts: number;
}

export interface GraphEventLogState {
  events: GraphLogEvent[];
  nextSeq: number;
}

export function createGraphEventLogState(): GraphEventLogState {
  return { events: [], nextSeq: 1 };
}

export function appendGraphLogEvent(state: GraphEventLogState, op: GraphLogOp, nodeId: string, data: unknown): GraphEventLogState {
  const event: GraphLogEvent = { seq: state.nextSeq, op, nodeId, data, ts: Date.now() };
  return { ...state, events: [...state.events, event], nextSeq: state.nextSeq + 1 };
}

export function eventsForNode(state: GraphEventLogState, nodeId: string): GraphLogEvent[] {
  return state.events.filter((e) => e.nodeId === nodeId);
}

export function eventsOfOp(state: GraphEventLogState, op: GraphLogOp): GraphLogEvent[] {
  return state.events.filter((e) => e.op === op);
}

export function replayFromGraph(state: GraphEventLogState, fromSeq: number): GraphLogEvent[] {
  return state.events.filter((e) => e.seq >= fromSeq);
}

export function truncateGraphLog(state: GraphEventLogState, keepLastN: number): GraphEventLogState {
  if (state.events.length <= keepLastN) return state;
  return { ...state, events: state.events.slice(-keepLastN) };
}

export function graphEventLogCount(state: GraphEventLogState): number {
  return state.events.length;
}

export function graphEventLogHealth(state: GraphEventLogState): { count: number; health: number } {
  return { count: state.events.length, health: state.events.length > 0 ? 1 : 0.5 };
}
