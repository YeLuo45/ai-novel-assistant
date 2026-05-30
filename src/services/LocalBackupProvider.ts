import { CloudBackupProvider, BackupMeta } from './CloudBackupProvider'

const STORAGE_PREFIX = 'backup_'
const INDEX_KEY = 'backup_index'
const MAX_BACKUP_SIZE = 4 * 1024 * 1024 // 4MB to be safe

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * LocalBackupProvider - stores backups in localStorage as base64
 */
export class LocalBackupProvider implements CloudBackupProvider {
  private getIndex(): BackupMeta[] {
    try {
      const raw = localStorage.getItem(INDEX_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  private saveIndex(index: BackupMeta[]): void {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  }

  async upload(backup: ArrayBuffer, name: string): Promise<string> {
    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(backup)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    if (base64.length > MAX_BACKUP_SIZE) {
      throw new Error('备份数据过大（>4MB），无法使用本地快照功能')
    }

    const id = generateId()
    const key = `${STORAGE_PREFIX}${id}`

    localStorage.setItem(key, base64)

    const index = this.getIndex()
    index.push({
      id,
      name,
      createdAt: new Date().toISOString(),
      size: `${(base64.length * 0.75 / 1024).toFixed(1)} KB`
    })
    this.saveIndex(index)

    return id
  }

  async download(backupId: string): Promise<ArrayBuffer> {
    const base64 = localStorage.getItem(`${STORAGE_PREFIX}${backupId}`)
    if (!base64) {
      throw new Error('备份不存在或已过期')
    }

    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  async list(): Promise<BackupMeta[]> {
    return this.getIndex().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async delete(backupId: string): Promise<void> {
    localStorage.removeItem(`${STORAGE_PREFIX}${backupId}`)
    const index = this.getIndex()
    this.saveIndex(index.filter(b => b.id !== backupId))
  }
}

export const localBackupProvider = new LocalBackupProvider()
