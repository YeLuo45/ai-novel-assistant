/**
 * AgentCanvas - V68
 * Zero-Code Agent Orchestration Canvas - Visual drag-and-drop workflow builder
 * Extends V65 CollaborationBoard from passive visualization to active orchestration
 * 
 * Inspired by: chatdev-design Zero-Code workflow + ruflo-design 27 hooks
 */

import { h } from 'preact'
import { useState, useCallback, useMemo } from 'preact/hooks'
import type { DAGNode, DAGEdge, AgentExecution } from './types'

// ===============================================================================
// Types
// ===============================================================================

export type CanvasNodeType = 
  | 'trigger'      // 触发器节点
  | 'agent'        // 代理节点
  | 'tool'         // 工具节点
  | 'condition'    // 条件节点
  | 'output'       // 输出节点

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  name: string
  description: string
  position: { x: number; y: number }
  config: AgentNodeConfig
  connections: string[]  // 连接的节点ID
}

export interface AgentNodeConfig {
  agentType?: string      // 'PlotAgent' | 'DialogueAgent' | etc.
  toolIds?: string[]      // 使用的工具
  trigger?: TriggerConfig  // 触发条件
  condition?: ConditionConfig // 条件配置
}

export interface TriggerConfig {
  type: 'event' | 'schedule' | 'webhook' | 'manual'
  event?: string          // e.g., 'chapter:complete', 'skill:triggered'
  schedule?: string       // cron expression
  webhookUrl?: string
}

export interface ConditionConfig {
  field: string           // e.g., 'context.genre', 'writingStage'
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt'
  value: string | number
}

export interface CanvasEdge {
  id: string
  sourceId: string
  targetId: string
  label?: string
  condition?: ConditionConfig
}

export interface CanvasProject {
  id: string
  name: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  createdAt: number
  updatedAt: number
}

// ===============================================================================
// Default Node Templates
// ===============================================================================

export const CANVAS_NODE_TEMPLATES: Record<CanvasNodeType, Partial<CanvasNode>> = {
  trigger: {
    type: 'trigger',
    name: '触发器',
    description: '工作流入口点',
    config: {
      trigger: { type: 'manual' }
    }
  },
  agent: {
    type: 'agent',
    name: '写作代理',
    description: 'AI写作代理节点',
    config: {
      agentType: 'PlotAgent'
    }
  },
  tool: {
    type: 'tool',
    name: '工具节点',
    description: '执行特定工具',
    config: {}
  },
  condition: {
    type: 'condition',
    name: '条件分支',
    description: '基于条件的路由',
    config: {
      condition: { field: 'genre', operator: 'eq', value: 'fantasy' }
    }
  },
  output: {
    type: 'output',
    name: '输出节点',
    description: '输出结果',
    config: {}
  }
}

export const AGENT_TYPES = [
  'PlotAgent',       // 情节生成
  'DialogueAgent',   // 对话生成
  'DescriptionAgent', // 场景描写
  'WorldBuildAgent',  // 世界观构建
  'CharacterAgent',  // 角色塑造
  'EditAgent',       // 编辑修订
  'QualityAgent'     // 质量监控
]

// ===============================================================================
// AgentCanvas Component
// ===============================================================================

export interface AgentCanvasProps {
  className?: string
  initialProject?: CanvasProject | null
  onSave?: (project: CanvasProject) => void
  onExecute?: (project: CanvasProject) => void
  readOnly?: boolean
}

