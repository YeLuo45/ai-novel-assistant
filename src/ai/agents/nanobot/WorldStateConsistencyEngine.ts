/**
 * WorldStateConsistencyEngine - V174
 * World State Continuity Verification & Timeline Engine
 * 
 * Design references:
 * - thunderbolt: feedback loops for continuous state monitoring
 * - ruflo: hierarchical decomposition (location -> scene -> timeline)
 * - generic-agent: autonomous consistency checking
 */

export type ConsistencyIssue = 'timeline_gap' | 'location_mismatch' | 'character_presence' | 'object_discrepancy' | 'property_change'

export interface WorldStateEntry {
  entryId: string
  chapter: number
  location: string
  characters: string[]
  objects: Record<string, string>  // object name -> state description
  timelineOffset: number  // relative time offset in story time
  summary: string
}

export interface ConsistencyViolation {
  violationId: string
  type: ConsistencyIssue
  chapter: number
  severity: number  // 0-100
  description: string
  affectedElements: string[]
}

export interface WorldState {
  entries: WorldStateEntry[]
  currentChapter: number
  activeLocation: string
  activeCharacters: string[]
  violations: ConsistencyViolation[]
  locationTimeline: Map<string, number>  // location -> timeline offset
}

function createEntryId(): string {
  return 'ws_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyWorldState(): WorldState {
  return {
    entries: [],
    currentChapter: 0,
    activeLocation: '',
    activeCharacters: [],
    violations: [],
    locationTimeline: new Map(),
  }
}

export function establishWorldState(state: WorldState, location: string, characters: string[], objects: Record<string, string>, chapter: number, summary: string): WorldState {
  const entry: WorldStateEntry = {
    entryId: createEntryId(),
    chapter,
    location,
    characters,
    objects: { ...objects },
    timelineOffset: state.locationTimeline.get(location) || 0,
    summary,
  }

  const violations = [...state.violations]
  const newLocationTimeline = new Map(state.locationTimeline)

  // Check for location timeline consistency
  if (newLocationTimeline.has(location)) {
    const prevOffset = newLocationTimeline.get(location) || 0
    if (Math.abs(entry.timelineOffset - prevOffset) > chapter - state.currentChapter && chapter > state.currentChapter + 1) {
      violations.push({
        violationId: 'cv_' + Date.now(),
        type: 'timeline_gap',
        chapter,
        severity: 50,
        description: 'Timeline gap detected at location ' + location,
        affectedElements: [location],
      })
    }
  }

  newLocationTimeline.set(location, entry.timelineOffset)

  // Check character presence consistency
  const prevEntry = state.entries.filter(e => e.location === location).slice(-1)[0]
  if (prevEntry) {
    const missingChars = prevEntry.characters.filter(c => !characters.includes(c))
    if (missingChars.length > 0) {
      violations.push({
        violationId: 'cv_' + Date.now(),
        type: 'character_presence',
        chapter,
        severity: 40,
        description: 'Character(s) left location without explanation: ' + missingChars.join(', '),
        affectedElements: missingChars,
      })
    }
  }

  return {
    ...state,
    entries: [...state.entries, entry],
    currentChapter: chapter,
    activeLocation: location,
    activeCharacters: characters,
    violations: violations.slice(-14),
    locationTimeline: newLocationTimeline,
  }
}

export function verifyWorldConsistency(state: WorldState, chapter: number): ConsistencyViolation[] {
  const relevantEntries = state.entries.filter(e => e.chapter <= chapter)
  if (relevantEntries.length < 2) return []

  const newViolations: ConsistencyViolation[] = []

  // Check for timeline inconsistencies across locations
  const locationOffsets = new Map<string, number>()
  for (const entry of relevantEntries) {
    if (!locationOffsets.has(entry.location)) {
      locationOffsets.set(entry.location, entry.timelineOffset)
    }
  }

  // Check character teleport (same character in distant locations at same relative time)
  const charLocations = new Map<string, Array<{ location: string; chapter: number; offset: number }>>()
  for (const entry of relevantEntries) {
    for (const char of entry.characters) {
      if (!charLocations.has(char)) charLocations.set(char, [])
      charLocations.get(char)!.push({ location: entry.location, chapter: entry.chapter, offset: entry.timelineOffset })
    }
  }

  for (const [char, locations] of charLocations) {
    if (locations.length >= 2) {
      for (let i = 1; i < locations.length; i++) {
        const prev = locations[i - 1]
        const curr = locations[i]
        const timeDiff = curr.offset - prev.offset
        const chapterDiff = curr.chapter - prev.chapter
        if (timeDiff < chapterDiff && curr.location !== prev.location) {
          newViolations.push({
            violationId: 'cv_' + Date.now() + '_' + i,
            type: 'character_presence',
            chapter: curr.chapter,
            severity: 60,
            description: 'Character ' + char + ' may have teleported from ' + prev.location + ' to ' + curr.location,
            affectedElements: [char, prev.location, curr.location],
          })
        }
      }
    }
  }

  return newViolations
}

export function getLocationHistory(state: WorldState, location: string): WorldStateEntry[] {
  return state.entries.filter(e => e.location === location)
}

export function getCharacterPresence(state: WorldState, characterId: string): WorldStateEntry[] {
  return state.entries.filter(e => e.characters.includes(characterId))
}

export function getActiveViolations(state: WorldState): ConsistencyViolation[] {
  return state.violations.filter(v => v.severity >= 40)
}

export function formatWorldSummary(state: WorldState): string {
  let s = '=== World State Summary ===\n'
  s += 'Total Entries: ' + state.entries.length + '\n'
  s += 'Current Chapter: ' + state.currentChapter + '\n'
  s += 'Locations Used: ' + (new Set(state.entries.map(e => e.location))).size + '\n'

  if (state.violations.length > 0) {
    s += '\n--- Violations (' + state.violations.length + ') ---\n'
    for (const v of state.violations.slice(-5)) {
      s += '  [' + v.type + '] Ch ' + v.chapter + ': ' + v.description.substring(0, 60) + '\n'
    }
  }
  return s
}

export function formatWorldDashboard(state: WorldState): string {
  let s = '=== World State Dashboard ===\n'
  s += 'Chapter: ' + state.currentChapter + '\n'
  s += 'Location: ' + state.activeLocation + '\n'
  s += 'Characters: ' + state.activeCharacters.join(', ') + '\n'

  if (state.entries.length > 0) {
    s += '\n--- Recent Locations ---\n'
    const recentLocations = state.entries.slice(-5).reverse()
    for (const e of recentLocations) {
      s += '  Ch ' + e.chapter + ': ' + e.location + ' [' + e.characters.length + ' chars]\n'
    }
  }

  const highSeverity = state.violations.filter(v => v.severity >= 60)
  if (highSeverity.length > 0) {
    s += '\n--- Critical Violations ---\n'
    for (const v of highSeverity) {
      s += '  [' + v.type + '] Ch ' + v.chapter + ' [severity: ' + v.severity + ']: ' + v.description + '\n'
    }
  }
  return s
}
