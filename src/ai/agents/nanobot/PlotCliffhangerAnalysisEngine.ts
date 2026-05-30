/**
 * PlotCliffhangerAnalysisEngine — V517
 * Hierarchical cliffhanger detection, tension building, and suspense classification.
 * Inspired by: ruflo-design (hierarchical decomposition), NarrativeEntropyEngine patterns
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type SuspenseType = 'information' | 'emotion' | 'conflict' | 'destiny'

export type TensionLevel = 'low' | 'medium' | 'high' | 'critical'

export interface CliffhangerPoint {
  position: number           // 0-1, relative position in narrative
  suspenseType: SuspenseType
  tensionLevel: TensionLevel
  intensity: number         // 0-100, raw tension intensity
  markers: string[]         // detected tension markers
  description: string
  unresolvedConflict: boolean
  emotionalPeak: boolean
}

export interface TensionBuild {
  position: number
  technique: 'question' | 'implication' | 'threat' | 'reversal' | 'cliffhanger'
  intensity: number         // 0-100
  targetType: SuspenseType
  text: string
  suggestion?: string
}

export interface SuspenseClassification {
  primaryType: SuspenseType
  secondaryTypes: SuspenseType[]
  confidence: number        // 0-1
  evidence: string[]
  intensity: number        // 0-100
}

export interface PlotCliffhangerState {
  cliffhangerPoints: CliffhangerPoint[]
  tensionBuilds: TensionBuild[]
  classifications: SuspenseClassification[]
  overallTensionArc: number[]  // 0-100 tension at each narrative segment
  criticalMoments: number[]    // positions of critical tension points
}

// ============================================================
// CLIFFHANGER DETECTOR
// ============================================================

const SUSPENSE_KEYWORDS: Record<SuspenseType, string[]> = {
  information: ['secret', 'truth', 'revealed', 'discovered', 'hidden', 'unknown', 'mystery', 'clue', 'evidence'],
  emotion: ['tears', 'heart', 'love', 'hate', 'fear', 'pain', 'loss', 'betrayal', 'hope', 'despair'],
  conflict: ['fight', 'battle', 'war', 'argument', 'challenge', 'opponent', 'enemy', 'attack', 'defend'],
  destiny: ['fate', 'prophecy', 'chosen', 'doomed', 'inevitable', 'curse', 'blessing', 'destined']
}

const TENSION_MARKERS = [
  'but', 'however', 'yet', 'suddenly', 'without warning', 'just then',
  'at that moment', 'in that instant', 'as if', 'what if', 'suppose',
  'secret', 'hidden', 'unknown', 'mystery', 'danger', 'threat'
]

const CRITICAL_TENSION_PHRASES = [
  'the truth about', 'what no one knew', 'in that moment',
  'everything changed', 'nothing would be the same',
  'no one could have predicted', 'the moment that would'
]

/**
 * Tokenize text into words
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
}

/**
 * Calculate word frequencies from text
 */
export function calculateFrequencies(text: string): Record<string, number> {
  const words = tokenizeText(text)
  const frequencies: Record<string, number> = {}
  for (const word of words) {
    frequencies[word] = (frequencies[word] || 0) + 1
  }
  return frequencies
}

/**
 * Detect suspense type keywords in text
 */
export function detectSuspenseKeywords(text: string): Record<SuspenseType, number> {
  const lower = text.toLowerCase()
  const result: Record<SuspenseType, number> = {
    information: 0,
    emotion: 0,
    conflict: 0,
    destiny: 0
  }
  
  for (const [type, keywords] of Object.entries(SUSPENSE_KEYWORDS) as [SuspenseType, string[]][]) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        result[type]++
      }
    }
  }
  
  return result
}

/**
 * Classify suspense type based on text content
 */
