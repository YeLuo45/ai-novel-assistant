/**
 * PersonalizedWritingCoach — V339
 * AI-powered writing coach with personalized feedback, learning path,
 * skill gap analysis, and adaptive guidance.
 * Inspired by: generic-agent (autonomous learning), chatdev (role-based feedback)
 */

export interface SkillGap {
  dimension: string
  currentLevel: number
  targetLevel: number
  exercises: string[]
}

export interface LearningPath {
  skillGaps: SkillGap[]
  recommendedExercises: { exercise: string; priority: number; dimension: string }[]
  estimatedSessions: number
  focusAreas: string[]
}

export interface CoachFeedback {
  dimension: string
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  examples: string[]
}

export interface WritingChallenge {
  id: string
  type: 'pacing' | 'dialogue' | 'description' | 'character' | 'plot'
  difficulty: number
  description: string
  targetSkill: string
  completed: boolean
}

export interface CoachState {
  skillProfiles: Record<string, number>  // dimension -> level (0-100)
  sessionHistory: { date: number; improvement: number; focus: string }[]
  challenges: WritingChallenge[]
  currentPath: LearningPath | null
  feedbackHistory: CoachFeedback[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): CoachState {
  return {
    skillProfiles: {
      pacing: 50, dialogue: 50, description: 50, character: 50, plot: 50,
      wordChoice: 50, sentenceStructure: 50, narrativeFlow: 50, tension: 50, emotionalResonance: 50,
    },
    sessionHistory: [],
    challenges: [],
    currentPath: null,
    feedbackHistory: [],
    typeAlias: {},
  }
}

// Analyze skill gaps
export function analyzeSkillGaps(state: CoachState, recentScores: Record<string, number>): SkillGap[] {
  const gaps: SkillGap[] = []
  for (const [dimension, score] of Object.entries(recentScores)) {
    if (score < 70) {
      const targetLevel = dimension in state.skillProfiles ? state.skillProfiles[dimension] + 10 : 80
      const gapSize = Math.max(0, targetLevel - score)
      const exerciseCount = Math.ceil(gapSize / 15)
      const exercises = generateExercises(dimension, exerciseCount)
      gaps.push({ dimension, currentLevel: score, targetLevel: Math.min(targetLevel, 95), exercises })
    }
  }
  return gaps.sort((a, b) => (a.targetLevel - a.currentLevel) - (b.targetLevel - b.currentLevel))
}

function generateExercises(dimension: string, count: number): string[] {
  const exercises: Record<string, string[]> = {
    pacing: ['Write 5 scenes with varying tempo', 'Practice the slow-burn tension technique', 'Balance action and reflection'],
    dialogue: ['Write a conversation with subtext', 'Practice attribution variety', 'Create subtext-heavy dialogue'],
    description: ['Paint a scene in 3 different moods', 'Use all 5 senses in one paragraph', 'Show emotion through environment'],
    character: ['Give a character a secret', 'Write from antagonist perspective', 'Explore character motivation deeply'],
    plot: ['Create a twist that serves the theme', 'Practice foreshadowing techniques', 'Balance predictability and surprise'],
    wordChoice: ['Replace 10 common words with precise alternatives', 'Find 5 unusual metaphors', 'Practice economy of words'],
    sentenceStructure: ['Write a paragraph of only short sentences', 'Create a long sentence with clauses', 'Mix sentence lengths deliberately'],
    narrativeFlow: ['Link scenes with sensory transitions', 'Practice smooth time jumps', 'Create seamless point-of-view transitions'],
    tension: ['Add micro-tensions in dialogue', 'Create chapter-ending hooks', 'Practice escalating stakes'],
    emotionalResonance: ['Trigger a specific emotion in 100 words', 'Write an emotionally complex scene', 'Balance show and tell for impact'],
  }
  const base = exercises[dimension] || ['Practice this dimension more', 'Study excellent examples', 'Get feedback from readers']
  return base.slice(0, count)
}

// Create learning path from skill gaps
export function createLearningPath(state: CoachState, gaps: SkillGap[]): LearningPath {
  const recommendedExercises: { exercise: string; priority: number; dimension: string }[] = []
  for (const gap of gaps) {
    for (let i = 0; i < gap.exercises.length; i++) {
      recommendedExercises.push({
        exercise: gap.exercises[i],
        priority: (gaps.length - gaps.indexOf(gap)) * 10 - i,
        dimension: gap.dimension,
      })
    }
  }
  recommendedExercises.sort((a, b) => b.priority - a.priority)
  const focusAreas = gaps.map(g => g.dimension)
  const estimatedSessions = Math.max(...gaps.map(g => Math.ceil((g.targetLevel - g.currentLevel) / 10)), 1)
  return { skillGaps: gaps, recommendedExercises, estimatedSessions, focusAreas }
}

// Generate coach feedback
export function generateCoachFeedback(state: CoachState, dimensionScores: Record<string, number>): CoachFeedback[] {
  const feedback: CoachFeedback[] = []
  for (const [dimension, score] of Object.entries(dimensionScores)) {
    const strengths: string[] = []
    const weaknesses: string[] = []
    const suggestions: string[] = []
    const examples: string[] = []
    if (score >= 80) {
      strengths.push(`Strong ${dimension} skills demonstrated`)
      suggestions.push('Continue refining your natural talent in this area')
    } else if (score >= 60) {
      suggestions.push(`Practicing ${dimension} will help you reach the next level`)
    } else {
      weaknesses.push(`${dimension} needs significant improvement`)
      suggestions.push(`Focus on ${dimension} fundamentals first`)
    }
    if (score < 70) {
      suggestions.push(getSuggestionForDimension(dimension))
      examples.push(getExampleForDimension(dimension))
    }
    feedback.push({ dimension, score, strengths, weaknesses, suggestions, examples })
  }
  return feedback
}

function getSuggestionForDimension(dimension: string): string {
  const suggestions: Record<string, string> = {
    pacing: 'Try varying your sentence length to control reading speed',
    dialogue: 'Add more subtext — what characters don\'t say is as important as what they do',
    description: 'Use specific details instead of generic ones — replace "nice house" with "blue Victorian with crooked shutters"',
    character: 'Give each character a unique voice — vocabulary, sentence structure, and speech patterns',
    plot: 'Every scene should advance the plot or develop character — if it does neither, consider cutting it',
    wordChoice: 'Read your dialogue aloud — if a word would sound unnatural in speech, change it',
    sentenceStructure: 'Mix short punchy sentences with longer descriptive ones for rhythm',
    narrativeFlow: 'Use transitions that connect emotionally, not just sequentially',
    tension: 'Ask yourself: what is the worst thing that could happen in this scene? Now make it happen',
    emotionalResonance: 'Connect with your own experiences — readers feel what you felt while writing',
  }
  return suggestions[dimension] || 'Practice consistently to improve'
}

function getExampleForDimension(dimension: string): string {
  const examples: Record<string, string> = {
    pacing: 'Example: Short "He ran." followed by long "He ran through the dark forest, branches tearing at his coat, heart pounding like a drum..."',
    dialogue: 'Example: Instead of "I hate you" try "I hope you\'re happy" said with a smile that didn\'t reach the eyes',
    description: 'Example: Instead of "The room was scary" try "Mold crawled up the walls and the floorboards groaned under the weight of silence"',
    character: 'Example: An elderly professor might say "Hm, yes, quite" while a teenager says "Yeah, whatever, I guess" — different vocab and rhythm',
    plot: 'Example: A plot point: the letter arrives — but we already know its contents from the previous scene, so the tension is in the reaction',
    wordChoice: 'Example: Replace "walked" with "shuffled", "strode", "crept", "wandered" — each gives different information',
    sentenceStructure: 'Example: Short "It was dark." followed by long "The darkness was so complete, so absolute, that he could not see his own hands in front of his face."',
    narrativeFlow: 'Example: Not "She left. The door closed." but "She walked out into a night that matched her mood — the kind of darkness that feels like it\'s listening"',
    tension: 'Example: Two characters talking about nothing while something terrible is happening in the background',
    emotionalResonance: 'Example: Write about the smell of a childhood home — specific sensory memories trigger stronger responses than abstract statements',
  }
  return examples[dimension] || 'Study examples in your favorite books and analyze what makes them work'
}

// Record session improvement
export function recordSessionImprovement(state: CoachState, improvement: number, focus: string): CoachState {
  const sessionHistory = [...state.sessionHistory, { date: Date.now(), improvement, focus }]
    .slice(-20)  // keep last 20 sessions
  return { ...state, sessionHistory }
}

// Get progress summary
export function getProgressSummary(state: CoachState) {
  const avgImprovement = state.sessionHistory.length > 0
    ? state.sessionHistory.reduce((s, h) => s + h.improvement, 0) / state.sessionHistory.length
    : 0
  const totalSessions = state.sessionHistory.length
  const mostImproved = state.sessionHistory.length > 0
    ? state.sessionHistory.reduce((best, h) => h.improvement > best.improvement ? h : best).focus
    : null
  const skillLevels = Object.entries(state.skillProfiles).map(([dim, level]) => ({ dimension: dim, level }))
  return { avgImprovement, totalSessions, mostImproved, skillLevels }
}

// Create a writing challenge
export function createChallenge(state: CoachState, type: string, difficulty: number): WritingChallenge {
  const descriptions: Record<string, string[]> = {
    pacing: ['Write a scene that slows down time', 'Create a fast-paced chase sequence', 'Balance multiple timelines'],
    dialogue: ['Write a confrontation with hidden meaning', 'Create a conversation with subtext', 'Write an argument where both sides are right'],
    description: ['Paint a scene using only sounds', 'Describe a location through one character\'s eyes', 'Use weather to reflect mood'],
    character: ['Give a character an impossible choice', 'Write a scene revealing character through action', 'Create an antagonist your reader sympathizes with'],
    plot: ['Plant a clue three chapters early', 'Write a twist that recontextualizes everything', 'Create a scene that could only happen one way'],
  }
  const options = descriptions[type] || ['Practice this skill area']
  const description = options[Math.floor(Math.random() * options.length)]
  const challenge: WritingChallenge = {
    id: `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: type as any,
    difficulty,
    description,
    targetSkill: type,
    completed: false,
  }
  return { ...state, challenges: [...state.challenges, challenge] } as any
}

// Complete a challenge
export function completeChallenge(state: CoachState, challengeId: string, score: number): CoachState {
  const challenges = state.challenges.map(c =>
    c.id === challengeId ? { ...c, completed: true } : c
  )
  // Update skill profile
  const completed = challenges.find(c => c.id === challengeId)
  if (completed && completed.targetSkill in state.skillProfiles) {
    const skillProfiles = { ...state.skillProfiles }
    skillProfiles[completed.targetSkill] = Math.min(100, skillProfiles[completed.targetSkill] + score / 10)
    return { ...state, challenges, skillProfiles }
  }
  return { ...state, challenges }
}

// Get next recommended challenge
export function getNextChallenge(state: CoachState): WritingChallenge | null {
  const incomplete = state.challenges.filter(c => !c.completed)
  if (incomplete.length > 0) return incomplete[0]
  // Create new challenge based on weakest skill
  const weakest = Object.entries(state.skillProfiles).sort((a, b) => a[1] - b[1])[0]
  return createChallenge(state, weakest[0], Math.max(1, Math.min(10, Math.floor(100 - weakest[1]) / 10)))
}

// Analyze writing sample and provide feedback
export function analyzeWritingSample(state: CoachState, text: string): CoachFeedback[] {
  const scores: Record<string, number> = {}
  // Simple heuristic scoring
  const sentences = text.split(/[.!?]+/).filter(s => s.trim())
  const words = text.split(/\s+/)
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0
  scores.sentenceStructure = Math.min(100, avgSentenceLength * 5)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  scores.wordChoice = Math.min(100, (uniqueWords.size / Math.max(1, words.length)) * 200)
  const dialogueMarkers = (text.match(/[""']/g) || []).length
  scores.dialogue = Math.min(100, dialogueMarkers * 5)
  const actionVerbs = (text.match(/\b(ran|jumped|moved|walked|turned|looked|said|asked)\b/gi) || []).length
  scores.pacing = Math.min(100, actionVerbs * 8)
  const descriptiveWords = (text.match(/\b(soft|hard|bright|dark|warm|cold|loud|quiet)\b/gi) || []).length
  scores.description = Math.min(100, descriptiveWords * 10)
  for (const dim of Object.keys(state.skillProfiles)) {
    if (!(dim in scores)) scores[dim] = 50
  }
  return generateCoachFeedback(state, scores)
}

// Update skill level manually
export function updateSkillLevel(state: CoachState, dimension: string, level: number): CoachState {
  if (!(dimension in state.skillProfiles)) return state
  return { ...state, skillProfiles: { ...state.skillProfiles, [dimension]: Math.max(0, Math.min(100, level)) } }
}

// Get recommended focus area
export function getRecommendedFocus(state: CoachState): string | null {
  const sorted = Object.entries(state.skillProfiles).sort((a, b) => a[1] - b[1])
  const lowest = sorted[0]
  return lowest[1] < 70 ? lowest[0] : null
}
