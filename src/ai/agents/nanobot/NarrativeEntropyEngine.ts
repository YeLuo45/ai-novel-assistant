/**
 * NarrativeEntropyEngine — V513
 * Narrative entropy calculation, anomaly detection, and pacing feedback.
 * Inspired by: thunderbolt-design (pipeline/feedback loops) + Shannon entropy formula
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface EntropyResult {
  entropy: number        // 0-1, where 1 = maximum entropy (uniform distribution)
  normalizedEntropy: number // entropy normalized by log2 of vocabulary size
  wordFrequencies: Record<string, number>
  vocabularySize: number
  totalWords: number
  topWords: Array<{ word: string; frequency: number; probability: number }>
}

export interface AnomalyDetectionResult {
  isAnomalous: boolean
  anomalyType: 'high_density' | 'low_density' | 'normal' | null
  anomalyScore: number   // 0-1, confidence of anomaly detection
  windowIndex: number
  expectedEntropy: number
  actualEntropy: number
  deviation: number
}

export interface PacingFeedback {
  suggestion: 'accelerate' | 'decelerate' | 'maintain' | 'analyze'
  confidence: number      // 0-1
  reason: string
  entropyContext: {
    currentEntropy: number
    trend: 'increasing' | 'decreasing' | 'stable'
    volatility: number    // 0-1, std deviation of entropy
  }
  recommendedPacing: number  // 0-100, slow to fast
}

export interface NarrativeEntropyState {
  entropyHistory: EntropyResult[]
  anomalyLog: AnomalyDetectionResult[]
  pacingHistory: PacingFeedback[]
  currentEntropy: number
  averageEntropy: number
  entropyTrend: 'increasing' | 'decreasing' | 'stable'
}

// ============================================================
// ENTROPY CALCULATOR
// ============================================================

/**
 * Calculate word frequencies from text
 */
export function calculateWordFrequencies(text: string): Record<string, number> {
  const words = tokenize(text)
  const frequencies: Record<string, number> = {}
  
  for (const word of words) {
    frequencies[word] = (frequencies[word] || 0) + 1
  }
  
  return frequencies
}

/**
 * Tokenize text into words (lowercase, alphanumeric only)
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
}

/**
 * Calculate Shannon entropy for word frequency distribution
 * H = -sum(p * log2(p)) for all words
 */
export function calculateShannonEntropy(frequencies: Record<string, number>): number {
  const totalWords = Object.values(frequencies).reduce((sum, count) => sum + count, 0)
  
  if (totalWords === 0) return 0
  
  let entropy = 0
  for (const count of Object.values(frequencies)) {
    const probability = count / totalWords
    if (probability > 0) {
      entropy -= probability * Math.log2(probability)
    }
  }
  
  return entropy
}

/**
 * Calculate normalized entropy (0-1 scale)
 * Normalized by maximum possible entropy (log2 of vocabulary size)
 */
export function calculateNormalizedEntropy(entropy: number, vocabularySize: number): number {
  if (vocabularySize <= 1) return entropy > 0 ? 1 : 0
  const maxEntropy = Math.log2(vocabularySize)
  return entropy / maxEntropy
}

/**
 * Calculate narrative entropy for a text segment
 * High entropy = diverse vocabulary (complex, informational)
 * Low entropy = repetitive vocabulary (simple, rhythmic, or troubled writing)
 */
export function calculateEntropy(text: string): EntropyResult {
  const frequencies = calculateWordFrequencies(text)
  const totalWords = Object.values(frequencies).reduce((sum, count) => sum + count, 0)
  const vocabularySize = Object.keys(frequencies).length
  
  const entropy = calculateShannonEntropy(frequencies)
  const normalizedEntropy = calculateNormalizedEntropy(entropy, vocabularySize)
  
  // Sort words by frequency for top words analysis
  const sortedEntries = Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
  
  const topWords = sortedEntries.slice(0, 10).map(([word, count]) => ({
    word,
    frequency: count,
    probability: count / totalWords
  }))
  
  return {
    entropy,
    normalizedEntropy,
    wordFrequencies: frequencies,
    vocabularySize,
    totalWords,
    topWords
  }
}

