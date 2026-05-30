import { create } from 'zustand'
import { db, Project, OutlineNode, AgentConfig, MaterialCard, WritingStats, Storyline, ChapterStorylineLink, CharacterRelationship, ProjectViewpoint, ViewpointType, Milestone, ReminderSettings, ProjectVersion, Character, ChapterPlan } from './db'

interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // 项目列表
  projects: Project[]
  currentProject: Project | null
  loadProjects: () => Promise<void>
  createProject: (title: string, genre: string) => Promise<Project>
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  setCurrentProject: (project: Project | null) => void

  // 项目版本 (V23)
  projectVersions: ProjectVersion[]
  loadProjectVersions: (projectId: number) => Promise<void>
  selectProjectVersion: (versionId: number, projectId: number) => Promise<void>
  fillProjectFromVersion: (version: ProjectVersion) => Promise<void>

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
  createMaterialCard: (card: Omit<MaterialCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MaterialCard>
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

  // 里程碑管理 (V11)
  milestones: Milestone[]
  loadMilestones: (projectId: number) => Promise<void>
  createMilestone: (milestone: Omit<Milestone, 'id'>) => Promise<Milestone>
  updateMilestone: (id: number, updates: Partial<Milestone>) => Promise<void>
  deleteMilestone: (id: number) => Promise<void>
  markMilestoneAchieved: (id: number) => Promise<void>

  // 提醒设置 (V11)
  reminderSettings: ReminderSettings | null
  loadReminderSettings: (projectId: number) => Promise<void>
  updateReminderSettings: (projectId: number, updates: Partial<ReminderSettings>) => Promise<void>

  // 版本历史 (V31)
  saveChapterVersion: (chapterId: number, content: string, title: string) => Promise<void>
  loadChapterVersions: (chapterId: number) => Promise<import('./db').ChapterVersion[]>
  deleteChapterVersions: (ids: number[]) => Promise<void>
}

const DEFAULT_DAILY_GOAL = 3000
const DEFAULT_TOTAL_WORD_GOAL = 100000