export function classifySuspenseType(text: string): SuspenseClassification {
  const keywordCounts = detectSuspenseKeywords(text)
  const words = tokenizeText(text)
  const totalKeywords = Object.values(keywordCounts).reduce((sum, count) => sum + count, 0)
  
  if (totalKeywords === 0) {
    return {
      primaryType: 'conflict',
      secondaryTypes: [],
      confidence: 0.3,
      evidence: [],
      intensity: 20
    }
  }
  
  // Find primary type (highest count)
  let primaryType: SuspenseType = 'conflict'
  let maxCount = 0
  for (const [type, count] of Object.entries(keywordCounts) as [SuspenseType, number][]) {
    if (count > maxCount) {
      maxCount = count
      primaryType = type
    }
  }
  
  // Secondary types (counts > 0 but not primary)
  const secondaryTypes = (Object.entries(keywordCounts) as [SuspenseType, number][])
    .filter(([type, count]) => count > 0 && type !== primaryType)
    .map(([type]) => type)
  
  // Confidence based on keyword density
  const keywordDensity = totalKeywords / Math.max(words.length, 1)
  const confidence = Math.min(1, keywordDensity * 2 + 0.3)
  
  // Intensity based on keyword count and variety
  const intensity = Math.min(100, (totalKeywords * 10) + (Object.keys(keywordCounts).filter(k => keywordCounts[k as SuspenseType] > 0).length * 15))
  
  // Evidence: collect matching keywords
  const evidence: string[] = []
  const lowerText = text.toLowerCase()
  for (const [type, keywords] of Object.entries(SUSPENSE_KEYWORDS) as [SuspenseType, string[]][]) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        evidence.push(keyword)
      }
    }
  }
  
  return {
    primaryType,
    secondaryTypes,
    confidence: Math.min(1, confidence),
    evidence: Array.from(new Set(evidence)).slice(0, 10),
    intensity: Math.min(100, intensity)
  }
}

/**
 * Detect tension markers in text
 */
export function detectTensionMarkers(text: string): string[] {
  const lower = text.toLowerCase()
  return TENSION_MARKERS.filter(marker => lower.includes(marker))
}

/**
 * Calculate tension intensity (0-100) based on various factors
 */
export function calculateTensionIntensity(
  text: string,
  classification: SuspenseClassification,
  markerCount: number,
  hasQuestion: boolean,
  sentenceLength: number
): number {
  let intensity = 30  // Base intensity
  
  // Add classification intensity
  intensity += classification.intensity * 0.4
  
  // Add marker contribution
  intensity += markerCount * 8
  
  // Question adds tension
  if (hasQuestion) intensity += 15
  
  // Short punchy sentences add tension
  if (sentenceLength < 20) intensity += 10
  else if (sentenceLength > 50) intensity -= 10
  
  // Critical phrases add significant tension
  const lower = text.toLowerCase()
  for (const phrase of CRITICAL_TENSION_PHRASES) {
    if (lower.includes(phrase)) {
      intensity += 20
      break
    }
  }
  
  return Math.min(100, Math.max(0, intensity))
}

/**
 * Determine tension level from intensity
 */
export function getTensionLevel(intensity: number): TensionLevel {
  if (intensity >= 85) return 'critical'
  if (intensity >= 65) return 'high'
  if (intensity >= 35) return 'medium'
  return 'low'
}

/**
 * Detect cliffhanger points in text segments
 */
export function detectCliffhangerPoints(
  segments: Array<{ text: string; position: number }>
): CliffhangerPoint[] {
  const points: CliffhangerPoint[] = []
  
  for (const segment of segments) {
    const { text, position } = segment
    if (!text.trim()) continue
    
    const classification = classifySuspenseType(text)
    const markers = detectTensionMarkers(text)
    const hasQuestion = text.includes('?')
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    const avgSentenceLength = sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
      : 0
    
    const intensity = calculateTensionIntensity(
      text,
      classification,
      markers.length,
      hasQuestion,
      avgSentenceLength
    )
    
    const tensionLevel = getTensionLevel(intensity)
    
    // Check for unresolved conflict indicators
    const unresolvedIndicators = ['would', 'could', 'should', 'must', 'need to', 'will be', 'going to']
    const unresolvedConflict = unresolvedIndicators.some(ind => text.toLowerCase().includes(ind))
    
    // Emotional peak detection
    const emotionalWords = ['tears', 'screamed', 'cried', 'broke', 'shattered', 'overwhelmed', 'devastated']
    const emotionalPeak = emotionalWords.some(w => text.toLowerCase().includes(w))
    
    if (intensity >= 35) {
      points.push({
        position,
        suspenseType: classification.primaryType,
        tensionLevel,
        intensity,
        markers,
        description: `Tension ${tensionLevel} (${classification.primaryType}) at position ${position.toFixed(2)}`,
        unresolvedConflict,
        emotionalPeak
      })
    }
  }
  
  return points
}

