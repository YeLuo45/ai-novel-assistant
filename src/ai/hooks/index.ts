/**
 * Hook 系统导出
 */

export { HookManager, hookManager } from './HookManager'
export type {
  HookType,
  HookContext,
  HookHandler,
  HookRegistration,
} from './types'
export { registerEvolutionTriggerHook } from './builtin/EvolutionTriggerHook'
export { registerSkillCrystallizeHook } from './builtin/SkillCrystallizeHook'
export { registerTelemetryHook } from './builtin/TelemetryHook'