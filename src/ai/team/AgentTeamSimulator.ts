/**
 * AgentTeamSimulator Types - V79
 * Multi-Agent Team Simulation Environment
 * 
 * Simulates a team of specialized agents (writer, editor, worldbuilder, etc.)
 * to test collaboration patterns, conflict resolution, and emergent behaviors
 * before deploying in production
 */

import type { SkillLevel } from '../evolution/SelfEvolutionTypes'

// ===============================================================================
// Agent Types
// ===============================================================================

export type AgentSpecialization = 
  | 'writer' 
  | 'editor' 
  | 'worldbuilder' 
  | 'character_designer' 
  | 'plot_architect' 
  | 'researcher'
  | 'critic'

export interface SimulatedAgentProfile {
  id: string
  name: string
  specialization: AgentSpecialization
  personality: {
    creativity: number      // 0-1, tendency to take creative risks
    thoroughness: number    // 0-1, attention to detail
    assertiveness: number   // 0-1, how much they push their ideas
    flexibility: number     // 0-1, willingness to adapt
  }
  skillLevel: SkillLevel
  experiencePoints: number
  currentTask?: string
  energy: number  // 0-100, depletes over interaction
}

export interface AgentDecision {
  agentId: string
  decision: string
  reasoning: string
  confidence: number  // 0-1
  timestamp: number
}

export interface AgentMessage {
  id: string
  senderId: string
  recipientId: string | 'broadcast'
  content: string
  type: 'task_request' | 'task_response' | 'feedback' | 'conflict' | 'approval' | 'question'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  timestamp: number
  inResponseTo?: string
}

export interface TaskAssignment {
  id: string
  taskDescription: string
  assignedAgentId: string
  createdBy: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated'
  priority: 'low' | 'normal' | 'high' | 'critical'
  deadline?: number
  completedAt?: number
  qualityScore?: number
  notes?: string
}

// ===============================================================================
// Simulation Types
// ===============================================================================

export interface TeamSimulationConfig {
  teamSize: number
  specializationDistribution: Partial<Record<AgentSpecialization, number>>
  personalitySeed: number
  taskComplexity: number  // 0-1
  conflictProbability: number  // 0-1
  timePressure: number  // 0-1, how tight deadlines are
  maxIterations: number
}

export interface SimulationStep {
  iteration: number
  agents: SimulatedAgentProfile[]
  messages: AgentMessage[]
  decisions: AgentDecision[]
  events: SimulationEvent[]
  teamEnergy: number  // Average energy across team
  productivityScore: number  // 0-1
  conflictLevel: number  // 0-1
}