export function AgentCanvas({
  className = '',
  initialProject = null,
  onSave,
  onExecute,
  readOnly = false
}: AgentCanvasProps) {
  // Canvas state
  const [project, setProject] = useState<CanvasProject>(() => 
    initialProject || createEmptyProject('未命名工作流')
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [draggedNodeType, setDraggedNodeType] = useState<CanvasNodeType | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionLog, setExecutionLog] = useState<string[]>([])

  // Create empty project
  function createEmptyProject(name: string): CanvasProject {
    return {
      id: `canvas-${Date.now()}`,
      name,
      nodes: [],
      edges: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  // Add node to canvas
  const addNode = useCallback((
    type: CanvasNodeType,
    position: { x: number; y: number }
  ) => {
    const template = CANVAS_NODE_TEMPLATES[type]
    const newNode: CanvasNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      name: template.name || type,
      description: template.description || '',
      position,
      config: { ...template.config } as AgentNodeConfig,
      connections: []
    }
    
    setProject(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: Date.now()
    }))
    
    return newNode.id
  }, [])

  // Remove node from canvas
  const removeNode = useCallback((nodeId: string) => {
    setProject(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId),
      updatedAt: Date.now()
    }))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }, [selectedNodeId])

  // Connect two nodes
  const connectNodes = useCallback((
    sourceId: string,
    targetId: string,
    label?: string
  ) => {
    // Check if connection already exists
    const exists = project.edges.some(
      e => e.sourceId === sourceId && e.targetId === targetId
    )
    if (exists) return
    
    const newEdge: CanvasEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceId,
      targetId,
      label
    }
    
    setProject(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
      updatedAt: Date.now()
    }))
  }, [project.edges])

  // Update node position (drag)
  const updateNodePosition = useCallback((
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    setProject(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => 
        n.id === nodeId ? { ...n, position } : n
      ),
      updatedAt: Date.now()
    }))
  }, [])

  // Update node config
  const updateNodeConfig = useCallback((
    nodeId: string,
    config: Partial<AgentNodeConfig>
  ) => {
    setProject(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => 
        n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
      ),
      updatedAt: Date.now()
    }))
  }, [])

  // Handle drag over (for drop)
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
  }, [])

  // Handle drop (add new node)
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (readOnly) return
    
    const nodeType = draggedNodeType || 'agent'
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    const newNodeId = addNode(nodeType, position)
    setSelectedNodeId(newNodeId)
    setDraggedNodeType(null)
  }, [draggedNodeType, addNode, readOnly])

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    if (isExecuting || project.nodes.length === 0) return
    
    setIsExecuting(true)
    setExecutionLog(['🚀 开始执行工作流...'])
    
    try {
      // Topological sort for execution order
      const executionOrder = topologicalSort(project.nodes, project.edges)
      
      for (const nodeId of executionOrder) {
        const node = project.nodes.find(n => n.id === nodeId)
        if (!node) continue
        
        setExecutionLog(prev => [...prev, `⚡ 执行节点: ${node.name}`])
        
        // Simulate execution
        await simulateExecution(node)
        
        setExecutionLog(prev => [...prev, `✅ 完成: ${node.name}`])
      }
      
      setExecutionLog(prev => [...prev, '🎉 工作流执行完成!'])
    } catch (error) {
      setExecutionLog(prev => [...prev, `❌ 执行失败: ${error}`])
    } finally {
      setIsExecuting(false)
    }
  }, [project, isExecuting])

  // Simulate node execution (placeholder for real agent execution)
  const simulateExecution = async (node: CanvasNode): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(resolve, 500 + Math.random() * 500)
    })
  }

  // Topological sort for execution order
  const topologicalSort = (nodes: CanvasNode[], edges: CanvasEdge[]): string[] => {
    const inDegree: Record<string, number> = {}
    const adjacency: Record<string, string[]> = {}
    
    nodes.forEach(n => {
      inDegree[n.id] = 0
      adjacency[n.id] = []
    })
    
    edges.forEach(e => {
      adjacency[e.sourceId].push(e.targetId)
      inDegree[e.targetId]++
    })
    
    const queue: string[] = []
    Object.entries(inDegree).forEach(([id, degree]) => {
      if (degree === 0) queue.push(id)
    })
    
    const result: string[] = []
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      result.push(nodeId)
      
      adjacency[nodeId].forEach(targetId => {
        inDegree[targetId]--
        if (inDegree[targetId] === 0) {
          queue.push(targetId)
        }
      })
    }
    
    return result
  }

  // Get selected node
  const selectedNode = useMemo(() => 
    project.nodes.find(n => n.id === selectedNodeId) || null
  , [project.nodes, selectedNodeId])

  // Stats
  const stats = useMemo(() => ({
    totalNodes: project.nodes.length,
    agentNodes: project.nodes.filter(n => n.type === 'agent').length,
    triggerNodes: project.nodes.filter(n => n.type === 'trigger').length,
    edges: project.edges.length
  }), [project])

  return (
    <div class={`agent-canvas ${className}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: '#1F2937' }}>🤖 Agent Canvas</span>
          <input
            type="text"
            value={project.name}
            onInput={(e) => setProject(prev => ({ ...prev, name: (e.target as HTMLInputElement).value }))}
            readOnly={readOnly}
            style={{ 
              border: '1px solid #D1D5DB', 
              borderRadius: 4, 
              padding: '4px 8px',
              fontSize: 14
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => onSave?.(project)}
            disabled={readOnly}
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #D1D5DB', 
              borderRadius: 4,
              backgroundColor: '#fff',
              cursor: readOnly ? 'not-allowed' : 'pointer'
            }}
          >
            💾 保存
          </button>
          <button 
            onClick={executeWorkflow}
            disabled={readOnly || isExecuting}
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #10B981', 
              borderRadius: 4,
              backgroundColor: isExecuting ? '#D1FAE5' : '#10B981',
              color: '#fff',
              cursor: isExecuting ? 'not-allowed' : 'pointer'
            }}
          >
            {isExecuting ? '⏳ 执行中...' : '▶️ 执行'}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Node Palette */}
        <div style={{ 
          width: 200, 
          borderRight: '1px solid #E5E7EB',
          padding: 12,
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
            📦 节点面板
          </div>
          {(['trigger', 'agent', 'tool', 'condition', 'output'] as CanvasNodeType[]).map(type => (
            <div
              key={type}
              draggable={!readOnly}
              onDragStart={() => setDraggedNodeType(type)}
              style={{
                padding: '8px 12px',
                marginBottom: 4,
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                backgroundColor: '#fff',
                cursor: readOnly ? 'default' : 'grab',
                fontSize: 13
              }}
            >
              {type === 'trigger' && '🔔 '}{type === 'trigger' && '触发器'}
              {type === 'agent' && '🤖 '}{type === 'agent' && '代理'}
              {type === 'tool' && '🔧 '}{type === 'tool' && '工具'}
              {type === 'condition' && '❓ '}{type === 'condition' && '条件'}
              {type === 'output' && '📤 '}{type === 'output' && '输出'}
            </div>
          ))}
          
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', margin: '16px 0 8px' }}>
            🤖 代理类型
          </div>
          {AGENT_TYPES.map(agentType => (
            <div
              key={agentType}
              draggable={!readOnly}
              onDragStart={() => {
                setDraggedNodeType('agent')
              }}
              style={{
                padding: '6px 10px',
                marginBottom: 2,
                border: '1px dashed #D1D5DB',
                borderRadius: 4,
                backgroundColor: '#fff',
                cursor: readOnly ? 'default' : 'grab',
                fontSize: 12,
                color: '#4B5563'
              }}
            >
              {agentType}
            </div>
          ))}
        </div>

        {/* Canvas Area */}
        <div
          style={{ flex: 1, position: 'relative', overflow: 'auto', backgroundColor: '#FAFAFA' }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Grid Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          {/* Nodes */}
          {project.nodes.map(node => (
            <CanvasNodeComponent
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
              onPositionChange={(pos) => updateNodePosition(node.id, pos)}
              onRemove={() => removeNode(node.id)}
              readOnly={readOnly}
            />
          ))}

          {/* Edges (SVG overlay) */}
          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {project.edges.map(edge => {
              const source = project.nodes.find(n => n.id === edge.sourceId)
              const target = project.nodes.find(n => n.id === edge.targetId)
              if (!source || !target) return null
              
              const x1 = source.position.x + 75
              const y1 = source.position.y + 30
              const x2 = target.position.x + 75
              const y2 = target.position.y + 30
              
              return (
                <g key={edge.id}>
                  <line
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke="#9CA3AF"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
                    </marker>
                  </defs>
                  {edge.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 10}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#6B7280"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          
          {/* Empty State */}
          {project.nodes.length === 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>拖拽节点到画布上开始构建工作流</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>从左侧面板拖拽节点到此处</div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div style={{ 
            width: 280, 
            borderLeft: '1px solid #E5E7EB',
            padding: 12,
            backgroundColor: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>⚙️ 节点属性</span>
              <button
                onClick={() => setSelectedNodeId(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6B7280' }}>名称</label>
              <input
                type="text"
                value={selectedNode.name}
                onInput={(e) => updateNodeConfig(selectedNode.id, { agentType: (e.target as HTMLInputElement).value })}
                readOnly={readOnly}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 4 }}
              />
            </div>
            
            {selectedNode.type === 'agent' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#6B7280' }}>代理类型</label>
                <select
                  value={selectedNode.config.agentType || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, { agentType: (e.target as HTMLSelectElement).value })}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 4 }}
                >
                  {AGENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6B7280' }}>描述</label>
              <textarea
                value={selectedNode.description}
                onInput={(e) => {
                  const newDesc = (e.target as HTMLTextAreaElement).value
                  setProject(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n => 
                      n.id === selectedNode.id ? { ...n, description: newDesc } : n
                    ),
                    updatedAt: Date.now()
                  }))
                }}
                readOnly={readOnly}
                rows={3}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 4, resize: 'vertical' }}
              />
            </div>
            
            <button
              onClick={() => removeNode(selectedNode.id)}
              disabled={readOnly}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #EF4444', 
                borderRadius: 4,
                backgroundColor: '#FEF2F2',
                color: '#EF4444',
                cursor: readOnly ? 'not-allowed' : 'pointer'
              }}
            >
              🗑️ 删除节点
            </button>
          </div>
        )}
      </div>

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div style={{
          height: 120,
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#1F2937',
          color: '#F9FAFB',
          fontFamily: 'monospace',
          fontSize: 12,
          padding: 8,
          overflow: 'auto'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>📜 执行日志</div>
          {executionLog.map((log, i) => (
            <div key={i} style={{ marginBottom: 2 }}>{log}</div>
          ))}
        </div>
      )}

      {/* Stats Bar */}
      <div style={{
        padding: '4px 16px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
        fontSize: 12,
        color: '#6B7280'
      }}>
        节点: {stats.totalNodes} | 代理: {stats.agentNodes} | 触发器: {stats.triggerNodes} | 连接: {stats.edges}
      </div>
    </div>
  )
}

// ===============================================================================
// CanvasNodeComponent
// ===============================================================================

interface CanvasNodeComponentProps {
  node: CanvasNode
  isSelected: boolean
  onClick: () => void
  onPositionChange: (pos: { x: number; y: number }) => void
  onRemove: () => void
  readOnly: boolean
}

function CanvasNodeComponent({
  node,
  isSelected,
  onClick,
  onPositionChange,
  onRemove,
  readOnly
}: CanvasNodeComponentProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (readOnly) return
    e.stopPropagation()
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    })
  }, [readOnly, node.position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    onPositionChange({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    })
  }, [isDragging, dragOffset, onPositionChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const typeColors: Record<CanvasNodeType, string> = {
    trigger: '#F59E0B',
    agent: '#3B82F6',
    tool: '#10B981',
    condition: '#8B5CF6',
    output: '#EF4444'
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: 150,
        padding: 12,
        border: `2px solid ${isSelected ? '#3B82F6' : '#D1D5DB'}`,
        borderRadius: 8,
        backgroundColor: '#fff',
        cursor: readOnly ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        userSelect: 'none'
      }}
    >
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: typeColors[node.type],
        marginBottom: 8
      }} />
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{node.name}</div>
      <div style={{ fontSize: 11, color: '#6B7280' }}>{node.type}</div>
      {node.config.agentType && (
        <div style={{ fontSize: 10, color: '#3B82F6', marginTop: 4 }}>{node.config.agentType}</div>
      )}
    </div>
  )
}

export default AgentCanvas