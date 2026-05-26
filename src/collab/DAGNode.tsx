/**
 * DAGNode Component - V55
 * Individual node in the DAG visualization
 */

import { h } from 'preact'
import type { DAGNode } from './types'
import { DAG_COLORS, NODE_TYPE_LABELS } from './types'

export interface DAGNodeProps {
  node: DAGNode & { x: number; y: number }
  width: number
  height: number
  isSelected: boolean
  isHighlighted: boolean
  onClick?: () => void
}

export function DAGNodeComponent({
  node,
  width,
  height,
  isSelected,
  isHighlighted,
  onClick
}: DAGNodeProps) {
  const fillColor = DAG_COLORS[node.status]
  const strokeColor = isSelected ? '#1F2937' : isHighlighted ? '#3B82F6' : '#E5E7EB'
  const strokeWidth = isSelected || isHighlighted ? 2 : 1

  // Type icon
  const typeIcons: Record<string, string> = {
    task: '📋',
    agent: '🤖',
    data: '📊'
  }

  // Status icon
  const statusIcons: Record<string, string> = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌',
    skipped: '⏭️'
  }

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Background rect */}
      <rect
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill="#FFFFFF"
        stroke={strokeColor}
        stroke-width={strokeWidth}
        filter={isSelected ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none'}
      />

      {/* Status indicator bar */}
      <rect
        x={0}
        y={0}
        width={6}
        height={height}
        rx={3}
        ry={0}
        fill={fillColor}
      />

      {/* Type icon */}
      <text
        x={16}
        y={height / 2 - 6}
        font-size={14}
        font-family="system-ui"
      >
        {typeIcons[node.type] || '📋'}
      </text>

      {/* Node name */}
      <text
        x={36}
        y={height / 2 - 6}
        font-size={13}
        font-weight={500}
        fill="#1F2937"
        font-family="system-ui"
      >
        {node.name.length > 14 ? node.name.slice(0, 14) + '...' : node.name}
      </text>

      {/* Status icon and label */}
      <text
        x={16}
        y={height / 2 + 12}
        font-size={11}
        fill="#6B7280"
        font-family="system-ui"
      >
        {statusIcons[node.status]} {node.status}
      </text>

      {/* Duration if available */}
      {node.duration && (
        <text
          x={width - 16}
          y={height - 10}
          font-size={10}
          fill="#9CA3AF"
          text-anchor="end"
          font-family="system-ui"
        >
          {node.duration < 1000 ? `${node.duration}ms` : `${(node.duration / 1000).toFixed(1)}s`}
        </text>
      )}
    </g>
  )
}