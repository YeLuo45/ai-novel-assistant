/**
 * NarrativeContextGraph Types - V95
 * Rich Contextual Relationship Graph Across All Narrative Subsystems
 * 
 * Maintains a hypergraph of contextual relationships between story elements:
 * - Character ↔ Character (relationships, conflicts, alliances)
 * - Character ↔ Event (participation, causation, impact)
 * - Event ↔ Location (setting, consequences)
 * - Thread ↔ Character (ownership, influence)
 * - Emotional Arc ↔ Plot Point (resonance, causation)
 * - Reader Engagement ↔ Narrative Decision (correlation)
 * 
 * Inspired by thunderbolt pipeline + nanobot distributed mesh + ruflo hierarchical decomposition.
 */

import type { SkillNode } from '../evolution/SkillGraph'

// =============================================================================
// Context Graph Core Types
// ===============================================================================

export type ContextNodeType = 
  | 'character' | 'location' | 'event' | 'item' 
  | 'plot_thread' | 'emotional_arc' | 'theme' 
  | 'reader_segment' | 'writing_decision'

export interface ContextNode {
  id: string
  type: ContextNodeType
  label: string
  metadata: Record<string, any>          // Rich contextual metadata
  strength: number                        // 0-1 importance in narrative
  chapters: number[]                     // Chapters this node spans
  connections: ContextConnection[]        // All connections from this node
  emotionalCharge: number                 // -1 to 1 (negative to positive)
  narrativeWeight: number                 // How central this node is
}

export interface ContextConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  relationshipType: ContextRelationshipType
  strength: number                        // 0-1 how strong this connection is
  bidirectional: boolean
  description: string                     // Human-readable relationship description
  emotionalTone: number                   // -1 to 1
  createdAtChapter: number
  lastReferencedChapter: number
  narrativeSignificance: 'critical' | 'major' | 'minor' | 'ambient'
  metadata: Record<string, any>            // Additional context
}

export type ContextRelationshipType =
  // Character relationships
  | 'ally_of' | 'enemy_of' | 'mentors' | 'romantic_interest'
  | 'family_of' | 'rival_of' | 'betrayed_by' | 'inspired_by'
  // Character-Event relationships
  | 'caused' | 'witnessed' | 'affected_by' | 'prevented'
  | 'enabled' | 'suffered_from' | 'celebrated_by'
  // Event-Location relationships
  | 'occurs_at' | 'transforms' | 'revealed_at' | 'haunted_by'
  // Thread-Element relationships
  | 'drives' | 'depends_on' | 'foreshadows' | 'pays_off'
  | 'introduces' | 'resolves' | 'complicates'
  // Emotional-Plot relationships
  | 'triggers' | 'culminates_in' | 'mirrors' | 'subverts'
  // Reader-Author relationships
  | 'intended_for' | 'resonated_with' | 'confused_by' | 'predicted'

// =============================================================================
// Graph State Types
// ===============================================================================

export interface NarrativeContextGraph {
  nodes: Map<string, ContextNode>
  connections: Map<string, ContextConnection>
  adjacencyList: Map<string, Set<string>>  // For fast neighbor lookup
  chapterIndex: Map<number, Set<string>>   // Nodes active in each chapter
  typeIndex: Map<ContextNodeType, Set<string>> // Nodes by type
  lastUpdated: number
}

export interface GraphQuery {
  sourceNodeId?: string
  targetNodeId?: string
  relationshipType?: ContextRelationshipType
  nodeType?: ContextNodeType
  minStrength?: number
  chapterRange?: [number, number]
  emotionalTone?: 'positive' | 'negative' | 'neutral'
  limit?: number
}

export interface GraphTraversalResult {
  path: ContextNode[]
  connections: ContextConnection[]
  totalStrength: number
  depth: number
  description: string
}

// =============================================================================
// Analysis Types
// ===============================================================================

