/**
 * LearningWritingCoach - V136
 * Proactive Writing Style Adaptation System
 * 
 * Design references:
 * - claude-code: capability discovery and proactive tool suggestion
 * - nanobot: distributed mesh with health tracking and pattern learning
 * - thunderbolt: pipeline feedback loops for continuous improvement
 * - generic-agent: autonomous goal pursuit with self-evaluation
 * - ruflo: hierarchical decomposition (learner → analyzer → advisor)
 */

export type WritingMode = 'narration' | 'dialogue' | 'description' | 'action' | 'exposition' | 'reflection'
export type AdaptationLevel = 'learning' | 'adaptive' | 'master' | 'proactive'
export type CoachingStrategy = 'subtle' | 'supportive' | 'assertive' | 'proactive'
export type SuggestionType = 'vocabulary' | 'structure' | 'pacing' | 'tone' | 'style' | 'flow'

export interface WritingStyleProfile {
  averageSentenceLength: number      // words per sentence
  vocabularyRichness: number         // unique words / total words
  paragraphLengthPreference: number   // avg sentences per paragraph
  dialogueTagFrequency: number        // dialogue tags per 100 lines
  introspectionRatio: number         // reflective passages / total
  actionPacingScore: number          // avg words between action beats
  narrationVoiceScore: number        // narrative density (descriptions per passage)
  preferredPOV: string
  tensePreference: 'past' | 'present' | 'mixed'
  pacingProfile: {
    slowBurn: number        // 0-1 weight
    fastPaced: number       // 0-1 weight
    mixed: number           // 0-1 weight
  }
}

export interface CoachingFeedback {
  suggestionId: string
  accepted: boolean
  timestamp: number
  reason?: string           // user-provided or inferred
}

export interface WritingSession {
  sessionId: string
  startTime: number
  segments: WritingSegment[]
  suggestionsMade: number
  suggestionsAccepted: number
  styleShiftsDetected: number
}

export interface WritingSegment {
  segmentId: string
  timestamp: number
  mode: WritingMode
  content: string
  wordCount: number
  sentenceCount: number
  styleMetrics: {
    avgWordLength: number
    vocabularyRichness: number
    dialogueRatio: number
    introspectionDepth: number
    actionIntensity: number
  }
}

export interface WritingSuggestion {
  suggestionId: string
  segmentId: string
  type: SuggestionType
  original: string
  suggested: string
  confidence: number        // 0-1
  reasoning: string
  coachingStrategy: CoachingStrategy
  proactive: boolean        // true = offered before user asked
  timestamp: number
  accepted: boolean | null  // null = pending
}

export interface AuthorPattern {
  patternId: string
  patternType: 'vocabulary' | 'structure' | 'pacing' | 'tone' | 'custom'
  triggerContext: string     // when does this pattern appear
  frequency: number          // how often it appears
  acceptanceRate: number     // suggestions based on this pattern accepted
  lastSeen: number
  examples: string[]
}

export interface LearningWritingCoachState {
  // Author's learned style profile
  styleProfile: WritingStyleProfile
  
  // Historical feedback on suggestions
  coachingHistory: Map<string, CoachingFeedback[]>
  
  // Author's recurring patterns
  authorPatterns: Map<string, AuthorPattern>
  
  // Current writing session
  currentSession: WritingSession | null
  
  // Adaptation and learning state
  adaptationLevel: AdaptationLevel
  coachingStrategy: CoachingStrategy
  sessionsCount: number
  totalSuggestionsMade: number
  totalSuggestionsAccepted: number
  
  // Proactive suggestion settings
  proactiveThreshold: number        // confidence needed to suggest proactively
  lastProactiveSuggestionAt: number | null
  
  // Style evolution tracking
  styleEvolutionHistory: Array<{
    timestamp: number
    profile: WritingStyleProfile
    significantChange: boolean
  }>
  
  // Learning progress
  learningPhase: 'building_baseline' | 'refining' | 'stable' | 'master'
  confidenceScore: number             // how confident we are in our style understanding
}

