/**
 * StoryFlowOrchestrator Tests - V74
 * Tests for DAG-based Workflow Engine
 */

import { describe, it, expect } from 'vitest'
import type { PhaseNode, WorkflowTemplate, WorkflowInstance, PhaseExecutionResult } from './StoryFlowOrchestrator'
import {
  // Functions
  buildPhaseGraph,
  topologicalSort,
  getParallelGroups,
  getExecutablePhases,
  evaluateCondition,
  getRetryDelay,
  createStoryTemplate,
  createChapterTemplate,
  // Class (test via public methods)
  StoryFlowOrchestrator
} from './StoryFlowOrchestrator'

// ===============================================================================
// DAG Utilities Tests
// ===============================================================================

describe('DAG Utilities', () => {
  const simplePhases: PhaseNode[] = [
    { id: 'a', name: 'A', agent: 'agent1', tools: [], inputKeys: [], outputKey: 'out_a', timeout: 10000, retry: 'none', maxRetries: 0, dependsOn: [] },
    { id: 'b', name: 'B', agent: 'agent2', tools: [], inputKeys: ['out_a'], outputKey: 'out_b', timeout: 10000, retry: 'none', maxRetries: 0, dependsOn: ['a'] },
    { id: 'c', name: 'C', agent: 'agent3', tools: [], inputKeys: ['out_b'], outputKey: 'out_c', timeout: 10000, retry: 'none', maxRetries: 0, dependsOn: ['b'] }
  ]

  describe('buildPhaseGraph', () => {
    it('should build map from phase array', () => {
      const graph = buildPhaseGraph(simplePhases)
      expect(graph.size).toBe(3)
      expect(graph.get('a')?.name).toBe('A')
      expect(graph.get('b')?.name).toBe('B')
    })
  })

  describe('topologicalSort', () => {
    it('should sort by dependencies', () => {
      const sorted = topologicalSort(simplePhases)
      expect(sorted).toEqual(['a', 'b', 'c'])
    })

    it('should handle parallel dependencies', () => {
      const parallelPhases: PhaseNode[] = [
        { id: 'root', name: 'Root', agent: 'a', tools: [], inputKeys: [], outputKey: 'o', timeout: 1, retry: 'none', maxRetries: 0, dependsOn: [] },
        { id: 'p1', name: 'P1', agent: 'a', tools: [], inputKeys: ['o'], outputKey: 'o1', timeout: 1, retry: 'none', maxRetries: 0, parallelGroup: 'parallel', dependsOn: ['root'] },
        { id: 'p2', name: 'P2', agent: 'a', tools: [], inputKeys: ['o'], outputKey: 'o2', timeout: 1, retry: 'none', maxRetries: 0, parallelGroup: 'parallel', dependsOn: ['root'] },
        { id: 'final', name: 'Final', agent: 'a', tools: [], inputKeys: ['o1', 'o2'], outputKey: 'final', timeout: 1, retry: 'none', maxRetries: 0, dependsOn: ['p1', 'p2'] }
      ]
      
      const sorted = topologicalSort(parallelPhases)
      const rootIdx = sorted.indexOf('root')
      const p1Idx = sorted.indexOf('p1')
      const p2Idx = sorted.indexOf('p2')
      const finalIdx = sorted.indexOf('final')
      
      expect(rootIdx).toBeLessThan(p1Idx)
      expect(rootIdx).toBeLessThan(p2Idx)
      expect(p1Idx).toBeLessThan(finalIdx)
      expect(p2Idx).toBeLessThan(finalIdx)
    })
  })

  describe('getParallelGroups', () => {
    it('should return empty for no parallel groups', () => {
      const groups = getParallelGroups(['a', 'b', 'c'], simplePhases)
      expect(groups.size).toBe(0)
    })

    it('should group phases by parallelGroup', () => {
      const parallelPhases: PhaseNode[] = [
        { id: 'p1', name: 'P1', agent: 'a', tools: [], inputKeys: [], outputKey: 'o1', timeout: 1, retry: 'none', maxRetries: 0, parallelGroup: 'group1', dependsOn: [] },
        { id: 'p2', name: 'P2', agent: 'a', tools: [], inputKeys: [], outputKey: 'o2', timeout: 1, retry: 'none', maxRetries: 0, parallelGroup: 'group1', dependsOn: [] },
        { id: 'p3', name: 'P3', agent: 'a', tools: [], inputKeys: [], outputKey: 'o3', timeout: 1, retry: 'none', maxRetries: 0, dependsOn: [] }
      ]
      
      const groups = getParallelGroups(['p1', 'p2', 'p3'], parallelPhases)
      expect(groups.size).toBe(1)
      expect(groups.get('group1')).toEqual(['p1', 'p2'])
    })
  })

  describe('getExecutablePhases', () => {
    it('should return phases with no dependencies', () => {
      const result = getExecutablePhases(['a', 'b', 'c'], simplePhases, new Set(), new Set(), new Set())
      expect(result).toEqual(['a'])
    })

    it('should return next phase after dependency completed', () => {
      const result = getExecutablePhases(['a', 'b', 'c'], simplePhases, new Set(['a']), new Set(), new Set())
      expect(result).toEqual(['b'])
    })

    it('should skip phases with failed dependencies', () => {
      const result = getExecutablePhases(['a', 'b', 'c'], simplePhases, new Set(), new Set(['a']), new Set())
      expect(result).toEqual([])
    })
  })

  describe('evaluateCondition', () => {
    it('should return true for undefined condition', () => {
      expect(evaluateCondition(undefined, new Map())).toBe(true)
    })

    it('should evaluate > comparison', () => {
      const outputs = new Map([['quality', 0.8]])
      expect(evaluateCondition('quality > 0.5', outputs)).toBe(true)
      expect(evaluateCondition('quality > 0.9', outputs)).toBe(false)
    })

    it('should evaluate == string comparison', () => {
      const outputs = new Map([['status', 'success']])
      expect(evaluateCondition("status == 'success'", outputs)).toBe(true)
      expect(evaluateCondition("status == 'failed'", outputs)).toBe(false)
    })

    it('should return false for unknown key', () => {
      const outputs = new Map()
      expect(evaluateCondition('unknown > 5', outputs)).toBe(false)
    })
  })
})

