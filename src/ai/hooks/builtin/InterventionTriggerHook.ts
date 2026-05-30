/**
 * Intervention Trigger Hook - V53
 * Monitors quality and triggers writing pause when quality drops
 */

import { hookManager } from '../HookManager'
import type { HookContext } from '../types'

// Threshold configuration
const QUALITY_THRESHOLD = 0.4
const CONSECUTIVE_CHUNKS_REQUIRED = 3

// Internal state for tracking consecutive low quality chunks
let consecutiveLowQualityCount = 0

/**
 * Register the intervention trigger hook
 * Priority 90 - higher than EvolutionTriggerHook (80)
 */
export function registerInterventionTriggerHook(): void {
  hookManager.register('quality:update', handleQualityUpdate, 90)
}

/**
 * Handle quality:update events
 */
async function handleQualityUpdate(ctx: HookContext): Promise<void> {
  if (ctx.qualityScore < QUALITY_THRESHOLD) {
    consecutiveLowQualityCount++

    if (consecutiveLowQualityCount >= CONSECUTIVE_CHUNKS_REQUIRED) {
      // Trigger writing.pause event
      await triggerWritingPause(ctx)
      // Reset counter after triggering
      consecutiveLowQualityCount = 0
    }
  } else {
    // Reset counter on good quality
    consecutiveLowQualityCount = 0
  }
}

/**
 * Trigger writing pause with intervention context
 */
async function triggerWritingPause(ctx: HookContext): Promise<void> {
  console.warn(
    `[InterventionTriggerHook] Quality score ${ctx.qualityScore} below threshold ${QUALITY_THRESHOLD} ` +
    `for ${CONSECUTIVE_CHUNKS_REQUIRED} consecutive chunks. Triggering writing pause.`
  )

  await hookManager.trigger('writing.pause', {
    taskType: 'streaming',
    outcome: 'failure',
    qualityScore: ctx.qualityScore,
    error: `Quality threshold breach: ${ctx.qualityScore} < ${QUALITY_THRESHOLD}`,
    // Additional context for intervention UI
    consecutiveLowQualityCount,
    threshold: QUALITY_THRESHOLD
  } as HookContext)
}

/**
 * Get current intervention state
 */
export function getInterventionState(): {
  consecutiveLowQualityCount: number
  threshold: number
  isPaused: boolean
} {
  return {
    consecutiveLowQualityCount,
    threshold: QUALITY_THRESHOLD,
    isPaused: consecutiveLowQualityCount >= CONSECUTIVE_CHUNKS_REQUIRED
  }
}

/**
 * Reset intervention state
 */
export function resetInterventionState(): void {
  consecutiveLowQualityCount = 0
}