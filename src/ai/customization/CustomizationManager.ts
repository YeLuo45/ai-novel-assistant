import type { AgentConfig, StyleTemplate, Workflow, Language } from './types'
import { BUILT_IN_TEMPLATES } from './agentTemplates'
import { STYLE_TEMPLATES } from './styleTemplates'
import { BUILT_IN_WORKFLOWS } from './workflows'

export class CustomizationManager {
  private customAgents: Map<string, AgentConfig> = new Map()
  private customStyles: Map<string, StyleTemplate> = new Map()
  private customWorkflows: Map<string, Workflow> = new Map()
  
  private currentAgentId: string = 'plot_expert'
  private currentStyleId: string = 'realistic'
  private currentWorkflowId: string = 'standard'
  private currentLanguage: Language = 'zh-CN'
  
  // ===== Agent管理 =====
  
  getAgentConfigs(): AgentConfig[] {
    const builtIn = BUILT_IN_TEMPLATES.map(t => ({ ...t.config, id: t.id } as AgentConfig))
    const custom = Array.from(this.customAgents.values())
    return [...builtIn, ...custom]
  }
  
  getAgentConfig(id: string): AgentConfig | null {
    const builtIn = BUILT_IN_TEMPLATES.find(t => t.id === id)
    if (builtIn) return { ...builtIn.config, id: builtIn.id } as AgentConfig
    
    return this.customAgents.get(id) || null
  }
  
  saveAgentConfig(config: AgentConfig): void {
    this.customAgents.set(config.id, config)
    this.persist()
  }
  
  deleteAgentConfig(id: string): boolean {
    const isBuiltIn = BUILT_IN_TEMPLATES.some(t => t.id === id)
    if (isBuiltIn) return false
    
    return this.customAgents.delete(id)
  }
  
  // ===== 风格模板管理 =====
  
  getStyleTemplates(): StyleTemplate[] {
    return [...STYLE_TEMPLATES, ...Array.from(this.customStyles.values())]
  }
  
  getStyleTemplate(id: string): StyleTemplate | null {
    const builtIn = STYLE_TEMPLATES.find(t => t.id === id)
    if (builtIn) return builtIn
    
    return this.customStyles.get(id) || null
  }
  
  saveStyleTemplate(template: StyleTemplate): void {
    this.customStyles.set(template.id, template)
    this.persist()
  }
  
  // ===== 工作流管理 =====
  
  getWorkflows(): Workflow[] {
    return [...BUILT_IN_WORKFLOWS, ...Array.from(this.customWorkflows.values())]
  }
  
  getWorkflow(id: string): Workflow | null {
    const builtIn = BUILT_IN_WORKFLOWS.find(w => w.id === id)
    if (builtIn) return builtIn
    
    return this.customWorkflows.get(id) || null
  }
  
  saveWorkflow(workflow: Workflow): void {
    this.customWorkflows.set(workflow.id, workflow)
    this.persist()
  }
  
  // ===== 当前设置 =====
  
  setCurrentAgent(id: string): void {
    this.currentAgentId = id
    this.persist()
  }
  
  getCurrentAgent(): string {
    return this.currentAgentId
  }
  
  setCurrentStyle(id: string): void {
    this.currentStyleId = id
    this.persist()
  }
  
  getCurrentStyle(): string {
    return this.currentStyleId
  }
  
  setCurrentWorkflow(id: string): void {
    this.currentWorkflowId = id
    this.persist()
  }
  
  getCurrentWorkflow(): string {
    return this.currentWorkflowId
  }
  
  setCurrentLanguage(lang: Language): void {
    this.currentLanguage = lang
    this.persist()
  }
  
  getCurrentLanguage(): Language {
    return this.currentLanguage
  }
  
  // ===== 持久化 =====
  
  private persist(): void {
    const data = {
      customAgents: Array.from(this.customAgents.entries()),
      customStyles: Array.from(this.customStyles.entries()),
      customWorkflows: Array.from(this.customWorkflows.entries()),
      currentAgentId: this.currentAgentId,
      currentStyleId: this.currentStyleId,
      currentWorkflowId: this.currentWorkflowId,
      currentLanguage: this.currentLanguage
    }
    
    try {
      localStorage.setItem('customization', JSON.stringify(data))
    } catch {}
  }
  
  load(): void {
    try {
      const data = localStorage.getItem('customization')
      if (!data) return
      
      const parsed = JSON.parse(data)
      
      this.customAgents = new Map(parsed.customAgents || [])
      this.customStyles = new Map(parsed.customStyles || [])
      this.customWorkflows = new Map(parsed.customWorkflows || [])
      this.currentAgentId = parsed.currentAgentId || 'plot_expert'
      this.currentStyleId = parsed.currentStyleId || 'realistic'
      this.currentWorkflowId = parsed.currentWorkflowId || 'standard'
      this.currentLanguage = parsed.currentLanguage || 'zh-CN'
    } catch {}
  }
}

export const customizationManager = new CustomizationManager()
