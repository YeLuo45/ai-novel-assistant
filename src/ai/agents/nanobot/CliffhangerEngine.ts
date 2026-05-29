/**
 * CliffhangerEngine — V381
 * Chapter ending optimization, suspense building, reader retention analysis.
 * Inspired by: thunderbolt (feedback loops), generic-agent (optimization), chatdev (engagement)
 */

export type CliffhangerType = 'question' | 'revelation' | 'action' | 'suspense' | 'threat' | 'emotional' | 'mystery'

export interface CliffhangerAnalysis {
  cliffhangerType: CliffhangerType | null
  suspenseScore: number  // 0-100
  emotionalImpact: number  // 0-100
  clickThroughLikelihood: number  // 0-100 (will reader continue?)
  qualityRating: 'poor' | 'adequate' | 'good' | 'excellent'
  suggestions: string[]
}

export interface ChapterEnding {
  chapterId: string
  text: string
  endingType: CliffhangerType
  wordCount: number
  lastSceneType: string
  analysis?: CliffhangerAnalysis
}

export interface CliffhangerState {
  endings: ChapterEnding[]
  bestEndings: string[]  // chapterIds with excellent ratings
  worstEndings: string[]  // chapterIds with poor ratings
  averageSuspense: number
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): CliffhangerState {
  return { endings: [], bestEndings: [], worstEndings: [], averageSuspense: 50, typeAlias: {} }
}

function classifyEnding(text: string): CliffhangerType {
  const lower = text.toLowerCase().trim()
  if (lower.endsWith('?')) return 'question'
  if (['secret', 'truth', 'revealed', 'discovered', 'found out'].some(w => lower.includes(w))) return 'revelation'
  if (['!', 'crashed', 'fell', 'ran', 'shot', 'attacked', 'grabbed'].some(w => lower.includes(w))) return 'action'
  if (['but', 'however', 'suddenly', 'without warning'].some(w => ` ${lower}.includes(' ${w}'`))) return 'suspense'
  if (['kill', 'threat', 'danger', 'will destroy', 'hunt'].some(w => lower.includes(w))) return 'threat'
  if (['love', 'heart', 'tears', 'embrace', 'cry'].some(w => lower.includes(w))) return 'emotional'
  return 'mystery'
}

export function analyzeEnding(
  text: string,
  lastSceneType: string = 'unknown'
): CliffhangerAnalysis {
  const cliffhangerType = classifyEnding(text)
  const words = text.split(/\s+/)
  const wordCount = words.length
  
  // Suspense factors
  let suspenseScore = 30
  if (cliffhangerType === 'question') suspenseScore += 25
  else if (cliffhangerType === 'action') suspenseScore += 20
  else if (cliffhangerType === 'suspense') suspenseScore += 30
  else if (cliffhangerType === 'threat') suspenseScore += 25
  else if (cliffhangerType === 'revelation') suspenseScore += 22
  
  // Short, punchy endings create more suspense
  if (wordCount >= 5 && wordCount <= 30) suspenseScore += 15
  else if (wordCount > 60) suspenseScore -= 10
  
  // Open loops
  const openLoopWords = ['would', 'could', 'should', 'must', 'need']
  suspenseScore += openLoopWords.filter(w => ` ${text.toLowerCase()}.includes(' ${w}'`)).length * 5
  
  suspenseScore = Math.min(100, Math.max(0, suspenseScore))
  
  // Emotional impact
  let emotionalImpact = 20
  const emotionalWords = ['tears', 'heart', 'love', 'hate', 'fear', 'scream', 'cry', 'pain', 'loss', 'betrayal']
  emotionalImpact += emotionalWords.filter(w => lower.includes(w)).length * 15
  if (cliffhangerType === 'emotional') emotionalImpact += 20
  emotionalImpact = Math.min(100, emotionalImpact)
  
  // Click through likelihood
  let clickThroughLikelihood = 40
  if (suspenseScore > 60) clickThroughLikelihood += 25
  if (emotionalImpact > 50) clickThroughLikelihood += 20
  if (wordCount <= 20) clickThroughLikelihood += 15
  clickThroughLikelihood = Math.min(100, clickThroughLikelihood)
  
  // Quality rating
  const totalScore = suspenseScore + emotionalImpact + clickThroughLikelihood
  let qualityRating: CliffhangerAnalysis['qualityRating'] = 'poor'
  if (totalScore > 200) qualityRating = 'excellent'
  else if (totalScore > 150) qualityRating = 'good'
  else if (totalScore > 100) qualityRating = 'adequate'
  
  // Suggestions
  const suggestions: string[] = []
  if (wordCount > 50) suggestions.push('Cut the ending shorter - 15-25 words max')
  if (suspenseScore < 50) suggestions.push('Add a question or悬念 to hook the reader')
  if (emotionalImpact < 40) suggestions.push('Add an emotional beat to increase investment')
  if (cliffhangerType === 'mystery') suggestions.push('Make the mystery more specific - name what is unknown')
  if (!['question', 'action', 'suspense', 'threat'].some(t => t === cliffhangerType)) {
    suggestions.push('Consider ending with action or a direct question')
  }
  
  return { cliffhangerType, suspenseScore, emotionalImpact, clickThroughLikelihood, qualityRating, suggestions }
}

