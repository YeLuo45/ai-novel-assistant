/**
 * Collaboration DAG Types - V55
 * Types for Multi-Agent Writing Collaboration Visualization
 */

export type DAGNodeType = 'task' | 'agent' | 'data'

export type DAGNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export type DAGEdgeType = 'depends_on' | 'outputs_to' | 'triggers'

export interface DAGNodeMetadata {
  agentId?: string
  taskId?: string
  tokenCount?: number
  errorMessage?: string
  retries?: number
  priority?: number
}

export interface DAGNode {
  id: string
  type: DAGNodeType
  name: string
  status: DAGNodeStatus
  inputs: string[]
  outputs: string[]
  metadata: DAGNodeMetadata
  startTime?: number
  endTime?: number
}

export interface DAGEdge {
  id: string
  source: string
  target: string
  type: DAGEdgeType
  data?: unknown
}

export interface WritingDAG {
  nodes: Map<string, DAGNode>
  edges: DAGEdge[]
}

export interface AgentExecution {
  agentId: string
  agentName: string
  startTime: number
  endTime?: number
  status: DAGNodeStatus
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
}

export interface WritingMetrics {
  chapterNumber: number
  chapterTitle: string
  wordCount: number
  targetWordCount: number
  coherence: number
  expression: number
  creativity: number
  structure: number
  engagement: number
  timestamp: number
}

export const DAG_COLORS: Record<DAGNodeStatus, string> = {
  pending: '#9CA3AF',   // gray
  running: '#3B82F6',   // blue
  completed: '#10B981', // green
  failed: '#EF4444',    // red
  skipped: '#6B7280'    // dark gray
}

export const NODE_TYPE_LABELS: Record<DAGNodeType, string> = {
  task: '任务',
  agent: 'Agent',
  data: '数据'
}

/**
 * Predefined writing workflow DAG structure
 */
export const WRITING_WORKFLOW_NODES: Omit<DAGNode, 'status' | 'metadata'>[] = [
  { id: 'planning', type: 'task', name: 'Planning', inputs: [], outputs: ['plot_design'] },
  { id: 'plot_design', type: 'agent', name: 'PlotDesign Agent', inputs: ['planning'], outputs: ['world_building', 'character_design'] },
  { id: 'world_building', type: 'agent', name: 'WorldBuilding Agent', inputs: ['plot_design'], outputs: ['writing'] },
  { id: 'character_design', type: 'agent', name: 'CharacterDesign Agent', inputs: ['plot_design'], outputs: ['writing'] },
  { id: 'writing', type: 'agent', name: 'Writing Agent', inputs: ['world_building', 'character_design'], outputs: ['review'] },
  { id: 'review', type: 'agent', name: 'Review Agent', inputs: ['writing'], outputs: ['evolution'] },
  { id: 'evolution', type: 'agent', name: 'Evolution Agent', inputs: ['review'], outputs: [] }
]

export const WRITING_WORKFLOW_EDGES: Omit<DAGEdge, 'id'>[] = [
  { source: 'planning', target: 'plot_design', type: 'depends_on' },
  { source: 'plot_design', target: 'world_building', type: 'outputs_to' },
  { source: 'plot_design', target: 'character_design', type: 'outputs_to' },
  { source: 'world_building', target: 'writing', type: 'depends_on' },
  { source: 'character_design', target: 'writing', type: 'depends_on' },
  { source: 'writing', target: 'review', type: 'depends_on' },
  { source: 'review', target: 'evolution', type: 'triggers' }
]