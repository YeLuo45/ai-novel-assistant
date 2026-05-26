/**
 * Tool Smart Market Types - V57
 * Types for Tool Smart Market and Tool Rating System
 */

export type ToolCategory = 'writing' | 'plot' | 'world' | 'character' | 'edit'

export interface ToolListing {
  id: string
  name: string
  description: string
  author: string
  category: ToolCategory
  tags: string[]
  downloads: number
  rating: number
  reviewCount: number
  version: string
  createdAt: number
  dependencies: string[]
  icon?: string
  price?: number  // 0 = free
}

export interface ToolReview {
  id: string
  toolId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: number
  helpful: number
}

export interface ToolRating {
  toolId: string
  averageRating: number
  totalReviews: number
  distribution: [number, number, number, number, number]  // 1-5 stars count
}

export interface MarketFilters {
  category?: ToolCategory
  search?: string
  sortBy: 'downloads' | 'rating' | 'newest' | 'name'
  minRating?: number
  freeOnly?: boolean
}

export const TOOL_CATEGORIES: Record<ToolCategory, { label: string; icon: string }> = {
  writing: { label: '写作工具', icon: '✍️' },
  plot: { label: '剧情工具', icon: '📖' },
  world: { label: '世界观', icon: '🌍' },
  character: { label: '角色工具', icon: '👤' },
  edit: { label: '编辑工具', icon: '✏️' }
}

export const SORT_OPTIONS: { value: MarketFilters['sortBy']; label: string }[] = [
  { value: 'downloads', label: '最多下载' },
  { value: 'rating', label: '最高评分' },
  { value: 'newest', label: '最新上架' },
  { value: 'name', label: '名称排序' }
]

/**
 * Calculate average rating from distribution
 */
export function calculateAverageRating(distribution: [number, number, number, number, number]): number {
  const total = distribution.reduce((sum, count, idx) => sum + count * (idx + 1), 0)
  const count = distribution.reduce((sum, count) => sum + count, 0)
  if (count === 0) return 0
  return Math.round((total / count) * 10) / 10
}

/**
 * Get rating distribution from reviews
 */
export function getRatingDistribution(reviews: ToolReview[]): [number, number, number, number, number] {
  const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (const review of reviews) {
    if (review.rating >= 1 && review.rating <= 5) {
      dist[review.rating - 1]++
    }
  }
  return dist
}

/**
 * Filter and sort tools
 */
export function filterAndSortTools(tools: ToolListing[], filters: MarketFilters): ToolListing[] {
  let result = [...tools]

  // Filter by category
  if (filters.category) {
    result = result.filter(t => t.category === filters.category)
  }

  // Filter by search
  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search) ||
      t.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }

  // Filter by min rating
  if (filters.minRating !== undefined) {
    result = result.filter(t => t.rating >= filters.minRating!)
  }

  // Filter free only
  if (filters.freeOnly) {
    result = result.filter(t => t.price === 0 || t.price === undefined)
  }

  // Sort
  switch (filters.sortBy) {
    case 'downloads':
      result.sort((a, b) => b.downloads - a.downloads)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'newest':
      result.sort((a, b) => b.createdAt - a.createdAt)
      break
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
  }

  return result
}

/**
 * Generate mock tool listings
 */
export function generateMockTools(count: number): ToolListing[] {
  const categories: ToolCategory[] = ['writing', 'plot', 'world', 'character', 'edit']
  const tools: ToolListing[] = []

  const names = [
    'Story Outline Generator', 'Character Motivation Analyzer', 'World Building Assistant',
    'Dialogue Enhancer', 'Plot Twist Generator', 'Emotional Arc Tracer', 'Foreshadowing Plugin',
    'Pacing Analyzer', 'Consistency Checker', 'Title Generator', 'Synopsis Writer',
    'Scene Transitions', 'POV Switch Helper', 'Prose Polisher', 'Genre Detector'
  ]

  for (let i = 0; i < Math.min(count, names.length); i++) {
    const category = categories[i % categories.length]
    const rating = 3 + Math.random() * 2
    const downloads = Math.floor(Math.random() * 10000)

    tools.push({
      id: `tool_${i + 1}`,
      name: names[i],
      description: `A powerful ${category} tool for novel writers. Helps improve writing quality and productivity.`,
      author: `Author${i + 1}`,
      category,
      tags: [category, 'writing', 'productivity'],
      downloads,
      rating: Math.round(rating * 10) / 10,
      reviewCount: Math.floor(Math.random() * 100),
      version: '1.0.0',
      createdAt: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
      dependencies: i > 0 ? [`tool_${i}`] : [],
      icon: TOOL_CATEGORIES[category].icon
    })
  }

  return tools
}