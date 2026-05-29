/**
 * StoryBeatOptimizer — V325
 * Optimal beat sequencing, scene ordering, dramatic structure optimization.
 * Inspired by: thunderbolt (pipeline optimization), ruflo (hierarchical decomposition)
 */

export interface StoryBeat {
  beatId: string
  type: 'hook' | 'setup' | 'complication' | 'crisis' | 'climax' | 'falling_action' | 'resolution' | 'subplot'
  importance: number      // 1-10
  durationEstimate: number // words/pages
  emotionalTone: 'joy' | 'sorrow' | 'tension' | 'fear' | 'anticipation' | 'neutral'
  characters: string[]
  sceneId: string
}

export interface BeatSequence {
  beats: StoryBeat[]
  totalDuration: number   // estimated total words
  pacingScore: number    // 0-100 how well the sequence flows
  tensionArc: number[]   // tension level at each beat position
}

export interface OptimizationConstraint {
  type: 'min_gap' | 'max_gap' | 'required_sequence' | 'forbidden_sequence' | 'emotional_balance' | 'character_presence'
  params: Record<string, unknown>
}

export interface StoryBeatOptimizerState {
  currentSequence: BeatSequence | null
  beatLibrary: Map<string, StoryBeat>
  constraints: OptimizationConstraint[]
  optimizationHistory: { timestamp: number; scoreBefore: number; scoreAfter: number }[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): StoryBeatOptimizerState {
  return {
    currentSequence: null,
    beatLibrary: new Map(),
    constraints: [],
    optimizationHistory: [],
    typeAlias: {},
  }
}

// Add a beat to the library
export function addBeat(
  state: StoryBeatOptimizerState,
  beat: StoryBeat
): StoryBeatOptimizerState {
  const newLibrary = new Map(state.beatLibrary)
  newLibrary.set(beat.beatId, beat)
  return { ...state, beatLibrary: newLibrary }
}

// Create a beat sequence from a list of beat IDs
export function createSequence(
  state: StoryBeatOptimizerState,
  beatIds: string[]
): BeatSequence | null {
  const beats: StoryBeat[] = []
  for (const id of beatIds) {
    const beat = state.beatLibrary.get(id)
    if (!beat) return null
    beats.push(beat)
  }
  return { beats, totalDuration: 0, pacingScore: 0, tensionArc: [] }
}

// Optimize beat ordering for dramatic impact
export function optimizeBeatOrder(
  state: StoryBeatOptimizerState,
  beatIds: string[],
  targetPacing: 'slow' | 'medium' | 'fast' = 'medium'
): { sequence: BeatSequence; improvements: string[] } {
  const beats: StoryBeat[] = beatIds.map(id => state.beatLibrary.get(id)).filter((b): b is StoryBeat => !!b)
  
  if (beats.length === 0) {
    return { 
      sequence: { beats: [], totalDuration: 0, pacingScore: 0, tensionArc: [] }, 
      improvements: ['No beats available for optimization'] 
    }
  }

  // Sort beats: hook first, climax in ~75% position, resolution last
  const sorted = [...beats]
  const hook = sorted.find(b => b.type === 'hook')
  const climax = sorted.find(b => b.type === 'climax')
  const resolution = sorted.find(b => b.type === 'resolution')
  
  // Extract special beats and remaining
  const complications = sorted.filter(b => b.type !== 'hook' && b.type !== 'climax' && b.type !== 'resolution')
  const n = complications.length
  
  // Place in order: hook -> complications -> climax -> resolution
  const ordered: StoryBeat[] = []
  
  if (hook) ordered.push(hook)
  
  const climaxIdx = Math.floor((n + 1) * 0.75)  // +1 for hook
  for (let i = 0; i <= n; i++) {
    if (i === climaxIdx && climax) {
      ordered.push(climax)
    } else {
      const srcIdx = i < climaxIdx ? i : i - 1
      if (srcIdx < complications.length) {
        ordered.push(complications[srcIdx])
      }
    }
  }
  
  if (resolution) ordered.push(resolution)
  
  // Calculate pacing score based on type distribution
  const typeOrder: StoryBeat['type'][] = ['hook', 'setup', 'complication', 'crisis', 'climax', 'falling_action', 'resolution', 'subplot']
  let pacingScore = 60
  
  // Bonus for proper dramatic structure
  const hasAllCoreTypes = ['hook', 'climax', 'resolution'].every(t => ordered.some(b => b.type === t))
  if (hasAllCoreTypes) pacingScore += 15
  
  // Penalty for too many subplots
  const subplotCount = ordered.filter(b => b.type === 'subplot').length
  if (subplotCount > ordered.length * 0.3) pacingScore -= 10
  
  // Calculate tension arc
  const tensionArc = ordered.map((beat, idx) => {
    const positionRatio = idx / Math.max(1, ordered.length - 1)
    let baseTension: number
    switch (beat.type) {
      case 'hook': baseTension = 30; break
      case 'setup': baseTension = 25; break
      case 'complication': baseTension = 50; break
      case 'crisis': baseTension = 75; break
      case 'climax': baseTension = 95; break
      case 'falling_action': baseTension = 60; break
      case 'resolution': baseTension = 20; break
      case 'subplot': baseTension = 40; break
    }
    return Math.round(baseTension * (1 + (beat.importance / 20)))
  })

  const totalDuration = ordered.reduce((s, b) => s + b.durationEstimate, 0)

  const improvements: string[] = []
  if (!hasAllCoreTypes) improvements.push('Missing core story beats (hook/climax/resolution)')
  if (subplotCount > ordered.length * 0.3) improvements.push(`Too many subplots (${subplotCount}/${ordered.length}) - may dilute main plot`)
  if (ordered.length > 15) improvements.push(`Long sequence (${ordered.length} beats) - consider splitting`)
  if (pacingScore >= 75) improvements.push('Strong dramatic structure detected')

  const sequence: BeatSequence = { beats: ordered, totalDuration, pacingScore, tensionArc }
  return { sequence, improvements }
}

// Calculate pacing score for a sequence
export function calculatePacingScore(seq: BeatSequence): number {
  if (seq.beats.length === 0) return 0
  
  let score = 50
  const types = seq.beats.map(b => b.type)
  
  // Check for proper beat type distribution
  const hasHook = types.includes('hook')
  const hasClimax = types.includes('climax')
  const hasResolution = types.includes('resolution')
  if (hasHook && hasClimax && hasResolution) score += 20
  
  // Check tension arc shape (should rise then fall)
  if (seq.tensionArc.length >= 3) {
    const mid = Math.floor(seq.tensionArc.length / 2)
    const firstHalfAvg = seq.tensionArc.slice(0, mid).reduce((s, v) => s + v, 0) / mid
    const secondHalfAvg = seq.tensionArc.slice(mid).reduce((s, v) => s + v, 0) / (seq.tensionArc.length - mid)
    if (secondHalfAvg > firstHalfAvg + 10) score += 15  // proper rise
    if (seq.tensionArc[0] > seq.tensionArc[mid]) score -= 10  // starts high
    if (seq.tensionArc[seq.tensionArc.length - 1] > 40) score -= 10  // doesn't resolve
  }
  
  // Importance variance (good sequences have varied importance)
  const importances = seq.beats.map(b => b.importance)
  const avgImp = importances.reduce((s, v) => s + v, 0) / importances.length
  const variance = importances.reduce((s, v) => s + Math.abs(v - avgImp), 0) / importances.length
  if (variance > 2) score += 10  // good variation
  if (variance < 1) score -= 5   // too uniform
  
  return Math.max(0, Math.min(100, score))
}

// Find optimal beat placement for maximum tension
export function findOptimalBeatPlacement(
  state: StoryBeatOptimizerState,
  beatId: string,
  currentSequence: BeatSequence
): { position: number; reason: string } {
  const beat = state.beatLibrary.get(beatId)
  if (!beat) return { position: -1, reason: 'Beat not found' }

  // Find best position based on beat type
  let position: number
  let reason: string

  switch (beat.type) {
    case 'hook':
      position = 0
      reason = 'Hooks belong at the beginning'
      break
    case 'climax':
      // Place at ~75% of sequence
      position = Math.floor(currentSequence.beats.length * 0.75)
      reason = 'Climax placed at dramatic peak position'
      break
    case 'resolution':
      position = currentSequence.beats.length
      reason = 'Resolutions belong at the end'
      break
    case 'crisis':
      // Place just before climax
      const climaxIdx = currentSequence.beats.findIndex(b => b.type === 'climax')
      position = climaxIdx > 0 ? climaxIdx : Math.floor(currentSequence.beats.length * 0.7)
      reason = 'Crisis should precede climax'
      break
    case 'complication':
      // Place in middle third
      position = Math.floor(currentSequence.beats.length / 3) + Math.floor(Math.random() * (currentSequence.beats.length / 3))
      reason = 'Complications fit in middle section'
      break
    default:
      // Find position with lowest adjacent importance
      let bestPos = currentSequence.beats.length
      let lowestImpact = Infinity
      for (let i = 0; i <= currentSequence.beats.length; i++) {
        const beforeImp = i > 0 ? currentSequence.beats[i - 1].importance : 0
        const afterImp = i < currentSequence.beats.length ? currentSequence.beats[i].importance : 0
        const impact = Math.abs(beforeImp - afterImp)
        if (impact < lowestImpact) {
          lowestImpact = impact
          bestPos = i
        }
      }
      position = bestPos
      reason = 'Placed at position with minimal adjacent disruption'
  }

  return { position, reason }
}

// Balance emotional tone across sequence
export function balanceEmotionalTone(
  seq: BeatSequence,
  targetRatio: Map<StoryBeat['emotionalTone'], number> = new Map([
    ['tension', 0.3],
    ['anticipation', 0.2],
    ['neutral', 0.2],
    ['joy', 0.15],
    ['fear', 0.1],
    ['sorrow', 0.05],
  ])
): { balanced: boolean; suggestions: string[] } {
  if (seq.beats.length === 0) return { balanced: true, suggestions: [] }

  const actualCounts = new Map<string, number>()
  for (const beat of seq.beats) {
    actualCounts.set(beat.emotionalTone, (actualCounts.get(beat.emotionalTone) || 0) + 1)
  }

  const suggestions: string[] = []
  const total = seq.beats.length
  let balanced = true

  for (const [tone, targetRatio] of targetRatio.entries()) {
    const actual = (actualCounts.get(tone) || 0) / total
    const diff = Math.abs(actual - targetRatio)
    if (diff > 0.15) {
      balanced = false
      if (actual < targetRatio) {
        suggestions.push(`More ${tone} beats needed (${Math.round(actual * 100)}% vs ${Math.round(targetRatio * 100)}% target)`)
      } else {
        suggestions.push(`Too many ${tone} beats (${Math.round(actual * 100)}% vs ${Math.round(targetRatio * 100)}% target)`)
      }
    }
  }

  return { balanced, suggestions }
}

// Validate sequence structure
export function validateSequence(seq: BeatSequence): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (seq.beats.length === 0) {
    errors.push('Empty sequence')
    return { valid: false, errors, warnings }
  }

