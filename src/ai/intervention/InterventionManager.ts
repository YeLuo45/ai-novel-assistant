/**
 * InterventionManager - V107
 * Wrapper for backward compatibility with existing orchestrator.ts
 * 
 * Exports the new InterventionDecider functionality under the old InterventionManager class name.
 */

import {
  createEmptyInterventionState,
  shouldTriggerIntervention,
  decideInterventionType,
  recordIntervention,
  getInterventionEffectiveness,
  getInterventionRecommendations,
  formatInterventionSummary,
  DEFAULT_INTERVENTION_CONFIG,
  type InterventionState,
  type InterventionDecision,
  type InterventionType,
  type InterventionUrgency,
  type InterventionTrigger,
  type InterventionHistory,
  type InterventionConfig,
} from './InterventionDecider'

// =============================================================================
// Legacy InterventionManager class wrapper
// =============================================================================

export interface PauseConditions {
  stagnationThreshold?: number
  energyLowThreshold?: number
  qualityDeclineThreshold?: number
  cooldownMs?: number
}

export class InterventionManager {
  private state: InterventionState
  private pauseConditions: PauseConditions
  private autoPauseEnabled: boolean
  private minEnergyThreshold: number

  constructor(
    pauseConditions: PauseConditions = {},
    autoPauseEnabled = false,
    minEnergyThreshold = 30
  ) {
    this.pauseConditions = pauseConditions
    this.autoPauseEnabled = autoPauseEnabled
    this.minEnergyThreshold = minEnergyThreshold
    this.state = createEmptyInterventionState({
      stagnationThreshold: pauseConditions.stagnationThreshold ?? 3,
      energyLowThreshold: pauseConditions.energyLowThreshold ?? 30,
      qualityDeclineThreshold: pauseConditions.qualityDeclineThreshold ?? 15,
      interventionCooldownMs: pauseConditions.cooldownMs ?? 5 * 60 * 1000,
    })
  }

  shouldPause(session: any): boolean {
    const result = shouldTriggerIntervention(session, this.state)
    return result.shouldIntervene
  }

  shouldAutoPause(): boolean {
    return this.autoPauseEnabled
  }

  getMinEnergyThreshold(): number {
    return this.minEnergyThreshold
  }

  decideIntervention(session: any): InterventionDecision {
    return decideInterventionType(session, this.state)
  }

  recordInterventionResult(
    sessionId: string,
    interventionType: InterventionType,
    qualityBefore: number,
    qualityAfter: number
  ): void {
    this.state = recordIntervention(this.state, sessionId, interventionType, qualityBefore, qualityAfter)
  }

  getState(): InterventionState {
    return this.state
  }
}

// Re-export all types and functions from InterventionDecider
export {
  createEmptyInterventionState,
  shouldTriggerIntervention,
  decideInterventionType,
  recordIntervention,
  getInterventionEffectiveness,
  getInterventionRecommendations,
  formatInterventionSummary,
  DEFAULT_INTERVENTION_CONFIG,
}

export type {
  InterventionState,
  InterventionDecision,
  InterventionType,
  InterventionUrgency,
  InterventionTrigger,
  InterventionHistory,
  InterventionConfig,
}
