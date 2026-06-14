// V2214 OpPartitioner - Direction H Iter 9/30
// Partition operations by hash/affinity
// Source: nanobot
export interface PartitionInfo {
  partitionId: string;
  keyRange: [number, number]; // 0-1
  weight: number;
}

export interface OpPartitionerState {
  partitions: PartitionInfo[];
  assignment: Map<string, string>; // opId → partitionId
}

export function createOpPartitionerState(partitions = 4): OpPartitionerState {
  const list: PartitionInfo[] = [];
  for (let i = 0; i < partitions; i++) {
    list.push({ partitionId: `p${i}`, keyRange: [i / partitions, (i + 1) / partitions], weight: 1 });
  }
  return { partitions: list, assignment: new Map() };
}

function hashOpKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0x7fffffff;
  return (h % 10000) / 10000;
}

export function addPartition(state: OpPartitionerState, partitionId: string, weight = 1): OpPartitionerState {
  if (state.partitions.some((p) => p.partitionId === partitionId)) return state;
  const partitions = [...state.partitions, { partitionId, keyRange: [0, 1], weight }];
  // Re-balance ranges evenly
  const rebalanced = partitions.map((p, i) => ({ ...p, keyRange: [i / partitions.length, (i + 1) / partitions.length] as [number, number] }));
  return { ...state, partitions: rebalanced };
}

export function partitionOp(state: OpPartitionerState, opId: string, key: string): string | null {
  if (state.partitions.length === 0) return null;
  const h = hashOpKey(key);
  const assignment = new Map(state.assignment);
  for (const p of state.partitions) {
    if (h >= p.keyRange[0] && h < p.keyRange[1]) {
      assignment.set(opId, p.partitionId);
      // NOTE: caller should use this via the function's return value only
      return p.partitionId;
    }
  }
  const last = state.partitions[state.partitions.length - 1].partitionId;
  assignment.set(opId, last);
  return last;
}

export function partitionOpAndUpdate(state: OpPartitionerState, opId: string, key: string): { state: OpPartitionerState; partition: string | null } {
  if (state.partitions.length === 0) return { state, partition: null };
  const h = hashOpKey(key);
  const assignment = new Map(state.assignment);
  for (const p of state.partitions) {
    if (h >= p.keyRange[0] && h < p.keyRange[1]) {
      assignment.set(opId, p.partitionId);
      return { state: { ...state, assignment }, partition: p.partitionId };
    }
  }
  const last = state.partitions[state.partitions.length - 1].partitionId;
  assignment.set(opId, last);
  return { state: { ...state, assignment }, partition: last };
}

export function partitionCount(state: OpPartitionerState): number {
  return state.partitions.length;
}

export function assignedOps(state: OpPartitionerState, partitionId: string): number {
  return Array.from(state.assignment.values()).filter((p) => p === partitionId).length;
}

export function partitionerHealth(state: OpPartitionerState): { partitions: number; assignments: number; health: number } {
  return { partitions: state.partitions.length, assignments: state.assignment.size, health: state.partitions.length > 0 ? 1 : 0 };
}
