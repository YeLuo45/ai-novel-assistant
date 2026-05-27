/**
 * ReaderExperienceSimulator Types - V82
 * Reader Emotional Journey and Engagement Prediction
 * 
 * Simulates how a reader would experience the story:
 * - Emotional arc tracking (tension, excitement, curiosity, satisfaction)
 * - Pacing analysis (too fast/slow, info dump detection)
 * - Engagement prediction (will they finish? where will they quit?)
 * - Reading fatigue detection
 * - Moment-of-grip analysis (hook effectiveness)
 */

import type { SessionPhase } from '../session/WritingSessionManager'
import type { SkillLevel } from '../evolution/SelfEvolutionTypes'

// ===============================================================================
// Emotional State Types
// ===============================================================================

export type EmotionType = 
  | 'curiosity'      // How curious is the reader
  | 'tension'        // How tense
  | 'excitement'     // How excited
  | 'satisfaction'    // How satisfied
  | 'confusion'      // How confused
  | 'boredom'        // How bored
  | 'anticipation'   // How much they're looking forward to what happens
  | 'surprise'       // How surprised
  | 'delight'        // How delighted
  | 'frustration'    // How frustrated

export interface EmotionalState {
  curiosity: number      // 0-100
  tension: number        // 0-100
  excitement: number     // 0-100
  satisfaction: number   // 0-100
  confusion: number      // 0-100
  boredom: number        // 0-100
  anticipation: number    // 0-100
  surprise: number        // 0-100
  delight: number        // 0-100
  frustration: number    // 0-100
}

export interface EmotionalSnapshot {
  timestamp: number
  chapter: number
  position: number  // Position within chapter (0-1)
  state: EmotionalState
  overallEngagement: number  // 0-100 composite score
}

// ===============================================================================
// Pacing Types
// ===============================================================================

export type PacingRating = 'too_slow' | 'optimal' | 'too_fast' | 'info_dump'

export interface PacingAnalysis {
  rating: PacingRating
  sceneCount: number
  averageSceneLength: number  // words
  actionDensity: number       // 0-1, action beats per 100 words
  dialogueDensity: number     // 0-1, dialogue beats per 100 words
  descriptionDensity: number  // 0-1, description beats per 100 words
  pacingScore: number         // 0-100, 50 = optimal
  issues: string[]
}

// ===============================================================================
// Engagement Types
// ===============================================================================

export type EngagementLevel = 'hooked' | 'engaged' | 'neutral' | 'drifting' | 'lost' | 'dropped'

export interface EngagementPrediction {
  currentEngagement: EngagementLevel
  engagementScore: number           // 0-100
  predictedFinishProbability: number // 0-1
  likelyDropChapter: number | null  // null if will finish
  recommendedFix: string
  confidence: number                // 0-1
}

export interface ReadingSessionSegment {
  id: string
  startChapter: number
  endChapter: number
  startPosition: number
  endPosition: number
  averageEngagement: number
  minEngagement: number
  peakEngagement: number
  readingTimeMinutes: number
  completed: boolean
}

// ===============================================================================
// Fatigue Types
// ===============================================================================

export type FatigueIndicator =
  | 'repetitive_structure'     // Same pattern repeating
  | 'monotone_tension'        // Tension not varying
  | 'missing_peaks'           // No release after tension
  | 'excessive_description'   // Too much description
  | 'dialogue_heavy'          // Too much dialogue without action
  | 'action_heavy'            // Too much action without breathing room
  | 'emotional_flatline'     // No emotional variation

export interface FatigueReport {
  detected: boolean
  indicators: FatigueIndicator[]
  severity: 'minor' | 'moderate' | 'major'  // 0-1 scale
  affectedChapters: number[]
  description: string
  suggestedRecovery: string
}

// ===============================================================================
// Hook Analysis Types
// ===============================================================================

export type HookType = 'mystery' | 'conflict' | 'character' | 'world' | 'style' | 'question'

export interface HookAnalysis {
  effective: boolean
  type: HookType | null
  strength: number  // 0-100
  description: string
  readerQuestion: string  // What question the hook creates in reader's mind
  predictedRetentionBoost: number  // How much it improves finish probability
}

// ===============================================================================
// Reader Profile Types
// ===============================================================================

export type ReaderPersonality = 
  | 'plot_lover'      // Enjoys complex plots
  | 'character_lover' // Enjoys deep character work
  | 'world_lover'     // Enjoys world-building
  | 'style_lover'     // Enjoys beautiful prose
  | 'action_lover'    // Enjoys fast-paced action
  | 'balanced'         // Enjoys a mix

