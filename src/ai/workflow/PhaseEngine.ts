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

// V44: Workflow Graph types and execution
export interface WorkflowGraphNode {
  id: string;
  type: 'phase' | 'condition' | 'loop' | 'human';
  subtype?: string;
  config: {
    promptTemplate?: string;
    retryStrategy?: string;
    condition?: string;
    maxIterations?: number;
    exitCondition?: string;
    reviewNote?: string;
    [key: string]: unknown;
  };
}

export interface WorkflowGraphEdge {
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
}

export interface WorkflowGraphResult {
  completedPhases: string[];
  results: Map<string, unknown>;
  status: 'completed' | 'partial' | 'failed';
  errors: Array<{ nodeId: string; error: string }>;
}

/**
 * Execute a workflow graph
 * Supports phase nodes, condition nodes, loop nodes, and human intervention nodes
 */
export async function executeWorkflowGraph(
  graph: WorkflowGraph,
  initialData: Record<string, unknown>
): Promise<WorkflowGraphResult> {
  const completedPhases: string[] = [];
  const results = new Map<string, unknown>();
  const errors: Array<{ nodeId: string; error: string }> = [];
  
  // Find start nodes (nodes with no incoming edges)
  const targetNodes = new Set(graph.edges.map(e => e.target));
  const startNodeIds = graph.nodes
    .filter(n => !targetNodes.has(n.id))
    .map(n => n.id);
  
  // If no start nodes found, use first node
  if (startNodeIds.length === 0 && graph.nodes.length > 0) {
    startNodeIds.push(graph.nodes[0].id);
  }
  
  // Build adjacency map
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of graph.edges) {
    const existing = adjacency.get(edge.source) || [];
    existing.push(edge.target);
    adjacency.set(edge.source, existing);
  }
  
  // Execute nodes using BFS
  const pendingQueue = [...startNodeIds];
  const visited = new Set<string>();
  const loopCounters = new Map<string, number>();
  
  while (pendingQueue.length > 0) {
    const nodeId = pendingQueue.shift()!;
    
    if (visited.has(nodeId)) continue;
    
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) continue;
    
    // Handle different node types
    if (node.type === 'condition') {
      const condition = node.config.condition as string || 'true';
      const canEvaluate = evaluateGraphCondition(condition, results, initialData);
      if (!canEvaluate) {
        visited.add(nodeId);
        continue;
      }
    }
    
    if (node.type === 'loop') {
      const maxIterations = (node.config.maxIterations as number) || 5;
      const currentCount = loopCounters.get(nodeId) || 0;
      if (currentCount >= maxIterations) {
        visited.add(nodeId);
        continue;
      }
      loopCounters.set(nodeId, currentCount + 1);
      // Re-add to queue for next iteration
      pendingQueue.unshift(nodeId);
    }
    
    if (node.type === 'human') {
      // Human intervention - in a real implementation, this would pause and wait for human input
      // For now, we just mark it as completed with a placeholder
      results.set(nodeId, { status: 'pending_human_review', note: node.config.reviewNote });
      completedPhases.push(nodeId);
    }
    
    if (node.type === 'phase') {
      try {
        // Simulate phase execution - in real impl, would call actual phase logic
        const phaseOutput = await simulatePhaseExecution(node, results, initialData);
        results.set(nodeId, phaseOutput);
        completedPhases.push(nodeId);
      } catch (err) {
        errors.push({ nodeId, error: String(err) });
      }
    }
    
    visited.add(nodeId);
    
    // Add next nodes to queue
    const outgoingEdges = graph.edges.filter(e => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (!pendingQueue.includes(edge.target)) {
        pendingQueue.push(edge.target);
      }
    }
  }
  
  return {
    completedPhases,
    results,
    status: errors.length === 0 ? 'completed' : errors.length < graph.nodes.length ? 'partial' : 'failed',
    errors,
  };
}

function evaluateGraphCondition(
  condition: string,
  results: Map<string, unknown>,
  initialData: Record<string, unknown>
): boolean {
  try {
    // Simple condition evaluation
    // In real implementation, this would be more sophisticated
    const context: Record<string, unknown> = { ...initialData };
    for (const [key, value] of results.entries()) {
      context[`node_${key}`] = value;
    }
    
    // Basic eval with safe variable names
    const safeCondition = condition
      .replace(/[^a-zA-Z0-9_<>!=.&&||() ]/g, '')
      .replace(/&&/g, '&&')
      .replace(/\|\|/g, '||');
    
    // Simple approach - check if condition contains truthy values
    return eval(safeCondition);
  } catch {
    return false;
  }
}

async function simulatePhaseExecution(
  node: WorkflowGraphNode,
  results: Map<string, unknown>,
  initialData: Record<string, unknown>
): Promise<unknown> {
  // This is a placeholder - in real implementation, would execute actual phase
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    nodeId: node.id,
    subtype: node.subtype,
    config: node.config,
    status: 'success',
    timestamp: Date.now(),
  };
}

let engineInstance: PhaseEngine | null = null

export function createPhaseEngine(): PhaseEngine {
  if (!engineInstance) {
    engineInstance = new PhaseEngine()
  }
  return engineInstance
}

export { PhaseEngine }