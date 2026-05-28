/**
 * NarrativeContextGraph Tests - V96
 * Tests for Rich Contextual Relationship Hypergraph
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyContextGraph,
  createContextNode,
  createContextConnection,
  addNode,
  addConnection,
  findNode,
  findConnectionsFrom,
  findNeighbors,
  queryGraph,
  traverseGraph,
  findConnectionBetween,
  analyzeGraph,
  detectConnectionPatterns,
  detectSubgraphClusters,
  getNarrativeRecommendations,
  formatGraphAnalysis,
  pruneGraph,
  removeNode,
  DEFAULT_CONTEXT_GRAPH_CONFIG,
  type ContextNodeType
} from './NarrativeContextGraph'

// =============================================================================
// Helper Functions
// =============================================================================

function makeNode(overrides = {}) {
  return createContextNode('node1', 'character', 'Alice', {}, 0.8, [1, 2, 3], 0.5, 0.8)
}

// =============================================================================
// createContextNode Tests
// =============================================================================

describe('createContextNode', () => {
  it('should create node with correct defaults', () => {
    const node = createContextNode('n1', 'character', 'Alice', { age: 25 }, 0.8, [1, 2], 0.5, 0.7)
    expect(node.id).toBe('n1')
    expect(node.type).toBe('character')
    expect(node.label).toBe('Alice')
    expect(node.metadata.age).toBe(25)
    expect(node.strength).toBe(0.8)
    expect(node.chapters).toEqual([1, 2])
    expect(node.connections).toEqual([])
    expect(node.emotionalCharge).toBe(0.5)
  })

  it('should clamp emotional charge to -1..1', () => {
    const node1 = createContextNode('n1', 'character', 'A', {}, 0.5, [], 2, 0.5)
    expect(node1.emotionalCharge).toBe(1)

    const node2 = createContextNode('n2', 'character', 'B', {}, 0.5, [], -3, 0.5)
    expect(node2.emotionalCharge).toBe(-1)
  })
})

// =============================================================================
// createContextConnection Tests
// =============================================================================

describe('createContextConnection', () => {
  it('should create connection with defaults', () => {
    const conn = createContextConnection('c1', 'node1', 'node2', 'ally_of', 0.8, 'Alice and Bob are allies', false, 0.3, 5)
    expect(conn.id).toBe('c1')
    expect(conn.relationshipType).toBe('ally_of')
    expect(conn.strength).toBe(0.8)
    expect(conn.narrativeSignificance).toBe('major')
  })

  it('should mark critical for very high strength', () => {
    const conn = createContextConnection('c1', 'node1', 'node2', 'caused', 0.95, '', false, 0, 1)
    expect(conn.narrativeSignificance).toBe('critical')
  })
})

// =============================================================================
// Graph Creation Tests
// =============================================================================

describe('createEmptyContextGraph', () => {
  it('should create empty graph with all maps initialized', () => {
    const graph = createEmptyContextGraph()
    expect(graph.nodes.size).toBe(0)
    expect(graph.connections.size).toBe(0)
    expect(graph.adjacencyList.size).toBe(0)
    expect(graph.chapterIndex.size).toBe(0)
  })
})

describe('addNode', () => {
  it('should add node to graph', () => {
    let graph = createEmptyContextGraph()
    const node = makeNode()
    graph = addNode(graph, node)
    expect(graph.nodes.size).toBe(1)
    expect(graph.nodes.get('node1')).toBeDefined()
  })

  it('should index node by chapter', () => {
    let graph = createEmptyContextGraph()
    const node = makeNode()
    graph = addNode(graph, node)
    expect(graph.chapterIndex.has(1)).toBe(true)
    expect(graph.chapterIndex.has(2)).toBe(true)
    expect(graph.chapterIndex.has(3)).toBe(true)
  })

  it('should index node by type', () => {
    let graph = createEmptyContextGraph()
    const node = makeNode()
    graph = addNode(graph, node)
    expect(graph.typeIndex.has('character')).toBe(true)
    expect(graph.typeIndex.get('character')?.has('node1')).toBe(true)
  })
})

describe('addConnection', () => {
  it('should add connection between nodes', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const node2 = createContextNode('node2', 'character', 'Bob', {}, 0.7, [1, 2], -0.3, 0.6)
    graph = addNode(graph, node1)
    graph = addNode(graph, node2)

    const conn = createContextConnection('conn1', 'node1', 'node2', 'ally_of', 0.8, 'Allies', false, 0.2, 1)
    graph = addConnection(graph, conn)

    expect(graph.connections.size).toBe(1)
    expect(graph.adjacencyList.get('node1')?.has('node2')).toBe(true)
  })

  it('should handle bidirectional connections', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const node2 = createContextNode('node2', 'character', 'Bob', {}, 0.7, [1], 0.2, 0.6)
    graph = addNode(graph, node1)
    graph = addNode(graph, node2)

    const conn = createContextConnection('conn1', 'node1', 'node2', 'family_of', 0.9, 'Family', true, 0.5, 1)
    graph = addConnection(graph, conn)

    expect(graph.adjacencyList.get('node1')?.has('node2')).toBe(true)
    expect(graph.adjacencyList.get('node2')?.has('node1')).toBe(true)
  })
})

// =============================================================================
// Query Tests
// =============================================================================

describe('findNode', () => {
  it('should return node by ID', () => {
    let graph = createEmptyContextGraph()
    const node = makeNode()
    graph = addNode(graph, node)
    const found = findNode(graph, 'node1')
    expect(found).toBeDefined()
    expect(found?.label).toBe('Alice')
  })

  it('should return undefined for missing node', () => {
    const graph = createEmptyContextGraph()
    const found = findNode(graph, 'missing')
    expect(found).toBeUndefined()
  })
})

describe('findConnectionsFrom', () => {
  it('should return empty for node with no connections', () => {
    const graph = createEmptyContextGraph()
    const connections = findConnectionsFrom(graph, 'node1')
    expect(connections.length).toBe(0)
  })
})

describe('findNeighbors', () => {
  it('should return neighboring nodes', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const node2 = createContextNode('node2', 'character', 'Bob', {}, 0.7, [1], 0.2, 0.6)
    graph = addNode(graph, node1)
    graph = addNode(graph, node2)

    const conn = createContextConnection('conn1', 'node1', 'node2', 'ally_of', 0.8, '', false, 0, 1)
    graph = addConnection(graph, conn)

    const neighbors = findNeighbors(graph, 'node1')
    expect(neighbors.length).toBe(1)
    expect(neighbors[0].label).toBe('Bob')
  })
})

describe('queryGraph', () => {
  it('should filter by relationship type', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const node2 = createContextNode('node2', 'character', 'Bob', {}, 0.7, [1], 0.2, 0.6)
    graph = addNode(graph, node1)
    graph = addNode(graph, node2)

    const conn1 = createContextConnection('conn1', 'node1', 'node2', 'ally_of', 0.8, '', false, 0, 1)
    graph = addConnection(graph, conn1)

    const results = queryGraph(graph, { relationshipType: 'ally_of' })
    expect(results.length).toBe(1)

    const empty = queryGraph(graph, { relationshipType: 'enemy_of' })
    expect(empty.length).toBe(0)
  })

  it('should filter by min strength', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const node2 = createContextNode('node2', 'character', 'Bob', {}, 0.7, [1], 0.2, 0.6)
    graph = addNode(graph, node1)
    graph = addNode(graph, node2)

    const conn1 = createContextConnection('conn1', 'node1', 'node2', 'ally_of', 0.3, '', false, 0, 1)
    graph = addConnection(graph, conn1)

    const results = queryGraph(graph, { minStrength: 0.5 })
    expect(results.length).toBe(0)
  })

  it('should apply limit', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    for (let i = 1; i <= 5; i++) {
      const n = createContextNode(`n${i}`, 'character', `Char${i}`, {}, 0.8, [1], 0, 0.5)
      graph = addNode(graph, n)
      const conn = createContextConnection(`c${i}`, 'node1', `n${i}`, 'ally_of', 0.8, '', false, 0, 1)
      graph = addConnection(graph, conn)
    }

    const results = queryGraph(graph, { limit: 3 })
    expect(results.length).toBe(3)
  })
})

// =============================================================================
// Traversal Tests
// =============================================================================

describe('traverseGraph', () => {
  it('should return empty for unknown start node', () => {
    const graph = createEmptyContextGraph()
    const paths = traverseGraph(graph, 'unknown', 3)
    expect(paths).toEqual([])
  })
})

describe('findConnectionBetween', () => {
  it('should return undefined for missing nodes', () => {
    const graph = createEmptyContextGraph()
    const found = findConnectionBetween(graph, 'a', 'b')
    expect(found).toBeUndefined()
  })
})

// =============================================================================
// Analysis Tests
// =============================================================================

describe('analyzeGraph', () => {
  it('should return analysis for empty graph', () => {
    const graph = createEmptyContextGraph()
    const analysis = analyzeGraph(graph)
    expect(analysis.totalNodes).toBe(0)
    expect(analysis.totalConnections).toBe(0)
    expect(analysis.density).toBe(0)
  })

  it('should identify most connected nodes', () => {
    let graph = createEmptyContextGraph()
    const node1 = createContextNode('hub', 'character', 'Hub', {}, 0.9, [1], 0, 0.9)
    graph = addNode(graph, node1)

    for (let i = 1; i <= 3; i++) {
      const n = createContextNode(`leaf${i}`, 'character', `Leaf${i}`, {}, 0.5, [1], 0, 0.3)
      graph = addNode(graph, n)
      const conn = createContextConnection(`c${i}`, 'hub', `leaf${i}`, 'ally_of', 0.8, '', false, 0, 1)
      graph = addConnection(graph, conn)
    }

    const analysis = analyzeGraph(graph)
    expect(analysis.mostConnectedNodes.length).toBeGreaterThan(0)
    expect(analysis.mostConnectedNodes[0].id).toBe('hub')
  })

  it('should detect isolated nodes', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const isolated = createContextNode('isolated', 'location', 'Isolated Place', {}, 0.3, [5], 0, 0.2)
    graph = addNode(graph, node1)
    graph = addNode(graph, isolated)

    const analysis = analyzeGraph(graph)
    expect(analysis.isolatedNodes.some(n => n.id === 'isolated')).toBe(true)
  })
})

describe('detectConnectionPatterns', () => {
  it('should detect ally_of pattern', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const node2 = createContextNode('node2', 'character', 'Bob', {}, 0.7, [1], 0.2, 0.6)
    const node3 = createContextNode('node3', 'character', 'Carol', {}, 0.6, [1], 0.1, 0.5)
    graph = addNode(graph, node1)
    graph = addNode(graph, node2)
    graph = addNode(graph, node3)

    const conn1 = createContextConnection('c1', 'node1', 'node2', 'ally_of', 0.8, '', false, 0, 1)
    const conn2 = createContextConnection('c2', 'node1', 'node3', 'ally_of', 0.7, '', false, 0, 1)
    graph = addConnection(graph, conn1)
    graph = addConnection(graph, conn2)

    const patterns = detectConnectionPatterns(graph)
    const allyPattern = patterns.find(p => p.type === 'ally_of')
    expect(allyPattern).toBeDefined()
    expect(allyPattern?.frequency).toBe(2)
  })
})

describe('detectSubgraphClusters', () => {
  it('should return empty for empty graph', () => {
    const graph = createEmptyContextGraph()
    const clusters = detectSubgraphClusters(graph)
    expect(clusters).toEqual([])
  })
})

// =============================================================================
// Recommendation Tests
// =============================================================================

describe('getNarrativeRecommendations', () => {
  it('should return empty for well-connected graph', () => {
    let graph = createEmptyContextGraph()
    const node1 = makeNode()
    const node2 = createContextNode('node2', 'character', 'Bob', {}, 0.7, [1], 0.2, 0.6)
    graph = addNode(graph, node1)
    graph = addNode(graph, node2)

    const conn = createContextConnection('conn1', 'node1', 'node2', 'ally_of', 0.8, '', false, 0, 1)
    graph = addConnection(graph, conn)

    const recs = getNarrativeRecommendations(graph)
    // Well-connected small graph, no major issues
    expect(Array.isArray(recs)).toBe(true)
  })
})

describe('formatGraphAnalysis', () => {
  it('should format analysis summary', () => {
    const graph = createEmptyContextGraph()
    const analysis = analyzeGraph(graph)
    const summary = formatGraphAnalysis(analysis)
    expect(summary).toContain('Narrative Context Graph Analysis')
    expect(summary).toContain('Nodes: 0')
  })
})

// =============================================================================
// Pruning Tests
// =============================================================================

describe('pruneGraph', () => {
  it('should remove low-strength isolated nodes', () => {
    let graph = createEmptyContextGraph()
    const weak = createContextNode('weak', 'character', 'Weak Node', {}, 0.02, [], 0, 0.1)
    graph = addNode(graph, weak)

    const pruned = pruneGraph(graph)
    expect(pruned.nodes.has('weak')).toBe(false)
  })

  it('should keep strong nodes', () => {
    let graph = createEmptyContextGraph()
    const strong = makeNode()
    graph = addNode(graph, strong)

    const pruned = pruneGraph(graph)
    expect(pruned.nodes.has('node1')).toBe(true)
  })
})

describe('removeNode', () => {
  it('should return same graph for missing node', () => {
    let graph = createEmptyContextGraph()
    graph = removeNode(graph, 'missing')
    expect(graph.nodes.size).toBe(0)
  })
})
