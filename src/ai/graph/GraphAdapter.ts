// V2204 GraphAdapter - Direction G Iter 29/30
// Format adapter (RDF/JSON-LD/GraphML)
// Source: generic-agent
export type GraphFormatKind = 'json' | 'cypher' | 'rdf' | 'graphml' | 'jsonld';

export interface AdaptedGraphFormat {
  kind: GraphFormatKind;
  content: string;
  nodeCount: number;
  edgeCount: number;
}

export interface GraphAdapterState {
  formatCounts: Record<GraphFormatKind, number>;
}

export function createGraphAdapterState(): GraphAdapterState {
  return { formatCounts: { json: 0, cypher: 0, rdf: 0, graphml: 0, jsonld: 0 } };
}

export function toGraphJSON(nodes: string[], edges: { from: string; to: string }[]): AdaptedGraphFormat {
  const content = JSON.stringify({ nodes, edges });
  return { kind: 'json', content, nodeCount: nodes.length, edgeCount: edges.length };
}

export function toCypher(nodes: string[], edges: { from: string; to: string }[]): AdaptedGraphFormat {
  const lines = nodes.map((n) => `CREATE (${n}:Node);`);
  edges.forEach((e) => lines.push(`MATCH (a:${e.from}), (b:${e.to}) CREATE (a)-[:REL]->(b);`));
  return { kind: 'cypher', content: lines.join('\n'), nodeCount: nodes.length, edgeCount: edges.length };
}

export function toRDF(nodes: string[], edges: { from: string; to: string }[]): AdaptedGraphFormat {
  const lines: string[] = ['@prefix ex: <http://example.org/> .'];
  nodes.forEach((n) => lines.push(`ex:${n} a ex:Node .`));
  edges.forEach((e) => lines.push(`ex:${e.from} ex:relates ex:${e.to} .`));
  return { kind: 'rdf', content: lines.join('\n'), nodeCount: nodes.length, edgeCount: edges.length };
}

export function toGraphML(nodes: string[], edges: { from: string; to: string }[]): AdaptedGraphFormat {
  const lines: string[] = ['<?xml version="1.0"?>', '<graphml>', '<graph>'];
  nodes.forEach((n) => lines.push(`<node id="${n}"/>`));
  edges.forEach((e, i) => lines.push(`<edge id="e${i}" source="${e.from}" target="${e.to}"/>`));
  lines.push('</graph>', '</graphml>');
  return { kind: 'graphml', content: lines.join('\n'), nodeCount: nodes.length, edgeCount: edges.length };
}

export function toJSONLD(nodes: string[], edges: { from: string; to: string }[]): AdaptedGraphFormat {
  const items = nodes.map((n) => ({ '@id': `n:${n}`, '@type': 'Node' }));
  edges.forEach((e) => items.push({ '@id': `e:${e.from}-${e.to}`, '@type': 'Edge', source: `n:${e.from}`, target: `n:${e.to}` }));
  return { kind: 'jsonld', content: JSON.stringify(items), nodeCount: nodes.length, edgeCount: edges.length };
}

export function adaptGraphFormat(state: GraphAdapterState, kind: GraphFormatKind): GraphAdapterState {
  return { ...state, formatCounts: { ...state.formatCounts, [kind]: state.formatCounts[kind] + 1 } };
}

export function graphAdapterHealth(state: GraphAdapterState): { total: number; formats: number; health: number } {
  const total = Object.values(state.formatCounts).reduce((s, n) => s + n, 0);
  return { total, formats: Object.values(state.formatCounts).filter((n) => n > 0).length, health: total > 0 ? 1 : 0.5 };
}
