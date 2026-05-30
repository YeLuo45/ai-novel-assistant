import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  establishSetting,
  trackConsistency,
  generateWorldBuildingReport,
  getSettingByName,
} from './NarrativeWorldBuilder'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.layers).toEqual([])
  })
})

describe('establishSetting', () => {
  it('should establish new setting', () => {
    let s = createEmptyState()
    s = establishSetting(s, 'Dark Tower', 'fantasy', 5, -20)
    expect(s.layers.length).toBe(1)
    expect(s.layers[0].settingName).toBe('Dark Tower')
    expect(s.layers[0].settingType).toBe('fantasy')
  })

  it('should accumulate appearances', () => {
    let s = createEmptyState()
    s = establishSetting(s, 'Dark Tower', 'fantasy', 5, -20)
    s = establishSetting(s, 'Dark Tower', 'fantasy', 10, -20)
    s = establishSetting(s, 'Dark Tower', 'fantasy', 15, -20)
    expect(s.layers[0].chapterAppearances.length).toBe(3)
    expect(s.layers[0].richnessScore).toBeGreaterThan(40)
  })
})

describe('trackConsistency', () => {
  it('should update consistency score', () => {
    let s = createEmptyState()
    s = establishSetting(s, 'Dark Tower', 'fantasy', 5, -20)
    s = trackConsistency(s, 'Dark Tower', 65)
    expect(s.layers[0].consistencyScore).toBe(65)
  })
})

describe('generateWorldBuildingReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateWorldBuildingReport(s)
    expect(report.totalSettings).toBe(0)
    expect(report.avgRichness).toBe(0)
  })

  it('should calculate averages', () => {
    let s = createEmptyState()
    s = establishSetting(s, 'Tower', 'fantasy', 5, -10)
    s = establishSetting(s, 'Village', 'realistic', 8, 30)
    const report = generateWorldBuildingReport(s)
    expect(report.totalSettings).toBe(2)
    expect(report.avgRichness).toBeGreaterThan(0)
  })
})

describe('getSettingByName', () => {
  it('should return setting', () => {
    let s = createEmptyState()
    s = establishSetting(s, 'Tower', 'fantasy', 5, -20)
    const setting = getSettingByName(s, 'Tower')
    expect(setting).not.toBeNull()
    expect(setting!.settingName).toBe('Tower')
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getSettingByName(s, 'nonexistent')).toBeNull()
  })
})
