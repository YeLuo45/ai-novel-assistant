/**
 * V2108 Direction A Iteration 23/30 Round 6: CycleNodeUI
 *
 * UI descriptor for cycle nodes. Produces serializable descriptors that
 * the frontend can render (icon, color, label, status indicator).
 *
 * Inspired by:
 * - chatdev-design: vueflow node UI
 * - claude-code-design: panel UI
 */

export type CycleNodeKind = 'entry' | 'normal' | 'cycle' | 'super' | 'exit' | 'isolated';

export interface CycleNodeUIDescriptor {
  id: string;
  kind: CycleNodeKind;
  label: string;
  icon: string;
  color: string;
  status: 'idle' | 'running' | 'done' | 'error';
  progress?: number;
}

export function classifyNodeKind(
  isInCycle: boolean,
  isEntry: boolean,
  isExit: boolean,
  isSuper: boolean,
  hasNoEdges: boolean
): CycleNodeKind {
  if (isSuper) return 'super';
  if (isEntry) return 'entry';
  if (isExit) return 'exit';
  if (isInCycle) return 'cycle';
  if (hasNoEdges) return 'isolated';
  return 'normal';
}

const ICONS: Record<CycleNodeKind, string> = {
  entry: '→',
  normal: '●',
  cycle: '↻',
  super: '⊕',
  exit: '⤴',
  isolated: '○',
};

const COLORS: Record<CycleNodeKind, string> = {
  entry: '#22c55e',
  normal: '#94a3b8',
  cycle: '#f59e0b',
  super: '#a855f7',
  exit: '#3b82f6',
  isolated: '#cbd5e1',
};

export function buildDescriptor(input: {
  id: string;
  label?: string;
  isInCycle: boolean;
  isEntry: boolean;
  isExit: boolean;
  isSuper?: boolean;
  hasNoEdges?: boolean;
  status?: CycleNodeUIDescriptor['status'];
  progress?: number;
}): CycleNodeUIDescriptor {
  const kind = classifyNodeKind(
    input.isInCycle,
    input.isEntry,
    input.isExit,
    input.isSuper ?? false,
    input.hasNoEdges ?? false
  );
  const d: CycleNodeUIDescriptor = {
    id: input.id,
    kind,
    label: input.label ?? input.id,
    icon: ICONS[kind],
    color: COLORS[kind],
    status: input.status ?? 'idle',
  };
  if (input.progress !== undefined) d.progress = input.progress;
  return d;
}

export function buildDescriptors(
  nodes: Array<{ id: string; label?: string; isInCycle: boolean; isEntry: boolean; isExit: boolean }>
): CycleNodeUIDescriptor[] {
  return nodes.map((n) => buildDescriptor({ ...n, label: n.label }));
}

export function serializeDescriptors(descs: CycleNodeUIDescriptor[]): string {
  return JSON.stringify(descs);
}
