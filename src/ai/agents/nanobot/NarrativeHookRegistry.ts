/**
 * NarrativeHookRegistry — V397
 * Narrative hook types, effectiveness tracking, reader retention analysis across chapters.
 * Inspired by: thunderbolt (feedback loops), generic-agent (optimization), chatdev (engagement)
 */

export type HookType = 'question' | 'mystery' | 'conflict' | 'revelation' | 'danger' | 'promise' | 'emotional' | 'intrigue' | 'action' | 'character_intro'

export interface Hook {
  id: string
  type: HookType
  chapterId: string
  position: number  // 0-100 within chapter
  text: string
  effectiveness: number  // 0-100 (based on reader retention)
  clicksGenerated: number  // how many readers continued
  dropOffPoint: number | null  // position where readers dropped
}

export interface HookEffectivenessReport {
  totalHooks: number
  avgEffectiveness: number
  bestHookType: HookType | null
  worstHookType: HookType | null
  retentionRate: number  // overall reader retention
  recommendations: string[]
}

export interface NarrativeHookState {
  hooks: Hook[]
  effectivenessReport: HookEffectivenessReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeHookState {
  return { hooks: [], effectivenessReport: null, typeAlias: {} }
}

export function registerHook(
  state: NarrativeHookState,
  type: HookType,
  chapterId: string,
  position: number,
  text: string
): NarrativeHookState {
  const id = `hook_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const hook: Hook = { id, type, chapterId, position, text, effectiveness: 50, clicksGenerated: 0, dropOffPoint: null }
  return { ...state, hooks: [...state.hooks, hook] }
}

export function updateHookEffectiveness(
  state: NarrativeHookState,
  hookId: string,
  clicksGenerated: number,
  totalReaders: number,
  dropOffPoint: number | null
): NarrativeHookState {
  const hook = state.hooks.find(h => h.id === hookId)
  if (!hook) return state
  
  const retentionRate = totalReaders > 0 ? (clicksGenerated / totalReaders) * 100 : 0
  const baseEffectiveness = hook.effectiveness
  const newEffectiveness = Math.round((baseEffectiveness * 0.6 + retentionRate * 0.4) * 100) / 100
  
  const updatedHook: Hook = { ...hook, effectiveness: newEffectiveness, clicksGenerated, dropOffPoint }
  const hooks = state.hooks.map(h => h.id === hookId ? updatedHook : h)
  
  return { ...state, hooks }
}

export function generateEffectivenessReport(state: NarrativeHookState): HookEffectivenessReport {
  if (state.hooks.length === 0) {
    return { totalHooks: 0, avgEffectiveness: 0, bestHookType: null, worstHookType: null, retentionRate: 0, recommendations: [] }
  }
  
  const totalHooks = state.hooks.length
  const avgEffectiveness = Math.round(state.hooks.reduce((s, h) => s + h.effectiveness, 0) / totalHooks)
  
  const typeScores: Record<HookType, { total: number; count: number }> = {
    question: { total: 0, count: 0 }, mystery: { total: 0, count: 0 }, conflict: { total: 0, count: 0 },
    revelation: { total: 0, count: 0 }, danger: { total: 0, count: 0 }, promise: { total: 0, count: 0 },
    emotional: { total: 0, count: 0 }, intrigue: { total: 0, count: 0 }, action: { total: 0, count: 0 },
    character_intro: { total: 0, count: 0 },
  }
  
  for (const hook of state.hooks) {
    typeScores[hook.type].total += hook.effectiveness
    typeScores[hook.type].count++
  }
  
  let bestHookType: HookType | null = null
  let worstHookType: HookType | null = null
  let bestScore = 0
  let worstScore = 100
  
  for (const [type, data] of Object.entries(typeScores)) {
    if (data.count > 0) {
      const avg = data.total / data.count
      if (avg > bestScore) { bestScore = avg; bestHookType = type as HookType }
      if (avg < worstScore) { worstScore = avg; worstHookType = type as HookType }
    }
  }
  
  const totalClicks = state.hooks.reduce((s, h) => s + h.clicksGenerated, 0)
  const retentionRate = totalClicks > 0 ? Math.min(95, Math.round((1 - totalClicks / (totalClicks + 1)) * 100)) : 50
  
  const recommendations: string[] = []
  if (avgEffectiveness < 50) recommendations.push('Hook effectiveness is low - rewrite opening hooks')
  if (worstHookType) recommendations.push(`${worstHookType} hooks underperform - try question or mystery hooks instead`)
  if (state.hooks.filter(h => h.effectiveness < 40).length > totalHooks * 0.3) {
    recommendations.push('Many weak hooks detected - revise the 3 worst performers')
  }
  if (avgEffectiveness > 75) recommendations.push('Strong hook performance - apply winning formula to all openings')
  if (totalHooks < 5) recommendations.push('Add more hooks throughout the narrative for reader engagement')
  
  return { totalHooks, avgEffectiveness, bestHookType, worstHookType, retentionRate, recommendations }
}

export function getHookStats(state: NarrativeHookState, chapterId: string): {
  hookCount: number
  avgEffectiveness: number
  bestHook: Hook | null
} {
  const chapterHooks = state.hooks.filter(h => h.chapterId === chapterId)
  if (chapterHooks.length === 0) return { hookCount: 0, avgEffectiveness: 0, bestHook: null }
  
  const avgEffectiveness = Math.round(chapterHooks.reduce((s, h) => s + h.effectiveness, 0) / chapterHooks.length)
  const bestHook = chapterHooks.sort((a, b) => b.effectiveness - a.effectiveness)[0]
  
  return { hookCount: chapterHooks.length, avgEffectiveness, bestHook }
}

export function compareChapterHooks(state: NarrativeHookState, ch1: string, ch2: string): {
  moreEngaging: string
  effectivenessDiff: number
} {
  const s1 = getHookStats(state, ch1)
  const s2 = getHookStats(state, ch2)
  const moreEngaging = s1.avgEffectiveness > s2.avgEffectiveness ? ch1 : ch2
  return { moreEngaging, effectivenessDiff: Math.abs(s1.avgEffectiveness - s2.avgEffectiveness) }
}
