// V2180 GraphSchema - Direction G Iter 5/30
// Graph schema validator (node/edge constraints)
// Source: thunderbolt
export type PropKind = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface NodeSchema {
  label: string;
  requiredProps: { name: string; kind: PropKind }[];
}

export interface EdgeSchema {
  edgeLabel: string;
  fromLabel: string;
  toLabel: string;
}

export interface GraphSchemaState {
  nodes: Map<string, NodeSchema>;
  edges: Map<string, EdgeSchema>;
}

export function createGraphSchemaState(): GraphSchemaState {
  return { nodes: new Map(), edges: new Map() };
}

export function addNodeSchema(state: GraphSchemaState, schema: NodeSchema): GraphSchemaState {
  const nodes = new Map(state.nodes);
  nodes.set(schema.label, schema);
  return { ...state, nodes };
}

export function addEdgeSchema(state: GraphSchemaState, schema: EdgeSchema): GraphSchemaState {
  const edges = new Map(state.edges);
  edges.set(schema.edgeLabel, schema);
  return { ...state, edges };
}

export function validateNodeSchema(state: GraphSchemaState, label: string, props: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const schema = state.nodes.get(label);
  if (!schema) return { valid: false, errors: [`unknown label: ${label}`] };
  const errors: string[] = [];
  for (const req of schema.requiredProps) {
    if (!(req.name in props)) errors.push(`missing required prop: ${req.name}`);
    else {
      const actual = propKind(props[req.name]);
      if (actual !== req.kind) errors.push(`prop ${req.name} expected ${req.kind} got ${actual}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateEdgeSchema(state: GraphSchemaState, edgeLabel: string, fromLabel: string, toLabel: string): { valid: boolean; errors: string[] } {
  const schema = state.edges.get(edgeLabel);
  if (!schema) return { valid: false, errors: [`unknown edge: ${edgeLabel}`] };
  const errors: string[] = [];
  if (schema.fromLabel !== fromLabel) errors.push(`edge ${edgeLabel} fromLabel expected ${schema.fromLabel} got ${fromLabel}`);
  if (schema.toLabel !== toLabel) errors.push(`edge ${edgeLabel} toLabel expected ${schema.toLabel} got ${toLabel}`);
  return { valid: errors.length === 0, errors };
}

function propKind(v: unknown): PropKind {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'object';
  return typeof v as PropKind;
}

export function graphSchemaHealth(state: GraphSchemaState): { nodeSchemas: number; edgeSchemas: number; health: number } {
  return { nodeSchemas: state.nodes.size, edgeSchemas: state.edges.size, health: state.nodes.size > 0 ? 1 : 0.5 };
}
