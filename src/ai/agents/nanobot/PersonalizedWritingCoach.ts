/**
 * PersonalizedWritingCoach — V319
 * Adaptive coaching strategy, user skill model, personalized suggestions.
 * Inspired by: chatdev (role specialization), generic-agent (autonomous goal pursuit)
 */

export interface SkillLevel {
  dimension: 'plot' | 'dialogue' | 'character' | 'worldbuilding' | 'style' | 'pacing'
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  score: number       // 0-100
  focusAreas: string[]
  strongAreas: string[]
}

export interface CoachingStrategy {
  approach: 'encouraging' | 'challenging' | 'analytical' | 'minimalist'
  tone: 'warm' | 'neutral' | 'direct'
  pacingLevel: 'slow' | 'medium' | 'fast'
  examplesFrequency: 'high' | 'medium' | 'low'
}

export interface UserSkillModel {
  dimensions: Map<string, SkillLevel>
  overallScore: number
  experienceLevel: 'novice' | 'practiced' | 'proficient' | 'master'
  learningVelocity: number  // improvement per session
  recentGrowth: number[]    // last N session scores
  typeAlias: Record<string, unknown>
}

export interface PersonalizedWritingCoachState {
  userModel: UserSkillModel
  currentStrategy: CoachingStrategy
  sessionHistory: { timestamp: number; score: number; suggestions: string[] }[]
  suggestionArchive: string[]  // previously given suggestions
  coachingLog: { timestamp: number; strategy: string; feedback: string }[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): PersonalizedWritingCoachState {
  return {
    userModel: {
      dimensions: new Map(),
      overallScore: 50,
      experienceLevel: 'novice',
      learningVelocity: 0,
      recentGrowth: [],
      typeAlias: {},
    },
    currentStrategy: {
      approach: 'encouraging',
      tone: 'warm',
      pacingLevel: 'medium',
      examplesFrequency: 'medium',
    },
    sessionHistory: [],
    suggestionArchive: [],
    coachingLog: [],
    typeAlias: {},
  }
}

// Assess user skill in a specific dimension
export function assessDimensionSkill(
  state: PersonalizedWritingCoachState,
  dimension: SkillLevel['dimension'],
  score: number,
  focusAreas: string[] = [],
  strongAreas: string[] = []
): PersonalizedWritingCoachState {
  const level: SkillLevel['level'] =
    score >= 85 ? 'expert' :
    score >= 70 ? 'advanced' :
    score >= 50 ? 'intermediate' :
    'beginner'

  const newDimensions = new Map(state.userModel.dimensions)
  newDimensions.set(dimension, { dimension, level, score, focusAreas, strongAreas })

  // Recalculate overall score
  const dimValues = Array.from(newDimensions.values())
  const overallScore = dimValues.length > 0
    ? Math.round(dimValues.reduce((s, d) => s + d.score, 0) / dimValues.length)
    : 50

  return {
    ...state,
    userModel: {
      ...state.userModel,
      dimensions: newDimensions,
      overallScore,
    },
  }
}

// Update coaching strategy based on user performance
export function adaptStrategy(
  state: PersonalizedWritingCoachState,
  recentScore: number,
  feedbackTone: 'positive' | 'neutral' | 'negative'
): PersonalizedWritingCoachState {
  let strategy = { ...state.currentStrategy }

  // Adapt approach based on feedback
  if (feedbackTone === 'positive' && recentScore > 75) {
    strategy.approach = 'challenging'  // push harder
    strategy.pacingLevel = 'fast'
  } else if (feedbackTone === 'negative' || recentScore < 40) {
    strategy.approach = 'encouraging'
    strategy.pacingLevel = 'slow'
    strategy.tone = 'warm'
  } else if (recentScore > 50) {
    strategy.approach = 'analytical'
    strategy.pacingLevel = 'medium'
  }

  // Adapt tone based on user experience
  if (state.userModel.experienceLevel === 'novice') {
    strategy.tone = 'warm'
    strategy.examplesFrequency = 'high'
  } else if (state.userModel.experienceLevel === 'master') {
    strategy.tone = 'direct'
    strategy.examplesFrequency = 'low'
  }

  return { ...state, currentStrategy: strategy }
}

// Generate personalized suggestion
export function generateSuggestion(
  state: PersonalizedWritingCoachState,
  dimension: SkillLevel['dimension']
): string {
  const dim = state.userModel.dimensions.get(dimension)
  if (!dim) return `Practice more in ${dimension} to build your skills.`

  const strategy = state.currentStrategy

  if (strategy.approach === 'encouraging') {
    if (dim.level === 'beginner') {
      return `You're building a great foundation in ${dimension}! Focus on ${dim.focusAreas[0] || 'basic techniques'} to grow.`
    }
    return `Your ${dimension} skills are developing well. Try exploring ${dim.focusAreas[0] || 'new techniques'}.`
  }

  if (strategy.approach === 'challenging') {
    return `Push your ${dimension} further—take on a ${dim.focusAreas[0] || 'complex scenario'} challenge.`
  }

  if (strategy.approach === 'analytical') {
    const strong = dim.strongAreas[0] || 'current strength'
    return `Your ${strong} in ${dimension} is solid. Address ${dim.focusAreas[0] || 'areas for improvement'} to reach the next level.`
  }

  // minimalist
  return `Work on ${dim.focusAreas[0] || dimension}.`
}

// Record session and update growth tracking
export function recordSession(
  state: PersonalizedWritingCoachState,
  score: number,
  suggestions: string[]
): PersonalizedWritingCoachState {
  const recentGrowth = [...state.userModel.recentGrowth.slice(-9), score]
  
  // Calculate learning velocity (simple linear regression slope of last 5)
  const n = Math.min(5, recentGrowth.length)
  const recent = recentGrowth.slice(-n)
  const indices = recent.map((_, i) => i)
  const sumX = indices.reduce((s, x) => s + x, 0)
  const sumY = recent.reduce((s, y) => s + y, 0)
  const sumXY = indices.reduce((s, x, i) => s + x * recent[i], 0)
  const sumXX = indices.reduce((s, x) => s + x * x, 0)
  const denom = n * sumXX - sumX * sumX
  const velocity = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0

  const updatedModel: UserSkillModel = {
    ...state.userModel,
    recentGrowth,
    learningVelocity: velocity,
    experienceLevel: classifyExperience(recentGrowth),
  }

  return {
    ...state,
    userModel: updatedModel,
    sessionHistory: [...state.sessionHistory, { timestamp: Date.now(), score, suggestions }],
    suggestionArchive: [...state.suggestionArchive, ...suggestions].slice(-50),
    coachingLog: [...state.coachingLog, {
      timestamp: Date.now(),
      strategy: state.currentStrategy.approach,
      feedback: `Session score: ${score}`,
    }],
  }
}

function classifyExperience(recentGrowth: number[]): UserSkillModel['experienceLevel'] {
  if (recentGrowth.length < 3) return 'novice'
  const avg = recentGrowth.reduce((s, v) => s + v, 0) / recentGrowth.length
  if (avg >= 80 && recentGrowth.length >= 10) return 'master'
  if (avg >= 65) return 'proficient'
  if (avg >= 45) return 'practiced'
  return 'novice'
}

// Get adaptive learning path
export function getLearningPath(
  state: PersonalizedWritingCoachState,
  topK: number = 3
): { dimension: string; currentLevel: string; targetLevel: string; milestones: string[] }[] {
  const path: ReturnType<typeof getLearningPath> = []
  const dims = Array.from(state.userModel.dimensions.values())
    .sort((a, b) => a.score - b.score)  // weakest first

  for (const dim of dims.slice(0, topK)) {
    const currentLevel = dim.level
    const targetLevel = getNextLevel(currentLevel)
    const milestones = generateMilestones(dim.dimension, currentLevel, targetLevel)
    path.push({
      dimension: dim.dimension,
      currentLevel,
      targetLevel,
      milestones,
    })
  }

  return path
}

function getNextLevel(current: SkillLevel['level']): SkillLevel['level'] {
  switch (current) {
    case 'beginner': return 'intermediate'
    case 'intermediate': return 'advanced'
    case 'advanced': return 'expert'
    default: return 'expert'
  }
}

function generateMilestones(dimension: string, from: SkillLevel['level'], to: SkillLevel['level']): string[] {
  const base = `Practice ${dimension} ${from} techniques`
  const milestone1 = from === 'beginner' ? `Complete 5 ${dimension} exercises` : `Master ${dimension} fundamentals`
  const milestone2 = from === 'beginner' ? `Write 3 short ${dimension} passages` : `Apply advanced ${dimension} patterns`
  return [milestone1, milestone2, `Reach ${to} level in ${dimension}`]
}

// Get coaching summary dashboard
export function getCoachingSummary(
  state: PersonalizedWritingCoachState
): {
  overallScore: number
  experienceLevel: string
  learningVelocity: string
  strongestDimension: string | null
  weakestDimension: string | null
  recentTrend: string
  nextMilestone: string | null
} {
  const dims = Array.from(state.userModel.dimensions.values())
  const strongest = dims.sort((a, b) => b.score - a.score)[0]
  const weakest = dims.sort((a, b) => a.score - b.score)[0]

  let recentTrend = 'stable'
  if (state.userModel.recentGrowth.length >= 3) {
    const last3 = state.userModel.recentGrowth.slice(-3)
    const first3 = state.userModel.recentGrowth.slice(-6, -3)
    if (first3.length > 0) {
      const avgRecent = last3.reduce((s, v) => s + v, 0) / last3.length
      const avgPrev = first3.reduce((s, v) => s + v, 0) / first3.length
      if (avgRecent > avgPrev + 5) recentTrend = 'improving'
      else if (avgRecent < avgPrev - 5) recentTrend = 'declining'
    }
  }

  const velocity = state.userModel.learningVelocity
  const velocityLabel = velocity > 2 ? 'rapid improvement' : velocity > 0 ? 'steady growth' : velocity < -2 ? 'needs attention' : 'stable'

  const path = getLearningPath(state, 1)
  const nextMilestone = path.length > 0 ? path[0].milestones[0] : null

  return {
    overallScore: state.userModel.overallScore,
    experienceLevel: state.userModel.experienceLevel,
    learningVelocity: velocityLabel,
    strongestDimension: strongest?.dimension || null,
    weakestDimension: weakest?.dimension || null,
    recentTrend,
    nextMilestone,
  }
}

// Provide feedback on user's writing
export function provideFeedback(
  state: PersonalizedWritingCoachState,
  dimensionScores: Map<string, number>
): { overall: string; dimensionFeedback: Map<string, string> } {
  const dimensionFeedback = new Map<string, string>()

  for (const [dimension, score] of dimensionScores.entries()) {
    state = assessDimensionSkill(state, dimension as SkillLevel['dimension'], score)
    dimensionFeedback.set(dimension, generateSuggestion(state, dimension as SkillLevel['dimension']))
  }

  const avgScore = Array.from(dimensionScores.values()).reduce((s, v) => s + v, 0) / dimensionScores.size
  let overall: string
  if (avgScore >= 80) overall = 'Outstanding work! Your writing shows professional-level craft.'
  else if (avgScore >= 65) overall = 'Good progress! Keep refining your techniques.'
  else if (avgScore >= 50) overall = 'Solid foundation. Focus on the areas below to improve.'
  else overall = 'Keep practicing! Every session brings improvement.'

  return { overall, dimensionFeedback }
}

// Select next practice topic based on learning gaps
export function selectNextPracticeTopic(
  state: PersonalizedWritingCoachState
): { topic: string; reason: string; difficulty: string } {
  const dims = Array.from(state.userModel.dimensions.values())
  if (dims.length === 0) {
    return { topic: 'writing fundamentals', reason: 'Build your foundation', difficulty: 'beginner' }
  }

  // Pick the dimension with most room for improvement (not lowest score, but biggest gap from expert)
  const sorted = dims.sort((a, b) => {
    const gapA = 100 - a.score
    const gapB = 100 - b.score
    return gapB - gapA
  })

  const target = sorted[0]
  const gap = 100 - target.score

  let difficulty: string
  if (target.level === 'beginner') difficulty = 'beginner'
  else if (target.level === 'intermediate') difficulty = 'intermediate'
  else difficulty = 'advanced'

  return {
    topic: target.dimension,
    reason: `${target.dimension} has ${Math.round(gap)} points of growth potential`,
    difficulty,
  }
}
