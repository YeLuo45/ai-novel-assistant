/**
 * SceneDescriptionTool — Scene description generator
 * Generates atmospheric scene descriptions for creative writing
 */

import type { WritingToolV2, ToolInput, ToolOutput, CrystallizedSkill } from '../types'

export interface SceneTemplate {
  timeOfDay: string
  weather: string
  location: string
  atmosphere: string
  sensoryDetails: string[]
}

const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    timeOfDay: '黎明',
    weather: '薄雾',
    location: '古镇小巷',
    atmosphere: '宁静而神秘',
    sensoryDetails: ['青石板路上的露水反着微光', '远处传来雄鸡报晓', '空气中混合着泥土和炊烟的味道']
  },
  {
    timeOfDay: '黄昏',
    weather: '细雨',
    location: '咖啡馆角落',
    atmosphere: '温暖怀旧',
    sensoryDetails: ['窗玻璃上的雨滴模糊了街景', '咖啡机发出低沉的嗡嗡声', '爵士乐从老式留声机中流出']
  },
  {
    timeOfDay: '深夜',
    weather: '暴雨',
    location: '废弃仓库',
    atmosphere: '紧张危险',
    sensoryDetails: ['闪电照亮铁皮屋顶', '雨水从破损的窗户灌入', '远处传来金属碰撞的声响']
  },
  {
    timeOfDay: '清晨',
    weather: '晴朗',
    location: '山顶观景台',
    atmosphere: '开阔壮观',
    sensoryDetails: ['第一缕阳光穿透云层', '山脚下云海翻涌', '清新的空气带着松柏香气']
  },
  {
    timeOfDay: '午后',
    weather: '阴天',
    location: '老旧图书馆',
    atmosphere: '安静沉思',
    sensoryDetails: ['阳光透过彩色玻璃窗洒落', '纸张和墨水的淡淡气息', '远处传来翻书的沙沙声']
  },
  {
    timeOfDay: '夜晚',
    weather: '星光明亮',
    location: '海边沙滩',
    atmosphere: '浪漫神秘',
    sensoryDetails: ['月光在海面铺成银色道路', '海浪有节奏地拍打岸边', '远处渔船灯火闪烁']
  }
]

function generateScene(baseScene?: Partial<SceneTemplate>): SceneTemplate {
  const template = SCENE_TEMPLATES[Math.floor(Math.random() * SCENE_TEMPLATES.length)]
  
  if (!baseScene) return template

  return {
    timeOfDay: baseScene.timeOfDay || template.timeOfDay,
    weather: baseScene.weather || template.weather,
    location: baseScene.location || template.location,
    atmosphere: baseScene.atmosphere || template.atmosphere,
    sensoryDetails: baseScene.sensoryDetails || template.sensoryDetails
  }
}

function formatSceneDescription(scene: SceneTemplate): string {
  const lines = [
    `【场景描写】`,
    `时间: ${scene.timeOfDay}`,
    `天气: ${scene.weather}`,
    `地点: ${scene.location}`,
    `氛围: ${scene.atmosphere}`,
    '',
    '感官细节:'
  ]
  
  scene.sensoryDetails.forEach((detail, i) => {
    lines.push(`  ${i + 1}. ${detail}`)
  })

  // Add generated prose
  lines.push('', '【示范段落】')
  lines.push(`${scene.timeOfDay}时分，${scene.weather}笼罩下的${scene.location}显得格外${scene.atmosphere}。`)
  lines.push(scene.sensoryDetails.slice(0, 2).join('。') + '。')

  return lines.join('\n')
}

export const SceneDescriptionTool: WritingToolV2 = {
  id: 'scene-description',
  name: '场景描写库',
  category: 'creative',
  description: '生成氛围丰富的场景描写，包括时间、天气、地点和感官细节',
  icon: '🎬',
  version: '2.0.0',
  isMcp: false,
  isCustom: false,

  execute: async (input: ToolInput): Promise<ToolOutput> => {
    const { text } = input
    
    // Parse optional scene preferences from text
    const preferences = text ? {
      timeOfDay: text.includes('夜') ? '夜晚' : text.includes('晨') ? '清晨' : undefined,
      weather: text.includes('雨') ? '细雨' : text.includes('晴') ? '晴朗' : undefined,
      location: undefined as string | undefined
    } : {}

    const scene = generateScene(preferences)
    const output = formatSceneDescription(scene)

    return {
      success: true,
      output,
      metadata: { scene }
    }
  },

  validateInput: (input: ToolInput): { valid: boolean; errors?: string[] } => {
    const errors: string[] = []
    if (input.text && input.text.length > 200) {
      errors.push('场景描述不能超过200字')
    }
    return { valid: errors.length === 0, errors }
  },

  crystallize: async (): Promise<CrystallizedSkill> => {
    return {
      id: `skill_${Date.now()}`,
      name: 'SceneDescription',
      toolId: 'scene-description',
      pattern: '.*场景.*描写|.*环境.*描写|.*氛围',
      successCount: 1,
      avgRating: 5.0,
      lastUsed: new Date().toISOString(),
      code: `async function generateScene(preferences) {
  return await executeTool('scene-description', { text: JSON.stringify(preferences) })
}`,
      createdAt: Date.now()
    }
  }
}

export default SceneDescriptionTool