/**
 * Calculate entropy with context (sliding window approach)
 */
export function calculateEntropyWithWindows(
  text: string,
  windowSize: number = 50,
  stepSize: number = 25
): EntropyResult[] {
  const words = tokenize(text)
  const results: EntropyResult[] = []
  
  for (let i = 0; i <= words.length - windowSize; i += stepSize) {
    const windowText = words.slice(i, i + windowSize).join(' ')
    results.push(calculateEntropy(windowText))
  }
  
  return results
}

// ============================================================
// ANOMALY DETECTOR
// ============================================================

export interface AnomalyThresholds {
  highDensityUpper: number   // entropy above this = too dense/complex
  lowDensityLower: number     // entropy below this = too simple/repetitive
  deviationThreshold: number // std dev multiplier for anomaly detection
}

export const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  highDensityUpper: 0.85,
  lowDensityLower: 0.15,
  deviationThreshold: 1.5
}

/**
 * Calculate rolling statistics for entropy values
 */
export function calculateRollingStatistics(values: number[], window: number): {
  mean: number
  stdDev: number
  values: number[]
} {
  const sliced = values.slice(-window)
  if (sliced.length === 0) {
    return { mean: 0, stdDev: 0, values: [] }
  }
  const mean = sliced.reduce((sum, v) => sum + v, 0) / sliced.length
  const variance = sliced.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sliced.length
  const stdDev = Math.sqrt(variance)
  
  return { mean, stdDev, values: sliced }
}

/**
 * Detect anomalies in entropy values
 */
export function detectAnomaly(
  entropy: number,
  rollingStats: { mean: number; stdDev: number },
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS
): AnomalyDetectionResult {
  const deviation = entropy - rollingStats.mean
  const normalizedDeviation = rollingStats.stdDev > 0 
    ? Math.abs(deviation) / rollingStats.stdDev 
    : 0
  
  // Check threshold-based anomalies
  if (entropy > thresholds.highDensityUpper) {
    return {
      isAnomalous: true,
      anomalyType: 'high_density',
      anomalyScore: Math.min(1, normalizedDeviation / thresholds.deviationThreshold),
      windowIndex: 0,
      expectedEntropy: rollingStats.mean,
      actualEntropy: entropy,
      deviation
    }
  }
  
  if (entropy < thresholds.lowDensityLower) {
    return {
      isAnomalous: true,
      anomalyType: 'low_density',
      anomalyScore: Math.min(1, normalizedDeviation / thresholds.deviationThreshold),
      windowIndex: 0,
      expectedEntropy: rollingStats.mean,
      actualEntropy: entropy,
      deviation
    }
  }
  
  // Check statistical anomalies
  if (normalizedDeviation > thresholds.deviationThreshold) {
    const anomalyType = deviation > 0 ? 'high_density' : 'low_density'
    return {
      isAnomalous: true,
      anomalyType,
      anomalyScore: Math.min(1, (normalizedDeviation - thresholds.deviationThreshold) / thresholds.deviationThreshold),
      windowIndex: 0,
      expectedEntropy: rollingStats.mean,
      actualEntropy: entropy,
      deviation
    }
  }
  
  return {
    isAnomalous: false,
    anomalyType: null,
    anomalyScore: 0,
    windowIndex: 0,
    expectedEntropy: rollingStats.mean,
    actualEntropy: entropy,
    deviation
  }
}

/**
 * Analyze entropy windows for anomalies
 */
export function analyzeEntropyAnomalies(
  entropyResults: EntropyResult[],
  windowSize: number = 5
): AnomalyDetectionResult[] {
  const entropies = entropyResults.map(r => r.normalizedEntropy)
  const results: AnomalyDetectionResult[] = []
  
  for (let i = windowSize - 1; i < entropies.length; i++) {
    const windowValues = entropies.slice(i - windowSize + 1, i + 1)
    const stats = calculateRollingStatistics(entropyResults.map(r => r.normalizedEntropy), windowSize)
    
    const anomaly = detectAnomaly(entropies[i], stats)
    anomaly.windowIndex = i
    results.push(anomaly)
  }
  
  return results
}