export interface GraphAnalysis {
  totalNodes: number
  totalConnections: number
  density: number                           // Connections per node
  mostConnectedNodes: ContextNode[]        // Hub nodes
  isolatedNodes: ContextNode[]            // Nodes with no connections
  strongestThreads: ContextConnection[]   // Critical narrative connections
  emotionalHotspots: ContextNode[]        // High emotional charge nodes
  chapterDistribution: Map<number, number> // Nodes per chapter
}

export interface ConnectionPattern {
  type: ContextRelationshipType
  frequency: number
  avgStrength: number
  description: string
  examples: string[]                      // Example node pair IDs
}

export interface SubgraphCluster {
  id: string
  nodes: string[]
  dominantType: ContextNodeType
  coherence: number                       // 0-1 how cohesive this cluster is
  centralNodeId: string
  connectionsToExternal: string[]        // External connection IDs
}

// =============================================================================
// Configuration
// ===============================================================================

export interface ContextGraphConfig {
  maxNodes: number                        // Prevent unbounded growth
  maxConnectionsPerNode: number          // Limit node degree
  minConnectionStrength: number          // Ignore weak connections
  pruningThreshold: number               // Remove nodes below this strength
  chapterWindowSize: number             // How many chapters to index
  clusteringThreshold: number            // For subgraph detection
}

export const DEFAULT_CONTEXT_GRAPH_CONFIG: ContextGraphConfig = {
  maxNodes: 500,
  maxConnectionsPerNode: 50,
  minConnectionStrength: 0.1,
  pruningThreshold: 0.05,
  chapterWindowSize: 50,
  clusteringThreshold: 0.6
}

// =============================================================================
// Factory Functions
// ===============================================================================

/**
 * Create empty context graph
 */
export function createEmptyContextGraph(): NarrativeContextGraph {
  return {
    nodes: new Map(),
    connections: new Map(),
    adjacencyList: new Map(),
    chapterIndex: new Map(),
    typeIndex: new Map(),
    lastUpdated: Date.now()
  }
}

/**
 * Create context node
 */
export function createContextNode(
  id: string,
  type: ContextNodeType,
  label: string,
  metadata: Record<string, any> = {},
  strength: number = 0.5,
  chapters: number[] = [],
  emotionalCharge: number = 0,
  narrativeWeight: number = 0.5
): ContextNode {
  return {
    id,
    type,
    label,
    metadata,
    strength,
    chapters,
    connections: [],
    emotionalCharge: Math.max(-1, Math.min(1, emotionalCharge)),
    narrativeWeight: Math.max(0, Math.min(1, narrativeWeight))
  }
}

/**
 * Create context connection
 */
export function createContextConnection(
  id: string,
  sourceNodeId: string,
  targetNodeId: string,
  relationshipType: ContextRelationshipType,
  strength: number = 0.5,
  description: string = '',
  bidirectional: boolean = false,
  emotionalTone: number = 0,
  chapter: number = 1
): ContextConnection {
  return {
    id,
    sourceNodeId,
    targetNodeId,
    relationshipType,
    strength: Math.max(0, Math.min(1, strength)),
    bidirectional,
    description,
    emotionalTone: Math.max(-1, Math.min(1, emotionalTone)),
    createdAtChapter: chapter,
    lastReferencedChapter: chapter,
    narrativeSignificance: strength > 0.8 ? 'critical' : strength > 0.5 ? 'major' : strength > 0.2 ? 'minor' : 'ambient',
    metadata: {}
  }
}

// =============================================================================
// Graph Operations
// =============================================================================

/**
 * Add node to graph
 */
export function addNode(
  graph: NarrativeContextGraph,
  node: ContextNode
): NarrativeContextGraph {
  const nodes = new Map(graph.nodes)
  nodes.set(node.id, node)

  const chapterIndex = new Map(graph.chapterIndex)
  for (const ch of node.chapters) {
    const existing = chapterIndex.get(ch) || new Set()
    existing.add(node.id)
    chapterIndex.set(ch, existing)
  }

  const typeIndex = new Map(graph.typeIndex)
  const existing = typeIndex.get(node.type) || new Set()
  existing.add(node.id)
  typeIndex.set(node.type, existing)

  const adjacencyList = new Map(graph.adjacencyList)
  if (!adjacencyList.has(node.id)) {
    adjacencyList.set(node.id, new Set())
  }

  return {
    ...graph,
    nodes,
    chapterIndex,
    typeIndex,
    adjacencyList,
    lastUpdated: Date.now()
  }
}