export interface ReaderProfile {
  id: string
  personality: ReaderPersonality
  patienceForSlowStart: number      // Chapters before dropping
  toleranceForConfusion: number     // 0-100
  preferredPace: 'fast' | 'medium' | 'slow'
  attentionSpan: number             // Minutes before losing focus
  emotionalSensitivity: number      // How easily they get bored/confused
  favoriteGenres: string[]
  favoriteTropes: string[]
}

// ===============================================================================
// Story Segment Types
// ===============================================================================

export interface StorySegment {
  id: string
  type: 'action' | 'dialogue' | 'description' | 'reflection' | 'transition'
  chapter: number
  startPosition: number
  endPosition: number
  content: string
  emotionalTags: EmotionType[]
  tensionLevel: number    // 0-100
  engagementValue: number // 0-100 estimated reader engagement
}

// ===============================================================================
// Simulation Types
// ===============================================================================

export interface SimulationConfig {
  readerProfile: ReaderProfile
  simulateFatigue: boolean
  simulateEmotionalContagion: boolean  // How reader emotions spread to nearby scenes
  dropoutThreshold: number              // Engagement score that causes dropout
  segmentCount: number                  // Number of segments to analyze
}

export interface SimulationResult {
  readerProfile: ReaderProfile
  emotionalArc: EmotionalSnapshot[]
  pacingAnalysis: PacingAnalysis[]
  engagementPredictions: EngagementPrediction[]
  fatigueReports: FatigueReport[]
  hookAnalyses: HookAnalysis[]
  overallEngagementScore: number
  predictedCompletionRate: number  // 0-1, probability of finishing
  criticalMoments: CriticalMoment[]
  recommendations: string[]
}

export interface CriticalMoment {
  chapter: number
  type: 'hook' | 'cliffhanger' | 'resolution' | 'pacing_issue' | 'confusion_point'
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  description: string
  engagementImpact: number  // -100 to +100
}

// ===============================================================================
// Helper Functions
// ===============================================================================

/**
 * Calculate overall engagement from emotional state
 */
export function calculateOverallEngagement(state: EmotionalState): number {
  const positive = state.curiosity + state.tension + state.excitement + state.satisfaction + state.anticipation + state.surprise + state.delight
  const negative = state.confusion + state.boredom + state.frustration
  
  // Net positive weighted by max possible
  const net = (positive - negative * 0.7) / 7
  return Math.max(0, Math.min(100, 50 + net * 0.5))
}

/**
 * Create baseline emotional state for a given genre/tone
 */
export function createBaselineEmotionalState(genre: string, tone: 'dark' | 'light' | 'neutral'): EmotionalState {
  const base: EmotionalState = {
    curiosity: 50,
    tension: 30,
    excitement: 40,
    satisfaction: 50,
    confusion: 10,
    boredom: 20,
    anticipation: 40,
    surprise: 20,
    delight: 30,
    frustration: 10
  }
  
  if (tone === 'dark') {
    base.tension += 20
    base.excitement += 10
    base.confusion += 5
    base.boredom -= 5
  } else if (tone === 'light') {
    base.satisfaction += 10
    base.delight += 15
    base.tension -= 10
    base.frustration -= 10
  }
  
  return base
}

/**
 * Simulate emotional response to a story event
 */
