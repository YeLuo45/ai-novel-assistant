import Dexie, { Table } from 'dexie'

// 数据模型
export interface Project {
  id?: number
  title: string
  genre: string
  createdAt: Date
  updatedAt: Date
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
  provider: 'openai' | 'anthropic' | 'minimax'
  key: string
}

export interface MaterialCard {
  id?: number
  projectId: number
  type: 'character' | 'location' | 'item'
  name: string
  fields: Record<string, string>
  createdAt: Date
  updatedAt: Date
}
// Character type material card already exists, adding avatar support
export type MaterialCardType = 'character' | 'location' | 'item'

// Character relationship model
export interface CharacterRelationship {
  id?: number
  projectId: number
  fromCharacterId: number // source character card id
  toCharacterId: number   // target character card id
  relationshipType: string // e.g., "friend", "enemy", "family", "rival"
  description: string
}

// Viewpoint type
export type ViewpointType = 'first_person' | 'third_person_limited' | 'third_person_omniscient'

// Project viewpoint settings
export interface ProjectViewpoint {
  id?: number
  projectId: number
  viewpoint: ViewpointType
  currentCharacterId?: number // For first person, which character is the POV
}

// Writing stats for daily word count tracking
export interface WritingStats {
  id?: number
  projectId: number
  date: string // YYYY-MM-DD format
  wordCount: number
}

// Storyline model
export interface Storyline {
  id?: number
  projectId: number
  name: string
  color: string // hex color
}

// Chapter-Storyline link
export interface ChapterStorylineLink {
  id?: number
  chapterId: number
  storylineId: number
}

// Chat message for multi-turn conversation memory
export interface ChatMessage {
  id?: number
  projectId: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Book metadata for EPUB export
export interface BookMeta {
  id?: number
  projectId: number
  title: string
  author: string
  category: string
  description: string
  language: string
}

// Book cover image
export interface BookCover {
  id?: number
  projectId: number
  dataUrl: string // base64 data URL
  createdAt: Date
}

class NovelDatabase extends Dexie {
  projects!: Table<Project>
  outlineNodes!: Table<OutlineNode>
  agentConfigs!: Table<AgentConfig>
  apiKeys!: Table<ApiKey>
  materialCards!: Table<MaterialCard>
  writingStats!: Table<WritingStats>
  storylines!: Table<Storyline>
  chapterStorylineLinks!: Table<ChapterStorylineLink>
  chatMessages!: Table<ChatMessage>
  bookMeta!: Table<BookMeta>
  bookCovers!: Table<BookCover>
  characterRelationships!: Table<CharacterRelationship>
  projectViewpoint!: Table<ProjectViewpoint>

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
      projectViewpoint: '++id, projectId'
    })
  }
}

export const db = new NovelDatabase()