export const useStore = create<AppState>((set, get) => ({
  // Theme - default to system preference
  theme: (typeof window !== 'undefined' && localStorage.getItem('ai-novel-theme') as 'light' | 'dark' | 'system') || 'system',
  setTheme: (theme) => set({ theme }),

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
  milestones: [],
  reminderSettings: null,
  projectVersions: [],

  // 项目版本管理 (V23)
  loadProjectVersions: async (projectId: number) => {
    const versions = await db.projectVersions.where('projectId').equals(projectId).toArray()
    set({ projectVersions: versions })
  },

  selectProjectVersion: async (versionId: number, projectId: number) => {
    // Mark all as not selected
    await db.projectVersions.where('projectId').equals(projectId).modify({ isSelected: false })
    // Mark target as selected
    await db.projectVersions.update(versionId, { isSelected: true })
    // Reload
    get().loadProjectVersions(projectId)
  },

  fillProjectFromVersion: async (version: ProjectVersion) => {
    const { currentProject, createOutlineNode, createMaterialCard } = get()
    if (!currentProject?.id) return

    // 1. Create outline from chapter plan (create a volume + chapters)
    const volume = await createOutlineNode({
      projectId: currentProject.id,
      parentId: null,
      type: 'volume',
      title: '第一卷',
      summary: version.outline.slice(0, 200),
      content: version.outline,
      status: 'planning',
      order: 0
    })

    // Create chapters
    for (const chapter of version.chapters) {
      await createOutlineNode({
        projectId: currentProject.id,
        parentId: volume.id!,
        type: 'chapter',
        title: chapter.title,
        summary: chapter.summary,
        content: '',
        status: 'planning',
        order: chapter.index - 1
      })
    }

    // 2. Create characters as material cards
    for (const char of version.characters) {
      await createMaterialCard({
        projectId: currentProject.id,
        type: 'character',
        name: char.name,
        fields: {
          role: char.role,
          personality: char.personalityTraits.join('、'),
          goal: char.goal,
          relationships: char.relationships.join('；')
        }
      })
    }

    // Reload outline
    get().loadOutline(currentProject.id)
  },

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
    await db.projectVersions.where('projectId').equals(id).delete()
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
    const { outlineNodes } = get()
    const node = outlineNodes.find(n => n.id === id)
    if (!node) return

    const oldParentId = node.parentId
    const oldOrder = node.order

    // Same parent and same position - nothing to do
    if (oldParentId === newParentId && oldOrder === newOrder) return

    // Get siblings at source location (before removal)
    const sourceSiblings = outlineNodes
      .filter(n => n.parentId === oldParentId && n.id !== id)
      .sort((a, b) => a.order - b.order)

    // Get siblings at destination (before insertion)
    const destSiblings = oldParentId === newParentId
      ? sourceSiblings
      : outlineNodes
          .filter(n => n.parentId === newParentId)
          .sort((a, b) => a.order - b.order)

    // Calculate new orders for all affected nodes
    const updates: { id: number; parentId: number | null; order: number }[] = []

    // Add the moved node
    updates.push({ id, parentId: newParentId, order: newOrder })

    // Reorder source siblings (remove gap left by the moved node)
    sourceSiblings.forEach((sibling, idx) => {
      const newSiblingOrder = idx
      if (sibling.order !== newSiblingOrder) {
        updates.push({ id: sibling.id!, parentId: sibling.parentId, order: newSiblingOrder })
      }
    })

    // Reorder destination siblings (make room for the moved node)
    destSiblings.forEach((sibling, idx) => {
      let newSiblingOrder: number
      if (idx >= newOrder) {
        newSiblingOrder = idx + 1
      } else {
        newSiblingOrder = idx
      }
      // Only update if order changed
      if (sibling.order !== newSiblingOrder) {
        updates.push({ id: sibling.id!, parentId: sibling.parentId, order: newSiblingOrder })
      }
    })

    // Apply all updates to DB
    await Promise.all(updates.map(u => db.outlineNodes.update(u.id, { parentId: u.parentId, order: u.order })))

    // Update state
    set(state => ({
      outlineNodes: state.outlineNodes.map(n => {
        const update = updates.find(u => u.id === n.id)
        if (update) {
          return { ...n, parentId: update.parentId, order: update.order }
        }
        return n
      })
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

  // 里程碑管理 (V11)
  loadMilestones: async (projectId) => {
    const milestones = await db.milestones
      .where('projectId').equals(projectId)
      .toArray()
    set({ milestones })
  },

  createMilestone: async (milestone) => {
    const id = await db.milestones.add(milestone)
    const newMilestone = { ...milestone, id: id as number }
    set(state => ({ milestones: [...state.milestones, newMilestone] }))
    return newMilestone
  },

  updateMilestone: async (id, updates) => {
    await db.milestones.update(id, updates)
    set(state => ({
      milestones: state.milestones.map(m => m.id === id ? { ...m, ...updates } : m)
    }))
  },

  deleteMilestone: async (id) => {
    await db.milestones.delete(id)
    set(state => ({ milestones: state.milestones.filter(m => m.id !== id) }))
  },

  markMilestoneAchieved: async (id) => {
    await db.milestones.update(id, { status: 'achieved', achievedAt: new Date() })
    set(state => ({
      milestones: state.milestones.map(m => m.id === id ? { ...m, status: 'achieved' as const, achievedAt: new Date() } : m)
    }))
  },

  // 提醒设置 (V11)
  loadReminderSettings: async (projectId) => {
    const settings = await db.reminderSettings.where('projectId').equals(projectId).first()
    set({ reminderSettings: settings || null })
  },

  updateReminderSettings: async (projectId, updates) => {
    const existing = await db.reminderSettings.where('projectId').equals(projectId).first()
    if (existing && existing.id) {
      await db.reminderSettings.update(existing.id, { ...updates, updatedAt: new Date() })
      set(state => ({ reminderSettings: state.reminderSettings ? { ...state.reminderSettings, ...updates } : null }))
    } else {
      const newSettings = {
        projectId,
        enabled: true,
        dailyReminderTime: '20:00',
        reminderDays: [1, 2, 3, 4, 5, 6, 0],
        autoRemindMilestones: true,
        minWordCountForReminder: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...updates
      }
      const id = await db.reminderSettings.add(newSettings)
      set({ reminderSettings: { ...newSettings, id: id as number } })
    }
  },

  // 版本历史 (V31)
  saveChapterVersion: async (chapterId, content, title) => {
    const { currentProject } = get()
    if (!currentProject?.id) return
    
    const wordCount = content.replace(/\s/g, '').length
    await db.chapterVersions.add({
      chapterId,
      projectId: currentProject.id,
      content,
      title,
      wordCount,
      createdAt: new Date()
    })
  },

  loadChapterVersions: async (chapterId) => {
    return await db.chapterVersions
      .where('chapterId')
      .equals(chapterId)
      .reverse()
      .sortBy('createdAt')
  },

  deleteChapterVersions: async (ids) => {
    await db.chapterVersions.bulkDelete(ids)
  },
}))
