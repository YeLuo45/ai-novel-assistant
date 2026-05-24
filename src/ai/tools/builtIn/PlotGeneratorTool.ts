/**
 * PlotGeneratorTool — Plot outline generator for creative writing
 * Generates story plots based on genre, theme, and characters
 */

import type { WritingToolV2, ToolInput, ToolOutput, CrystallizedSkill } from '../types'

export interface PlotElement {
  act: number
  title: string
  description: string
  characters?: string[]
}

const GENRE_PLOTS: Record<string, PlotElement[][]> = {
  'romance': [
    [
      { act: 1, title: '相遇', description: '主人公与恋人相遇，通常在意想不到的场合' },
      { act: 1, title: '冲突', description: '身份、地位或观念的差异造成冲突' },
      { act: 2, title: '接近', description: '共同经历让两人渐渐靠近' },
      { act: 2, title: '误会', description: '一场误会差点毁掉感情' },
      { act: 3, title: '表白', description: '一方终于鼓起勇气表白' },
      { act: 3, title: '抉择', description: '现实压力迫使两人做出选择' },
      { act: 3, title: '圆满', description: '克服一切困难，有情人终成眷属' }
    ],
    [
      { act: 1, title: '旧情复燃', description: '前任突然出现，打破平静生活' },
      { act: 2, title: '回忆杀', description: '闪回揭示两人过去的美好时光' },
      { act: 3, title: '破镜重圆', description: '误会解开，重新走到一起' }
    ]
  ],
  'thriller': [
    [
      { act: 1, title: '平常生活', description: '主人公过着看似正常的生活' },
      { act: 1, title: '异常事件', description: '一件小事触发连锁反应' },
      { act: 2, title: '深入调查', description: '主人公开始挖掘真相' },
      { act: 2, title: '步步逼近', description: '危险逐渐向主人公逼近' },
      { act: 2, title: '惊人发现', description: '真相大白，但比想象中更可怕' },
      { act: 3, title: '绝地反击', description: '主人公设计反击' },
      { act: 3, title: '结局', description: '正义战胜邪恶，但代价惨重' }
    ]
  ],
  'fantasy': [
    [
      { act: 1, title: '平凡世界', description: '主人公生活在普通世界' },
      { act: 1, title: '召唤', description: '被选中或意外进入魔法世界' },
      { act: 2, title: '成长', description: '学习魔法，结识伙伴' },
      { act: 2, title: '危机', description: '黑暗势力崛起，世界危在旦夕' },
      { act: 3, title: '冒险', description: '踏上拯救世界的旅程' },
      { act: 3, title: '最终战', description: '与BOSS的决战' },
      { act: 3, title: '回归', description: '使命完成，但世界已经改变' }
    ]
  ]
}

function generatePlot(genre: string, theme: string): PlotElement[] {
  const genreKey = genre.toLowerCase()
  const plots = GENRE_PLOTS[genreKey] || GENRE_PLOTS['romance']
  const basePlot = plots[Math.floor(Math.random() * plots.length)]
  
  // Add theme variations
  return basePlot.map(element => ({
    ...element,
    description: element.description.replace(/世界|危机|决战/g, () =>
      Math.random() > 0.5 ? theme : element.description
    )
  }))
}

export const PlotGeneratorTool: WritingToolV2 = {
  id: 'plot-generator',
  name: '情节生成器',
  category: 'generator',
  description: '根据题材和主题生成故事大纲',
  icon: '📝',
  version: '2.0.0',
  isMcp: false,
  isCustom: false,

  execute: async (input: ToolInput): Promise<ToolOutput> => {
    const { text, context } = input
    const parts = text.split(/[,，]/).map(p => p.trim())
    const genre = context?.genre as string || 'romance'
    const theme = parts[0] || '冒险'

    const plot = generatePlot(genre, theme)

    const output = [`【${genre}类故事大纲 — 主题: ${theme}】`, '']
    let currentAct = 0
    for (const element of plot) {
      if (element.act !== currentAct) {
        currentAct = element.act
        output.push(`\n=== 第${currentAct}幕 ===`)
      }
      output.push(`${element.title}: ${element.description}`)
    }

    return {
      success: true,
      output: output.join('\n'),
      metadata: { genre, theme, plotLength: plot.length }
    }
  },

  validateInput: (input: ToolInput): { valid: boolean; errors?: string[] } => {
    const errors: string[] = []
    if (!input.text || input.text.trim().length === 0) {
      errors.push('请输入故事主题')
    }
    if (input.text && input.text.length > 100) {
      errors.push('主题描述不能超过100字')
    }
    return { valid: errors.length === 0, errors }
  },

  crystallize: async (): Promise<CrystallizedSkill> => {
    return {
      id: `skill_${Date.now()}`,
      name: 'PlotGenerate',
      toolId: 'plot-generator',
      pattern: '生成.*大纲|.*情节|.*故事线|.*剧情',
      successCount: 1,
      avgRating: 5.0,
      lastUsed: new Date().toISOString(),
      code: `async function generatePlot(genre, theme) {
  return await executeTool('plot-generator', { text: theme, context: { genre } })
}`,
      createdAt: Date.now()
    }
  }
}

export default PlotGeneratorTool