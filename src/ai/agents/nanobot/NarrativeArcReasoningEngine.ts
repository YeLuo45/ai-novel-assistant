/**
 * NarrativeArcReasoningEngine — V519
 * Causal narrative chain analysis, plot hole detection, and logical consistency verification.
 * Inspired by: ruflo (hierarchical decomposition) + generic-agent (goal pursuit)
 */

export type NarrativeElement = 'cause' | 'effect' | 'setup' | 'payoff' | 'foreshadow' | 'callback' | 'revelation' | 'resolution'
export type LogicalConsistency = 'consistent' | 'minor_issue' | 'plot_hole' | 'contradiction'
export type ReasoningDepth = 'surface' | 'motivational' | 'thematic' | 'meta'

export interface NarrativeEvent {
  id: string
  timestamp: number        // narrative order (0-100)
  chapterNumber: number
  description: string
  causalFactors: string[] // IDs of events that caused this
  consequences: string[]  // IDs of events caused by this
  elementType: NarrativeElement
  characters: string[]
  emotionalWeight: number // -100 to 100
}

export interface CausalChain {
  id: string
  events: string[]         // event IDs in order
  chainType: 'linear' | 'branching' | 'converging' | 'cyclic'
  coherence: number        // 0-100
  complexity: number      // number of branching points
  keyRevelations: string[]
}

export interface ConsistencyCheck {
  id: string
  type: 'timeline' | 'character' | 'motivation' | 'world' | 'foreshadow'
  severity: 'info' | 'warning' | 'error'
  description: string
  affectedEvents: string[]
  suggestedFix?: string
  confidence: number       // 0-100
}

export interface PlotHole {
  id: string
  category: 'temporal' | 'causal' | 'character' | 'worldbuilding' | 'emotional'
  severity: 'minor' | 'major' | 'critical'
  setupEventId?: string
  payoffEventId?: string
  missingLink?: string     // What should have happened between setup and payoff
  explanation: string
  repairSuggestion: string
}

export interface ReasoningState {
  events: Record<string, NarrativeEvent>
  causalChains: Record<string, CausalChain>
  consistencyChecks: Record<string, ConsistencyCheck>
  plotHoles: Record<string, PlotHole>
  reasoningDepth: ReasoningDepth
  unresolvedQuestions: string[]
  thematicThreads: string[]
  totalEventsAnalyzed: number
  avgCoherence: number
}

export function createEmptyState(depth: ReasoningDepth = 'surface'): ReasoningState {
  return {
    events: {},
    causalChains: {},
    consistencyChecks: {},
    plotHoles: {},
    reasoningDepth: depth,
    unresolvedQuestions: [],
    thematicThreads: [],
    totalEventsAnalyzed: 0,
    avgCoherence: 50
  }
}

// --- Event Registration ---

export function registerNarrativeEvent(
  state: ReasoningState,
  chapterNumber: number,
  description: string,
  elementType: NarrativeElement,
  causalFactors: string[] = [],
  characters: string[] = [],
  emotionalWeight: number = 0
): { state: ReasoningState, eventId: string } {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  const event: NarrativeEvent = {
    id: eventId,
    timestamp: state.totalEventsAnalyzed * 5,
    chapterNumber,
    description,
    causalFactors,
    consequences: [],
    elementType,
    characters,
    emotionalWeight: Math.max(-100, Math.min(100, emotionalWeight))
  }

  // Update causal relationships
  const events = { ...state.events, [eventId]: event }
  for (const factorId of causalFactors) {
    if (events[factorId]) {
      events[factorId] = {
        ...events[factorId],
        consequences: Array.from(new Set([...events[factorId].consequences, eventId]))
      }
    }
  }

  return {
    state: {
      ...state,
      events,
      totalEventsAnalyzed: state.totalEventsAnalyzed + 1
    },
    eventId
  }
}

export function linkEvents(
  state: ReasoningState,
  causeEventId: string,
  effectEventId: string
): ReasoningState {
  const causeEvent = state.events[causeEventId]
  const effectEvent = state.events[effectEventId]
  if (!causeEvent || !effectEvent) return state

  const updatedCause = {
    ...causeEvent,
    consequences: Array.from(new Set([...causeEvent.consequences, effectEventId]))
  }
  const updatedEffect = {
    ...effectEvent,
    causalFactors: Array.from(new Set([...effectEvent.causalFactors, causeEventId]))
  }

  return {
    ...state,
    events: {
      ...state.events,
      [causeEventId]: updatedCause,
      [effectEventId]: updatedEffect
    }
  }
}