/**
 * Add connection between two nodes
 */
export function addConnection(
  graph: NarrativeContextGraph,
  connection: ContextConnection
): NarrativeContextGraph {
  const connections = new Map(graph.connections)
  connections.set(connection.id, connection)

  // Update adjacency list
  const adjacencyList = new Map(graph.adjacencyList)
  const sourceNeighbors = adjacencyList.get(connection.sourceNodeId) || new Set()
  sourceNeighbors.add(connection.targetNodeId)
  adjacencyList.set(connection.sourceNodeId, sourceNeighbors)

  if (connection.bidirectional) {
    const targetNeighbors = adjacencyList.get(connection.targetNodeId) || new Set()
    targetNeighbors.add(connection.sourceNodeId)
    adjacencyList.set(connection.targetNodeId, targetNeighbors)
  }

  // Update node connection lists
  const nodes = new Map(graph.nodes)
  const sourceNode = nodes.get(connection.sourceNodeId)
  if (sourceNode) {
    nodes.set(connection.sourceNodeId, {
      ...sourceNode,
      connections: [...sourceNode.connections, connection]
    })
  }

  return {
    ...graph,
    connections,
    adjacencyList,
    lastUpdated: Date.now()
  }
}

/**
 * Find node by ID
 */
export function findNode(
  graph: NarrativeContextGraph,
  nodeId: string
): ContextNode | undefined {
  return graph.nodes.get(nodeId)
}

/**
 * Find connections from a node
 */
export function findConnectionsFrom(
  graph: NarrativeContextGraph,
  nodeId: string,
  relationshipType?: ContextRelationshipType
): ContextConnection[] {
  const node = graph.nodes.get(nodeId)
  if (!node) return []
  
  let connections = node.connections
  if (relationshipType) {
    connections = connections.filter(c => c.relationshipType === relationshipType)
  }
  
  return connections.sort((a, b) => b.strength - a.strength)
}

/**
 * Find neighbors of a node (directly connected)
 */
