/**
 * ThematicSymbolismTrackingEngine Tests — V524
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSymbol,
  recordSymbolOccurrence,
  establishThematicThread,
  updateThreadIntensity,
  linkSymbolToTheme,
  trackImageryLayer,
  recordImageryElement,
  identifyDominantTheme,
  calculateSymbolismDensity,
  getSymbolById,
  getThemeById,
  getSymbolsByCategory,
  getThematicSummary
} from './ThematicSymbolismTrackingEngine'

describe('ThematicSymbolismTrackingEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.symbols).toEqual({})
      expect(state.themes).toEqual({})
      expect(state.imagery).toEqual({})
      expect(state.dominantTheme).toBeNull()
    })
  })

  describe('registerSymbol', () => {
    it('should register symbol', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 'water', 'Water', 'object', ['river', 'ocean', 'rain'], 'rebirth', 'H2O')
      const symbol = getSymbolById(state, 'water')
      expect(symbol).not.toBeNull()
      expect(symbol?.name).toBe('Water')
      expect(symbol?.hiddenMeaning).toBe('rebirth')
    })

    it('should not duplicate symbol', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 'fire', 'Fire', 'object', ['flame', 'burn'], 'passion', 'fire')
      state = registerSymbol(state, 'fire', 'Fire', 'weather', ['inferno'], 'ANGER', 'fire2')
      const symbol = getSymbolById(state, 'fire')
      expect(symbol?.category).toBe('object')
    })
  })

  describe('recordSymbolOccurrence', () => {
    it('should record occurrence', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 'water', 'Water', 'object', ['river'], 'rebirth', 'H2O')
      state = recordSymbolOccurrence(state, 'water', 3, 42, 'Rain falls on protagonist', 30, 'cleansing')
      const symbol = getSymbolById(state, 'water')
      expect(symbol?.occurrences).toHaveLength(1)
      expect(symbol?.occurrences[0].context).toBe('Rain falls on protagonist')
      expect(symbol?.evolutionArc[3]).toBe(30)
    })

    it('should return state if symbol not found', () => {
      const state = createEmptyState()
      const result = recordSymbolOccurrence(state, 'nonexistent', 1, 10, 'ctx', 5, 'int')
      expect(result).toBe(state)
    })
  })

  describe('establishThematicThread', () => {
    it('should create theme', () => {
      let state = createEmptyState()
      state = establishThematicThread(state, 'redemption', 'Redemption', 'Journey of making amends', 1, 10, 'Hero feels guilt')
      const theme = getThemeById(state, 'redemption')
      expect(theme).not.toBeNull()
      expect(theme?.name).toBe('Redemption')
      expect(theme?.resolutionStatus).toBe('unresolved')
    })

    it('should not duplicate theme', () => {
      let state = createEmptyState()
      state = establishThematicThread(state, 'love', 'Love', 'Romantic thread', 1, 5, 'First meeting')
      state = establishThematicThread(state, 'love', 'Love', 'Different desc', 2, 10, 'Second meeting')
      const theme = getThemeById(state, 'love')
      expect(theme?.firstAppearance.chapter).toBe(1)
    })
  })

  describe('updateThreadIntensity', () => {
    it('should return state if theme not found', () => {
      const state = createEmptyState()
      const result = updateThreadIntensity(state, 'nonexistent', 5, 50)
      expect(result).toBe(state)
    })
  })

  describe('updateThreadIntensity', () => {
    it('should update intensity', () => {
      let state = createEmptyState()
      state = establishThematicThread(state, 'redemption', 'Redemption', 'Journey', 1, 10, 'Start')
      state = updateThreadIntensity(state, 'redemption', 5, 85)  // > 80 triggers 'building'
      const theme = getThemeById(state, 'redemption')
      expect(theme?.intensityOverTime[5]).toBe(85)
      expect(theme?.resolutionStatus).toBe('building')
    })

    it('should update near_resolution when intensity > 95', () => {
      let state = createEmptyState()
      state = establishThematicThread(state, 'love', 'Love', 'Romantic', 1, 5, 'Start')
      state = updateThreadIntensity(state, 'love', 10, 97)
      const theme = getThemeById(state, 'love')
      expect(theme?.resolutionStatus).toBe('near_resolution')
    })
  })

  describe('linkSymbolToTheme', () => {
    it('should link symbol to theme', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 'water', 'Water', 'object', ['river'], 'rebirth', 'water')
      state = establishThematicThread(state, 'redemption', 'Redemption', 'Journey', 1, 10, 'Start')
      state = linkSymbolToTheme(state, 'water', 'redemption')
      const symbol = getSymbolById(state, 'water')
      expect(symbol?.connectedThemes).toContain('redemption')
    })

    it('should be bidirectional', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 'light', 'Light', 'object', ['sun'], 'hope', 'light')
      state = establishThematicThread(state, 'hope', 'Hope', 'Thread', 1, 5, 'Start')
      state = linkSymbolToTheme(state, 'light', 'hope')
      const theme = getThemeById(state, 'hope')
      expect(theme?.dominantSymbols).toContain('light')
    })
  })

  describe('trackImageryLayer', () => {
    it('should create imagery layer', () => {
      let state = createEmptyState()
      state = trackImageryLayer(state, 'darkness', 'visual', ['shadows', 'black'], 'foreboding')
      expect(state.imagery.darkness).toBeDefined()
      expect(state.imagery.darkness?.type).toBe('visual')
    })
  })

  describe('recordImageryElement', () => {
    it('should record element in layer', () => {
      let state = createEmptyState()
      state = trackImageryLayer(state, 'darkness', 'visual', ['shadows'], 'foreboding')
      state = recordImageryElement(state, 'darkness', 'shadow', 3)
      expect(state.imagery.darkness?.elements).toContain('shadow')
      expect(state.imagery.darkness?.frequencyByChapter[3]).toBe(1)
    })

    it('should increment frequency when element already exists', () => {
      let state = createEmptyState()
      state = trackImageryLayer(state, 'visual', 'visual', ['shadow'], 'mood')
      state = recordImageryElement(state, 'visual', 'shadow', 2)
      state = recordImageryElement(state, 'visual', 'shadow', 2)
      expect(state.imagery.visual?.frequencyByChapter[2]).toBe(2)
      expect(state.imagery.visual?.elements).toHaveLength(1)  // element not duplicated
    })
  })

  describe('identifyDominantTheme', () => {
    it('should identify most intense theme', () => {
      let state = createEmptyState()
      state = establishThematicThread(state, 'a', 'Theme A', 'Desc', 1, 5, 'Start')
      state = establishThematicThread(state, 'b', 'Theme B', 'Desc', 1, 5, 'Start')
      state = updateThreadIntensity(state, 'a', 5, 50)
      state = updateThreadIntensity(state, 'b', 5, 80)
      state = identifyDominantTheme(state)
      expect(state.dominantTheme).toBe('b')
    })

    it('should return null when no themes', () => {
      let state = createEmptyState()
      state = identifyDominantTheme(state)
      expect(state.dominantTheme).toBeNull()
    })
  })

  describe('calculateSymbolismDensity', () => {
    it('should calculate density', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 's', 'S', 'object', ['f'], 'h', 's')
      state = recordSymbolOccurrence(state, 's', 1, 10, 'c', 10, 'i')
      state = recordSymbolOccurrence(state, 's', 2, 10, 'c', 20, 'i')
      const density = calculateSymbolismDensity(state)
      expect(density).toBeGreaterThan(0)
    })

    it('should return 0 for no symbols', () => {
      const state = createEmptyState()
      expect(calculateSymbolismDensity(state)).toBe(0)
    })
  })

  describe('getSymbolsByCategory', () => {
    it('should filter by category', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 'water', 'Water', 'object', ['w'], 'rebirth', 'H2O')
      state = registerSymbol(state, 'rain', 'Rain', 'weather', ['r'], 'cleansing', 'rain')
      state = registerSymbol(state, 'river', 'River', 'object', ['riv'], 'flow', 'river')
      const objects = getSymbolsByCategory(state, 'object')
      expect(objects).toHaveLength(2)
    })
  })

  describe('getThematicSummary', () => {
    it('should compute summary', () => {
      let state = createEmptyState()
      state = registerSymbol(state, 'w', 'Water', 'object', ['w'], 'rebirth', 'H2O')
      state = establishThematicThread(state, 'red', 'Redemption', 'Journey', 1, 5, 'Start')
      state = establishThematicThread(state, 'love', 'Love', 'Romance', 1, 5, 'Start')
      state = updateThreadIntensity(state, 'red', 5, 100)
      state = updateThreadIntensity(state, 'love', 5, 80)
      const summary = getThematicSummary(state)
      expect(summary.totalSymbols).toBe(1)
      expect(summary.totalThemes).toBe(2)
      expect(summary.resolvedThemes).toBe(0)
    })
  })
})