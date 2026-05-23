/**
 * V40 MemoryItem - 记忆数据模型
 * 持久化记忆 + 上下文压缩
 */

export type MemoryItemType = 'project' | 'character' | 'worldbuilding' | 'plot' | 'custom'

export interface MemoryItem {
  id: string
  type: MemoryItemType
  content: string
  embedding?: number[]
  createdAt: number
  accessedAt: number
  accessCount: number
  importance: number  // 0-1
  tags: string[]
  metadata?: Record<string, unknown>
}

export interface MemoryStoreOptions {
  maxItems?: number
  pruneThreshold?: number  // importance 低于此值会被清理
}

export function createMemoryItem(
  type: MemoryItemType,
  content: string,
  importance: number = 0.5,
  tags: string[] = [],
  metadata?: Record<string, unknown>
): MemoryItem {
  const now = Date.now()
  return {
    id: `mem_${now}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    content,
    createdAt: now,
    accessedAt: now,
    accessCount: 0,
    importance: Math.max(0, Math.min(1, importance)),
    tags,
    metadata,
  }
}