export function findNeighbors(
  graph: NarrativeContextGraph,
  nodeId: string,
  relationshipType?: ContextRelationshipType
): ContextNode[] {
  const neighborIds = graph.adjacencyList.get(nodeId)
  if (!neighborIds) return []

  const neighbors: ContextNode[] = []
  for (const neighborId of Array.from(neighborIds)) {
    const node = graph.nodes.get(neighborId)
    if (!node) continue
    
    // Check relationship type filter
    if (relationshipType) {
      const hasConnection = node.connections.some(c => 
        c.relationshipType === relationshipType && 
        (c.sourceNodeId === nodeId || c.targetNodeId === nodeId)
      )
      if (!hasConnection) continue
    }
    
    neighbors.push(node)
  }

  return neighbors.sort((a, b) => b.strength - a.strength)
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Query graph with filters
 */
export function queryGraph(
  graph: NarrativeContextGraph,
  query: GraphQuery
): ContextConnection[] {
  let results: ContextConnection[] = []

  // Filter by relationship type
  if (query.relationshipType) {
    results = Array.from(graph.connections.values()).filter(
      c => c.relationshipType === query.relationshipType
    )
  } else {
    results = Array.from(graph.connections.values())
  }

  // Filter by min strength
  if (query.minStrength !== undefined) {
    results = results.filter(c => c.strength >= query.minStrength!)
  }

  // Filter by emotional tone
  if (query.emotionalTone) {
    const toneMap = { positive: [0.3, 1], negative: [-1, -0.3], neutral: [-0.3, 0.3] }
    const [min, max] = toneMap[query.emotionalTone]
    results = results.filter(c => c.emotionalTone >= min && c.emotionalTone <= max)
  }

  // Filter by chapter range
  if (query.chapterRange) {
    const [minCh, maxCh] = query.chapterRange
    results = results.filter(c => 
      c.createdAtChapter >= minCh && c.createdAtChapter <= maxCh
    )
  }

  // Filter by node type
  if (query.nodeType) {
    const nodeIds = graph.typeIndex.get(query.nodeType)
    if (nodeIds) {
      const nodeIdSet = new Set(nodeIds)
      results = results.filter(c => 
        nodeIdSet.has(c.sourceNodeId) || nodeIdSet.has(c.targetNodeId)
      )
    }
  }

  // Sort by strength descending
  results.sort((a, b) => b.strength - a.strength)

  // Apply limit
  if (query.limit) {
    results = results.slice(0, query.limit)
  }

  return results
}

// =============================================================================
// Traversal Functions
// =============================================================================

/**
 * Traverse graph with BFS up to max depth
 */
export function traverseGraph(
  graph: NarrativeContextGraph,
  startNodeId: string,
  maxDepth: number = 3,
  relationshipFilter?: ContextRelationshipType[]
): GraphTraversalResult[] {
  const visited = new Set<string>()
  const results: GraphTraversalResult[] = []

  function bfs(currentNodeId: string, depth: number, path: ContextNode[], pathConnections: ContextConnection[]) {
    if (depth > maxDepth) return
    if (visited.has(currentNodeId)) return

    const currentNode = graph.nodes.get(currentNodeId)
    if (!currentNode) return

    visited.add(currentNodeId)
    const newPath = [...path, currentNode]

    // Get neighbors
    const neighborIds = graph.adjacencyList.get(currentNodeId)
    if (!neighborIds || neighborIds.size === 0) {
      // Reached end of branch
      if (depth > 0) {
        results.push({
          path: newPath,
          connections: pathConnections,
          totalStrength: calculatePathStrength(pathConnections),
          depth,
          description: describePath(newPath)
        })
      }
      return
    }

    for (const neighborId of Array.from(neighborIds)) {
      // Find connection between current and neighbor
      const connection = findConnectionBetween(graph, currentNodeId, neighborId)
      if (!connection) continue

      // Apply relationship filter
      if (relationshipFilter && !relationshipFilter.includes(connection.relationshipType)) continue

      // Skip if already visited (allow some revisiting for better paths)
      const newConnections = [...pathConnections, connection]
      
      const neighbor = graph.nodes.get(neighborId)
      if (neighbor) {
        bfs(neighborId, depth + 1, newPath, newConnections)
      }
    }
  }

  bfs(startNodeId, 0, [], [])
  return results.sort((a, b) => b.totalStrength - a.totalStrength)
}

/**
 * Find direct connection between two nodes
 */
export function findConnectionBetween(
  graph: NarrativeContextGraph,
  nodeIdA: string,
  nodeIdB: string
): ContextConnection | undefined {
  const nodeA = graph.nodes.get(nodeIdA)
  if (!nodeA) return undefined

  return nodeA.connections.find(c => 
    c.targetNodeId === nodeIdB || 
    (c.bidirectional && c.sourceNodeId === nodeIdB)
  )
}

/**
 * Calculate path strength (average connection strength)
 */
function calculatePathStrength(connections: ContextConnection[]): number {
  if (connections.length === 0) return 0
  return connections.reduce((sum, c) => sum + c.strength, 0) / connections.length
}

/**
 * Describe a path in human-readable format
 */
function describePath(path: ContextNode[]): string {
  if (path.length === 0) return 'Empty path'
  if (path.length === 1) return `Single node: ${path[0].label}`

  const labels = path.map(n => n.label)
  return labels.join(' → ')
}

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * Analyze graph structure
 */
export function analyzeGraph(graph: NarrativeContextGraph): GraphAnalysis {
  const nodes = Array.from(graph.nodes.values())
  const connections = Array.from(graph.connections.values())

  // Most connected nodes (by connection count)
  const nodeConnectionCounts = nodes.map(n => ({
    node: n,
    count: n.connections.length
  }))
  nodeConnectionCounts.sort((a, b) => b.count - a.count)
  const mostConnectedNodes = nodeConnectionCounts.slice(0, 5).map(nc => nc.node)

  // Isolated nodes (no connections or only ambient connections)
  const isolatedNodes = nodes.filter(n => 
    n.connections.length === 0 || 
    n.connections.every(c => c.narrativeSignificance === 'ambient')
  )

  // Strongest threads (critical connections)
  const strongestThreads = connections
    .filter(c => c.narrativeSignificance === 'critical')
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10)

  // Emotional hotspots (high absolute emotional charge)
  const emotionalHotspots = nodes
    .filter(n => Math.abs(n.emotionalCharge) > 0.7)
    .sort((a, b) => Math.abs(b.emotionalCharge) - Math.abs(a.emotionalCharge))

  // Chapter distribution
  const chapterDistribution = new Map<number, number>()
  for (const [chapter, nodeIds] of Array.from(graph.chapterIndex)) {
    chapterDistribution.set(chapter, nodeIds.size)
  }

  // Density
  const density = nodes.length > 0 
    ? connections.length / (nodes.length * (nodes.length - 1) / 2)
    : 0

  return {
    totalNodes: nodes.length,
    totalConnections: connections.length,
    density,
    mostConnectedNodes,
    isolatedNodes,
    strongestThreads,
    emotionalHotspots,
    chapterDistribution
  }
}