// ============================================================
// TENSION BUILDER
// ============================================================

export interface TensionBuildOptions {
  targetType?: SuspenseType
  targetIntensity?: number
  technique?: TensionBuild['technique']
}

/**
 * Build tension at specified position
 */
export function buildTension(
  position: number,
  text: string,
  options: TensionBuildOptions = {}
): TensionBuild {
  const { targetType = 'conflict', targetIntensity = 70, technique = 'cliffhanger' } = options
  
  const classification = classifySuspenseType(text)
  
  let suggestion: string | undefined
  if (targetIntensity > classification.intensity) {
    const gap = targetIntensity - classification.intensity
    if (gap > 30) {
      suggestion = `Consider adding stronger tension markers or ${technique} techniques`
    }
  }
  
  return {
    position,
    technique,
    intensity: Math.max(classification.intensity, targetIntensity * 0.6),
    targetType,
    text,
    suggestion
  }
}

/**
 * Build tension using question technique
 */
export function buildTensionWithQuestion(position: number, context: string): TensionBuild {
  return {
    position,
    technique: 'question',
    intensity: 65,
    targetType: 'information',
    text: context,
    suggestion: 'Add a rhetorical question to create information suspense'
  }
}

/**
 * Build tension using implication technique
 */
export function buildTensionWithImplication(position: number, context: string): TensionBuild {
  return {
    position,
    technique: 'implication',
    intensity: 60,
    targetType: 'destiny',
    text: context,
    suggestion: 'Hint at future consequences without revealing details'
  }
}

/**
 * Build tension using threat technique
 */
export function buildTensionWithThreat(position: number, context: string): TensionBuild {
  return {
    position,
    technique: 'threat',
    intensity: 75,
    targetType: 'conflict',
    text: context,
    suggestion: 'Introduce an antagonist threat or looming danger'
  }
}

/**
 * Build tension using reversal technique
 */
export function buildTensionWithReversal(position: number, context: string): TensionBuild {
  return {
    position,
    technique: 'reversal',
    intensity: 70,
    targetType: 'emotion',
    text: context,
    suggestion: 'Introduce an unexpected turn that challenges expectations'
  }
}

/**
 * Build tension using cliffhanger technique
 */
export function buildTensionWithCliffhanger(position: number, context: string): TensionBuild {
  return {
    position,
    technique: 'cliffhanger',
    intensity: 80,
    targetType: 'conflict',
    text: context,
    suggestion: 'End with immediate danger or unresolved decision'
  }
}

// ============================================================
// SUSPENSE CLASSIFIER
// ============================================================

export interface SuspenseClassificationResult {
  classifications: SuspenseClassification[]
  dominantType: SuspenseType
  averageIntensity: number
  tensionArc: number[]
}

/**
 * Classify suspense across multiple segments
 */
