/**
 * DAGEdge Component - V55
 * Edge/connection between nodes in the DAG
 */

import { h } from 'preact'

export interface DAGEdgeComponentProps {
  x1: number
  y1: number
  x2: number
  y2: number
  type: 'depends_on' | 'outputs_to' | 'triggers'
  isActive: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function DAGEdgeComponent({
  x1, y1, x2, y2,
  type,
  isActive,
  onMouseEnter,
  onMouseLeave
}: DAGEdgeComponentProps) {
  const midX = (x1 + x2) / 2
  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`

  const strokeColor = isActive ? '#3B82F6' : '#9CA3AF'
  const strokeDash = type === 'triggers' ? '8,4' : type === 'outputs_to' ? '4,4' : 'none'

  return (
    <path
      d={path}
      fill="none"
      stroke={strokeColor}
      stroke-width={isActive ? 2.5 : 1.5}
      stroke-dasharray={strokeDash}
      marker-end={`url(#arrowhead${isActive ? '-active' : ''})`}
      style={{ cursor: 'pointer', transition: 'stroke 0.2s, stroke-width 0.2s' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  )
}