// --- Causal Chain Analysis ---

export function buildCausalChain(
  state: ReasoningState,
  startEventId: string,
  chainType: 'linear' | 'branching' | 'converging' | 'cyclic' = 'linear'
): { state: ReasoningState, chainId: string } {
  const chainId = `chain_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const visited = new Set<string>()
  const eventIds: string[] = []
  let current = startEventId
  let complexity = 0

  while (current && !visited.has(current)) {
    visited.add(current)
    eventIds.push(current)
    const event = state.events[current]
    if (!event) break

    if (event.consequences.length > 1) complexity++
    current = event.consequences[0] || ''
  }

  // Detect cycles
  let hasCycle = false
  for (const eventId of eventIds) {
    const event = state.events[eventId]
    if (event && event.consequences.some(c => eventIds.includes(c) && c !== eventId)) {
      hasCycle = true
    }
  }

  const actualChainType = hasCycle ? 'cyclic' : chainType
  const coherence = calculateChainCoherence(state, eventIds)

  const chain: CausalChain = {
    id: chainId,
    events: eventIds,
    chainType: actualChainType,
    coherence,
    complexity,
    keyRevelations: eventIds.filter(id => state.events[id]?.elementType === 'revelation')
  }

  return {
    state: { ...state, causalChains: { ...state.causalChains, [chainId]: chain } },
    chainId
  }
}

function calculateChainCoherence(state: ReasoningState, eventIds: string[]): number {
  if (eventIds.length < 2) return 100
  let coherenceSum = 80

  for (let i = 0; i < eventIds.length - 1; i++) {
    const current = state.events[eventIds[i]]
    const next = state.events[eventIds[i + 1]]
    if (!current || !next) continue

    // Check if there's a causal link
    if (!current.consequences.includes(eventIds[i + 1])) {
      coherenceSum -= 10
    }
    // Check emotional continuity
    const emotionalGap = Math.abs(current.emotionalWeight - next.emotionalWeight)
    if (emotionalGap > 60) coherenceSum -= 5
  }

  return Math.max(0, coherenceSum)
}

export function analyzeForeshadowPayoff(state: ReasoningState): ReasoningState {
  const setups = Object.values(state.events).filter(e => e.elementType === 'foreshadow')
  const payoffs = Object.values(state.events).filter(e => e.elementType === 'payoff')

  const checks: Record<string, ConsistencyCheck> = { ...state.consistencyChecks }

  for (const setup of setups) {
    const relevantPayoffs = payoffs.filter(p =>
      p.chapterNumber > setup.chapterNumber &&
      p.characters.some(c => setup.characters.includes(c))
    )

    if (relevantPayoffs.length === 0) {
      const checkId = `check_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      checks[checkId] = {
        id: checkId,
        type: 'foreshadow',
        severity: 'warning',
        description: `Foreshadowing in "${setup.description}" has no detected payoff`,
        affectedEvents: [setup.id],
        confidence: 75
      }
    }
  }

  return { ...state, consistencyChecks: checks }
}

// --- Plot Hole Detection ---

