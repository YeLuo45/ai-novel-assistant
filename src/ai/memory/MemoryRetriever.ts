/**
 * V40 MemoryRetriever - 记忆检索接口
 * 支持关键词、标签、时间范围、重要性等多种检索方式
 */

import type { MemoryItem, MemoryItemType } from './MemoryItem'

export interface SearchOptions {
  query: string
  limit?: number
  type?: MemoryItemType
}

export interface TimeRangeOptions {
  start: number
  end: number
  limit?: number
}

export interface ImportanceOptions {
  minImportance: number
  limit?: number
}

export class MemoryRetriever {
  private items: MemoryItem[]

  constructor(items: MemoryItem[] = []) {
    this.items = items
  }

  /**
   * 更新检索的数据源
   */
  setItems(items: MemoryItem[]): void {
    this.items = items
  }

  /**
   * 关键词检索
   * 支持搜索 content 和 tags
   */
  search(options: SearchOptions): MemoryItem[] {
    const { query, limit = 10, type } = options
    const queryLower = query.toLowerCase()

    let results = this.items.filter(item => {
      // 过滤类型
      if (type && item.type !== type) return false

      // 搜索 content
      if (item.content.toLowerCase().includes(queryLower)) return true

      // 搜索 tags
      if (item.tags.some(tag => tag.toLowerCase().includes(queryLower))) return true

      return false
    })

    // 按访问频率和重要性排序
    results.sort((a, b) => {
      const scoreA = a.accessCount * 0.3 + a.importance * 0.7
      const scoreB = b.accessCount * 0.3 + b.importance * 0.7
      return scoreB - scoreA
    })

    return results.slice(0, limit)
  }

  /**
   * 基于标签检索
   */
  findByTags(tags: string[], matchAll: boolean = false): MemoryItem[] {
    const tagSet = new Set(tags.map(t => t.toLowerCase()))

    return this.items.filter(item => {
      const itemTags = item.tags.map(t => t.toLowerCase())
      
      if (matchAll) {
        // 所有标签都必须匹配
        return tags.every(tag => itemTags.includes(tag.toLowerCase()))
      } else {
        // 至少一个标签匹配
        return itemTags.some(tag => tagSet.has(tag))
      }
    })
  }

  /**
   * 时间范围检索
   */
  findByTimeRange(options: TimeRangeOptions): MemoryItem[] {
    const { start, end, limit = 50 } = options

    let results = this.items.filter(item => {
      const createdAt = item.createdAt
      return createdAt >= start && createdAt <= end
    })

    // 按时间倒序（最新的在前）
    results.sort((a, b) => b.createdAt - a.createdAt)

    return results.slice(0, limit)
  }

  /**
   * 重要性排序检索
   */
  findByImportance(options: ImportanceOptions): MemoryItem[] {
    const { minImportance, limit = 20 } = options

    let results = this.items.filter(item => item.importance >= minImportance)

    // 按重要性降序，然后按访问次数
    results.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance
      }
      return b.accessCount - a.accessCount
    })

    return results.slice(0, limit)
  }

  /**
   * 按类型检索
   */
  findByType(type: MemoryItemType, limit?: number): MemoryItem[] {
    let results = this.items.filter(item => item.type === type)
    
    results.sort((a, b) => b.createdAt - a.createdAt)
    
    return limit ? results.slice(0, limit) : results
  }

  /**
   * 获取最近访问的记忆
   */
  getRecentlyAccessed(limit: number = 10): MemoryItem[] {
    return [...this.items]
      .sort((a, b) => b.accessedAt - a.accessedAt)
      .slice(0, limit)
  }

  /**
   * 获取最近创建的记忆
   */
  getRecentlyCreated(limit: number = 10): MemoryItem[] {
    return [...this.items]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
  }

  /**
   * 获取高频访问记忆
   */
  getMostAccessed(limit: number = 10): MemoryItem[] {
    return [...this.items]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    total: number
    byType: Record<MemoryItemType, number>
    avgImportance: number
    totalAccessCount: number
  } {
    const byType: Record<MemoryItemType, number> = {
      project: 0,
      character: 0,
      worldbuilding: 0,
      plot: 0,
      custom: 0,
    }

    let totalImportance = 0
    let totalAccessCount = 0

    for (const item of this.items) {
      byType[item.type]++
      totalImportance += item.importance
      totalAccessCount += item.accessCount
    }

    return {
      total: this.items.length,
      byType,
      avgImportance: this.items.length > 0 ? totalImportance / this.items.length : 0,
      totalAccessCount,
    }
  }

  /**
   * 相关记忆检索 - 找到与给定记忆相似的其他记忆
   */
  findRelated(item: MemoryItem, limit: number = 5): MemoryItem[] {
    const itemTags = new Set(item.tags.map(t => t.toLowerCase()))
    
    return this.items
      .filter(other => {
        if (other.id === item.id) return false
        
        // 共享标签
        const sharedTags = other.tags.filter(t => itemTags.has(t.toLowerCase()))
        if (sharedTags.length > 0) return true
        
        // 相同类型且相近的重要性
        if (other.type === item.type && Math.abs(other.importance - item.importance) < 0.2) {
          return true
        }
        
        return false
      })
      .slice(0, limit)
  }
}

// 默认实例（需要通过 setItems 方法设置数据源）
export const memoryRetriever = new MemoryRetriever()