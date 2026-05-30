/**
 * NarrativeWorldBuilder — V473
 * World-building depth analysis, setting consistency tracking, atmosphere and environment mapping.
 * Inspired by: ruflo (layered architecture), chatdev (synthesis), thunderbolt (feedback loops)
 */

export type SettingType = 'interior' | 'exterior' | 'fantasy' | 'historical' | 'scifi' | 'realistic'

export interface WorldLayer {
  id: string
  settingName: string
  settingType: SettingType
  chapterAppearances: number[]
  richnessScore: number  // 0-100
  consistencyScore: number  // 0-100
  atmosphericTone: number  // -100 to 100
}

export interface WorldBuildingReport {
  totalSettings: number
  avgRichness: number
  avgConsistency: number
  recommendations: string[]
}

export interface NarrativeWorldBuilderState {
  layers: WorldLayer[]
  report: WorldBuildingReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeWorldBuilderState {
  return { layers: [], report: null, typeAlias: {} }
}

export function establishSetting(
  state: NarrativeWorldBuilderState,
  settingName: string,
  settingType: SettingType,
  chapter: number,
  atmosphericTone: number
): NarrativeWorldBuilderState {
  const existing = state.layers.find(l => l.settingName === settingName)
  if (existing) {
    const layers = state.layers.map(l => {
      if (l.settingName !== settingName) return l
      const appearances = [...l.chapterAppearances, chapter].sort((a, b) => a - b)
      const richnessScore = Math.min(100, 40 + appearances.length * 12)
      return { ...l, chapterAppearances: appearances, richnessScore }
    })
    return { ...state, layers }
  }
  const id = `world_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const layer: WorldLayer = { id, settingName, settingType, chapterAppearances: [chapter], richnessScore: 40, consistencyScore: 80, atmosphericTone: Math.max(-100, Math.min(100, atmosphericTone)) }
  return { ...state, layers: [...state.layers, layer] }
}

export function trackConsistency(state: NarrativeWorldBuilderState, settingName: string, score: number): NarrativeWorldBuilderState {
  const layers = state.layers.map(l => l.settingName === settingName ? { ...l, consistencyScore: Math.max(0, Math.min(100, score)) } : l)
  return { ...state, layers }
}

export function generateWorldBuildingReport(state: NarrativeWorldBuilderState): WorldBuildingReport {
  if (state.layers.length === 0) {
    return { totalSettings: 0, avgRichness: 0, avgConsistency: 100, recommendations: [] }
  }
  const totalSettings = state.layers.length
  const avgRichness = Math.round(state.layers.reduce((s, l) => s + l.richnessScore, 0) / totalSettings)
  const avgConsistency = Math.round(state.layers.reduce((s, l) => s + l.consistencyScore, 0) / totalSettings)
  const recommendations: string[] = []
  if (avgRichness < 40) recommendations.push('Low world-building richness - add more setting details')
  if (avgConsistency < 60) recommendations.push('Setting inconsistencies detected - review world rules')
  if (state.layers.some(l => l.chapterAppearances.length === 1)) recommendations.push('Some settings appear only once - develop recurring locations')
  if (avgRichness > 80) recommendations.push('Excellent world-building depth - well-developed settings')
  return { totalSettings, avgRichness, avgConsistency, recommendations }
}

export function getSettingByName(state: NarrativeWorldBuilderState, settingName: string): WorldLayer | null {
  return state.layers.find(l => l.settingName === settingName) || null
}
