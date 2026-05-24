/**
 * Workflow Canvas - Zero-code Visual Workflow Orchestration
 * V44: Based on chatdev-design pattern
 */

import React, { useState, useCallback } from 'react';

export interface WorkflowNode {
  id: string;
  type: 'phase' | 'condition' | 'loop' | 'human';
  subtype?: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  connections: string[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export const PHASE_TYPES = [
  { type: 'phase', subtype: 'outline', label: '大纲生成', color: '#f97316' },
  { type: 'phase', subtype: 'character', label: '角色创建', color: '#06b6d4' },
  { type: 'phase', subtype: 'chapter', label: '章节编写', color: '#8b5cf6' },
  { type: 'phase', subtype: 'polish', label: '润色优化', color: '#10b981' },
  { type: 'condition', label: '条件分支', color: '#f59e0b' },
  { type: 'loop', label: '循环', color: '#ec4899' },
  { type: 'human', label: '人工介入', color: '#6366f1' },
] as const;

interface WorkflowCanvasProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  onGraphChange?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onGraphChange,
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const notifyChange = useCallback((newNodes: WorkflowNode[], newEdges: WorkflowEdge[]) => {
    onGraphChange?.(newNodes, newEdges);
  }, [onGraphChange]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeData = e.dataTransfer.getData('application/node');
    if (nodeData) {
      const parsed = JSON.parse(nodeData);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: parsed.type,
        subtype: parsed.subtype,
        label: parsed.label,
        position: {
          x: e.clientX - rect.left - 64,
          y: e.clientY - rect.top - 30,
        },
        config: {},
        connections: [],
      };
      setNodes(prev => {
        const updated = [...prev, newNode];
        notifyChange(updated, edges);
        return updated;
      });
    }
  }, [edges, notifyChange]);

  const onNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        const newEdge: WorkflowEdge = {
          id: `edge-${Date.now()}`,
          source: connectingFrom,
          target: nodeId,
        };
        setEdges(prev => {
          const updated = [...prev, newEdge];
          notifyChange(nodes, updated);
          return updated;
        });
      }
      setConnectingFrom(null);
    } else {
      setSelectedNode(nodeId);
    }
  }, [connectingFrom, nodes, notifyChange]);

  const onStartConnect = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingFrom(nodeId);
  }, []);

  const onDeleteNode = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => {
      const updated = prev.filter(n => n.id !== nodeId);
      notifyChange(updated, edges.filter(e => e.source !== nodeId && e.target !== nodeId));
      return updated;
    });
    setEdges(prev => {
      const updated = prev.filter(e => e.source !== nodeId && e.target !== nodeId);
      notifyChange(nodes.filter(n => n.id !== nodeId), updated);
      return updated;
    });
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  }, [edges, nodes, notifyChange, selectedNode]);

  const onDeleteEdge = useCallback((edgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges(prev => {
      const updated = prev.filter(ee => ee.id !== edgeId);
      notifyChange(nodes, updated);
      return updated;
    });
  }, [nodes, notifyChange]);

  const onCanvasClick = useCallback(() => {
    setSelectedNode(null);
    setConnectingFrom(null);
  }, []);

  const onNodeDrag = useCallback((nodeId: string, dx: number, dy: number) => {
    setNodes(prev => {
      const updated = prev.map(n => 
        n.id === nodeId 
          ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
          : n
      );
      notifyChange(updated, edges);
      return updated;
    });
  }, [edges, notifyChange]);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="workflow-canvas flex h-full">
      {/* Node Palette */}
      <div className="node-palette w-48 border-r border-border p-2 flex flex-col gap-2 bg-bg-primary">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">节点</h3>
        {PHASE_TYPES.map(nodeType => (
          <div
            key={nodeType.label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/node', JSON.stringify(nodeType));
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="node-palette-item p-2 rounded-lg cursor-grab text-sm font-medium transition-all hover:scale-105 active:cursor-grabbing"
            style={{ 
              backgroundColor: nodeType.color + '20', 
              color: nodeType.color, 
              borderLeft: `3px solid ${nodeType.color}` 
            }}
          >
            {nodeType.label}
          </div>
        ))}
        
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs text-text-secondary mb-2">操作提示</h4>
          <div className="text-xs text-text-tertiary space-y-1">
            <p>• 拖拽节点到画布</p>
            <p>• 点击节点开始连接</p>
            <p>• 点击连接线删除</p>
          </div>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div 
        className="canvas-area flex-1 relative bg-bg-secondary overflow-auto"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onCanvasClick}
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary pointer-events-none">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <span className="text-lg">拖拽节点到此处构建工作流</span>
            </div>
          </div>
        )}
        
        {/* Edges SVG Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-primary)" />
            </marker>
            <marker id="arrowhead-connecting" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ec4899" />
            </marker>
          </defs>
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const x1 = sourceNode.position.x + 64;
            const y1 = sourceNode.position.y + 30;
            const x2 = targetNode.position.x + 64;
            const y2 = targetNode.position.y + 30;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            return (
              <g key={edge.id}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="var(--accent-primary)"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => onDeleteEdge(edge.id, e as unknown as React.MouseEvent)}
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r={8}
                  fill="transparent"
                  className="pointer-events-auto cursor-pointer hover:fill-red-500/20"
                  onClick={(e) => onDeleteEdge(edge.id, e as unknown as React.MouseEvent)}
                />
              </g>
            );
          })}
          {/* Connecting line preview */}
          {connectingFrom && (
            <line
              x1={nodes.find(n => n.id === connectingFrom)?.position.x ?? 0 + 64}
              y1={nodes.find(n => n.id === connectingFrom)?.position.y ?? 0 + 30}
              x2={0}
              y2={0}
              stroke="#ec4899"
              strokeWidth={2}
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead-connecting)"
              id="connecting-line"
            />
          )}
        </svg>
        
        {/* Nodes Layer */}
        {nodes.map(node => {
          const phaseType = PHASE_TYPES.find(t => t.label === node.label);
          const bgColor = phaseType?.color || '#6366f1';
          const isConnecting = connectingFrom === node.id;
          const isSelected = selectedNode === node.id;
          return (
            <div
              key={node.id}
              className={`workflow-node absolute w-32 p-3 rounded-xl shadow-lg cursor-pointer transition-all select-none
                ${isConnecting ? 'ring-2 ring-pink-500' : ''}
                ${isSelected ? 'ring-2 ring-accent-primary' : ''}`}
              style={{ 
                left: node.position.x, 
                top: node.position.y,
                backgroundColor: bgColor + '15',
                border: `2px solid ${bgColor}`,
                zIndex: 1,
              }}
              onClick={(e) => onNodeClick(node.id, e)}
              onMouseDown={(e) => {
                if (e.button === 0) {
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startPos = { x: node.position.x, y: node.position.y };
                  
                  const onMouseMove = (moveEvent: MouseEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    onNodeDrag(node.id, dx, dy);
                  };
                  
                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };
                  
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }
              }}
            >
              <div 
                className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-1"
                onMouseDown={(e) => onStartConnect(node.id, e)}
                style={{ cursor: 'crosshair' }}
                title="拖拽以连接节点"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bgColor }}></span>
                {node.label}
              </div>
              {node.subtype && (
                <div className="text-xs text-text-tertiary mb-1">{node.subtype}</div>
              )}
              <div className="flex gap-1 mt-2">
                <button 
                  onClick={(e) => onDeleteNode(node.id, e)}
                  className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Config Panel */}
      {selectedNode && selectedNodeData && (
        <div className="config-panel w-72 border-l border-border p-4 bg-bg-primary overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">节点配置</h3>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-text-tertiary hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">节点ID</label>
              <div className="text-sm font-mono bg-bg-tertiary p-2 rounded">{selectedNodeData.id}</div>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">节点类型</label>
              <div className="text-sm font-medium">{selectedNodeData.label}</div>
            </div>
            
            {selectedNodeData.type === 'phase' && (
              <>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">阶段子类型</label>
                  <select 
                    className="w-full p-2 rounded bg-bg-tertiary text-sm border border-border"
                    value={selectedNodeData.subtype || ''}
                    onChange={(e) => {
                      setNodes(prev => {
                        const updated = prev.map(n => 
                          n.id === selectedNode ? { ...n, subtype: e.target.value } : n
                        );
                        notifyChange(updated, edges);
                        return updated;
                      });
                    }}
                  >
                    <option value="">选择阶段</option>
                    <option value="outline">大纲生成</option>
                    <option value="character">角色创建</option>
                    <option value="chapter">章节编写</option>
                    <option value="polish">润色优化</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">提示词模板</label>
                  <textarea
                    className="w-full p-2 rounded bg-bg-tertiary text-sm border border-border"
                    rows={4}
                    placeholder="输入提示词模板，使用 {{variable}} 引用变量"
                    onChange={(e) => {
                      setNodes(prev => {
                        const updated = prev.map(n => 
                          n.id === selectedNode ? { ...n, config: { ...n.config, promptTemplate: e.target.value } } : n
                        );
                        notifyChange(updated, edges);
                        return updated;
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">重试策略</label>
                  <select 
                    className="w-full p-2 rounded bg-bg-tertiary text-sm border border-border"
                    onChange={(e) => {
                      setNodes(prev => {
                        const updated = prev.map(n => 
                          n.id === selectedNode ? { ...n, config: { ...n.config, retryStrategy: e.target.value } } : n
                        );
                        notifyChange(updated, edges);
                        return updated;
                      });
                    }}
                  >
                    <option value="error">仅错误时重试</option>
                    <option value="low_quality">低质量时重试</option>
                    <option value="always">始终重试</option>
                  </select>
                </div>
              </>
            )}
            
            {selectedNodeData.type === 'condition' && (
              <div>
                <label className="text-xs text-text-secondary block mb-1">条件表达式</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-bg-tertiary text-sm border border-border"
                  placeholder="quality_score > 7"
                  onChange={(e) => {
                    setNodes(prev => {
                      const updated = prev.map(n => 
                        n.id === selectedNode ? { ...n, config: { ...n.config, condition: e.target.value } } : n
                      );
                      notifyChange(updated, edges);
                      return updated;
                    });
                  }}
                />
              </div>
            )}
            
            {selectedNodeData.type === 'loop' && (
              <>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">最大迭代次数</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-bg-tertiary text-sm border border-border"
                    placeholder="5"
                    onChange={(e) => {
                      setNodes(prev => {
                        const updated = prev.map(n => 
                          n.id === selectedNode ? { ...n, config: { ...n.config, maxIterations: parseInt(e.target.value) } } : n
                        );
                        notifyChange(updated, edges);
                        return updated;
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">终止条件</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded bg-bg-tertiary text-sm border border-border"
                    placeholder="quality_score >= 9"
                    onChange={(e) => {
                      setNodes(prev => {
                        const updated = prev.map(n => 
                          n.id === selectedNode ? { ...n, config: { ...n.config, exitCondition: e.target.value } } : n
                        );
                        notifyChange(updated, edges);
                        return updated;
                      });
                    }}
                  />
                </div>
              </>
            )}
            
            {selectedNodeData.type === 'human' && (
              <div>
                <label className="text-xs text-text-secondary block mb-1">人工审核说明</label>
                <textarea
                  className="w-full p-2 rounded bg-bg-tertiary text-sm border border-border"
                  rows={3}
                  placeholder="需要人工审核的内容说明..."
                  onChange={(e) => {
                    setNodes(prev => {
                      const updated = prev.map(n => 
                        n.id === selectedNode ? { ...n, config: { ...n.config, reviewNote: e.target.value } } : n
                      );
                      notifyChange(updated, edges);
                      return updated;
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};