  // Check for required beats
  const types = seq.beats.map(b => b.type)
  if (!types.includes('hook')) warnings.push('No hook beat - may struggle to capture reader attention')
  if (!types.includes('climax')) errors.push('No climax - story needs a peak moment')
  if (!types.includes('resolution')) warnings.push('No resolution - story may feel incomplete')

  // Check for pacing issues
  if (seq.beats.length > 20) warnings.push('Very long sequence - reader fatigue possible')
  if (seq.beats.length < 5) warnings.push('Very short sequence - may lack development')

  // Check beat spacing
  const avgDuration = seq.totalDuration / seq.beats.length
  for (let i = 1; i < seq.beats.length; i++) {
    const gap = seq.beats[i].durationEstimate / avgDuration
    if (gap > 3) warnings.push(`Beat ${i} has unusual duration (${Math.round(gap * 100)}% of average)`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// Get sequence summary
export function getSequenceSummary(seq: BeatSequence): {
  beatCount: number
  totalDuration: number
  pacingScore: number
  structureQuality: string
  tensionShape: string
} {
  const types = seq.beats.map(b => b.type)
  let structureQuality: string
  if (types.includes('hook') && types.includes('climax') && types.includes('resolution')) {
    structureQuality = 'complete'
  } else if (types.includes('climax')) {
    structureQuality = 'partial'
  } else {
    structureQuality = 'minimal'
  }

  let tensionShape: string
  if (seq.tensionArc.length >= 3) {
    const rising = seq.tensionArc.slice(0, Math.floor(seq.tensionArc.length / 2))
    const falling = seq.tensionArc.slice(Math.floor(seq.tensionArc.length / 2))
    const risingAvg = rising.reduce((s, v) => s + v, 0) / rising.length
    const fallingAvg = falling.reduce((s, v) => s + v, 0) / falling.length
    if (fallingAvg > risingAvg + 20) tensionShape = 'proper arc'
    else if (fallingAvg > risingAvg) tensionShape = 'gradual rise'
    else if (fallingAvg < risingAvg - 10) tensionShape = 'inverted'
    else tensionShape = 'flat'
  } else {
    tensionShape = 'insufficient data'
  }

  return {
    beatCount: seq.beats.length,
    totalDuration: seq.totalDuration,
    pacingScore: seq.pacingScore,
    structureQuality,
    tensionShape,
  }
}