/**
 * Detect connection patterns
 */
export function detectConnectionPatterns(
  graph: NarrativeContextGraph
): ConnectionPattern[] {
  const connections = Array.from(graph.connections.values())
  const patternMap = new Map<ContextRelationshipType, ContextConnection[]>()

  for (const conn of connections) {
    const existing = patternMap.get(conn.relationshipType) || []
    existing.push(conn)
    patternMap.set(conn.relationshipType, existing)
  }

  const patterns: ConnectionPattern[] = []
  for (const [type, conns] of Array.from(patternMap)) {
    const avgStrength = conns.reduce((sum, c) => sum + c.strength, 0) / conns.length
    patterns.push({
      type,
      frequency: conns.length,
      avgStrength,
      description: describeRelationshipType(type),
      examples: conns.slice(0, 3).map(c => `${c.sourceNodeId} - ${c.targetNodeId}`)
    })
  }

  return patterns.sort((a, b) => b.frequency - a.frequency)
}

/**
 * Describe relationship type
 */
function describeRelationshipType(type: ContextRelationshipType): string {
  const descriptions: Record<ContextRelationshipType, string> = {
    'ally_of': 'Characters or entities working together toward shared goals',
    'enemy_of': 'Opposition or conflict between entities',
    'mentors': 'Guidance or teaching relationship',
    'romantic_interest': 'Romantic or intimate connection',
    'family_of': 'Blood or legal family relationship',
    'rival_of': 'Competition or rivalry',
    'betrayed_by': 'One entity betrayed another',
    'inspired_by': 'One entity inspired or influenced another',
    'caused': 'Direct causation from source to target',
    'witnessed': 'Entity observed an event',
    'affected_by': 'Entity was impacted by an event',
    'prevented': 'Entity stopped an event from occurring',
    'enabled': 'Entity made an event possible',
    'suffered_from': 'Entity experienced negative consequences',
    'celebrated_by': 'Entity commemorated an event',
    'occurs_at': 'Event takes place at a location',
    'transforms': 'Location or entity was transformed by event',
    'revealed_at': ' information came to light at location',
    'haunted_by': 'Past event lingers at location',
    'drives': 'Thread or element motivates or drives another',
    'depends_on': 'Thread or element relies on another',
    'foreshadows': 'Element hints at future development',
    'pays_off': 'Setup receives satisfying resolution',
    'introduces': 'Element brings something new into story',
    'resolves': 'Element brings something to conclusion',
    'complicates': 'Element makes situation more complex',
    'triggers': 'Emotional arc is set off by event',
    'culminates_in': 'Development reaches peak or conclusion',
    'mirrors': 'Element echoes or parallels another',
    'subverts': 'Element reverses or undermines expectation',
    'intended_for': 'Content created with specific audience in mind',
    'resonated_with': 'Content connected emotionally with audience',
    'confused_by': 'Content created difficulty for audience',
    'predicted': 'Audience correctly anticipated content'
  }
  return descriptions[type] || type
}

