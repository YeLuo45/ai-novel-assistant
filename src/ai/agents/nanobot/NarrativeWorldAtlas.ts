/**
 * NarrativeWorldAtlas — V427
 * World atlas management, location tracking, geography-narrative integration for world-building.
 * Inspired by: nanobot (distributed mesh), ruflo (hierarchical decomposition), chatdev (world coherence)
 */

export type LocationType = 'city' | 'wilderness' | 'dungeon' | 'settlement' | 'landmark' | 'underwater' | 'sky' | 'underground'

export interface NarrativeLocation {
  id: string
  name: string
  locationType: LocationType
  significance: number  // 0-100 (narrative importance)
  chaptersAppeared: number[]
  description: string
  connectedLocations: string[]  // IDs of connected locations
  atmosphere: string[]  // mood descriptors
  culturalNotes: string[]
}

export interface AtlasReport {
  totalLocations: number
  locationsByType: Record<LocationType, number>
  underservedChapters: number[]  // chapters with few locations
  mostSignificant: string[]
  recommendations: string[]
}

export interface NarrativeWorldState {
  locations: NarrativeLocation[]
  report: AtlasReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeWorldState {
  return { locations: [], report: null, typeAlias: {} }
}

export function addLocation(
  state: NarrativeWorldState,
  name: string,
  locationType: LocationType,
  significance: number = 50,
  description: string = ''
): NarrativeWorldState {
  const id = `loc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const location: NarrativeLocation = {
    id, name, locationType, significance, chaptersAppeared: [],
    description, connectedLocations: [], atmosphere: [], culturalNotes: [],
  }
  return { ...state, locations: [...state.locations, location] }
}

export function visitLocation(
  state: NarrativeWorldState,
  locationId: string,
  chapter: number
): NarrativeWorldState {
  const locations = state.locations.map(loc => {
    if (loc.id === locationId && !loc.chaptersAppeared.includes(chapter)) {
      return { ...loc, chaptersAppeared: [...loc.chaptersAppeared, chapter].sort((a, b) => a - b) }
    }
    return loc
  })
  return { ...state, locations }
}

export function connectLocations(
  state: NarrativeWorldState,
  locationId1: string,
  locationId2: string
): NarrativeWorldState {
  const locations = state.locations.map(loc => {
    if (loc.id === locationId1 && !loc.connectedLocations.includes(locationId2)) {
      return { ...loc, connectedLocations: [...loc.connectedLocations, locationId2] }
    }
    if (loc.id === locationId2 && !loc.connectedLocations.includes(locationId1)) {
      return { ...loc, connectedLocations: [...loc.connectedLocations, locationId1] }
    }
    return loc
  })
  return { ...state, locations }
}

export function setLocationAtmosphere(state: NarrativeWorldState, locationId: string, atmosphere: string[]): NarrativeWorldState {
  const locations = state.locations.map(loc => loc.id === locationId ? { ...loc, atmosphere } : loc)
  return { ...state, locations }
}

export function generateAtlasReport(state: NarrativeWorldState): AtlasReport {
  if (state.locations.length === 0) {
    return { totalLocations: 0, locationsByType: { city: 0, wilderness: 0, dungeon: 0, settlement: 0, landmark: 0, underwater: 0, sky: 0, underground: 0 }, underservedChapters: [], mostSignificant: [], recommendations: [] }
  }
  
  const locationsByType: Record<LocationType, number> = { city: 0, wilderness: 0, dungeon: 0, settlement: 0, landmark: 0, underwater: 0, sky: 0, underground: 0 }
  for (const loc of state.locations) locationsByType[loc.locationType]++
  
  // Find underserved chapters (chapters with < 2 location appearances)
  const allChapters = state.locations.flatMap(l => l.chaptersAppeared)
  const chapterCounts: Record<number, number> = {}
  for (const c of allChapters) chapterCounts[c] = (chapterCounts[c] || 0) + 1
  const underservedChapters = Object.entries(chapterCounts).filter(([, count]) => count < 2).map(([ch]) => Number(ch)).sort((a, b) => a - b)
  
  const mostSignificant = state.locations.filter(l => l.significance > 70).map(l => l.name)
  
  const recommendations: string[] = []
  if (state.locations.length < 10) recommendations.push('Few locations defined - expand world geography')
  if (locationsByType['wilderness'] === 0 && state.locations.length > 5) {
    recommendations.push('No wilderness areas - add natural environments')
  }
  if (underservedChapters.length > 10) {
    recommendations.push(`${underservedChapters.length} chapters have limited location variety - diversify settings`)
  }
  if (mostSignificant.length > state.locations.length * 0.5) {
    recommendations.push('Too many high-significance locations - prioritize main settings')
  }
  if (state.locations.some(l => l.connectedLocations.length === 0)) {
    recommendations.push('Some locations are isolated - connect related locations')
  }
  if (Object.values(locationsByType).every(c => c === 0)) {
    recommendations.push('Diverse location types - good for varied narrative settings')
  }
  
  return { totalLocations: state.locations.length, locationsByType, underservedChapters, mostSignificant, recommendations }
}

export function getLocationByType(state: NarrativeWorldState, locationType: LocationType): NarrativeLocation[] {
  return state.locations.filter(loc => loc.locationType === locationType)
}

export function getChapterLocations(state: NarrativeWorldState, chapter: number): NarrativeLocation[] {
  return state.locations.filter(loc => loc.chaptersAppeared.includes(chapter))
}
