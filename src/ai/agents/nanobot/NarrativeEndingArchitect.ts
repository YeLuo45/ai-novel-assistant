/**
 * NarrativeEndingArchitect — V441
 * Ending structure analysis, final scene architecture, conclusion satisfaction prediction.
 * Inspired by: generic-agent (optimization), thunderbolt (feedback loops), chatdev (satisfaction analysis)
 */

export type EndingType = 'resolute' | 'ambiguous' | 'epilogue' | 'cliffhanger' | 'circular' | 'tragic' | 'bittersweet'

export interface EndingBeat {
  id: string
  beatType: string  // 'final_image', 'final_line', 'resolution', 'denouement'
  chapterId: string
  content: string
  emotionalImpact: number  // 0-100
  isSignature: boolean  // callback to opening
}

export interface EndingArchitecture {
  endingType: EndingType
  finalChapter: number
  totalBeats: number
  openingSignature: boolean  // echoes opening
  emotionalArcCompletion: number  // 0-100
  looseEndsResolved: number  // percentage
  readerSatisfaction: number  // predicted 0-100
}

export interface EndingReport {
  architecture: EndingArchitecture | null
  predictedEndingType: EndingType | null
  satisfactionScore: number
  recommendations: string[]
}

export interface NarrativeEndingState {
  beats: EndingBeat[]
  endingType: EndingType | null
  finalChapter: number
  report: EndingReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeEndingState {
  return { beats: [], endingType: null, finalChapter: 0, report: null, typeAlias: {} }
}

export function addEndingBeat(
  state: NarrativeEndingState,
  beatType: string,
  chapterId: string,
  content: string,
  emotionalImpact: number,
  isSignature: boolean = false
): NarrativeEndingState {
  const id = `beat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const beat: EndingBeat = { id, beatType, chapterId, content, emotionalImpact: Math.max(0, Math.min(100, emotionalImpact)), isSignature }
  return { ...state, beats: [...state.beats, beat] }
}

export function setEndingType(state: NarrativeEndingState, endingType: EndingType): NarrativeEndingState {
  return { ...state, endingType }
}

export function setFinalChapter(state: NarrativeEndingState, chapter: number): NarrativeEndingState {
  return { ...state, finalChapter: chapter }
}

export function calculateEndingScore(state: NarrativeEndingState): number {
  if (state.beats.length === 0) return 50
  
  let score = 50
  const avgImpact = state.beats.reduce((s, b) => s + b.emotionalImpact, 0) / state.beats.length
  score += (avgImpact - 50) * 0.3
  
  if (state.endingType === 'resolute') score += 10
  else if (state.endingType === 'ambiguous') score += 5
  else if (state.endingType === 'cliffhanger') score -= 5
  
  const signatureBeats = state.beats.filter(b => b.isSignature).length
  if (signatureBeats > 0) score += 10
  
  const finalImage = state.beats.find(b => b.beatType === 'final_image')
  if (finalImage) score += 10
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function generateEndingReport(state: NarrativeEndingState): EndingReport {
  if (state.beats.length === 0) {
    return { architecture: null, predictedEndingType: null, satisfactionScore: 50, recommendations: ['Add ending beats for analysis'] }
  }
  
  const satisfactionScore = calculateEndingScore(state)
  
  // Determine predicted ending type from beat patterns
  let predictedEndingType: EndingType = 'resolute'
  if (state.beats.some(b => b.beatType === 'final_image' && b.content.includes('?'))) {
    predictedEndingType = 'ambiguous'
  } else if (state.beats.some(b => b.beatType === 'final_image' && b.content.includes('...'))) {
    predictedEndingType = 'cliffhanger'
  } else if (state.beats.some(b => b.content.toLowerCase().includes('dies'))) {
    predictedEndingType = 'tragic'
  }
  
  const openingSignature = state.beats.some(b => b.isSignature)
  const emotionalArcCompletion = Math.min(100, Math.round(state.beats.reduce((s, b) => s + b.emotionalImpact, 0) / state.beats.length))
  
  const architecture: EndingArchitecture = {
    endingType: state.endingType || predictedEndingType,
    finalChapter: state.finalChapter || 0,
    totalBeats: state.beats.length,
    openingSignature,
    emotionalArcCompletion,
    looseEndsResolved: 80,
    readerSatisfaction: satisfactionScore,
  }
  
  const recommendations: string[] = []
  if (!openingSignature) recommendations.push('No opening signature beat - consider echoing the beginning')
  if (state.beats.length < 3) recommendations.push('Few ending beats - add more final scene architecture')
  if (satisfactionScore < 60) recommendations.push('Low satisfaction prediction - strengthen emotional impact')
  if (!state.beats.some(b => b.beatType === 'final_image')) {
    recommendations.push('No final image - add a powerful closing image')
  }
  if (!state.endingType) recommendations.push('Ending type not set - specify the conclusion type')
  if (state.endingType === 'cliffhanger' && satisfactionScore > 70) {
    recommendations.push('Cliffhanger with high satisfaction - rare achievement')
  }
  if (emotionalArcCompletion > 80) recommendations.push('Strong emotional arc completion')
  
  return { architecture, predictedEndingType, satisfactionScore, recommendations }
}

export function getEndingByType(state: NarrativeEndingState, beatType: string): EndingBeat[] {
  return state.beats.filter(b => b.beatType === beatType)
}

export function getSignatureBeats(state: NarrativeEndingState): EndingBeat[] {
  return state.beats.filter(b => b.isSignature)
}
