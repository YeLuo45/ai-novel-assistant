/**
 * 大纲自动续写模块
 * - 基于当前章节内容分析剧情走向
 * - 生成3个不同版本的后续章节大纲
 * - 支持批量生成多个后续章节
 */

import { callLLM } from './llm'
import type { OutlineNode } from '../db'

export interface ContinuationOptions {
  currentChapter: OutlineNode
  existingOutline: OutlineNode[]
  count: number
  model?: string
}

export interface OutlineVersion {
  version: number
  chapters: OutlineChapter[]
}

export interface OutlineChapter {
  title: string
  summary: string
  content: string
  type: 'chapter' | 'section' | 'scene'
}

/**
 * 分析当前章节的剧情走向
 */
function analyzePlotDirection(chapter: OutlineNode, precedingChapters: OutlineNode[]): string {
  const precedingContent = precedingChapters
    .slice(-3)
    .map(c => `【${c.title}】${c.summary || c.content || '（无内容）'}`)
    .join('\n\n')

  return `
当前章节：${chapter.title}
${chapter.summary ? `简述：${chapter.summary}` : ''}
${chapter.content ? `内容：${chapter.content}` : ''}

前文概要（最近3章）：
${precedingContent || '（无前文）'}
`
}

/**
 * 生成单个版本的续写
 */
async function generateVersion(
  options: ContinuationOptions,
  versionNum: number
): Promise<OutlineVersion> {
  const { currentChapter, existingOutline, count, model = 'gpt-4o-mini' } = options

  // Get preceding chapters for context
  const currentIndex = existingOutline.findIndex(n => n.id === currentChapter.id)
  const precedingChapters = currentIndex >= 0 
    ? existingOutline.slice(0, currentIndex)
    : []

  const plotAnalysis = analyzePlotDirection(currentChapter, precedingChapters)
  
  // Get project context from all nodes
  const projectContext = existingOutline
    .slice(0, currentIndex >= 0 ? currentIndex : existingOutline.length)
    .map(n => `【${n.title}】${n.summary || ''}`)
    .join('\n')

  const systemPrompt = `你是一位专业的小说大纲策划师，擅长设计扣人心弦的剧情发展。

核心能力：
1. 分析当前章节的剧情走向
2. 设计合理的后续情节
3. 保持故事连贯性和逻辑性
4. 刻画人物心理变化
5. 制造情节起伏和张力

写作风格：
- 情节要有起承转合
- 每章要有明确的目标和冲突
- 人物行为要符合性格设定
- 埋下伏笔，制造悬念

你用中文思考和回复。`

  const userPrompt = `请为以下小说设计${count}个后续章节的大纲。

${plotAnalysis}

项目已有大纲（按顺序）：
${projectContext || '（暂无其他大纲）'}

请设计${count}个不同走向的后续章节大纲，版本${versionNum}：
- 每个章节包含：标题、简述、详细内容
- 章节类型使用：chapter（章）、section（节）、scene（场景）
- 确保与前文衔接自然
- 版本${versionNum}的特点：${versionNum === 1 ? '稳妥推进，稳扎稳打' : versionNum === 2 ? '冲突激烈，高潮迭起' : '悬念丛生，出人意料'}

请按以下JSON格式返回：
{
  "version": ${versionNum},
  "chapters": [
    {
      "title": "章节标题",
      "summary": "章节简述（1-2句话）",
      "content": "章节详细内容（3-5句话描述关键情节点）",
      "type": "chapter"
    }
  ]
}`

  const temperature = versionNum === 1 ? 0.6 : versionNum === 2 ? 0.7 : 0.8

  try {
    const response = await callLLM({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature
    }, 'outline-continuator')

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        version: versionNum,
        chapters: parsed.chapters || []
      }
    }

    // Fallback: try to parse line by line
    return parseFallbackResponse(response, versionNum)
  } catch (error) {
    console.error(`Error generating version ${versionNum}:`, error)
    throw error
  }
}

/**
 * 解析非JSON格式的响应
 */
function parseFallbackResponse(response: string, versionNum: number): OutlineVersion {
  const lines = response.split('\n').filter(line => line.trim())
  const chapters: OutlineChapter[] = []
  
  let currentChapter: Partial<OutlineChapter> = {}
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('【') && trimmed.includes('】')) {
      if (currentChapter.title) {
        chapters.push(currentChapter as OutlineChapter)
      }
      currentChapter = {
        title: trimmed.replace(/【|】/g, ''),
        type: 'chapter'
      }
    } else if (trimmed.startsWith('简述：') || trimmed.startsWith('摘要：')) {
      currentChapter.summary = trimmed.replace(/^(简述|摘要)：/, '')
    } else if (trimmed.startsWith('内容：') || trimmed.startsWith('详情：')) {
      currentChapter.content = trimmed.replace(/^(内容|详情)：/, '')
    }
  }
  
  if (currentChapter.title) {
    chapters.push(currentChapter as OutlineChapter)
  }

  return {
    version: versionNum,
    chapters: chapters.length > 0 ? chapters : [{
      title: `第${versionNum}版大纲`,
      summary: '（生成失败，请重试）',
      content: response,
      type: 'chapter'
    }]
  }
}

/**
 * 批量生成后续章节大纲
 */
export async function continueOutline(
  options: ContinuationOptions
): Promise<OutlineVersion[]> {
  const { count } = options

  // Generate 3 versions in parallel with different temperatures
  const results = await Promise.all([
    generateVersion(options, 1),
    generateVersion(options, 2),
    generateVersion(options, 3)
  ])

  return results
}

/**
 * 根据已有大纲，智能推荐下一个章节的位置和类型
 */
export async function suggestNextChapter(
  currentChapter: OutlineNode,
  existingOutline: OutlineNode[],
  model?: string
): Promise<{ type: 'chapter' | 'section' | 'scene'; title: string; summary: string }> {
  const response = await callLLM({
    model: model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: '你是一位专业的小说大纲策划师，擅长设计合理的章节结构。' },
      { role: 'user', content: `基于以下章节内容，推荐下一个章节的结构：

当前章节：${currentChapter.title}
类型：${currentChapter.type}
${currentChapter.summary ? `简述：${currentChapter.summary}` : ''}

已有大纲中的位置信息：
- 章节总数：${existingOutline.length}
- 当前章节索引：${existingOutline.findIndex(n => n.id === currentChapter.id)}

请推荐下一个章节的类型（chapter/section/scene）和标题。

请按以下JSON格式返回：
{
  "type": "chapter",
  "title": "推荐标题",
  "summary": "1-2句话的简述"
}` },
      { role: 'assistant', content: '{' }
    ],
    temperature: 0.7
  }, 'outline-continuator')

  try {
    const jsonMatch = ('{' + response).match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse suggestion:', e)
  }

  return {
    type: 'chapter',
    title: '下一章节',
    summary: '继续故事发展'
  }
}