export function classifySuspenseAcrossSegments(
  segments: Array<{ text: string; position: number }>
): SuspenseClassificationResult {
  const classifications: SuspenseClassification[] = []
  const tensionArc: number[] = []
  
  for (const segment of segments) {
    const classification = classifySuspenseType(segment.text)
    classifications.push(classification)
    tensionArc.push(classification.intensity)
  }
  
  // Find dominant type
  const typeCounts: Record<SuspenseType, number> = {
    information: 0, emotion: 0, conflict: 0, destiny: 0
  }
  for (const c of classifications) {
    typeCounts[c.primaryType]++
    for (const st of c.secondaryTypes) {
      typeCounts[st] += 0.5
    }
  }
  
  let dominantType: SuspenseType = 'conflict'
  let maxCount = 0
  for (const [type, count] of Object.entries(typeCounts) as [SuspenseType, number][]) {
    if (count > maxCount) {
      maxCount = count
      dominantType = type
    }
  }
  
  const averageIntensity = classifications.length > 0
    ? classifications.reduce((sum, c) => sum + c.intensity, 0) / classifications.length
    : 0
  
  return {
    classifications,
    dominantType,
    averageIntensity,
    tensionArc
  }
}

/**
 * Refine classification with context awareness
 */
export function refineClassification(
  classification: SuspenseClassification,
  previousClassification?: SuspenseClassification
): SuspenseClassification {
  if (!previousClassification) return classification
  
  // If types are similar, boost confidence
  const sharedTypes = [classification.primaryType, ...classification.secondaryTypes]
    .filter(t => t === previousClassification.primaryType || previousClassification.secondaryTypes.includes(t))
  
  if (sharedTypes.length > 0) {
    return {
      ...classification,
      confidence: Math.min(1, classification.confidence * 1.2)
    }
  }
  
  return classification
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

export function createEmptyCliffhangerState(): PlotCliffhangerState {
  return {
    cliffhangerPoints: [],
    tensionBuilds: [],
    classifications: [],
    overallTensionArc: [],
    criticalMoments: []
  }
}

/**
 * Add cliffhanger point to state
 */
export function addCliffhangerPoint(
  state: PlotCliffhangerState,
  point: CliffhangerPoint
): PlotCliffhangerState {
  const cliffhangerPoints = [...state.cliffhangerPoints, point]
  
  // Update critical moments
  let criticalMoments = state.criticalMoments
  if (point.tensionLevel === 'critical') {
    criticalMoments = [...state.criticalMoments, point.position]
  }
  
  return {
    ...state,
    cliffhangerPoints,
    criticalMoments: Array.from(new Set(criticalMoments)).sort()
  }
}

/**
 * Add tension build to state
 */
export function addTensionBuild(
  state: PlotCliffhangerState,
  build: TensionBuild
): PlotCliffhangerState {
  return {
    ...state,
    tensionBuilds: [...state.tensionBuilds, build]
  }
}

/**
 * Add classification to state
 */
export function addClassification(
  state: PlotCliffhangerState,
  classification: SuspenseClassification
): PlotCliffhangerState {
  return {
    ...state,
    classifications: [...state.classifications, classification]
  }
}

/**
 * Update overall tension arc
 */
export function updateTensionArc(
  state: PlotCliffhangerState,
  arc: number[]
): PlotCliffhangerState {
  return {
    ...state,
    overallTensionArc: arc
  }
}

// ============================================================
// MAIN ANALYSIS ENGINE
// ============================================================

export interface AnalysisOptions {
  windowSize?: number
  stepSize?: number
  detectCritical?: boolean
  buildTensionPoints?: boolean
}

export interface PlotCliffhangerAnalysis {
  state: PlotCliffhangerState
  summary: {
    totalCliffhangerPoints: number
    criticalMomentsCount: number
    dominantSuspenseType: SuspenseType
    averageTension: number
    tensionPeaks: number[]
    recommendations: string[]
  }
}

/**
 * Segment text into parts for analysis
 */
export function segmentText(text: string, windowSize: number = 50, stepSize: number = 25): Array<{ text: string; position: number }> {
  const words = tokenizeText(text)
  const segments: Array<{ text: string; position: number }> = []
  
  for (let i = 0; i <= words.length - windowSize; i += stepSize) {
    const segmentWords = words.slice(i, i + windowSize)
    const segmentText = segmentWords.join(' ')
    const position = i / Math.max(words.length, 1)
    segments.push({ text: segmentText, position })
  }
  
  return segments
}

/**
 * Analyze narrative for cliffhanger opportunities
 */
export function analyzePlotCliffhangers(
  text: string,
  options: AnalysisOptions = {}
): PlotCliffhangerAnalysis {
  const {
    windowSize = 50,
    stepSize = 25,
    detectCritical = true,
    buildTensionPoints = true
  } = options
  
  // Create empty state
  let state = createEmptyCliffhangerState()
  
  // Segment text
  const segments = segmentText(text, windowSize, stepSize)
  
  // Detect cliffhanger points
  const cliffhangerPoints = detectCliffhangerPoints(segments)
  for (const point of cliffhangerPoints) {
    state = addCliffhangerPoint(state, point)
  }
  
  // Classify suspense across segments
  const suspenseResult = classifySuspenseAcrossSegments(segments)
  for (const classification of suspenseResult.classifications) {
    state = addClassification(state, classification)
  }
  
  // Build tension at key points if requested
  if (buildTensionPoints) {
    // Find low-tension areas and build tension there
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const classification = classifySuspenseType(seg.text)
      
      if (classification.intensity < 50 && i > 0) {
        // Build tension here
        const techniques: TensionBuild['technique'][] = ['question', 'implication', 'threat', 'reversal', 'cliffhanger']
        const technique = techniques[i % techniques.length]
        
        const build = buildTension(seg.position, seg.text, {
          targetType: classification.primaryType,
          targetIntensity: 65,
          technique
        })
        state = addTensionBuild(state, build)
      }
    }
  }
  
  // Update tension arc
  state = updateTensionArc(state, suspenseResult.tensionArc)
  
  // Build summary
  const criticalCount = state.cliffhangerPoints.filter(p => p.tensionLevel === 'critical').length
  const tensionPeaks = findTensionPeaks(suspenseResult.tensionArc)
  
  const recommendations: string[] = []
  if (criticalCount === 0) {
    recommendations.push('Consider adding at least one critical tension moment')
  }
  if (suspenseResult.averageIntensity < 40) {
    recommendations.push('Overall tension is low - add more suspense markers')
  }
  if (tensionPeaks.length < 2) {
    recommendations.push('Add more tension peaks throughout the narrative')
  }
  
  const summary = {
    totalCliffhangerPoints: cliffhangerPoints.length,
    criticalMomentsCount: criticalCount,
    dominantSuspenseType: suspenseResult.dominantType,
    averageTension: suspenseResult.averageIntensity,
    tensionPeaks,
    recommendations
  }
  
  return { state, summary }
}