/**
 * Detect subgraph clusters (closely related nodes)
 */
export function detectSubgraphClusters(
  graph: NarrativeContextGraph,
  config: ContextGraphConfig = DEFAULT_CONTEXT_GRAPH_CONFIG
): SubgraphCluster[] {
  const nodes = Array.from(graph.nodes.values())
  const visited = new Set<string>()
  const clusters: SubgraphCluster[] = []

  for (const node of nodes) {
    if (visited.has(node.id)) continue

    // BFS to find connected component
    const clusterNodes = new Set<string>()
    const queue = [node.id]
    const clusterConnections = new Set<string>()

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (visited.has(currentId)) continue
      visited.add(currentId)
      clusterNodes.add(currentId)

      const current = graph.nodes.get(currentId)
      if (current) {
        for (const conn of current.connections) {
          clusterConnections.add(conn.id)
          if (!visited.has(conn.targetNodeId)) {
            queue.push(conn.targetNodeId)
          }
        }
      }
    }

    if (clusterNodes.size >= 2) {
      // Determine dominant type
      const typeCount = new Map<ContextNodeType, number>()
      for (const nodeId of Array.from(clusterNodes)) {
        const n = graph.nodes.get(nodeId)
        if (n) {
          typeCount.set(n.type, (typeCount.get(n.type) || 0) + 1)
        }
      }
      const dominantType = Array.from(typeCount.entries()).sort((a, b) => b[1] - a[1])[0][0]

      // Find central node (most connections within cluster)
      let centralNodeId = node.id
      let maxConnections = 0
      for (const nodeId of Array.from(clusterNodes)) {
        const n = graph.nodes.get(nodeId)
        if (n) {
          const internalConnections = n.connections.filter(c => clusterNodes.has(c.targetNodeId))
          if (internalConnections.length > maxConnections) {
            maxConnections = internalConnections.length
            centralNodeId = node.id
          }
        }
      }

      // Calculate coherence (avg connection strength within cluster)
      const allConnections = Array.from(clusterConnections)
      const avgStrength = allConnections.reduce((sum, connId) => {
        const conn = graph.connections.get(connId)
        return sum + (conn?.strength || 0)
      }, 0) / Math.max(1, allConnections.length)

      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        nodes: Array.from(clusterNodes),
        dominantType,
        coherence: avgStrength,
        centralNodeId,
        connectionsToExternal: [] // Could be computed
      })
    }
  }

  return clusters.sort((a, b) => b.coherence - a.coherence)
}

// =============================================================================
// Contextual Recommendation Functions
// =============================================================================

/**
 * Get narrative recommendations based on graph analysis
 */
export function getNarrativeRecommendations(graph: NarrativeContextGraph): string[] {
  const recommendations: string[] = []
  const analysis = analyzeGraph(graph)

  // Isolated nodes
  if (analysis.isolatedNodes.length > 3) {
    recommendations.push(`${analysis.isolatedNodes.length} nodes are isolated - consider adding connections to improve narrative cohesion`)
  }

  // Dense clusters
  const clusters = detectSubgraphClusters(graph)
  const denseClusters = clusters.filter(c => c.coherence > 0.8)
  if (denseClusters.length > 0) {
    recommendations.push(`${denseClusters.length} highly cohesive subgraph cluster(s) - ensure they connect to main plot`)
  }

  // High emotional charge concentration
  if (analysis.emotionalHotspots.length > 10) {
    recommendations.push(`Many emotional hotspots detected (${analysis.emotionalHotspots.length}) - consider balancing emotional distribution across chapters`)
  }

  // Low density
  if (analysis.density < 0.1 && analysis.totalNodes > 20) {
    recommendations.push(`Graph density is low (${(analysis.density * 100).toFixed(1)}%) - consider adding more contextual relationships between elements`)
  }

  // Over-connected nodes
  const overConnected = analysis.mostConnectedNodes.filter(n => n.connections.length > 20)
  if (overConnected.length > 0) {
    recommendations.push(`${overConnected.length} nodes are over-connected - consider splitting narrative load across multiple nodes`)
  }

  return recommendations
}