export function simulateEmotionalResponse(
  currentState: EmotionalState,
  eventType: 'plot_twist' | 'character_moment' | 'action_scene' | 'quiet_moment' | 'mystery_reveal' | 'resolution' | 'complication' | 'dialogue_heavy' | 'description_heavy',
  intensity: number  // 0-1
): EmotionalState {
  const state = { ...currentState }
  const i = intensity
  
  switch (eventType) {
    case 'plot_twist':
      state.surprise += 30 * i
      state.confusion += 15 * i
      state.tension += 20 * i
      state.excitement += 25 * i
      state.satisfaction -= 10 * i  // Temporary confusion reduces satisfaction
      break
    case 'character_moment':
      state.satisfaction += 25 * i
      state.delight += 20 * i
      state.curiosity += 10 * i
      state.tension -= 5 * i
      break
    case 'action_scene':
      state.excitement += 35 * i
      state.tension += 30 * i
      state.boredom -= 15 * i
      state.satisfaction -= 5 * i  // Can reduce if too long
      state.frustration += 10 * i  // If action is confusing
      break
    case 'quiet_moment':
      state.satisfaction += 15 * i
      state.curiosity += 5 * i
      state.tension -= 10 * i
      state.excitement -= 10 * i
      break
    case 'mystery_reveal':
      state.satisfaction += 30 * i
      state.curiosity -= 20 * i  // Mystery solved, curiosity drops
      state.anticipation += 15 * i  // New possibilities
      state.delight += 15 * i
      break
    case 'resolution':
      state.satisfaction += 35 * i
      state.tension -= 25 * i
      state.excitement -= 15 * i
      state.anticipation -= 10 * i
      break
    case 'complication':
      state.tension += 30 * i
      state.curiosity += 15 * i
      state.frustration += 20 * i  // Problems!
      state.anticipation += 20 * i
      break
    case 'dialogue_heavy':
      state.boredom += 10 * i
      state.satisfaction += 5 * i  // But character development
      state.confusion += 5 * i
      break
    case 'description_heavy':
      state.boredom += 15 * i
      state.confusion -= 5 * i
      state.tension -= 10 * i
      break
  }
  
  // Clamp all values to 0-100
  for (const key of Object.keys(state) as (keyof EmotionalState)[]) {
    state[key] = Math.max(0, Math.min(100, state[key]))
  }
  
  // Natural decay toward baseline
  const decayRate = 0.1
  const baseline = 50
  for (const key of Object.keys(state) as (keyof EmotionalState)[]) {
    if (!['satisfaction', 'boredom', 'confusion'].includes(key)) {
      state[key] = state[key] + (baseline - state[key]) * decayRate * (1 - i * 0.5)
    }
  }
  
  return state
}

/**
 * Analyze pacing from segment list
 */
export function analyzePacingFromSegments(segments: StorySegment[]): PacingAnalysis {
  if (segments.length === 0) {
    return {
      rating: 'optimal',
      sceneCount: 0,
      averageSceneLength: 0,
      actionDensity: 0.5,
      dialogueDensity: 0.3,
      descriptionDensity: 0.2,
      pacingScore: 50,
      issues: []
    }
  }
  
  const sceneCount = segments.length
  const totalLength = segments.reduce((sum, s) => sum + (s.endPosition - s.startPosition), 0)
  const avgLength = totalLength / sceneCount
  
  const actionDensity = segments.filter(s => s.type === 'action').length / sceneCount
  const dialogueDensity = segments.filter(s => s.type === 'dialogue').length / sceneCount
  const descriptionDensity = segments.filter(s => s.type === 'description').length / sceneCount
  
  const issues: string[] = []
  let rating: PacingRating = 'optimal'
  let pacingScore = 50
  
  if (descriptionDensity > 0.5) {
    issues.push('Too much description - risk of reader disengagement')
    rating = 'info_dump'
    pacingScore -= 30
  }
  
  if (dialogueDensity > 0.6) {
    issues.push('Dialogue-heavy - consider adding action beats')
    rating = rating === 'info_dump' ? 'info_dump' : 'too_slow'
    pacingScore -= 15
  }
  
  if (actionDensity > 0.7 && dialogueDensity < 0.1) {
    issues.push('Action-heavy - add breathing room between action sequences')
    rating = 'too_fast'
    pacingScore -= 20
  }
  
  if (avgLength > 3000) {
    issues.push('Scenes may be too long - consider breaking up')
    pacingScore -= 10
  }
  
  if (pacingScore < 30) {
    rating = 'info_dump'
  } else if (pacingScore < 45) {
    rating = 'too_slow'
  } else if (pacingScore > 70) {
    rating = 'too_fast'
  }
  
  return {
    rating,
    sceneCount,
    averageSceneLength: avgLength,
    actionDensity,
    dialogueDensity,
    descriptionDensity,
    pacingScore: Math.max(0, Math.min(100, pacingScore)),
    issues
  }
}

/**
 * Detect reading fatigue
 */
