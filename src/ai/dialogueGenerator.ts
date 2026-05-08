/**
 * 角色对话生成模块
 * - 根据场景和角色生成自然对话
 * - 读取角色素材卡获取性格特点
 * - 支持多种情绪氛围
 * - 生成格式化对话文本
 */

import { callLLM } from './llm'
import type { MaterialCard } from '../db'

export type MoodType = 'tense' | 'relaxed' | 'suspenseful' | 'warm' | 'conflicting'
export type DialogueLength = 'short' | 'medium' | 'long'

export interface DialogueOptions {
  scene: string
  characters: MaterialCard[]
  mood: MoodType
  length: DialogueLength
  model?: string
}

export interface DialogueLine {
  characterName: string
  content: string
  action?: string
}

export interface GeneratedDialogue {
  lines: DialogueLine[]
  sceneDescription?: string
}

/**
 * 根据情绪类型获取氛围描述
 */
function getMoodDescription(mood: MoodType): string {
  switch (mood) {
    case 'tense':
      return '紧张压抑的对话，可能有争吵、质问或对峙'
    case 'relaxed':
      return '轻松愉快的对话，像朋友闲聊或日常互动'
    case 'suspenseful':
      return '悬疑紧张的对话，充满暗示和未说出口的秘密'
    case 'warm':
      return '温情脉脉的对话，展现角色间的感情'
    case 'conflicting':
      return '充满冲突的对话，观点对立，言语交锋激烈'
    default:
      return '根据情节自然展开的对话'
  }
}

/**
 * 根据长度获取字数目标
 */
function getLengthTarget(length: DialogueLength): string {
  switch (length) {
    case 'short':
      return '3-5轮对话，每轮20-50字，总计100-300字'
    case 'medium':
      return '6-10轮对话，每轮30-80字，总计300-800字'
    case 'long':
      return '10-20轮对话，每轮40-100字，总计800-2000字'
    default:
      return '适量长度的对话'
  }
}

/**
 * 构建角色性格描述
 */
function buildCharacterDescriptions(characters: MaterialCard[]): string {
  return characters
    .map(char => {
      const fields = char.fields || {}
      const personality = fields.personality || fields.性格 || fields.人设 || ''
      const background = fields.background || fields.背景 || fields.来历 || ''
      const speakingStyle = fields.speakingStyle || fields.说话风格 || fields.语气 || ''
      
      return `【${char.name}】
${personality ? `性格：${personality}` : ''}
${background ? `背景：${background}` : ''}
${speakingStyle ? `说话风格：${speakingStyle}` : ''}`
    })
    .join('\n\n')
}

/**
 * 生成对话内容
 */
export async function generateDialogue(
  options: DialogueOptions
): Promise<GeneratedDialogue> {
  const { scene, characters, mood, length, model = 'gpt-4o-mini' } = options

  const moodDescription = getMoodDescription(mood)
  const lengthTarget = getLengthTarget(length)
  const characterDescriptions = buildCharacterDescriptions(characters)

  const systemPrompt = `你是一位专业的小说作家，擅长创作生动自然的角色对话。

核心能力：
1. 根据角色性格设计符合人设的台词
2. 对话要有潜台词和言外之意
3. 动作描写配合对话，增强画面感
4. 推进情节发展，不只是闲聊
5. 对话要简洁有力，避免啰嗦
6. 多角色场景：注意角色间的互动和反应
7. 情绪标记：每句台词要有情绪标签（neutral/angry/sad/happy/fearful/sarcastic/surprised/disgusted）
8. 潜台词：关键对话要暗示言外之意

写作风格：
- 对话要像真实说话，有停顿和省略
- 避免过多修饰，简单有力
- 每句台词要有目的性
- 用动作和表情辅助表达情感
- 同一场景中不同角色的反应要符合各自性格

你用中文思考和回复。`

  const userPrompt = `请为以下场景创作一段对话。

【场景】
${scene}

【参与角色】
${characterDescriptions}

【氛围要求】
${moodDescription}

【长度要求】
${lengthTarget}

请按以下JSON格式返回：
{
  "sceneDescription": "场景氛围描写（1-2句话）",
  "lines": [
    {
      "characterName": "角色名",
      "content": "对话内容",
      "action": "动作或表情（可选）"
    }
  ]
}

确保：
1. 对话符合每个角色的性格设定
2. 对话自然流畅，有停顿和省略
3. 动作描写简洁有力
4. 推进情节发展`

  try {
    const response = await callLLM({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.75
    }, 'dialogue-generator')

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        sceneDescription: parsed.sceneDescription || '',
        lines: parsed.lines || []
      }
    }

    // Fallback parsing
    return parseFallbackDialogue(response)
  } catch (error) {
    console.error('Error generating dialogue:', error)
    throw error
  }
}

/**
 * 解析非JSON格式的响应
 */
function parseFallbackDialogue(response: string): GeneratedDialogue {
  const lines: DialogueLine[] = []
  const dialoguePattern = /^([^：：]+)[：:](.+)$/gm
  let match
  
  while ((match = dialoguePattern.exec(response)) !== null) {
    const characterName = match[1].trim()
    const content = match[2].trim()
    
    if (characterName && content) {
      lines.push({
        characterName,
        content
      })
    }
  }

  if (lines.length === 0) {
    // Try to split by lines and assume alternating speakers
    const allLines = response.split('\n').filter(line => line.trim())
    if (allLines.length > 0) {
      return {
        lines: allLines.map(line => ({
          characterName: '角色',
          content: line.trim()
        })),
        sceneDescription: '（自动解析）'
      }
    }
  }

  return {
    lines,
    sceneDescription: '（请手动编辑）'
  }
}

/**
 * 格式化对话为可读文本
 */
export function formatDialogue(dialogue: GeneratedDialogue): string {
  const lines: string[] = []
  
  if (dialogue.sceneDescription) {
    lines.push(`【场景】${dialogue.sceneDescription}`)
    lines.push('')
  }
  
  for (const line of dialogue.lines) {
    if (line.action) {
      lines.push(`*${line.action}*`)
    }
    lines.push(`${line.characterName}：${line.content}`)
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * 根据角色和场景自动推荐情绪氛围
 */
export async function suggestMood(
  scene: string,
  characters: MaterialCard[],
  model?: string
): Promise<MoodType> {
  if (characters.length === 0) {
    return 'relaxed'
  }

  try {
    const characterNames = characters.map(c => c.name).join('、')
    
    const response = await callLLM({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '你是一个情节分析助手，根据场景和角色推荐合适的情绪氛围。' },
        { role: 'user', content: `分析以下场景和角色，推荐最合适的情绪氛围：

场景：${scene}
角色：${characterNames}

可选氛围：tense（紧张）、relaxed（轻松）、suspenseful（悬疑）、warm（温情）、conflicting（冲突）

请只返回一个词：tense、relaxed、suspenseful、warm 或 conflicting。` }
      ],
      temperature: 0.3
    }, 'dialogue-generator')

    const normalized = response.toLowerCase().trim()
    if (normalized.includes('tense')) return 'tense'
    if (normalized.includes('relaxed')) return 'relaxed'
    if (normalized.includes('suspenseful')) return 'suspenseful'
    if (normalized.includes('warm')) return 'warm'
    if (normalized.includes('conflict')) return 'conflicting'
    
    return 'relaxed'
  } catch (error) {
    console.error('Error suggesting mood:', error)
    return 'relaxed'
  }
}
