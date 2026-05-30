/**
 * CharacterRelationTool — Character relationship generator
 * Creates relationship maps between characters
 */

import type { WritingToolV2, ToolInput, ToolOutput, CrystallizedSkill } from '../types'

export interface CharacterRelation {
  from: string
  to: string
  relationType: string
  description: string
}

const RELATION_TYPES = [
  { type: 'family', label: '家人', relations: ['父亲', '母亲', '子女', '配偶', '兄弟姐妹', '祖孙'] },
  { type: 'friend', label: '朋友', relations: ['挚友', '普通朋友', '青梅竹马', '闺蜜', '损友'] },
  { type: 'love', label: '爱情', relations: ['恋人', '暗恋', '前任', '单相思', '情敌'] },
  { type: 'work', label: '工作', relations: ['上司', '下属', '同事', '竞争对手', '合作伙伴', '客户'] },
  { type: 'social', label: '社交', relations: ['邻居', '师生', '同学', '网友', '粉丝'] },
  { type: 'conflict', label: '冲突', relations: ['仇人', '敌人', '背叛者', '受害者', '加害者'] }
]

function getRandomRelation(from: string, to: string): CharacterRelation {
  const category = RELATION_TYPES[Math.floor(Math.random() * RELATION_TYPES.length)]
  const relation = category.relations[Math.floor(Math.random() * category.relations.length)]
  
  const descriptions: Record<string, string[]> = {
    '父亲': [`${from}是${to}的父亲，沉默寡言但内心关爱`, `${from}对${to}期望很高，常以严厉著称`],
    '母亲': [`${from}是${to}的母亲，温柔细腻但也有原则`, `${from}独自抚养${to}长大，性格坚强`],
    '子女': [`${from}是${to}的孩子，正处于青春叛逆期`, `${from}是${to}的骄傲，也是${to}的软肋`],
    '挚友': [`${from}是${to}最信任的朋友，曾一起经历过生死`, `${from}和${to}是发小，彼此了解对方的一切`],
    '恋人': [`${from}与${to}是恋人关系，感情正在升温`, `${from}暗恋${to}已久，但从未表白`],
    '上司': [`${from}是${to}的上司，赏识${to}的能力`, `${from}对${to}既器重又防备`],
    '竞争对手': [`${from}视${to}为竞争对手，处处针对`, `${from}与${to}在商业战场上激烈角逐`],
    '仇人': [`${from}与${to}有深仇大恨，不共戴天`, `${from}一直在寻找机会向${to}复仇`]
  }

  const key = Object.keys(descriptions).find(k => relation.includes(k)) || relation
  const descList = descriptions[key] || [`${from}与${to}是${relation}`]

  return {
    from,
    to,
    relationType: `${category.label}-${relation}`,
    description: descList[Math.floor(Math.random() * descList.length)]
  }
}

export const CharacterRelationTool: WritingToolV2 = {
  id: 'character-relation',
  name: '人物关系生成器',
  category: 'generator',
  description: '根据角色名生成人物关系和描述',
  icon: '👥',
  version: '2.0.0',
  isMcp: false,
  isCustom: false,

  execute: async (input: ToolInput): Promise<ToolOutput> => {
    const { text } = input
    const names = text.split(/[,，、]/).map(n => n.trim()).filter(n => n.length > 0)

    if (names.length < 2) {
      return {
        success: false,
        output: '',
        error: '请输入至少两个角色名，用逗号分隔'
      }
    }

    const relations: CharacterRelation[] = []
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        relations.push(getRandomRelation(names[i], names[j]))
      }
    }

    const output = ['【人物关系图谱】', '']
    for (const rel of relations) {
      output.push(`• ${rel.from} → ${rel.to}`)
      output.push(`  关系: ${rel.relationType}`)
      output.push(`  描述: ${rel.description}`)
      output.push('')
    }

    return {
      success: true,
      output: output.join('\n'),
      metadata: { relations }
    }
  },

  validateInput: (input: ToolInput): { valid: boolean; errors?: string[] } => {
    const errors: string[] = []
    if (!input.text || input.text.trim().length === 0) {
      errors.push('角色名不能为空')
    }
    const names = input.text?.split(/[,，、]/) || []
    if (names.length < 2) {
      errors.push('至少需要两个角色')
    }
    if (names.length > 20) {
      errors.push('角色数量不能超过20个')
    }
    return { valid: errors.length === 0, errors }
  },

  crystallize: async (): Promise<CrystallizedSkill> => {
    return {
      id: `skill_${Date.now()}`,
      name: 'CharacterRelationGenerate',
      toolId: 'character-relation',
      pattern: '.*人物关系|.*角色.*生成|.*关系图谱',
      successCount: 1,
      avgRating: 5.0,
      lastUsed: new Date().toISOString(),
      code: `async function generateRelations(characters) {
  return await executeTool('character-relation', { text: characters.join(',') })
}`,
      createdAt: Date.now()
    }
  }
}

export default CharacterRelationTool