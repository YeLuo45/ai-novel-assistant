/**
 * MultiPOVSwitchingEngine — V519
 * Multi-POV narrative switching detection, consistency checking, and switch effect analysis.
 * Inspired by: nanobot-design (distributed mesh architecture)
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type POVType = 'first_person' | 'third_person' | 'omniscient' | 'second_person' | 'unknown'

export interface POVSegment {
  id: string
  startIndex: number
  endIndex: number
  povType: POVType
  characterName: string | null
  confidence: number  // 0-1, confidence of POV detection
  rawIndicators: string[]  // what triggered this detection
}

export interface POVSwitch {
  from: POVType
  to: POVType
  character: string | null
  position: number
  smoothness: 'abrupt' | 'gradual' | 'seamless'
  narrativeDistanceChange: 'closer' | 'farther' | 'same'
}

export interface POVConsistencyResult {
  isConsistent: boolean
  violations: POVViolation[]
  overallScore: number  // 0-1
  details: string
}

export interface POVViolation {
  type: 'inner_thought_leak' | 'omniscient_knowledge' | 'sensory_mismatch' | 'temporal_inconsistency'
  severity: 'minor' | 'moderate' | 'major'
  position: number
  description: string
  characterContext: string | null
}

export interface POVSwitchEffect {
  switchIndex: number
  fromPOV: POVType
  toPOV: POVType
  narrativeDistanceBefore: number  // 0-1, 0=very intimate, 1=very distant
  narrativeDistanceAfter: number
  emotionalProximityBefore: number  // 0-1
  emotionalProximityAfter: number
  readabilityImpact: number  // -1 to 1, negative=harder
  recommendedTransition: 'keep' | 'strengthen' | 'soften' | 'remove'
  reason: string
}

export interface MultiPOVState {
  segments: POVSegment[]
  switches: POVSwitch[]
  consistencyResults: POVConsistencyResult[]
  switchEffects: POVSwitchEffect[]
  currentPOV: POVType
  dominantPOV: POVType | null
  povDistribution: Record<POVType, number>  // percentage of text in each POV
}

// ============================================================
// POV DETECTOR
// ============================================================

const FIRST_PERSON_PRONOUNS = ['i', 'me', 'my', 'mine', 'myself', 'we', 'our', 'ours', 'ourselves']
const SECOND_PERSON_PRONOUNS = ['you', 'your', 'yours', 'yourself', 'yourselves']
const THIRD_PERSON_PRONOUNS = ['he', 'she', 'it', 'they', 'him', 'her', 'them', 'his', 'hers', 'its', 'their', 'theirs']
const OMNISCIENT_INDICATORS = ['she knew', 'he sensed', 'they realized', 'the world knew', 'fate would', 'destiny', 'in the distance', 'beyond the horizon', 'the winds carried', 'the stars watched']
const INNER_THOUGHT_INDICATORS = ['thought', 'wondered', 'realized', 'felt', 'knew', 'believed', 'hoped', 'feared', 'remembered', 'imagined', 'wondered', 'considered']

/**
 * Detect POV type from text segment
 */
