/**
 * Tool Types for ToolRegistry V2
 * Extended type definitions for the tool ecosystem
 */

export type ToolCategoryV2 = 'dictionary' | 'generator' | 'search' | 'analysis' | 'creative' | 'mcp' | 'custom'

export interface ToolInput {
  text: string
  context?: {
    projectId?: number
    chapterId?: number
    characterId?: number
    [key: string]: unknown
  }
}

export interface ToolOutput {
  success: boolean
  output: string
  metadata?: Record<string, unknown>
  error?: string
}

export interface WritingToolV2 {
  id: string
  name: string
  category: ToolCategoryV2
  description: string
  icon: string
  version: string
  execute: (input: ToolInput, context: { projectId: number; chapterId: number }) => Promise<ToolOutput>
  isMcp?: boolean
  mcpServerId?: string
  isCustom?: boolean
  crystallize?: () => Promise<CrystallizedSkill>
  validateInput?: (input: ToolInput) => ValidationResult
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

export interface CrystallizedSkill {
  id: string
  name: string
  toolId: string
  pattern: string
  successCount: number
  avgRating: number
  lastUsed: string
  code: string
  createdAt: number
}

export interface ToolExecutionLog {
  toolId: string
  toolName: string
  input: string
  output: string
  success: boolean
  timestamp: number
  executionTime: number
}

export interface MCPServerInfo {
  id: string
  name: string
  url: string
  enabled: boolean
  description?: string
  tools: string[]
}

// Export the old type for backward compatibility
export interface LegacyWritingTool {
  id: string
  name: string
  description: string
  icon: string
  category: 'text' | 'search' | 'calc' | 'media' | 'mcp'
  execute: (input: string, context: { projectId: number; chapterId: number }) => Promise<{
    success: boolean
    output: string
    metadata?: Record<string, any>
  }>
}