/**
 * Tools V3 Types - V62
 * Types for ToolGenerator, ToolWorkflowOrchestrator, ToolPerformanceOptimizer, ToolMarketV3
 */

export type ToolCategory = 'writing' | 'plot' | 'world' | 'character' | 'edit' | 'custom'

export interface ToolInput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  default?: unknown
}

export interface ToolOutput {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
}

export interface ToolTemplate {
  id: string
  name: string
  description: string
  category: ToolCategory
  code: string
  inputs: ToolInput[]
  outputs: ToolOutput[]
  dependencies: string[]
  performance: {
    avgExecutionTime: number
    successRate: number
    usageCount: number
  }
  generatedBy: 'user' | 'ai'
  createdAt: number
}

export interface WorkflowStep {
  id: string
  toolId: string
  inputs: Record<string, unknown>
  condition?: string
  retryPolicy?: {
    maxRetries: number
    backoffMs: number
  }
}

export interface WorkflowConnection {
  from: string
  to: string
  outputField: string
  inputField: string
}

export interface ToolWorkflow {
  id: string
  name: string
  steps: WorkflowStep[]
  connections: WorkflowConnection[]
  status: 'draft' | 'active' | 'paused'
  createdAt: number
  updatedAt: number
}

export interface ToolGenerationRequest {
  description: string
  category: ToolCategory
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}

export interface ToolGenerationResult {
  success: boolean
  tool?: ToolTemplate
  errors?: string[]
  warnings?: string[]
}

export interface OptimizationSuggestion {
  toolId: string
  issue: string
  severity: 'low' | 'medium' | 'high'
  suggestion: string
  estimatedImprovement: number  // percentage
}

export interface PerformanceMetrics {
  toolId: string
  avgExecutionTime: number
  minExecutionTime: number
  maxExecutionTime: number
  successRate: number
  errorCount: number
  lastUsed: number
  totalUsage: number
}

// ToolGenerator Functions

export function createToolTemplate(
  id: string,
  name: string,
  description: string,
  category: ToolCategory,
  code: string
): ToolTemplate {
  return {
    id,
    name,
    description,
    category,
    code,
    inputs: [],
    outputs: [],
    dependencies: [],
    performance: {
      avgExecutionTime: 0,
      successRate: 1.0,
      usageCount: 0
    },
    generatedBy: 'user',
    createdAt: Date.now()
  }
}

export function generateToolDescription(template: Partial<ToolTemplate>): string {
  const parts: string[] = []
  if (template.name) parts.push(`Tool: ${template.name}`)
  if (template.description) parts.push(template.description)
  if (template.category) parts.push(`Category: ${template.category}`)
  if (template.inputs && template.inputs.length > 0) {
    const requiredInputs = template.inputs.filter(i => i.required).map(i => i.name)
    if (requiredInputs.length > 0) {
      parts.push(`Required inputs: ${requiredInputs.join(', ')}`)
    }
  }
  return parts.join('. ') || 'Custom tool'
}

export function validateToolCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (code.length < 10) errors.push('Code too short')
  if (!code.includes('function') && !code.includes('=>') && !code.includes('async')) {
    errors.push('Code must contain a function declaration')
  }
  // Check for obvious syntax issues
  const openBraces = (code.match(/{/g) || []).length
  const closeBraces = (code.match(/}/g) || []).length
  if (openBraces !== closeBraces) errors.push('Mismatched braces')
  return { valid: errors.length === 0, errors }
}

export function addInputToTool(tool: ToolTemplate, input: ToolInput): ToolTemplate {
  return {
    ...tool,
    inputs: [...tool.inputs, input]
  }
}

export function addOutputToTool(tool: ToolTemplate, output: ToolOutput): ToolTemplate {
  return {
    ...tool,
    outputs: [...tool.outputs, output]
  }
}

export function setToolDependencies(tool: ToolTemplate, deps: string[]): ToolTemplate {
  return {
    ...tool,
    dependencies: deps
  }
}

// Tool Generation Functions

export function parseToolDescription(description: string): Record<string, string> {
  const keywords: Record<string, string[]> = {
    writing: ['write', 'compose', 'generate text', 'create content'],
    plot: ['plot', 'story', 'narrative', 'conflict'],
    character: ['character', 'personality', 'dialogue', 'speech'],
    world: ['world', 'setting', 'environment', 'location'],
    edit: ['edit', 'revise', 'improve', 'polish']
  }

  const result: Record<string, string> = { category: 'custom' }
  const descLower = description.toLowerCase()

  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(w => descLower.includes(w))) {
      result.category = cat
      break
    }
  }

  const inputMatch = descLower.match(/input[:\s]+(\w+)/gi)
  if (inputMatch) result.inputType = inputMatch[0].split(':')[1]?.trim() || 'unknown'

  return result
}

