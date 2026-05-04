import { create } from 'zustand'
import { db, Project, OutlineNode, AgentConfig, MaterialCard, WritingStats, Storyline, ChapterStorylineLink, CharacterRelationship, ProjectViewpoint, ViewpointType } from './db'

interface AppState {
  // 项目列表
  projects: Project[]
  currentProject: Project | null
  loadProjects: () => Promise<void>
  createProject: (title: string, genre: string) => Promise<Project>
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  setCurrentProject: (project: Project | null) => void

  // 备份时间追踪
  lastBackupTime: number | null
  updateLastBackupTime: () => void
  checkBackupReminder: () => { shouldRemind: boolean; minutesSinceBackup: number }

  // 大纲节点
  outlineNodes: OutlineNode[]
  loadOutline: (projectId: number) => Promise<void>
  createOutlineNode: (node: Omit<OutlineNode, 'id'>) => Promise<OutlineNode>
  updateOutlineNode: (id: number, updates: Partial<OutlineNode>) => Promise<void>
  deleteOutlineNode: (id: number) => Promise<void>
  moveOutlineNode: (id: number, newParentId: number | null, newOrder: number) => Promise<void>

  // AI配置
  agentConfigs: AgentConfig[]
  loadAgentConfigs: (projectId: number) => Promise<void>
  createAgentConfig: (config: Omit<AgentConfig, 'id'>) => Promise<AgentConfig>
  updateAgentConfig: (id: number, updates: Partial<AgentConfig>) => Promise<void>
  deleteAgentConfig: (id: number) => Promise<void>

  // 素材库
  materialCards: MaterialCard[]
  loadMaterialCards: (projectId: number) => Promise<void>
  createMaterialCard: (card: Omit<MaterialCard, 'id'>) => Promise<MaterialCard>
  updateMaterialCard: (id: number, updates: Partial<MaterialCard>) => Promise<void>
  deleteMaterialCard: (id: number) => Promise<void>

  // 编辑器状态
  currentNodeId: number | null
  isFullscreen: boolean
  setCurrentNodeId: (id: number | null) => void
  setIsFullscreen: (isFullscreen: boolean) => void

  // 故事线管理
  storylines: Storyline[]
  loadStorylines: (projectId: number) => Promise<void>
  createStoryline: (storyline: Omit<Storyline, 'id'>) => Promise<Storyline>
  updateStoryline: (id: number, updates: Partial<Storyline>) => Promise<void>
  deleteStoryline: (id: number) => Promise<void>

  // 章节-故事线关联
  chapterStorylineLinks: ChapterStorylineLink[]
  loadChapterStorylineLinks: (projectId: number) => Promise<void>
  addChapterStorylineLink: (link: Omit<ChapterStorylineLink, 'id'>) => Promise<ChapterStorylineLink>
  removeChapterStorylineLink: (chapterId: number, storylineId: number) => Promise<void>

  // 写作统计
  writingStats: WritingStats[]
  loadWritingStats: (projectId: number) => Promise<void>
  updateDailyWordCount: (projectId: number, wordCount: number) => Promise<void>
  dailyGoal: number
  totalWordGoal: number
  todayWordCount: number
  streak: number
  setDailyGoal: (goal: number) => void
  setTotalWordGoal: (goal: number) => void
  updateStreak: () => Promise<void>

  // 角色关系
  characterRelationships: CharacterRelationship[]
  loadCharacterRelationships: (projectId: number) => Promise<void>
  createCharacterRelationship: (rel: Omit<CharacterRelationship, 'id'>) => Promise<CharacterRelationship>
  deleteCharacterRelationship: (id: number) => Promise<void>

  // 叙事视角
  currentViewpoint: ViewpointType
  currentPOVCharacterId: number | null
  loadProjectViewpoint: (projectId: number) => Promise<void>
  setViewpoint: (viewpoint: ViewpointType, characterId?: number) => Promise<void>
}