export function detectPOVType(text: string): { povType: POVType; confidence: number; indicators: string[] } {
  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)

  let firstPersonScore = 0
  let secondPersonScore = 0
  let thirdPersonScore = 0
  let omniscientScore = 0

  const indicators: string[] = []

  // Check for first-person pronouns
  for (const pronoun of FIRST_PERSON_PRONOUNS) {
    const regex = new RegExp(`\\b${pronoun}\\b`, 'g')
    const matches = lowerText.match(regex)
    if (matches) {
      firstPersonScore += matches.length
      indicators.push(`${pronoun}:${matches.length}`)
    }
  }

  // Check for second-person pronouns
  for (const pronoun of SECOND_PERSON_PRONOUNS) {
    const regex = new RegExp(`\\b${pronoun}\\b`, 'g')
    const matches = lowerText.match(regex)
    if (matches) {
      secondPersonScore += matches.length
      indicators.push(`${pronoun}:${matches.length}`)
    }
  }

  // Check for third-person pronouns
  for (const pronoun of THIRD_PERSON_PRONOUNS) {
    const regex = new RegExp(`\\b${pronoun}\\b`, 'g')
    const matches = lowerText.match(regex)
    if (matches) {
      thirdPersonScore += matches.length
      indicators.push(`${pronoun}:${matches.length}`)
    }
  }

  // Check for omniscient indicators
  for (const indicator of OMNISCIENT_INDICATORS) {
    if (lowerText.includes(indicator)) {
      omniscientScore += 1
      indicators.push(indicator)
    }
  }

  // Determine POV type
  let povType: POVType = 'unknown'
  let maxScore = 0
  const totalPronounScore = firstPersonScore + secondPersonScore + thirdPersonScore

  if (totalPronounScore === 0 && omniscientScore > 0) {
    povType = 'omniscient'
    maxScore = omniscientScore / 5
  } else if (totalPronounScore === 0) {
    povType = 'unknown'
    maxScore = 0
  } else {
    if (firstPersonScore > maxScore) {
      povType = 'first_person'
      maxScore = firstPersonScore
    }
    if (secondPersonScore > maxScore) {
      povType = 'second_person'
      maxScore = secondPersonScore
    }
    if (thirdPersonScore > maxScore) {
      // If third-person dominates but there are inner thoughts, might be limited third
      const hasInnerThoughts = INNER_THOUGHT_INDICATORS.some(ind => lowerText.includes(ind))
      if (hasInnerThoughts && firstPersonScore < 2) {
        povType = 'third_person'  // limited third
      } else if (omniscientScore > 1) {
        povType = 'omniscient'
        maxScore = omniscientScore
      } else {
        povType = 'third_person'
        maxScore = thirdPersonScore
      }
    }
  }

  // Calculate confidence
  const confidence = totalPronounScore > 0
    ? Math.min(1, totalPronounScore / 10)
    : omniscientScore > 0
      ? Math.min(0.9, omniscientScore / 3)
      : 0

  return { povType, confidence, indicators }
}

/**
 * Extract character name from POV segment
 */
export function extractCharacterName(text: string, povType: POVType): string | null {
  if (povType === 'first_person' || povType === 'second_person') {
    // In first-person, narrator is typically the speaker
    // Look for name in context
    const namePattern = /(?:^|\s)([A-Z][a-z]+)\s+(?:was|is|said|thought|felt|went|saw|heard)/
    const match = text.match(namePattern)
    if (match) return match[1]
  }

  // In third person, look for character before attribution
  const thirdPersonPattern = /([A-Z][a-z]+)\s+(?:was|is|said|thought|felt|saw|heard)/
  const match = text.match(thirdPersonPattern)
  if (match) return match[1]

  return null
}

/**
 * Segment text by POV
 */
export function segmentTextByPOV(text: string, minSegmentLength: number = 50): POVSegment[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const segments: POVSegment[] = []
  let currentSegment = ''
  let currentStart = 0
  let currentPOV: POVType = 'unknown'
  let currentConfidence = 0
  let currentIndicators: string[] = []
  let segmentIdCounter = 0

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    const detection = detectPOVType(sentence)

    if (currentPOV === 'unknown') {
      // Start new segment
      currentPOV = detection.povType
      currentConfidence = detection.confidence
      currentIndicators = detection.indicators
      currentSegment = sentence
      currentStart = text.indexOf(sentence)
    } else if (detection.povType === currentPOV || detection.confidence < 0.2) {
      // Continue current segment
      currentSegment += ' ' + sentence
      currentConfidence = (currentConfidence + detection.confidence) / 2
      currentIndicators = [...currentIndicators, ...detection.indicators]
    } else {
      // Save current segment and start new one
      if (currentSegment.length >= minSegmentLength) {
        segments.push({
          id: `pov-${segmentIdCounter++}`,
          startIndex: currentStart,
          endIndex: currentStart + currentSegment.length,
          povType: currentPOV,
          characterName: extractCharacterName(currentSegment, currentPOV),
          confidence: currentConfidence,
          rawIndicators: Array.from(new Set(currentIndicators)).slice(0, 20)
        })
      }
      currentPOV = detection.povType
      currentConfidence = detection.confidence
      currentIndicators = detection.indicators
      currentSegment = sentence
      currentStart = text.indexOf(sentence)
    }
  }

  // Don't forget the last segment
  if (currentSegment.length >= minSegmentLength && currentPOV !== 'unknown') {
    segments.push({
      id: `pov-${segmentIdCounter++}`,
      startIndex: currentStart,
      endIndex: currentStart + currentSegment.length,
      povType: currentPOV,
      characterName: extractCharacterName(currentSegment, currentPOV),
      confidence: currentConfidence,
      rawIndicators: Array.from(new Set(currentIndicators)).slice(0, 20)
    })
  }

  return segments
}

// ============================================================
// POV CONSISTENCY CHECKER
// ============================================================

/**
 * Check for inner thought leaks (first-person thoughts in third-person narration)
 */
