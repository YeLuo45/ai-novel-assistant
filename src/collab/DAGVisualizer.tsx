/**
 * DAGVisualizer - V55
 * Renders Multi-Agent Writing DAG as interactive SVG
 */

import { h } from 'preact'
import { useState, useCallback, useMemo } from 'preact/hooks'
import type { DAGNode, DAGEdge, DAGNodeStatus } from './types'
import { DAG_COLORS, NODE_TYPE_LABELS } from './types'
import { DAGNodeComponent } from './DAGNode'
import { DAGEdgeComponent } from './DAGEdge'

export interface DAGVisualizerProps {
  nodes: DAGNode[]
  edges: DAGEdge[]
  width?: number
  height?: number
  selectedNodeId?: string
  onNodeClick?: (nodeId: string) => void
}

const NODE_WIDTH = 160
const NODE_HEIGHT = 60
const HORIZONTAL_SPACING = 200
const VERTICAL_SPACING = 80
const PADDING = 40

interface LayoutNode extends DAGNode {
  x: number
  y: number
}

export function DAGVisualizer({
  nodes,
  edges,
  width = 1000,
  height = 400,
  selectedNodeId,
  onNodeClick
}: DAGVisualizerProps) {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

  // Compute layout using topological sort levels
  const layoutNodes = useMemo<LayoutNode[]>(() => {
    const nodeMap = new Map<string, DAGNode>(nodes.map(n => [n.id, n]))
    const levels = new Map<string, number>()
    const visited = new Set<string>()

    // Find root nodes (no inputs)
    const roots = nodes.filter(n => n.inputs.length === 0)
    roots.forEach(r => levels.set(r.id, 0))

    // BFS to assign levels
    const queue = [...roots]
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const node = nodeMap.get(nodeId)
      if (!node) continue

      const currentLevel = levels.get(nodeId) || 0

      for (const outputId of node.outputs) {
        const existingLevel = levels.get(outputId) || 0
        levels.set(outputId, Math.max(existingLevel, currentLevel + 1))
        const outputNode = nodeMap.get(outputId)
        if (outputNode && !visited.has(outputId)) {
          queue.push(outputId)
        }
      }
    }

    // Group nodes by level
    const levelGroups = new Map<number, string[]>()
    for (const [nodeId, level] of levels) {
      if (!levelGroups.has(level)) levelGroups.set(level, [])
      levelGroups.get(level)!.push(nodeId)
    }

    // Assign positions
    const result: LayoutNode[] = []
    const nodeWidths = new Map<string, number>()

    for (const [level, nodeIds] of levelGroups) {
      const x = PADDING + level * (NODE_WIDTH + HORIZONTAL_SPACING)
      nodeIds.forEach((nodeId, idx) => {
        const node = nodeMap.get(nodeId)!
        const y = PADDING + idx * (NODE_HEIGHT + VERTICAL_SPACING)
        result.push({ ...node, x, y })
        nodeWidths.set(nodeId, x)
      })
    }

    // Handle disconnected nodes
    for (const node of nodes) {
      if (!levels.has(node.id)) {
        const maxLevel = Math.max(...[...levels.values()], 0)
        const x = PADDING + (maxLevel + 1) * (NODE_WIDTH + HORIZONTAL_SPACING)
        const y = PADDING + Math.random() * (height - NODE_HEIGHT - 2 * PADDING)
        result.push({ ...node, x, y })
      }
    }

    return result
  }, [nodes, edges, width, height])

  // Compute SVG path for edges
  const edgePaths = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = layoutNodes.find(n => n.id === edge.source)
      const targetNode = layoutNodes.find(n => n.id === edge.target)
      if (!sourceNode || !targetNode) return null

      const x1 = sourceNode.x + NODE_WIDTH
      const y1 = sourceNode.y + NODE_HEIGHT / 2
      const x2 = targetNode.x
      const y2 = targetNode.y + NODE_HEIGHT / 2

      const midX = (x1 + x2) / 2

      const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`

      return { edge, path, x1, y1, x2, y2 }
    }).filter(Boolean)
  }, [edges, layoutNodes])

  return (
    <div class="dag-visualizer" style={{ width, height, position: 'relative', overflow: 'auto' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
          </marker>
        </defs>

        {/* Render edges first (behind nodes) */}
        <g class="edges">
          {edgePaths.map(item => {
            if (!item) return null
            const { edge, path, x2, y2 } = item
            const isActive = hoveredEdgeId === edge.id || edge.source === selectedNodeId || edge.target === selectedNodeId

            return (
              <path
                key={edge.id}
                d={path}
                fill="none"
                stroke={isActive ? '#3B82F6' : '#9CA3AF'}
                stroke-width={isActive ? 2 : 1}
                stroke-dasharray={edge.type === 'depends_on' ? 'none' : '5,5'}
                marker-end={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
              />
            )
          })}
        </g>

        {/* Render nodes */}
        <g class="nodes">
          {layoutNodes.map(node => (
            <DAGNodeComponent
              key={node.id}
              node={node}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              isSelected={node.id === selectedNodeId}
              isHighlighted={
                node.id === selectedNodeId ||
                edges.some(e => (e.source === selectedNodeId || e.target === selectedNodeId) && (e.source === node.id || e.target === node.id))
              }
              onClick={() => onNodeClick?.(node.id)}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}