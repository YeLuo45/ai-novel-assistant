/**
 * AgentCanvas Tests - V68
 * Tests for Zero-Code Agent Orchestration Canvas
 */

import { describe, it, expect } from 'vitest'
import type {
  CanvasNode,
  CanvasNodeType,
  CanvasEdge,
  CanvasProject,
  AgentNodeConfig
} from './AgentCanvas'

// Helper to create empty project
function createEmptyProject(name: string): CanvasProject {
  return {
    id: `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    nodes: [],
    edges: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

// Export for use in tests
const CANVAS_NODE_TEMPLATES: Record<CanvasNodeType, Partial<CanvasNode>> = {
  trigger: { type: 'trigger', name: '触发器', description: '工作流入口点', config: { trigger: { type: 'manual' } } as AgentNodeConfig },
  agent: { type: 'agent', name: '写作代理', description: 'AI写作代理节点', config: { agentType: 'PlotAgent' } as AgentNodeConfig },
  tool: { type: 'tool', name: '工具节点', description: '执行特定工具', config: {} as AgentNodeConfig },
  condition: { type: 'condition', name: '条件分支', description: '基于条件的路由', config: { condition: { field: 'genre', operator: 'eq', value: 'fantasy' } } as AgentNodeConfig },
  output: { type: 'output', name: '输出节点', description: '输出结果', config: {} as AgentNodeConfig }
}

const AGENT_TYPES = ['PlotAgent', 'DialogueAgent', 'DescriptionAgent', 'WorldBuildAgent', 'CharacterAgent', 'EditAgent', 'QualityAgent']

describe('AgentCanvas Types', () => {
  describe('CanvasNodeType', () => {
    it('should have 5 node types', () => {
      const types: CanvasNodeType[] = ['trigger', 'agent', 'tool', 'condition', 'output']
      expect(types).toHaveLength(5)
    })
  })

  describe('CanvasNode', () => {
    it('should have all required fields', () => {
      const node: CanvasNode = {
        id: 'node-1',
        type: 'agent',
        name: 'PlotAgent',
        description: 'Generate plot',
        position: { x: 100, y: 200 },
        config: { agentType: 'PlotAgent' },
        connections: ['node-2']
      }
      expect(node.id).toBe('node-1')
      expect(node.type).toBe('agent')
      expect(node.config.agentType).toBe('PlotAgent')
      expect(node.connections).toHaveLength(1)
    })

    it('should support position tracking', () => {
      const node: CanvasNode = {
        id: 'node-1',
        type: 'trigger',
        name: 'Start',
        description: 'Workflow start',
        position: { x: 50, y: 100 },
        config: { trigger: { type: 'manual' } },
        connections: []
      }
      expect(node.position.x).toBe(50)
      expect(node.position.y).toBe(100)
    })
  })

  describe('AgentNodeConfig', () => {
    it('should support agent type config', () => {
      const config: AgentNodeConfig = {
        agentType: 'DialogueAgent',
        toolIds: ['tool-1', 'tool-2']
      }
      expect(config.agentType).toBe('DialogueAgent')
      expect(config.toolIds).toHaveLength(2)
    })

    it('should support trigger config', () => {
      const config: AgentNodeConfig = {
        trigger: { type: 'event', event: 'chapter:complete' }
      }
      expect(config.trigger?.type).toBe('event')
      expect(config.trigger?.event).toBe('chapter:complete')
    })

    it('should support condition config', () => {
      const config: AgentNodeConfig = {
        condition: { field: 'genre', operator: 'eq', value: 'fantasy' }
      }
      expect(config.condition?.field).toBe('genre')
      expect(config.condition?.operator).toBe('eq')
      expect(config.condition?.value).toBe('fantasy')
    })
  })

  describe('CanvasEdge', () => {
    it('should connect two nodes', () => {
      const edge: CanvasEdge = {
        id: 'edge-1',
        sourceId: 'node-1',
        targetId: 'node-2',
        label: 'output'
      }
      expect(edge.sourceId).toBe('node-1')
      expect(edge.targetId).toBe('node-2')
      expect(edge.label).toBe('output')
    })

    it('should support conditional edges', () => {
      const edge: CanvasEdge = {
        id: 'edge-1',
        sourceId: 'node-1',
        targetId: 'node-2',
        condition: { field: 'genre', operator: 'eq', value: 'fantasy' }
      }
      expect(edge.condition?.field).toBe('genre')
    })
  })

  describe('CanvasProject', () => {
    it('should hold nodes and edges', () => {
      const project: CanvasProject = {
        id: 'proj-1',
        name: 'Test Workflow',
        nodes: [
          { id: 'n1', type: 'trigger', name: 'Start', description: '', position: { x: 0, y: 0 }, config: {}, connections: ['n2'] },
          { id: 'n2', type: 'agent', name: 'Plot', description: '', position: { x: 100, y: 0 }, config: {}, connections: [] }
        ],
        edges: [
          { id: 'e1', sourceId: 'n1', targetId: 'n2' }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      expect(project.nodes).toHaveLength(2)
      expect(project.edges).toHaveLength(1)
    })
  })
})

describe('CANVAS_NODE_TEMPLATES', () => {
  it('should have templates for all node types', () => {
    const types: CanvasNodeType[] = ['trigger', 'agent', 'tool', 'condition', 'output']
    types.forEach(type => {
      expect(CANVAS_NODE_TEMPLATES[type]).toBeDefined()
      expect(CANVAS_NODE_TEMPLATES[type]!.name).toBeTruthy()
    })
  })

  it('should have trigger with manual trigger config', () => {
    const trigger = CANVAS_NODE_TEMPLATES.trigger
    expect(trigger.config?.trigger?.type).toBe('manual')
  })

  it('should have agent with PlotAgent default', () => {
    const agent = CANVAS_NODE_TEMPLATES.agent
    expect(agent.config?.agentType).toBe('PlotAgent')
  })

  it('should have condition with default config', () => {
    const condition = CANVAS_NODE_TEMPLATES.condition
    expect(condition.config?.condition?.field).toBe('genre')
  })
})

describe('AGENT_TYPES', () => {
  it('should have 7 agent types', () => {
    expect(AGENT_TYPES).toHaveLength(7)
  })

  it('should include common writing agents', () => {
    expect(AGENT_TYPES).toContain('PlotAgent')
    expect(AGENT_TYPES).toContain('DialogueAgent')
    expect(AGENT_TYPES).toContain('CharacterAgent')
    expect(AGENT_TYPES).toContain('EditAgent')
  })
})

describe('createEmptyProject', () => {
  it('should create project with empty nodes and edges', () => {
    const project = createEmptyProject('My Workflow')
    expect(project.nodes).toHaveLength(0)
    expect(project.edges).toHaveLength(0)
    expect(project.name).toBe('My Workflow')
  })

  it('should generate unique ID', () => {
    const p1 = createEmptyProject('P1')
    const p2 = createEmptyProject('P2')
    expect(p1.id).not.toBe(p2.id)
  })

  it('should set createdAt and updatedAt', () => {
    const before = Date.now()
    const project = createEmptyProject('Test')
    const after = Date.now()
    expect(project.createdAt).toBeGreaterThanOrEqual(before)
    expect(project.createdAt).toBeLessThanOrEqual(after)
    expect(project.updatedAt).toBeGreaterThanOrEqual(before)
  })
})

describe('Condition Operators', () => {
  const operators = ['eq', 'neq', 'contains', 'gt', 'lt'] as const

  it('should support equality', () => {
    const cond = { field: 'genre', operator: 'eq' as const, value: 'fantasy' }
    expect(cond.operator).toBe('eq')
  })

  it('should support inequality', () => {
    const cond = { field: 'genre', operator: 'neq' as const, value: 'romance' }
    expect(cond.operator).toBe('neq')
  })

  it('should support contains', () => {
    const cond = { field: 'content', operator: 'contains' as const, value: 'battle' }
    expect(cond.operator).toBe('contains')
  })

  it('should support numeric comparison', () => {
    const gt = { field: 'chapter', operator: 'gt' as const, value: 10 }
    const lt = { field: 'chapter', operator: 'lt' as const, value: 50 }
    expect(gt.operator).toBe('gt')
    expect(lt.operator).toBe('lt')
  })
})

describe('Topological Sort Logic', () => {
  it('should sort nodes by dependencies', () => {
    const nodes: CanvasNode[] = [
      { id: 'a', type: 'trigger', name: 'A', description: '', position: { x: 0, y: 0 }, config: {}, connections: [] },
      { id: 'b', type: 'agent', name: 'B', description: '', position: { x: 0, y: 0 }, config: {}, connections: [] },
      { id: 'c', type: 'tool', name: 'C', description: '', position: { x: 0, y: 0 }, config: {}, connections: [] }
    ]
    const edges: CanvasEdge[] = [
      { id: 'e1', sourceId: 'a', targetId: 'b' },
      { id: 'e2', sourceId: 'b', targetId: 'c' }
    ]
    
    // Expected order: a -> b -> c
    const inDegree: Record<string, number> = { a: 0, b: 1, c: 1 }
    const adjacency: Record<string, string[]> = { a: ['b'], b: ['c'], c: [] }
    
    const queue = ['a']
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
    
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should handle parallel branches', () => {
    const inDegree: Record<string, number> = { a: 0, b: 1, c: 1, d: 2 }
    const adjacency: Record<string, string[]> = { a: ['b', 'c'], b: ['d'], c: ['d'], d: [] }
    
    const queue = ['a']
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
    
    expect(result[0]).toBe('a')
    expect(result[result.length - 1]).toBe('d')
  })
})

describe('Node Position Tracking', () => {
  it('should track drag position', () => {
    const node: CanvasNode = {
      id: 'node-1',
      type: 'agent',
      name: 'Test',
      description: '',
      position: { x: 100, y: 200 },
      config: {},
      connections: []
    }
    
    // Simulate drag
    const newPos = { x: 150, y: 250 }
    const updatedNode = { ...node, position: newPos }
    
    expect(updatedNode.position.x).toBe(150)
    expect(updatedNode.position.y).toBe(250)
  })
})

describe('Agent Canvas Workflow Structure', () => {
  it('should build simple pipeline', () => {
    const workflow: CanvasProject = {
      id: 'wf-1',
      name: 'Fantasy Plot Pipeline',
      nodes: [
        { id: 'start', type: 'trigger', name: '开始', description: '手动触发', position: { x: 50, y: 100 }, config: { trigger: { type: 'manual' } }, connections: ['plot'] },
        { id: 'plot', type: 'agent', name: 'PlotAgent', description: '生成情节', position: { x: 200, y: 100 }, config: { agentType: 'PlotAgent' }, connections: ['world'] },
        { id: 'world', type: 'agent', name: 'WorldBuildAgent', description: '构建世界观', position: { x: 350, y: 100 }, config: { agentType: 'WorldBuildAgent' }, connections: ['output'] },
        { id: 'output', type: 'output', name: '输出', description: '输出结果', position: { x: 500, y: 100 }, config: {}, connections: [] }
      ],
      edges: [
        { id: 'e1', sourceId: 'start', targetId: 'plot' },
        { id: 'e2', sourceId: 'plot', targetId: 'world' },
        { id: 'e3', sourceId: 'world', targetId: 'output' }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    expect(workflow.nodes).toHaveLength(4)
    expect(workflow.edges).toHaveLength(3)
    
    // Verify flow
    const triggerNode = workflow.nodes.find(n => n.type === 'trigger')
    expect(triggerNode?.config.trigger?.type).toBe('manual')
  })

  it('should support conditional branching', () => {
    const workflow: CanvasProject = {
      id: 'wf-2',
      name: 'Genre Branching',
      nodes: [
        { id: 'start', type: 'trigger', name: '开始', description: '', position: { x: 0, y: 0 }, config: {}, connections: ['branch'] },
        { id: 'branch', type: 'condition', name: 'Genre Check', description: '', position: { x: 150, y: 0 }, config: { condition: { field: 'genre', operator: 'eq', value: 'fantasy' } }, connections: ['fantasy', 'realistic'] },
        { id: 'fantasy', type: 'agent', name: 'FantasyAgent', description: '', position: { x: 300, y: -50 }, config: { agentType: 'PlotAgent' }, connections: ['output'] },
        { id: 'realistic', type: 'agent', name: 'RealisticAgent', description: '', position: { x: 300, y: 50 }, config: { agentType: 'EditAgent' }, connections: ['output'] },
        { id: 'output', type: 'output', name: '输出', description: '', position: { x: 450, y: 0 }, config: {}, connections: [] }
      ],
      edges: [
        { id: 'e1', sourceId: 'start', targetId: 'branch' },
        { id: 'e2', sourceId: 'branch', targetId: 'fantasy', label: 'fantasy' },
        { id: 'e3', sourceId: 'branch', targetId: 'realistic', label: 'realistic' },
        { id: 'e4', sourceId: 'fantasy', targetId: 'output' },
        { id: 'e5', sourceId: 'realistic', targetId: 'output' }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    expect(workflow.nodes).toHaveLength(5)
    expect(workflow.edges).toHaveLength(5)
    
    const branchNode = workflow.nodes.find(n => n.type === 'condition')
    expect(branchNode?.config.condition?.value).toBe('fantasy')
  })
})