/**
 * V49 L2 EpisodicMemory - 情景记忆（时序记忆强化）
 * 
 * 情景记忆负责存储和检索有意义的经历片段
 * 特性：
 * - Episode 接口：标题、起止时间、关键事件、涉及角色、情感色调、显著性
 * - EpisodicRetriever：按时间/角色/主题检索，相似性查找
 */

import Dexie, { Table } from 'dexie'

// 情景记忆条目
export interface Episode {
  id?: number
  sessionId: string
  projectId?: number
  title: string
  startTime: number
  endTime: number
  keyEvents: string[]
  involvedCharacters: string[]
  emotionalTone: string      // 'positive' | 'negative' | 'neutral' | 'mixed'
  significance: number       // 0-100，重要性评分
  accessCount: number
  createdAt: number
  lastAccessed: number
  summary?: string           // 自动生成的摘要
  tags?: string[]
}

// 情景记忆检索选项
export interface EpisodeQuery {
  sessionId?: string
  projectId?: number
  timeRange?: { start: number; end: number }
  characters?: string[]
  themes?: string[]
  emotionalTone?: string
  minSignificance?: number
  limit?: number
  offset?: number
}

export class EpisodicMemory {
  private db: Dexie | null = null

  constructor() {}

  /**
   * 获取数据库连接
   */
  private async getDb(): Promise<Dexie> {
    if (!this.db) {
      this.db = new Dexie('EpisodicMemoryDB')
      this.db.version(1).stores({
        episodes: '++id, sessionId, projectId, title, startTime, endTime, significance, emotionalTone, createdAt',
        character_episodes: '++id, characterId, episodeId', // 角色-情景索引
      })
    }
    return this.db
  }

  /**
   * 创建情景记忆
   */
  async create(episode: Omit<Episode, 'id' | 'accessCount' | 'createdAt' | 'lastAccessed'>): Promise<number> {
    const db = await this.getDb()
    const now = Date.now()
    
    const newEpisode: Episode = {
      ...episode,
      accessCount: 0,
      createdAt: now,
      lastAccessed: now,
    }
    
    const id = await db.table('episodes').add(newEpisode)
    
    // 更新角色索引
    if (episode.involvedCharacters.length > 0) {
      await this.updateCharacterIndex(id as number, episode.involvedCharacters)
    }
    
    return id as number
  }

  /**
   * 更新角色索引
   */
  private async updateCharacterIndex(episodeId: number, characters: string[]): Promise<void> {
    const db = await this.getDb()
    for (const char of characters) {
      await db.table('character_episodes').add({
        characterId: char,
        episodeId,
      }).catch(() => {/* ignore duplicates */})
    }
  }

  /**
   * 按时间范围检索
   */
  async findByTimeRange(start: number, end: number): Promise<Episode[]> {
    const db = await this.getDb()
    return db.table('episodes')
      .where('startTime')
      .between(start, end)
      .toArray()
  }

  /**
   * 按角色检索
   */
  async findByCharacter(characterId: string): Promise<Episode[]> {
    const db = await this.getDb()
    const links = await db.table('character_episodes')
      .where('characterId')
      .equals(characterId)
      .toArray()
    
    const episodeIds = links.map(l => l.episodeId)
    if (episodeIds.length === 0) return []
    
    const episodes: Episode[] = []
    for (const id of episodeIds) {
      const episode = await db.table('episodes').get(id)
      if (episode) episodes.push(episode)
    }
    
    return episodes
  }

  /**
   * 按主题检索（通过标签和关键事件）
   */
  async findByTheme(theme: string): Promise<Episode[]> {
    const db = await this.getDb()
    const episodes = await db.table('episodes').toArray()
    const themeLower = theme.toLowerCase()
    
    return episodes.filter(ep => {
      if (ep.tags?.some(t => t.toLowerCase().includes(themeLower))) return true
      if (ep.keyEvents.some(ev => ev.toLowerCase().includes(themeLower))) return true
      if (ep.title.toLowerCase().includes(themeLower)) return true
      return false
    })
  }

