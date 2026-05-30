/**
 * NarrativeTimeTracker — V407
 * Timeline management, chronological consistency, time jumps tracking across narrative.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition), generic-agent (validation)
 */

export type TimeJump = 'flashback' | 'flashforward' | 'dream_sequence' | 'memory' | 'prophecy' | 'time_loop'

export interface TimelineEvent {
  id: string
  chapterId: string
  narrativeOrder: number  // order within story
  storyTime: number  // fictional time (e.g., day number, year offset)
  realDuration: number  // pages/words
  eventDescription: string
  timeJumpType: TimeJump | null
  isAnchor: boolean  // fixed point in timeline
}

export interface TimelineConsistencyReport {
  totalEvents: number
  paradoxes: Array<{ event1: string; event2: string; issue: string }>
  gaps: number[]  // narrative orders with gaps
  recommendedAnchors: string[]
  recommendations: string[]
}

export interface NarrativeTimeState {
  events: TimelineEvent[]
  consistencyReport: TimelineConsistencyReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeTimeState {
  return { events: [], consistencyReport: null, typeAlias: {} }
}

export function addTimelineEvent(
  state: NarrativeTimeState,
  chapterId: string,
  narrativeOrder: number,
  storyTime: number,
  realDuration: number,
  eventDescription: string,
  isAnchor: boolean = false
): NarrativeTimeState {
  const id = `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const event: TimelineEvent = { id, chapterId, narrativeOrder, storyTime, realDuration, eventDescription, timeJumpType: null, isAnchor }
  const events = [...state.events.filter(e => !(e.narrativeOrder === narrativeOrder && e.chapterId === chapterId)), event].sort((a, b) => a.narrativeOrder - b.narrativeOrder)
  return { ...state, events }
}

export function markTimeJump(
  state: NarrativeTimeState,
  eventId: string,
  jumpType: TimeJump
): NarrativeTimeState {
  const events = state.events.map(e => e.id === eventId ? { ...e, timeJumpType: jumpType } : e)
  return { ...state, events }
}

export function setAnchor(state: NarrativeTimeState, eventId: string): NarrativeTimeState {
  const events = state.events.map(e => ({ ...e, isAnchor: e.id === eventId }))
  return { ...state, events }
}

export function generateConsistencyReport(state: NarrativeTimeState): TimelineConsistencyReport {
  if (state.events.length === 0) {
    return { totalEvents: 0, paradoxes: [], gaps: [], recommendedAnchors: [], recommendations: [] }
  }
  
  const totalEvents = state.events.length
  const paradoxes: Array<{ event1: string; event2: string; issue: string }> = []
  
  // Check chronological paradoxes
  for (let i = 0; i < state.events.length; i++) {
    for (let j = i + 1; j < state.events.length; j++) {
      const e1 = state.events[i]
      const e2 = state.events[j]
      if (e1.storyTime > e2.storyTime && e1.narrativeOrder < e2.narrativeOrder && !e1.timeJumpType && !e2.timeJumpType) {
        paradoxes.push({ event1: e1.eventDescription.slice(0, 30), event2: e2.eventDescription.slice(0, 30), issue: 'Event occurs later in story time but earlier in narrative order' })
      }
    }
  }
  
  // Find narrative order gaps
  const orders = state.events.map(e => e.narrativeOrder).sort((a, b) => a - b)
  const gaps: number[] = []
  for (let i = 1; i < orders.length; i++) {
    if (orders[i] - orders[i - 1] > 1) {
      for (let g = orders[i - 1] + 1; g < orders[i]; g++) gaps.push(g)
    }
  }
  
  // Recommend anchors: events with high realDuration and no jump type
  const recommendedAnchors = state.events.filter(e => e.realDuration > 1000 && !e.timeJumpType).map(e => e.eventDescription.slice(0, 40))
  
  const recommendations: string[] = []
  if (paradoxes.length > 0) recommendations.push(`${paradoxes.length} timeline paradox(es) detected - resolve before final draft`)
  if (gaps.length > state.events.length * 0.2) recommendations.push('Many narrative gaps - fill with connecting events')
  if (recommendedAnchors.length === 0) recommendations.push('Add anchor events to stabilize timeline')
  if (state.events.filter(e => e.timeJumpType === 'time_loop').length > 1) recommendations.push('Multiple time loops detected - ensure consistency')
  if (totalEvents > 20 && paradoxes.length === 0) recommendations.push('Timeline is well-structured - maintain this consistency')
  
  return { totalEvents, paradoxes, gaps, recommendedAnchors, recommendations }
}

export function getTimelineSlice(state: NarrativeTimeState, fromOrder: number, toOrder: number): TimelineEvent[] {
  return state.events.filter(e => e.narrativeOrder >= fromOrder && e.narrativeOrder <= toOrder)
}

export function compareChapterTiming(state: NarrativeTimeState, ch1: string, ch2: string): {
  longerChapter: string
  timeSpan1: number
  timeSpan2: number
} {
  const ev1 = state.events.filter(e => e.chapterId === ch1)
  const ev2 = state.events.filter(e => e.chapterId === ch2)
  const timeSpan1 = ev1.length > 0 ? Math.max(...ev1.map(e => e.storyTime)) - Math.min(...ev1.map(e => e.storyTime)) : 0
  const timeSpan2 = ev2.length > 0 ? Math.max(...ev2.map(e => e.storyTime)) - Math.min(...ev2.map(e => e.storyTime)) : 0
  const totalDur1 = ev1.reduce((s, e) => s + e.realDuration, 0)
  const totalDur2 = ev2.reduce((s, e) => s + e.realDuration, 0)
  return { longerChapter: totalDur1 > totalDur2 ? ch1 : ch2, timeSpan1, timeSpan2 }
}