export function detectReadingFatigue(
  segments: StorySegment[],
  engagementHistory: number[]
): FatigueReport {
  if (segments.length < 5 || engagementHistory.length < 5) {
    return {
      detected: false,
      indicators: [],
      severity: 'minor',
      affectedChapters: [],
      description: 'Insufficient data for fatigue analysis',
      suggestedRecovery: ''
    }
  }
  
  const indicators: FatigueIndicator[] = []
  
  // Check for repetitive structure
  const types = segments.slice(-10).map(s => s.type)
  const typeCounts = new Map<string, number>()
  for (const t of types) {
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1)
  }
  const maxTypeCount = Math.max(...Array.from(typeCounts.values()))
  if (maxTypeCount / types.length > 0.7) {
    indicators.push('repetitive_structure')
  }
  
  // Check for monotone tension
  const tensionValues = segments.slice(-10).map(s => s.tensionLevel)
  const tensionVariance = calculateVariance(tensionValues)
  if (tensionVariance < 100) {
    indicators.push('monotone_tension')
  }
  
  // Check for missing peaks
  const tensionPeaks = tensionValues.filter((v, i) => i > 0 && i < tensionValues.length - 1 && v > tensionValues[i - 1] && v > tensionValues[i + 1])
  if (tensionPeaks.length < 2 && segments.length > 10) {
    indicators.push('missing_peaks')
  }
  
  // Check description density
  const descDensity = segments.filter(s => s.type === 'description').length / segments.length
  if (descDensity > 0.4) {
    indicators.push('excessive_description')
  }
  
  // Check dialogue density
  const diagDensity = segments.filter(s => s.type === 'dialogue').length / segments.length
  if (diagDensity > 0.5) {
    indicators.push('dialogue_heavy')
  }
  
  // Check action density
  const actDensity = segments.filter(s => s.type === 'action').length / segments.length
  if (actDensity > 0.6) {
    indicators.push('action_heavy')
  }
  
  // Emotional flatline check
  if (engagementHistory.length > 10) {
    const variance = calculateVariance(engagementHistory.slice(-20))
    if (variance < 50) {
      indicators.push('emotional_flatline')
    }
  }
  
  const affectedChapters = Array.from(new Set(segments.slice(-10).map(s => s.chapter)))
  
  let severity: 'minor' | 'moderate' | 'major' = 'minor'
  let description = ''
  let suggestedRecovery = ''
  
  if (indicators.length >= 4) {
    severity = 'major'
    description = 'Significant fatigue patterns detected across multiple dimensions'
    suggestedRecovery = 'Consider adding variation: insert a surprise, break up description blocks, vary scene types'
  } else if (indicators.length >= 2) {
    severity = 'moderate'
    description = `Fatigue indicators: ${indicators.join(', ')}`
    suggestedRecovery = 'Add variation to restore engagement'
  } else if (indicators.length === 1) {
    severity = 'minor'
    description = `Minor fatigue signal: ${indicators[0]}`
    suggestedRecovery = 'Monitor but no immediate action needed'
  } else {
    description = 'No significant fatigue patterns detected'
  }
  
  return {
    detected: indicators.length > 0,
    indicators,
    severity,
    affectedChapters,
    description,
    suggestedRecovery
  }
}

/**
 * Calculate variance of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Predict reader engagement
 */
export function predictEngagement(
  currentEngagement: number,
  recentTrend: number[],  // Last N engagement scores
  readerProfile: ReaderProfile,
  chapter: number
): EngagementPrediction {
  const trendDirection = recentTrend.length >= 3
    ? (recentTrend[recentTrend.length - 1] - recentTrend[0]) / recentTrend.length
    : 0
  
  // Calculate likely engagement level
  let level: EngagementLevel = 'neutral'
  if (currentEngagement > 80) level = 'hooked'
  else if (currentEngagement > 60) level = 'engaged'
  else if (currentEngagement > 40) level = 'neutral'
  else if (currentEngagement > 20) level = 'drifting'
  else level = 'lost'
  
  // Predict finish probability
  let finishProb = currentEngagement / 100
  
  // Adjust by trend
  if (trendDirection > 0.5) {
    finishProb = Math.min(1, finishProb + 0.1)
  } else if (trendDirection < -0.5) {
    finishProb = Math.max(0, finishProb - 0.2)
  }
  
  // Adjust by reader patience
  if (chapter > readerProfile.patienceForSlowStart && currentEngagement < 50) {
    finishProb *= 0.7  // Past their patience threshold
  }
  
  // Calculate confidence
  const confidence = recentTrend.length >= 5 ? 0.8 : 0.5
  
  // Predict drop chapter
  let likelyDropChapter: number | null = null
  let recommendedFix = ''
  
  if (finishProb < 0.3) {
    likelyDropChapter = chapter + Math.ceil((1 - currentEngagement / 100) * 5)
    recommendedFix = 'Consider adding a hook or reducing complexity to restore engagement'
  } else if (finishProb < 0.6) {
    recommendedFix = 'Monitor engagement - consider adding a scene break or change of pace'
  } else {
    recommendedFix = 'Reader is engaged - maintain current trajectory'
  }
  
  return {
    currentEngagement: level,
    engagementScore: currentEngagement,
    predictedFinishProbability: finishProb,
    likelyDropChapter,
    recommendedFix,
    confidence
  }
}

