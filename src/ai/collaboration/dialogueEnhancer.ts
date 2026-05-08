import type { DialogueScene, DialogueTurn, EmotionTag, DialogueMasterOutput } from './types'

/**
 * 增强对话输出，添加情绪标记和潜台词
 */
export function enhanceDialogue(
  rawDialogue: string,
  characters: string[]
): DialogueMasterOutput {
  // 简单实现 - 实际应该用 LLM 解析
  const turns: DialogueTurn[] = rawDialogue
    .split('\n')
    .filter(line => line.trim())
    .map((line, idx) => {
      // 简单解析 - 假设格式为 "角色: 对话"
      const [characterId, ...contentParts] = line.split(':')
      const character = characterId?.trim() || characters[idx % characters.length]
      const content = contentParts.join(':').trim()
      
      return {
        characterId: character,
        content,
        emotionTag: 'neutral' as EmotionTag,  // 简化
        subtext: generateSubtext(content),  // 简化
        action: undefined
      }
    })

  return {
    scenes: [{
      setting: '（未指定场景）',
      turns,
      atmosphere: '（未指定氛围）'
    }],
    characterEmotionCurves: {}
  }
}

function generateSubtext(content: string): string | undefined {
  // 简化实现 - 实际应该用 LLM 分析
  if (content.includes('...') || content.includes('（沉默）')) {
    return '沉默中蕴含深意'
  }
  if (content.includes('！') || content.includes('！')) {
    return '语气强硬但可能有隐情'
  }
  return undefined
}
