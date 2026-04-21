import { create } from 'zustand'
import { db, Project, OutlineNode, AgentConfig } from './db'

interface AppState {
  // 项目列表
  projects: Project[]
  currentProject: Project | null
  loadProjects: () => Promise<void>
  createProject: (title: string, genre: string) => Promise<Project>
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  setCurrentProject: (project: Project | null) => void

  // 大纲节点
  outlineNodes: OutlineNode[]
  loadOutline: (projectId: number) => Promise<void>
  createOutlineNode: (node: Omit<OutlineNode, 'id'>) => Promise<OutlineNode>
  updateOutlineNode: (id: number, updates: Partial<OutlineNode>) => Promise<void>
  deleteOutlineNode: (id: number) => Promise<void>
  moveOutlineNode: (id: number, newParentId: number | null, newOrder: number) => Promise<void>

  // AI配置
  agentConfigs: AgentConfig[]
  loadAgentConfigs: (projectId: number) => Promise<void>
  createAgentConfig: (config: Omit<AgentConfig, 'id'>) => Promise<AgentConfig>
  updateAgentConfig: (id: number, updates: Partial<AgentConfig>) => Promise<void>
  deleteAgentConfig: (id: number) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  outlineNodes: [],
  agentConfigs: [],

  // 项目管理
  loadProjects: async () => {
    const projects = await db.projects.toArray()
    set({ projects })
  },

  createProject: async (title, genre) => {
    const now = new Date()
    const project: Project = { title, genre, createdAt: now, updatedAt: now }
    const id = await db.projects.add(project)
    const newProject = { ...project, id: id as number }
    set(state => ({ projects: [...state.projects, newProject] }))
    return newProject
  },

  updateProject: async (id, updates) => {
    await db.projects.update(id, { ...updates, updatedAt: new Date() })
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...updates } : state.currentProject
    }))
  },

  deleteProject: async (id) => {
    await db.projects.delete(id)
    await db.outlineNodes.where('projectId').equals(id).delete()
    await db.agentConfigs.where('projectId').equals(id).delete()
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject
    }))
  },

  setCurrentProject: (project) => {
    set({ currentProject: project })
    if (project?.id) {
      get().loadOutline(project.id)
      get().loadAgentConfigs(project.id)
    }
  },

  // 大纲管理
  loadOutline: async (projectId) => {
    const nodes = await db.outlineNodes.where('projectId').equals(projectId).sortBy('order')
    set({ outlineNodes: nodes })
  },

  createOutlineNode: async (node) => {
    const id = await db.outlineNodes.add(node)
    const newNode = { ...node, id: id as number }
    set(state => ({ outlineNodes: [...state.outlineNodes, newNode] }))
    return newNode
  },

  updateOutlineNode: async (id, updates) => {
    await db.outlineNodes.update(id, updates)
    set(state => ({
      outlineNodes: state.outlineNodes.map(n => n.id === id ? { ...n, ...updates } : n)
    }))
  },

  deleteOutlineNode: async (id) => {
    await db.outlineNodes.delete(id)
    // 递归删除子节点
    const { outlineNodes } = get()
    const childIds = outlineNodes.filter(n => n.parentId === id).map(n => n.id)
    for (const childId of childIds) {
      if (childId !== undefined) {
        await get().deleteOutlineNode(childId)
      }
    }
    set(state => ({ outlineNodes: state.outlineNodes.filter(n => n.id !== id) }))
  },

  moveOutlineNode: async (id, newParentId, newOrder) => {
    await db.outlineNodes.update(id, { parentId: newParentId, order: newOrder })
    set(state => ({
      outlineNodes: state.outlineNodes.map(n => n.id === id ? { ...n, parentId: newParentId, order: newOrder } : n)
    }))
  },

  // AI配置
  loadAgentConfigs: async (projectId) => {
    const configs = await db.agentConfigs.where('projectId').equals(projectId).toArray()
    set({ agentConfigs: configs })
  },

  createAgentConfig: async (config) => {
    const id = await db.agentConfigs.add(config)
    const newConfig = { ...config, id: id as number }
    set(state => ({ agentConfigs: [...state.agentConfigs, newConfig] }))
    return newConfig
  },

  updateAgentConfig: async (id, updates) => {
    await db.agentConfigs.update(id, updates)
    set(state => ({
      agentConfigs: state.agentConfigs.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  },

  deleteAgentConfig: async (id) => {
    await db.agentConfigs.delete(id)
    set(state => ({ agentConfigs: state.agentConfigs.filter(c => c.id !== id) }))
  },
}))
