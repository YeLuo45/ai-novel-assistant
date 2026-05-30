/**
 * MultiAgentCritiqueRouterEngine — V515
 * Routes text fragments to specialized critique agents for parallel review pipeline.
 * Inspired by: chatdev (role specialization) + thunderbolt (feedback pipeline)
 *
 * Routes incoming text to specialized critique dimensions:
 * - PlotCritic: story structure, pacing, coherence
 * - DialogueCritic: conversation authenticity, subtext, pacing
 * - StyleCritic: prose quality, voice consistency, imagery
 * - EmotionCritic: emotional impact, arc consistency, reader engagement
 * - ContinuityCritic: factual consistency, timeline coherence
 */

export type CritiqueDimension = 'plot' | 'dialogue' | 'style' | 'emotion' | 'continuity'
export type CritiqueSeverity = 'info' | 'suggestion' | 'warning' | 'critical'
export type CritiqueStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface CritiqueRequest {
  id: string
  textFragment: string
  position: number       // 0-100 in chapter
  chapterNumber: number
  requestedDimensions: CritiqueDimension[]
  priority: number       // 1-5, higher = more urgent
  submittedAt: number
}

export interface CritiqueFinding {
  id: string
  dimension: CritiqueDimension
  severity: CritiqueSeverity
  location: { start: number, end: number }
  issue: string
  suggestion: string
  evidence: string
  confidence: number    // 0-100
}

export interface DimensionCritique {
  dimension: CritiqueDimension
  status: CritiqueStatus
  findings: CritiqueFinding[]
  score: number         // 0-100 quality score for this dimension
  summary: string
  startedAt?: number
  completedAt?: number
}

export interface CritiqueResponse {
  requestId: string
  dimensions: Record<CritiqueDimension, DimensionCritique>
  overallScore: number  // 0-100 weighted average
  criticalIssues: CritiqueFinding[]
  processingTimeMs: number
  recommendations: string[] // Prioritized improvement suggestions
}

export interface CritiquePipeline {
  id: string
  chapterNumber: number
  requests: CritiqueRequest[]
  responses: Record<string, CritiqueResponse>
  activeDimensions: CritiqueDimension[]
  completedDimensions: CritiqueDimension[]
  queueOrder: string[]   // Request IDs in queue order
  avgScore: number
  lastUpdate: number
}

export interface RouterState {
  pipelines: Record<string, CritiquePipeline>
  critiqueHistory: Record<string, CritiqueResponse>
  dimensionStats: Record<CritiqueDimension, { total: number, avgScore: number, avgFindings: number }>
  pendingQueue: string[] // Request IDs awaiting routing
  totalProcessed: number
  avgOverallScore: number
}

export function createEmptyState(): RouterState {
  return {
    pipelines: {},
    critiqueHistory: {},
    dimensionStats: {
      plot: { total: 0, avgScore: 50, avgFindings: 0 },
      dialogue: { total: 0, avgScore: 50, avgFindings: 0 },
      style: { total: 0, avgScore: 50, avgFindings: 0 },
      emotion: { total: 0, avgScore: 50, avgFindings: 0 },
      continuity: { total: 0, avgScore: 50, avgFindings: 0 }
    },
    pendingQueue: [],
    totalProcessed: 0,
    avgOverallScore: 50
  }
}

// --- Submission & Routing ---

