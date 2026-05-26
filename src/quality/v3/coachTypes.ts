/**
 * Quality Coach V3 Types - V63
 * Types for WritingCoachEngine, StyleAnalyzer, RealtimeGuidance, WritingProgressTracker
 */

// Style Metrics
export interface StyleMetrics {
  sentenceComplexity: number  // 0-1, higher = more complex
  vocabularyRichness: number // 0-1, lexical diversity
  emotionalTone: number      // -1 to 1, negative to positive
  rhythmScore: number        // 0-1, sentence variation
}

// Writing Profile
export interface WritingProfile {
  author: string
  totalWords: number
  targetWords: number
  averageQuality: number     // 0-100
  dominantEmotion: string
  styleMetrics: StyleMetrics
  progress: number           // 0-100 percentage
}

// Quality Dimensions
export type QualityDimension = 'clarity' | 'engagement' | 'coherence' | 'style' | 'grammar'

export interface QualityScore {
  dimension: QualityDimension
  score: number              // 0-100
  weight: number             // importance for this text type
  details: string
}

// Writing Context
export interface WritingContext {
  genre: string
  targetAudience: string
  mood: string
  chapterNumber: number
  previousEmotions: string[]
}

// Coaching Suggestion
export type CoachingPriority = 'low' | 'medium' | 'high' | 'critical'

export interface CoachingSuggestion {
  type: 'encouragement' | 'correction' | 'style' | 'structure' | 'pace'
  priority: CoachingPriority
  message: string
  metrics?: Record<string, number>
  action?: string
}

// Writing Session
export interface WritingSession {
  id: string
  startTime: number
  endTime?: number
  wordsWritten: number
  qualityScores: QualityScore[]
  suggestions: CoachingSuggestion[]
}

// Milestone
export interface Milestone {
  id: string
  type: 'word_count' | 'chapter' | 'quality' | 'time'
  target: number
  reached: boolean
  reachedAt?: number
}

// WritingCoachEngine Functions

export function createWritingProfile(
  author: string,
  targetWords: number,
  genre: string = 'fiction'
): WritingProfile {
  return {
    author,
    totalWords: 0,
    targetWords,
    averageQuality: 0,
    dominantEmotion: 'neutral',
    styleMetrics: {
      sentenceComplexity: 0.5,
      vocabularyRichness: 0.5,
      emotionalTone: 0,
      rhythmScore: 0.5
    },
    progress: 0
  }
}

export function updateProfileProgress(profile: WritingProfile, wordsWritten: number): WritingProfile {
  const totalWords = profile.totalWords + wordsWritten
  const progress = Math.min(100, (totalWords / profile.targetWords) * 100)
  return {
    ...profile,
    totalWords,
    progress
  }
}

export function updateStyleMetrics(
  profile: WritingProfile,
  metrics: Partial<StyleMetrics>
): WritingProfile {
  return {
    ...profile,
    styleMetrics: { ...profile.styleMetrics, ...metrics }
  }
}

export function calculateOverallQuality(scores: QualityScore[]): number {
  if (scores.length === 0) return 0
  const totalWeight = scores.reduce((s, sc) => s + sc.weight, 0)
  if (totalWeight === 0) return 0
  const weightedSum = scores.reduce((s, sc) => s + sc.score * sc.weight, 0)
  return weightedSum / totalWeight
}

export function generateCoachingSuggestions(
  profile: WritingProfile,
  context: WritingContext,
  scores: QualityScore[]
): CoachingSuggestion[] {
  const suggestions: CoachingSuggestion[] = []

  // Check progress
  if (profile.progress < 25 && scores.length > 0) {
    suggestions.push({
      type: 'encouragement',
      priority: 'medium',
      message: 'Great start! Keep writing to build momentum.',
      metrics: { progress: profile.progress }
    })
  }

  // Check quality
  const overall = calculateOverallQuality(scores)
  if (overall < 60) {
    suggestions.push({
      type: 'correction',
      priority: 'high',
      message: 'Consider reviewing your sentence structure for better clarity.',
      action: 'Review grammar and flow',
      metrics: { quality: overall }
    })
  } else if (overall > 85) {
    suggestions.push({
      type: 'encouragement',
      priority: 'low',
      message: 'Excellent quality! Your writing is flowing well.',
      metrics: { quality: overall }
    })
  }

  // Check style
  if (profile.styleMetrics.sentenceComplexity > 0.8) {
    suggestions.push({
      type: 'style',
      priority: 'medium',
      message: 'Your sentences are quite complex. Consider varying length for better readability.',
      metrics: { complexity: profile.styleMetrics.sentenceComplexity }
    })
  }

  if (profile.styleMetrics.vocabularyRichness < 0.3) {
    suggestions.push({
      type: 'style',
      priority: 'low',
      message: 'Try introducing some varied vocabulary to enrich your writing.',
      metrics: { vocabulary: profile.styleMetrics.vocabularyRichness }
    })
  }

  // Check rhythm
  if (profile.styleMetrics.rhythmScore < 0.4) {
    suggestions.push({
      type: 'pace',
      priority: 'medium',
      message: 'Your writing rhythm could benefit from more variation in sentence length.',
      metrics: { rhythm: profile.styleMetrics.rhythmScore }
    })
  }

  // Check emotional tone
  if (context.mood && profile.styleMetrics.emotionalTone !== 0) {
    const toneDeviation = Math.abs(profile.styleMetrics.emotionalTone - getEmotionScore(context.mood))
    if (toneDeviation > 0.5) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        message: `The emotional tone shifts significantly from the intended mood (${context.mood}).`,
        metrics: { emotionalTone: profile.styleMetrics.emotionalTone, targetEmotion: getEmotionScore(context.mood) }
      })
    }
  }

  // Sort by priority
  const priorityOrder: Record<CoachingPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 }
  return suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
}