export function checkInnerThoughtLeak(segment: POVSegment, fullText: string): POVViolation | null {
  const segmentText = fullText.slice(segment.startIndex, segment.endIndex)

  if (segment.povType === 'third_person' || segment.povType === 'omniscient') {
    for (const indicator of INNER_THOUGHT_INDICATORS) {
      if (segmentText.toLowerCase().includes(indicator)) {
        // Check if it's attributing thoughts to a specific character
        const thoughtPattern = new RegExp(`([A-Z]\\w+)\\s+(?:thought|wondered|realized|felt)`, 'i')
        const match = segmentText.match(thoughtPattern)
        if (!match) {
          // Possible omniscient inner knowledge
          return {
            type: 'omniscient_knowledge',
            severity: 'minor',
            position: segment.startIndex,
            description: `Inner thought indicator "${indicator}" without character attribution`,
            characterContext: null
          }
        }
      }
    }
  }

  return null
}

/**
 * Check for omniscient knowledge leaks in limited POV
 */
export function checkOmniscientKnowledgeLeak(segment: POVSegment, fullText: string): POVViolation | null {
  const segmentText = fullText.slice(segment.startIndex, segment.endIndex)

  if (segment.povType === 'first_person' || segment.povType === 'third_person') {
    for (const indicator of OMNISCIENT_INDICATORS) {
      if (segmentText.toLowerCase().includes(indicator)) {
        return {
          type: 'omniscient_knowledge',
          severity: 'major',
          position: segment.startIndex,
          description: `Omniscient indicator "${indicator}" in limited POV`,
          characterContext: segment.characterName
        }
      }
    }
  }

  return null
}

/**
 * Check POV consistency for a segment
 */
export function checkPOVConsistency(
  segment: POVSegment,
  fullText: string,
  previousSegment: POVSegment | null
): POVConsistencyResult {
  const violations: POVViolation[] = []

  // Check inner thought leak
  const thoughtLeak = checkInnerThoughtLeak(segment, fullText)
  if (thoughtLeak) violations.push(thoughtLeak)

  // Check omniscient knowledge leak
  const omniscientLeak = checkOmniscientKnowledgeLeak(segment, fullText)
  if (omniscientLeak) violations.push(omniscientLeak)

  // Check for sensory mismatches (character can't see/hear things they shouldn't)
  if (segment.povType === 'first_person' && segment.characterName) {
    const segmentText = fullText.slice(segment.startIndex, segment.endIndex)
    // Look for impossible knowledge (e.g., describing exact thoughts of other characters)
    const otherCharThoughts = /[A-Z]\w+\s+(?:thought|wondered|believed|felt)\s+that\s+[^.]+said/
    if (otherCharThoughts.test(segmentText)) {
      violations.push({
        type: 'sensory_mismatch',
        severity: 'major',
        position: segment.startIndex,
        description: 'Character has direct knowledge of another character\'s thoughts',
        characterContext: segment.characterName
      })
    }
  }

  // Calculate consistency score
  const baseScore = 1
  const penaltyPerViolation = {
    minor: 0.05,
    moderate: 0.15,
    major: 0.3
  }
  const totalPenalty = violations.reduce(
    (sum, v) => sum + penaltyPerViolation[v.severity],
    0
  )
  const overallScore = Math.max(0, baseScore - totalPenalty)

  return {
    isConsistent: violations.length === 0,
    violations,
    overallScore,
    details: violations.length === 0
      ? 'POV is consistent within this segment'
      : `Found ${violations.length} POV violation(s): ${violations.map(v => v.type).join(', ')}`
  }
}

/**
 * Check consistency across all segments
 */
export function checkAllPOVConsistency(segments: POVSegment[], fullText: string): POVConsistencyResult[] {
  const results: POVConsistencyResult[] = []

  for (let i = 0; i < segments.length; i++) {
    results.push(checkPOVConsistency(segments[i], fullText, i > 0 ? segments[i - 1] : null))
  }

  return results
}

// ============================================================
// POV SWITCH ANALYZER
// ============================================================

/**
 * Calculate narrative distance for a POV type (0=very intimate, 1=very distant)
 */
export function getNarrativeDistance(povType: POVType): number {
  switch (povType) {
    case 'first_person': return 0.2
    case 'second_person': return 0.3
    case 'third_person': return 0.6
    case 'omniscient': return 0.9
    default: return 0.5
  }
}

/**
 * Calculate emotional proximity for a POV type (0=none, 1=maximum)
 */
