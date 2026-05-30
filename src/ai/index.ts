export { selfEvolutionEngine, SelfEvolutionEngine } from './evolution/SelfEvolutionEngine'
export type { PromptVersion, EvolutionInsight } from './evolution/types'
export { multiAgentReview } from './review/MultiAgentReview'
export type { Chapter, ReviewResult, AggregatedReview } from './review/types'

// Self-Evolution Hook 系统注册（V47）
import { registerTelemetryHook, registerSkillCrystallizeHook, registerEvolutionTriggerHook } from './hooks'

registerTelemetryHook()
registerSkillCrystallizeHook()
registerEvolutionTriggerHook()