export interface SuggestionDecision {
  shouldSuggest: boolean
  confidence: number
  strategy: CoachingStrategy
  reason: string
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyCoachState(): LearningWritingCoachState {
  return {
    styleProfile: {
      averageSentenceLength: 15,
      vocabularyRichness: 0.4,
      paragraphLengthPreference: 4,
      dialogueTagFrequency: 0.15,
      introspectionRatio: 0.1,
      actionPacingScore: 50,
      narrationVoiceScore: 0.5,
      preferredPOV: 'third_person',
      tensePreference: 'past',
      pacingProfile: { slowBurn: 0.33, fastPaced: 0.33, mixed: 0.34 },
    },
    coachingHistory: new Map(),
    authorPatterns: new Map(),
    currentSession: null,
    adaptationLevel: 'learning',
    coachingStrategy: 'subtle',
    sessionsCount: 0,
    totalSuggestionsMade: 0,
    totalSuggestionsAccepted: 0,
    proactiveThreshold: 0.75,
    lastProactiveSuggestionAt: null,
    styleEvolutionHistory: [],
    learningPhase: 'building_baseline',
    confidenceScore: 0,
  }
}

// =============================================================================
// Style Profile Learning
// =============================================================================

export function analyzeSegmentStyle(
  segment: WritingSegment
): WritingSegment['styleMetrics'] {
  const words = segment.content.trim().split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  
  if (wordCount === 0) {
    return {
      avgWordLength: 0,
      vocabularyRichness: 0,
      dialogueRatio: 0,
      introspectionDepth: 0,
      actionIntensity: 0,
    }
  }
  
  const avgWordLength = words.reduce((s, w) => s + w.length, 0) / wordCount
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const vocabularyRichness = uniqueWords.size / wordCount
  
  const dialogueMatches = segment.content.match(/["""].+?["""]/g) || []
  const dialogueRatio = (dialogueMatches.length * 2) / wordCount  // rough estimate
  
  // Introspection: first-person pronouns, emotional language
  const introspectionWords = /\b(I|me|my|feel|felt|thinking|thought|believe|realized|understood)\b/gi
  const introspectionMatches = (segment.content.match(introspectionWords) || []).length
  const introspectionDepth = Math.min(1, introspectionMatches / Math.max(1, wordCount / 10))
  
  // Action intensity: exclamation marks, short sentences, active verbs
  const exclamations = (segment.content.match(/!/g) || []).length
  const actionIntensity = Math.min(1, (exclamations * 0.1 + wordCount / 100) / 2)
  
  return {
    avgWordLength: Math.round(avgWordLength * 100) / 100,
    vocabularyRichness: Math.round(vocabularyRichness * 1000) / 1000,
    dialogueRatio: Math.round(dialogueRatio * 1000) / 1000,
    introspectionDepth: Math.round(introspectionDepth * 1000) / 1000,
    actionIntensity: Math.round(actionIntensity * 1000) / 1000,
  }
}

export function updateStyleProfile(
  state: LearningWritingCoachState,
  segment: WritingSegment
): LearningWritingCoachState {
  const metrics = analyzeSegmentStyle(segment)
  const profile = state.styleProfile
  const n = state.sessionsCount + 1  // weight by session count
  
  // Running average with diminishing weight for older sessions
  const alpha = 0.3
  const newProfile: WritingStyleProfile = {
    averageSentenceLength: alpha * (segment.wordCount / Math.max(1, segment.sentenceCount)) + (1 - alpha) * profile.averageSentenceLength,
    vocabularyRichness: alpha * metrics.vocabularyRichness + (1 - alpha) * profile.vocabularyRichness,
    paragraphLengthPreference: alpha * (segment.sentenceCount / Math.max(1, 3)) + (1 - alpha) * profile.paragraphLengthPreference,
    dialogueTagFrequency: alpha * metrics.dialogueRatio + (1 - alpha) * profile.dialogueTagFrequency,
    introspectionRatio: alpha * metrics.introspectionDepth + (1 - alpha) * profile.introspectionRatio,
    actionPacingScore: alpha * (metrics.actionIntensity * 100) + (1 - alpha) * profile.actionPacingScore,
    narrationVoiceScore: alpha * (1 - metrics.dialogueRatio) + (1 - alpha) * profile.narrationVoiceScore,
    preferredPOV: profile.preferredPOV,
    tensePreference: profile.tensePreference,
    pacingProfile: profile.pacingProfile,
  }
  
  return { ...state, styleProfile: newProfile }
}

export function detectStyleShift(
  state: LearningWritingCoachState,
  newSegmentMetrics: WritingSegment['styleMetrics']
): boolean {
  const profile = state.styleProfile
  
  const deviation = Math.abs(newSegmentMetrics.vocabularyRichness - profile.vocabularyRichness) +
    Math.abs(newSegmentMetrics.dialogueRatio - profile.dialogueTagFrequency) +
    Math.abs(newSegmentMetrics.introspectionDepth - profile.introspectionRatio)
  
  // If deviation > 0.3 * 3 = 0.9, it's a significant shift
  return deviation > 0.9
}

// =============================================================================
// Pattern Learning
// =============================================================================

export function learnAuthorPattern(
  state: LearningWritingCoachState,
  content: string,
  suggestionType: SuggestionType
): LearningWritingCoachState {
  // Simple pattern detection based on content characteristics
  const patternKey = `${suggestionType}_${content.slice(0, 50)}`
  
  const existing = state.authorPatterns.get(patternKey)
  if (existing) {
    existing.lastSeen = Date.now()
    existing.frequency += 1
    const newPatterns = new Map(state.authorPatterns)
    newPatterns.set(patternKey, existing)
    return { ...state, authorPatterns: newPatterns }
  }
  
  const newPattern: AuthorPattern = {
    patternId: patternKey,
    patternType: suggestionType as AuthorPattern['patternType'],
    triggerContext: content.slice(0, 100),
    frequency: 1,
    acceptanceRate: 0.5,  // initial assumption
    lastSeen: Date.now(),
    examples: [content.slice(0, 200)],
  }
  
  const newPatterns = new Map(state.authorPatterns)
  newPatterns.set(patternKey, newPattern)
  return { ...state, authorPatterns: newPatterns }
}

export function updatePatternAcceptanceRate(
  state: LearningWritingCoachState,
  patternId: string,
  accepted: boolean
): LearningWritingCoachState {
  const pattern = state.authorPatterns.get(patternId)
  if (!pattern) return state
  
  const newRate = accepted
    ? pattern.acceptanceRate * 0.9 + 0.1  // increment slightly
    : pattern.acceptanceRate * 0.95        // decrement slightly
  
  pattern.acceptanceRate = Math.round(newRate * 1000) / 1000
  
  const newPatterns = new Map(state.authorPatterns)
  newPatterns.set(patternId, pattern)
  return { ...state, authorPatterns: newPatterns }
}

// =============================================================================
// Suggestion Generation
// =============================================================================

export function decideOnSuggestion(
  state: LearningWritingCoachState,
  segment: WritingSegment,
  suggestionType: SuggestionType
): SuggestionDecision {
  const metrics = analyzeSegmentStyle(segment)
  const profile = state.styleProfile
  
  // Calculate confidence based on:
  // 1. How well the segment matches the learned style
  const styleMatchScore = 1 - Math.abs(metrics.vocabularyRichness - profile.vocabularyRichness)
  
  // 2. How many sessions we've analyzed
  const sessionConfidence = Math.min(1, state.sessionsCount / 5)
  
  // 3. How consistent the pattern is
  const patternConsistency = state.confidenceScore
  
  const confidence = (styleMatchScore * 0.4 + sessionConfidence * 0.3 + patternConsistency * 0.3)
  
  // Choose strategy based on adaptation level
  let strategy: CoachingStrategy = 'subtle'
  if (state.adaptationLevel === 'adaptive') strategy = 'supportive'
  else if (state.adaptationLevel === 'master') strategy = 'assertive'
  else if (state.adaptationLevel === 'proactive') strategy = 'proactive'
  
  // Decide whether to suggest
  const threshold = state.proactiveThreshold - (state.adaptationLevel === 'proactive' ? 0.1 : 0)
  const shouldSuggest = confidence > threshold
  
  return {
    shouldSuggest,
    confidence: Math.round(confidence * 100) / 100,
    strategy,
    reason: shouldSuggest
      ? `High style match (${(styleMatchScore * 100).toFixed(0)}%) with ${state.sessionsCount} sessions analyzed`
      : `Insufficient confidence (${(confidence * 100).toFixed(0)}% < ${(threshold * 100).toFixed(0)}%)`,
  }
}

export function generateSuggestion(
  state: LearningWritingCoachState,
  segment: WritingSegment,
  type: SuggestionType
): WritingSuggestion | null {
  const decision = decideOnSuggestion(state, segment, type)
  if (!decision.shouldSuggest) return null
  
  const metrics = analyzeSegmentStyle(segment)
  
  // Generate type-specific suggestions
  let original = ''
  let suggested = ''
  
  if (type === 'vocabulary') {
    // Check for overused common words
    const commonWords = ['very', 'really', 'just', 'thing', 'stuff', 'said', 'went']
    const found = commonWords.find(w => segment.content.toLowerCase().includes(w))
    if (found) {
      original = found
      suggested = getBetterWordSuggestion(found, metrics)
    }
  } else if (type === 'pacing') {
    // Suggest paragraph break if sentence count too high
    if (metrics.avgWordLength > 6 && segment.sentenceCount > 3) {
      original = 'continuous_long_paragraph'
      suggested = 'break_into_shorter_paragraphs'
    }
  } else if (type === 'structure') {
    // Suggest dialogue tag variation if dialogue ratio is high
    if (metrics.dialogueRatio > 0.3) {
      original = 'overused_dialogue_tags'
      suggested = 'varied_said_alternatives'
    }
  }
  
  if (!original) return null
  
  return {
    suggestionId: `suggest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    segmentId: segment.segmentId,
    type,
    original,
    suggested,
    confidence: decision.confidence,
    reasoning: decision.reason,
    coachingStrategy: decision.strategy,
    proactive: decision.strategy === 'proactive',
    timestamp: Date.now(),
    accepted: null,
  }
}

function getBetterWordSuggestion(bad: string, metrics: WritingSegment['styleMetrics']): string {
  const replacements: Record<string, string[]> = {
    'very': ['extremely', 'incredibly', 'particularly'],
    'really': ['truly', 'genuinely', 'certainly'],
    'just': ['simply', 'merely', 'exactly'],
    'said': ['stated', 'remarked', 'observed', 'noted'],
    'went': ['proceeded', 'traveled', 'journeyed'],
  }
  const options = replacements[bad.toLowerCase()] || ['precisely']
  return options[Math.floor(metrics.avgWordLength) % options.length]
}

// =============================================================================
// Feedback Processing
// =============================================================================

export function recordSuggestionFeedback(
  state: LearningWritingCoachState,
  suggestion: WritingSuggestion,
  accepted: boolean,
  reason?: string
): LearningWritingCoachState {
  const feedback: CoachingFeedback = {
    suggestionId: suggestion.suggestionId,
    accepted,
    timestamp: Date.now(),
    reason,
  }
  
  const history = new Map(state.coachingHistory)
  const existing = history.get(suggestion.type) || []
  history.set(suggestion.type, [...existing, feedback])
  
  // Update acceptance stats
  const newTotal = state.totalSuggestionsMade + 1
  const newAccepted = state.totalSuggestionsAccepted + (accepted ? 1 : 0)
  const acceptanceRate = newAccepted / newTotal
  
  // Adapt strategy based on acceptance rate
  let newStrategy = state.coachingStrategy
  if (acceptanceRate > 0.8) newStrategy = 'proactive'
  else if (acceptanceRate > 0.6) newStrategy = 'assertive'
  else if (acceptanceRate > 0.4) newStrategy = 'supportive'
  else newStrategy = 'subtle'
  
  // Update adaptation level
  let newLevel: AdaptationLevel = 'learning'
  if (state.sessionsCount >= 20 && acceptanceRate > 0.7) newLevel = 'proactive'
  else if (state.sessionsCount >= 10 && acceptanceRate > 0.6) newLevel = 'master'
  else if (state.sessionsCount >= 5 && acceptanceRate > 0.5) newLevel = 'adaptive'
  
  // Update confidence
  const newConfidence = Math.min(1, state.confidenceScore * 0.95 + acceptanceRate * 0.05)
  
  // Update learning phase
  let newPhase = state.learningPhase
  if (newConfidence > 0.8) newPhase = 'stable'
  else if (newConfidence > 0.5) newPhase = 'refining'
  
  return {
    ...state,
    coachingHistory: history,
    totalSuggestionsMade: newTotal,
    totalSuggestionsAccepted: newAccepted,
    coachingStrategy: newStrategy,
    adaptationLevel: newLevel,
    confidenceScore: Math.round(newConfidence * 1000) / 1000,
    learningPhase: newPhase,
  }
}

// =============================================================================
// Session Management
// =============================================================================

export function startNewSession(
  state: LearningWritingCoachState
): LearningWritingCoachState {
  const session: WritingSession = {
    sessionId: `session_${Date.now()}`,
    startTime: Date.now(),
    segments: [],
    suggestionsMade: 0,
    suggestionsAccepted: 0,
    styleShiftsDetected: 0,
  }
  
  return { ...state, currentSession: session }
}

export function addSegmentToSession(
  state: LearningWritingCoachState,
  content: string,
  mode: WritingMode
): LearningWritingCoachState {
  if (!state.currentSession) {
    state = startNewSession(state)
  }
  
  const words = content.trim().split(/\s+/).filter(w => w.length > 0)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  const segment: WritingSegment = {
    segmentId: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    mode,
    content,
    wordCount: words.length,
    sentenceCount: sentences.length,
    styleMetrics: {
      avgWordLength: 0,
      vocabularyRichness: 0,
      dialogueRatio: 0,
      introspectionDepth: 0,
      actionIntensity: 0,
    },
  }
  
  segment.styleMetrics = analyzeSegmentStyle(segment)
  
  const newSegments = [...state.currentSession.segments, segment]
  
  return {
    ...state,
    currentSession: { ...state.currentSession, segments: newSegments },
  }
}

export function endSession(
  state: LearningWritingCoachState
): LearningWritingCoachState {
  if (!state.currentSession) return state
  
  const newHistory = [...state.styleEvolutionHistory, {
    timestamp: Date.now(),
    profile: state.styleProfile,
    significantChange: detectStyleShift(state, 
      state.currentSession.segments[state.currentSession.segments.length - 1]?.styleMetrics || {
        avgWordLength: 0, vocabularyRichness: 0, dialogueRatio: 0,
        introspectionDepth: 0, actionIntensity: 0,
      }),
  }]
  
  return {
    ...state,
    sessionsCount: state.sessionsCount + 1,
    currentSession: null,
    styleEvolutionHistory: newHistory,
  }
}

// =============================================================================
// Proactive Suggestion Logic
// =============================================================================

export function shouldOfferProactiveSuggestion(
  state: LearningWritingCoachState
): boolean {
  if (state.coachingStrategy !== 'proactive') return false
  if (state.lastProactiveSuggestionAt && 
      Date.now() - state.lastProactiveSuggestionAt < 30000) return false  // max once per 30s
  if (!state.currentSession || state.currentSession.segments.length < 2) return false
  
  return true
}

export function markProactiveSuggestionMade(
  state: LearningWritingCoachState
): LearningWritingCoachState {
  return {
    ...state,
    lastProactiveSuggestionAt: Date.now(),
  }
}

// =============================================================================
// Formatters
// =============================================================================

export function formatStyleProfile(state: LearningWritingCoachState): string {
  const p = state.styleProfile
  const lines = [
    '=== Author Style Profile ===',
    `Avg Sentence Length: ${p.averageSentenceLength.toFixed(1)} words`,
    `Vocabulary Richness: ${(p.vocabularyRichness * 100).toFixed(0)}%`,
    `Dialogue Ratio: ${(p.dialogueTagFrequency * 100).toFixed(0)}%`,
    `Introspection: ${(p.introspectionRatio * 100).toFixed(0)}%`,
    `Action Intensity: ${p.actionPacingScore.toFixed(0)}/100`,
    `Narrative Voice: ${(p.narrationVoiceScore * 100).toFixed(0)}%`,
    `POV: ${p.preferredPOV}`,
    `Tense: ${p.tensePreference}`,
    `Pacing: slow=${(p.pacingProfile.slowBurn * 100).toFixed(0)}% fast=${(p.pacingProfile.fastPaced * 100).toFixed(0)}%`,
    '',
    `Adaptation Level: ${state.adaptationLevel}`,
    `Coaching Strategy: ${state.coachingStrategy}`,
    `Confidence: ${(state.confidenceScore * 100).toFixed(0)}%`,
    `Sessions: ${state.sessionsCount} | Suggestions: ${state.totalSuggestionsMade} (${(state.totalSuggestionsAccepted / Math.max(1, state.totalSuggestionsMade) * 100).toFixed(0)}% accepted)`,
    `Learning Phase: ${state.learningPhase}`,
  ]
  return lines.join('\n')
}

export function formatCoachDashboard(state: LearningWritingCoachState): string {
  const lines = [
    '=== Learning Writing Coach Dashboard ===',
    formatStyleProfile(state),
    '',
    '--- Recent Patterns ---',
  ]
  
  const sorted = Array.from(state.authorPatterns.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5)
  
  for (const p of sorted) {
    lines.push(`  [${p.patternType}] ${p.triggerContext.slice(0, 40)}... (freq=${p.frequency}, acceptance=${(p.acceptanceRate * 100).toFixed(0)}%)`)
  }
  
  if (state.currentSession) {
    lines.push('')
    lines.push(`--- Current Session: ${state.currentSession.sessionId} ---`)
    lines.push(`  Segments: ${state.currentSession.segments.length}`)
    lines.push(`  Suggestions: ${state.currentSession.suggestionsMade} (${state.currentSession.suggestionsAccepted} accepted)`)
    lines.push(`  Style shifts: ${state.currentSession.styleShiftsDetected}`)
  }
  
  return lines.join('\n')
}