export function submitForCritique(
  state: RouterState,
  textFragment: string,
  chapterNumber: number,
  position: number,
  requestedDimensions: CritiqueDimension[] = ['plot', 'dialogue', 'style', 'emotion', 'continuity'],
  priority: number = 3
): { state: RouterState, requestId: string } {
  const requestId = `crit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  const request: CritiqueRequest = {
    id: requestId,
    textFragment,
    position,
    chapterNumber,
    requestedDimensions,
    priority: Math.max(1, Math.min(5, priority)),
    submittedAt: Date.now()
  }

  // Find or create pipeline for this chapter
  const pipelineKey = `pipeline_${chapterNumber}`
  let pipeline = state.pipelines[pipelineKey]

  if (!pipeline) {
    pipeline = {
      id: pipelineKey,
      chapterNumber,
      requests: [],
      responses: {},
      activeDimensions: [],
      completedDimensions: [],
      queueOrder: [],
      avgScore: 50,
      lastUpdate: Date.now()
    }
  }

  // Route based on priority (higher priority = front of queue)
  const queueOrder = [...pipeline.queueOrder]
  if (priority >= 4) {
    queueOrder.unshift(requestId)
  } else {
    queueOrder.push(requestId)
  }

  const updatedPipeline: CritiquePipeline = {
    ...pipeline,
    requests: [...pipeline.requests, request],
    queueOrder,
    lastUpdate: Date.now()
  }

  return {
    state: {
      ...state,
      pipelines: { ...state.pipelines, [pipelineKey]: updatedPipeline },
      pendingQueue: [...state.pendingQueue, requestId]
    },
    requestId
  }
}

export function routeToDimension(
  state: RouterState,
  requestId: string,
  pipelineId: string,
  dimension: CritiqueDimension
): RouterState {
  const pipeline = state.pipelines[pipelineId]
  if (!pipeline) return state

  const request = pipeline.requests.find(r => r.id === requestId)
  if (!request) return state

  // Simulate routing decision based on text content
  const shouldRoute = request.requestedDimensions.includes(dimension)

  if (!shouldRoute) return state

  const activeDimensions = Array.from(new Set([...pipeline.activeDimensions, dimension]))

  return {
    ...state,
    pipelines: {
      ...state.pipelines,
      [pipelineId]: { ...pipeline, activeDimensions, lastUpdate: Date.now() }
    }
  }
}

// --- Parallel Critique Execution ---

export function executeCritique(
  state: RouterState,
  requestId: string,
  pipelineId: string
): RouterState {
  const pipeline = state.pipelines[pipelineId]
  if (!pipeline) return state

  const request = pipeline.requests.find(r => r.id === requestId)
  if (!request) return state

  const startTime = Date.now()
  const dimensions: Record<CritiqueDimension, DimensionCritique> = {} as any
  const text = request.textFragment

  for (const dim of request.requestedDimensions) {
    const findings = generateFindings(dim, text)
    const score = calculateDimensionScore(dim, text, findings)
    const summary = generateSummary(dim, findings, score)

    dimensions[dim] = {
      dimension: dim,
      status: 'completed',
      findings,
      score,
      summary,
      startedAt: startTime,
      completedAt: Date.now()
    }
  }

  const criticalIssues = Object.values(dimensions)
    .flatMap(d => d.findings)
    .filter(f => f.severity === 'critical')

  const overallScore = Object.values(dimensions)
    .reduce((sum, d) => sum + d.score, 0) / Object.keys(dimensions).length

  const recommendations = generateRecommendations(dimensions, criticalIssues)

  const response: CritiqueResponse = {
    requestId,
    dimensions,
    overallScore: Math.round(overallScore),
    criticalIssues,
    processingTimeMs: Date.now() - startTime,
    recommendations
  }

  const completedDimensions = request.requestedDimensions

  const updatedPipeline: CritiquePipeline = {
    ...pipeline,
    responses: { ...pipeline.responses, [requestId]: response },
    activeDimensions: pipeline.activeDimensions.filter(d => !completedDimensions.includes(d)),
    completedDimensions: Array.from(new Set([...pipeline.completedDimensions, ...completedDimensions])),
    queueOrder: pipeline.queueOrder.filter(id => id !== requestId),
    avgScore: (pipeline.avgScore * Object.keys(pipeline.responses).length + overallScore) / (Object.keys(pipeline.responses).length + 1),
    lastUpdate: Date.now()
  }

  // Update dimension stats
  const newDimensionStats = { ...state.dimensionStats }
  for (const [dim, critique] of Object.entries(dimensions) as [CritiqueDimension, DimensionCritique][]) {
    const stats = newDimensionStats[dim]
    const newTotal = stats.total + 1
    newDimensionStats[dim] = {
      total: newTotal,
      avgScore: Math.round((stats.avgScore * stats.total + critique.score) / newTotal),
      avgFindings: Math.round((stats.avgFindings * stats.total + critique.findings.length) / newTotal)
    }
  }

  const newTotal = state.totalProcessed + 1
  const newAvg = (state.avgOverallScore * state.totalProcessed + overallScore) / newTotal

  return {
    ...state,
    pipelines: { ...state.pipelines, [pipelineId]: updatedPipeline },
    critiqueHistory: { ...state.critiqueHistory, [requestId]: response },
    dimensionStats: newDimensionStats,
    pendingQueue: state.pendingQueue.filter(id => id !== requestId),
    totalProcessed: newTotal,
    avgOverallScore: Math.round(newAvg)
  }
}

// --- Finding Generation Helpers ---

function generateFindings(dimension: CritiqueDimension, text: string): CritiqueFinding[] {
  const findings: CritiqueFinding[] = []
  const words = text.split(/\s+/)
  const len = words.length

  if (dimension === 'plot') {
    if (len > 150) {
      findings.push({
        id: `f_${Math.random().toString(36).slice(2,6)}`,
        dimension, severity: 'suggestion',
        location: { start: 0, end: Math.min(50, len) },
        issue: 'Scene may be too long - consider breaking into smaller beats',
        suggestion: 'Split into multiple beats with distinct purposes',
        evidence: text.slice(0, 100),
        confidence: 75
      })
    }
    if (!text.includes('because') && !text.includes('so') && len > 50) {
      findings.push({
        id: `f_${Math.random().toString(36).slice(2,6)}`,
        dimension, severity: 'info',
        location: { start: Math.floor(len/2), end: len },
        issue: 'Limited causal connective tissue',
        suggestion: 'Add more cause-effect transitions',
        evidence: text.slice(0, 50),
        confidence: 60
      })
    }
  } else if (dimension === 'dialogue') {
    const dialogueCount = (text.match(/[""]/g) || []).length / 2
    if (dialogueCount === 0 && len > 30) {
      findings.push({
        id: `f_${Math.random().toString(36).slice(2,6)}`,
        dimension, severity: 'warning',
        location: { start: 0, end: len },
        issue: 'Long passage without dialogue - may slow pacing',
        suggestion: 'Consider adding character interaction',
        evidence: text.slice(0, 80),
        confidence: 70
      })
    }
    if (text.includes('said') && text.match(/said\s+\w+\s+said/)) {
      findings.push({
        id: `f_${Math.random().toString(36).slice(2,6)}`,
        dimension, severity: 'suggestion',
        location: { start: 0, end: len },
        issue: 'Repetitive dialogue tag pattern detected',
        suggestion: 'Vary dialogue attribution',
        evidence: text.slice(0, 60),
        confidence: 80
      })
    }
  } else if (dimension === 'style') {
    const hasAdverbs = (text.match(/\w+ly\b/g) || []).length
    if (hasAdverbs > len * 0.15) {
      findings.push({
        id: `f_${Math.random().toString(36).slice(2,6)}`,
        dimension, severity: 'suggestion',
        location: { start: 0, end: len },
        issue: 'High adverb density may weaken prose',
        suggestion: 'Replace some adverbs with stronger verbs',
        evidence: text.slice(0, 60),
        confidence: 75
      })
    }
  } else if (dimension === 'emotion') {
    if (len > 100 && !text.match(/felt|thought|heart|mind|emotion/g)) {
      findings.push({
        id: `f_${Math.random().toString(36).slice(2,6)}`,
        dimension, severity: 'info',
        location: { start: 0, end: len },
        issue: 'Limited internal emotional cue',
        suggestion: 'Add character internal reaction',
        evidence: text.slice(0, 60),
        confidence: 55
      })
    }
  } else if (dimension === 'continuity') {
    // Check for pronoun reference issues
    const pronouns = text.match(/\b(he|she|they|it|this|that)\b/gi) || []
    const nouns = text.match(/\b[A-Z][a-z]+\b/g) || []
    if (pronouns.length > nouns.length * 2) {
      findings.push({
        id: `f_${Math.random().toString(36).slice(2,6)}`,
        dimension, severity: 'warning',
        location: { start: 0, end: len },
        issue: 'High pronoun-to-noun ratio - possible ambiguity',
        suggestion: 'Ensure clear antecedent references',
        evidence: text.slice(0, 60),
        confidence: 65
      })
    }
  }

  return findings
}

function calculateDimensionScore(dimension: CritiqueDimension, text: string, findings: CritiqueFinding[]): number {
  let baseScore = 70 + Math.random() * 20 // 70-90

  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const warningCount = findings.filter(f => f.severity === 'warning').length
  const suggestionCount = findings.filter(f => f.severity === 'suggestion').length

  baseScore -= criticalCount * 20
  baseScore -= warningCount * 8
  baseScore -= suggestionCount * 3

  return Math.max(0, Math.min(100, Math.round(baseScore)))
}

function generateSummary(dimension: CritiqueDimension, findings: CritiqueFinding[], score: number): string {
  const count = findings.length
  if (count === 0) return `${dimension}: Clean passage, no issues detected.`
  const critical = findings.filter(f => f.severity === 'critical').length
  const warning = findings.filter(f => f.severity === 'warning').length
  if (critical > 0) return `${dimension}: ${critical} critical issue(s) need immediate attention.`
  if (warning > 0) return `${dimension}: ${warning} warning(s) should be reviewed.`
  return `${dimension}: ${count} suggestion(s) for improvement.`
}

function generateRecommendations(dimensions: Record<CritiqueDimension, DimensionCritique>, criticalIssues: CritiqueFinding[]): string[] {
  const recs: string[] = []
  if (criticalIssues.length > 0) {
    recs.push(`Fix ${criticalIssues.length} critical issue(s) before proceeding.`)
  }
  for (const [dim, critique] of Object.entries(dimensions) as [CritiqueDimension, DimensionCritique][]) {
    if (critique.score < 60) {
      recs.push(`Consider revising ${dim} dimension (score: ${critique.score}).`)
    }
    if (critique.findings.some(f => f.severity === 'warning')) {
      const warnings = critique.findings.filter(f => f.severity === 'warning')
      recs.push(`${dim}: Address ${warnings.length} warning(s).`)
    }
  }
  return recs.slice(0, 5)
}

// --- Query Functions ---

export function getPipelineStatus(state: RouterState, pipelineId: string): {
  totalRequests: number, completed: number, inProgress: number, pending: number, avgScore: number
} | null {
  const pipeline = state.pipelines[pipelineId]
  if (!pipeline) return null
  return {
    totalRequests: pipeline.requests.length,
    completed: Object.keys(pipeline.responses).length,
    inProgress: pipeline.activeDimensions.length,
    pending: pipeline.queueOrder.length,
    avgScore: Math.round(pipeline.avgScore)
  }
}

export function getDimensionLeaderboard(state: RouterState): { dimension: CritiqueDimension, avgScore: number }[] {
  return Object.entries(state.dimensionStats)
    .map(([dim, stats]) => ({ dimension: dim as CritiqueDimension, avgScore: stats.avgScore }))
    .sort((a, b) => b.avgScore - a.avgScore)
}

export function getCritiqueHistory(state: RouterState, limit: number = 10): CritiqueResponse[] {
  return Object.values(state.critiqueHistory)
    .sort((a, b) => b.processingTimeMs - a.processingTimeMs)
    .slice(0, limit)
}

export function getOverallStats(state: RouterState): {
  totalProcessed: number,
  avgOverallScore: number,
  avgProcessingTime: number,
  dimensionLeaderboard: { dimension: CritiqueDimension, avgScore: number }[]
} {
  const histories = Object.values(state.critiqueHistory)
  const avgTime = histories.length > 0
    ? Math.round(histories.reduce((s, r) => s + r.processingTimeMs, 0) / histories.length)
    : 0

  return {
    totalProcessed: state.totalProcessed,
    avgOverallScore: state.avgOverallScore,
    avgProcessingTime: avgTime,
    dimensionLeaderboard: getDimensionLeaderboard(state)
  }
}

export function getPendingRequests(state: RouterState): CritiqueRequest[] {
  return state.pendingQueue.map(id => {
    for (const pipeline of Object.values(state.pipelines)) {
      const req = pipeline.requests.find(r => r.id === id)
      if (req) return req
    }
    return null
  }).filter(Boolean) as CritiqueRequest[]
}