/**
 * Analyze hook effectiveness
 */
export function analyzeHook(
  openingText: string,
  readerProfile: ReaderProfile
): HookAnalysis {
  const text = openingText.toLowerCase()
  
  // Detect hook type
  let type: HookType | null = null
  let strength = 50
  
  if (text.includes('?') || text.includes('how could') || text.includes('why did')) {
    type = 'mystery'
    strength = 70
  } else if (text.includes('but') || text.includes('however') || text.includes('despite')) {
    type = 'conflict'
    strength = 65
  } else if (text.includes('he') || text.includes('she') || text.includes('they') || text.includes('the')) {
    type = 'character'
    strength = 60
  } else if (text.includes('world') || text.includes('realm') || text.includes('land') || text.includes('kingdom')) {
    type = 'world'
    strength = 55
  } else if (text.includes('"') || text.includes("'")) {
    type = 'style'
    strength = 50
  } else {
    type = null
    strength = 30
  }
  
  // Adjust strength based on reader profile
  if (type === 'mystery' && readerProfile.personality === 'plot_lover') {
    strength += 20
  } else if (type === 'character' && readerProfile.personality === 'character_lover') {
    strength += 20
  } else if (type === 'world' && readerProfile.personality === 'world_lover') {
    strength += 20
  } else if (type === 'style' && readerProfile.personality === 'style_lover') {
    strength += 20
  }
  
  const hookTypes = ['mystery', 'conflict', 'character', 'world', 'style']
  const readerQuestion = type === 'mystery' 
    ? 'What happened? Why?' 
    : type === 'conflict'
    ? 'What will go wrong?'
    : type === 'character'
    ? 'Who is this person?'
    : type === 'world'
    ? 'What is this place?'
    : 'What happens next?'
  
  return {
    effective: strength >= 55,
    type,
    strength: Math.min(100, strength),
    description: `Detected ${type || 'no clear'} hook with strength ${strength}`,
    readerQuestion,
    predictedRetentionBoost: (strength - 50) / 50  // -1 to +1
  }
}

/**
 * Create default reader profile
 */
export function createDefaultReaderProfile(id: string): ReaderProfile {
  return {
    id,
    personality: 'balanced',
    patienceForSlowStart: 3,
    toleranceForConfusion: 60,
    preferredPace: 'medium',
    attentionSpan: 30,
    emotionalSensitivity: 50,
    favoriteGenres: ['fantasy', 'sci-fi'],
    favoriteTropes: ['hero journey', 'found family']
  }
}

/**
 * Format engagement prediction for display
 */
export function formatEngagementPrediction(prediction: EngagementPrediction): string {
  const finishPct = (prediction.predictedFinishProbability * 100).toFixed(0)
  const dropInfo = prediction.likelyDropChapter 
    ? `Likely drop at chapter ${prediction.likelyDropChapter}` 
    : 'Likely to finish'
  
  return [
    `Engagement: ${prediction.currentEngagement} (${prediction.engagementScore.toFixed(0)}%)`,
    `Finish probability: ${finishPct}%`,
    dropInfo,
    `Fix: ${prediction.recommendedFix}`,
    `Confidence: ${(prediction.confidence * 100).toFixed(0)}%`
  ].join('\n')
}

/**
 * Generate simulation result summary
 */
export function generateSimResultSummary(result: SimulationResult): string {
  const lines = [
    `=== Reader Experience Simulation ===`,
    `Overall Engagement: ${result.overallEngagementScore.toFixed(0)}%`,
    `Completion Rate: ${(result.predictedCompletionRate * 100).toFixed(0)}%`,
    `Critical Moments: ${result.criticalMoments.length}`,
    `Recommendations:`,
    ...result.recommendations.map(r => `  - ${r}`)
  ]
  
  if (result.fatigueReports.length > 0) {
    lines.push(`Fatigue Detected: ${result.fatigueReports.filter(f => f.detected).length}`)
  }
  
  return lines.join('\n')
}