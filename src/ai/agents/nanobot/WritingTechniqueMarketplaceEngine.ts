/**
 * WritingTechniqueMarketplaceEngine — V499
 * Writing technique library, style template marketplace, and skill scoring system.
 * Inspired by: claude-code (ToolRegistry) + ruflo (Hook lifecycle)
 */

export type TechniqueCategory = 'pacing' | 'dialogue' | 'description' | 'character' | 'plot' | 'style' | 'genre'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'master'
export type TechniqueStatus = 'available' | 'locked' | 'premium' | 'beta'

export interface Technique {
  id: string
  name: string
  description: string
  category: TechniqueCategory
  tags: string[]
  examples: string[]
  skillLevel: SkillLevel
  status: TechniqueStatus
  prerequisiteIds: string[]
  scoreBonus: number  // Points earned when mastered
  unlockCost: number   // Coingate cost (-1 = not purchasable)
}

export interface AuthorSkillProfile {
  id: string
  authorId: string
  masteredTechniqueIds: string[]
  inProgressTechniqueIds: string[]
  totalScore: number
  skillLevel: SkillLevel
  categoryProficiency: Record<TechniqueCategory, number>  // 0-100
  completedTutorials: string[]
  earnedBadges: string[]
}

export interface TechniqueTemplate {
  id: string
  name: string
  description: string
  includedTechniqueIds: string[]
  authorId: string
  rating: number  // 1-5
  downloadCount: number
  isPremium: boolean
  price: number
}

export interface MarketplaceState {
  techniques: Record<string, Technique>
  techniqueTemplates: Record<string, TechniqueTemplate>
  authorProfiles: Record<string, AuthorSkillProfile>
  userCoinBalance: number
  transactionHistory: Transaction[]
  featuredTechniqueIds: string[]
  newTechniqueIds: string[]
}

export interface Transaction {
  id: string
  type: 'purchase' | 'sale' | 'unlock' | 'reward'
  amount: number
  techniqueId?: string
  timestamp: number
}

export function createEmptyState(initialCoins: number = 100): MarketplaceState {
  return {
    techniques: {},
    techniqueTemplates: {},
    authorProfiles: {},
    userCoinBalance: initialCoins,
    transactionHistory: [],
    featuredTechniqueIds: [],
    newTechniqueIds: []
  }
}

// === Technique Management ===

