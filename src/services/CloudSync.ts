export interface SyncConfig {
  provider: 'local' | 'github'
  repo?: string
  token?: string
}

export interface Project {
  id: string
  title: string
  content: string
  metadata: {
    title: string
    author: string
    createdAt: number
    wordCount?: number
  }
  collaborators: string[]
  updatedAt: number
  version: number
}

export interface SyncResult {
  results: { id: string; success: boolean }[]
  timestamp: number
}

export class CloudSync {
  private config: SyncConfig = { provider: 'local' }
  private projects: Map<string, Project> = new Map()

  configure(config: SyncConfig): void {
    this.config = config
  }

  async save(project: Project): Promise<boolean> {
    const updated = { ...project, updatedAt: Date.now() }
    
    if (this.config.provider === 'github' && this.config.token && this.config.repo) {
      return this.saveToGithub(updated)
    }
    
    return this.saveLocal(updated)
  }

  async load(projectId: string): Promise<Project | null> {
    if (this.config.provider === 'github' && this.config.token && this.config.repo) {
      return this.loadFromGithub(projectId)
    }
    
    return this.loadLocal(projectId)
  }

  async syncAll(): Promise<SyncResult> {
    const results: SyncResult['results'] = []
    
    for (const [id, project] of this.projects) {
      const success = await this.save(project)
      results.push({ id, success })
    }
    
    return { results, timestamp: Date.now() }
  }

  listProjects(): Project[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  deleteProject(projectId: string): boolean {
    return this.projects.delete(projectId)
  }

  private async saveToGithub(project: Project): Promise<boolean> {
    try {
      const path = `projects/${project.id}.json`
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(project, null, 2))))
      
      const response = await fetch(`https://api.github.com/repos/${this.config.token}/${this.config.repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: `Update project ${project.id}`,
          content,
          branch: 'main'
        })
      })
      
      if (response.ok) {
        this.projects.set(project.id, project)
      }
      
      return response.ok
    } catch {
      return false
    }
  }

  private async loadFromGithub(projectId: string): Promise<Project | null> {
    try {
      const path = `projects/${projectId}.json`
      
      const response = await fetch(`https://api.github.com/repos/${this.config.token}/${this.config.repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${this.config.token}` }
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      const content = JSON.parse(decodeURIComponent(escape(atob(data.content))))
      
      this.projects.set(projectId, content)
      return content
    } catch {
      return null
    }
  }

  private saveLocal(project: Project): boolean {
    try {
      this.projects.set(project.id, project)
      localStorage.setItem(`project_${project.id}`, JSON.stringify(project))
      return true
    } catch {
      return false
    }
  }

  private loadLocal(projectId: string): Project | null {
    try {
      const data = localStorage.getItem(`project_${projectId}`)
      if (!data) return null
      
      const project = JSON.parse(data) as Project
      this.projects.set(projectId, project)
      return project
    } catch {
      return null
    }
  }

  loadAllFromLocal(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('project_')) {
          const data = localStorage.getItem(key)
          if (data) {
            const project = JSON.parse(data) as Project
            this.projects.set(project.id, project)
          }
        }
      }
    } catch {}
  }
}

export const cloudSync = new CloudSync()
