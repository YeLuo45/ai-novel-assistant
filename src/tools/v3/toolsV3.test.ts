/**
 * Tools V3 Tests - V62
 * Tests for ToolGenerator, ToolOrchestrator, ToolOptimizer, ToolMarketV3
 */

import { describe, it, expect } from 'vitest'
import {
  createToolTemplate,
  generateToolDescription,
  validateToolCode,
  addInputToTool,
  addOutputToTool,
  setToolDependencies,
  parseToolDescription,
  generateToolCode,
  createToolFromRequest,
  createWorkflow,
  addStepToWorkflow,
  addConnectionToWorkflow,
  detectCircularDependency,
  topologicalSort,
  validateWorkflow,
  executeWorkflowStep,
  calculatePerformanceScore,
  identifyBottleneck,
  suggestOptimization,
  calculateToolHealth,
  calculateMarketStats,
  filterToolsByCategory,
  sortToolsByPerformance,
  searchTools,
  type ToolTemplate,
  type ToolWorkflow,
  type WorkflowStep,
  type PerformanceMetrics,
  type ToolCategory
} from './toolsV3Types'

describe('ToolGenerator', () => {
  it('should create a tool template', () => {
    const tool = createToolTemplate('tool_1', 'Text Generator', 'Generates text', 'writing', 'function test() {}')
    expect(tool.id).toBe('tool_1')
    expect(tool.name).toBe('Text Generator')
    expect(tool.category).toBe('writing')
    expect(tool.generatedBy).toBe('user')
  })

  it('should generate tool description from template', () => {
    const tool = createToolTemplate('tool_1', 'Text Generator', 'Generates text', 'writing', '')
    const desc = generateToolDescription(tool)
    expect(desc).toContain('Text Generator')
    expect(desc).toContain('writing')
  })

  it('should validate correct tool code', () => {
    const result = validateToolCode('function test() { return true; }')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject code with mismatched braces', () => {
    const result = validateToolCode('function test() { return true;')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => e.includes('brace'))).toBeTruthy()
  })

  it('should add input to tool', () => {
    const tool = createToolTemplate('tool_1', 'Test', 'Test', 'writing', '')
    const withInput = addInputToTool(tool, {
      name: 'text',
      type: 'string',
      required: true,
      description: 'Input text'
    })
    expect(withInput.inputs).toHaveLength(1)
    expect(withInput.inputs[0].name).toBe('text')
  })

  it('should add output to tool', () => {
    const tool = createToolTemplate('tool_1', 'Test', 'Test', 'writing', '')
    const withOutput = addOutputToTool(tool, {
      name: 'result',
      type: 'string',
      description: 'Output result'
    })
    expect(withOutput.outputs).toHaveLength(1)
  })

  it('should set tool dependencies', () => {
    const tool = createToolTemplate('tool_1', 'Test', 'Test', 'writing', '')
    const withDeps = setToolDependencies(tool, ['dep1', 'dep2'])
    expect(withDeps.dependencies).toEqual(['dep1', 'dep2'])
  })

  it('should parse tool description for category', () => {
    const parsed = parseToolDescription('Generate a character dialogue')
    expect(parsed.category).toBe('character')
  })

  it('should generate valid tool code from request', () => {
    const code = generateToolCode({
      description: 'Test tool',
      category: 'writing'
    })
    expect(code).toContain('function')
    expect(code).toContain('writing')
  })

  it('should create tool from request', () => {
    const result = createToolFromRequest({
      description: 'Test tool for writing',
      category: 'writing'
    })
    expect(result.success).toBe(true)
    expect(result.tool).toBeDefined()
    expect(result.tool!.generatedBy).toBe('ai')
  })

  it('should reject short descriptions', () => {
    const result = createToolFromRequest({
      description: 'ab',
      category: 'writing'
    })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})

