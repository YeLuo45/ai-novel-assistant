export interface BackstoryEvent {
  eventId: string
  characterId: string
  chapter: number
  age: number
  title: string
  description: string
  emotionalTags: string[]
  importance: 'minor' | 'major' | 'pivotal'
}

export interface CharacterBackstory {
  characterId: string
  events: BackstoryEvent[]
  currentAge: number
  birthYear: number
  contradictions: string[]
}

export interface BackstoryIntegrationState {
  backstories: Map<string, CharacterBackstory>
  currentChapter: number
}

function createEventId(): string {
  return 'be_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectEmotionalTags(text: string): string[] {
  const lower = text.toLowerCase()
  const tags: string[] = []
  if (lower.includes('joy') || lower.includes('happy')) tags.push('joy')
  if (lower.includes('grief') || lower.includes('sad')) tags.push('grief')
  if (lower.includes('anger') || lower.includes('rage')) tags.push('anger')
  if (lower.includes('fear')) tags.push('fear')
  if (lower.includes('love') || lower.includes('affection')) tags.push('love')
  if (lower.includes('betrayal')) tags.push('betrayal')
  if (lower.includes('loss')) tags.push('loss')
  if (lower.includes('triumph') || lower.includes('victory')) tags.push('triumph')
  return tags
}

function determineImportance(text: string): 'minor' | 'major' | 'pivotal' {
  const lower = text.toLowerCase()
  if (lower.includes('pivotal') || lower.includes('life-changing')) return 'pivotal'
  if (lower.includes('significant') || lower.includes('important')) return 'major'
  return 'minor'
}

export function createEmptyBackstoryIntegrationState(): BackstoryIntegrationState {
  return { backstories: new Map(), currentChapter: 0 }
}

export function registerCharacter(state: BackstoryIntegrationState, characterId: string, currentAge: number): BackstoryIntegrationState {
  const newBackstories = new Map(state.backstories)
  if (!newBackstories.has(characterId)) {
    newBackstories.set(characterId, { characterId, events: [], currentAge: currentAge, birthYear: 0, contradictions: [] })
  }
  return { ...state, backstories: newBackstories }
}

export function addBackstoryEvent(
  state: BackstoryIntegrationState,
  characterId: string,
  chapter: number,
  age: number,
  title: string,
  description: string,
  text: string
): BackstoryIntegrationState {
  const newBackstories = new Map(state.backstories)
  let backstory = newBackstories.get(characterId)
  if (!backstory) {
    backstory = { characterId, events: [], currentAge: age, birthYear: 0, contradictions: [] }
  }

  const event: BackstoryEvent = {
    eventId: createEventId(),
    characterId,
    chapter,
    age,
    title,
    description,
    emotionalTags: detectEmotionalTags(text),
    importance: determineImportance(text),
  }

  // Check for timeline contradictions
  const contradictions: string[] = []
  for (const existing of backstory.events) {
    if (existing.age === age && existing.eventId !== event.eventId) {
      contradictions.push('Event at same age ' + age + ': "' + existing.title + '" vs "' + title + '"')
    }
    if (existing.age > age && !backstory.birthYear) {
      // Possible future event
    }
  }

  newBackstories.set(characterId, {
    ...backstory,
    events: [...backstory.events, event],
    contradictions: [...backstory.contradictions, ...contradictions],
  })

  return { ...state, backstories: newBackstories, currentChapter: Math.max(state.currentChapter, chapter) }
}

export function getCharacterBackstory(state: BackstoryIntegrationState, characterId: string): CharacterBackstory | null {
  return state.backstories.get(characterId) || null
}

export function getBackstoryTimeline(state: BackstoryIntegrationState, characterId: string): BackstoryEvent[] {
  const backstory = state.backstories.get(characterId)
  if (!backstory) return []
  return backstory.events.sort((a, b) => a.age - b.age)
}

export function checkContradictions(state: BackstoryIntegrationState, characterId: string): string[] {
  const backstory = state.backstories.get(characterId)
  return backstory ? backstory.contradictions : []
}

export function formatBackstorySummary(state: BackstoryIntegrationState): string {
  let s = "=== Backstory Integration Summary ===" + "\n"
  s += "Characters Tracked: " + state.backstories.size + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  return s
}

export function formatBackstoryDashboard(state: BackstoryIntegrationState): string {
  let s = "=== Backstory Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"

  if (state.backstories.size > 0) {
    s += "\n--- Characters ---" + "\n"
    for (const [, bs] of state.backstories) {
      s += "  " + bs.characterId + ": " + bs.events.length + " events"
      if (bs.contradictions.length > 0) s += " (" + bs.contradictions.length + " contradictions)"
      s += "\n"
    }
  }

  return s
}
