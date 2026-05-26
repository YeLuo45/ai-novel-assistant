/**
 * ToolDepGraph - V57
 * Visualizes tool dependencies as a directed graph
 */

import { h } from 'preact'
import { useMemo } from 'preact/hooks'
import type { ToolListing } from '../smartMarket/toolMarketTypes'

export interface ToolDepGraphProps {
  tools: ToolListing[]
  width?: number
  height?: number
  onNodeClick?: (toolId: string) => void
}

interface LayoutNode extends ToolListing {
  x: number
  y: number
}

export function ToolDepGraph({
  tools,
  width = 800,
  height = 400,
  onNodeClick
}: ToolDepGraphProps) {
  // Build dependency graph
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, ToolListing>(tools.map(t => [t.id, t]))
    const layoutNodes: LayoutNode[] = []
    const graphEdges: { from: string; to: string }[] = []

    // Simple layered layout
    const levels = new Map<string, number>()
    const visited = new Set<string>()

    // Find root nodes (no dependencies)
    const roots = tools.filter(t => t.dependencies.length === 0)
    roots.forEach(r => levels.set(r.id, 0))

    // BFS to assign levels
    const queue = [...roots]
    while (queue.length > 0) {
      const toolId = queue.shift()!
      if (visited.has(toolId)) continue
      visited.add(toolId)

      const tool = nodeMap.get(toolId)
      if (!tool) continue

      const currentLevel = levels.get(toolId) || 0

      // This tool is a dependency of what?
      for (const t of tools) {
        if (t.dependencies.includes(toolId) && !levels.has(t.id)) {
          levels.set(t.id, currentLevel + 1)
          queue.push(t.id)
        }
      }
    }

    // Group by level
    const levelGroups = new Map<number, string[]>()
    for (const [nodeId, level] of levels) {
      if (!levelGroups.has(level)) levelGroups.set(level, [])
      levelGroups.get(level)!.push(nodeId)
    }

    // Assign positions
    const nodeWidth = 120
    const nodeHeight = 50
    const hSpacing = 160
    const vSpacing = 70

    for (const [level, nodeIds] of levelGroups) {
      const x = 60 + level * hSpacing
      nodeIds.forEach((nodeId, idx) => {
        const tool = nodeMap.get(nodeId)!
        const y = 60 + idx * vSpacing
        layoutNodes.push({ ...tool, x, y })
      })
    }

    // Handle disconnected nodes
    for (const tool of tools) {
      if (!levels.has(tool.id)) {
        const maxLevel = Math.max(...[...levels.values()], 0)
        const x = 60 + (maxLevel + 1) * hSpacing
        const y = 60 + Math.random() * (height - 120)
        layoutNodes.push({ ...tool, x, y })
      }
    }

    // Build edges
    for (const tool of tools) {
      for (const depId of tool.dependencies) {
        if (nodeMap.has(depId)) {
          graphEdges.push({ from: depId, to: tool.id })
        }
      }
    }

    return { nodes: layoutNodes, edges: graphEdges }
  }, [tools, width, height])

  return (
    <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>
        🔗 Tool Dependency Graph
      </div>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <marker
            id="dep-arrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const source = nodes.find(n => n.id === edge.from)
          const target = nodes.find(n => n.id === edge.to)
          if (!source || !target) return null

          const x1 = source.x + 60
          const y1 = source.y + 25
          const x2 = target.x
          const y2 = target.y + 25
          const midX = (x1 + x2) / 2

          return (
            <path
              key={`edge-${i}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth={1.5}
              markerEnd="url(#dep-arrow)"
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onNodeClick?.(node.id)}
          >
            <rect
              width={120}
              height={50}
              rx={6}
              ry={6}
              fill="#FFFFFF"
              stroke="#E5E7EB"
              strokeWidth={1}
            />
            <rect
              x={0}
              y={0}
              width={4}
              height={50}
              rx={2}
              ry={0}
              fill="#3B82F6"
            />
            <text
              x={12}
              y={20}
              fontSize={11}
              fontWeight={500}
              fill="#1F2937"
            >
              {node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name}
            </text>
            <text
              x={12}
              y={35}
              fontSize={9}
              fill="#9CA3AF"
            >
              {node.dependencies.length} deps
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}