export interface SimulationEvent {
  type: 'task_assigned' | 'task_completed' | 'conflict_detected' | 'conflict_resolved' | 'skill_transfer' | 'creative_breakthrough' | 'energy_depletion' | 'consensus_reached'
  timestamp: number
  involvedAgentIds: string[]
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface ConflictReport {
  id: string
  conflictingAgentIds: string[]
  topic: string
  initialPositions: string[]
  resolution?: string
  resolvedAt?: number
  resolutionQuality: number  // 0-1
  escalation: boolean
}

export interface SimulationOutcome {
  totalIterations: number
  tasksCompleted: number
  tasksFailed: number
  conflictsDetected: number
  conflictsResolved: number
  averageQualityScore: number
  teamSatisfactionScore: number
  emergentBehaviors: string[]
  skillTransfers: { from: string; to: string; skill: string }[]
  finalTeamEnergy: number
  productivityPerIteration: number
}

// ===============================================================================
// Emergent Behavior Types
// ===============================================================================

export type EmergentBehaviorType = 
  | 'role_rotation'           // Agents naturally rotate tasks
  | 'skill_mentorship'       // Experienced agents help newer ones
  | 'creative_collaboration' // Multiple agents combine ideas
  | 'conflict_avoidance'     // Team avoids controversial topics
  | 'quality_focus'          // Team prioritizes quality over speed
  | 'resource_sharing'       // Agents share knowledge/resources

export interface EmergentBehavior {
  type: EmergentBehaviorType
  firstObservedAt: number
  frequency: number
  participatingAgents: string[]
  impact: 'positive' | 'negative' | 'neutral'
  description: string
}

// ===============================================================================
// Simulation Functions
// ===============================================================================

/**
 * Create a simulated agent profile
 */
export function createAgentProfile(
  id: string,
  name: string,
  specialization: AgentSpecialization,
  personalitySeed?: number
): SimulatedAgentProfile {
  const seed = personalitySeed ?? Math.random()
  
  return {
    id,
    name,
    specialization,
    personality: {
      creativity: 0.3 + (seed * 0.5),
      thoroughness: 0.5 + ((1 - seed) * 0.4),
      assertiveness: 0.3 + ((seed * seed) * 0.6),
      flexibility: 0.4 + (Math.sin(seed * 10) * 0.3 + 0.5) * 0.3
    },
    skillLevel: seed > 0.8 ? 'stable' : seed > 0.5 ? 'developing' : 'nascent',
    experiencePoints: Math.floor(seed * 1000),
    energy: 80 + Math.floor(Math.random() * 20)
  }
}

/**
 * Simulate agent decision-making based on personality and context
 */
export function simulateAgentDecision(
  agent: SimulatedAgentProfile,
  context: string,
  options: string[]
): AgentDecision {
  // Pick based on personality weights
  const choiceIndex = Math.floor(
    agent.personality.creativity * options.length * Math.random()
  )
  const decision = options[Math.min(choiceIndex, options.length - 1)]

  return {
    agentId: agent.id,
    decision,
    reasoning: `Based on ${agent.specialization} perspective with ${(agent.personality.creativity * 100).toFixed(0)}% creativity`,
    confidence: 0.5 + agent.personality.assertiveness * 0.4,
    timestamp: Date.now()
  }
}

/**
 * Detect conflict between two agent decisions
 */
export function detectDecisionConflict(
  decisionA: AgentDecision,
  decisionB: AgentDecision,
  topic: string
): boolean {
  if (decisionA.decision === decisionB.decision) return false
  
  // Check if both are confident (conflicts only matter when both are sure)
  const bothConfident = decisionA.confidence > 0.6 && decisionB.confidence > 0.6
  return bothConfident && Math.abs(decisionA.confidence - decisionB.confidence) < 0.2
}

/**
 * Simulate a team consensus process
 */
export function simulateConsensus(
  agents: SimulatedAgentProfile[],
  topic: string,
  options: string[]
): { consensusReached: boolean; agreedOption: string | null; dissenters: string[] } {
  const decisions = agents.map(agent => simulateAgentDecision(agent, topic, options))
  const voteCounts = new Map<string, number>()

  for (const decision of decisions) {
    voteCounts.set(decision.decision, (voteCounts.get(decision.decision) || 0) + 1)
  }

  let maxVotes = 0
  let winningOption = options[0]
  for (const [option, votes] of Array.from(voteCounts.entries())) {
    if (votes > maxVotes) {
      maxVotes = votes
      winningOption = option
    }
  }

  const consensusReached = maxVotes > agents.length * 0.6
  const dissenters = decisions
    .filter(d => d.decision !== winningOption)
    .map(d => d.agentId)

  return {
    consensusReached,
    agreedOption: consensusReached ? winningOption : null,
    dissenters
  }
}

/**
 * Calculate team productivity score
 */
export function calculateProductivity(
  completedTasks: number,
  failedTasks: number,
  totalIterations: number,
  teamEnergy: number
): number {
  if (totalIterations === 0) return 0
  
  const taskSuccessRate = completedTasks / (completedTasks + failedTasks || 1)
  const avgProductivity = completedTasks / totalIterations
  const energyFactor = teamEnergy / 100
  
  return Math.min(1, taskSuccessRate * 0.4 + avgProductivity * 0.3 + energyFactor * 0.3)
}

/**
 * Detect emergent behaviors from simulation history
 */
export function detectEmergentBehaviors(
  simulationSteps: SimulationStep[]
): EmergentBehavior[] {
  const behaviors: EmergentBehavior[] = []
  const eventCounts = new Map<string, { count: number; iterations: number[] }>()

  for (const step of simulationSteps) {
    for (const event of step.events) {
      const key = `${event.type}_${event.involvedAgentIds.sort().join(',')}`
      const existing = eventCounts.get(key)
      if (existing) {
        existing.count++
        existing.iterations.push(step.iteration)
      } else {
        eventCounts.set(key, { count: 1, iterations: [step.iteration] })
      }
    }
  }

  for (const [, data] of Array.from(eventCounts.entries())) {
    if (data.count >= 3) {
      behaviors.push({
        type: 'creative_collaboration',
        firstObservedAt: simulationSteps[0].iteration,
        frequency: data.count,
        participatingAgents: [],
        impact: 'positive',
        description: `Observed ${data.count} collaborative events over ${data.iterations.length} iterations`
      })
    }
  }

  return behaviors
}

/**
 * Generate simulation outcome report
 */
export function generateOutcomeReport(
  simulationSteps: SimulationStep[],
  config: TeamSimulationConfig
): SimulationOutcome {
  const firstStep = simulationSteps[0]
  const lastStep = simulationSteps[simulationSteps.length - 1]
  
  const completedTasks = lastStep.events.filter(e => e.type === 'task_completed').length
  const failedTasks = lastStep.events.filter(e => e.type === 'task_assigned').length - completedTasks
  const conflictsDetected = lastStep.events.filter(e => e.type === 'conflict_detected').length
  const conflictsResolved = lastStep.events.filter(e => e.type === 'conflict_resolved').length
  
  const emergentBehaviors = detectEmergentBehaviors(simulationSteps)

  return {
    totalIterations: config.maxIterations,
    tasksCompleted: completedTasks,
    tasksFailed: Math.max(0, failedTasks),
    conflictsDetected,
    conflictsResolved,
    averageQualityScore: 0.7 + Math.random() * 0.25,
    teamSatisfactionScore: 0.6 + Math.random() * 0.3,
    emergentBehaviors: emergentBehaviors.map(b => b.type),
    skillTransfers: [],
    finalTeamEnergy: lastStep.teamEnergy,
    productivityPerIteration: calculateProductivity(
      completedTasks,
      Math.max(0, failedTasks),
      config.maxIterations,
      lastStep.teamEnergy
    )
  }
}

/**
 * Format simulation step for debugging/logging
 */
export function formatSimulationStep(step: SimulationStep): string {
  const taskEvents = step.events.filter(e => e.type.startsWith('task_'))
  const conflictEvents = step.events.filter(e => e.type.startsWith('conflict_'))
  
  let lines = [`=== Iteration ${step.iteration} ===`]
  lines.push(`Team Energy: ${step.teamEnergy.toFixed(0)}%`)
  lines.push(`Productivity: ${(step.productivityScore * 100).toFixed(0)}%`)
  lines.push(`Conflicts: ${step.conflictLevel.toFixed(2)}`)
  
  if (taskEvents.length > 0) {
    lines.push('Tasks: ' + taskEvents.map(e => e.type.replace('task_', '')).join(', '))
  }
  if (conflictEvents.length > 0) {
    lines.push('Conflicts: ' + conflictEvents.map(e => e.type.replace('conflict_', '')).join(', '))
  }
  
  return lines.join('\n')
}

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: TeamSimulationConfig = {
  teamSize: 4,
  specializationDistribution: {
    writer: 2,
    editor: 1,
    worldbuilder: 1
  },
  personalitySeed: Date.now(),
  taskComplexity: 0.5,
  conflictProbability: 0.3,
  timePressure: 0.4,
  maxIterations: 20
}