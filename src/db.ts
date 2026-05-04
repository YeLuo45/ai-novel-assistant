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

export type MaterialCardType = 'character' | 'location' | 'item'

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

class NovelDatabase extends Dexie {
  projects!: Table<Project>
  outlineNodes!: Table<OutlineNode>
  agentConfigs!: Table<AgentConfig>
  apiKeys!: Table<ApiKey>
  materialCards!: Table<MaterialCard>
  writingStats!: Table<WritingStats>
  storylines!: Table<Storyline>
  chapterStorylineLinks!: Table<ChapterStorylineLink>

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
  }
}

export const db = new NovelDatabase()