  /**
   * 查找相似情景
   */
  async findSimilar(query: string, limit = 5): Promise<Episode[]> {
    const db = await this.getDb()
    const episodes = await db.table('episodes').toArray()
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    
    const scored = episodes.map(ep => {
      const titleWords = ep.title.toLowerCase().split(/\s+/)
      const eventWords = ep.keyEvents.join(' ').toLowerCase().split(/\s+/)
      
      let score = 0
      for (const qw of queryWords) {
        if (titleWords.some(w => w.includes(qw))) score += 3
        if (eventWords.some(w => w.includes(qw))) score += 1
      }
      
      // 考虑显著性加权
      score *= (ep.significance / 50)
      
      return { episode: ep, score }
    })
    
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.episode)
  }

  /**
   * 通用检索
   */
  async query(options: EpisodeQuery): Promise<Episode[]> {
    const db = await this.getDb()
    let episodes = await db.table('episodes').toArray()
    
    // 会话过滤
    if (options.sessionId) {
      episodes = episodes.filter(e => e.sessionId === options.sessionId)
    }
    
    // 项目过滤
    if (options.projectId !== undefined) {
      episodes = episodes.filter(e => e.projectId === options.projectId)
    }
    
    // 时间范围过滤
    if (options.timeRange) {
      episodes = episodes.filter(e =>
        e.startTime >= options.timeRange!.start &&
        e.endTime <= options.timeRange!.end
      )
    }
    
    // 角色过滤
    if (options.characters && options.characters.length > 0) {
      episodes = episodes.filter(e =>
        options.characters!.some(c => e.involvedCharacters?.includes(c))
      )
    }
    
    // 情感色调过滤
    if (options.emotionalTone) {
      episodes = episodes.filter(e => e.emotionalTone === options.emotionalTone)
    }
    
    // 显著性过滤
    if (options.minSignificance !== undefined) {
      episodes = episodes.filter(e => e.significance >= options.minSignificance)
    }
    
    // 按显著性排序
    episodes.sort((a, b) => b.significance - a.significance)
    
    // 分页
    const offset = options.offset || 0
    const limit = options.limit || episodes.length
    return episodes.slice(offset, offset + limit)
  }

  /**
   * 获取最近的情景记忆
   */
  async getRecent(sessionId: string, limit = 10): Promise<Episode[]> {
    const db = await this.getDb()
    const episodes = await db.table('episodes')
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .sortBy('createdAt')
    
    return episodes.slice(0, limit)
  }

  /**
   * 更新访问统计
   */
  async touch(id: number): Promise<void> {
    const db = await this.getDb()
    const episode = await db.table('episodes').get(id)
    if (episode) {
      await db.table('episodes').update(id, {
        accessCount: episode.accessCount + 1,
        lastAccessed: Date.now(),
      })
    }
  }

  /**
   * 获取情景记忆详情
   */
  async get(id: number): Promise<Episode | undefined> {
    const db = await this.getDb()
    return db.table('episodes').get(id)
  }

  /**
   * 删除情景记忆
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDb()
    await db.table('episodes').delete(id)
    // 同时删除角色索引
    await db.table('character_episodes').where('episodeId').equals(id).delete()
  }

  /**
   * 获取统计信息
   */
  async getStats(sessionId?: string): Promise<{
    totalEpisodes: number
    avgSignificance: number
    byEmotionalTone: Record<string, number>
  }> {
    const db = await this.getDb()
    let episodes: Episode[]
    
    if (sessionId) {
      episodes = await db.table('episodes').where('sessionId').equals(sessionId).toArray()
    } else {
      episodes = await db.table('episodes').toArray()
    }
    
    const avgSignificance = episodes.reduce((sum, e) => sum + e.significance, 0) / (episodes.length || 1)
    const byEmotionalTone: Record<string, number> = {}
    
    for (const ep of episodes) {
      byEmotionalTone[ep.emotionalTone] = (byEmotionalTone[ep.emotionalTone] || 0) + 1
    }
    
    return {
      totalEpisodes: episodes.length,
      avgSignificance,
      byEmotionalTone,
    }
  }
}

// Singleton instance
export const episodicMemory = new EpisodicMemory()