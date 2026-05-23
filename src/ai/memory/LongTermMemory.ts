/**
 * V40 LongTermMemory - 长期记忆管理
 * 基于 Map 的内存存储 + 可选 Dexie 持久化
 */

import { db } from '../../db'
import type { MemoryItem, MemoryItemType } from './MemoryItem'
import { createMemoryItem } from './MemoryItem'

const DEFAULT_PRUNE_THRESHOLD = 0.1

export class LongTermMemory {
  private store: Map<string, MemoryItem>
  private pruneThreshold: number

  constructor(pruneThreshold: number = DEFAULT_PRUNE_THRESHOLD) {
    this.store = new Map()
    this.pruneThreshold = pruneThreshold
  }

  // 生成唯一ID
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * 添加记忆
   */
  add(item: MemoryItem): void {
    this.store.set(item.id, { ...item })
  }

  /**
   * 创建并添加记忆
   */
  addNew(
    type: MemoryItemType,
    content: string,
    importance: number = 0.5,
    tags: string[] = [],
    metadata?: Record<string, unknown>
  ): MemoryItem {
    const item = createMemoryItem(type, content, importance, tags, metadata)
    this.add(item)
    return item
  }

  /**
   * 获取记忆
   */
  get(id: string): MemoryItem | undefined {
    const item = this.store.get(id)
    if (item) {
      // 更新访问统计
      item.accessCount++
      item.accessedAt = Date.now()
    }
    return item
  }

  /**
   * 更新记忆
   */
  update(id: string, updates: Partial<MemoryItem>): MemoryItem | undefined {
    const item = this.store.get(id)
    if (!item) return undefined

    const updated = { ...item, ...updates }
    this.store.set(id, updated)
    return updated
  }

  /**
   * 删除记忆
   */
  delete(id: string): boolean {
    return this.store.delete(id)
  }

  /**
   * 按类型查询
   */
  getByType(type: MemoryItemType): MemoryItem[] {
    return Array.from(this.store.values()).filter(m => m.type === type)
  }

  /**
   * 按标签查询
   */
  getByTags(tags: string[]): MemoryItem[] {
    const tagSet = new Set(tags.map(t => t.toLowerCase()))
    return Array.from(this.store.values()).filter(m =>
      m.tags.some(t => tagSet.has(t.toLowerCase()))
    )
  }

  /**
   * 获取所有记忆
   */
  getAll(): MemoryItem[] {
    return Array.from(this.store.values())
  }

  /**
   * 记忆数量
   */
  size(): number {
    return this.store.size
  }

  /**
   * 清理低 importance 记忆
   */
  prune(): number {
    let pruned = 0
    const entries = Array.from(this.store.entries())
    for (const [id, item] of entries) {
      if (item.importance < this.pruneThreshold) {
        this.store.delete(id)
        pruned++
      }
    }
    return pruned
  }

  /**
   * 持久化到 Dexie
   */
  async persist(projectId: number): Promise<void> {
    try {
      const items = Array.from(this.store.values())
      const data = {
        projectId,
        memoryJson: JSON.stringify(items),
        updatedAt: Date.now(),
      }
      await db.projectMemory.put(data)
    } catch (e) {
      console.error('Failed to persist memory:', e)
    }
  }

  /**
   * 从 Dexie 加载
   */
  async load(projectId: number): Promise<void> {
    try {
      const record = await db.projectMemory.get(projectId)
      if (record && record.memoryJson) {
        const items = JSON.parse(record.memoryJson) as MemoryItem[]
        this.store.clear()
        items.forEach(item => this.store.set(item.id, item))
      }
    } catch (e) {
      console.error('Failed to load memory:', e)
    }
  }

  /**
   * 清空所有记忆
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * 设置清理阈值
   */
  setPruneThreshold(threshold: number): void {
    this.pruneThreshold = Math.max(0, Math.min(1, threshold))
  }

  /**
   * 导出为普通对象（用于序列化）
   */
  toArray(): MemoryItem[] {
    return Array.from(this.store.values())
  }

  /**
   * 从对象数组导入
   */
  fromArray(items: MemoryItem[]): void {
    this.store.clear()
    items.forEach(item => this.store.set(item.id, item))
  }
}

// 默认实例
export const longTermMemory = new LongTermMemory()