export function generateToolCode(request: ToolGenerationRequest): string {
  const categoryDefault = {
    writing: 'textProcessor',
    plot: 'storyAnalyzer',
    world: 'settingBuilder',
    character: 'characterCreator',
    edit: 'textEditor',
    custom: 'customTool'
  }

  const funcName = categoryDefault[request.category] || 'customTool'
  const hasInput = request.inputSchema && Object.keys(request.inputSchema).length > 0
  const hasOutput = request.outputSchema && Object.keys(request.outputSchema).length > 0

  let code = `// Auto-generated tool: ${request.category}\n`
  code += `export async function ${funcName}(`
  if (hasInput) {
    code += `input: ${JSON.stringify(request.inputSchema)}`
  } else {
    code += `()`
  }
  code += `) {\n`
  code += `  // TODO: Implement ${request.description}\n`
  if (hasOutput) {
    code += `  return ${JSON.stringify(request.outputSchema)};\n`
  } else {
    code += `  return { result: 'success' };\n`
  }
  code += `}\n`
  return code
}

export function createToolFromRequest(request: ToolGenerationRequest): ToolGenerationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!request.description || request.description.length < 5) {
    errors.push('Description too short (minimum 5 characters)')
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  const parsed = parseToolDescription(request.description)
  const code = generateToolCode(request)

  const tool: ToolTemplate = {
    id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: request.description.split(' ')[0] || 'Custom Tool',
    description: request.description,
    category: parsed.category as ToolCategory || request.category,
    code,
    inputs: [],
    outputs: [],
    dependencies: [],
    performance: {
      avgExecutionTime: 0,
      successRate: 1.0,
      usageCount: 0
    },
    generatedBy: 'ai',
    createdAt: Date.now()
  }

  const validation = validateToolCode(code)
  if (!validation.valid) {
    errors.push(...validation.errors)
  }

  return {
    success: errors.length === 0,
    tool,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

// ToolWorkflowOrchestrator Functions

export function createWorkflow(name: string): ToolWorkflow {
  return {
    id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    steps: [],
    connections: [],
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

export function addStepToWorkflow(workflow: ToolWorkflow, step: WorkflowStep): ToolWorkflow {
  return {
    ...workflow,
    steps: [...workflow.steps, step],
    updatedAt: Date.now()
  }
}

export function addConnectionToWorkflow(workflow: ToolWorkflow, conn: WorkflowConnection): ToolWorkflow {
  return {
    ...workflow,
    connections: [...workflow.connections, conn],
    updatedAt: Date.now()
  }
}

export function detectCircularDependency(workflow: ToolWorkflow): boolean {
  const graph: Record<string, string[]> = {}
  for (const step of workflow.steps) {
    graph[step.id] = []
  }
  for (const conn of workflow.connections) {
    if (graph[conn.from]) {
      graph[conn.from].push(conn.to)
    }
  }

  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(node: string): boolean {
    if (recursionStack.has(node)) return true
    if (visited.has(node)) return false

    visited.add(node)
    recursionStack.add(node)

    for (const neighbor of graph[node] || []) {
      if (hasCycle(neighbor)) return true
    }

    recursionStack.delete(node)
    return false
  }

  for (const step of workflow.steps) {
    if (hasCycle(step.id)) return true
  }

  return false
}

export function topologicalSort(workflow: ToolWorkflow): WorkflowStep[] {
  const inDegree: Record<string, number> = {}
  const graph: Record<string, string[]> = {}

  for (const step of workflow.steps) {
    inDegree[step.id] = 0
    graph[step.id] = []
  }

  for (const conn of workflow.connections) {
    graph[conn.from].push(conn.to)
    inDegree[conn.to] = (inDegree[conn.to] || 0) + 1
  }

  const queue: string[] = []
  for (const step of workflow.steps) {
    if (inDegree[step.id] === 0) queue.push(step.id)
  }

  const sorted: WorkflowStep[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    const step = workflow.steps.find(s => s.id === current)
    if (step) sorted.push(step)

    for (const neighbor of graph[current] || []) {
      inDegree[neighbor]--
      if (inDegree[neighbor] === 0) queue.push(neighbor)
    }
  }

  return sorted
}

export function validateWorkflow(workflow: ToolWorkflow): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (workflow.steps.length === 0) {
    errors.push('Workflow must have at least one step')
  }

  if (detectCircularDependency(workflow)) {
    errors.push('Workflow contains circular dependencies')
  }

  const stepIds = new Set(workflow.steps.map(s => s.id))
  for (const conn of workflow.connections) {
    if (!stepIds.has(conn.from)) {
      errors.push(`Connection references unknown step: ${conn.from}`)
    }
    if (!stepIds.has(conn.to)) {
      errors.push(`Connection references unknown step: ${conn.to}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function executeWorkflowStep(step: WorkflowStep, context: Record<string, unknown>): unknown {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(step.inputs)) {
    result[key] = value
  }
  return result
}

// ToolPerformanceOptimizer Functions

export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  const timeScore = Math.max(0, 1 - metrics.avgExecutionTime / 10000)
  const successScore = metrics.successRate
  const usageScore = Math.min(1, metrics.totalUsage / 100)
  return (timeScore * 0.3 + successScore * 0.5 + usageScore * 0.2)
}

export function identifyBottleneck(metrics: PerformanceMetrics[]): OptimizationSuggestion | null {
  if (metrics.length === 0) return null

  const sorted = [...metrics].sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
  const slowest = sorted[0]

  if (slowest.avgExecutionTime < 1000) return null

  const avgTime = metrics.reduce((s, m) => s + m.avgExecutionTime, 0) / metrics.length
  const threshold = avgTime * 1.5

  if (slowest.avgExecutionTime > threshold) {
    return {
      toolId: slowest.toolId,
      issue: `Execution time ${slowest.avgExecutionTime}ms is ${((slowest.avgExecutionTime / avgTime - 1) * 100).toFixed(0)}% above average`,
      severity: slowest.avgExecutionTime > threshold * 2 ? 'high' : 'medium',
      suggestion: 'Consider optimizing this tool or adding caching',
      estimatedImprovement: Math.min(50, ((slowest.avgExecutionTime - avgTime) / slowest.avgExecutionTime) * 100)
    }
  }

  return null
}

export function suggestOptimization(metrics: PerformanceMetrics[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = []

  const bottleneck = identifyBottleneck(metrics)
  if (bottleneck) suggestions.push(bottleneck)

  for (const m of metrics) {
    if (m.successRate < 0.9) {
      suggestions.push({
        toolId: m.toolId,
        issue: `Low success rate: ${(m.successRate * 100).toFixed(1)}%`,
        severity: m.successRate < 0.7 ? 'high' : 'medium',
        suggestion: 'Review error handling and retry logic',
        estimatedImprovement: (1 - m.successRate) * 100
      })
    }

    if (m.errorCount > 10) {
      suggestions.push({
        toolId: m.toolId,
        issue: `High error count: ${m.errorCount} errors`,
        severity: 'low',
        suggestion: 'Add more robust error handling',
        estimatedImprovement: 20
      })
    }
  }

  return suggestions.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

export function calculateToolHealth(metrics: PerformanceMetrics): 'healthy' | 'warning' | 'critical' {
  if (metrics.successRate < 0.5 || metrics.avgExecutionTime > 10000) {
    return 'critical'
  }
  if (metrics.successRate < 0.8 || metrics.avgExecutionTime > 3000) {
    return 'warning'
  }
  return 'healthy'
}

// ToolMarketV3 Functions

export interface MarketStats {
  totalTools: number
  totalWorkflows: number
  avgPerformance: number
  topCategories: Array<{ category: ToolCategory; count: number }>
}

export function calculateMarketStats(tools: ToolTemplate[]): MarketStats {
  const categoryCount: Record<string, number> = {}
  let totalPerf = 0

  for (const tool of tools) {
    categoryCount[tool.category] = (categoryCount[tool.category] || 0) + 1
    totalPerf += tool.performance.successRate
  }

  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category: category as ToolCategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalTools: tools.length,
    totalWorkflows: 0,
    avgPerformance: tools.length > 0 ? totalPerf / tools.length : 0,
    topCategories
  }
}

export function filterToolsByCategory(tools: ToolTemplate[], category: ToolCategory): ToolTemplate[] {
  return tools.filter(t => t.category === category)
}

export function sortToolsByPerformance(tools: ToolTemplate[]): ToolTemplate[] {
  return [...tools].sort((a, b) => {
    const scoreA = calculatePerformanceScore({
      toolId: a.id,
      avgExecutionTime: a.performance.avgExecutionTime,
      minExecutionTime: 0,
      maxExecutionTime: a.performance.avgExecutionTime * 2,
      successRate: a.performance.successRate,
      errorCount: 0,
      lastUsed: 0,
      totalUsage: a.performance.usageCount
    })
    const scoreB = calculatePerformanceScore({
      toolId: b.id,
      avgExecutionTime: b.performance.avgExecutionTime,
      minExecutionTime: 0,
      maxExecutionTime: b.performance.avgExecutionTime * 2,
      successRate: b.performance.successRate,
      errorCount: 0,
      lastUsed: 0,
      totalUsage: b.performance.usageCount
    })
    return scoreB - scoreA
  })
}

export function searchTools(tools: ToolTemplate[], query: string): ToolTemplate[] {
  const queryLower = query.toLowerCase()
  return tools.filter(t =>
    t.name.toLowerCase().includes(queryLower) ||
    t.description.toLowerCase().includes(queryLower) ||
    t.category.toLowerCase().includes(queryLower)
  )
}