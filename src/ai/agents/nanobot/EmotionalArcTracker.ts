/**
 * EmotionalArcTracker — V415
 * Emotional arc tracking, character emotional journey, feeling progression across narrative.
 * Inspired by: chatdev (emotional analysis), thunderbolt (feedback loops), generic-agent (goal tracking)
 */

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation' | 'love' | 'grief'

export interface EmotionEntry {
  chapterId: string
  characterId: string
  emotion: EmotionType
  intensity: number  // 0-100
  trigger: string
  reaction: string
}

export interface EmotionalArc {
  characterId: string
  journey: EmotionEntry[]
  dominantEmotion: EmotionType | null
  emotionalRange: number  // max - min intensity
  arcStability: number  // 0-100 (how consistent/smooth)
}

export interface EmotionalArcReport {
  totalEntries: number
  charactersTracked: number
  unstableCharacters: string[]
  commonTriggers: string[]
  recommendations: string[]
}

export interface EmotionalArcState {
  entries: EmotionEntry[]
  arcs: Map<string, EmotionalArc>
  report: EmotionalArcReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): EmotionalArcState {
  return { entries: [], arcs: new Map(), report: null, typeAlias: {} }
}

export function recordEmotion(
  state: EmotionalArcState,
  chapterId: string,
  characterId: string,
  emotion: EmotionType,
  intensity: number,
  trigger: string,
  reaction: string
): EmotionalArcState {
  const entry: EmotionEntry = { chapterId, characterId, emotion, intensity, trigger, reaction }
  const entries = [...state.entries, entry]
  
  // Rebuild arc for this character
  const charEntries = entries.filter(e => e.characterId === characterId)
  const emotionalArc = computeEmotionalArc(charEntries)
  
  const arcs = new Map(state.arcs)
  arcs.set(characterId, emotionalArc)
  
  return { ...state, entries, arcs }
}

function computeEmotionalArc(entries: EmotionEntry[]): EmotionalArc {
  if (entries.length === 0) {
    return { characterId: entries[0]?.characterId || '', journey: entries, dominantEmotion: null, emotionalRange: 0, arcStability: 0 }
  }
  
  const emotionCounts: Record<EmotionType, number> = { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0, trust: 0, anticipation: 0, love: 0, grief: 0 }
  for (const e of entries) emotionCounts[e.emotion]++
  const dominantEmotion = (Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as EmotionType) || null
  
  const intensities = entries.map(e => e.intensity)
  const emotionalRange = Math.max(...intensities) - Math.min(...intensities)
  
  // Arc stability: variance in intensity changes
  let stability = 100
  for (let i = 1; i < entries.length; i++) {
    stability -= Math.abs(entries[i].intensity - entries[i - 1].intensity) * 0.5
  }
  stability = Math.max(0, Math.min(100, stability))
  
  return {
    characterId: entries[0].characterId,
    journey: entries,
    dominantEmotion,
    emotionalRange,
    arcStability: Math.round(stability),
  }
}

export function generateEmotionalReport(state: EmotionalArcState): EmotionalArcReport {
  if (state.entries.length === 0) {
    return { totalEntries: 0, charactersTracked: 0, unstableCharacters: [], commonTriggers: [], recommendations: [] }
  }
  
  const characters = new Set(state.entries.map(e => e.characterId))
  const charactersTracked = characters.size
  
  const unstableCharacters: string[] = []
  for (const [charId, arc] of state.arcs) {
    if (arc.arcStability < 40) unstableCharacters.push(charId)
  }
  
  const triggerCounts: Record<string, number> = {}
  for (const e of state.entries) {
    triggerCounts[e.trigger] = (triggerCounts[e.trigger] || 0) + 1
  }
  const commonTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)
  
  const recommendations: string[] = []
  if (unstableCharacters.length > charactersTracked * 0.4) {
    recommendations.push(`${unstableCharacters.length} characters have erratic emotional arcs - smooth transitions`)
  }
  if (state.entries.filter(e => e.emotion === 'anger' || e.emotion === 'sadness').length > state.entries.length * 0.5) {
    recommendations.push('Heavy negative emotion balance - add positive emotional moments')
  }
  if (charactersTracked > 8) recommendations.push('Many characters tracked - focus on main cast emotional arcs')
  if (state.arcs.size > 0 && [...state.arcs.values()].some(a => a.emotionalRange > 80)) {
    recommendations.push('Some characters have extreme emotional swings - moderate for reader comfort')
  }
  if (unstableCharacters.length === 0 && charactersTracked > 3) {
    recommendations.push('Stable emotional arcs across characters - good consistency')
  }
  
  return { totalEntries: state.entries.length, charactersTracked, unstableCharacters, commonTriggers, recommendations }
}

export function getCharacterEmotionalJourney(state: EmotionalArcState, characterId: string): EmotionEntry[] {
  return state.entries.filter(e => e.characterId === characterId)
}

export function compareEmotionalArcs(state: EmotionalArcState, char1: string, char2: string): {
  moreVolatile: string
  range1: number
  range2: number
} {
  const arc1 = state.arcs.get(char1)
  const arc2 = state.arcs.get(char2)
  if (!arc1 || !arc2) return { moreVolatile: char1, range1: 0, range2: 0 }
  return {
    moreVolatile: arc1.emotionalRange > arc2.emotionalRange ? char1 : char2,
    range1: arc1.emotionalRange,
    range2: arc2.emotionalRange,
  }
}