export function detectPlotHole(
  state: ReasoningState,
  category: PlotHole['category'],
  severity: PlotHole['severity'],
  setupEventId: string | undefined,
  payoffEventId: string | undefined,
  missingLink: string | undefined,
  explanation: string,
  repairSuggestion: string
): ReasoningState {
  const holeId = `hole_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const plotHole: PlotHole = {
    id: holeId,
    category,
    severity,
    setupEventId,
    payoffEventId,
    missingLink,
    explanation,
    repairSuggestion
  }

  return {
    ...state,
    plotHoles: { ...state.plotHoles, [holeId]: plotHole }
  }
}

export function detectTemporalInconsistency(state: ReasoningState): ReasoningState {
  const events = Object.values(state.events).sort((a, b) => a.timestamp - b.timestamp)
  const checks = { ...state.consistencyChecks }

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const e1 = events[i]
      const e2 = events[j]

      if (e1.chapterNumber === e2.chapterNumber && e1.timestamp < e2.timestamp) {
        const checkId = `check_${Math.random().toString(36).slice(2, 6)}`
        checks[checkId] = {
          id: checkId,
          type: 'timeline',
          severity: 'error',
          description: `Temporal inconsistency: "${e2.description}" occurs before "${e1.description}" in same chapter`,
          affectedEvents: [e1.id, e2.id],
          confidence: 90
        }
      }
    }
  }

  return { ...state, consistencyChecks: checks }
}

export function detectMotivationalInconsistency(state: ReasoningState): ReasoningState {
  const checks = { ...state.consistencyChecks }
  const characterEvents: Record<string, NarrativeEvent[]> = {}

  for (const event of Object.values(state.events)) {
    for (const char of event.characters) {
      if (!characterEvents[char]) characterEvents[char] = []
      characterEvents[char].push(event)
    }
  }

  for (const [char, events] of Object.entries(characterEvents)) {
    if (events.length < 3) continue
    const sorted = events.sort((a, b) => a.timestamp - b.timestamp)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].emotionalWeight < 0 && sorted[i - 1].emotionalWeight > 50) {
        const checkId = `check_${Math.random().toString(36).slice(2, 6)}`
        checks[checkId] = {
          id: checkId,
          type: 'motivation',
          severity: 'warning',
          description: `Character "${char}" shows drastic motivational shift from positive to negative emotion`,
          affectedEvents: [sorted[i - 1].id, sorted[i].id],
          confidence: 65
        }
      }
    }
  }

  return { ...state, consistencyChecks: checks }
}

// --- Thematic Thread Tracking ---

export function addThematicThread(state: ReasoningState, thread: string): ReasoningState {
  return {
    ...state,
    thematicThreads: Array.from(new Set([...state.thematicThreads, thread]))
  }
}

export function addUnresolvedQuestion(state: ReasoningState, question: string): ReasoningState {
  return {
    ...state,
    unresolvedQuestions: [...state.unresolvedQuestions, question]
  }
}

export function resolveQuestion(state: ReasoningState, question: string): ReasoningState {
  return {
    ...state,
    unresolvedQuestions: state.unresolvedQuestions.filter(q => q !== question)
  }
}

// --- Query Functions ---

export function getEventById(state: ReasoningState, eventId: string): NarrativeEvent | null {
  return state.events[eventId] || null
}

export function getChainById(state: ReasoningState, chainId: string): CausalChain | null {
  return state.causalChains[chainId] || null
}

export function getEventsByType(state: ReasoningState, elementType: NarrativeElement): NarrativeEvent[] {
  return Object.values(state.events).filter(e => e.elementType === elementType)
}

export function getChainsByType(state: ReasoningState, chainType: CausalChain['chainType']): CausalChain[] {
  return Object.values(state.causalChains).filter(c => c.chainType === chainType)
}

export function getCriticalPlotHoles(state: ReasoningState): PlotHole[] {
  return Object.values(state.plotHoles).filter(h => h.severity === 'critical')
}

export function getConsistencySummary(state: ReasoningState): {
  totalEvents: number,
  totalChains: number,
  consistencyIssues: number,
  criticalPlotHoles: number,
  avgCoherence: number,
  unresolvedQuestions: number
} {
  return {
    totalEvents: Object.keys(state.events).length,
    totalChains: Object.keys(state.causalChains).length,
    consistencyIssues: Object.keys(state.consistencyChecks).length,
    criticalPlotHoles: Object.values(state.plotHoles).filter(h => h.severity === 'critical').length,
    avgCoherence: state.avgCoherence,
    unresolvedQuestions: state.unresolvedQuestions.length
  }
}

export function getCausalPath(state: ReasoningState, fromEventId: string, toEventId: string): string[] | null {
  const visited = new Set<string>()
  const path: string[] = []

  function dfs(current: string): boolean {
    if (current === toEventId) {
      path.push(current)
      return true
    }
    if (visited.has(current)) return false
    visited.add(current)
    path.push(current)

    const event = state.events[current]
    if (!event) return false

    for (const nextId of event.consequences) {
      if (dfs(nextId)) return true
    }

    path.pop()
    return false
  }

  if (dfs(fromEventId)) return path
  return null
}