export function getEmotionalProximity(povType: POVType): number {
  switch (povType) {
    case 'first_person': return 0.9
    case 'second_person': return 0.8
    case 'third_person': return 0.5
    case 'omniscient': return 0.3
    default: return 0.5
  }
}

/**
 * Detect POV switches between segments
 */
export function detectPOVSwitches(segments: POVSegment[]): POVSwitch[] {
  const switches: POVSwitch[] = []

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]
    const curr = segments[i]

    if (prev.povType !== curr.povType) {
      const prevDistance = getNarrativeDistance(prev.povType)
      const currDistance = getNarrativeDistance(curr.povType)
      const distanceChange = currDistance - prevDistance

      // Determine smoothness based on distance change
      let smoothness: 'abrupt' | 'gradual' | 'seamless'
      if (Math.abs(distanceChange) < 0.2) {
        smoothness = 'seamless'
      } else if (Math.abs(distanceChange) < 0.5) {
        smoothness = 'gradual'
      } else {
        smoothness = 'abrupt'
      }

      switches.push({
        from: prev.povType,
        to: curr.povType,
        character: curr.characterName,
        position: curr.startIndex,
        smoothness,
        narrativeDistanceChange: distanceChange > 0.1 ? 'farther' : distanceChange < -0.1 ? 'closer' : 'same'
      })
    }
  }

  return switches
}

/**
 * Analyze the effect of a POV switch
 */
export function analyzePOVSwitchEffect(sw: POVSwitch): POVSwitchEffect {
  const distanceBefore = getNarrativeDistance(sw.from)
  const distanceAfter = getNarrativeDistance(sw.to)
  const proximityBefore = getEmotionalProximity(sw.from)
  const proximityAfter = getEmotionalProximity(sw.to)

  // Calculate readability impact
  const distanceDelta = Math.abs(distanceAfter - distanceBefore)
  const readabilityImpact = sw.smoothness === 'seamless' ? 0
    : sw.smoothness === 'gradual' ? -distanceDelta * 0.5
    : -distanceDelta

  // Determine recommendation
  let recommendedTransition: 'keep' | 'strengthen' | 'soften' | 'remove'
  let reason: string

  if (sw.smoothness === 'seamless') {
    recommendedTransition = 'keep'
    reason = 'Transition is smooth and maintains narrative flow'
  } else if (sw.smoothness === 'gradual' && Math.abs(distanceDelta) < 0.4) {
    recommendedTransition = 'keep'
    reason = 'Gradual transition works well despite distance change'
  } else if (distanceAfter > 0.7 && sw.from === 'first_person') {
    recommendedTransition = 'soften'
    reason = 'Large jump from intimate to distant POV may disorient readers'
  } else if (distanceAfter < 0.4 && sw.from === 'omniscient') {
    recommendedTransition = 'strengthen'
    reason = 'Good opportunity to bring reader closer to character experience'
  } else {
    recommendedTransition = 'soften'
    reason = `Consider adding transition to reduce ${sw.smoothness} feel`
  }

  return {
    switchIndex: 0, // Will be set by caller
    fromPOV: sw.from,
    toPOV: sw.to,
    narrativeDistanceBefore: distanceBefore,
    narrativeDistanceAfter: distanceAfter,
    emotionalProximityBefore: proximityBefore,
    emotionalProximityAfter: proximityAfter,
    readabilityImpact,
    recommendedTransition,
    reason
  }
}

/**
 * Analyze all POV switches in a sequence
 */
