/**
 * NarrativeQualityScorer - V138
 * Multi-Dimensional Narrative Quality Assessment Engine
 * 
 * Design references:
 * - chatdev: role-based evaluation with multiple expert perspectives
 * - thunderbolt: pipeline feedback loops and iterative refinement
 * - claude-code: capability-based scoring with confidence metrics
 * - nanobot: distributed evaluation with health tracking
 * - generic-agent: autonomous goal-driven evaluation
 */

export type QualityDimension = 'pacing' | 'coherence' | 'characterization' | 'dialogue' | 'worldBuilding' | 'emotionalImpact' | 'proseStyle'
export type QualityGrade = 'failing' | 'belowExpectations' | 'meetsExpectations' | 'excellent' | 'outstanding'
export type ScoringMethod = 'rule-based' | 'pattern-matching' | 'heuristic' | 'comparative'

export interface NarrativeMetrics {
  pacingScore: number          // 0-100
  coherenceScore: number       // 0-100
  characterizationScore: number // 0-100
  dialogueScore: number        // 0-100
  worldBuildingScore: number    // 0-100
  emotionalImpactScore: number  // 0-100
  proseStyleScore: number       // 0-100
}

export interface DetailedScoring {
  dimension: QualityDimension
  score: number
  grade: QualityGrade
  confidence: number
  evidence: string[]
  suggestions: string[]
}

export interface SceneAssessment {
  sceneId: string
  metrics: NarrativeMetrics
  detailedScores: DetailedScoring[]
  overallScore: number
  grade: QualityGrade
  strengths: string[]
  weaknesses: string[]
  targetedSuggestions: string[]
}

export interface NarrativeQualityScorerState {
  // Thresholds for each grade
  gradeThresholds: Map<QualityGrade, { min: number; max: number }>
  
  // Scoring weights for overall calculation
  dimensionWeights: Map<QualityDimension, number>
  
  // Historical assessments for trend tracking
  assessmentHistory: SceneAssessment[]
  
  // Scoring method preferences
  preferredMethod: ScoringMethod
  
  // Aggregated stats
  totalScenesScored: number
  averageScores: Map<QualityDimension, number>
  mostCommonWeakness: QualityDimension | null
  