describe('ToolWorkflowOrchestrator', () => {
  it('should create empty workflow', () => {
    const wf = createWorkflow('Test Workflow')
    expect(wf.name).toBe('Test Workflow')
    expect(wf.status).toBe('draft')
    expect(wf.steps).toHaveLength(0)
  })

  it('should add step to workflow', () => {
    const wf = createWorkflow('Test')
    const step: WorkflowStep = { id: 'step_1', toolId: 'tool_1', inputs: {} }
    const withStep = addStepToWorkflow(wf, step)
    expect(withStep.steps).toHaveLength(1)
  })

  it('should add connection to workflow', () => {
    const wf = createWorkflow('Test')
    const conn = { from: 'step_1', to: 'step_2', outputField: 'result', inputField: 'data' }
    const withConn = addConnectionToWorkflow(wf, conn)
    expect(withConn.connections).toHaveLength(1)
  })

  it('should detect circular dependency', () => {
    const wf: ToolWorkflow = {
      id: 'wf_1',
      name: 'Circular Test',
      steps: [
        { id: 'step_1', toolId: 'tool_1', inputs: {} },
        { id: 'step_2', toolId: 'tool_2', inputs: {} },
        { id: 'step_3', toolId: 'tool_3', inputs: {} }
      ],
      connections: [
        { from: 'step_1', to: 'step_2', outputField: 'out', inputField: 'in' },
        { from: 'step_2', to: 'step_3', outputField: 'out', inputField: 'in' },
        { from: 'step_3', to: 'step_1', outputField: 'out', inputField: 'in' }
      ],
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    expect(detectCircularDependency(wf)).toBe(true)
  })

  it('should not detect circular in valid workflow', () => {
    const wf: ToolWorkflow = {
      id: 'wf_1',
      name: 'Valid Workflow',
      steps: [
        { id: 'step_1', toolId: 'tool_1', inputs: {} },
        { id: 'step_2', toolId: 'tool_2', inputs: {} }
      ],
      connections: [
        { from: 'step_1', to: 'step_2', outputField: 'out', inputField: 'in' }
      ],
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    expect(detectCircularDependency(wf)).toBe(false)
  })

  it('should topologically sort workflow steps', () => {
    const wf: ToolWorkflow = {
      id: 'wf_1',
      name: 'Sorted Workflow',
      steps: [
        { id: 'step_1', toolId: 'tool_1', inputs: {} },
        { id: 'step_2', toolId: 'tool_2', inputs: {} }
      ],
      connections: [
        { from: 'step_1', to: 'step_2', outputField: 'out', inputField: 'in' }
      ],
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const sorted = topologicalSort(wf)
    expect(sorted[0].id).toBe('step_1')
    expect(sorted[1].id).toBe('step_2')
  })

  it('should validate workflow with circular dependency', () => {
    const wf: ToolWorkflow = {
      id: 'wf_1',
      name: 'Circular',
      steps: [
        { id: 'step_1', toolId: 'tool_1', inputs: {} },
        { id: 'step_2', toolId: 'tool_2', inputs: {} },
        { id: 'step_3', toolId: 'tool_3', inputs: {} }
      ],
      connections: [
        { from: 'step_1', to: 'step_2', outputField: 'o', inputField: 'i' },
        { from: 'step_2', to: 'step_1', outputField: 'o', inputField: 'i' }
      ],
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const validation = validateWorkflow(wf)
    expect(validation.valid).toBe(false)
    expect(validation.errors.some((e: string) => e.includes('circular'))).toBeTruthy()
  })

  it('should validate empty workflow as invalid', () => {
    const wf = createWorkflow('Empty')
    const validation = validateWorkflow(wf)
    expect(validation.valid).toBe(false)
  })

  it('should execute workflow step', () => {
    const step: WorkflowStep = { id: 'step_1', toolId: 'tool_1', inputs: { text: 'hello' } }
    const result = executeWorkflowStep(step, {})
    expect(result).toBeDefined()
  })
})

describe('ToolPerformanceOptimizer', () => {
  it('should calculate performance score', () => {
    const metrics: PerformanceMetrics = {
      toolId: 'tool_1',
      avgExecutionTime: 500,
      minExecutionTime: 100,
      maxExecutionTime: 1000,
      successRate: 0.95,
      errorCount: 2,
      lastUsed: Date.now(),
      totalUsage: 50
    }
    const score = calculatePerformanceScore(metrics)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('should identify bottleneck when one tool is significantly slower', () => {
    const metrics: PerformanceMetrics[] = [
      {
        toolId: 'slow_tool',
        avgExecutionTime: 9000,
        minExecutionTime: 1000,
        maxExecutionTime: 15000,
        successRate: 0.9,
        errorCount: 5,
        lastUsed: Date.now(),
        totalUsage: 20
      },
      {
        toolId: 'fast_tool',
        avgExecutionTime: 100,
        minExecutionTime: 50,
        maxExecutionTime: 200,
        successRate: 0.99,
        errorCount: 1,
        lastUsed: Date.now(),
        totalUsage: 100
      }
    ]
    const bottleneck = identifyBottleneck(metrics)
    expect(bottleneck).not.toBeNull()
    expect(bottleneck!.toolId).toBe('slow_tool')
  })

  it('should suggest optimizations', () => {
    const metrics: PerformanceMetrics[] = [
      {
        toolId: 'tool_1',
        avgExecutionTime: 5000,
        minExecutionTime: 1000,
        maxExecutionTime: 10000,
        successRate: 0.7,
        errorCount: 15,
        lastUsed: Date.now(),
        totalUsage: 50
      }
    ]
    const suggestions = suggestOptimization(metrics)
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('should calculate tool health as healthy', () => {
    const metrics: PerformanceMetrics = {
      toolId: 'tool_1',
      avgExecutionTime: 200,
      minExecutionTime: 100,
      maxExecutionTime: 400,
      successRate: 0.99,
      errorCount: 1,
      lastUsed: Date.now(),
      totalUsage: 100
    }
    expect(calculateToolHealth(metrics)).toBe('healthy')
  })

  it('should calculate tool health as critical', () => {
    const metrics: PerformanceMetrics = {
      toolId: 'tool_1',
      avgExecutionTime: 15000,
      minExecutionTime: 5000,
      maxExecutionTime: 30000,
      successRate: 0.4,
      errorCount: 50,
      lastUsed: Date.now(),
      totalUsage: 10
    }
    expect(calculateToolHealth(metrics)).toBe('critical')
  })
})

describe('ToolMarketV3', () => {
  const createTool = (id: string, category: ToolCategory): ToolTemplate => ({
    id,
    name: `Tool ${id}`,
    description: `Description for ${id}`,
    category,
    code: 'function test() {}',
    inputs: [],
    outputs: [],
    dependencies: [],
    performance: { avgExecutionTime: 100, successRate: 0.9, usageCount: 20 },
    generatedBy: 'user',
    createdAt: Date.now()
  })

  it('should calculate market stats', () => {
    const tools = [
      createTool('t1', 'writing'),
      createTool('t2', 'writing'),
      createTool('t3', 'plot')
    ]
    const stats = calculateMarketStats(tools)
    expect(stats.totalTools).toBe(3)
    expect(stats.topCategories[0].category).toBe('writing')
    expect(stats.topCategories[0].count).toBe(2)
  })

  it('should filter tools by category', () => {
    const tools = [
      createTool('t1', 'writing'),
      createTool('t2', 'plot')
    ]
    const filtered = filterToolsByCategory(tools, 'writing')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].category).toBe('writing')
  })

  it('should sort tools by performance', () => {
    const tools: ToolTemplate[] = [
      { ...createTool('t1', 'writing'), performance: { avgExecutionTime: 500, successRate: 0.7, usageCount: 10 } },
      { ...createTool('t2', 'writing'), performance: { avgExecutionTime: 100, successRate: 0.99, usageCount: 100 } }
    ]
    const sorted = sortToolsByPerformance(tools)
    expect(sorted[0].id).toBe('t2')
  })

  it('should search tools by name', () => {
    const tools = [
      createTool('t1', 'writing'),
      createTool('t2', 'plot')
    ]
    const results = searchTools(tools, 'Tool t1')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('t1')
  })

  it('should search tools by description', () => {
    const tools = [
      createTool('t1', 'writing'),
      createTool('t2', 'plot')
    ]
    const results = searchTools(tools, 'Description for t2')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('t2')
  })
})

describe('Integration', () => {
  it('should generate and validate tool workflow', () => {
    // Generate tool
    const genResult = createToolFromRequest({
      description: 'Character dialogue generator',
      category: 'character'
    })
    expect(genResult.success).toBe(true)

    // Create workflow
    const wf = createWorkflow('Character Workflow')
    const step1: WorkflowStep = { id: 'gen', toolId: genResult.tool!.id, inputs: {} }
    const step2: WorkflowStep = { id: 'edit', toolId: 'edit_tool', inputs: {} }

    let updatedWf = addStepToWorkflow(wf, step1)
    updatedWf = addStepToWorkflow(updatedWf, step2)
    updatedWf = addConnectionToWorkflow(updatedWf, { from: 'gen', to: 'edit', outputField: 'result', inputField: 'input' })

    // Validate workflow
    const validation = validateWorkflow(updatedWf)
    expect(validation.valid).toBe(true)

    // Check no circular dependency
    expect(detectCircularDependency(updatedWf)).toBe(false)
  })
})