export function analyzePOVSwitches(switches: POVSwitch[]): POVSwitchEffect[] {
  return switches.map((sw, index) => ({
    ...analyzePOVSwitchEffect(sw),
    switchIndex: index
  }))
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

export function createEmptyPOVState(): MultiPOVState {
  return {
    segments: [],
    switches: [],
    consistencyResults: [],
    switchEffects: [],
    currentPOV: 'unknown',
    dominantPOV: null,
    povDistribution: {
      first_person: 0,
      second_person: 0,
      third_person: 0,
      omniscient: 0,
      unknown: 0
    }
  }
}

/**
 * Build full POV state from text
 */
export function buildPOVState(text: string, minSegmentLength: number = 50): MultiPOVState {
  const segments = segmentTextByPOV(text, minSegmentLength)
  const switches = detectPOVSwitches(segments)
  const consistencyResults = checkAllPOVConsistency(segments, text)
  const switchEffects = analyzePOVSwitches(switches)

  // Calculate POV distribution
  const totalLength = segments.reduce((sum, seg) => sum + (seg.endIndex - seg.startIndex), 0)
  const distribution: Record<POVType, number> = {
    first_person: 0,
    second_person: 0,
    third_person: 0,
    omniscient: 0,
    unknown: 0
  }

  for (const segment of segments) {
    const length = segment.endIndex - segment.startIndex
    distribution[segment.povType] += length / totalLength
  }

  // Find dominant POV
  let dominantPOV: POVType = 'unknown'
  let maxPct = 0
  for (const [pov, pct] of Object.entries(distribution) as [POVType, number][]) {
    if (pct > maxPct) {
      maxPct = pct
      dominantPOV = pov
    }
  }

  return {
    segments,
    switches,
    consistencyResults,
    switchEffects,
    currentPOV: segments.length > 0 ? segments[segments.length - 1].povType : 'unknown',
    dominantPOV: maxPct > 0.1 ? dominantPOV : null,
    povDistribution: distribution
  }
}

/**
 * Add segment to state (immutable)
 */
export function addPOVSegment(state: MultiPOVState, segment: POVSegment): MultiPOVState {
  const segments = [...state.segments, segment]
  return buildPOVState(segments.map(s => {
    const text = segments.map(seg => `[${seg.povType}]`).join(' ')
    return text
  }).join(' ')) // Simplified; in real use, would need original text
}

// ============================================================
// ANALYSIS & FORMATTING
// ============================================================

/**
 * Get summary of POV analysis
 */
export function getPOVSummary(state: MultiPOVState): {
  segmentCount: number
  switchCount: number
  consistencyScore: number
  dominantPOV: POVType | null
  recommendedActions: string[]
} {
  const avgConsistency = state.consistencyResults.length > 0
    ? state.consistencyResults.reduce((sum, r) => sum + r.overallScore, 0) / state.consistencyResults.length
    : 1

  const recommendedActions: string[] = []

  // Analyze switch effects for recommendations
  for (const effect of state.switchEffects) {
    if (effect.recommendedTransition === 'soften') {
      recommendedActions.push(`Soften transition at index ${effect.switchIndex} (${effect.fromPOV} → ${effect.toPOV})`)
    } else if (effect.recommendedTransition === 'strengthen') {
      recommendedActions.push(`Strengthen transition at index ${effect.switchIndex} for better impact`)
    } else if (effect.recommendedTransition === 'remove') {
      recommendedActions.push(`Consider removing POV switch at index ${effect.switchIndex}`)
    }
  }

  return {
    segmentCount: state.segments.length,
    switchCount: state.switches.length,
    consistencyScore: avgConsistency,
    dominantPOV: state.dominantPOV,
    recommendedActions
  }
}

/**
 * Format POV analysis as readable report
 */
export function formatPOVReport(state: MultiPOVState): string {
  const lines: string[] = ['=== Multi-POV Analysis Report ===', '']

  // Distribution
  lines.push('POV Distribution:')
  for (const [pov, pct] of Object.entries(state.povDistribution)) {
    if (pct > 0) {
      lines.push(`  ${pov}: ${(pct * 100).toFixed(1)}%`)
    }
  }
  lines.push('')

  // Switches
  lines.push(`POV Switches (${state.switches.length} total):`)
  for (const sw of state.switches) {
    lines.push(`  ${sw.from} → ${sw.to} at position ${sw.position} (${sw.smoothness})`)
  }
  lines.push('')

  // Consistency
  const avgScore = state.consistencyResults.length > 0
    ? state.consistencyResults.reduce((sum, r) => sum + r.overallScore, 0) / state.consistencyResults.length
    : 1
  lines.push(`Overall Consistency: ${(avgScore * 100).toFixed(0)}%`)

  const violations = state.consistencyResults.flatMap(r => r.violations)
  if (violations.length > 0) {
    lines.push(`Violations (${violations.length}):`)
    for (const v of violations) {
      lines.push(`  - [${v.severity}] ${v.type}: ${v.description}`)
    }
  }

  return lines.join('\n')
}

/**
 * Get segments at a specific chapter/position
 */
export function getPOVAtPosition(state: MultiPOVState, position: number): POVSegment | null {
  for (const segment of state.segments) {
    if (position >= segment.startIndex && position <= segment.endIndex) {
      return segment
    }
  }
  return null
}

/**
 * Get POV trend over text position
 */
export function getPOVTrend(state: MultiPOVState): Array<{ position: number; pov: POVType; distance: number }> {
  return state.segments.map(seg => ({
    position: seg.startIndex,
    pov: seg.povType,
    distance: getNarrativeDistance(seg.povType)
  }))
}