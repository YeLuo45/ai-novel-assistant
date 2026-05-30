/**
 * StoryFlow Orchestrator - V74
 * DAG-based Workflow Engine with parallel execution, conditional branching, and templates
 * Extends V37 PhaseEngine with next-gen orchestration capabilities
 * 
 * Key features:
 * - DAG-based phase dependency resolution
 * - Parallel phase execution (independent branches)
 * - Conditional branching based on phase output
 * - Workflow templates (outline, draft, review, publish)
 * - Retry with exponential backoff
 * - Real-time progress tracking
 */

import { collaborationBus } from '../messagebus'

// ===============================================================================
// Types
// ===============================================================================

export type PhaseStatus = 'pending' | 'queued' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled'
export type RetryStrategy = 'none' | 'linear' | 'exponential' | 'fibonacci'

export interface PhaseNode {
  id: string
  name: string
  agent: string
  tools: string[]
  inputKeys: string[]
  outputKey: string
  condition?: string
  timeout: number
  retry: RetryStrategy
  maxRetries: number
  parallelGroup?: string  // Phases in same group run concurrently
  dependsOn: string[]  // Phase IDs this phase depends on
  onSuccess?: string[]  // Next phases on success
  onFailure?: string[]  // Next phases on failure
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  genre?: string
  phases: PhaseNode[]
  entryPhase: string
  globals: {
    model?: string
    temperature?: number
    maxTokens?: number
    priority?: 'low' | 'normal' | 'high' | 'critical'
  }
}

export interface WorkflowInstance {
  id: string
  templateId: string
  name: string
  status: 'created' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  createdAt: number
  startedAt?: number
  completedAt?: number
  currentPhaseIds: string[]
  completedPhaseIds: string[]
  failedPhaseIds: string[]
  skippedPhaseIds: string[]
  phaseOutputs: Map<string, unknown>
  sharedData: Map<string, unknown>
  retryHistory: Map<string, number>
  progress: number  // 0-1
  estimatedTimeRemainingMs?: number
}

export interface PhaseExecutionResult {
  phaseId: string
  status: PhaseStatus
  output: unknown
  duration: number
  error?: string
  attempts: number
  timestamp: number
}

export interface WorkflowEvent {
  type: 'phase-started' | 'phase-completed' | 'phase-failed' | 'phase-skipped' | 'workflow-started' | 'workflow-progress' | 'workflow-completed' | 'workflow-failed'
  workflowId: string
  phaseId?: string
  timestamp: number
  data: Record<string, unknown>
}

// ===============================================================================
// DAG Utilities
// ===============================================================================

export function buildPhaseGraph(phases: PhaseNode[]): Map<string, PhaseNode> {
  const graph = new Map<string, PhaseNode>()
  for (const phase of phases) {
    graph.set(phase.id, phase)
  }
  return graph
}

export function topologicalSort(phases: PhaseNode[]): string[] {
  const graph = buildPhaseGraph(phases)
  const visited = new Set<string>()
  const result: string[] = []
  
  function visit(phaseId: string) {
    if (visited.has(phaseId)) return
    visited.add(phaseId)
    
    const phase = graph.get(phaseId)
    if (!phase) return
    
    // Visit dependencies first
    for (const depId of phase.dependsOn) {
      visit(depId)
    }
    
    result.push(phaseId)
  }
  
  for (const phase of phases) {
    visit(phase.id)
  }
  
  return result
}

export function getParallelGroups(sortedPhaseIds: string[], phases: PhaseNode[]): Map<string, string[]> {
  const phaseMap = new Map(phases.map(p => [p.id, p]))
  const groups = new Map<string, string[]>()
  
  for (const phaseId of sortedPhaseIds) {
    const phase = phaseMap.get(phaseId)
    if (!phase?.parallelGroup) continue
    
    if (!groups.has(phase.parallelGroup)) {
      groups.set(phase.parallelGroup, [])
    }
    groups.get(phase.parallelGroup)!.push(phaseId)
  }
  
  return groups
}

