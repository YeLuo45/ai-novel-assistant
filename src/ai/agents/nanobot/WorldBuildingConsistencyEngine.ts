/**
 * WorldBuildingConsistencyEngine — V385
 * World rules consistency, timeline integrity, lore coherence tracking.
 * Inspired by: ruflo (hierarchical decomposition), generic-agent (validation), thunderbolt (feedback loops)
 */

export interface WorldRule {
  id: string
  name: string
  description: string
  category: RuleCategory
  affectedElements: string[]
  flexibility: 'strict' | 'flexible' | 'breakable'
  violationCount: number
}

export type RuleCategory = 'magic' | 'technology' | 'social' | 'physical' | 'geography' | 'history' | 'culture' | 'economy'

export interface LoreEntry {
  id: string
  name: string
  content: string
  chapterId?: string
  relatedRules: string[]
  consistencyStatus: 'verified' | 'pending' | 'violated' | 'unknown'
}

export interface TimelineEntry {
  id: string
  year: number
  era: string
  event: string
  chapterId?: string
  verified: boolean
}

export interface WorldConsistencyReport {
  totalRules: number
  violatedRules: number
  pendingLore: number
  timelineGaps: number
  overallCoherence: number  // 0-100
  criticalIssues: string[]
  recommendations: string[]
}

export interface WorldBuildingState {
  rules: Record<string, WorldRule>
  lore: Record<string, LoreEntry>
  timeline: TimelineEntry[]
  consistencyReport: WorldConsistencyReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): WorldBuildingState {
  return { rules: {}, lore: {}, timeline: [], consistencyReport: null, typeAlias: {} }
}

export function addRule(
  state: WorldBuildingState,
  name: string,
  description: string,
  category: RuleCategory,
  affectedElements: string[],
  flexibility: WorldRule['flexibility'] = 'strict'
): WorldBuildingState {
  const id = `rule_${name.toLowerCase().replace(/\s+/g, '_')}`
  const rule: WorldRule = { id, name, description, category, affectedElements, flexibility, violationCount: 0 }
  return { ...state, rules: { ...state.rules, [id]: rule } }
}

export function addLore(
  state: WorldBuildingState,
  name: string,
  content: string,
  chapterId?: string,
  relatedRules?: string[]
): WorldBuildingState {
  const id = `lore_${name.toLowerCase().replace(/\s+/g, '_')}`
  const lore: LoreEntry = { id, name, content, chapterId, relatedRules: relatedRules || [], consistencyStatus: 'pending' }
  return { ...state, lore: { ...state.lore, [id]: lore } }
}

export function addTimelineEvent(
  state: WorldBuildingState,
  year: number,
  era: string,
  event: string,
  chapterId?: string
): WorldBuildingState {
  const id = `tl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const entry: TimelineEntry = { id, year, era, event, chapterId, verified: false }
  const timeline = [...state.timeline, entry].sort((a, b) => a.year - b.year)
  return { ...state, timeline }
}

export function verifyLoreConsistency(state: WorldBuildingState, loreId: string): WorldBuildingState {
  const lore = state.lore[loreId]
  if (!lore) return state
  
  let consistencyStatus: LoreEntry['consistencyStatus'] = 'verified'
  const relatedRules = lore.relatedRules.filter(rid => state.rules[rid])
  
  // Check if any related rules are violated
  for (const ruleId of relatedRules) {
    if (state.rules[ruleId].violationCount > 0) {
      consistencyStatus = 'violated'
      break
    }
  }
  
  return {
    ...state,
    lore: { ...state.lore, [loreId]: { ...lore, consistencyStatus } },
  }
}

export function checkRuleViolation(
  state: WorldBuildingState,
  ruleId: string,
  context: string
): WorldBuildingState {
  if (!state.rules[ruleId]) return state
  const rule = state.rules[ruleId]
  if (rule.flexibility === 'breakable') return state
  
  const updatedRule = { ...rule, violationCount: rule.violationCount + 1 }
  return { ...state, rules: { ...state.rules, [ruleId]: updatedRule } }
}

export function generateConsistencyReport(state: WorldBuildingState): WorldConsistencyReport {
  const rules = Object.values(state.rules)
  const lore = Object.values(state.lore)
  const timeline = state.timeline
  
  const violatedRules = rules.filter(r => r.violationCount > 0).length
  const pendingLore = lore.filter(l => l.consistencyStatus === 'pending' || l.consistencyStatus === 'unknown').length
  
  // Find timeline gaps (years with no events)
  const years = timeline.map(t => t.year).sort((a, b) => a - b)
  let timelineGaps = 0
  for (let i = 1; i < years.length; i++) {
    if (years[i] - years[i - 1] > 10) timelineGaps++
  }
  
  const criticalIssues: string[] = []
  if (violatedRules > 0) criticalIssues.push(`${violatedRules} world rules violated`)
  if (pendingLore > lore.length * 0.5) criticalIssues.push('Too many unverified lore entries')
  if (timelineGaps > years.length * 0.3) criticalIssues.push('Frequent timeline gaps may affect coherence')
  
  const overallCoherence = Math.max(0, 100 - (violatedRules * 15 + pendingLore * 3 + timelineGaps * 5))
  
  const recommendations: string[] = []
  if (violatedRules > 0) recommendations.push('Address world rule violations before continuing')
  if (pendingLore > 0) recommendations.push(`Verify ${pendingLore} pending lore entries`)
  if (overallCoherence > 80) recommendations.push('World consistency is strong')
  if (rules.length < 5) recommendations.push('Add more world rules to define your world')
  
  const report: WorldConsistencyReport = { totalRules: rules.length, violatedRules, pendingLore, timelineGaps, overallCoherence, criticalIssues, recommendations }
  
  return { ...state, consistencyReport: report }
}

export function getRuleSummary(state: WorldBuildingState, ruleId: string): WorldRule | null {
  return state.rules[ruleId] || null
}

export function compareEraConsistency(state: WorldBuildingState, era1: string, era2: string): {
  moreCoherent: string
  ruleCountDiff: number
  violationDiff: number
} {
  const rules1 = Object.values(state.rules).filter(r => r.affectedElements.some(e => e.includes(era1)))
  const rules2 = Object.values(state.rules).filter(r => r.affectedElements.some(e => e.includes(era2)))
  const violations1 = rules1.reduce((s, r) => s + r.violationCount, 0)
  const violations2 = rules2.reduce((s, r) => s + r.violationCount, 0)
  
  return {
    moreCoherent: violations1 < violations2 ? era1 : era2,
    ruleCountDiff: Math.abs(rules1.length - rules2.length),
    violationDiff: Math.abs(violations1 - violations2),
  }
}