function getEmotionScore(emotion: string): number {
  const emotionScores: Record<string, number> = {
    happy: 0.7, sad: -0.5, angry: -0.6, peaceful: 0.4,
    tense: -0.3, excited: 0.8, calm: 0.3, dramatic: -0.2
  }
  return emotionScores[emotion.toLowerCase()] || 0
}

// StyleAnalyzer Functions

export function analyzeSentenceComplexity(sentences: string[]): number {
  if (sentences.length === 0) return 0.5

  const totalLengths = sentences.map(s => s.split(' ').length)
  const avgLength = totalLengths.reduce((s, l) => s + l, 0) / sentences.length
  const maxLength = Math.max(...totalLengths)
  const variance = totalLengths.reduce((s, l) => s + Math.pow(l - avgLength, 2), 0) / sentences.length

  // Complexity increases with average length and variance
  const normalizedAvg = Math.min(1, avgLength / 30)
  const normalizedVariance = Math.min(1, variance / 100)
  return Math.min(1, (normalizedAvg * 0.6 + normalizedVariance * 0.4))
}

export function calculateVocabularyRichness(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || []
  if (words.length === 0) return 0

  const uniqueWords = new Set(words)
  // Type-token ratio with adjustment for text length
  const ttr = uniqueWords.size / words.length
  // Adjust for longer texts (statistical expected TTR decreases)
  const expectedTTR = 1 / (1 + 0.05 * Math.log(words.length))
  const richness = ttr / expectedTTR

  return Math.min(1, Math.max(0, richness))
}

export function detectEmotionalTone(text: string): number {
  const positiveWords = ['happy', 'joy', 'love', 'beautiful', 'wonderful', 'great', 'excellent', 'amazing', 'bright', 'warm']
  const negativeWords = ['sad', 'angry', 'fear', 'terrible', 'horrible', 'dark', 'cold', 'cruel', 'pain', 'suffer']

  const lowerText = text.toLowerCase()
  let score = 0

  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 0.1
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 0.1
  }

  return Math.max(-1, Math.min(1, score))
}

export function calculateRhythmScore(sentences: string[]): number {
  if (sentences.length < 3) return 0.5

  const lengths = sentences.map(s => s.split(' ').length)
  const avgLength = lengths.reduce((s, l) => s + l, 0) / lengths.length

  // Calculate variance in sentence lengths
  const variance = lengths.reduce((s, l) => s + Math.pow(l - avgLength, 2), 0) / lengths.length
  const cv = Math.sqrt(variance) / avgLength  // coefficient of variation

  // Rhythm benefits from moderate variation (not too uniform, not too chaotic)
  // Optimal CV is around 0.3-0.5
  const optimalCV = 0.4
  const rhythmScore = 1 - Math.abs(cv - optimalCV) / optimalCV

  return Math.max(0, Math.min(1, rhythmScore))
}

export function analyzeWritingStyle(
  text: string,
  sentences: string[]
): StyleMetrics {
  return {
    sentenceComplexity: analyzeSentenceComplexity(sentences),
    vocabularyRichness: calculateVocabularyRichness(text),
    emotionalTone: detectEmotionalTone(text),
    rhythmScore: calculateRhythmScore(sentences)
  }
}

// RealtimeGuidance Functions

export function calculateInterventionThreshold(
  currentQuality: number,
  baselineQuality: number,
  streakLength: number
): number {
  // Base threshold
  let threshold = 20

  // Adjust based on quality gap
  const qualityGap = baselineQuality - currentQuality
  if (qualityGap > 10) threshold -= 5
  if (qualityGap > 20) threshold -= 5

  // Adjust based on streak
  if (streakLength > 3) threshold -= 5
  if (streakLength > 5) threshold -= 5

  return Math.max(5, threshold)
}