export function getExecutablePhases(
  sortedPhaseIds: string[],
  phases: PhaseNode[],
  completed: Set<string>,
  failed: Set<string>,
  running: Set<string>
): string[] {
  const phaseMap = new Map(phases.map(p => [p.id, p]))
  const executable: string[] = []
  
  for (const phaseId of sortedPhaseIds) {
    if (completed.has(phaseId) || failed.has(phaseId) || running.has(phaseId)) continue
    
    const phase = phaseMap.get(phaseId)
    if (!phase) continue
    
    // Check all dependencies are completed
    const depsMet = phase.dependsOn.every(depId => completed.has(depId))
    if (!depsMet) continue
    
    // Check no failed dependencies unless this phase handles failure
    const hasFailedDep = phase.dependsOn.some(depId => failed.has(depId))
    if (hasFailedDep && !phase.onFailure) continue
    
    executable.push(phaseId)
  }
  
  return executable
}

export function evaluateCondition(condition: string | undefined, outputs: Map<string, unknown>): boolean {
  if (!condition) return true
  
  // Simple condition evaluation
  // Format: "output_key > 0.5" or "output_key == 'success'"
  const match = condition.match(/^(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/)
  if (!match) return true
  
  const [, key, op, valueStr] = match
  const actual = outputs.get(key)
  
  if (actual === undefined) return false
  
  // Number comparison
  const actualNum = Number(actual)
  if (!isNaN(actualNum)) {
    const valueNum = Number(valueStr)
    switch (op) {
      case '==': return actualNum === valueNum
      case '!=': return actualNum !== valueNum
      case '>': return actualNum > valueNum
      case '>=': return actualNum >= valueNum
      case '<': return actualNum < valueNum
      case '<=': return actualNum <= valueNum
    }
  }
  
  // String comparison
  return String(actual) === valueStr.replace(/^['"]|['"]$/g, '')
}

// ===============================================================================
// Retry Calculator
// ===============================================================================

export function getRetryDelay(attempts: number, strategy: RetryStrategy): number {
  const base = 1000  // 1 second
  
  switch (strategy) {
    case 'none':
      return 0
    case 'linear':
      return base * attempts
    case 'exponential':
      return base * Math.pow(2, attempts - 1)
    case 'fibonacci':
      // Fibonacci: 1, 1, 2, 3, 5, 8, 13...
      const fib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
      return base * (fib[Math.min(attempts, 9)] || 34)
    default:
      return base
  }
}

// ===============================================================================
// Template Factory
// ===============================================================================

export function createStoryTemplate(genre: string = 'general'): WorkflowTemplate {
  const basePhases: PhaseNode[] = [
    {
      id: 'concept',
      name: 'Concept Development',
      agent: 'planner',
      tools: ['concept-map', 'genre-analysis'],
      inputKeys: [],
      outputKey: 'concept',
      timeout: 30000,
      retry: 'exponential',
      maxRetries: 2,
      dependsOn: [],
      onSuccess: ['outline']
    },
    {
      id: 'outline',
      name: 'Story Outline',
      agent: 'planner',
      tools: ['outline-generator', 'beat-sheet'],
      inputKeys: ['concept'],
      outputKey: 'outline',
      timeout: 60000,
      retry: 'exponential',
      maxRetries: 2,
      dependsOn: ['concept'],
      onSuccess: ['character', 'world']
    },
    {
      id: 'character',
      name: 'Character Development',
      agent: 'character',
      tools: ['character-arc', 'relationship-map'],
      inputKeys: ['outline'],
      outputKey: 'characters',
      timeout: 45000,
      retry: 'linear',
      maxRetries: 3,
      parallelGroup: 'drafting',
      dependsOn: ['outline'],
      onSuccess: ['draft']
    },
    {
      id: 'world',
      name: 'World Building',
      agent: 'worldbuilder',
      tools: ['world-lore', 'setting-map'],
      inputKeys: ['outline'],
      outputKey: 'world',
      timeout: 45000,
      retry: 'linear',
      maxRetries: 3,
      parallelGroup: 'drafting',
      dependsOn: ['outline'],
      onSuccess: ['draft']
    },
    {
      id: 'draft',
      name: 'First Draft',
      agent: 'writer',
      tools: ['chapter-writer', 'scene-builder'],
      inputKeys: ['outline', 'characters', 'world'],
      outputKey: 'draft',
      timeout: 120000,
      retry: 'exponential',
      maxRetries: 2,
      dependsOn: ['character', 'world'],
      onSuccess: ['review']
    },
    {
      id: 'review',
      name: 'Content Review',
      agent: 'reviewer',
      tools: ['quality-gate', 'consistency-check'],
      inputKeys: ['draft'],
      outputKey: 'review',
      condition: 'draft.quality > 0.6',
      timeout: 60000,
      retry: 'linear',
      maxRetries: 3,
      dependsOn: ['draft'],
      onSuccess: ['polish']
    },
    {
      id: 'polish',
      name: 'Polish & Edit',
      agent: 'editor',
      tools: ['line-edit', 'grammar-check', 'style-polish'],
      inputKeys: ['review'],
      outputKey: 'polished',
      timeout: 45000,
      retry: 'linear',
      maxRetries: 2,
      dependsOn: ['review'],
      onSuccess: ['final-review']
    },
    {
      id: 'final-review',
      name: 'Final Approval',
      agent: 'reviewer',
      tools: ['final-check'],
      inputKeys: ['polished'],
      outputKey: 'final',
      timeout: 30000,
      retry: 'none',
      maxRetries: 0,
      dependsOn: ['polish']
    }
  ]
  
  return {
    id: `story-template-${genre}`,
    name: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Story Template`,
    description: `Standard workflow for ${genre} novels`,
    genre,
    phases: basePhases,
    entryPhase: 'concept',
    globals: {
      temperature: 0.8,
      maxTokens: 4000,
      priority: 'normal'
    }
  }
}

export function createChapterTemplate(): WorkflowTemplate {
  const phases: PhaseNode[] = [
    {
      id: 'scene-plan',
      name: 'Scene Planning',
      agent: 'planner',
      tools: ['scene-outline'],
      inputKeys: [],
      outputKey: 'scenePlan',
      timeout: 15000,
      retry: 'linear',
      maxRetries: 2,
      dependsOn: [],
      onSuccess: ['draft-scene']
    },
    {
      id: 'draft-scene',
      name: 'Draft Scene',
      agent: 'writer',
      tools: ['scene-writer'],
      inputKeys: ['scenePlan'],
      outputKey: 'sceneDraft',
      timeout: 60000,
      retry: 'exponential',
      maxRetries: 2,
      dependsOn: ['scene-plan'],
      onSuccess: ['review-scene']
    },
    {
      id: 'review-scene',
      name: 'Review Scene',
      agent: 'reviewer',
      tools: ['scene-review'],
      inputKeys: ['sceneDraft'],
      outputKey: 'sceneReview',
      timeout: 30000,
      retry: 'linear',
      maxRetries: 2,
      dependsOn: ['draft-scene'],
      onSuccess: ['polish-scene']
    },
    {
      id: 'polish-scene',
      name: 'Polish Scene',
      agent: 'editor',
      tools: ['scene-polish'],
      inputKeys: ['sceneReview'],
      outputKey: 'finalScene',
      timeout: 20000,
      retry: 'none',
      maxRetries: 0,
      dependsOn: ['review-scene']
    }
  ]
  
  return {
    id: 'chapter-template',
    name: 'Chapter Writing Template',
    description: 'Standard workflow for writing individual scenes/chapters',
    phases,
    entryPhase: 'scene-plan',
    globals: {
      temperature: 0.7,
      maxTokens: 3000,
      priority: 'normal'
    }
  }
}

// ===============================================================================
// StoryFlow Orchestrator
// ===============================================================================

export class StoryFlowOrchestrator {
  private templates: Map<string, WorkflowTemplate> = new Map()
  private instances: Map<string, WorkflowInstance> = new Map()
  private phaseQueue: string[] = []
  private runningPhases: Map<string, number> = new Map()  // phaseId -> startTime
  private eventListeners: Array<(event: WorkflowEvent) => void> = []
  private executionCallbacks: Map<string, (phase: PhaseNode) => Promise<unknown>> = new Map()
  
  constructor() {
    // Register default templates
    this.registerTemplate(createStoryTemplate('general'))
    this.registerTemplate(createChapterTemplate())
  }

  /**
   * Register a workflow template
   */
  registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.get(templateId) || null
  }

  /**
   * Create a workflow instance from template
   */
  createInstance(templateId: string, name?: string): WorkflowInstance | null {
    const template = this.templates.get(templateId)
    if (!template) return null

    const instance: WorkflowInstance = {
      id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateId,
      name: name || `${template.name} ${new Date().toLocaleTimeString()}`,
      status: 'created',
      createdAt: Date.now(),
      currentPhaseIds: [],
      completedPhaseIds: [],
      failedPhaseIds: [],
      skippedPhaseIds: [],
      phaseOutputs: new Map(),
      sharedData: new Map(),
      retryHistory: new Map(),
      progress: 0
    }

    this.instances.set(instance.id, instance)
    return instance
  }

  /**
   * Register execution callback for a phase
   */
  onPhaseExecute(callback: (phase: PhaseNode) => Promise<unknown>): void {
    // This would be connected to actual agent execution
    // For testing, we use this to inject mock responses
  }

  /**
   * Start workflow execution
   */
  async startWorkflow(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance || instance.status !== 'created') return

    const template = this.templates.get(instance.templateId)
    if (!template) return

    instance.status = 'running'
    instance.startedAt = Date.now()

    this.emit({
      type: 'workflow-started',
      workflowId: instanceId,
      timestamp: Date.now(),
      data: { templateId: template.id, name: instance.name }
    })

    // Build execution order
    const sortedPhaseIds = topologicalSort(template.phases)
    
    // Track completion state
    const completed = new Set<string>(instance.completedPhaseIds)
    const failed = new Set<string>(instance.failedPhaseIds)
    const running = new Set<string>()

    // Process phases
    while (true) {
      const executable = getExecutablePhases(sortedPhaseIds, template.phases, completed, failed, running)
      
      if (executable.length === 0) break

      // Execute in parallel if same group
      const parallelGroups = getParallelGroups(executable, template.phases)
      
      if (parallelGroups.size > 0) {
        // Execute parallel groups
        for (const groupPhases of Array.from(parallelGroups.values())) {
          const results = await Promise.all(
            groupPhases.map(phaseId => this.executePhase(instance, template, phaseId))
          )
          // Update completed/failed sets
          for (let i = 0; i < groupPhases.length; i++) {
            const result = results[i]
            if (result.status === 'success') {
              completed.add(groupPhases[i])
            } else if (result.status === 'failed') {
              failed.add(groupPhases[i])
            }
          }
        }
      } else {
        // Sequential execution
        for (const phaseId of executable) {
          const result = await this.executePhase(instance, template, phaseId)
          if (result.status === 'success') {
            completed.add(phaseId)
          } else if (result.status === 'failed') {
            failed.add(phaseId)
          }
        }
      }

      // Update instance state
      instance.completedPhaseIds = Array.from(completed)
      instance.failedPhaseIds = Array.from(failed)
      instance.currentPhaseIds = Array.from(running)
      
      // Update progress
      const totalPhases = template.phases.length
      const doneCount = completed.size + failed.size + instance.skippedPhaseIds.size
      instance.progress = doneCount / totalPhases

      this.emit({
        type: 'workflow-progress',
        workflowId: instanceId,
        timestamp: Date.now(),
        data: { progress: instance.progress, completed: completed.size, failed: failed.size, total: totalPhases }
      })
    }

    // Finalize
    instance.completedAt = Date.now()
    instance.currentPhaseIds = []
    
    if (failed.size > 0) {
      instance.status = 'failed'
      this.emit({
        type: 'workflow-failed',
        workflowId: instanceId,
        timestamp: Date.now(),
        data: { failedPhases: Array.from(failed) }
      })
    } else {
      instance.status = 'completed'
      this.emit({
        type: 'workflow-completed',
        workflowId: instanceId,
        timestamp: Date.now(),
        data: { totalDuration: instance.completedAt - (instance.startedAt || instance.createdAt) }
      })
    }
  }

  /**
   * Execute a single phase
   */
  private async executePhase(
    instance: WorkflowInstance,
    template: WorkflowTemplate,
    phaseId: string
  ): Promise<PhaseExecutionResult> {
    const phase = template.phases.find(p => p.id === phaseId)
    if (!phase) {
      return { phaseId, status: 'skipped', output: null, duration: 0, attempts: 0, timestamp: Date.now() }
    }

    const startTime = Date.now()
    let attempts = 0
    let lastError = ''

    this.emit({
      type: 'phase-started',
      workflowId: instance.id,
      phaseId,
      timestamp: startTime,
      data: { phaseName: phase.name, attempt: attempts + 1 }
    })

    while (attempts <= phase.maxRetries) {
      attempts++
      
      try {
        // Simulate phase execution (in real impl, this would call the agent)
        const output = await this.simulatePhaseExecution(phase, instance)
        
        // Check condition
        if (!evaluateCondition(phase.condition, instance.phaseOutputs)) {
          // Condition not met - skip this phase
          instance.skippedPhaseIds = [...instance.skippedPhaseIds, phaseId]
          this.emit({
            type: 'phase-skipped',
            workflowId: instance.id,
            phaseId,
            timestamp: Date.now(),
            data: { reason: `Condition not met: ${phase.condition}` }
          })
          
          return {
            phaseId,
            status: 'skipped',
            output: null,
            duration: Date.now() - startTime,
            attempts,
            timestamp: Date.now()
          }
        }

        // Store output
        instance.phaseOutputs.set(phase.outputKey, output)

        const duration = Date.now() - startTime
        this.emit({
          type: 'phase-completed',
          workflowId: instance.id,
          phaseId,
          timestamp: Date.now(),
          data: { duration, attempt: attempts }
        })

        return {
          phaseId,
          status: 'success',
          output,
          duration,
          attempts,
          timestamp: Date.now()
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        
        if (attempts <= phase.maxRetries) {
          const delay = getRetryDelay(attempts, phase.retry)
          if (delay > 0) {
            await this.sleep(delay)
          }
        }
      }
    }

    // Failed after all retries
    const duration = Date.now() - startTime
    instance.failedPhaseIds = [...instance.failedPhaseIds, phaseId]
    
    this.emit({
      type: 'phase-failed',
      workflowId: instance.id,
      phaseId,
      timestamp: Date.now(),
      data: { error: lastError, attempts }
    })

    return {
      phaseId,
      status: 'failed',
      output: null,
      duration,
      error: lastError,
      attempts,
      timestamp: Date.now()
    }
  }

  /**
   * Simulate phase execution (mock for testing/production without real agents)
   */
  private async simulatePhaseExecution(phase: PhaseNode, instance: WorkflowInstance): Promise<unknown> {
    // In production, this would call the actual agent
    // For now, simulate with a small delay
    await this.sleep(Math.min(phase.timeout / 10, 500))
    
    // Return mock output based on phase
    const mockOutputs: Record<string, unknown> = {
      concept: { title: 'Mock Story', genre: 'general', premise: 'A story about something' },
      outline: { beats: 12, chapters: 5, structure: 'three-act' },
      characters: [{ name: 'Character A', arc: 'transformation' }],
      world: { setting: 'Modern', rules: [] },
      draft: { content: 'Generated content...', quality: 0.75 },
      review: { issues: [], quality: 0.8 },
      polish: { content: 'Polished content...', changes: 15 },
      final: { approved: true, score: 0.9 }
    }
    
    return mockOutputs[phase.id] || { phaseId: phase.id, output: 'simulated' }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cancel workflow
   */
  cancelWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) return false
    if (instance.status === 'completed' || instance.status === 'failed' || instance.status === 'cancelled') return false

    instance.status = 'cancelled'
    instance.completedAt = Date.now()
    return true
  }

  /**
   * Pause workflow
   */
  pauseWorkflow(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance || instance.status !== 'running') return false

    instance.status = 'paused'
    return true
  }

  /**
   * Resume paused workflow
   */
  async resumeWorkflow(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance || instance.status !== 'paused') return

    instance.status = 'running'
    await this.startWorkflow(instanceId)
  }

  /**
   * Get workflow instance
   */
  getInstance(instanceId: string): WorkflowInstance | null {
    return this.instances.get(instanceId) || null
  }

  /**
   * Get all instances
   */
  getAllInstances(): WorkflowInstance[] {
    return Array.from(this.instances.values())
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: WorkflowEvent) => void): void {
    this.eventListeners.push(listener)
  }

  /**
   * Emit event
   */
  private emit(event: WorkflowEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }
}

// Export singleton
export const storyFlowOrchestrator = new StoryFlowOrchestrator()