const DEFAULT_DAILY_GOAL = 3000
const DEFAULT_TOTAL_WORD_GOAL = 100000

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  outlineNodes: [],
  agentConfigs: [],
  materialCards: [],
  currentNodeId: null,
  isFullscreen: false,
  storylines: [],
  chapterStorylineLinks: [],
  writingStats: [],
  dailyGoal: DEFAULT_DAILY_GOAL,
  totalWordGoal: DEFAULT_TOTAL_WORD_GOAL,
  todayWordCount: 0,
  streak: 0,
  lastBackupTime: null,
  characterRelationships: [],
  currentViewpoint: 'third_person_limited',
  currentPOVCharacterId: null,

  // 备份时间追踪
  updateLastBackupTime: () => {
    const now = Date.now()
    localStorage.setItem('lastBackupTime', String(now))
    set({ lastBackupTime: now })
  },

  checkBackupReminder: () => {
    const lastTime = get().lastBackupTime
    if (!lastTime) {
      return { shouldRemind: true, minutesSinceBackup: 999 }
    }
    const minutesSinceBackup = Math.floor((Date.now() - lastTime) / 60000)
    return {
      shouldRemind: minutesSinceBackup >= 30,
      minutesSinceBackup
    }
  },

  // 项目管理
  loadProjects: async () => {
    const projects = await db.projects.toArray()
    // Load last backup time from localStorage
    const lastBackup = localStorage.getItem('lastBackupTime')
    const lastBackupTime = lastBackup ? parseInt(lastBackup, 10) : null
    set({ projects, lastBackupTime })
  },

  createProject: async (title, genre) => {
    const now = new Date()
    const project: Project = { title, genre, createdAt: now, updatedAt: now }
    const id = await db.projects.add(project)
    const newProject = { ...project, id: id as number }
    set(state => ({ projects: [...state.projects, newProject] }))
    return newProject
  },

  updateProject: async (id, updates) => {
    await db.projects.update(id, { ...updates, updatedAt: new Date() })
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...updates } : state.currentProject
    }))
  },

  deleteProject: async (id) => {
    await db.projects.delete(id)
    await db.outlineNodes.where('projectId').equals(id).delete()
    await db.agentConfigs.where('projectId').equals(id).delete()
    await db.materialCards.where('projectId').equals(id).delete()
    await db.writingStats.where('projectId').equals(id).delete()
    await db.storylines.where('projectId').equals(id).delete()
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject
    }))
  },

  setCurrentProject: (project) => {
    set({ currentProject: project })
    if (project?.id) {
      get().loadOutline(project.id)
      get().loadAgentConfigs(project.id)
      get().loadMaterialCards(project.id)
      get().loadStorylines(project.id)
      get().loadChapterStorylineLinks(project.id)
      get().loadWritingStats(project.id)
    }
  },

  // 大纲管理
  loadOutline: async (projectId) => {
    const nodes = await db.outlineNodes.where('projectId').equals(projectId).sortBy('order')
    set({ outlineNodes: nodes })
  },

  createOutlineNode: async (node) => {
    const id = await db.outlineNodes.add(node)
    const newNode = { ...node, id: id as number }
    set(state => ({ outlineNodes: [...state.outlineNodes, newNode] }))
    return newNode
  },

  updateOutlineNode: async (id, updates) => {
    await db.outlineNodes.update(id, updates)
    set(state => ({
      outlineNodes: state.outlineNodes.map(n => n.id === id ? { ...n, ...updates } : n)
    }))
  },

  deleteOutlineNode: async (id) => {
    await db.outlineNodes.delete(id)
    await db.chapterStorylineLinks.where('chapterId').equals(id).delete()
    const { outlineNodes } = get()
    const childIds = outlineNodes.filter(n => n.parentId === id).map(n => n.id)
    for (const childId of childIds) {
      if (childId !== undefined) {
        await get().deleteOutlineNode(childId)
      }
    }
    set(state => ({ outlineNodes: state.outlineNodes.filter(n => n.id !== id) }))
  },

  moveOutlineNode: async (id, newParentId, newOrder) => {
    await db.outlineNodes.update(id, { parentId: newParentId, order: newOrder })
    set(state => ({
      outlineNodes: state.outlineNodes.map(n => n.id === id ? { ...n, parentId: newParentId, order: newOrder } : n)
    }))
  },

  // AI配置
  loadAgentConfigs: async (projectId) => {
    const configs = await db.agentConfigs.where('projectId').equals(projectId).toArray()
    set({ agentConfigs: configs })
  },

  createAgentConfig: async (config) => {
    const id = await db.agentConfigs.add(config)
    const newConfig = { ...config, id: id as number }
    set(state => ({ agentConfigs: [...state.agentConfigs, newConfig] }))
    return newConfig
  },

  updateAgentConfig: async (id, updates) => {
    await db.agentConfigs.update(id, updates)
    set(state => ({
      agentConfigs: state.agentConfigs.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  },

  deleteAgentConfig: async (id) => {
    await db.agentConfigs.delete(id)
    set(state => ({ agentConfigs: state.agentConfigs.filter(c => c.id !== id) }))
  },

  // 素材库
  loadMaterialCards: async (projectId) => {
    const cards = await db.materialCards.where('projectId').equals(projectId).toArray()
    set({ materialCards: cards })
  },

  createMaterialCard: async (card) => {
    const now = new Date()
    const newCard: MaterialCard = { ...card, createdAt: now, updatedAt: now }
    const id = await db.materialCards.add(newCard)
    const result = { ...newCard, id: id as number }
    set(state => ({ materialCards: [...state.materialCards, result] }))
    return result
  },

  updateMaterialCard: async (id, updates) => {
    await db.materialCards.update(id, { ...updates, updatedAt: new Date() })
    set(state => ({
      materialCards: state.materialCards.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  },

  deleteMaterialCard: async (id) => {
    await db.materialCards.delete(id)
    set(state => ({ materialCards: state.materialCards.filter(c => c.id !== id) }))
  },

  // 编辑器状态
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),

  // 故事线管理
  loadStorylines: async (projectId) => {
    const storylines = await db.storylines.where('projectId').equals(projectId).toArray()
    set({ storylines })
  },

  createStoryline: async (storyline) => {
    const id = await db.storylines.add(storyline)
    const newStoryline = { ...storyline, id: id as number }
    set(state => ({ storylines: [...state.storylines, newStoryline] }))
    return newStoryline
  },

  updateStoryline: async (id, updates) => {
    await db.storylines.update(id, updates)
    set(state => ({
      storylines: state.storylines.map(s => s.id === id ? { ...s, ...updates } : s)
    }))
  },

  deleteStoryline: async (id) => {
    await db.storylines.delete(id)
    await db.chapterStorylineLinks.where('storylineId').equals(id).delete()
    set(state => ({
      storylines: state.storylines.filter(s => s.id !== id),
      chapterStorylineLinks: state.chapterStorylineLinks.filter(l => l.storylineId !== id)
    }))
  },

  // 章节-故事线关联
  loadChapterStorylineLinks: async (projectId) => {
    // Get all chapter IDs for this project
    const chapterIds = await db.outlineNodes.where('projectId').equals(projectId).toArray()
      .then(nodes => nodes.map(n => n.id!).filter(Boolean))
    
    const links: ChapterStorylineLink[] = []
    for (const chapterId of chapterIds) {
      const chapterLinks = await db.chapterStorylineLinks.where('chapterId').equals(chapterId).toArray()
      links.push(...chapterLinks)
    }
    set({ chapterStorylineLinks: links })
  },

  addChapterStorylineLink: async (link) => {
    // Check if link already exists
    const existing = await db.chapterStorylineLinks
      .where('chapterId').equals(link.chapterId)
      .and(l => l.storylineId === link.storylineId)
      .first()
    
    if (existing) return existing
    
    const id = await db.chapterStorylineLinks.add(link)
    const newLink = { ...link, id: id as number }
    set(state => ({ chapterStorylineLinks: [...state.chapterStorylineLinks, newLink] }))
    return newLink
  },

  removeChapterStorylineLink: async (chapterId, storylineId) => {
    await db.chapterStorylineLinks
      .where('chapterId').equals(chapterId)
      .and(l => l.storylineId === storylineId)
      .delete()
    set(state => ({
      chapterStorylineLinks: state.chapterStorylineLinks.filter(
        l => !(l.chapterId === chapterId && l.storylineId === storylineId)
      )
    }))
  },

  // 写作统计
  loadWritingStats: async (projectId) => {
    const stats = await db.writingStats.where('projectId').equals(projectId).toArray()
    set({ writingStats: stats })
    
    // Calculate today's word count
    const today = new Date().toISOString().split('T')[0]
    const todayStats = stats.find(s => s.date === today)
    set({ todayWordCount: todayStats?.wordCount || 0 })
    
    // Calculate streak
    get().updateStreak()
  },

  updateDailyWordCount: async (projectId, wordCount) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = await db.writingStats
      .where(['projectId', 'date']).equals([projectId, today])
      .first()
    
    if (existing) {
      await db.writingStats.update(existing.id!, { wordCount })
      set(state => ({
        writingStats: state.writingStats.map(s => 
          s.id === existing.id ? { ...s, wordCount } : s
        ),
        todayWordCount: wordCount
      }))
    } else {
      const id = await db.writingStats.add({ projectId, date: today, wordCount })
      set(state => ({
        writingStats: [...state.writingStats, { id: id as number, projectId, date: today, wordCount }],
        todayWordCount: wordCount
      }))
    }
    
    // Check if goal achieved and update streak
    const { dailyGoal, streak } = get()
    if (wordCount >= dailyGoal && streak === 0) {
      get().updateStreak()
    }
  },

  setDailyGoal: (goal) => set({ dailyGoal: goal }),
  
  setTotalWordGoal: (goal) => set({ totalWordGoal: goal }),

  updateStreak: async () => {
    const { writingStats, dailyGoal } = get()
    
    // Sort stats by date descending
    const sortedStats = [...writingStats]
      .filter(s => s.wordCount >= dailyGoal)
      .sort((a, b) => b.date.localeCompare(a.date))
    
    let currentStreak = 0
    const today = new Date()
    let checkDate = new Date(today)
    
    // Check if today has goal met
    const todayStr = today.toISOString().split('T')[0]
    const todayMet = sortedStats.some(s => s.date === todayStr)
    
    if (!todayMet) {
      // Check yesterday
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Count consecutive days
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const hasStat = sortedStats.some(s => s.date === dateStr)
      
      if (hasStat) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    set({ streak: currentStreak })
  },

  // 角色关系
  loadCharacterRelationships: async (projectId) => {
    const rels = await db.characterRelationships.where('projectId').equals(projectId).toArray()
    set({ characterRelationships: rels })
  },
  createCharacterRelationship: async (rel) => {
    const id = await db.characterRelationships.add(rel)
    const newRel = { ...rel, id: id as number }
    set(state => ({ characterRelationships: [...state.characterRelationships, newRel] }))
    return newRel
  },
  deleteCharacterRelationship: async (id) => {
    await db.characterRelationships.delete(id)
    set(state => ({ characterRelationships: state.characterRelationships.filter(r => r.id !== id) }))
  },

  // 叙事视角
  loadProjectViewpoint: async (projectId) => {
    const viewpoint = await db.projectViewpoint.where('projectId').equals(projectId).first()
    if (viewpoint) {
      set({ 
        currentViewpoint: viewpoint.viewpoint, 
        currentPOVCharacterId: viewpoint.currentCharacterId || null 
      })
    } else {
      set({ currentViewpoint: 'third_person_limited', currentPOVCharacterId: null })
    }
  },
  setViewpoint: async (viewpoint, characterId) => {
    const { currentProject } = get()
    if (!currentProject?.id) return
    
    const existing = await db.projectViewpoint.where('projectId').equals(currentProject.id).first()
    if (existing) {
      await db.projectViewpoint.update(existing.id!, { viewpoint, currentCharacterId: characterId })
    } else {
      await db.projectViewpoint.add({ 
        projectId: currentProject.id, 
        viewpoint, 
        currentCharacterId: characterId 
      })
    }
    set({ currentViewpoint: viewpoint, currentPOVCharacterId: characterId || null })
  },
}))