export function registerTechnique(
  state: MarketplaceState,
  name: string,
  description: string,
  category: TechniqueCategory,
  tags: string[],
  examples: string[],
  skillLevel: SkillLevel,
  scoreBonus: number,
  unlockCost: number = -1,
  status: TechniqueStatus = 'available',
  prerequisiteIds: string[] = []
): MarketplaceState {
  const id = `tech_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const technique: Technique = {
    id,
    name,
    description,
    category,
    tags,
    examples,
    skillLevel,
    status,
    prerequisiteIds,
    scoreBonus,
    unlockCost
  }
  return {
    ...state,
    techniques: { ...state.techniques, [id]: technique }
  }
}

export function updateTechniqueStatus(
  state: MarketplaceState,
  techniqueId: string,
  status: TechniqueStatus
): MarketplaceState {
  const technique = state.techniques[techniqueId]
  if (!technique) return state
  return {
    ...state,
    techniques: {
      ...state.techniques,
      [techniqueId]: { ...technique, status }
    }
  }
}

export function getTechniquesByCategory(state: MarketplaceState, category: TechniqueCategory): Technique[] {
  return Object.values(state.techniques).filter(t => t.category === category)
}

export function getTechniquesByLevel(state: MarketplaceState, level: SkillLevel): Technique[] {
  return Object.values(state.techniques).filter(t => t.skillLevel === level)
}

export function getUnlockableTechniques(state: MarketplaceState): Technique[] {
  return Object.values(state.techniques).filter(
    t => t.status !== 'locked' && t.unlockCost > 0 && t.unlockCost <= state.userCoinBalance
  )
}

export function getFeaturedTechniques(state: MarketplaceState): Technique[] {
  return state.featuredTechniqueIds
    .map(id => state.techniques[id])
    .filter(Boolean)
}

export function getNewTechniques(state: MarketplaceState): Technique[] {
  return state.newTechniqueIds
    .map(id => state.techniques[id])
    .filter(Boolean)
}

// === Author Profile ===

export function createAuthorProfile(state: MarketplaceState, authorId: string): MarketplaceState {
  const profile: AuthorSkillProfile = {
    id: `profile_${Date.now()}`,
    authorId,
    masteredTechniqueIds: [],
    inProgressTechniqueIds: [],
    totalScore: 0,
    skillLevel: 'beginner',
    categoryProficiency: {
      pacing: 0, dialogue: 0, description: 0, character: 0, plot: 0, style: 0, genre: 0
    },
    completedTutorials: [],
    earnedBadges: []
  }
  return {
    ...state,
    authorProfiles: { ...state.authorProfiles, [authorId]: profile }
  }
}

export function startLearningTechnique(
  state: MarketplaceState,
  authorId: string,
  techniqueId: string
): MarketplaceState {
  let profile = state.authorProfiles[authorId]
  if (!profile) return state

  const technique = state.techniques[techniqueId]
  if (!technique) return state

  // Check prerequisites
  const unmetPrereqs = technique.prerequisiteIds.filter(id => !profile.masteredTechniqueIds.includes(id))
  if (unmetPrereqs.length > 0) return state

  // Check if already in progress or mastered
  if (profile.inProgressTechniqueIds.includes(techniqueId)) return state
  if (profile.masteredTechniqueIds.includes(techniqueId)) return state

  const inProgress = [...profile.inProgressTechniqueIds, techniqueId]
  const updatedProfile: AuthorSkillProfile = { ...profile, inProgressTechniqueIds: inProgress }

  return {
    ...state,
    authorProfiles: { ...state.authorProfiles, [authorId]: updatedProfile }
  }
}

export function masterTechnique(
  state: MarketplaceState,
  authorId: string,
  techniqueId: string
): MarketplaceState {
  let profile = state.authorProfiles[authorId]
  if (!profile) return state

  const technique = state.techniques[techniqueId]
  if (!technique) return state

  if (!profile.inProgressTechniqueIds.includes(techniqueId)) return state

  const mastered = [...profile.masteredTechniqueIds, techniqueId]
  const inProgress = profile.inProgressTechniqueIds.filter(id => id !== techniqueId)

  // Update category proficiency
  const categoryProficiency = { ...profile.categoryProficiency }
  categoryProficiency[technique.category] = Math.min(100, categoryProficiency[technique.category] + 20)

  // Update overall skill level
  const totalScore = profile.totalScore + technique.scoreBonus
  let skillLevel: SkillLevel = 'beginner'
  if (totalScore >= 500) skillLevel = 'master'
  else if (totalScore >= 300) skillLevel = 'advanced'
  else if (totalScore >= 100) skillLevel = 'intermediate'

  const updatedProfile: AuthorSkillProfile = {
    ...profile,
    masteredTechniqueIds: mastered,
    inProgressTechniqueIds: inProgress,
    totalScore,
    skillLevel,
    categoryProficiency
  }

  // Award coins for mastery
  const rewardAmount = Math.floor(technique.scoreBonus / 2)
  const updatedBalance = state.userCoinBalance + rewardAmount
  const transaction: Transaction = {
    id: `tx_${Date.now()}`,
    type: 'reward',
    amount: rewardAmount,
    techniqueId,
    timestamp: Date.now()
  }

  return {
    ...state,
    authorProfiles: { ...state.authorProfiles, [authorId]: updatedProfile },
    userCoinBalance: updatedBalance,
    transactionHistory: [...state.transactionHistory, transaction]
  }
}

export function purchaseTechnique(
  state: MarketplaceState,
  authorId: string,
  techniqueId: string
): MarketplaceState {
  let profile = state.authorProfiles[authorId]
  if (!profile) return state

  const technique = state.techniques[techniqueId]
  if (!technique || technique.unlockCost < 0 || technique.unlockCost > state.userCoinBalance) return state

  const newBalance = state.userCoinBalance - technique.unlockCost
  const transaction: Transaction = {
    id: `tx_${Date.now()}`,
    type: 'purchase',
    amount: -technique.unlockCost,
    techniqueId,
    timestamp: Date.now()
  }

  const updatedProfile = { ...profile, masteredTechniqueIds: [...profile.masteredTechniqueIds, techniqueId] }

  return {
    ...state,
    userCoinBalance: newBalance,
    authorProfiles: { ...state.authorProfiles, [authorId]: updatedProfile },
    transactionHistory: [...state.transactionHistory, transaction],
    techniques: {
      ...state.techniques,
      [techniqueId]: { ...technique, status: 'available' }
    }
  }
}

export function getAuthorProfile(state: MarketplaceState, authorId: string): AuthorSkillProfile | null {
  return state.authorProfiles[authorId] || null
}

export function calculateTechniqueScore(
  state: MarketplaceState,
  authorId: string,
  techniqueId: string
): number {
  const profile = state.authorProfiles[authorId]
  if (!profile) return 0

  const technique = state.techniques[techniqueId]
  if (!technique) return 0

  const categoryLevel = profile.categoryProficiency[technique.category] || 0
  const levelMultiplier: Record<SkillLevel, number> = {
    beginner: 1.0, intermediate: 1.2, advanced: 1.5, master: 2.0
  }
  const masteryBonus = profile.masteredTechniqueIds.includes(techniqueId) ? 1.5 : 1.0

  return Math.round(technique.scoreBonus * (categoryLevel / 100) * levelMultiplier[profile.skillLevel] * masteryBonus)
}

// === Template Marketplace ===

export function createTechniqueTemplate(
  state: MarketplaceState,
  name: string,
  description: string,
  authorId: string,
  techniqueIds: string[],
  price: number = 0
): MarketplaceState {
  const id = `template_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const template: TechniqueTemplate = {
    id,
    name,
    description,
    includedTechniqueIds: techniqueIds,
    authorId,
    rating: 0,
    downloadCount: 0,
    isPremium: price > 0,
    price
  }
  return {
    ...state,
    techniqueTemplates: { ...state.techniqueTemplates, [id]: template }
  }
}

