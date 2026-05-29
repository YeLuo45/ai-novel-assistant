/**
 * NarrativeConsistencyChecker — V369
 * Cross-engine consistency validation, continuity error detection, timeline verification.
 * Inspired by: ruflo (hierarchical decomposition), thunderbolt (feedback loops), generic-agent (validation)
 */

export type ConsistencySeverity = 'critical' | 'major' | 'minor' | 'suggestion'

export interface ConsistencyIssue {
  id: string
  type: IssueType
  severity: ConsistencySeverity
  description: string
  relatedElements: string[]
  chapterId?: string
  autoFixable: boolean
}

export type IssueType = 'timeline' | 'character' | 'setting' | 'plot' | 'tone' | 'theme' | 'motif' | 'pacing'

export interface ConsistencyReport {
  totalIssues: number
  criticalIssues: number
  majorIssues: number
  minorIssues: number
  suggestions: number
  overallScore: number  // 0-100
  issues: ConsistencyIssue[]
  recommendations: string[]
}

export interface NarrativeConsistencyState {
  issues: ConsistencyIssue[]
  timelineEvents: TimelineEvent[]
  characterStates: Record<string, Record<string, unknown>>
  resolvedIssueIds: string[]
  typeAlias: Record<string, unknown>
}

export interface TimelineEvent {
  id: string
  chapterId: string
  timestamp: number
  description: string
  characters: string[]
  verified: boolean
}

export function createEmptyState(): NarrativeConsistencyState {
  return {
    issues: [],
    timelineEvents: [],
    characterStates: {},
    resolvedIssueIds: [],
    typeAlias: {},
  }
}

export function addTimelineEvent(
  state: NarrativeConsistencyState,
  chapterId: string,
  timestamp: number,
  description: string,
  characters: string[]
): NarrativeConsistencyState {
  const event: TimelineEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    chapterId, timestamp, description, characters, verified: false,
  }
  return { ...state, timelineEvents: [...state.timelineEvents, event] }
}

export function verifyCharacterState(
  state: NarrativeConsistencyState,
  characterId: string,
  attribute: string,
  expectedValue: unknown
): NarrativeConsistencyState {
  if (!state.characterStates[characterId]) {
    state.characterStates[characterId] = {}
  }
  const prev = state.characterStates[characterId][attribute]
  if (prev !== undefined && prev !== expectedValue) {
    const issue: ConsistencyIssue = {
      id: `issue_${Date.now()}`,
      type: 'character',
      severity: 'major',
      description: `Character ${characterId} ${attribute} changed from ${prev} to ${expectedValue}`,
      relatedElements: [characterId],
      autoFixable: false,
    }
    return { ...state, issues: [...state.issues, issue], characterStates: { ...state.characterStates, [characterId]: { ...state.characterStates[characterId], [attribute]: expectedValue } } }
  }
  return { ...state, characterStates: { ...state.characterStates, [characterId]: { ...state.characterStates[characterId], [attribute]: expectedValue } } }
}

export function checkTimelineConsistency(state: NarrativeConsistencyState): ConsistencyIssue[] {
  const events = state.timelineEvents.sort((a, b) => a.timestamp - b.timestamp)
  const issues: ConsistencyIssue[] = []
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1], curr = events[i]
    // Check for time paradox (current event before previous)
    if (curr.timestamp < prev.timestamp) {
      issues.push({
        id: `tp_${curr.id}`,
        type: 'timeline', severity: 'critical',
        description: `Timeline paradox: "${curr.description}" (ch${curr.chapterId}) occurs before "${prev.description}" (ch${prev.chapterId})`,
        relatedElements: [prev.id, curr.id], autoFixable: false,
      })
    }
    // Check for large time gaps suggesting continuity error
    if (curr.timestamp - prev.timestamp > 1000 * 60 * 60 * 24 * 365 * 10) {
      issues.push({
        id: `tlg_${curr.id}`,
        type: 'timeline', severity: 'minor',
        description: `Large time gap detected: no events for ${Math.round((curr.timestamp - prev.timestamp) / (1000 * 60 * 60 * 24 * 365))} years between events`,
        relatedElements: [prev.id, curr.id], autoFixable: false,
      })
    }
  }
  return issues
}

export function detectCharacterConsistency(state: NarrativeConsistencyState): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []
  const charAppearances: Record<string, TimelineEvent[]> = {}
  for (const evt of state.timelineEvents) {
    for (const char of evt.characters) {
      if (!charAppearances[char]) charAppearances[char] = []
      charAppearances[char].push(evt)
    }
  }
  for (const [char, events] of Object.entries(charAppearances)) {
    if (events.length < 2) continue
    events.sort((a, b) => a.timestamp - b.timestamp)
    for (let i = 1; i < events.length; i++) {
      const gap = events[i].timestamp - events[i - 1].timestamp
      // Character appears after 1 year gap with no explanation
      if (gap > 1000 * 60 * 60 * 24 * 365 && events[i].chapterId !== events[i - 1].chapterId) {
        issues.push({
          id: `cc_${char}_${i}`,
          type: 'character', severity: 'minor',
          description: `Character ${char} has ${Math.round(gap / (1000 * 60 * 60 * 24 * 365))} year gap between appearances (ch${events[i - 1].chapterId} to ch${events[i].chapterId}) without explanation`,
          relatedElements: [char, events[i - 1].id, events[i].id], autoFixable: false,
        })
      }
    }
  }
  return issues
}

export function generateConsistencyReport(state: NarrativeConsistencyState): ConsistencyReport {
  const allIssues = [...state.issues, ...checkTimelineConsistency(state), ...detectCharacterConsistency(state)]
  const criticalIssues = allIssues.filter(i => i.severity === 'critical')
  const majorIssues = allIssues.filter(i => i.severity === 'major')
  const minorIssues = allIssues.filter(i => i.severity === 'minor')
  const suggestions = allIssues.filter(i => i.severity === 'suggestion')
  const totalIssues = allIssues.length
  const deductionPerCritical = 20, deductionPerMajor = 10, deductionPerMinor = 3
  const overallScore = Math.max(0, 100 - (criticalIssues.length * deductionPerCritical + majorIssues.length * deductionPerMajor + minorIssues.length * deductionPerMinor))
  const recommendations: string[] = []
  if (criticalIssues.length > 0) recommendations.push(`Fix ${criticalIssues.length} critical consistency issues immediately`)
  if (majorIssues.length > 3) recommendations.push(`Address ${majorIssues.length} major consistency issues`)
  if (overallScore > 80) recommendations.push('Narrative consistency is strong - focus on refinement')
  if (overallScore < 50) recommendations.push('Significant consistency problems detected - review timeline and character arcs')
  return { totalIssues, criticalIssues: criticalIssues.length, majorIssues: majorIssues.length, minorIssues: minorIssues.length, suggestions: suggestions.length, overallScore, issues: allIssues, recommendations }
}

export function resolveIssue(state: NarrativeConsistencyState, issueId: string): NarrativeConsistencyState {
  return { ...state, resolvedIssueIds: [...state.resolvedIssueIds, issueId] }
}

export function getUnresolvedIssues(state: NarrativeConsistencyState): ConsistencyIssue[] {
  return state.issues.filter(i => !state.resolvedIssueIds.includes(i.id))
}
