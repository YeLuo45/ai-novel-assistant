/**
 * LocalBackupProvider
 * 使用 localStorage 存储 base64 编码的备份快照
 * 实现 CloudBackupProvider 接口
 */

import { CloudBackupProvider, BackupSnapshot } from './CloudBackupProvider'

const STORAGE_KEY = 'ai_novel_backup_snapshots'
const MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB localStorage limit

function generateId(): string {
  return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getSnapshots(): BackupSnapshot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveSnapshots(snapshots: BackupSnapshot[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots))
}

export class LocalBackupProvider implements CloudBackupProvider {
  /**
   * 获取所有备份快照列表（不包含实际数据）
   */
  async listBackups(): Promise<BackupSnapshot[]> {
    const snapshots = getSnapshots()
    return snapshots.map(({ id, name, createdAt, size }) => ({
      id,
      name,
      createdAt,
      size,
      data: '' // 不返回实际数据
    }))
  }

  /**
   * 保存备份快照
   */
  async saveBackup(name: string, data: string): Promise<BackupSnapshot> {
    const snapshots = getSnapshots()
    
    const snapshot: BackupSnapshot = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      size: data.length,
      data
    }
    
    snapshots.unshift(snapshot) // 最新备份放前面
    
    // 检查存储空间，超限时清理旧备份
    const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0)
    if (totalSize > MAX_STORAGE_SIZE) {
      await this.cleanupOldSnapshots(snapshots, MAX_STORAGE_SIZE * 0.7)
    }
    
    saveSnapshots(snapshots)
    return snapshot
  }

  /**
   * 读取备份快照（包含实际数据）
   */
  async getBackup(id: string): Promise<BackupSnapshot | null> {
    const snapshots = getSnapshots()
    return snapshots.find(s => s.id === id) || null
  }

  /**
   * 删除备份快照
   */
  async deleteBackup(id: string): Promise<boolean> {
    const snapshots = getSnapshots()
    const index = snapshots.findIndex(s => s.id === id)
    if (index === -1) return false
    
    snapshots.splice(index, 1)
    saveSnapshots(snapshots)
    return true
  }

  /**
   * 获取备份统计信息
   */
  async getBackupStats(): Promise<{ count: number; totalSize: number }> {
    const snapshots = getSnapshots()
    return {
      count: snapshots.length,
      totalSize: snapshots.reduce((sum, s) => sum + s.size, 0)
    }
  }

  /**
   * 清理旧快照直到总大小小于目标大小
   */
  private async cleanupOldSnapshots(snapshots: BackupSnapshot[], targetSize: number): Promise<void> {
    while (snapshots.length > 1) {
      const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0)
      if (totalSize <= targetSize) break
      
      // 删除最旧的备份
      snapshots.pop()
    }
  }
}
