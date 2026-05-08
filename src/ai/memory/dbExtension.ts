/**
 * V14 记忆系统数据库扩展
 * 扩展现有的 db.ts，添加记忆系统需要的表
 */

import { db } from '../../db'

// 记忆记录表
interface ProjectMemoryRecord {
  projectId: number
  memoryJson: string  // JSON序列化
  updatedAt: number
}

// 情节线程表
interface PlotThreadRecord {
  id?: number
  projectId: number
  tag: string
  description: string
  status: 'active' | 'resolved' | 'abandoned'
  plantedInChapter: number
  resolvedInChapter?: number
  resolutionNote?: string
  relatedCharacters: string  // JSON array string
  createdAt: number
  updatedAt: number
}

// 章节摘要表
interface ChapterSummaryRecord {
  id?: number
  projectId: number
  chapterId: number
  title: string
  summary: string
  keyEvents: string  // JSON array
  characterStates: string  // JSON object
  wordCount: number
  createdAt: number
}

// 导出表类型（供 memoryManager 使用）
export type { ProjectMemoryRecord, PlotThreadRecord, ChapterSummaryRecord }