// ============================================================
// PACING FEEDBACK ENGINE
// ============================================================

export interface PacingThresholds {
  accelerateThreshold: number   // entropy drop below this suggests acceleration needed
  decelerateThreshold: number    // entropy above this suggests deceleration needed
  stabilityThreshold: number      // entropy std dev below this = stable pacing
}

export const DEFAULT_PACING_THRESHOLDS: PacingThresholds = {
  accelerateThreshold: 0.25,
  decelerateThreshold: 0.75,
  stabilityThreshold: 0.1
}

/**
 * Calculate entropy trend from history
 */
export function calculateEntropyTrend(entropies: number[], window: number = 5): 'increasing' | 'decreasing' | 'stable' {
  if (entropies.length < 2) return 'stable'
  
  const recent = entropies.slice(-window)
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
  const secondHalf = recent.slice(Math.floor(recent.length / 2))
  
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length
  
  const diff = secondAvg - firstAvg
  const threshold = 0.05
  
  if (diff > threshold) return 'increasing'
  if (diff < -threshold) return 'decreasing'
  return 'stable'
}

/**
 * Calculate volatility (standard deviation) of entropy values
 */
export function calculateEntropyVolatility(entropies: number[], window: number = 10): number {
  if (entropies.length < 2) return 0
  
  const recent = entropies.slice(-window)
  const mean = recent.reduce((s, v) => s + v, 0) / recent.length
  const variance = recent.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / recent.length
  
  return Math.sqrt(variance)
}

/**
 * Generate pacing feedback based on entropy analysis
 */
export function generatePacingFeedback(
  entropyHistory: EntropyResult[],
  thresholds: PacingThresholds = DEFAULT_PACING_THRESHOLDS
): PacingFeedback {
  if (entropyHistory.length === 0) {
    return {
      suggestion: 'analyze',
      confidence: 0,
      reason: 'Insufficient data for pacing analysis',
      entropyContext: {
        currentEntropy: 0,
        trend: 'stable',
        volatility: 0
      },
      recommendedPacing: 50
    }
  }
  
  const entropies = entropyHistory.map(e => e.normalizedEntropy)
  const currentEntropy = entropies[entropies.length - 1]
  const trend = calculateEntropyTrend(entropies)
  const volatility = calculateEntropyVolatility(entropies)
  
  let suggestion: PacingFeedback['suggestion']
  let reason: string
  let confidence: number
  let recommendedPacing: number
  
  // Decision logic based on entropy and trend
  if (currentEntropy < thresholds.accelerateThreshold) {
    suggestion = 'accelerate'
    reason = `Very low entropy (${currentEntropy.toFixed(2)}) indicates repetitive text. Accelerate pacing to increase narrative momentum.`
    confidence = Math.min(1, (thresholds.accelerateThreshold - currentEntropy) / thresholds.accelerateThreshold + 0.3)
    recommendedPacing = Math.round(70 + (1 - currentEntropy) * 30)
  } else if (currentEntropy > thresholds.decelerateThreshold) {
    suggestion = 'decelerate'
    reason = `High entropy (${currentEntropy.toFixed(2)}) indicates complex/dense text. Decelerate pacing to allow readers to process details.`
    confidence = Math.min(1, (currentEntropy - thresholds.decelerateThreshold) / (1 - thresholds.decelerateThreshold) + 0.3)
    recommendedPacing = Math.round(30 + (1 - currentEntropy) * 30)
  } else if (trend === 'decreasing' && volatility < thresholds.stabilityThreshold) {
    suggestion = 'maintain'
    reason = `Stable low entropy with decreasing trend. Current pacing is appropriate for the narrative state.`
    confidence = 0.7
    recommendedPacing = 50
  } else if (trend === 'increasing' && currentEntropy > 0.5) {
    suggestion = 'decelerate'
    reason = `Increasing entropy trend approaching high threshold. Consider slowing pace to manage complexity growth.`
    confidence = 0.75
    recommendedPacing = 40
  } else if (volatility > thresholds.stabilityThreshold * 2) {
    suggestion = 'analyze'
    reason = `High volatility detected. The narrative may benefit from more consistent pacing to stabilize reader expectations.`
    confidence = 0.6
    recommendedPacing = 50
  } else {
    suggestion = 'maintain'
    reason = `Entropy within healthy range with stable trend. Current pacing is well-suited for the narrative.`
    confidence = 0.85
    recommendedPacing = 50
  }
  
  return {
    suggestion,
    confidence: Math.min(1, Math.max(0, confidence)),
    reason,
    entropyContext: {
      currentEntropy,
      trend,
      volatility
    },
    recommendedPacing: Math.min(100, Math.max(0, recommendedPacing))
  }
}

