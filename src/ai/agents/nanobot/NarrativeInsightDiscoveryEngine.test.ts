/**
 * NarrativeInsightDiscoveryEngine Tests — V514
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addInsight,
  addSymbol,
  linkSymbols,
  interpretSymbol,
  addTheme,
  connectInsightToTheme,
  resolveTheme,
  addCausationChain,
  extendCausationChain,
  markCharacterAffected,
  getInsightsByCategory,
  getSignificantInsights,
  getSymbolPatterns,
  getThemeSummary,
  getCausationChains,
  getDeepInsights,
  getInsightSummary,
  updateDominantThemes
} from './NarrativeInsightDiscoveryEngine'

describe('NarrativeInsightDiscoveryEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.insights).toEqual({})
      expect(state.symbols).toEqual({})
      expect(state.themes).toEqual({})
      expect(state.causationChains).toEqual({})
      expect(state.totalAnalyzed).toBe(0)
    })
  })

  describe('addInsight', () => {
    it('should add character insight', () => {
      let state = createEmptyState()
      state = addInsight(state, 'character', 'Hero discovers hidden past', 'He stared at the letter', 50, 'high', 85, 1, 3, ['hero', 'identity'])
      expect(Object.keys(state.insights)).toHaveLength(1)
      const insight = state.insights[Object.keys(state.insights)[0]]
      expect(insight.category).toBe('character')
      expect(insight.confidence).toBe('high')
      expect(insight.significance).toBe(85)
      expect(insight.depth).toBe(3)
    })

    it('should clamp significance and depth', () => {
      let state = createEmptyState()
      state = addInsight(state, 'theme', 'Test', 'Source', 50, 'medium', 150, 1, 10)
      const insight = state.insights[Object.keys(state.insights)[0]]
      expect(insight.significance).toBe(100)
      expect(insight.depth).toBe(5)
    })

    it('should link related insights', () => {
      let state = createEmptyState()
      state = addInsight(state, 'theme', 'First theme', 'Same source text here', 30, 'high', 70, 1, 2, ['freedom'])
      state = addInsight(state, 'theme', 'Second theme', 'Another text', 60, 'medium', 80, 1, 2, ['freedom'])
      const ids = Object.keys(state.insights)
      expect(state.insights[ids[1]].relatedInsights).toContain(ids[0])
    })

    it('should update avg depth', () => {
      let state = createEmptyState()
      state = addInsight(state, 'character', 'C1', 'S', 50, 'high', 80, 1, 3)
      state = addInsight(state, 'character', 'C2', 'S', 50, 'medium', 75, 1, 1)
      expect(state.avgDepth).toBe(2)
    })
  })

  describe('addSymbol', () => {
    it('should add new symbol', () => {
      let state = createEmptyState()
      state = addSymbol(state, 'crimson flag', 'object', 'A crimson flag flew', 30, 1)
      expect(Object.keys(state.symbols)).toHaveLength(1)
      expect(state.symbols[Object.keys(state.symbols)[0]].frequency).toBe(1)
    })

    it('should increment frequency for existing symbol', () => {
      let state = createEmptyState()
      state = addSymbol(state, 'crimson flag', 'object', 'First excerpt', 30, 1)
      state = addSymbol(state, 'crimson flag', 'object', 'Second excerpt', 60, 2)
      const id = Object.keys(state.symbols)[0]
      expect(state.symbols[id].frequency).toBe(2)
      expect(state.symbols[id].occurrences).toHaveLength(2)
    })

    it('should be case-insensitive for symbol matching', () => {
      let state = createEmptyState()
      state = addSymbol(state, 'Crimson', 'color', 'First', 30, 1)
      state = addSymbol(state, 'crimson', 'color', 'Second', 50, 2)
      expect(Object.keys(state.symbols)).toHaveLength(1)
    })
  })

  describe('linkSymbols', () => {
    it('should link two symbols', () => {
      let state = createEmptyState()
      state = addSymbol(state, 'storm', 'weather', 'A storm came', 30, 1)
      state = addSymbol(state, 'rain', 'weather', 'Rain fell', 40, 1)
      const ids = Object.keys(state.symbols)
      state = linkSymbols(state, ids[0], ids[1])
      expect(state.symbols[ids[0]].interconnectedSymbols).toContain(ids[1])
      expect(state.symbols[ids[1]].interconnectedSymbols).toContain(ids[0])
    })

    it('should not fail for invalid symbol ids', () => {
      let state = createEmptyState()
      state = addSymbol(state, 'storm', 'weather', 'A storm came', 30, 1)
      const before = { ...state }
      state = linkSymbols(state, 'invalid', 'also_invalid')
      expect(state).toEqual(before)
    })
  })

  describe('interpretSymbol', () => {
    it('should update symbol meaning', () => {
      let state = createEmptyState()
      state = addSymbol(state, 'broken mirror', 'object', 'She looked at the broken mirror', 30, 1)
      const id = Object.keys(state.symbols)[0]
      state = interpretSymbol(state, id, 'Symbol of fractured identity', 'Evolved from literal to metaphorical')
      expect(state.symbols[id].meaning).toBe('Symbol of fractured identity')
      expect(state.symbols[id].evolution).toBe('Evolved from literal to metaphorical')
    })
  })

  describe('addTheme', () => {
    it('should add new theme', () => {
      let state = createEmptyState()
      state = addTheme(state, 'Revenge', 'The destructive nature of vengeance', 'He wanted revenge', 30, 1)
      expect(Object.keys(state.themes)).toHaveLength(1)
      const theme = state.themes[Object.keys(state.themes)[0]]
      expect(theme.resolutionStatus).toBe('unresolved')
      expect(theme.progressionArc.length).toBeGreaterThanOrEqual(1)
    })

    it('should extend existing theme', () => {
      let state = createEmptyState()
      state = addTheme(state, 'Revenge', 'The destructive nature of vengeance', 'First', 30, 1)
      state = addTheme(state, 'Revenge', 'The destructive nature of vengeance', 'Second', 50, 2)
      expect(Object.keys(state.themes)).toHaveLength(1)
      expect(state.themes[Object.keys(state.themes)[0]].manifestations).toHaveLength(2)
    })
  })

  describe('connectInsightToTheme', () => {
    it('should connect insight to theme', () => {
      let state = createEmptyState()
      state = addInsight(state, 'character', 'Hero seeks vengeance', 'Source', 50, 'high', 80, 1, 3)
      state = addTheme(state, 'Revenge', 'Destructive vengeance', 'Another source', 30, 1)
      const insightId = Object.keys(state.insights)[0]
      const themeId = Object.keys(state.themes)[0]
      state = connectInsightToTheme(state, insightId, themeId)
      expect(state.themes[themeId].connectedInsights).toContain(insightId)
    })
  })

  describe('resolveTheme', () => {
    it('should resolve theme', () => {
      let state = createEmptyState()
      state = addTheme(state, 'Love', 'Power of love', 'Excerpt', 30, 1)
      const id = Object.keys(state.themes)[0]
      state = resolveTheme(state, id, 'resolved')
      expect(state.themes[id].resolutionStatus).toBe('resolved')
    })
  })

  describe('addCausationChain', () => {
    it('should create causation chain', () => {
      let state = createEmptyState()
      state = addCausationChain(state, 'Hero ignores warning', 'Tragedy unfolds', 1)
      expect(Object.keys(state.causationChains)).toHaveLength(1)
      const chain = state.causationChains[Object.keys(state.causationChains)[0]]
      expect(chain.cause).toBe('Hero ignores warning')
      expect(chain.complexity).toBe(1)
    })
  })

  describe('extendCausationChain', () => {
    it('should extend existing chain effect', () => {
      let state = createEmptyState()
      state = addCausationChain(state, 'Hero ignores warning', 'Tragedy unfolds', 1)
      const id = Object.keys(state.causationChains)[0]
      state = extendCausationChain(state, id, 'Tragedy unfolds', 3) // same effect, chapter 3
      expect(state.causationChains[id].effects).toHaveLength(1)
      expect(state.causationChains[id].effects[0].chapters).toContain(3)
    })

    it('should add new effect to chain', () => {
      let state = createEmptyState()
      state = addCausationChain(state, 'Hero ignores warning', 'Tragedy unfolds', 1)
      const id = Object.keys(state.causationChains)[0]
      state = extendCausationChain(state, id, 'Enemy gains power', 5, true)
      expect(state.causationChains[id].effects).toHaveLength(2)
      expect(state.causationChains[id].complexity).toBe(2)
      expect(state.causationChains[id].chapters).toContain(5)
    })
  })

  describe('markCharacterAffected', () => {
    it('should increment affected character count', () => {
      let state = createEmptyState()
      state = addCausationChain(state, 'Betrayal', 'Trust broken', 1)
      const id = Object.keys(state.causationChains)[0]
      state = markCharacterAffected(state, id, 3)
      expect(state.causationChains[id].totalAffectedCharacters).toBe(4) // 1 initial + 3
    })
  })

  describe('getInsightsByCategory', () => {
    it('should filter by category', () => {
      let state = createEmptyState()
      state = addInsight(state, 'character', 'Char insight', 'S', 50, 'high', 80, 1, 2)
      state = addInsight(state, 'theme', 'Theme insight', 'S', 50, 'medium', 75, 1, 2)
      const charInsights = getInsightsByCategory(state, 'character')
      expect(charInsights).toHaveLength(1)
      expect(charInsights[0].category).toBe('character')
    })

    it('should sort by significance descending', () => {
      let state = createEmptyState()
      state = addInsight(state, 'theme', 'Low sig', 'S', 50, 'high', 50)
      state = addInsight(state, 'theme', 'High sig', 'S', 50, 'high', 90)
      const themes = getInsightsByCategory(state, 'theme')
      expect(themes[0].significance).toBeGreaterThan(themes[1].significance)
    })
  })

  describe('getSignificantInsights', () => {
    it('should return insights above threshold', () => {
      let state = createEmptyState()
      state = addInsight(state, 'character', 'C1', 'S', 50, 'high', 70)
      state = addInsight(state, 'character', 'C2', 'S', 50, 'high', 85)
      const significant = getSignificantInsights(state, 75)
      expect(significant).toHaveLength(1)
      expect(significant[0].significance).toBe(85)
    })
  })

  describe('getSymbolPatterns', () => {
    it('should filter by min frequency', () => {
      let state = createEmptyState()
      state = addSymbol(state, 'storm', 'weather', 'First', 30, 1)
      state = addSymbol(state, 'storm', 'weather', 'Second', 50, 2)
      state = addSymbol(state, 'rain', 'weather', 'Single', 40, 1)
      const patterns = getSymbolPatterns(state, 2)
      expect(patterns).toHaveLength(1)
      expect(patterns[0].symbol).toBe('storm')
    })
  })

  describe('getThemeSummary', () => {
    it('should return sorted theme summary', () => {
      let state = createEmptyState()
      state = addTheme(state, 'Love', 'Power of love', 'E1', 30, 1)
      state = addTheme(state, 'Love', 'Power of love', 'E2', 50, 2)
      state = addTheme(state, 'Revenge', 'Vengeance', 'E3', 30, 1)
      const summary = getThemeSummary(state)
      expect(summary[0].theme).toBe('Love')
      expect(summary[0].manifestationCount).toBe(2)
    })
  })

  describe('getCausationChains', () => {
    it('should filter by complexity', () => {
      let state = createEmptyState()
      state = addCausationChain(state, 'Simple cause', 'Simple effect', 1)
      state = addCausationChain(state, 'Complex cause', 'First effect', 1)
      const id = Object.keys(state.causationChains)[1]
      state = extendCausationChain(state, id, 'Second effect', 3)
      const chains = getCausationChains(state, 2)
      expect(chains).toHaveLength(1)
    })
  })

  describe('getDeepInsights', () => {
    it('should return insights above min depth', () => {
      let state = createEmptyState()
      state = addInsight(state, 'character', 'C1', 'S', 50, 'high', 80, 1, 2)
      state = addInsight(state, 'character', 'C2', 'S', 50, 'high', 85, 1, 4)
      const deep = getDeepInsights(state, 3)
      expect(deep).toHaveLength(1)
      expect(deep[0].depth).toBe(4)
    })
  })

  describe('getInsightSummary', () => {
    it('should compute comprehensive summary', () => {
      let state = createEmptyState()
      state = addInsight(state, 'character', 'C1', 'S', 50, 'high', 90, 1, 3)
      state = addInsight(state, 'theme', 'T1', 'S', 50, 'medium', 70, 1, 2)
      state = addInsight(state, 'symbol', 'S1', 'S', 50, 'low', 85, 1, 1)
      const summary = getInsightSummary(state)
      expect(summary.total).toBe(3)
      expect(summary.byCategory.character).toBe(1)
      expect(summary.byCategory.theme).toBe(1)
      expect(summary.highSignificance).toBe(2) // sig >= 80
    })
  })

  describe('updateDominantThemes', () => {
    it('should rank themes by weight', () => {
      let state = createEmptyState()
      state = addTheme(state, 'Minor', 'Minor theme', 'E1', 30, 1)
      state = addTheme(state, 'Major', 'Major theme', 'E1', 30, 1)
      state = addTheme(state, 'Major', 'Major theme', 'E2', 60, 2)
      state = addTheme(state, 'Major', 'Major theme', 'E3', 90, 3)
      state = updateDominantThemes(state)
      expect(state.dominantThemes[0].theme).toBe('Major')
      expect(state.dominantThemes[0].weight).toBeGreaterThan(state.dominantThemes[1].weight)
    })
  })
})