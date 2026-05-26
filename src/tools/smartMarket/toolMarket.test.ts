/**
 * Tool Smart Market Tests - V57
 * Tests for ToolSmartMarket, ToolCard, MarketFilters, and toolMarketTypes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ToolListing, ToolReview, MarketFilters, ToolCategory } from './toolMarketTypes'
import {
  calculateAverageRating,
  getRatingDistribution,
  filterAndSortTools,
  generateMockTools,
  TOOL_CATEGORIES,
  SORT_OPTIONS
} from './toolMarketTypes'

// Mock Dexie
vi.mock('dexie', () => ({
  __esModule: true,
  default: class MockDexie {
    version = vi.fn().mockReturnThis()
    stores = vi.fn().mockReturnThis()
    toolListings = { add: vi.fn(), put: vi.fn(), get: vi.fn(), toArray: vi.fn() }
    toolReviews = { add: vi.fn(), put: vi.fn(), get: vi.fn(), toArray: vi.fn() }
  }
}))

const createTool = (overrides: Partial<ToolListing> = {}): ToolListing => ({
  id: 'tool_1',
  name: 'Test Tool',
  description: 'A test tool description',
  author: 'Test Author',
  category: 'writing',
  tags: ['writing', 'test'],
  downloads: 1000,
  rating: 4.5,
  reviewCount: 20,
  version: '1.0.0',
  createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  dependencies: [],
  ...overrides
})

const createReview = (overrides: Partial<ToolReview> = {}): ToolReview => ({
  id: 'review_1',
  toolId: 'tool_1',
  userId: 'user_1',
  userName: 'User One',
  rating: 4,
  comment: 'Great tool!',
  createdAt: Date.now(),
  helpful: 5,
  ...overrides
})

describe('ToolMarketTypes', () => {
  describe('TOOL_CATEGORIES', () => {
    it('should have all category definitions', () => {
      expect(TOOL_CATEGORIES.writing.label).toBe('写作工具')
      expect(TOOL_CATEGORIES.plot.label).toBe('剧情工具')
      expect(TOOL_CATEGORIES.world.label).toBe('世界观')
      expect(TOOL_CATEGORIES.character.label).toBe('角色工具')
      expect(TOOL_CATEGORIES.edit.label).toBe('编辑工具')
    })

    it('should have icons for all categories', () => {
      Object.values(TOOL_CATEGORIES).forEach(cat => {
        expect(cat.icon).toBeDefined()
        expect(cat.icon.length).toBeGreaterThan(0)
      })
    })
  })

  describe('SORT_OPTIONS', () => {
    it('should have all sort options', () => {
      expect(SORT_OPTIONS).toHaveLength(4)
      expect(SORT_OPTIONS.map(o => o.value)).toContain('downloads')
      expect(SORT_OPTIONS.map(o => o.value)).toContain('rating')
      expect(SORT_OPTIONS.map(o => o.value)).toContain('newest')
      expect(SORT_OPTIONS.map(o => o.value)).toContain('name')
    })
  })
})

describe('ToolListing', () => {
  it('should create a valid tool listing', () => {
    const tool = createTool()

    expect(tool.id).toBe('tool_1')
    expect(tool.name).toBe('Test Tool')
    expect(tool.category).toBe('writing')
    expect(tool.rating).toBe(4.5)
    expect(tool.downloads).toBe(1000)
  })

  it('should support all categories', () => {
    const categories: ToolCategory[] = ['writing', 'plot', 'world', 'character', 'edit']
    categories.forEach(cat => {
      const tool = createTool({ category: cat })
      expect(tool.category).toBe(cat)
    })
  })

  it('should handle dependencies', () => {
    const tool = createTool({ dependencies: ['tool_2', 'tool_3'] })

    expect(tool.dependencies).toHaveLength(2)
    expect(tool.dependencies).toContain('tool_2')
  })
})

describe('calculateAverageRating', () => {
  it('should calculate correct average', () => {
    // 10 five-star, 5 four-star, 2 three-star, 1 two-star, 0 one-star
    const dist: [number, number, number, number, number] = [0, 1, 2, 5, 10]
    // (0*1 + 1*2 + 2*3 + 5*4 + 10*5) / (0+1+2+5+10) = 78/18 = 4.333...
    expect(calculateAverageRating(dist)).toBeCloseTo(4.3, 1)
  })

  it('should return 0 for empty distribution', () => {
    const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0]
    expect(calculateAverageRating(dist)).toBe(0)
  })

  it('should return 5 for all five-star', () => {
    const dist: [number, number, number, number, number] = [0, 0, 0, 0, 100]
    expect(calculateAverageRating(dist)).toBe(5)
  })

  it('should round to one decimal place', () => {
    const dist: [number, number, number, number, number] = [3, 3, 3, 3, 3]
    expect(calculateAverageRating(dist)).toBe(3)
  })
})

describe('getRatingDistribution', () => {
  it('should count ratings correctly', () => {
    const reviews = [
      createReview({ rating: 5 }),
      createReview({ rating: 5 }),
      createReview({ rating: 4 }),
      createReview({ rating: 3 }),
    ]

    const dist = getRatingDistribution(reviews)

    expect(dist[0]).toBe(0) // 1 star
    expect(dist[1]).toBe(0) // 2 star
    expect(dist[2]).toBe(1) // 3 star
    expect(dist[3]).toBe(1) // 4 star
    expect(dist[4]).toBe(2) // 5 star
  })

  it('should handle empty reviews', () => {
    const dist = getRatingDistribution([])
    expect(dist).toEqual([0, 0, 0, 0, 0])
  })

  it('should ignore invalid ratings', () => {
    const reviews = [
      createReview({ rating: 5 }),
      createReview({ rating: 0 }), // invalid
      createReview({ rating: 6 }), // invalid
      createReview({ rating: 3 }),
    ]

    const dist = getRatingDistribution(reviews)
    expect(dist[4]).toBe(1)
    expect(dist[2]).toBe(1)
  })
})

describe('filterAndSortTools', () => {
  const mockTools: ToolListing[] = [
    createTool({ id: 't1', name: 'Alpha Tool', category: 'writing', downloads: 100, rating: 4.0 }),
    createTool({ id: 't2', name: 'Beta Tool', category: 'plot', downloads: 200, rating: 4.5 }),
    createTool({ id: 't3', name: 'Gamma Tool', category: 'writing', downloads: 50, rating: 5.0 }),
    createTool({ id: 't4', name: 'Delta Tool', category: 'world', downloads: 150, rating: 3.5 }),
  ]

  it('should return all tools without filters', () => {
    const result = filterAndSortTools(mockTools, { sortBy: 'downloads' })
    expect(result).toHaveLength(4)
  })

  it('should filter by category', () => {
    const result = filterAndSortTools(mockTools, { sortBy: 'downloads', category: 'writing' })
    expect(result).toHaveLength(2)
    result.forEach(t => expect(t.category).toBe('writing'))
  })

  it('should filter by search term', () => {
    const result = filterAndSortTools(mockTools, { sortBy: 'downloads', search: 'alpha' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alpha Tool')
  })

  it('should filter by min rating', () => {
    const result = filterAndSortTools(mockTools, { sortBy: 'downloads', minRating: 4.0 })
    expect(result).toHaveLength(3)
    result.forEach(t => expect(t.rating).toBeGreaterThanOrEqual(4.0))
  })

  it('should sort by downloads descending', () => {
    const result = filterAndSortTools(mockTools, { sortBy: 'downloads' })
    expect(result[0].downloads).toBe(200)
    expect(result[3].downloads).toBe(50)
  })

  it('should sort by rating descending', () => {
    const result = filterAndSortTools(mockTools, { sortBy: 'rating' })
    expect(result[0].rating).toBe(5.0)
  })

  it('should sort by newest first', () => {
    const now = Date.now()
    const tools = [
      createTool({ id: 't1', createdAt: now - 10000 }),
      createTool({ id: 't2', createdAt: now - 5000 }),
      createTool({ id: 't3', createdAt: now }),
    ]

    const result = filterAndSortTools(tools, { sortBy: 'newest' })
    expect(result[0].createdAt).toBe(now)
  })

  it('should sort by name alphabetically', () => {
    const result = filterAndSortTools(mockTools, { sortBy: 'name' })
    expect(result[0].name).toBe('Alpha Tool')
    expect(result[3].name).toBe('Gamma Tool')
  })
})

describe('generateMockTools', () => {
  it('should generate specified count', () => {
    const tools = generateMockTools(10)
    expect(tools.length).toBe(10)
  })

  it('should have valid tool structure', () => {
    const tools = generateMockTools(5)
    tools.forEach(t => {
      expect(t.id).toBeDefined()
      expect(t.name).toBeDefined()
      expect(t.category).toBeDefined()
      expect(t.rating).toBeGreaterThanOrEqual(0)
      expect(t.rating).toBeLessThanOrEqual(5)
    })
  })

  it('should cap at 15 tools', () => {
    const tools = generateMockTools(100)
    expect(tools.length).toBe(15)
  })
})

describe('ToolReview', () => {
  it('should create a valid review', () => {
    const review = createReview({ rating: 5, comment: 'Excellent!' })

    expect(review.rating).toBe(5)
    expect(review.comment).toBe('Excellent!')
    expect(review.helpful).toBe(5)
  })
})

describe('MarketFilters', () => {
  it('should have default sort value', () => {
    const filters: MarketFilters = { sortBy: 'downloads' }
    expect(filters.sortBy).toBe('downloads')
  })

  it('should support all filter options', () => {
    const filters: MarketFilters = {
      category: 'writing',
      search: 'test',
      sortBy: 'rating',
      minRating: 4.0,
      freeOnly: true
    }

    expect(filters.category).toBe('writing')
    expect(filters.search).toBe('test')
    expect(filters.minRating).toBe(4.0)
    expect(filters.freeOnly).toBe(true)
  })
})

describe('Tool Smart Market Integration', () => {
  it('should filter tools by multiple criteria', () => {
    const tools: ToolListing[] = [
      createTool({ id: 't1', name: 'Writer Pro', category: 'writing', rating: 4.5, price: 0 }),
      createTool({ id: 't2', name: 'Plot Master', category: 'plot', rating: 4.0, price: 10 }),
      createTool({ id: 't3', name: 'World Builder', category: 'world', rating: 3.5, price: 0 }),
    ]

    // Filter for free writing tools with 4+ rating
    const result = filterAndSortTools(tools, {
      sortBy: 'downloads',
      category: 'writing',
      minRating: 4.0,
      freeOnly: true
    })

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Writer Pro')
  })

  it('should sort filtered results by downloads', () => {
    const tools: ToolListing[] = [
      createTool({ id: 't1', name: 'Low Download', downloads: 10 }),
      createTool({ id: 't2', name: 'High Download', downloads: 1000 }),
      createTool({ id: 't3', name: 'Medium Download', downloads: 100 }),
    ]

    const result = filterAndSortTools(tools, { sortBy: 'downloads' })
    expect(result[0].name).toBe('High Download')
  })
})