export function registerEnding(
  state: CliffhangerState,
  chapterId: string,
  text: string,
  lastSceneType: string = 'unknown'
): CliffhangerState {
  const analysis = analyzeEnding(text, lastSceneType)
  const endingType = classifyEnding(text)
  const words = text.split(/\s+/).length
  
  const ending: ChapterEnding = { chapterId, text, endingType, wordCount: words, lastSceneType, analysis }
  const endings = [...state.endings.filter(e => e.chapterId !== chapterId), ending]
  
  // Update best/worst
  let bestEndings = state.bestEndings.filter(id => id !== chapterId)
  let worstEndings = state.worstEndings.filter(id => id !== chapterId)
  if (analysis.qualityRating === 'excellent') bestEndings = [...bestEndings, chapterId]
  if (analysis.qualityRating === 'poor') worstEndings = [...worstEndings, chapterId]
  
  const avgSuspense = endings.reduce((s, e) => s + (e.analysis?.suspenseScore || 50), 0) / endings.length
  
  return { ...state, endings, bestEndings, worstEndings, averageSuspense: Math.round(avgSuspense) }
}

export function compareEndings(state: CliffhangerState, ch1: string, ch2: string): {
  moreSuspenseful: string
  higherImpact: string
  betterQuality: string
} {
  const e1 = state.endings.find(e => e.chapterId === ch1)
  const e2 = state.endings.find(e => e.chapterId === ch2)
  if (!e1 || !e2) return { moreSuspenseful: ch1, higherImpact: ch1, betterQuality: ch1 }
  return {
    moreSuspenseful: (e1.analysis?.suspenseScore || 0) > (e2.analysis?.suspenseScore || 0) ? ch1 : ch2,
    higherImpact: (e1.analysis?.emotionalImpact || 0) > (e2.analysis?.emotionalImpact || 0) ? ch1 : ch2,
    betterQuality: (e1.analysis?.clickThroughLikelihood || 0) > (e2.analysis?.clickThroughLikelihood || 0) ? ch1 : ch2,
  }
}

export function getEndingStats(state: CliffhangerState): {
  totalEndings: number
  avgSuspense: number
  bestCount: number
  worstCount: number
  typeDistribution: Record<CliffhangerType, number>
} {
  const typeDistribution: Record<CliffhangerType, number> = {
    question: 0, revelation: 0, action: 0, suspense: 0, threat: 0, emotional: 0, mystery: 0,
  }
  for (const e of state.endings) typeDistribution[e.endingType]++
  return {
    totalEndings: state.endings.length,
    avgSuspense: state.averageSuspense,
    bestCount: state.bestEndings.length,
    worstCount: state.worstEndings.length,
    typeDistribution,
  }
}
