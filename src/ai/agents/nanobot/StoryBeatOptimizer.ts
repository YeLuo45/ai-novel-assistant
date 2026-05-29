/**
 * StoryBeatOptimizer — V345
 * Optimal story beat sequencing, narrative structure analysis,
 * beat type recommendations, and story rhythm optimization.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition), chatdev (role analysis)
 */

export type BeatType = 'hook' | 'setup' | 'rising_action' | 'climax' | 'falling_action' | 'resolution' | 'turning_point'

export interface StoryBeat {
  id: string
  type: BeatType
  description: string
  priority: number
  estimatedLength: number
  emotionalTone?: string
  characters?: string[]
  chapterId?: string
  position?: number
}

export interface BeatSequence {
  id: string
  beats: StoryBeat[]
  totalEstimatedWords: number
  rhythmScore: number
  structureType: 'three_act' | 'five_act' | 'hero_journey' | 'freytag'
}

export interface BeatOptimizerState {
  beats: StoryBeat[]
  sequences: BeatSequence[]
  currentSequenceId: string | null
  beatLibrary: Record<string, StoryBeat>
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): BeatOptimizerState {
  return {
    beats: [],
    sequences: [],
    currentSequenceId: null,
    beatLibrary: {},
    typeAlias: {},
  }
}

export function addBeat(state: BeatOptimizerState, beat: Omit<StoryBeat, 'id'>): BeatOptimizerState {
  const id = `beat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const newBeat: StoryBeat = { ...beat, id }
  return {
    ...state,
    beats: [...state.beats, newBeat],
    beatLibrary: { ...state.beatLibrary, [id]: newBeat },
  }
}

export function createSequence(state: BeatOptimizerState, structureType: BeatSequence['structureType']): BeatOptimizerState {
  const id = `seq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const sequence: BeatSequence = {
    id,
    beats: [],
    totalEstimatedWords: 0,
    rhythmScore: 0,
    structureType,
  }
  return {
    ...state,
    sequences: [...state.sequences, sequence],
    currentSequenceId: id,
  }
}

export function addBeatToSequence(state: BeatOptimizerState, beatId: string): BeatOptimizerState {
  const beat = state.beatLibrary[beatId]
  if (!beat) return state
  if (!state.currentSequenceId) return state
  const seqIdx = state.sequences.findIndex(s => s.id === state.currentSequenceId)
  if (seqIdx === -1) return state
  const seq = state.sequences[seqIdx]
  const updatedSeq: BeatSequence = {
    ...seq,
    beats: [...seq.beats, beat],
    totalEstimatedWords: seq.totalEstimatedWords + beat.estimatedLength,
  }
  const sequences = [...state.sequences]
  sequences[seqIdx] = updatedSeq
  return { ...state, sequences }
}

export function calculateRhythmScore(beats: StoryBeat[]): number {
  if (beats.length < 3) return 50
  const typeOrder: Record<BeatType, number> = {
    hook: 0, setup: 1, rising_action: 2, turning_point: 3,
    climax: 4, falling_action: 5, resolution: 6,
  }
  let score = 70
  if (beats[0].type !== 'hook') score -= 15
  if (beats.some(b => b.type === 'climax')) score += 10
  if (!beats.some(b => b.type === 'resolution')) score -= 10
  for (let i = 1; i < beats.length; i++) {
    const prevOrder = typeOrder[beats[i - 1].type]
    const currOrder = typeOrder[beats[i].type]
    if (currOrder < prevOrder && beats[i].type !== 'turning_point') score -= 3
  }
  for (let i = 1; i < beats.length; i++) {
    if (beats[i].type === beats[i - 1].type) score -= 5
  }
  return Math.max(0, Math.min(100, score))
}

export function optimizeBeatOrder(state: BeatOptimizerState, sequenceId: string): BeatOptimizerState {
  const seqIdx = state.sequences.findIndex(s => s.id === sequenceId)
  if (seqIdx === -1) return state
  const seq = state.sequences[seqIdx]
  const hook = seq.beats.filter(b => b.type === 'hook')
  const others = seq.beats.filter(b => b.type !== 'hook')
  others.sort((a, b) => b.priority - a.priority)
  const sorted = [...hook, ...others]
  const rhythmScore = calculateRhythmScore(sorted)
  const updatedSeq: BeatSequence = { ...seq, beats: sorted, rhythmScore }
  const sequences = [...state.sequences]
  sequences[seqIdx] = updatedSeq
  return { ...state, sequences }
}

