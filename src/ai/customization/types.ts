export interface AgentConfig {
  id: string
  name: string
  role: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  capabilities: string[]
  outputFormat: OutputFormat
}

export type OutputFormat = 'plain' | 'structured' | 'json'

export interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: string
  config: Partial<AgentConfig>
  isBuiltIn: boolean
}

export interface WorkflowStep {
  id: string
  name: string
  agentId: string
  prompt: string
  input: string  // 'previous' | 'original' | 'custom'
  condition?: WorkflowCondition
}

export interface WorkflowCondition {
  type: 'if' | 'unless'
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt'
  value: any
}

export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  isBuiltIn: boolean
}

export interface StyleTemplate {
  id: string
  name: string
  description: string
  language: string
  features: {
    sentenceLength: 'short' | 'medium' | 'long' | 'mixed'
    paragraphLength: 'short' | 'medium' | 'long'
    dialogueRatio: number
    descriptionDensity: number
    emotionalIntensity: number
  }
  vocabulary: {
    preferredWords: string[]
    avoidedWords: string[]
    formalityLevel: number
  }
  rhetoricalDevices: string[]
  sampleText?: string
}

export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
