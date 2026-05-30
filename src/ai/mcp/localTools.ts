/**
 * Local Tools - Exposed MCP tools from ai-novel-assistant
 * V51: Tools that can be called by external MCP clients
 */

import type { LocalToolDefinition, MCPToolResult } from './types'

/**
 * Query materials from the material library
 */
export const queryMaterialsTool: LocalToolDefinition = {
  id: 'queryMaterials',
  name: 'queryMaterials',
  description: 'Query materials from the material library by keyword or category',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Search keyword for materials' },
      category: { type: 'string', description: 'Material category (场景/角色/情节/对话/其他)' },
      limit: { type: 'number', description: 'Maximum number of results', default: 20 }
    },
    required: ['keyword']
  },
  execute: async (args) => {
    const keyword = args.keyword as string
    const category = args.category as string | undefined
    const limit = (args.limit as number) || 20

    // In a real implementation, this would query Dexie/material library
    // For now, return a mock response
    const mockMaterials = [
      { id: 1, name: `素材: ${keyword} A`, category: category || '场景', content: '素材内容...' },
      { id: 2, name: `素材: ${keyword} B`, category: category || '角色', content: '素材内容...' }
    ].slice(0, limit)

    return {
      success: true,
      output: JSON.stringify({
        materials: mockMaterials,
        total: mockMaterials.length,
        keyword,
        category: category || '全部'
      })
    }
  }
}

/**
 * Generate a character profile
 */
export const generateCharacterTool: LocalToolDefinition = {
  id: 'generateCharacter',
  name: 'generateCharacter',
  description: 'Generate a character profile based on input parameters',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Character name' },
      role: { type: 'string', description: 'Character role (protagonist/antagonist/supporting)' },
      age: { type: 'number', description: 'Character age' },
      traits: { type: 'string', description: 'Personality traits (comma-separated)' },
      gender: { type: 'string', description: 'Character gender' }
    },
    required: ['name', 'role']
  },
  execute: async (args) => {
    const traits = args.traits ? (args.traits as string).split(',').map(t => t.trim()) : []

    const character = {
      id: `char_${Date.now()}`,
      name: args.name,
      role: args.role,
      age: args.age || 25,
      traits: traits.length > 0 ? traits : ['待定义'],
      gender: (args.gender as string) || '未知',
      backstory: `这是角色${args.name}的故事背景...`,
      appearance: `角色${args.name}的外貌特征...`,
      personality: `角色${args.name}的性格特点...`,
      createdAt: new Date().toISOString()
    }

    return {
      success: true,
      output: JSON.stringify(character)
    }
  }
}

/**
 * Generate plot suggestions
 */
export const suggestPlotTool: LocalToolDefinition = {
  id: 'suggestPlot',
  name: 'suggestPlot',
  description: 'Generate plot suggestions based on story context',
  inputSchema: {
    type: 'object',
    properties: {
      genre: { type: 'string', description: 'Story genre (玄幻/都市/科幻/悬疑/武侠等)' },
      theme: { type: 'string', description: 'Story theme or message' },
      chapterCount: { type: 'number', description: 'Expected number of chapters' },
      currentChapter: { type: 'number', description: 'Current chapter number' }
    },
    required: ['genre']
  },
  execute: async (args) => {
    const suggestions = [
      '引入一个意外事件打破主角的平静生活',
      '增加一个神秘的反派角色给故事增加张力',
      '设计一个关键的抉择时刻展现角色深度',
      '安排一个情感转折点加深读者共鸣',
      '埋下一个伏笔为后续情节做铺垫'
    ]

    const result = {
      genre: args.genre,
      theme: args.theme || '待定',
      chapterCount: args.chapterCount || 0,
      currentChapter: args.currentChapter || 0,
      suggestions,
      timestamp: new Date().toISOString()
    }

    return {
      success: true,
      output: JSON.stringify(result)
    }
  }
}

/**
 * All local tools available for MCP exposure
 */
export const localTools: LocalToolDefinition[] = [
  queryMaterialsTool,
  generateCharacterTool,
  suggestPlotTool
]

/**
 * Get all local tool definitions
 */
export function getAllLocalTools(): LocalToolDefinition[] {
  return [...localTools]
}

/**
 * Get a local tool by name
 */
export function getLocalTool(name: string): LocalToolDefinition | undefined {
  return localTools.find(t => t.name === name)
}

/**
 * Register all local tools to an MCPServerAdapter
 */
export function registerLocalToolsToAdapter(adapter: {
  registerLocalTool: (tool: LocalToolDefinition) => void
}): void {
  for (const tool of localTools) {
    adapter.registerLocalTool(tool)
  }
}