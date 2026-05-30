/**
 * ReaderPersonaEngine — V495
 * Reader persona modeling, emotional resonance prediction, and personalized content adaptation.
 * Inspired by: thunderbolt (feedback pipeline) + chatdev (role analysis) + generic-agent (persona modeling)
 */

export type PersonaType = 'explorer' | 'planner' | 'critic' | 'connector' | 'achiever'
export type EmotionalValence = 'positive' | 'negative' | 'neutral' | 'ambivalent'

export interface ReaderProfile {
  id: string
  name: string
  type: PersonaType
  engagementScore: number  // 0-100
  preferredPacing: 'slow' | 'medium' | 'fast'
  genrePreferences: string[]
  emotionalTriggers: string[]
  interactionHistory: Interaction[]
}

export interface Interaction {
  chapterId: string
  timestamp: number
  dwellTime: number  // seconds
  emotionalPeak: number  // 0-100
  engagementLevel: number  // 0-100
  skipRate: number  // 0-100
}

export interface EmotionalResonancePrediction {
  valence: EmotionalValence
  intensity: number  // 0-100
  predictedEngagement: number  // 0-100
  recommendedAdjustments: string[]
}

export interface ReaderPersonaState {
  profiles: ReaderProfile[]
  activeProfileId: string | null
  resonanceCache: Record<string, EmotionalResonancePrediction>
  adaptationHistory: string[]
}

export function createEmptyState(): ReaderPersonaState {
  return { profiles: [], activeProfileId: null, resonanceCache: {}, adaptationHistory: [] }
}

export function createProfile(
  state: ReaderPersonaState,
  name: string,
  type: PersonaType
): ReaderPersonaState {
  const id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const profile: ReaderProfile = {
    id,
    name,
    type,
    engagementScore: 50,
    preferredPacing: 'medium',
    genrePreferences: [],
    emotionalTriggers: [],
    interactionHistory: []
  }
  return { ...state, profiles: [...state.profiles, profile], activeProfileId: id }
}

export function setActiveProfile(state: ReaderPersonaState, profileId: string): ReaderPersonaState {
  if (!state.profiles.find(p => p.id === profileId)) return state
  return { ...state, activeProfileId: profileId }
}

export function recordInteraction(
  state: ReaderPersonaState,
  profileId: string,
  chapterId: string,
  dwellTime: number,
  emotionalPeak: number,
  engagementLevel: number,
  skipRate: number
): ReaderPersonaState {
  const profiles = state.profiles.map(p => {
    if (p.id !== profileId) return p
    const interaction: Interaction = {
      chapterId,
      timestamp: Date.now(),
      dwellTime,
      emotionalPeak,
      engagementLevel,
      skipRate
    }
    return { ...p, interactionHistory: [...p.interactionHistory.slice(-49), interaction] }
  })
  return { ...state, profiles }
}

export function updateProfileFromHistory(state: ReaderPersonaState, profileId: string): ReaderPersonaState {
  const profile = state.profiles.find(p => p.id === profileId)
  if (!profile) return state

  const interactions = profile.interactionHistory
  if (interactions.length === 0) return state

  const avgDwell = interactions.reduce((s, i) => s + i.dwellTime, 0) / interactions.length
  const avgEngagement = interactions.reduce((s, i) => s + i.engagementLevel, 0) / interactions.length
  const avgSkip = interactions.reduce((s, i) => s + i.skipRate, 0) / interactions.length

  // Derive preferred pacing from skip rate
  let preferredPacing: 'slow' | 'medium' | 'fast' = 'medium'
  if (avgSkip > 60) preferredPacing = 'fast'
  else if (avgSkip < 30) preferredPacing = 'slow'

  // Update engagement score with exponential moving average
  const alpha = 0.3
  const newEngagementScore = alpha * avgEngagement + (1 - alpha) * profile.engagementScore

  const profiles = state.profiles.map(p =>
    p.id === profileId
      ? { ...p, engagementScore: Math.round(newEngagementScore), preferredPacing }
      : p
  )
  return { ...state, profiles }
}

export function predictEmotionalResonance(
  state: ReaderPersonaState,
  profileId: string,
  contentKey: string,
  sceneType: string  // e.g., 'action', 'romance', 'mystery', 'climax'
): EmotionalResonancePrediction {
  const cacheKey = `${profileId}:${contentKey}`
  if (state.resonanceCache[cacheKey]) {
    return state.resonanceCache[cacheKey]
  }

  const profile = state.profiles.find(p => p.id === profileId)
  if (!profile) {
    const result: EmotionalResonancePrediction = {
      valence: 'neutral',
      intensity: 50,
      predictedEngagement: 50,
      recommendedAdjustments: []
    }
    return result
  }

  // Persona-specific resonance patterns
  const valenceMap: Record<string, EmotionalValence> = {
    explorer: 'positive',
    planner: 'neutral',
    critic: 'negative',
    connector: 'positive',
    achiever: 'neutral'
  }

  // Scene type emotional weights per persona
  const sceneEmotions: Record<PersonaType, Record<string, number>> = {
    explorer: { action: 80, romance: 70, mystery: 90, climax: 75 },
    planner: { action: 60, romance: 65, mystery: 75, climax: 80 },
    critic: { action: 55, romance: 60, mystery: 85, climax: 70 },
    connector: { action: 65, romance: 90, mystery: 70, climax: 85 },
    achiever: { action: 85, romance: 55, mystery: 80, climax: 95 }
  }

  const baseValence = valenceMap[profile.type] || 'neutral'
  const baseIntensity = sceneEmotions[profile.type]?.[sceneType] || 65
  const adjustedIntensity = Math.min(100, baseIntensity * (profile.engagementScore / 50))

  const adjustments: string[] = []
  if (profile.preferredPacing === 'fast' && (sceneType === 'romance' || sceneType === 'mystery')) {
    adjustments.push('Consider tightening pacing for this scene type')
  }
  if (profile.preferredPacing === 'slow' && sceneType === 'action') {
    adjustments.push('Consider expanding action descriptions')
  }
  if (profile.engagementScore < 40) {
    adjustments.push('Reader disengaged — consider adding interactive choice points')
  }

  const result: EmotionalResonancePrediction = {
    valence: baseValence,
    intensity: Math.round(adjustedIntensity),
    predictedEngagement: Math.round(adjustedIntensity * (profile.engagementScore / 100)),
    recommendedAdjustments: adjustments
  }

  return { ...result }
}

export function cacheResonance(
  state: ReaderPersonaState,
  profileId: string,
  contentKey: string,
  prediction: EmotionalResonancePrediction
): ReaderPersonaState {
  const cacheKey = `${profileId}:${contentKey}`
  return { ...state, resonanceCache: { ...state.resonanceCache, [cacheKey]: prediction } }
}

export function getActiveProfile(state: ReaderPersonaState): ReaderProfile | null {
  if (!state.activeProfileId) return null
  return state.profiles.find(p => p.id === state.activeProfileId) || null
}

export function getProfileById(state: ReaderPersonaState, profileId: string): ReaderProfile | null {
  return state.profiles.find(p => p.id === profileId) || null
}

export function listProfiles(state: ReaderPersonaState): ReaderProfile[] {
  return state.profiles
}