import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addLocation,
  visitLocation,
  connectLocations,
  setLocationAtmosphere,
  generateAtlasReport,
  getLocationByType,
  getChapterLocations,
} from './NarrativeWorldAtlas'

describe('createEmptyState', () => {
  it('should create empty world state', () => {
    const s = createEmptyState()
    expect(s.locations).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addLocation', () => {
  it('should add a location', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Capital City', 'city', 90, 'The capital of the kingdom')
    expect(s.locations.length).toBe(1)
    expect(s.locations[0].name).toBe('Capital City')
    expect(s.locations[0].locationType).toBe('city')
  })
})

describe('visitLocation', () => {
  it('should record chapter visit', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Capital City', 'city', 80)
    const locId = s.locations[0].id
    s = visitLocation(s, locId, 5)
    expect(s.locations[0].chaptersAppeared).toContain(5)
  })

  it('should not duplicate chapter', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Castle', 'landmark', 70)
    const locId = s.locations[0].id
    s = visitLocation(s, locId, 3)
    s = visitLocation(s, locId, 3)
    expect(s.locations[0].chaptersAppeared.length).toBe(1)
  })
})

describe('connectLocations', () => {
  it('should connect two locations', () => {
    let s = createEmptyState()
    s = addLocation(s, 'City', 'city', 80)
    s = addLocation(s, 'Forest', 'wilderness', 60)
    const [id1, id2] = [s.locations[0].id, s.locations[1].id]
    s = connectLocations(s, id1, id2)
    expect(s.locations[0].connectedLocations).toContain(id2)
    expect(s.locations[1].connectedLocations).toContain(id1)
  })
})

describe('setLocationAtmosphere', () => {
  it('should set atmosphere', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Haunted House', 'dungeon', 60)
    const locId = s.locations[0].id
    s = setLocationAtmosphere(s, locId, ['eerie', 'dark', 'ominous'])
    expect(s.locations[0].atmosphere).toEqual(['eerie', 'dark', 'ominous'])
  })
})

describe('generateAtlasReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateAtlasReport(s)
    expect(report.totalLocations).toBe(0)
    expect(report.mostSignificant).toEqual([])
  })

  it('should count location types', () => {
    let s = createEmptyState()
    s = addLocation(s, 'City', 'city', 80)
    s = addLocation(s, 'Forest', 'wilderness', 60)
    const report = generateAtlasReport(s)
    expect(report.locationsByType['city']).toBe(1)
    expect(report.locationsByType['wilderness']).toBe(1)
  })

  it('should identify underserved chapters', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Castle', 'landmark', 70)
    const locId = s.locations[0].id
    s = visitLocation(s, locId, 1)
    s = visitLocation(s, locId, 5)
    const report = generateAtlasReport(s)
    expect(report.underservedChapters).not.toBeUndefined()
  })
})

describe('getLocationByType', () => {
  it('should return locations by type', () => {
    let s = createEmptyState()
    s = addLocation(s, 'City', 'city', 80)
    s = addLocation(s, 'Town', 'settlement', 60)
    s = addLocation(s, 'Village', 'settlement', 50)
    const settlements = getLocationByType(s, 'settlement')
    expect(settlements.length).toBe(2)
  })
})

describe('getChapterLocations', () => {
  it('should return locations appearing in chapter', () => {
    let s = createEmptyState()
    s = addLocation(s, 'Castle', 'landmark', 80)
    s = addLocation(s, 'Forest', 'wilderness', 60)
    s = visitLocation(s, s.locations[0].id, 5)
    s = visitLocation(s, s.locations[1].id, 5)
    const ch5locs = getChapterLocations(s, 5)
    expect(ch5locs.length).toBe(2)
  })
})