export function getBeatTypeDistribution(state: BeatOptimizerState, sequenceId: string): Record<BeatType, number> {
  const seq = state.sequences.find(s => s.id === sequenceId)
  if (!seq) return {} as Record<BeatType, number>
  const distribution: Record<BeatType, number> = {
    hook: 0, setup: 0, rising_action: 0, turning_point: 0,
    climax: 0, falling_action: 0, resolution: 0,
  }
  for (const beat of seq.beats) distribution[beat.type]++
  return distribution
}

export function getMissingBeatTypes(state: BeatOptimizerState, sequenceId: string): BeatType[] {
  const seq = state.sequences.find(s => s.id === sequenceId)
  if (!seq) return []
  const presentTypes = new Set(seq.beats.map(b => b.type))
  const requiredByStructure: Record<BeatSequence['structureType'], BeatType[]> = {
    three_act: ['hook', 'rising_action', 'climax', 'resolution'],
    five_act: ['hook', 'setup', 'rising_action', 'turning_point', 'climax', 'resolution'],
    hero_journey: ['hook', 'setup', 'rising_action', 'climax', 'falling_action', 'resolution'],
    freytag: ['hook', 'rising_action', 'climax', 'falling_action', 'resolution'],
  }
  const required = requiredByStructure[seq.structureType] || []
  return required.filter(t => !presentTypes.has(t))
}

export function recommendNextBeatType(state: BeatOptimizerState, sequenceId: string): BeatType | null {
  const seq = state.sequences.find(s => s.id === sequenceId)
  if (!seq) return null
  const presentTypes = seq.beats.map(b => b.type)
  if (!presentTypes.includes('hook')) return 'hook'
  if (!presentTypes.includes('rising_action')) return 'rising_action'
  if (!presentTypes.includes('climax')) return 'climax'
  if (!presentTypes.includes('resolution')) return 'resolution'
  return 'turning_point'
}

export function suggestBeatsForChapter(state: BeatOptimizerState, chapterId: string, chapterLength: number): StoryBeat[] {
  const suggestions: StoryBeat[] = []
  if (chapterLength < 1000) {
    suggestions.push({
      id: `sug_${Date.now()}`,
      type: 'turning_point',
      description: 'Brief turning point',
      priority: 80,
      estimatedLength: Math.floor(chapterLength * 0.3),
      chapterId,
    })
  } else {
    suggestions.push({
      id: `sug_${Date.now()}`,
      type: 'hook',
      description: 'Chapter opening hook',
      priority: 90,
      estimatedLength: Math.floor(chapterLength * 0.15),
      chapterId,
    })
    suggestions.push({
      id: `sug_${Date.now()}_2`,
      type: 'rising_action',
      description: 'Main chapter conflict',
      priority: 85,
      estimatedLength: Math.floor(chapterLength * 0.5),
      chapterId,
    })
    suggestions.push({
      id: `sug_${Date.now()}_3`,
      type: 'resolution',
      description: 'Chapter resolution',
      priority: 70,
      estimatedLength: Math.floor(chapterLength * 0.2),
      chapterId,
    })
  }
  return suggestions
}

export function analyzeBeatPacing(state: BeatOptimizerState, sequenceId: string): { balanced: boolean; issues: string[] } {
  const seq = state.sequences.find(s => s.id === sequenceId)
  if (!seq) return { balanced: false, issues: ['Sequence not found'] }
  const issues: string[] = []
  const beats = seq.beats
  if (beats.filter(b => b.type === 'rising_action').length > beats.filter(b => b.type === 'falling_action').length + 2) {
    issues.push('Too many rising action beats without balance')
  }
  if (beats.filter(b => b.type === 'climax').length > 1) {
    issues.push('Multiple climax points may dilute impact')
  }
  const avgLength = seq.totalEstimatedWords / (beats.length || 1)
  if (beats.filter(b => b.estimatedLength > avgLength * 2).length > 2) {
    issues.push('Several very long beats may disrupt pacing')
  }
  return { balanced: issues.length === 0, issues }
}

export function getBeatStatistics(state: BeatOptimizerState, sequenceId: string) {
  const seq = state.sequences.find(s => s.id === sequenceId)
  if (!seq) return null
  const beats = seq.beats
  return {
    totalBeats: beats.length,
    totalWords: seq.totalEstimatedWords,
    avgBeatLength: seq.totalEstimatedWords / (beats.length || 1),
    rhythmScore: seq.rhythmScore,
    typeDistribution: getBeatTypeDistribution(state, sequenceId),
    missingTypes: getMissingBeatTypes(state, sequenceId),
  }
}
