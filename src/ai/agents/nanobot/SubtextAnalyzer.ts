/**
 * SubtextAnalyzer — V377
 * Hidden meaning detection, unspoken tension, layered communication analysis.
 * Inspired by: chatdev (dialogue analysis), generic-agent (pattern recognition), ruflo (layered decomposition)
 */

export interface DialogueExchanges {
  speaker1: string
  speaker2: string
  lines: ExchangeLine[]
}

export interface ExchangeLine {
  speaker: string
  text: string
  surfaceMeaning: string
  subtextScore: number  // 0-100 (how much unsaid meaning)
  tensionLevel: number  // 0-100
}

export interface SubtextAnalysis {
  overallSubtextScore: number  // 0-100
  dominantTensionType: TensionType
  powerDynamics: PowerDynamic
  hiddenConflicts: string[]
  recommendations: string[]
}

export type TensionType = 'romantic' | 'hostile' | 'competitive' | 'protective' | 'resentful' | 'manipulative' | 'none'

export type PowerDynamic = 'equal' | 'dominant_submissive' | 'shifting' | 'unclear'

export interface SubtextState {
  exchanges: DialogueExchanges[]
  analyses: Record<string, SubtextAnalysis>
  tensionHotspots: { chapterId: string; position: number; tensionLevel: number }[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): SubtextState {
  return { exchanges: [], analyses: {}, tensionHotspots: [], typeAlias: {} }
}

function detectTensionType(text1: string, text2: string): TensionType {
  const combined = (text1 + ' ' + text2).toLowerCase()
  if (['kiss', 'love', 'heart', 'touch', 'hold', 'embrace'].some(w => combined.includes(w))) return 'romantic'
  if (['hate', 'kill', 'die', 'destroy', 'ruin', 'ruin'].some(w => combined.includes(w))) return 'hostile'
  if (['beat', 'win', 'lose', 'compete', 'better'].some(w => combined.includes(w))) return 'competitive'
  if (['protect', 'save', 'guard', 'shield', 'defend'].some(w => combined.includes(w))) return 'protective'
  if (['should', 'deserve', 'owed', 'bitter', 'unfair'].some(w => combined.includes(w))) return 'resentful'
  if (['please', 'trust', 'help', 'need', 'want'].some(w => combined.includes(w))) return 'manipulative'
  return 'none'
}

function analyzeSubtext(text: string): { surfaceMeaning: string; subtextScore: number; tensionLevel: number } {
  const surfaceMeaning = text
  const ellipsisCount = (text.match(/\.\.\./g) || []).length
  const questionCount = (text.match(/\?/g) || []).length
  const exclamationCount = (text.match(/!/g) || []).length
  const shortLine = text.split(/\s+/).length < 10
  
  // Subtext indicators: ellipsis, trailing off, questions that aren't really questions
  let subtextScore = 20
  subtextScore += ellipsisCount * 15
  subtextScore += shortLine ? 15 : 0
  if (questionCount > 0 && !text.includes('?')) subtextScore += 20  // rhetorical
  
  // Tension indicators: short responses, contradictions, loaded words
  let tensionLevel = 10
  const loadedWords = ['always', 'never', 'every', 'nothing', 'everything', 'anyway', 'fine', 'sure']
  tensionLevel += loadedWords.filter(w => ` ${text.toLowerCase()}.includes(' ${w}'`)).length * 15
  if (shortLine && text.length < 30) tensionLevel += 20
  tensionLevel += questionCount * 8
  tensionLevel += exclamationCount * 5
  
  return {
    surfaceMeaning,
    subtextScore: Math.min(100, subtextScore),
    tensionLevel: Math.min(100, tensionLevel),
  }
}

export function analyzeExchange(
  state: SubtextState,
  speaker1: string,
  speaker2: string,
  exchangeId: string
): SubtextState {
  const exchange = state.exchanges.find(e => `${e.speaker1}-${e.speaker2}` === exchangeId || `${e.speaker2}-${e.speaker1}` === exchangeId)
  if (!exchange) return state
  
  const lines = exchange.lines.map(line => {
    const analysis = analyzeSubtext(line.text)
    return { ...line, ...analysis }
  })
  
  const overallSubtextScore = lines.reduce((s, l) => s + (l as any).subtextScore, 0) / lines.length
  const avgTension = lines.reduce((s, l) => s + (l as any).tensionLevel, 0) / lines.length
  
  // Tension type from first few lines
  let dominantTensionType: TensionType = 'none'
  for (let i = 0; i < Math.min(3, lines.length - 1); i++) {
    const tt = detectTensionType(lines[i].text, lines[i + 1].text)
    if (tt !== 'none') { dominantTensionType = tt; break }
  }
  
  // Power dynamic: count who speaks more, who interrupts
  const s1Lines = lines.filter(l => l.speaker === speaker1)
  const s2Lines = lines.filter(l => l.speaker === speaker2)
  let powerDynamics: PowerDynamic = 'equal'
  if (Math.abs(s1Lines.length - s2Lines.length) > 3) {
    powerDynamics = s1Lines.length > s2Lines.length ? 'dominant_submissive' : 'dominant_submissive'
  }
  
  const hiddenConflicts: string[] = []
  if (avgTension > 60) hiddenConflicts.push('High tension detected in exchange')
  if (overallSubtextScore > 50) hiddenConflicts.push('Significant subtext present - underlying meaning unstated')
  
  const recommendations: string[] = []
  if (avgTension > 50) recommendations.push('Consider making the conflict more explicit')
  if (overallSubtextScore < 30) recommendations.push('Add more subtext for layered dialogue')
  if (powerDynamics === 'equal') recommendations.push('Vary power dynamics for more interesting tension')
  
  const analysis: SubtextAnalysis = {
    overallSubtextScore: Math.round(overallSubtextScore),
    dominantTensionType,
    powerDynamics,
    hiddenConflicts,
    recommendations,
  }
  
  // Find tension hotspots
  const hotspots = lines
    .map((line, idx) => ({ chapterId: exchangeId, position: idx * 10, tensionLevel: (line as any).tensionLevel }))
    .filter(h => h.tensionLevel > 50)
  
  return {
    ...state,
    analyses: { ...state.analyses, [exchangeId]: analysis },
    tensionHotspots: [...state.tensionHotspots, ...hotspots].slice(-50),
  }
}

export function recordExchange(
  state: SubtextState,
  speaker1: string,
  speaker2: string,
  exchanges: { speaker: string; text: string }[]
): SubtextState {
  const lines: ExchangeLine[] = exchanges.map(e => {
    const analysis = analyzeSubtext(e.text)
    return { speaker: e.speaker, text: e.text, surfaceMeaning: analysis.surfaceMeaning, subtextScore: analysis.subtextScore, tensionLevel: analysis.tensionLevel }
  })
  const exchange: DialogueExchanges = { speaker1, speaker2, lines }
  return { ...state, exchanges: [...state.exchanges, exchange] }
}

export function getSubtextAnalysis(state: SubtextState, exchangeId: string): SubtextAnalysis | null {
  return state.analyses[exchangeId] || null
}

export function getTensionHotspots(state: SubtextState): { chapterId: string; position: number; tensionLevel: number }[] {
  return state.tensionHotspots.sort((a, b) => b.tensionLevel - a.tensionLevel)
}
