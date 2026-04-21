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

class NovelDatabase extends Dexie {
  projects!: Table<Project>
  outlineNodes!: Table<OutlineNode>
  agentConfigs!: Table<AgentConfig>
  apiKeys!: Table<ApiKey>

  constructor() {
    super('NovelDB')
    this.version(1).stores({
      projects: '++id, title, genre, createdAt, updatedAt',
      outlineNodes: '++id, projectId, parentId, type, status, order',
      agentConfigs: '++id, projectId, name, model',
      apiKeys: '++id, provider'
    })
  }
}

export const db = new NovelDatabase()