// ===============================================================================
// Retry Calculator Tests
// ===============================================================================

describe('Retry Calculator', () => {
  describe('getRetryDelay', () => {
    it('should return 0 for none strategy', () => {
      expect(getRetryDelay(1, 'none')).toBe(0)
      expect(getRetryDelay(5, 'none')).toBe(0)
    })

    it('should return linear delay for linear strategy', () => {
      expect(getRetryDelay(1, 'linear')).toBe(1000)
      expect(getRetryDelay(3, 'linear')).toBe(3000)
    })

    it('should return exponential delay for exponential strategy', () => {
      expect(getRetryDelay(1, 'exponential')).toBe(1000)
      expect(getRetryDelay(2, 'exponential')).toBe(2000)
      expect(getRetryDelay(4, 'exponential')).toBe(8000)
    })

    it('should return fibonacci delay for fibonacci strategy', () => {
      expect(getRetryDelay(1, 'fibonacci')).toBe(1000)
      expect(getRetryDelay(5, 'fibonacci')).toBe(5000)
      expect(getRetryDelay(7, 'fibonacci')).toBe(13000)
    })
  })
})

// ===============================================================================
// Template Factory Tests
// ===============================================================================

describe('Template Factory', () => {
  describe('createStoryTemplate', () => {
    it('should create template with all phases', () => {
      const template = createStoryTemplate('general')
      expect(template.id).toBe('story-template-general')
      expect(template.phases.length).toBeGreaterThan(0)
      expect(template.entryPhase).toBe('concept')
    })

    it('should have concept phase with no dependencies', () => {
      const template = createStoryTemplate('general')
      const concept = template.phases.find(p => p.id === 'concept')
      expect(concept).toBeDefined()
      expect(concept!.dependsOn).toHaveLength(0)
    })

    it('should have sequential dependency chain', () => {
      const template = createStoryTemplate('general')
      const ids = template.phases.map(p => p.id)
      const conceptIdx = ids.indexOf('concept')
      const outlineIdx = ids.indexOf('outline')
      expect(outlineIdx).toBeGreaterThan(conceptIdx)
    })

    it('should have parallel drafting group', () => {
      const template = createStoryTemplate('general')
      const charPhase = template.phases.find(p => p.id === 'character')
      const worldPhase = template.phases.find(p => p.id === 'world')
      expect(charPhase?.parallelGroup).toBe('drafting')
      expect(worldPhase?.parallelGroup).toBe('drafting')
    })
  })

  describe('createChapterTemplate', () => {
    it('should create chapter template with 4 phases', () => {
      const template = createChapterTemplate()
      expect(template.id).toBe('chapter-template')
      expect(template.phases).toHaveLength(4)
    })

    it('should have scene-plan as entry', () => {
      const template = createChapterTemplate()
      expect(template.entryPhase).toBe('scene-plan')
    })
  })
})

// ===============================================================================
// StoryFlowOrchestrator Tests
// ===============================================================================

