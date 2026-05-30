/**
 * NarrativeOpeningEngine — V445
 * Opening hook analysis, first chapter architecture, inciting incident tracking.
 * Inspired by: thunderbolt (feedback loops), chatdev (engagement), generic-agent (optimization)
 */

export type HookType = 'question' | 'statement' | 'action' | 'dialogue' | 'scene' | 'image' | 'mood'

export interface OpeningBeat {
  id: string
  beatType: 'hook' | 'setup' | 'inciting_incident' | 'world_intro' | 'character_intro'
  content: string
  effectiveness: number  // 0-100
  chapterNumber: number
  position: number  // 0-100
}

export interface OpeningArchitecture {
  hookType: HookType | null
  hookEffectiveness: number
  incitingIncidentPosition: number | null  // 0-100
  worldBuildingDensity: number  // 0-100
  pacingScore: number  // 0-100
}

export interface OpeningReport {
  architecture: OpeningArchitecture | null
  totalBeats: number
  predictedEngagement: number  // 0-100
  recommendations: string[]
}

export interface NarrativeOpeningState {
  beats: OpeningBeat[]
  architecture: OpeningArchitecture | null
  report: OpeningReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeOpeningState {
  return { beats: [], architecture: null, report: null, typeAlias: {} }
}

export function addOpeningBeat(
  state: NarrativeOpeningState,
  beatType: OpeningBeat['beatType'],
  content: string,
  effectiveness: number,
  chapterNumber: number,
  position: number
): NarrativeOpeningState {
  const id = `open_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const beat: OpeningBeat = { id, beatType, content, effectiveness: Math.max(0, Math.min(100, effectiveness)), chapterNumber, position }
  const beats = [...state.beats, beat].sort((a, b) => a.chapterNumber !== b.chapterNumber ? a.chapterNumber - b.chapterNumber : a.position - b.position)
  return { ...state, beats }
}

export function detectHookType(state: NarrativeOpeningState): HookType | null {
  const firstHook = state.beats.find(b => b.beatType === 'hook')
  if (!firstHook) return null
  
  const content = firstHook.content.toLowerCase()
  if (content.includes('?')) return 'question'
  if (content.startsWith('"') || content.startsWith("'")) return 'dialogue'
  if (/^[^a-z]/.test(firstHook.content)) return 'action'  // starts with non-letter
  if (content.includes('image') || content.includes('visual')) return 'image'
  if (content.includes('mood') || content.includes('atmosphere')) return 'mood'
  return 'statement'
}

export function generateOpeningReport(state: NarrativeOpeningState): OpeningReport {
  if (state.beats.length === 0) {
    return { architecture: null, totalBeats: 0, predictedEngagement: 50, recommendations: ['Add opening beats for analysis'] }
  }
  
  const totalBeats = state.beats.length
  const hookBeat = state.beats.find(b => b.beatType === 'hook')
  const incitingIncident = state.beats.find(b => b.beatType === 'inciting_incident')
  const hookEffectiveness = hookBeat ? hookBeat.effectiveness : 50
  const hookType = detectHookType(state)
  
  const worldBeats = state.beats.filter(b => b.beatType === 'world_intro' || b.beatType === 'setup')
  const charBeats = state.beats.filter(b => b.beatType === 'character_intro')
  const worldBuildingDensity = Math.min(100, Math.round((worldBeats.length / totalBeats) * 100 * 1.5))
  
  // Pacing: good if inciting incident happens early (first 30%) and hook is effective
  const incitingPos = incitingIncident ? incitingIncident.position : 50
  const pacingScore = Math.max(0, Math.min(100, Math.round(
    (hookEffectiveness * 0.4) + ((100 - incitingPos) * 0.3) + (hookType ? 20 : 0) + (charBeats.length > 0 ? 10 : 0)
  )))
  
  const predictedEngagement = Math.max(0, Math.min(100, Math.round(hookEffectiveness * 0.6 + pacingScore * 0.4)))
  
  const architecture: OpeningArchitecture = {
    hookType,
    hookEffectiveness,
    incitingIncidentPosition: incitingIncident?.position || null,
    worldBuildingDensity,
    pacingScore,
  }
  
  const recommendations: string[] = []
  if (!hookBeat) recommendations.push('No hook detected - add a compelling opening')
  if (hookEffectiveness < 60) recommendations.push('Hook is weak - make it more compelling')
  if (!incitingIncident) recommendations.push('No inciting incident found - trigger main conflict early')
  if (incitingPos > 40) recommendations.push('Inciting incident too late - trigger within first 30%')
  if (worldBuildingDensity > 70) recommendations.push('Too much world-building - focus on engagement')
  if (charBeats.length === 0) recommendations.push('No character introduction - establish protagonist quickly')
  if (hookType === 'statement') recommendations.push('Consider a stronger hook type - question or action')
  if (predictedEngagement > 80) recommendations.push('Strong opening predicted - maintain this energy')
  
  return { architecture, totalBeats, predictedEngagement, recommendations }
}

export function getBeatsByType(state: NarrativeOpeningState, beatType: OpeningBeat['beatType']): OpeningBeat[] {
  return state.beats.filter(b => b.beatType === beatType)
}

export function getChapterOpening(state: NarrativeOpeningState, chapterNumber: number): OpeningBeat[] {
  return state.beats.filter(b => b.chapterNumber === chapterNumber)
}