/**
 * Find peaks in tension arc
 */
export function findTensionPeaks(arc: number[], threshold: number = 70): number[] {
  const peaks: number[] = []
  
  for (let i = 1; i < arc.length - 1; i++) {
    if (arc[i] > threshold && arc[i] > arc[i - 1] && arc[i] > arc[i + 1]) {
      peaks.push(i)
    }
  }
  
  return peaks
}

/**
 * Get cliffhanger summary from state
 */
export function getCliffhangerSummary(state: PlotCliffhangerState): {
  pointCount: number
  criticalCount: number
  buildCount: number
  averageIntensity: number
  typeBreakdown: Record<SuspenseType, number>
} {
  const pointCount = state.cliffhangerPoints.length
  const criticalCount = state.cliffhangerPoints.filter(p => p.tensionLevel === 'critical').length
  const buildCount = state.tensionBuilds.length
  
  const averageIntensity = pointCount > 0
    ? state.cliffhangerPoints.reduce((sum, p) => sum + p.intensity, 0) / pointCount
    : 0
  
  const typeBreakdown: Record<SuspenseType, number> = {
    information: 0, emotion: 0, conflict: 0, destiny: 0
  }
  for (const point of state.cliffhangerPoints) {
    typeBreakdown[point.suspenseType]++
  }
  
  return {
    pointCount,
    criticalCount,
    buildCount,
    averageIntensity,
    typeBreakdown
  }
}