  // Configuration
  strictMode: boolean
  confidenceThreshold: number
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyScorerState(): NarrativeQualityScorerState {
  return {
    gradeThresholds: new Map([
      ['failing', { min: 0, max: 39 }],
      ['belowExpectations', { min: 40, max: 59 }],
      ['meetsExpectations', { min: 60, max: 74 }],
      ['excellent', { min: 75, max: 89 }],
      ['outstanding', { min: 90, max: 100 }],
    ]),
    dimensionWeights: new Map([
      ['pacing', 0.15],
      ['coherence', 0.18],
      ['characterization', 0.17],
      ['dialogue', 0.12],
      ['worldBuilding', 0.10],
      ['emotionalImpact', 0.15],
      ['proseStyle', 0.13],
    ]),
    assessmentHistory: [],
    preferredMethod: 'heuristic',
    totalScenesScored: 0,
    averageScores: new Map(),
    mostCommonWeakness: null,
    strictMode: false,
    confidenceThreshold: 0.6,
  }
}

// =============================================================================
// Core Scoring Functions
// =============================================================================

export function calculatePacingScore(content: string): { score: number; confidence: number; evidence: string[] } {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const wordCount = content.trim().split(/\s+/).length
  
  let score = 50
  const evidence: string[] = []
  
  // Sentence length variation
  const lengths = sentences.map(s => s.trim().split(/\s+/).length)
  if (lengths.length > 1) {
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const variance = lengths.reduce((a, b) => a + Math.abs(b - avgLen), 0) / lengths.length
    
    if (variance > 5) {
      score += 15
      evidence.push(`Good pacing variation (avg ${avgLen.toFixed(0)} words/sentence, variance ${variance.toFixed(1)})`)
    } else if (variance < 2) {
      score -= 10
      evidence.push(`Monotonous sentence length (variance ${variance.toFixed(1)})`)
    }
    
    // Ideal average: 12-20 words
    if (avgLen >= 12 && avgLen <= 20) {
      score += 10
      evidence.push(`Ideal sentence length (avg ${avgLen.toFixed(1)} words)`)
    } else if (avgLen < 10) {
      score -= 5
      evidence.push(`Sentences too short (avg ${avgLen.toFixed(1)} words)`)
    } else if (avgLen > 25) {
      score -= 5
      evidence.push(`Sentences too long (avg ${avgLen.toFixed(1)} words)`)
    }
  }
  
  // Action beats - exclamation marks indicate high intensity
  const exclamations = (content.match(/!/g) || []).length
  if (exclamations > 0 && exclamations <= sentences.length * 0.2) {
    score += 8
    evidence.push(`Good action beat density (${exclamations} exclamation marks)`)
  } else if (exclamations > sentences.length * 0.4) {
    score -= 5
    evidence.push(`Overuse of exclamation marks (${exclamations})`)
  }
  
  // Dialogue ratio
  const dialogueMatches = content.match(/["""].+?["""]/g) || []
  const dialogueRatio = dialogueMatches.length > 0 ? (dialogueMatches.length * 2) / Math.max(1, wordCount) : 0
  if (dialogueRatio > 0.1 && dialogueRatio < 0.5) {
    score += 7
    evidence.push(`Balanced dialogue ratio (${(dialogueRatio * 100).toFixed(0)}%)`)
  }
  
  // Paragraph breaks - creates rhythm
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paragraphs.length > 1 && paragraphs.length <= sentences.length) {
    score += 5
    evidence.push(`Good paragraph structure (${paragraphs.length} paragraphs)`)
  }
  
  const confidence = Math.min(1, sentences.length / 3 * 0.4 + Math.min(wordCount / 50, 1) * 0.6)
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

export function calculateCoherenceScore(content: string): { score: number; confidence: number; evidence: string[] } {
  let score = 50
  const evidence: string[] = []
  
  // pronoun consistency
  const pronouns = ['he', 'she', 'they', 'it', 'him', 'her', 'them', 'his', 'hers', 'their']
  const words = content.toLowerCase().split(/\s+/)
  const pronounCounts: Record<string, number> = {}
  
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '')
    if (pronouns.includes(clean)) {
      pronounCounts[clean] = (pronounCounts[clean] || 0) + 1
    }
  }
  
  // Check for subject consistency
  const heCount = (pronounCounts['he'] || 0) + (pronounCounts['him'] || 0) + (pronounCounts['his'] || 0)
  const sheCount = (pronounCounts['she'] || 0) + (pronounCounts['her'] || 0) + (pronounCounts['hers'] || 0)
  
  if ((heCount > 3 && sheCount > 3) && Math.abs(heCount - sheCount) < 2) {
    score -= 15
    evidence.push(`Pronoun confusion: ${heCount} he-references, ${sheCount} she-references`)
  } else if (heCount > 5 || sheCount > 5) {
    score += 8
    evidence.push(`Consistent pronoun usage (${Math.max(heCount, sheCount)} primary references)`)
  }
  
  // transitional words
  const transitions = ['however', 'therefore', 'moreover', 'furthermore', 'meanwhile', 'nevertheless', 'consequently', 'suddenly', 'then', 'after', 'before', 'when', 'while']
  const transitionCount = words.filter(w => transitions.includes(w.replace(/[^a-z]/g, ''))).length
  const transitionDensity = transitionCount / Math.max(1, words.length / 20)
  
  if (transitionDensity > 0.5) {
    score += 10
    evidence.push(`Good transition usage (${transitionCount} transitional elements)`)
  } else if (transitionDensity < 0.2 && words.length > 30) {
    score -= 8
    evidence.push(`Lack of transitions (only ${transitionCount} found)`)
  }
  
  // temporal consistency
  const pastVerbs = (content.match(/\b(was|were|had|did|went|said|thought|felt|saw|heard)\b/gi) || []).length
  const presentVerbs = (content.match(/\b(is|are|have|do|go|say|think|feel|see|hear)\b/gi) || []).length
  
  if (pastVerbs > presentVerbs * 3) {
    score += 5
    evidence.push('Consistent past tense narration')
  } else if (Math.abs(pastVerbs - presentVerbs) < 2 && pastVerbs > 0) {
    score -= 10
    evidence.push(`Tense inconsistency (${pastVerbs} past, ${presentVerbs} present)`)
  }
  
  const confidence = Math.min(1, words.length / 40)
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

