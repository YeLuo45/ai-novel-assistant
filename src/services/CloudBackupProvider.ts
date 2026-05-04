import { backupService, BackupData } from './BackupService'

export interface BackupMeta {
  id: string
  name: string
  createdAt: string
  size: string
}

export interface CloudBackupProvider {
  upload(backup: ArrayBuffer, name: string): Promise<string>
  download(backupId: string): Promise<ArrayBuffer>
  list(): Promise<BackupMeta[]>
  delete?(backupId: string): Promise<void>
}

/**
 * LocalBackupProvider - stores backups in localStorage as base64
 * For browser localStorage limits, we limit each backup to ~5MB
 */
export class LocalBackupProvider implements CloudBackupProvider {
  private readonly PREFIX = 'backup_'
  private readonly INDEX_KEY = 'backup_index'

  async upload(backup: ArrayBuffer, name: string): Promise<string> {
    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(backup)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    // Generate ID
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const key = `${this.PREFIX}${id}`

    // Check size - localStorage has ~5MB limit per item in many browsers
    if (base64.length > 4 * 1024 * 1024) {
      throw new Error('备份数据过大（>4MB），无法使用本地快照功能')
    }

    // Store the backup data
    localStorage.setItem(key, base64)

    // Update index
    const index = await this.getIndex()
    index.push({
      id,
      name,
      createdAt: new Date().toISOString(),
      size: `${(base64.length * 0.75 / 1024).toFixed(1)} KB`
    })
    localStorage.setItem(this.INDEX_KEY, JSON.stringify(index))

    return id
  }

  async download(backupId: string): Promise<ArrayBuffer> {
    const base64 = localStorage.getItem(`${this.PREFIX}${backupId}`)
    if (!base64) {
      throw new Error('备份不存在或已过期')
    }

    // Decode base64 to binary
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  async list(): Promise<BackupMeta[]> {
    const index = await this.getIndex()
    return index.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async delete(backupId: string): Promise<void> {
    localStorage.removeItem(`${this.PREFIX}${backupId}`)
    const index = await this.getIndex()
    const filtered = index.filter(b => b.id !== backupId)
    localStorage.setItem(this.INDEX_KEY, JSON.stringify(filtered))
  }

  private async getIndex(): Promise<BackupMeta[]> {
    const raw = localStorage.getItem(this.INDEX_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
}

export const localBackupProvider = new LocalBackupProvider()
