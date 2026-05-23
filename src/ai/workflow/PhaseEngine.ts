/**
 * Phase Engine for AI Novel Assistant
 * V37: Zero-code Workflow Orchestration based on V36 MessageBus
 */

import { collaborationBus, CollaborationEvent } from '../messagebus'
import configData from '../../config/WritingChainConfig.json'

export type PhaseStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

export interface PhaseConfig {
  id: string
  name: string
  agent: string
  tools: string[]
  input: string[]
  output: string
  condition?: string
  timeout: number
  retry: number
}

export interface WritingChainConfig {
  version: string
  defaultChain: string
  chains: Record<string, PhaseConfig[]>
  globals: {
    model?: string
    temperature?: number
  }
}

export interface PhaseHistoryEntry {
  phaseId: string
  agent: string
  output: unknown
  duration: number
  status: PhaseStatus
}

export interface WorkflowContext {
  projectId: string
  userQuery: string
  genre?: string
  metadata: Record<string, unknown>
  currentPhase: string
  phaseHistory: PhaseHistoryEntry[]
  sharedData: Map<string, unknown>
}

export interface PhaseResult {
  chainId: string
  totalDuration: number
  phases: PhaseHistoryEntry[]
  finalOutput: unknown
  status: 'completed' | 'partial' | 'failed'
}

type WorkflowListener = (event: CollaborationEvent, data: unknown) => void

class PhaseEngine {
  private config: WritingChainConfig
  private messageBus = collaborationBus
  private listeners: WorkflowListener[] = []

  constructor() {
    this.config = configData as WritingChainConfig
  }

  async executeChain(chainId: string, initialContext: WorkflowContext): Promise<PhaseResult> {
    const chain = this.config.chains[chainId] || this.config.chains[this.config.defaultChain]
    if (!chain) {
      return { chainId, totalDuration: 0, phases: [], finalOutput: null, status: 'failed' }
    }

    const startTime = Date.now()
    const context: WorkflowContext = {
      ...initialContext,
      sharedData: new Map(initialContext.sharedData || []),
      phaseHistory: [],
      currentPhase: ''
    }

    this.emit('workflow:start', { chainId, phases: chain.length })

    let finalOutput: unknown = null

    for (const phase of chain) {
      if (phase.condition && !this.evaluateCondition(phase.condition, context)) {
        this.emit('workflow:skip', { phaseId: phase.id, reason: 'condition_not_met' })
        context.phaseHistory.push({
          phaseId: phase.id,
          agent: phase.agent,
          output: null,
          duration: 0,
          status: 'skipped'
        })
        continue
      }

      context.currentPhase = phase.id
      this.emit('workflow:phase:start', { phaseId: phase.id, agent: phase.agent })

      const phaseStart = Date.now()
      try {
        const phaseOutput = await this.executePhase(phase, context)
        finalOutput = phaseOutput
        context.sharedData.set(phase.output, phaseOutput)

        const duration = Date.now() - phaseStart
        context.phaseHistory.push({
          phaseId: phase.id,
          agent: phase.agent,
          output: phaseOutput,
          duration,
          status: 'success'
        })

        this.emit('workflow:phase:complete', {
          phaseId: phase.id,
          duration,
          output: phaseOutput
        })
      } catch (err) {
        const duration = Date.now() - phaseStart
        context.phaseHistory.push({
          phaseId: phase.id,
          agent: phase.agent,
          output: null,
          duration,
          status: 'failed'
        })

        this.emit('workflow:phase:failed', { phaseId: phase.id, error: String(err) })

        if (phase.retry > 0) {
          let retries = phase.retry
          while (retries > 0) {
            retries--
            try {
              const phaseOutput = await this.executePhase(phase, context)
              finalOutput = phaseOutput
              context.sharedData.set(phase.output, phaseOutput)
              const idx = context.phaseHistory.findIndex(h => h.phaseId === phase.id && h.status === 'failed')
              if (idx >= 0) {
                context.phaseHistory[idx] = { ...context.phaseHistory[idx], status: 'success', output: phaseOutput }
              }
              this.emit('workflow:phase:retry:success', { phaseId: phase.id })
              break
            } catch {
              this.emit('workflow:phase:retry:failed', { phaseId: phase.id, remaining: retries })
            }
          }
        }
      }
    }

    this.emit('workflow:complete', { chainId, totalDuration: Date.now() - startTime })

    return {
      chainId,
      totalDuration: Date.now() - startTime,
      phases: context.phaseHistory,
      finalOutput,
      status: 'completed'
    }
  }

  async executePhase(phase: PhaseConfig, context: WorkflowContext): Promise<unknown> {
    const inputs: Record<string, unknown> = {}
    for (const key of phase.input) {
      inputs[key] = context.sharedData.get(key) ?? context.metadata[key]
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Phase ${phase.id} timed out after ${phase.timeout}s`))
      }, phase.timeout * 1000)

      collaborationBus.emit('phase:execute', {
        phaseId: phase.id,
        agent: phase.agent,
        tools: phase.tools,
        inputs,
        context
      })

      const handler = (event: string, data: unknown) => {
        if (event === 'phase:result' && (data as any).phaseId === phase.id) {
          clearTimeout(timeout)
          collaborationBus.off(handler)
          resolve((data as any).output)
        }
        if (event === 'phase:error' && (data as any).phaseId === phase.id) {
          clearTimeout(timeout)
          collaborationBus.off(handler)
          reject(new Error((data as any).error))
        }
      }

      collaborationBus.on(handler)
    })
  }

  evaluateCondition(expr: string, ctx: WorkflowContext): boolean {
    try {
      const content = ctx.sharedData.get('chapterDraft') as string || ''
      const contentLength = content.length
      const genre = ctx.genre || ''
      const phaseCount = ctx.phaseHistory.length
      return !!eval(expr.replace(/contentLength/g, String(contentLength)).replace(/genre/g, `'${genre}'`).replace(/phaseCount/g, String(phaseCount)))
    } catch {
      return false
    }
  }

  onWorkflowEvent(listener: WorkflowListener): void {
    this.listeners.push(listener)
  }

  offWorkflowEvent(listener: WorkflowListener): void {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  private emit(event: CollaborationEvent, data: unknown): void {
    for (const l of this.listeners) l(event, data)
  }

  getChains(): string[] {
    return Object.keys(this.config.chains)
  }

  getChain(chainId: string): PhaseConfig[] {
    return this.config.chains[chainId] || []
  }

  getDefaultChain(): string {
    return this.config.defaultChain
  }
}

let engineInstance: PhaseEngine | null = null

export function createPhaseEngine(): PhaseEngine {
  if (!engineInstance) {
    engineInstance = new PhaseEngine()
  }
  return engineInstance
}

export { PhaseEngine }