/**
 * Generate pacing feedback from multiple entropy windows
 */
export function generatePacingFeedbackFromWindows(
  entropyResults: EntropyResult[]
): PacingFeedback {
  return generatePacingFeedback(entropyResults)
}

// ============================================================
// NARRATIVE ENTROPY STATE MANAGEMENT
// ============================================================

export function createEmptyEntropyState(): NarrativeEntropyState {
  return {
    entropyHistory: [],
    anomalyLog: [],
    pacingHistory: [],
    currentEntropy: 0,
    averageEntropy: 0,
    entropyTrend: 'stable'
  }
}

export function addEntropyResult(state: NarrativeEntropyState, result: EntropyResult): NarrativeEntropyState {
  const entropyHistory = [...state.entropyHistory, result]
  const entropies = entropyHistory.map(e => e.normalizedEntropy)
  const averageEntropy = entropies.reduce((s, v) => s + v, 0) / entropies.length
  const entropyTrend = calculateEntropyTrend(entropies)
  
  return {
    ...state,
    entropyHistory,
    currentEntropy: result.normalizedEntropy,
    averageEntropy,
    entropyTrend
  }
}

export function addAnomalyResult(state: NarrativeEntropyState, anomaly: AnomalyDetectionResult): NarrativeEntropyState {
  return {
    ...state,
    anomalyLog: [...state.anomalyLog, anomaly]
  }
}

export function addPacingFeedback(state: NarrativeEntropyState, feedback: PacingFeedback): NarrativeEntropyState {
  return {
    ...state,
    pacingHistory: [...state.pacingHistory, feedback]
  }
}

/**
 * Process text and return complete entropy analysis
 */
export function analyzeNarrativeEntropy(
  text: string,
  windowSize: number = 50,
  stepSize: number = 25
): {
  overallEntropy: EntropyResult
  windows: EntropyResult[]
  anomalies: AnomalyDetectionResult[]
  pacingFeedback: PacingFeedback
} {
  const windows = calculateEntropyWithWindows(text, windowSize, stepSize)
  const overallEntropy = calculateEntropy(text)
  const anomalies = analyzeEntropyAnomalies(windows)
  const pacingFeedback = generatePacingFeedback(windows)
  
  return {
    overallEntropy,
    windows,
    anomalies,
    pacingFeedback
  }
}

export function getEntropySummary(state: NarrativeEntropyState): {
  currentEntropy: number
  averageEntropy: number
  trend: 'increasing' | 'decreasing' | 'stable'
  anomalyCount: number
  pacingSuggestion: string
} {
  return {
    currentEntropy: state.currentEntropy,
    averageEntropy: state.averageEntropy,
    trend: state.entropyTrend,
    anomalyCount: state.anomalyLog.filter(a => a.isAnomalous).length,
    pacingSuggestion: state.pacingHistory.length > 0 
      ? state.pacingHistory[state.pacingHistory.length - 1].suggestion 
      : 'analyze'
  }
}