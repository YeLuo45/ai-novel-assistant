/**
 * 章节情节自动生成模块
 * - 根据大纲节点生成章节内容
 * - 支持3个版本的并行生成
 * - 读取前后章节上下文
 */

import { callLLM } from './llm'
import type { OutlineNode } from '../db'

export type PlotStyle = 'detailed' | 'concise' | 'climax' | 'plains'

export interface GenerationOptions {
  outlineNode: OutlineNode
  contextBefore?: string
  contextAfter?: string
  style: PlotStyle
  targetWordCount?: number
  model?: string
}

export interface GeneratedChapter {
  version: number
  content: string
  title: string
}

/**
 * 根据情节风格获取写作指示
 */
function getStyleInstruction(style: PlotStyle): string {
  switch (style) {
    case 'detailed':
      return `【风格要求】详细描写，包括人物心理、场景氛围、动作细节。字数较多，叙事细腻。`
    case 'concise':
      return `【风格要求】简洁有力，节奏明快，减少冗余描写，直入主题。`
    case 'climax':
      return `【风格要求】高潮迭起，冲突激烈，悬念丛生。注重情感张力和戏剧性转折。`
    case 'plains':
      return `【风格要求】平铺直叙，平稳推进。注重情节的连贯性和逻辑性。`
    default:
      return `【风格要求】根据情节自然展开。`
  }
}

/**
 * 生成单个版本
 */
async function generateVersion(
  options: GenerationOptions,
  versionNum: number
): Promise<GeneratedChapter> {
  const { outlineNode, contextBefore, contextAfter, style, targetWordCount, model = 'gpt-4o-mini' } = options

  const styleInstruction = getStyleInstruction(style)
  const wordTarget = targetWordCount ? `目标字数：约${targetWordCount}字。` : '字数适中（800-1500字）。'

  const systemPrompt = `你是一位专业的小说作家，擅长根据大纲创作连贯、生动的章节内容。
  
核心能力：
1. 严格遵循大纲设定的情节走向
2. 保持与前后文的自然衔接
3. 刻画细腻的人物心理
4. 营造恰当的场景氛围
5. 对话自然，符合人物性格

写作风格：
- 描写细腻但不啰嗦
- 对话符合人物性格
- 注重情感和氛围营造
- 用词精准，避免陈词滥调

你是中文写作专家，请用优美流畅的中文回复。`

  const userPrompt = `请根据以下大纲信息创作章节内容。

【章节大纲】
标题：${outlineNode.title}
类型：${outlineNode.type}
简述：${outlineNode.summary || '（无）'}
详细内容：${outlineNode.content || '（无详细内容）'}

${styleInstruction}
${wordTarget}

【前文衔接】
${contextBefore ? `前文结尾：\n${contextBefore}\n\n` : '（无前文）'}

【后文衔接】
${contextAfter ? `后文开头：\n${contextAfter}\n\n` : '（无后文）'}

请创作章节内容，确保：
1. 自然衔接前后文
2. 内容丰富生动
3. 符合大纲设定

版本${versionNum}：` // Temperature varies by version

  const temperature = versionNum === 1 ? 0.6 : versionNum === 2 ? 0.7 : 0.8

  try {
    const content = await callLLM({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature
    }, 'chapter-generator')

    return {
      version: versionNum,
      content: content.trim(),
      title: outlineNode.title
    }
  } catch (error) {
    console.error(`Error generating version ${versionNum}:`, error)
    throw error
  }
}

/**
 * 从大纲生成章节内容
 */
export async function generateChapterFromOutline(
  options: GenerationOptions
): Promise<GeneratedChapter[]> {
  const { style, targetWordCount } = options

  // Generate 3 versions in parallel with different temperatures
  const results = await Promise.all([
    generateVersion(options, 1),
    generateVersion(options, 2),
    generateVersion(options, 3)
  ])

  return results
}

/**
 * 根据已有章节内容，生成后续章节的大纲建议
 */
export async function suggestNextPlotPoints(
  currentChapter: OutlineNode,
  projectContext: string,
  count: number = 3
): Promise<string[]> {
  const model = 'gpt-4o-mini'

  const systemPrompt = `你是一位专业的小说大纲策划，擅长设计扣人心弦的情节发展。`

  const userPrompt = `基于以下章节内容，建议${count}个可能的剧情发展方向。

当前章节：
标题：${currentChapter.title}
内容：${currentChapter.content || currentChapter.summary || '（无内容）'}

项目背景/已设定：
${projectContext}

请给出${count}个不同方向的剧情发展建议，每个建议用1-2句话描述。`

  try {
    const response = await callLLM({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    }, 'chapter-generator')

    return response.split('\n').filter(line => line.trim())
  } catch (error) {
    console.error('Error suggesting plot points:', error)
    return []
  }
}
