/**
 * NarrativeHookEngine — V371
 * Hook effectiveness analysis, opening scene optimization, reader engagement gates.
 * Inspired by: chatdev (engagement analysis), thunderbolt (feedback loops), generic-agent (optimization)
 */

export interface HookAnalysis {
  hookType: HookType | null
  effectivenessScore: number  // 0-100
  strengths: string[]
  weaknesses: string[]
  improvementSuggestions: string[]
}

export type HookType = 'question' | 'statement' | 'dialogue' | 'action' | 'description' | 'mystery' | 'conflict' | 'character'

export interface HookPoint {
  chapterId: string
  position: number  // 0-100 (beginning, middle, end)
  hookType: HookType
  text: string
  initialEngagement: number  // 0-100
  retentionRate: number  // 0-100
  clickThroughRate: number  // 0-100
}

export interface NarrativeHookState {
  hooks: HookPoint[]
  analyses: Record<string, HookAnalysis>
  bestHooks: string[]  // chapterIds with best performance
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeHookState {
  return { hooks: [], analyses: {}, bestHooks: [], typeAlias: {} }
}

function classifyHook(text: string): HookType {
  const trimmed = text.trim()
  if (trimmed.endsWith('?')) return 'question'
  if (trimmed.startsWith('"') || trimmed.startsWith('"')) return 'dialogue'
  const actionVerbs = ['ran', 'fell', 'struck', 'shot', 'grabbed', 'cried', 'shouted']
  if (actionVerbs.some(v => trimmed.toLowerCase().startsWith(v))) return 'action'
  if (trimmed.startsWith('It was') || trimmed.startsWith('The')) return 'description'
  if (trimmed.includes('?')) return 'question'
  if (trimmed.length < 30 && trimmed.includes(',')) return 'statement'
  // Check for mystery indicators
  if (['unknown', 'secret', 'hidden', 'mystery', 'strange', 'unexplainable'].some(w => trimmed.toLowerCase().includes(w))) return 'mystery'
  if (['but', 'however', 'yet', 'although'].some(w => ` ${trimmed.toLowerCase()}.includes(' ${w}'`))) return 'conflict'
  return 'character'
}

export function registerHook(
  state: NarrativeHookState,
  chapterId: string,
  position: number,
  text: string,
  initialEngagement: number = 50,
  retentionRate: number = 50,
  clickThroughRate: number = 50
): NarrativeHookState {
  const hookType = classifyHook(text)
  const hook: HookPoint = { chapterId, position, hookType, text, initialEngagement, retentionRate, clickThroughRate }
  const hooks = [...state.hooks.filter(h => !(h.chapterId === chapterId && h.position === position)), hook]
  return { ...state, hooks }
}

export function analyzeHook(text: string): HookAnalysis {
  const hookType = classifyHook(text)
  const words = text.trim().split(/\s+/)
  const wordCount = words.length
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : wordCount
  const hasQuestion = text.includes('?')
  const hasExclamation = text.includes('!')
  const hasDialogue = text.startsWith('"') || text.startsWith('"')
  const startsWithNumber = /^\d/.test(text)
  const hasStrongVerb = /\b(rushed|crashed|exploded|discovered|revealed|betrayed|conquered)\b/i.test(text)
  const hasSensoryDetail = /\b(saw|felt|heard|smelled|tasted)\b/i.test(text)
  
  let effectivenessScore = 40
  const strengths: string[] = []
  const weaknesses: string[] = []
  
  if (wordCount >= 5 && wordCount <= 25) {
    effectivenessScore += 15
    strengths.push('Concise opening')
  } else if (wordCount > 50) {
    effectivenessScore -= 10
    weaknesses.push('Too wordy for hook')
  }
  
  if (hasQuestion) { effectivenessScore += 12; strengths.push('Creates curiosity') }
  if (hasExclamation) { effectivenessScore += 5; strengths.push('Creates urgency') }
  if (hasDialogue) { effectivenessScore += 8; strengths.push('Immediate voice') }
  if (startsWithNumber) { effectivenessScore += 10; strengths.push('Specific detail') }
  if (hasStrongVerb) { effectivenessScore += 10; strengths.push('Dynamic action') }
  if (hasSensoryDetail) { effectivenessScore += 8; strengths.push('Immersive') }
  
  if (avgWordsPerSentence > 20) { effectivenessScore -= 8; weaknesses.push('Run-on sentence') }
  if (wordCount < 5) { effectivenessScore -= 15; weaknesses.push('Too brief') }
  
  effectivenessScore = Math.min(100, Math.max(0, effectivenessScore))
  
  const improvementSuggestions: string[] = []
  if (weaknesses.includes('Too wordy for hook')) improvementSuggestions.push('Trim to 15-25 words for maximum impact')
  if (weaknesses.includes('Too brief')) improvementSuggestions.push('Add a specific detail or number')
  if (!hasQuestion) improvementSuggestions.push('Consider ending with a question to build curiosity')
  if (!hasStrongVerb && !hasSensoryDetail) improvementSuggestions.push('Add a vivid verb or sensory detail')
  if (hookType === 'description') improvementSuggestions.push('Start with dialogue or action instead of description')
  
  return { hookType, effectivenessScore, strengths, weaknesses, improvementSuggestions }
}

export function getHookPerformance(state: NarrativeHookState, chapterId: string): {
  avgEngagement: number
  avgRetention: number
  clickThroughRate: number
} {
  const chapterHooks = state.hooks.filter(h => h.chapterId === chapterId)
  if (chapterHooks.length === 0) return { avgEngagement: 0, avgRetention: 0, clickThroughRate: 0 }
  return {
    avgEngagement: chapterHooks.reduce((s, h) => s + h.initialEngagement, 0) / chapterHooks.length,
    avgRetention: chapterHooks.reduce((s, h) => s + h.retentionRate, 0) / chapterHooks.length,
    clickThroughRate: chapterHooks.reduce((s, h) => s + h.clickThroughRate, 0) / chapterHooks.length,
  }
}

export function compareHooks(state: NarrativeHookState, ch1: string, ch2: string) {
  const p1 = getHookPerformance(state, ch1)
  const p2 = getHookPerformance(state, ch2)
  return {
    moreEngaging: p1.avgEngagement > p2.avgEngagement ? ch1 : ch2,
    betterRetention: p1.avgRetention > p2.avgRetention ? ch1 : ch2,
    betterClickThrough: p1.clickThroughRate > p2.clickThroughRate ? ch1 : ch2,
  }
}

export function getTopHooks(state: NarrativeHookState, limit: number = 5): HookPoint[] {
  return [...state.hooks].sort((a, b) => b.initialEngagement - a.initialEngagement).slice(0, limit)
}