export function rateTemplate(
  state: MarketplaceState,
  templateId: string,
  rating: number
): MarketplaceState {
  const template = state.techniqueTemplates[templateId]
  if (!template || rating < 1 || rating > 5) return state

  const totalRating = template.rating * template.downloadCount + rating
  const newDownloadCount = template.downloadCount + 1
  const newRating = Math.round((totalRating / newDownloadCount) * 10) / 10

  return {
    ...state,
    techniqueTemplates: {
      ...state.techniqueTemplates,
      [templateId]: { ...template, rating: newRating, downloadCount: newDownloadCount }
    }
  }
}

export function getTemplatesByCategory(state: MarketplaceState, category: TechniqueCategory): TechniqueTemplate[] {
  const techIds = Object.values(state.techniques)
    .filter(t => t.category === category)
    .map(t => t.id)

  return Object.values(state.techniqueTemplates)
    .filter(t => t.includedTechniqueIds.some(id => techIds.includes(id)))
}

export function getTemplatesByAuthor(state: MarketplaceState, authorId: string): TechniqueTemplate[] {
  return Object.values(state.techniqueTemplates).filter(t => t.authorId === authorId)
}

// === Utility Functions ===

export function getTopTechniquesByScore(state: MarketplaceState, limit: number = 10): Technique[] {
  return Object.values(state.techniques)
    .sort((a, b) => b.scoreBonus - a.scoreBonus)
    .slice(0, limit)
}

export function searchTechniques(state: MarketplaceState, query: string): Technique[] {
  const q = query.toLowerCase()
  return Object.values(state.techniques).filter(
    t => t.name.toLowerCase().includes(q) ||
         t.description.toLowerCase().includes(q) ||
         t.tags.some(tag => tag.toLowerCase().includes(q))
  )
}

export function getTechniqueProgress(state: MarketplaceState, authorId: string, techniqueId: string): { started: boolean, completed: boolean, progress: number } {
  const profile = state.authorProfiles[authorId]
  if (!profile) return { started: false, completed: false, progress: 0 }

  const completed = profile.masteredTechniqueIds.includes(techniqueId)
  const started = profile.inProgressTechniqueIds.includes(techniqueId)

  let progress = 0
  if (completed) progress = 100
  else if (started) progress = 50

  return { started, completed, progress }
}

export function getCategoryLeaderboard(state: MarketplaceState, category: TechniqueCategory): AuthorSkillProfile[] {
  return Object.values(state.authorProfiles)
    .filter(p => p.categoryProficiency[category] > 0)
    .sort((a, b) => b.categoryProficiency[category] - a.categoryProficiency[category])
    .slice(0, 10)
}