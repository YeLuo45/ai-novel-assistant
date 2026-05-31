import JSZip from 'jszip'
import { db } from '../db'

export interface BackupData {
  version: number
  exportedAt: string
  data: {
    projects: any[]
    outlineNodes: any[]
    agentConfigs: any[]
    apiKeys: any[]
    materialCards: any[]
    writingStats: any[]
    storylines: any[]
    chapterStorylineLinks: any[]
    chatMessages: any[]
    bookMeta: any[]
    bookCovers: any[]
    settings?: any
  }
}

export interface BackupStats {
  projectCount: number
  chapterCount: number
  characterCount: number
  worldbuildingCount: number
  totalWordCount: number
  chatMessageCount: number
  estimatedSize: string
}

export interface ImportConflict {
  type: 'project' | 'chapter'
  localId: number
  localName: string
  importName: string
}

export interface ImportPreview {
  stats: BackupStats
  conflicts: ImportConflict[]
  data: BackupData
}

export type ImportStrategy = 'merge' | 'overwrite' | 'skip'

export class BackupService {
  /**
   * Gather all data from IndexedDB for export
   */
  async gatherData(): Promise<BackupData> {
    const [projects, outlineNodes, agentConfigs, apiKeys, materialCards, 
           writingStats, storylines, chapterStorylineLinks, chatMessages,
           bookMeta, bookCovers] = await Promise.all([
      db.projects.toArray(),
      db.outlineNodes.toArray(),
      db.agentConfigs.toArray(),
      db.apiKeys.toArray(),
      db.materialCards.toArray(),
      db.writingStats.toArray(),
      db.storylines.toArray(),
      db.chapterStorylineLinks.toArray(),
      db.chatMessages.toArray(),
      db.bookMeta.toArray(),
      db.bookCovers.toArray()
    ])

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        projects,
        outlineNodes,
        agentConfigs,
        apiKeys,
        materialCards,
        writingStats,
        storylines,
        chapterStorylineLinks,
        chatMessages,
        bookMeta,
        bookCovers
      }
    }
  }

  /**
   * Calculate statistics for preview
   */
  calculateStats(data: BackupData): BackupStats {
    const { projects, outlineNodes, materialCards, chatMessages } = data.data
    
    const chapterCount = outlineNodes.filter(n => n.type === 'chapter').length
    const characterCount = materialCards.filter(c => c.type === 'character').length
    const worldbuildingCount = materialCards.filter(c => c.type !== 'character').length
    const totalWordCount = outlineNodes.reduce((sum, n) => sum + (n.content?.length || 0), 0)
    
    // Rough estimate: 2 bytes per char for UTF-16
    const rawSize = JSON.stringify(data).length * 2
    let estimatedSize: string
    if (rawSize > 1024 * 1024) {
      estimatedSize = `${(rawSize / (1024 * 1024)).toFixed(1)} MB`
    } else {
      estimatedSize = `${(rawSize / 1024).toFixed(1)} KB`
    }

    return {
      projectCount: projects.length,
      chapterCount,
      characterCount,
      worldbuildingCount,
      totalWordCount,
      chatMessageCount: chatMessages.length,
      estimatedSize
    }
  }

  /**
   * Export data as a ZIP file and trigger download
   */
  async exportData(): Promise<string> {
    const data = await this.gatherData()
    const stats = this.calculateStats(data)
    
    const zip = new JSZip()
    const jsonContent = JSON.stringify(data, null, 2)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    zip.file(`data_backup_${timestamp}.json`, jsonContent)
    
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    
    // Trigger download
    const a = document.createElement('a')
    a.href = url
    a.download = `data_backup_${timestamp}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return `已导出 ${stats.projectCount} 个项目，${stats.chapterCount} 个章节`
  }

  /**
   * Parse uploaded file (ZIP or JSON)
   */
  async parseFile(file: File): Promise<{ isZip: boolean, content: string }> {
    const isZip = file.name.endsWith('.zip')
    
    if (isZip) {
      const zip = await JSZip.loadAsync(file)
      // Find the first .json file in the zip
      const jsonFile = Object.keys(zip.files).find(name => name.endsWith('.json'))
      if (!jsonFile) {
        throw new Error('ZIP文件中未找到JSON文件')
      }
      const content = await zip.files[jsonFile].async('string')
      return { isZip: true, content }
    } else {
      const content = await file.text()
      return { isZip: false, content }
    }
  }

  /**
   * Validate and parse backup data
   */
  validateAndParse(content: string): BackupData {
    let data: BackupData
    try {
      data = JSON.parse(content)
    } catch {
      throw new Error('文件格式无效，无法解析JSON')
    }

    if (!data.version || !data.data) {
      throw new Error('备份文件格式无效：缺少必要字段')
    }

    if (data.version > 1) {
      throw new Error(`不支持的备份版本（v${data.version}），请升级应用程序`)
    }

    return data
  }

  /**
   * Preview import - detect conflicts
   */
  async previewImport(data: BackupData): Promise<ImportPreview> {
    const stats = this.calculateStats(data)
    const conflicts: ImportConflict[] = []
    
    const localProjects = await db.projects.toArray()
    
    // Detect project name conflicts
    for (const project of data.data.projects) {
      const conflict = localProjects.find(p => p.title === project.title)
      if (conflict) {
        conflicts.push({
          type: 'project',
          localId: conflict.id!,
          localName: conflict.title,
          importName: project.title
        })
      }
    }

    return { stats, conflicts, data }
  }

  /**
   * Execute import with given strategy
   */
  async executeImport(
    data: BackupData, 
    strategy: ImportStrategy,
    onProgress?: (msg: string) => void
  ): Promise<{ success: number, failed: number, skipped: number }> {
    const { projects, outlineNodes, agentConfigs, apiKeys, materialCards,
           writingStats, storylines, chapterStorylineLinks, chatMessages,
           bookMeta, bookCovers } = data.data

    let success = 0, failed = 0, skipped = 0

    // Map old IDs to new IDs for relationships
    const projectIdMap = new Map<number, number>()
    const nodeIdMap = new Map<number, number>()

    // Import projects
    for (const project of projects) {
      try {
        const localProject = await db.projects.where('title').equals(project.title).first()
        
        if (localProject) {
          if (strategy === 'skip') {
            skipped++
            projectIdMap.set(project.id!, localProject.id!)
            continue
          } else if (strategy === 'merge') {
            // Create with new name
            const newProject = { ...project }
            delete newProject.id
            newProject.title = `${project.title} (导入副本)`
            const id = await db.projects.add(newProject)
            projectIdMap.set(project.id!, id as number)
            success++
          } else if (strategy === 'overwrite') {
            await db.projects.update(localProject.id!, project)
            projectIdMap.set(project.id!, localProject.id!)
            success++
          }
        } else {
          const newProject = { ...project }
          delete newProject.id
          const id = await db.projects.add(newProject)
          projectIdMap.set(project.id!, id as number)
          success++
        }
      } catch (e) {
        failed++
        console.error('Failed to import project:', e)
      }
    }

    onProgress?.(`已处理项目，正在导入大纲节点...`)

    // Import outline nodes
    for (const node of outlineNodes) {
      try {
        const newProjectId = projectIdMap.get(node.projectId)
        if (!newProjectId) {
          skipped++
          continue
        }

        const newNode = { ...node }
        delete newNode.id
        newNode.projectId = newProjectId
        
        const id = await db.outlineNodes.add(newNode)
        nodeIdMap.set(node.id!, id as number)
        success++
      } catch (e) {
        failed++
      }
    }

    onProgress?.(`正在导入素材卡...`)

    // Import material cards
    for (const card of materialCards) {
      try {
        const newProjectId = projectIdMap.get(card.projectId)
        if (!newProjectId) {
          skipped++
          continue
        }

        const newCard = { ...card }
        delete newCard.id
        newCard.projectId = newProjectId
        
        await db.materialCards.add(newCard)
        success++
      } catch (e) {
        failed++
      }
    }

    // Import agent configs
    for (const config of agentConfigs) {
      try {
        const newProjectId = projectIdMap.get(config.projectId)
        if (!newProjectId) {
          skipped++
          continue
        }

        const newConfig = { ...config }
        delete newConfig.id
        newConfig.projectId = newProjectId
        
        await db.agentConfigs.add(newConfig)
        success++
      } catch (e) {
        failed++
      }
    }

    // Import storylines
    for (const storyline of storylines) {
      try {
        const newProjectId = projectIdMap.get(storyline.projectId)
        if (!newProjectId) {
          skipped++
          continue
        }

        const newStoryline = { ...storyline }
        delete newStoryline.id
        newStoryline.projectId = newProjectId
        
        await db.storylines.add(newStoryline)
        success++
      } catch (e) {
        failed++
      }
    }

    onProgress?.(`正在导入其他数据...`)

    // Import chat messages
    for (const msg of chatMessages) {
      try {
        const newProjectId = projectIdMap.get(msg.projectId)
        if (!newProjectId) {
          skipped++
          continue
        }

        const newMsg = { ...msg }
        delete newMsg.id
        newMsg.projectId = newProjectId
        
        await db.chatMessages.add(newMsg)
        success++
      } catch (e) {
        failed++
      }
    }

    // Import book meta
    for (const meta of bookMeta) {
      try {
        const newProjectId = projectIdMap.get(meta.projectId)
        if (!newProjectId) {
          skipped++
          continue
        }

        const newMeta = { ...meta }
        delete newMeta.id
        newMeta.projectId = newProjectId
        
        await db.bookMeta.add(newMeta)
        success++
      } catch (e) {
        failed++
      }
    }

    // Import book covers
    for (const cover of bookCovers) {
      try {
        const newProjectId = projectIdMap.get(cover.projectId)
        if (!newProjectId) {
          skipped++
          continue
        }

        const newCover = { ...cover }
        delete newCover.id
        newCover.projectId = newProjectId
        
        await db.bookCovers.add(newCover)
        success++
      } catch (e) {
        failed++
      }
    }

    return { success, failed, skipped }
  }
}

export const backupService = new BackupService()