/**
 * Format graph analysis summary
 */
export function formatGraphAnalysis(analysis: GraphAnalysis): string {
  const lines = [
    `=== Narrative Context Graph Analysis ===`,
    `Nodes: ${analysis.totalNodes} | Connections: ${analysis.totalConnections} | Density: ${(analysis.density * 100).toFixed(1)}%`,
    ``
  ]

  if (analysis.mostConnectedNodes.length > 0) {
    lines.push(`Most Connected Nodes:`)
    for (const node of analysis.mostConnectedNodes.slice(0, 5)) {
      lines.push(`  [${node.type}] ${node.label} (${node.connections.length} connections)`)
    }
    lines.push('')
  }

  if (analysis.emotionalHotspots.length > 0) {
    lines.push(`Emotional Hotspots:`)
    for (const node of analysis.emotionalHotspots.slice(0, 3)) {
      lines.push(`  ${node.label} (charge: ${node.emotionalCharge > 0 ? '+' : ''}${node.emotionalCharge.toFixed(2)})`)
    }
    lines.push('')
  }

  if (analysis.isolatedNodes.length > 0) {
    lines.push(`Isolated Nodes: ${analysis.isolatedNodes.length}`)
  }

  return lines.join('\n')
}

/**
 * Prune low-value nodes from graph
 */
export function pruneGraph(
  graph: NarrativeContextGraph,
  config: ContextGraphConfig = DEFAULT_CONTEXT_GRAPH_CONFIG
): NarrativeContextGraph {
  let result = graph

  // Remove weak nodes
  const nodesToRemove: string[] = []
  for (const [nodeId, node] of Array.from(graph.nodes)) {
    if (node.strength < config.pruningThreshold && node.connections.length === 0) {
      nodesToRemove.push(nodeId)
    }
  }

  for (const nodeId of nodesToRemove) {
    result = removeNode(result, nodeId)
  }

  return result
}

/**
 * Remove node from graph
 */
export function removeNode(
  graph: NarrativeContextGraph,
  nodeId: string
): NarrativeContextGraph {
  const nodes = new Map(graph.nodes)
  const connections = new Map(graph.connections)
  const adjacencyList = new Map(graph.adjacencyList)
  const chapterIndex = new Map(graph.chapterIndex)
  const typeIndex = new Map(graph.typeIndex)

  const node = nodes.get(nodeId)
  if (!node) return graph

  // Remove connections involving this node
  for (const conn of node.connections) {
    connections.delete(conn.id)
  }

  // Remove from adjacency lists
  for (const [id, neighbors] of Array.from(adjacencyList)) {
    if (neighbors.has(nodeId)) {
      adjacencyList.set(id, new Set(Array.from(neighbors).filter(nid => nid !== nodeId)))
    }
  }

  // Remove from chapter index
  for (const [chapter, nodeIds] of Array.from(chapterIndex)) {
    if (nodeIds.has(nodeId)) {
      chapterIndex.set(chapter, new Set(Array.from(nodeIds).filter(nid => nid !== nodeId)))
    }
  }

  // Remove from type index
  const typeNodes = typeIndex.get(node.type)
  if (typeNodes) {
    typeIndex.set(node.type, new Set(Array.from(typeNodes).filter(nid => nid !== nodeId)))
  }

  nodes.delete(nodeId)
  adjacencyList.delete(nodeId)

  return {
    nodes,
    connections,
    adjacencyList,
    chapterIndex,
    typeIndex,
    lastUpdated: Date.now()
  }
}