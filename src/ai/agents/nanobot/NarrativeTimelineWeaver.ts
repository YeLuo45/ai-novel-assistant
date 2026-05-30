/**
 * NarrativeTimelineWeaver — V457
 * Non-linear timeline management, flashforward/flashback tracking, chronology weaving for complex narratives.
 * Inspired by: ruflo (hierarchical decomposition), generic-agent (optimization), thunderbolt (feedback loops)
 */

export type TimelineEventType = 'present' | 'flashback' | 'flashforward' | 'frame' | 'elepsis'

export interface TimelineEvent {
  id: string
  eventType: TimelineEventType
  chapterAnchor: number
  chronologicalOrder: number  // what order this event occurs in story time
  content: string
  emotionalWeight: number  // 0-100
  causeChain: string[]  // IDs of events this causes
  effectChain: string[]  // IDs of events caused by this
}

export interface TimelineReport {
  totalEvents: number
  timelineQuality: number  // 0-100
  coherenceScore: number  // 0-100
  paradoxCount: number
  recommendations: string[]
}

export interface NarrativeTimelineState {
  events: TimelineEvent[]
  report: TimelineReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeTimelineState {
  return { events: [], report: null, typeAlias: {} }
}

export function addTimelineEvent(
  state: NarrativeTimelineState,
  eventType: TimelineEventType,
  chapterAnchor: number,
  chronologicalOrder: number,
  content: string,
  emotionalWeight: number
): NarrativeTimelineState {
  const id = `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const event: TimelineEvent = { id, eventType, chapterAnchor, chronologicalOrder, content, emotionalWeight: Math.max(0, Math.min(100, emotionalWeight)), causeChain: [], effectChain: [] }
  const events = [...state.events, event].sort((a, b) => a.chronologicalOrder - b.chronologicalOrder)
  return { ...state, events }
}

export function linkCauseEffect(state: NarrativeTimelineState, causeId: string, effectId: string): NarrativeTimelineState {
  const events = state.events.map(e => {
    if (e.id === causeId) return { ...e, effectChain: [...e.effectChain, effectId] }
    if (e.id === effectId) return { ...e, causeChain: [...e.causeChain, causeId] }
    return e
  })
  return { ...state, events }
}

export function generateTimelineReport(state: NarrativeTimelineState): TimelineReport {
  if (state.events.length === 0) {
    return { totalEvents: 0, timelineQuality: 100, coherenceScore: 100, paradoxCount: 0, recommendations: [] }
  }
  
  const totalEvents = state.events.length
  const flashbackCount = state.events.filter(e => e.eventType === 'flashback').length
  const flashforwardCount = state.events.filter(e => e.eventType === 'flashforward').length
  
  // Timeline quality: more non-linear = harder to maintain quality
  const nonLinearRatio = (flashbackCount + flashforwardCount) / totalEvents
  let timelineQuality = Math.max(20, Math.min(100, Math.round(100 - nonLinearRatio * 60)))
  
  // Check for paradoxes: effect before cause in chronological order
  let paradoxCount = 0
  for (const event of state.events) {
    for (const effectId of event.effectChain) {
      const effectEvent = state.events.find(e => e.id === effectId)
      if (effectEvent && effectEvent.chronologicalOrder < event.chronologicalOrder) {
        paradoxCount++
      }
    }
  }
  
  // Coherence: connected events have higher coherence
  const connectedEvents = state.events.filter(e => e.causeChain.length > 0 || e.effectChain.length > 0)
  const coherenceScore = Math.round((connectedEvents.length / totalEvents) * timelineQuality)
  
  const recommendations: string[] = []
  if (paradoxCount > 0) recommendations.push(`${paradoxCount} timeline paradoxes detected - resolve cause-effect ordering`)
  if (nonLinearRatio > 0.4) recommendations.push('Very non-linear timeline - ensure readers can follow')
  if (coherenceScore < 60) recommendations.push('Low timeline coherence - add more cause-effect links')
  if (state.events.every(e => e.eventType === 'present')) {
    recommendations.push('Linear timeline only - consider non-linear techniques for impact')
  }
  if (timelineQuality > 85 && nonLinearRatio > 0.3) {
    recommendations.push('Excellent non-linear structure - well-managed timeline complexity')
  }
  
  return { totalEvents, timelineQuality, coherenceScore, paradoxCount, recommendations }
}

export function getEventsByType(state: NarrativeTimelineState, eventType: TimelineEventType): TimelineEvent[] {
  return state.events.filter(e => e.eventType === eventType)
}

export function getEventChain(state: NarrativeTimelineState, eventId: string): TimelineEvent[] {
  const event = state.events.find(e => e.id === eventId)
  if (!event) return []
  const chain: TimelineEvent[] = []
  for (const effectId of event.effectChain) {
    const effect = state.events.find(e => e.id === effectId)
    if (effect) chain.push(effect)
  }
  return chain
}
