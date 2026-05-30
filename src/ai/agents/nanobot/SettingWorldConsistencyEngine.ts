export interface LocationEntry {
  locationId: string
  name: string
  firstChapter: number
  lastChapter: number
  description: string
  consistencyScore: number  // 0-100
}

export interface TimeLineEvent {
  eventId: string
  chapter: number
  event: string
  affectedLocations: string[]
}

export interface SettingWorldState {
  locations: Map<string, LocationEntry>
  timeline: TimeLineEvent[]
  currentChapter: number
  consistencyScore: number  // 0-100
  timelineGaps: number[]
}

function createLocationId(): string {
  return 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function createEventId(): string {
  return 'event_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessLocationConsistency(location: LocationEntry, events: TimeLineEvent[]): number {
  let score = 100
  const locationEvents = events.filter(e => e.affectedLocations.includes(location.name))

  if (locationEvents.length === 0) {
    return 60  // Unmentioned location is suspicious
  }

  // Check for time paradoxes
  for (let i = 0; i < locationEvents.length; i++) {
    for (let j = i + 1; j < locationEvents.length; j++) {
      const e1 = locationEvents[i]
      const e2 = locationEvents[j]
      if (e1.chapter > e2.chapter && e1.event.toLowerCase().includes('before')) {
        score -= 10
      }
    }
  }

  return Math.max(0, score)
}

function findTimelineGaps(events: TimeLineEvent[], currentChapter: number): number[] {
  if (events.length < 2) return []
  const gaps: number[] = []
  const chapters = [...new Set(events.map(e => e.chapter))].sort((a, b) => a - b)

  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i] - chapters[i - 1] > 3) {
      gaps.push(chapters[i - 1])
    }
  }
  return gaps
}

export function createEmptySettingWorldState(): SettingWorldState {
  return { locations: new Map(), timeline: [], currentChapter: 0, consistencyScore: 100, timelineGaps: [] }
}

export function registerLocation(
  state: SettingWorldState,
  name: string,
  description: string
): SettingWorldState {
  const newLocations = new Map(state.locations)

  const entry: LocationEntry = {
    locationId: createLocationId(),
    name,
    firstChapter: state.currentChapter || 1,
    lastChapter: state.currentChapter,
    description,
    consistencyScore: 100,
  }

  newLocations.set(name, entry)
  return { ...state, locations: newLocations }
}

export function addTimelineEvent(
  state: SettingWorldState,
  chapter: number,
  event: string,
  affectedLocationNames: string[]
): SettingWorldState {
  const newTimeline = [...state.timeline, {
    eventId: createEventId(),
    chapter,
    event,
    affectedLocations: affectedLocationNames,
  }]

  // Update location last chapters
  const newLocations = new Map(state.locations)
  for (const locName of affectedLocationNames) {
    const loc = newLocations.get(locName)
    if (loc) {
      newLocations.set(locName, {
        ...loc,
        lastChapter: Math.max(loc.lastChapter, chapter),
        consistencyScore: assessLocationConsistency({ ...loc, lastChapter: Math.max(loc.lastChapter, chapter) }, newTimeline),
      })
    } else {
      // Auto-register location
      const newLoc: LocationEntry = {
        locationId: createLocationId(),
        name: locName,
        firstChapter: chapter,
        lastChapter: chapter,
        description: '',
        consistencyScore: 100,
      }
      newLocations.set(locName, newLoc)
    }
  }

  const avgConsistency = [...newLocations.values()].length > 0
    ? Math.round([...newLocations.values()].reduce((sum, l) => sum + l.consistencyScore, 0) / newLocations.size)
    : 100

  const gaps = findTimelineGaps(newTimeline, state.currentChapter)

  return {
    ...state,
    locations: newLocations,
    timeline: newTimeline,
    currentChapter: Math.max(state.currentChapter, chapter),
    consistencyScore: avgConsistency,
    timelineGaps: gaps,
  }
}

export function getLocationInfo(state: SettingWorldState, name: string): LocationEntry | null {
  return state.locations.get(name) || null
}

export function getTimelineGaps(state: SettingWorldState): number[] {
  return state.timelineGaps
}

export function formatSettingSummary(state: SettingWorldState): string {
  let s = "=== Setting & World Summary ===" + "\n"
  s += "Locations: " + state.locations.size + "\n"
  s += "Timeline Events: " + state.timeline.length + "\n"
  s += "Consistency: " + state.consistencyScore + "\n"
  s += "Timeline Gaps: " + state.timelineGaps.length + "\n"
  return s
}

export function formatSettingDashboard(state: SettingWorldState): string {
  let s = "=== Setting & World Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Locations: " + state.locations.size + " | Consistency: " + state.consistencyScore + "\n"
  s += "Timeline Events: " + state.timeline.length + "\n"

  if (state.locations.size > 0) {
    s += "\n--- Recent Locations ---" + "\n"
    for (const [, loc] of [...state.locations].slice(-3)) {
      s += "  " + loc.name + " ch" + loc.firstChapter + "-" + loc.lastChapter + " consistency=" + loc.consistencyScore + "\n"
    }
  }

  if (state.timelineGaps.length > 0) {
    s += "\n--- Timeline Gaps ---" + "\n"
    for (const gap of state.timelineGaps.slice(0, 3)) {
      s += "  Gap after chapter " + gap + "\n"
    }
  }

  return s
}