export function calculateCharacterizationScore(content: string): { score: number; confidence: number; evidence: string[] } {
  let score = 50
  const evidence: string[] = []
  
  const words = content.split(/\s+/)
  
  // Dialogue for characterization
  const dialogueMatches = content.match(/["""]([^""]+)["""]/g) || []
  if (dialogueMatches.length >= 2) {
    score += 10
    evidence.push(`${dialogueMatches.length} dialogue segments for character development`)
  } else if (dialogueMatches.length === 0 && words.length > 30) {
    score -= 10
    evidence.push('No dialogue - limited characterization opportunity')
  }
  
  // Action descriptions
  const actionVerbs = /\b(run|walk|look|turn|reach|grab|pick|put|drop|open|close|move|stand|sit|lie)\b/gi
  const actions = (content.match(actionVerbs) || []).length
  if (actions >= 3) {
    score += 8
    evidence.push(`Good action variety (${actions} action verbs)`)
  }
  
  // Emotional language
  const emotionWords = /\b(happy|sad|angry|afraid|surprised|excited|nervous|calm|confused|proud|jealous|love|hate|fear|hope|despair|joy|sorrow)\b/gi
  const emotions = (content.match(emotionWords) || []).length
  if (emotions >= 2) {
    score += 10
    evidence.push(`Emotional depth (${emotions} emotion words)`)
  } else if (emotions === 0 && words.length > 50) {
    score -= 5
    evidence.push('Limited emotional expression')
  }
  
  // Internal thoughts
  const thoughtMarkers = /\b(thought|wondered|realized|believed|remembered|decided|hoped|feared)\b/gi
  const thoughts = (content.match(thoughtMarkers) || []).length
  if (thoughts >= 1) {
    score += 7
    evidence.push(`Internal perspective (${thoughts} thought markers)`)
  }
  
  // Character name mentions
  const properNouns = content.match(/\b[A-Z][a-z]+\b/g) || []
  if (properNouns.length >= 2) {
    score += 5
    evidence.push(`${properNouns.length} named characters`)
  }
  
  const confidence = Math.min(1, words.length / 50)
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

export function calculateDialogueScore(content: string): { score: number; confidence: number; evidence: string[] } {
  let score = 50
  const evidence: string[] = []
  
  const dialogueMatches = content.match(/["""]([^""]+)["""]/g) || []
  if (dialogueMatches.length === 0) {
    return { score: 0, confidence: 0.1, evidence: ['No dialogue present'] }
  }
  
  // Tag variety
  const saidAlternatives = /\b(whispered|shouted|muttered|replied|answered|asked|exclaimed|declared|stated|remarked|noted|observed)/gi
  const tags = (content.match(/\b[a-z]+ly\b/g) || []).filter(w => 
    ['whispered', 'shouted', 'muttered', 'replied', 'answered', 'asked', 'exclaimed', 'declared', 'stated', 'remarked', 'noted', 'observed'].includes(w)
  )
  
  const hasSaid = /\bsaid\b/i.test(content)
  if (!hasSaid && tags.length > 0) {
    score += 10
    evidence.push('Varied dialogue tags (no overused "said")')
  } else if (hasSaid && tags.length > 2) {
    score += 5
    evidence.push('Some dialogue tag variety')
  } else if (hasSaid && tags.length === 0) {
    score -= 5
    evidence.push('Overused "said" tag')
  }
  
  // Dialogue length balance
  const avgDialogueLen = dialogueMatches.reduce((acc, d) => acc + d.length, 0) / dialogueMatches.length
  if (avgDialogueLen >= 10 && avgDialogueLen <= 80) {
    score += 8
    evidence.push(`Balanced dialogue length (avg ${avgDialogueLen.toFixed(0)} chars)`)
  } else if (avgDialogueLen < 5) {
    score -= 10
    evidence.push('Dialogue too short')
  }
  
  // Conversation flow - multiple segments
  if (dialogueMatches.length >= 3) {
    score += 10
    evidence.push(`Good dialogue flow (${dialogueMatches.length} exchanges)`)
  } else if (dialogueMatches.length === 2) {
    score += 3
  }
  
  // Question dialogue
  const questions = dialogueMatches.filter(d => d.includes('?')).length
  if (questions > 0) {
    score += 3
    evidence.push(`${questions} questions for engagement`)
  }
  
  const confidence = Math.min(1, dialogueMatches.length / 2 * 0.3 + 0.7)
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

export function calculateWorldBuildingScore(content: string): { score: number; confidence: number; evidence: string[] } {
  let score = 50
  const evidence: string[] = []
  
  const words = content.split(/\s+/)
  
  // sensory details
  const sensoryWords = /\b(saw|heard|smelled|felt|tasted|noticed|observed|watched)\b/gi
  const sensory = (content.match(sensoryWords) || []).length
  if (sensory >= 2) {
    score += 10
    evidence.push(`Sensory richness (${sensory} sensory verbs)`)
  }
  
  // location references
  const locationWords = /\b(in|at|on|under|behind|above|below|beneath|beyond|inside|outside)\b/gi
  const locations = (content.match(locationWords) || []).length
  if (locations >= 2) {
    score += 8
    evidence.push(`Setting context (${locations} location references)`)
  }
  
  // descriptive adjectives
  const adjectives = content.match(/\b[a-z]+ly\b/g) || []
  const descriptiveAdvs = adjectives.filter(a => 
    ['slowly', 'quickly', 'carefully', 'suddenly', 'quietly', 'loudly', 'gently', 'roughly', 'brightly', 'darkly'].some(d => a === d)
  )
  if (descriptiveAdvs.length >= 2) {
    score += 7
    evidence.push(`Descriptive language (${descriptiveAdvs.length} adverbs)`)
  }
  
  // time references
  const timeWords = /\b(morning|afternoon|evening|night|dawn|dusk|summer|winter|spring|fall|autumn|yesterday|tomorrow|now|then|early|late)\b/gi
  const timeRefs = (content.match(timeWords) || []).length
  if (timeRefs >= 1) {
    score += 5
    evidence.push(`Temporal context (${timeRefs} time references)`)
  }
  
  // environment objects
  const envObjects = /\b(room|house|forest|river|mountain|sky|cloud|sun|moon|star|wall|floor|ceiling|door|window|table|chair|bed|road|path)\b/gi
  const envCount = (content.match(envObjects) || []).length
  if (envCount >= 3) {
    score += 8
    evidence.push(`Environment detail (${envCount} object references)`)
  }
  
  const confidence = Math.min(1, words.length / 60)
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

export function calculateEmotionalImpactScore(content: string): { score: number; confidence: number; evidence: string[] } {
  let score = 50
  const evidence: string[] = []
  
  const words = content.split(/\s+/)
  
  // Emotional vocabulary density
  const intenseEmotions = /\b(terror|horror|ecstasy|fury|despair|elation|anguish|triumph|devastation|exhilaration)/gi
  const mildEmotions = /\b(happy|sad|angry|afraid|surprised|excited|nervous|calm|confused|proud|jealous|love|hate|fear|hope)/gi
  
  const intense = (content.match(intenseEmotions) || []).length
  const mild = (content.match(mildEmotions) || []).length
  
  if (intense > 0) {
    score += Math.min(15, intense * 5)
    evidence.push(`High-intensity emotions (${intense} vivid emotional words)`)
  }
  if (mild >= 3) {
    score += 8
    evidence.push(`Emotional variety (${mild} emotion words)`)
  } else if (mild === 0 && words.length > 30) {
    score -= 8
    evidence.push('Limited emotional vocabulary')
  }
  
  // Sentence length for impact - longer sentences can build tension
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgLen = sentences.reduce((a, s) => a + s.trim().split(/\s+/).length, 0) / Math.max(1, sentences.length)
  
  if (avgLen > 20 && intense > 0) {
    score += 8
    evidence.push('Longer sentences building emotional tension')
  }
  
  // Exclamation for impact
  const exclamations = (content.match(/!/g) || []).length
  if (exclamations >= 1 && exclamations <= 3) {
    score += 5
    evidence.push(`${exclamations} exclamation marks for emphasis`)
  } else if (exclamations > 5) {
    score -= 5
    evidence.push('Overuse of exclamation marks dilutes impact')
  }
  
  // Contrast elements
  const contrastWords = ['but', 'however', 'yet', 'although', 'nevertheless', 'despite', 'except']
  const contrastCount = words.filter(w => contrastWords.includes(w.toLowerCase())).length
  if (contrastCount >= 1) {
    score += 5
    evidence.push(`Emotional contrast (${contrastCount} contrast elements)`)
  }
  
  const confidence = Math.min(1, words.length / 50 + intense * 0.1)
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

export function calculateProseStyleScore(content: string): { score: number; confidence: number; evidence: string[] } {
  let score = 50
  const evidence: string[] = []
  
  const words = content.split(/\s+/)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Vocabulary richness
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')))
  const richness = uniqueWords.size / Math.max(1, words.length)
  
  if (richness > 0.6) {
    score += 12
    evidence.push(`Rich vocabulary (${(richness * 100).toFixed(0)}% unique words)`)
  } else if (richness < 0.4) {
    score -= 8
    evidence.push(`Repetitive vocabulary (${(richness * 100).toFixed(0)}% unique words)`)
  }
  
  // Sentence variety
  const lengths = sentences.map(s => s.trim().split(/\s+/).length)
  const variance = lengths.length > 1 
    ? lengths.reduce((a, b) => a + Math.abs(b - lengths.reduce((s, t) => s + t, 0) / lengths.length), 0) / lengths.length
    : 0
  
  if (variance > 6) {
    score += 10
    evidence.push(`Excellent sentence variety (variance ${variance.toFixed(1)})`)
  } else if (variance < 3 && sentences.length > 2) {
    score -= 8
    evidence.push('Uniform sentence structure')
  }
  
  // Show don't tell indicators
  const tellingWords = /\b(was|were|had|seemed|appeared|looked|felt|sounded|tasted|smelled)\b/gi
  const showingVerbs = /\b(walked|ran|jumped|fell|rose|dropped|grabbed|reached|touched|pushed|pulled)\b/gi
  const telling = (content.match(tellingWords) || []).length
  const showing = (content.match(showingVerbs) || []).length
  
  if (showing > telling && showing > 0) {
    score += 10
    evidence.push("Strong \"show don\x27t tell\" balance")
  } else if (telling > showing * 2) {
    score -= 10
    evidence.push('Too much "telling" over "showing"')
  }
  
  // Opening quality - first sentence impact
  if (sentences.length > 0) {
    const first = sentences[0]
    if (first.trim().split(/\s+/).length >= 8) {
      score += 5
      evidence.push('Strong opening sentence')
    } else if (first.trim().split(/\s+/).length < 4) {
      score -= 3
      evidence.push('Weak opening sentence')
    }
  }
  
  const confidence = Math.min(1, words.length / 50)
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

// =============================================================================
// Assessment Functions
// =============================================================================

export function scoreNarrative(
  state: NarrativeQualityScorerState,
  content: string,
  sceneId: string
): SceneAssessment {
  const pacing = calculatePacingScore(content)
  const coherence = calculateCoherenceScore(content)
  const characterization = calculateCharacterizationScore(content)
  const dialogue = calculateDialogueScore(content)
  const worldBuilding = calculateWorldBuildingScore(content)
  const emotionalImpact = calculateEmotionalImpactScore(content)
  const proseStyle = calculateProseStyleScore(content)
  
  const metrics: NarrativeMetrics = {
    pacingScore: pacing.score,
    coherenceScore: coherence.score,
    characterizationScore: characterization.score,
    dialogueScore: dialogue.score,
    worldBuildingScore: worldBuilding.score,
    emotionalImpactScore: emotionalImpact.score,
    proseStyleScore: proseStyle.score,
  }
  
  const detailedScores: DetailedScoring[] = [
    { dimension: 'pacing', score: pacing.score, grade: getGrade(pacing.score, state), confidence: pacing.confidence, evidence: pacing.evidence, suggestions: generateSuggestions('pacing', pacing.score) },
    { dimension: 'coherence', score: coherence.score, grade: getGrade(coherence.score, state), confidence: coherence.confidence, evidence: coherence.evidence, suggestions: generateSuggestions('coherence', coherence.score) },
    { dimension: 'characterization', score: characterization.score, grade: getGrade(characterization.score, state), confidence: characterization.confidence, evidence: characterization.evidence, suggestions: generateSuggestions('characterization', characterization.score) },
    { dimension: 'dialogue', score: dialogue.score, grade: getGrade(dialogue.score, state), confidence: dialogue.confidence, evidence: dialogue.evidence, suggestions: generateSuggestions('dialogue', dialogue.score) },
    { dimension: 'worldBuilding', score: worldBuilding.score, grade: getGrade(worldBuilding.score, state), confidence: worldBuilding.confidence, evidence: worldBuilding.evidence, suggestions: generateSuggestions('worldBuilding', worldBuilding.score) },
    { dimension: 'emotionalImpact', score: emotionalImpact.score, grade: getGrade(emotionalImpact.score, state), confidence: emotionalImpact.confidence, evidence: emotionalImpact.evidence, suggestions: generateSuggestions('emotionalImpact', emotionalImpact.score) },
    { dimension: 'proseStyle', score: proseStyle.score, grade: getGrade(proseStyle.score, state), confidence: proseStyle.confidence, evidence: proseStyle.evidence, suggestions: generateSuggestions('proseStyle', proseStyle.score) },
  ]
  
  // Calculate weighted overall
  let weightedSum = 0
  let weightTotal = 0
  for (const [dim, weight] of Array.from(state.dimensionWeights.entries())) {
    const score = metrics[`${dim}Score` as keyof NarrativeMetrics] as number
    weightedSum += score * weight
    weightTotal += weight
  }
  const overallScore = Math.round(weightedSum / weightTotal)
  
  // Determine strengths and weaknesses
  const sortedScores = [...detailedScores].sort((a, b) => a.score - b.score)
  const weaknesses = sortedScores.filter(s => s.score < 60).map(s => `${s.dimension}: ${s.score}`)
  const strengths = sortedScores.filter(s => s.score >= 75).map(s => `${s.dimension}: ${s.score}`)
  
  const assessment: SceneAssessment = {
    sceneId,
    metrics,
    detailedScores,
    overallScore,
    grade: getGrade(overallScore, state),
    strengths,
    weaknesses,
    targetedSuggestions: detailedScores
      .filter(s => s.score < 70)
      .flatMap(s => s.suggestions)
      .slice(0, 3),
  }
  
  // Update state history
  const newHistory = [...state.assessmentHistory, assessment]
  const newTotal = state.totalScenesScored + 1
  
  // Update average scores
  const newAverages = new Map(state.averageScores)
  for (const [dim, score] of Object.entries(metrics)) {
    const dimKey = dim.replace('Score', '') as QualityDimension
    const currentAvg = newAverages.get(dimKey) || 50
    newAverages.set(dimKey, (currentAvg * state.totalScenesScored + score) / newTotal)
  }
  
  // Track most common weakness
  const weaknessCounts: Record<string, number> = {}
  for (const w of weaknesses) {
    const dim = w.split(':')[0]
    weaknessCounts[dim] = (weaknessCounts[dim] || 0) + 1
  }
  let mostCommon: QualityDimension | null = null
  let maxCount = 0
  for (const [dim, count] of Object.entries(weaknessCounts)) {
    if (count > maxCount) {
      maxCount = count
      mostCommon = dim as QualityDimension
    }
  }
  
  return assessment
}

function getGrade(score: number, state: NarrativeQualityScorerState): QualityGrade {
  for (const [grade, range] of Array.from(state.gradeThresholds.entries())) {
    if (score >= range.min && score <= range.max) return grade
  }
  return 'failing'
}

function generateSuggestions(dimension: QualityDimension, score: number): string[] {
  if (score >= 80) return [`${dimension} is excellent - maintain consistency`]
  if (score >= 70) return [`Slight improvement possible in ${dimension}`]
  if (score >= 50) return [`Focus on ${dimension} development`]
  return [`Critical: ${dimension} needs significant improvement`]
}

// =============================================================================
// Formatters
// =============================================================================

export function formatSceneAssessment(assessment: SceneAssessment): string {
  const lines = [
    `=== Scene Assessment: ${assessment.sceneId} ===`,
    `Overall Score: ${assessment.overallScore}/100 (${assessment.grade})`,
    '',
    '--- Dimension Scores ---',
  ]
  
  for (const ds of assessment.detailedScores) {
    lines.push(`  ${ds.dimension}: ${ds.score}/100 (${ds.grade}) [confidence: ${(ds.confidence * 100).toFixed(0)}%]`)
    if (ds.evidence.length > 0) {
      for (const e of ds.evidence.slice(0, 2)) {
        lines.push(`    → ${e}`)
      }
    }
  }
  
  if (assessment.strengths.length > 0) {
    lines.push('')
    lines.push('--- Strengths ---')
    for (const s of assessment.strengths) {
      lines.push(`  + ${s}`)
    }
  }
  
  if (assessment.weaknesses.length > 0) {
    lines.push('')
    lines.push('--- Weaknesses ---')
    for (const w of assessment.weaknesses) {
      lines.push(`  ! ${w}`)
    }
  }
  
  if (assessment.targetedSuggestions.length > 0) {
    lines.push('')
    lines.push('--- Top Suggestions ---')
    for (const s of assessment.targetedSuggestions) {
      lines.push(`  → ${s}`)
    }
  }
  
  return lines.join('\n')
}

export function formatScorerDashboard(state: NarrativeQualityScorerState): string {
  const lines = [
    '=== Narrative Quality Scorer Dashboard ===',
    `Total Scenes Scored: ${state.totalScenesScored}`,
    `Preferred Method: ${state.preferredMethod}`,
    `Strict Mode: ${state.strictMode ? 'ON' : 'OFF'}`,
    '',
  ]
  
  if (state.averageScores.size > 0) {
    lines.push('--- Average Scores ---')
    const sorted = Array.from(state.averageScores.entries())
      .sort((a, b) => a[1] - b[1])
    
    for (const [dim, avg] of sorted) {
      const grade = getGrade(avg, state)
      lines.push(`  ${dim}: ${avg.toFixed(1)} (${grade})`)
    }
  }
  
  if (state.mostCommonWeakness) {
    lines.push('')
    lines.push(`Most Common Weakness: ${state.mostCommonWeakness}`)
  }
  
  return lines.join('\n')
}
