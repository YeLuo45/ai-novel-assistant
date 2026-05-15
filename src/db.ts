import Dexie, { Table } from 'dexie'

// 数据模型
export interface Project {
  id?: number
  title: string
  genre: string
  createdAt: Date
  updatedAt: Date
  // V23 extended fields
  protagonistName?: string
  background?: string
  coreSellingPoint?: string
  otherRequirements?: string
  worldbuilding?: string
}

export interface OutlineNode {
  id?: number
  projectId: number
  parentId: number | null
  type: 'volume' | 'chapter' | 'section' | 'scene'
  title: string
  summary: string
  content: string
  status: 'planning' | 'writing' | 'completed'
  order: number
  color?: string
}

export interface AgentConfig {
  id?: number
  projectId: number
  name: string
  prompt: string
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'minimax'
  temperature: number
}

export interface ApiKey {
  id?: number
  provider: 'openai' | 'anthropic' | 'minimax' | 'google'
  key: string
}

export interface MaterialCard {
  id?: number
  projectId: number
  type: 'character' | 'location' | 'item'
  name: string
  avatar?: string  // 角色头像URL (V29)
  fields: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

// V30: 素材标签表
export interface MaterialTag {
  id?: number
  name: string        // e.g., "主角"
  color: string       // e.g., "#FF6B6B"
  projectId: number
}

export type MaterialCardType = 'character' | 'location' | 'item'

export interface CharacterRelationship {
  id?: number
  projectId: number
  fromCharacterId: number
  toCharacterId: number
  relationshipType: string
  description: string
}

export type ViewpointType = 'first_person' | 'third_person_limited' | 'third_person_omniscient'

export interface ProjectViewpoint {
  id?: number
  projectId: number
  viewpoint: ViewpointType
  currentCharacterId?: number
}

export interface WritingStats {
  id?: number
  projectId: number
  date: string
  wordCount: number
}

export interface Storyline {
  id?: number
  projectId: number
  name: string
  color: string
}

export interface ChapterStorylineLink {
  id?: number
  chapterId: number
  storylineId: number
}

export interface ChatMessage {
  id?: number
  projectId: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface BookMeta {
  id?: number
  projectId: number
  title: string
  author: string
  category: string
  description: string
  language: string
}

export interface BookCover {
  id?: number
  projectId: number
  dataUrl: string
  createdAt: Date
}

// Milestone model for writing milestones
export interface Milestone {
  id?: number
  projectId: number
  title: string
  description: string
  targetDate: string
  targetWordCount: number
  status: 'pending' | 'achieved' | 'missed'
  achievedAt?: Date
  createdAt: Date
}

// Daily Goal Config model
export interface DailyGoalConfig {
  id?: number
  projectId: number
  dailyWordGoal: number
  totalWordGoal: number
  reminderEnabled: boolean
  reminderInterval: number
  createdAt: Date
  updatedAt: Date
}

// Reminder settings for writing reminders
export interface ReminderSettings {
  id?: number
  projectId: number
  enabled: boolean
  dailyReminderTime: string
  reminderDays: number[]
  autoRemindMilestones: boolean
  minWordCountForReminder: number
  createdAt: Date
  updatedAt: Date
}

// Chapter style profile for consistency checking
export interface ChapterStyleProfile {
  id?: number
  projectId: number
  chapterId: number
  profile: {
    avgSentenceLength: number
    dialogueRatio: number
    descriptionDensity: number
    tense: 'past' | 'present'
    perspective: 'first' | 'third'
    characterVoices: Record<string, {
      speechPatterns: string[]
      vocabulary: string[]
      sentencePatterns: string[]
    }>
    commonPhrases: string[]
  }
  analyzedAt: Date
}

// Chapter version snapshot for version history
export interface ChapterVersion {
  id?: number
  chapterId: number
  projectId: number
  content: string
  title: string
  createdAt: Date
}

// AI Chat Messages table for enhanced chat memory persistence
export interface AIChatMessage {
  id?: number
  projectId: number
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  provider?: string
  timestamp: Date
}

// AI Conversation metadata
export interface AIConversation {
  id?: string
  projectId: number
  title: string
  model: string
  provider: string
  messageCount: number
  createdAt: Date
  updatedAt: Date
}

// V23: 三版本规划类型
export interface Character {
  id: string
  name: string
  role: 'protagonist' | 'supporting' | 'minor'
  personalityTraits: string[]
  goal: string
  relationships: string[]
}

export interface ChapterPlan {
  index: number
  title: string
  summary: string
}

// V27: Chapter Progress for tracking writing progress
export interface ChapterProgress {
  id?: number
  projectId: number
  chapterId: number
  targetWordCount: number
  updatedAt: Date
}

export interface ProjectVersion {
  id?: number
  projectId: number
  versionIndex: 1 | 2 | 3
  outline: string
  characters: Character[]
  chapters: ChapterPlan[]
  generatedAt: number
  isSelected: boolean
}

class NovelDatabase extends Dexie {
  projects!: Table<Project>
  outlineNodes!: Table<OutlineNode>
  agentConfigs!: Table<AgentConfig>
  apiKeys!: Table<ApiKey>
  materialCards!: Table<MaterialCard>
  materialTags!: Table<MaterialTag>
  writingStats!: Table<WritingStats>
  storylines!: Table<Storyline>
  chapterStorylineLinks!: Table<ChapterStorylineLink>
  chatMessages!: Table<ChatMessage>
  bookMeta!: Table<BookMeta>
  bookCovers!: Table<BookCover>
  characterRelationships!: Table<CharacterRelationship>
  projectViewpoint!: Table<ProjectViewpoint>
  dailyGoalConfigs!: Table<DailyGoalConfig>
  milestones!: Table<Milestone>
  reminderSettings!: Table<ReminderSettings>
  chapterStyleProfiles!: Table<ChapterStyleProfile>
  chapterVersions!: Table<ChapterVersion>
  aiChatMessages!: Table<AIChatMessage>
  aiConversations!: Table<AIConversation>
  // V14: 跨章节记忆系统
  projectMemory!: Table<any>
  plotThreads!: Table<any>
  chapterSummaries!: Table<any>
  // V23: 三版本规划
  projectVersions!: Table<ProjectVersion>
  // V24: 时间线事件
  timelineEvents!: Table<any>