describe('StoryFlowOrchestrator', () => {
  let orchestrator: StoryFlowOrchestrator

  beforeEach(() => {
    orchestrator = new StoryFlowOrchestrator()
  })

  describe('registerTemplate', () => {
    it('should register and retrieve template', () => {
      const template = createChapterTemplate()
      orchestrator.registerTemplate(template)
      
      const retrieved = orchestrator.getTemplate('chapter-template')
      expect(retrieved).not.toBeNull()
      expect(retrieved?.name).toBe('Chapter Writing Template')
    })
  })

  describe('createInstance', () => {
    it('should create instance from template', () => {
      const instance = orchestrator.createInstance('chapter-template', 'Test Chapter')
      expect(instance).not.toBeNull()
      expect(instance!.name).toBe('Test Chapter')
      expect(instance!.templateId).toBe('chapter-template')
      expect(instance!.status).toBe('created')
    })

    it('should return null for unknown template', () => {
      const instance = orchestrator.createInstance('nonexistent-template')
      expect(instance).toBeNull()
    })
  })

  describe('getInstance', () => {
    it('should return created instance', () => {
      const created = orchestrator.createInstance('chapter-template')
      const retrieved = orchestrator.getInstance(created!.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(created!.id)
    })

    it('should return null for unknown instance', () => {
      const result = orchestrator.getInstance('nonexistent-id')
      expect(result).toBeNull()
    })
  })

  describe('cancelWorkflow', () => {
    it('should cancel running workflow', () => {
      const instance = orchestrator.createInstance('chapter-template')
      instance!.status = 'running'
      
      const result = orchestrator.cancelWorkflow(instance!.id)
      expect(result).toBe(true)
      expect(orchestrator.getInstance(instance!.id)?.status).toBe('cancelled')
    })

    it('should not cancel completed workflow', () => {
      const instance = orchestrator.createInstance('chapter-template')
      instance!.status = 'completed'
      
      const result = orchestrator.cancelWorkflow(instance!.id)
      expect(result).toBe(false)
    })
  })

  describe('pauseWorkflow', () => {
    it('should pause running workflow', () => {
      const instance = orchestrator.createInstance('chapter-template')
      instance!.status = 'running'
      
      const result = orchestrator.pauseWorkflow(instance!.id)
      expect(result).toBe(true)
      expect(orchestrator.getInstance(instance!.id)?.status).toBe('paused')
    })

    it('should not pause non-running workflow', () => {
      const instance = orchestrator.createInstance('chapter-template')
      instance!.status = 'created'
      
      const result = orchestrator.pauseWorkflow(instance!.id)
      expect(result).toBe(false)
    })
  })

  describe('getAllInstances', () => {
    it('should return all created instances', () => {
      orchestrator.createInstance('chapter-template')
      orchestrator.createInstance('story-template-general')
      
      const instances = orchestrator.getAllInstances()
      expect(instances.length).toBeGreaterThanOrEqual(2)
    })
  })
})

// ===============================================================================
// WorkflowInstance State Tests
// ===============================================================================

describe('WorkflowInstance State', () => {
  it('should track completed, failed, and skipped phases', () => {
    const instance: WorkflowInstance = {
      id: 'test-instance',
      templateId: 'chapter-template',
      name: 'Test',
      status: 'running',
      createdAt: Date.now(),
      currentPhaseIds: [],
      completedPhaseIds: ['scene-plan', 'draft-scene'],
      failedPhaseIds: [],
      skippedPhaseIds: [],
      phaseOutputs: new Map(),
      sharedData: new Map(),
      retryHistory: new Map(),
      progress: 0.5
    }
    
    expect(instance.completedPhaseIds).toContain('scene-plan')
    expect(instance.progress).toBe(0.5)
  })
})

// ===============================================================================
// PhaseExecutionResult Tests
// ===============================================================================

describe('PhaseExecutionResult', () => {
  it('should track success result', () => {
    const result: PhaseExecutionResult = {
      phaseId: 'draft-scene',
      status: 'success',
      output: { content: 'Generated scene' },
      duration: 5000,
      attempts: 1,
      timestamp: Date.now()
    }
    
    expect(result.status).toBe('success')
    expect(result.duration).toBe(5000)
    expect(result.output).toEqual({ content: 'Generated scene' })
  })

  it('should track failed result with error', () => {
    const result: PhaseExecutionResult = {
      phaseId: 'draft-scene',
      status: 'failed',
      output: null,
      duration: 15000,
      error: 'Timeout exceeded',
      attempts: 3,
      timestamp: Date.now()
    }
    
    expect(result.status).toBe('failed')
    expect(result.error).toBe('Timeout exceeded')
  })
})