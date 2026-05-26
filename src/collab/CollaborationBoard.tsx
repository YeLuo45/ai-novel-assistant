/**
 * CollaborationBoard - V55
 * Container component for Multi-Agent Writing Collaboration visualization
 */

import { h } from 'preact'
import { useState, useCallback, useMemo } from 'preact/hooks'
import { DAGVisualizer } from './DAGVisualizer'
import { AgentTimeline } from './AgentTimeline'
import { WritingMetricsPanel } from './WritingMetricsPanel'
import type { DAGNode, DAGEdge, AgentExecution, WritingMetrics } from './types'
import { WRITING_WORKFLOW_NODES, WRITING_WORKFLOW_EDGES } from './types'

export interface CollaborationBoardProps {
  className?: string
  executionHistory?: AgentExecution[]
  currentMetrics?: WritingMetrics | null
  onNodeSelect?: (nodeId: string) => void
}

export function CollaborationBoard({
  className = '',
  executionHistory = [],
  currentMetrics = null,
  onNodeSelect
}: CollaborationBoardProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Initialize DAG nodes from workflow definition
  const nodes = useMemo<DAGNode[]>(() => {
    return WRITING_WORKFLOW_NODES.map(n => ({
      ...n,
      status: 'pending' as const,
      metadata: {}
    }))
  }, [])

  // Initialize DAG edges from workflow definition
  const edges = useMemo<DAGEdge[]>(() => {
    return WRITING_WORKFLOW_EDGES.map((e, idx) => ({
      ...e,
      id: `edge-${idx}`
    }))
  }, [])

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId)
    onNodeSelect?.(nodeId)
  }, [selectedNodeId, onNodeSelect])

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId)
  }, [nodes, selectedNodeId])

  return (
    <div class={`collaboration-board ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
          🤝 Multi-Agent Writing Collaboration
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          {executionHistory.length} agents executed
        </div>
      </div>

      {/* DAG Visualization */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 12 }}>
          📊 Workflow DAG
        </div>
        <DAGVisualizer
          nodes={nodes}
          edges={edges}
          width={900}
          height={300}
          selectedNodeId={selectedNodeId || undefined}
          onNodeClick={handleNodeClick}
        />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Agent Timeline */}
        <div style={{ flex: 1 }}>
          <AgentTimeline
            executions={executionHistory}
            height={160}
          />
        </div>

        {/* Metrics Panel */}
        <div style={{ width: 300 }}>
          <WritingMetricsPanel metrics={currentMetrics} />
        </div>
      </div>

      {/* Selected Node Detail */}
      {selectedNode && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
            📋 Node Detail
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 12 }}>
            <div style={{ color: '#6B7280' }}>ID:</div>
            <div style={{ color: '#1F2937', fontFamily: 'monospace' }}>{selectedNode.id}</div>
            <div style={{ color: '#6B7280' }}>Type:</div>
            <div style={{ color: '#1F2937' }}>{selectedNode.type}</div>
            <div style={{ color: '#6B7280' }}>Status:</div>
            <div style={{ color: '#1F2937' }}>{selectedNode.status}</div>
            <div style={{ color: '#6B7280' }}>Inputs:</div>
            <div style={{ color: '#1F2937' }}>{selectedNode.inputs.length > 0 ? selectedNode.inputs.join(', ') : '(none)'}</div>
            <div style={{ color: '#6B7280' }}>Outputs:</div>
            <div style={{ color: '#1F2937' }}>{selectedNode.outputs.length > 0 ? selectedNode.outputs.join(', ') : '(none)'}</div>
          </div>
        </div>
      )}
    </div>
  )
}