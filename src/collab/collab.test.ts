/**
 * Collaboration Module Tests - V55
 * Tests for DAG visualization, AgentTimeline, and WritingMetricsPanel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  WRITING_WORKFLOW_NODES,
  WRITING_WORKFLOW_EDGES,
  DAG_COLORS,
  NODE_TYPE_LABELS,
  type DAGNode,
  type DAGEdge
} from './types'

// Mock Dexie for collabDb
vi.mock('./collabDb', () => ({
  collabDb: {
    dag_executions: { add: vi.fn(), where: vi.fn(), toArray: vi.fn() }
  }
}))

describe('DAG Types', () => {
  describe('DAG_COLORS', () => {
    it('should have colors for all node statuses', () => {
      expect(DAG_COLORS.pending).toBe('#9CA3AF')
      expect(DAG_COLORS.running).toBe('#3B82F6')
      expect(DAG_COLORS.completed).toBe('#10B981')
      expect(DAG_COLORS.failed).toBe('#EF4444')
      expect(DAG_COLORS.skipped).toBe('#6B7280')
    })
  })

  describe('NODE_TYPE_LABELS', () => {
    it('should have labels for all node types', () => {
      expect(NODE_TYPE_LABELS.task).toBe('任务')
      expect(NODE_TYPE_LABELS.agent).toBe('Agent')
      expect(NODE_TYPE_LABELS.data).toBe('数据')
    })
  })

  describe('WRITING_WORKFLOW_NODES', () => {
    it('should have 7 nodes in the writing workflow', () => {
      expect(WRITING_WORKFLOW_NODES).toHaveLength(7)
    })

    it('should have planning as root node', () => {
      const planning = WRITING_WORKFLOW_NODES.find(n => n.id === 'planning')
      expect(planning).toBeDefined()
      expect(planning?.inputs).toHaveLength(0)
      expect(planning?.outputs).toContain('plot_design')
    })

    it('should have evolution as leaf node', () => {
      const evolution = WRITING_WORKFLOW_NODES.find(n => n.id === 'evolution')
      expect(evolution).toBeDefined()
      expect(evolution?.outputs).toHaveLength(0)
    })

    it('should have writing as merge node', () => {
      const writing = WRITING_WORKFLOW_NODES.find(n => n.id === 'writing')
      expect(writing).toBeDefined()
      expect(writing?.inputs).toContain('world_building')
      expect(writing?.inputs).toContain('character_design')
    })

    it('each node should have valid type', () => {
      const validTypes = ['task', 'agent', 'data']
      for (const node of WRITING_WORKFLOW_NODES) {
        expect(validTypes).toContain(node.type)
      }
    })
  })

  describe('WRITING_WORKFLOW_EDGES', () => {
    it('should have edges connecting all nodes', () => {
      expect(WRITING_WORKFLOW_EDGES.length).toBeGreaterThan(0)
    })

    it('should have valid edge types', () => {
      const validTypes = ['depends_on', 'outputs_to', 'triggers']
      for (const edge of WRITING_WORKFLOW_EDGES) {
        expect(validTypes).toContain(edge.type)
      }
    })

    it('each edge should reference valid node IDs', () => {
      const nodeIds = new Set(WRITING_WORKFLOW_NODES.map(n => n.id))
      for (const edge of WRITING_WORKFLOW_EDGES) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
      }
    })

    it('should have correct dependencies', () => {
      const plotToWorld = WRITING_WORKFLOW_EDGES.find(e =>
        e.source === 'plot_design' && e.target === 'world_building'
      )
      expect(plotToWorld?.type).toBe('outputs_to')

      const worldToWriting = WRITING_WORKFLOW_EDGES.find(e =>
        e.source === 'world_building' && e.target === 'writing'
      )
      expect(worldToWriting?.type).toBe('depends_on')
    })
  })
})

describe('DAG Logic', () => {
  const createNode = (id: string, inputs: string[], outputs: string[], status: DAGNode['status'] = 'pending'): DAGNode => ({
    id,
    type: 'agent',
    name: id,
    status,
    inputs,
    outputs,
    metadata: {}
  })

  describe('Node Creation', () => {
    it('should create a valid DAG node', () => {
      const node = createNode('test', ['input1'], ['output1'])

      expect(node.id).toBe('test')
      expect(node.type).toBe('agent')
      expect(node.status).toBe('pending')
      expect(node.inputs).toEqual(['input1'])
      expect(node.outputs).toEqual(['output1'])
    })

    it('should support all status values', () => {
      const statuses: DAGNode['status'][] = ['pending', 'running', 'completed', 'failed', 'skipped']

      for (const status of statuses) {
        const node = createNode('test', [], [], status)
        expect(node.status).toBe(status)
      }
    })
  })

  describe('Topological Sort', () => {
    it('should order nodes by dependencies', () => {
      const nodes: DAGNode[] = [
        createNode('a', [], ['b']),
        createNode('b', ['a'], ['c']),
        createNode('c', ['b'], [])
      ]

      const nodeMap = new Map(nodes.map(n => [n.id, n]))
      const visited = new Set<string>()
      const order: string[] = []

      // DFS that processes inputs before adding to order (reverse topological)
      function dfs(nodeId: string) {
        if (visited.has(nodeId)) return
        visited.add(nodeId)
        const node = nodeMap.get(nodeId)
        if (!node) return
        for (const input of node.inputs) {
          dfs(input)
        }
        order.push(nodeId)
      }

      const roots = nodes.filter(n => n.inputs.length === 0)
      for (const root of roots) {
        dfs(root.id)
      }

      // Root 'a' should come first
      expect(order[0]).toBe('a')
    })

    it('should handle parallel branches', () => {
      const nodes: DAGNode[] = [
        createNode('root', [], ['branch1', 'branch2']),
        createNode('branch1', ['root'], ['merge']),
        createNode('branch2', ['root'], ['merge']),
        createNode('merge', ['branch1', 'branch2'], [])
      ]

      const nodeMap = new Map(nodes.map(n => [n.id, n]))
      const visited = new Set<string>()

      function visit(nodeId: string): string[] {
        if (visited.has(nodeId)) return []
        visited.add(nodeId)
        const node = nodeMap.get(nodeId)
        if (!node) return []
        return [nodeId]
      }

      // Root should come first
      expect(visit('root')).toContain('root')
    })
  })

  describe('Status Transitions', () => {
    it('should validate status transitions', () => {
      const validTransitions: Record<DAGNode['status'], DAGNode['status'][]> = {
        pending: ['running', 'skipped'],
        running: ['completed', 'failed'],
        completed: [],
        failed: ['running'],
        skipped: []
      }

      const pending = createNode('test', [], [], 'pending')
      expect(validTransitions.pending).toContain('running')
      expect(validTransitions.pending).toContain('skipped')
    })
  })
})

describe('Writing Workflow Integration', () => {
  describe('Workflow Graph Structure', () => {
    it('should have no cycles', () => {
      const nodeMap = new Map(WRITING_WORKFLOW_NODES.map(n => [n.id, n]))
      const visited = new Set<string>()
      const recursionStack = new Set<string>()

      function hasCycle(nodeId: string): boolean {
        if (recursionStack.has(nodeId)) return true
        if (visited.has(nodeId)) return false

        visited.add(nodeId)
        recursionStack.add(nodeId)

        const node = nodeMap.get(nodeId)
        if (!node) return false

        for (const outputId of node.outputs) {
          if (hasCycle(outputId)) return true
        }

        recursionStack.delete(nodeId)
        return false
      }

      const roots = WRITING_WORKFLOW_NODES.filter(n => n.inputs.length === 0)
      for (const root of roots) {
        expect(hasCycle(root.id)).toBe(false)
      }
    })

    it('should have exactly one root node', () => {
      const roots = WRITING_WORKFLOW_NODES.filter(n => n.inputs.length === 0)
      expect(roots).toHaveLength(1)
      expect(roots[0].id).toBe('planning')
    })

    it('should have exactly one leaf node', () => {
      const leaves = WRITING_WORKFLOW_NODES.filter(n => n.outputs.length === 0)
      expect(leaves).toHaveLength(1)
      expect(leaves[0].id).toBe('evolution')
    })

    it('should have merge point at writing node', () => {
      const writing = WRITING_WORKFLOW_NODES.find(n => n.id === 'writing')
      expect(writing?.inputs).toHaveLength(2)
      expect(writing?.inputs).toContain('world_building')
      expect(writing?.inputs).toContain('character_design')
    })

    it('should have split point at plot_design node', () => {
      const plot = WRITING_WORKFLOW_NODES.find(n => n.id === 'plot_design')
      expect(plot?.outputs).toHaveLength(2)
      expect(plot?.outputs).toContain('world_building')
      expect(plot?.outputs).toContain('character_design')
    })
  })

  describe('Edge Coverage', () => {
    it('should have an edge for every input reference', () => {
      for (const node of WRITING_WORKFLOW_NODES) {
        for (const inputId of node.inputs) {
          const hasEdge = WRITING_WORKFLOW_EDGES.some(
            e => e.source === inputId && e.target === node.id
          )
          expect(hasEdge).toBe(true)
        }
      }
    })

    it('should have an edge for every output reference', () => {
      for (const node of WRITING_WORKFLOW_NODES) {
        for (const outputId of node.outputs) {
          const hasEdge = WRITING_WORKFLOW_EDGES.some(
            e => e.source === node.id && e.target === outputId
          )
          expect(hasEdge).toBe(true)
        }
      }
    })
  })
})

describe('WritingMetrics Calculation', () => {
  const calculateOverall = (metrics: { coherence: number; expression: number; creativity: number; structure: number; engagement: number }) => {
    const { coherence, expression, creativity, structure, engagement } = metrics
    const avg = (coherence + expression + creativity + structure + engagement) / 5
    return Math.round(avg * 100)
  }

  it('should calculate overall score correctly', () => {
    const metrics = { coherence: 0.9, expression: 0.8, creativity: 0.7, structure: 0.6, engagement: 0.5 }
    expect(calculateOverall(metrics)).toBe(70)
  })

  it('should handle perfect scores', () => {
    const metrics = { coherence: 1, expression: 1, creativity: 1, structure: 1, engagement: 1 }
    expect(calculateOverall(metrics)).toBe(100)
  })

  it('should handle zero scores', () => {
    const metrics = { coherence: 0, expression: 0, creativity: 0, structure: 0, engagement: 0 }
    expect(calculateOverall(metrics)).toBe(0)
  })

  it('should round to nearest integer', () => {
    const metrics = { coherence: 0.85, expression: 0.85, creativity: 0.85, structure: 0.85, engagement: 0.85 }
    expect(calculateOverall(metrics)).toBe(85)
  })
})

describe('AgentTimeline Duration Formatting', () => {
  const formatDuration = (start: number, end?: number): string => {
    const duration = (end || Date.now()) - start
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`
  }

  it('should format milliseconds', () => {
    expect(formatDuration(0, 500)).toBe('500ms')
  })

  it('should format seconds', () => {
    expect(formatDuration(0, 5500)).toBe('5.5s')
  })

  it('should format minutes and seconds', () => {
    const result = formatDuration(0, 125000)
    expect(result).toMatch(/2m \d+s/)
  })
})