  constructor() {
    super('NovelDB')
    this.version(1).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider'
    })
    this.version(2).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt'
    })
    this.version(3).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId'
    })
    this.version(4).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp'
    })
    this.version(5).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId'
    })
    this.version(6).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId'
    })
    this.version(7).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      dailyGoalConfigs: '++id, projectId'
    })
    this.version(8).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      milestones: '++id, projectId, targetDate, status',
      reminderSettings: '++id, projectId'
    })
    this.version(9).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      milestones: '++id, projectId, targetDate, status',
      reminderSettings: '++id, projectId',
      chapterStyleProfiles: '++id, projectId, chapterId'
    })
    this.version(10).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      milestones: '++id, projectId, targetDate, status',
      reminderSettings: '++id, projectId',
      chapterStyleProfiles: '++id, projectId, chapterId',
      chapterVersions: '++id, chapterId, projectId, createdAt'
    })
    this.version(11).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      milestones: '++id, projectId, targetDate, status',
      reminderSettings: '++id, projectId',
      chapterStyleProfiles: '++id, projectId, chapterId',
      chapterVersions: '++id, chapterId, projectId, createdAt',
      aiChatMessages: '++id, projectId, conversationId, timestamp',
      aiConversations: '++id, projectId, createdAt'
    })
    // V14: 跨章节记忆系统
    this.version(12).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      milestones: '++id, projectId, targetDate, status',
      reminderSettings: '++id, projectId',
      chapterStyleProfiles: '++id, projectId, chapterId',
      chapterVersions: '++id, chapterId, projectId, createdAt',
      aiChatMessages: '++id, projectId, conversationId, timestamp',
      aiConversations: '++id, projectId, createdAt',
      // V14 新增表
      projectMemory: 'projectId, updatedAt',
      plotThreads: '++id, projectId, tag, status, plantedInChapter, resolvedInChapter',
      chapterSummaries: '++id, projectId, chapterId, createdAt',
      // V23 新增
      projectVersions: '++id, projectId, versionIndex, isSelected'
    })
    // V24: 时间线事件
    this.version(13).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      milestones: '++id, projectId, targetDate, status',
      reminderSettings: '++id, projectId',
      chapterStyleProfiles: '++id, projectId, chapterId',
      chapterVersions: '++id, chapterId, projectId, createdAt',
      aiChatMessages: '++id, projectId, conversationId, timestamp',
      aiConversations: '++id, projectId, createdAt',
      projectMemory: 'projectId, updatedAt',
      plotThreads: '++id, projectId, tag, status, plantedInChapter, resolvedInChapter',
      chapterSummaries: '++id, projectId, chapterId, createdAt',
      projectVersions: '++id, projectId, versionIndex, isSelected',
      // V24 新增
      timelineEvents: '++id, projectId, order',
      // V27 新增
      chapterProgress: '++id, projectId, chapterId'
    })
    // V30: 素材标签表
    this.version(14).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider',
      materialCards: '++id, projectId, type, name, createdAt, updatedAt',
      materialTags: '++id, projectId, name',
      writingStats: '++id, projectId, date',
      storylines: '++id, projectId, name',
      chapterStorylineLinks: '++id, chapterId, storylineId',
      chatMessages: '++id, projectId, timestamp',
      bookMeta: '++id, projectId',
      bookCovers: '++id, projectId',
      characterRelationships: '++id, projectId, fromCharacterId, toCharacterId',
      projectViewpoint: '++id, projectId',
      milestones: '++id, projectId, targetDate, status',
      reminderSettings: '++id, projectId',
      chapterStyleProfiles: '++id, projectId, chapterId',
      chapterVersions: '++id, chapterId, projectId, createdAt',
      aiChatMessages: '++id, projectId, conversationId, timestamp',
      aiConversations: '++id, projectId, createdAt',
      projectMemory: 'projectId, updatedAt',
      plotThreads: '++id, projectId, tag, status, plantedInChapter, resolvedInChapter',
      chapterSummaries: '++id, projectId, chapterId, createdAt',
      projectVersions: '++id, projectId, versionIndex, isSelected',
      timelineEvents: '++id, projectId, order',
      chapterProgress: '++id, projectId, chapterId'
    })
  }
}

export const db = new NovelDatabase()

// V30: 批量导出接口
export interface MaterialExport {
  version: 1
  exportedAt: string
  materials: MaterialCard[]
}

// V30: 批量导出函数
export async function exportMaterials(options?: {
  projectId?: number
  type?: 'character' | 'location' | 'item'
}): Promise<MaterialExport> {
  let query = db.materialCards.toCollection()

  if (options?.projectId !== undefined) {
    query = db.materialCards.where('projectId').equals(options.projectId)
  }

  const cards = await query.toArray()

  // 按类型筛选
  let materials = cards
  if (options?.type) {
    materials = materials.filter(m => m.type === options.type)
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    materials
  }
}