export function shouldTriggerIntervention(
  currentQuality: number,
  threshold: number,
  context: WritingContext
): boolean {
  // Never interrupt during first 100 words
  if (context.chapterNumber === 0) return false

  // Check quality against threshold
  return currentQuality < (100 - threshold)
}

export function generateContextualSuggestion(
  context: WritingContext,
  style: StyleMetrics,
  quality: number
): string {
  const suggestions: string[] = []

  // Genre-specific advice
  if (context.genre === 'fantasy' && style.vocabularyRichness < 0.4) {
    suggestions.push('Consider using more descriptive, world-specific vocabulary.')
  }

  // Audience-specific advice
  if (context.targetAudience === 'young_adult' && style.sentenceComplexity > 0.7) {
    suggestions.push('Your sentences could be more accessible for younger readers.')
  }

  // Mood-specific advice
  if (context.mood === 'tense' && style.emotionalTone > 0.3) {
    suggestions.push('The mood calls for a tenser emotional tone.')
  }

  // General quality advice
  if (quality < 60) {
    suggestions.push('Focus on clarity before adding stylistic elements.')
  } else if (quality > 85) {
    suggestions.push('Your writing is excellent. Consider adding more emotional depth.')
  }

  return suggestions[0] || 'Keep writing consistently.'
}

export function calculateEmotionalCurve(sentences: string[]): number[] {
  const windowSize = Math.max(3, Math.floor(sentences.length / 5))
  const curve: number[] = []

  for (let i = 0; i < sentences.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = sentences.slice(start, i + 1)
    const avgTone = detectEmotionalTone(window.join(' '))
    curve.push(avgTone)
  }

  return curve
}

// WritingProgressTracker Functions

export function trackChapterProgress(
  currentChapter: number,
  totalChapters: number,
  currentWords: number,
  targetWordsPerChapter: number
): number {
  const chapterProgress = (currentWords / targetWordsPerChapter) * 100
  const overallChapterProgress = ((currentChapter - 1) / totalChapters) * 100
  const currentContribution = (chapterProgress / totalChapters)
  return Math.min(100, overallChapterProgress + currentContribution)
}

export function detectMilestones(
  profile: WritingProfile,
  milestones: Milestone[]
): Milestone[] {
  const reached: Milestone[] = []

  for (const milestone of milestones) {
    if (milestone.reached) continue

    let isReached = false

    switch (milestone.type) {
      case 'word_count':
        isReached = profile.totalWords >= milestone.target
        break
      case 'chapter':
        // Assuming chapter milestones store target as chapter number
        const chaptersWritten = Math.floor(profile.totalWords / (profile.targetWords / 10))
        isReached = chaptersWritten >= milestone.target
        break
      case 'quality':
        isReached = profile.averageQuality >= milestone.target
        break
      case 'time':
        // Time-based milestones check if current time exceeds target
        isReached = Date.now() >= milestone.target
        break
    }

    if (isReached) {
      reached.push({ ...milestone, reached: true, reachedAt: Date.now() })
    }
  }

  return reached
}

export function calculateQualityTrend(scores: QualityScore[]): 'improving' | 'stable' | 'declining' {
  if (scores.length < 3) return 'stable'

  const recentScores = scores.slice(-5).map(s => s.score)
  const olderScores = scores.slice(-10, -5).map(s => s.score)

  if (olderScores.length === 0) return 'stable'

  const recentAvg = recentScores.reduce((s, sc) => s + sc, 0) / recentScores.length
  const olderAvg = olderScores.reduce((s, sc) => s + sc, 0) / olderScores.length

  const diff = recentAvg - olderAvg
  if (diff > 3) return 'improving'
  if (diff < -3) return 'declining'
  return 'stable'
}

export function generateProgressReport(profile: WritingProfile): string {
  const remaining = profile.targetWords - profile.totalWords
  const estimatedSessions = Math.ceil(remaining / 500) // Assuming 500 words per session

  return [
    `Total words: ${profile.totalWords}/${profile.targetWords} (${profile.progress.toFixed(1)}%)`,
    `Average quality: ${profile.averageQuality.toFixed(1)}/100`,
    `Dominant emotion: ${profile.dominantEmotion}`,
    `Estimated sessions remaining: ${estimatedSessions}`,
    `Progress: ${profile.progress < 50 ? 'Halfway there!' : profile.progress < 80 ? 'Almost there!' : 'Almost done!'}`
  ].join('\n')
}

export function calculateWritingVelocity(session: WritingSession): number {
  if (!session.endTime) return 0
  const durationMinutes = (session.endTime - session.startTime) / 60000
  if (durationMinutes === 0) return 0
  return session.wordsWritten / durationMinutes
}