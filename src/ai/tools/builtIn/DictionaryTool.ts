/**
 * DictionaryTool — Chinese dictionary lookup tool
 * Queries word definitions, pinyin, and usage examples
 */

import type { WritingToolV2, ToolInput, ToolOutput, CrystallizedSkill } from '../types'

interface DictionaryResult {
  word: string
  pinyin?: string
  definition: string
  examples?: string[]
}

const COMMON_DICTIONARY: Record<string, DictionaryResult> = {
  '守株待兔': {
    word: '守株待兔',
    pinyin: 'shǒu zhū dài tù',
    definition: '比喻死守狭隘经验，不知变通，或抱着侥幸心理妄想不劳而获。',
    examples: ['不能守株待兔，要主动寻找机会。', '守株待兔式的成功是不现实的。']
  },
  '亡羊补牢': {
    word: '亡羊补牢',
    pinyin: 'wáng yáng bǔ láo',
    definition: '比喻出了问题后想办法补救，可以防止继续受损失。',
    examples: ['亡羊补牢，犹未晚矣。', '这次失误要及时亡羊补牢。']
  },
  '画蛇添足': {
    word: '画蛇添足',
    pinyin: 'huà shé tiān zú',
    definition: '比喻做了多余的事，反而把事情弄坏。',
    examples: ['这样修改简直是画蛇添足。', '不要画蛇添足，保持原样就好。']
  },
  '刻舟求剑': {
    word: '刻舟求剑',
    pinyin: 'kè zhōu qiú jiàn',
    definition: '比喻拘泥成例，不知道跟着情势的变化而改变办法。',
    examples: ['时代变了，不能刻舟求剑。', '这种做法无异于刻舟求剑。']
  },
  '掩耳盗铃': {
    word: '掩耳盗铃',
    pinyin: 'yǎn ěr dào líng',
    definition: '比喻自己欺骗自己，明明掩盖不住的事情偏要想法子掩盖。',
    examples: ['掩耳盗铃的行为最终会暴露。', '想要掩耳盗铃是不可能的。']
  }
}

/**
 * Look up a Chinese word in the dictionary
 */
async function lookupWord(word: string): Promise<DictionaryResult | null> {
  // Check local dictionary first
  if (COMMON_DICTIONARY[word]) {
    return COMMON_DICTIONARY[word]
  }

  // Fall back to online API
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/zh/${encodeURIComponent(word)}`
    )
    if (!response.ok) return null

    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0]
      const meaning = entry.meanings?.[0]
      const definition = meaning?.definitions?.[0]?.definition || ''
      const examples = meaning?.definitions?.[0]?.exampleSentences || []

      return {
        word,
        pinyin: entry.phonetic || '',
        definition,
        examples: Array.isArray(examples) ? examples : []
      }
    }
    return null
  } catch {
    return null
  }
}

export const DictionaryTool: WritingToolV2 = {
  id: 'dictionary',
  name: '字典查询',
  category: 'dictionary',
  description: '查询汉字或词语的定义、拼音和例句',
  icon: '📖',
  version: '2.0.0',
  isMcp: false,
  isCustom: false,

  execute: async (input: ToolInput): Promise<ToolOutput> => {
    const { text } = input
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        output: '',
        error: '请输入要查询的词语'
      }
    }

    const result = await lookupWord(text.trim())

    if (!result) {
      return {
        success: true,
        output: `未找到词语 "${text}" 的解释`,
        metadata: { word: text, found: false }
      }
    }

    const lines = [`【${result.word}】`]
    if (result.pinyin) {
      lines.push(`拼音: ${result.pinyin}`)
    }
    lines.push(`解释: ${result.definition}`)
    if (result.examples && result.examples.length > 0) {
      lines.push('例句:')
      result.examples.forEach((ex, i) => lines.push(`  ${i + 1}. ${ex}`))
    }

    return {
      success: true,
      output: lines.join('\n'),
      metadata: { word: result.word, found: true }
    }
  },

  validateInput: (input: ToolInput): { valid: boolean; errors?: string[] } => {
    const errors: string[] = []
    if (!input.text || input.text.trim().length === 0) {
      errors.push('查询词不能为空')
    }
    if (input.text && input.text.length > 50) {
      errors.push('查询词不能超过50个字符')
    }
    return { valid: errors.length === 0, errors }
  },

  crystallize: async (): Promise<CrystallizedSkill> => {
    return {
      id: `skill_${Date.now()}`,
      name: 'DictionaryLookup',
      toolId: 'dictionary',
      pattern: '查询.*含义|.*是什么意思|.*解释',
      successCount: 1,
      avgRating: 5.0,
      lastUsed: new Date().toISOString(),
      code: `async function dictionaryLookup(word) {
  // Implementation stored in Skill Library
  return await executeTool('dictionary', { text: word })
}`,
      createdAt: Date.now()
    }
  }
}

export default DictionaryTool