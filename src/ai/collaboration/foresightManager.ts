// 伏笔管理器
import type { ForeshadowingRecord } from './types'

export class ForesightManager {
  private records: Map<string, ForeshadowingRecord> = new Map()

  getRecord(projectId: number): ForeshadowingRecord {
    if (!this.records.has(String(projectId))) {
      this.records.set(String(projectId), { planted: [], resolved: [] })
    }
    return this.records.get(String(projectId))!
  }

  plant(projectId: number, tag: string, description: string, plotNodeId: string): void {
    const record = this.getRecord(projectId)
    record.planted.push({ tag, description, plotNodeId })
  }

  resolve(projectId: number, tag: string, resolvedIn: string): boolean {
    const record = this.getRecord(projectId)
    const idx = record.planted.findIndex(p => p.tag === tag)
    if (idx !== -1) {
      record.planted.splice(idx, 1)
      record.resolved.push({ tag, resolvedIn })
      return true
    }
    return false
  }

  getUnresolved(projectId: number): Array<{ tag: string, description: string }> {
    const record = this.getRecord(projectId)
    return record.planted.map(p => ({ tag: p.tag, description: p.description }))
  }
}

export const foresightManager = new ForesightManager()
