/**
 * SensoryDetailEngine - V178
 * Sensory Detail Injection & Immersion Tracking Engine
 * 
 * Design references:
 * - ruflo: hierarchical decomposition (surface description -> sensory layers)
 * - nanobot: distributed mesh for cross-scene sensory consistency
 * - chatdev: multi-perspective immersion analysis
 */

export type SensoryMode = 'visual' | 'auditory' | 'olfactory' | 'gustatory' | 'tactile' | 'kinesthetic'

export interface SensoryDetail {
  detailId: string
  mode: SensoryMode
  chapter: number
  intensity: number  // 0-100
  text: string
  category: string  // e.g., 'lighting', 'texture', 'temperature'
}

export interface ImmersionScore {
  chapter: number
  overallScore: number  // 0-100
  modeBreakdown: Record<SensoryMode, number>
  deficitModes: SensoryMode[]
  suggestedModes: SensoryMode[]
}

export interface SensoryState {
  details: SensoryDetail[]
  immersionScores: ImmersionScore[]
  modeUsage: Record<SensoryMode, number>  // track usage per mode
  currentChapter: number
}

function createDetailId(): string {
  return 'sd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function classifySensoryDetail(text: string): { mode: SensoryMode; category: string; intensity: number } | null {
  const lower = text.toLowerCase()

  // Visual
  const visualWords = ['saw', 'looked', 'bright', 'dark', 'color', 'shone', 'glimmered', 'shadow', 'light', 'sky', 'face', 'eyes', 'scene', 'view', 'appearance']
  const visualCategories = ['light', 'dark', 'bright', 'color', 'sky', 'shadow', 'red', 'blue', 'green', 'black', 'white']
  for (const cat of visualCategories) {
    if (lower.includes(cat)) return { mode: 'visual', category: cat, intensity: 50 }
  }

  // Auditory
  const audioWords = ['heard', 'sound', 'voice', 'whisper', 'shout', 'noise', 'echo', 'silence', 'music', 'rustle', 'crack', 'bang']
  if (audioWords.filter(w => lower.includes(w)).length >= 2) return { mode: 'auditory', category: 'sound', intensity: 50 }

  // Olfactory
  const olfactoryWords = ['smelled', 'scent', 'aroma', 'stink', 'fragrant', 'perfume', 'stench', 'odor', 'smell', 'fresh', 'rotten']
  if (olfactoryWords.some(w => lower.includes(w))) return { mode: 'olfactory', category: 'smell', intensity: 55 }

  // Gustatory
  const gustatoryWords = ['tasted', 'sweet', 'bitter', 'sour', 'salty', 'delicious', 'flavor', 'taste', 'food', 'drink', 'eat']
  if (gustatoryWords.some(w => lower.includes(w))) return { mode: 'gustatory', category: 'taste', intensity: 55 }

  // Tactile
  const tactileWords = ['felt', 'touch', 'warm', 'cold', 'rough', 'smooth', 'soft', 'hard', 'texture', 'temperature', 'pain', 'heat']
  if (tactileWords.filter(w => lower.includes(w)).length >= 2) return { mode: 'tactile', category: 'texture', intensity: 50 }

  // Kinesthetic
  const kinestheticWords = ['moved', 'walked', 'ran', 'jumped', 'fell', 'struck', 'grabbed', 'pushed', 'pull', 'movement', 'motion', 'action']
  if (kinestheticWords.filter(w => lower.includes(w)).length >= 2) return { mode: 'kinesthetic', category: 'movement', intensity: 50 }

  return null
}

export function createEmptySensoryState(): SensoryState {
  return {
    details: [],
    immersionScores: [],
    modeUsage: { visual: 0, auditory: 0, olfactory: 0, gustatory: 0, tactile: 0, kinesthetic: 0 },
    currentChapter: 0,
  }
}

export function analyzeSensoryContent(state: SensoryState, text: string, chapter: number): SensoryState {
  const classified = classifySensoryDetail(text)
  if (!classified) return state

  const detail: SensoryDetail = {
    detailId: createDetailId(),
    mode: classified.mode,
    chapter,
    intensity: classified.intensity,
    text: text.substring(0, 100),
    category: classified.category,
  }

  const modeUsage = { ...state.modeUsage }
  modeUsage[classified.mode]++

  const immersionScores = [...state.immersionScores]
  const chapterScenes = [...state.details, detail].filter(d => d.chapter === chapter)
  const modeBreakdown: Record<SensoryMode, number> = {
    visual: 0, auditory: 0, olfactory: 0, gustatory: 0, tactile: 0, kinesthetic: 0
  }

  for (const d of chapterScenes) {
    modeBreakdown[d.mode] += d.intensity
  }

  const totalIntensity = Object.values(modeBreakdown).reduce((a, b) => a + b, 0)
  const modeCount = Object.values(modeBreakdown).filter(v => v > 0).length
  const overallScore = Math.min(100, Math.round((totalIntensity / 6) * (modeCount / 6) * 2))

  const deficitModes: SensoryMode[] = (['visual', 'auditory', 'olfactory', 'gustatory', 'tactile', 'kinesthetic'] as SensoryMode[])
    .filter(m => modeBreakdown[m] === 0)
  const suggestedModes: SensoryMode[] = (['visual', 'auditory', 'olfactory', 'gustatory', 'tactile', 'kinesthetic'] as SensoryMode[])
    .filter(m => modeUsage[m] < 3)

  immersionScores.push({ chapter, overallScore, modeBreakdown, deficitModes, suggestedModes })

  return {
    ...state,
    details: [...state.details, detail],
    immersionScores: immersionScores.slice(-19),
    modeUsage,
    currentChapter: chapter,
  }
}

export function getImmersionScore(state: SensoryState, chapter: number): ImmersionScore | null {
  return state.immersionScores.find(s => s.chapter === chapter) || null
}

export function getChapterSensoryDetails(state: SensoryState, chapter: number): SensoryDetail[] {
  return state.details.filter(d => d.chapter === chapter)
}

export function getModeUsageStats(state: SensoryState): Record<SensoryMode, number> {
  return state.modeUsage
}

export function formatSensorySummary(state: SensoryState): string {
  let s = '=== Sensory Detail Summary ===\n'
  s += 'Total Details: ' + state.details.length + '\n'
  s += 'Chapters Covered: ' + [...new Set(state.details.map(d => d.chapter))].length + '\n'

  if (state.details.length > 0) {
    s += '\n--- Mode Usage ---\n'
    for (const [mode, count] of Object.entries(state.modeUsage)) {
      if (count > 0) s += '  ' + mode + ': ' + count + '\n'
    }
  }
  return s
}

export function formatSensoryDashboard(state: SensoryState): string {
  let s = '=== Sensory Dashboard ===\n'
  s += 'Chapter: ' + state.currentChapter + '\n'

  if (state.immersionScores.length > 0) {
    s += '\n--- Immersion Scores ---\n'
    for (const score of state.immersionScores.slice(-5).reverse()) {
      s += '  Ch ' + score.chapter + ': overall=' + score.overallScore
      if (score.deficitModes.length > 0) s += ' [deficit: ' + score.deficitModes.join(', ') + ']'
      s += '\n'
    }
  }

  if (state.details.length > 0) {
    s += '\n--- Recent Sensory Details ---\n'
    for (const d of state.details.slice(-5).reverse()) {
      s += '  Ch ' + d.chapter + ' [' + d.mode + ']: ' + d.text.substring(0, 50) + '\n'
    }
  }
  return s
}
