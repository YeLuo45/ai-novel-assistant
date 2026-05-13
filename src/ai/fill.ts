/**
 * V24: AI辅助填充模块
 * 包含世界观生成和时间线事件提取功能
 */

import { callLLM } from './llm'
import type { Project, Character, Storyline, ChapterPlan, TimelineEvent } from '../db'

/**
 * 生成世界观描述
 * @param project 项目信息
 * @param characters 角色列表
 * @returns 世界观描述文本
 */
export async function generateWorldbuilding(
  project: Project,
  characters: Character[]
): Promise<string> {
  const prompt = `根据以下信息，为小说作品生成一段500-800字的世界观描述。

作品标题：${project.title}
题材类型：${project.genre || '未知'}
背景设定：${project.background || '现代都市'}
核心卖点：${project.coreSellingPoint || '精彩故事'}

角色设定：
${characters.map(c => `【${c.name}】${c.role === 'protagonist' ? '主角' : c.role === 'supporting' ? '配角' : '路人'} - ${c.personalityTraits.join('、')} - 目标：${c.goal}`).join('\n')}

请生成包含以下方面的世界观描述：
1. 时代背景与社会环境
2. 地理环境与重要场景
3. 世界规则与社会结构
4. 故事氛围与特色

要求：文字优美有画面感，能激发创作灵感。`

  try {
    const response = await callLLM({
      model: 'minimax',
      messages: [
        { role: 'system', content: '你是一个专业的小说世界观设定专家，擅长创作独特而引人入胜的世界观设定，文字优美有画面感。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 1500
    }, 'worldbuilding_generator')
    
    return response.trim()
  } catch (error) {
    console.error('生成世界观失败:', error)
    return `这是一个发生在${project.background || '现代'}的${project.genre || '都市'}故事。在这个世界里，命运的齿轮开始转动...`
  }
}

/**
 * 从故事线和章节生成时间线事件
 * @param project 项目信息
 * @param storylines 故事线列表
 * @param chapters 章节列表
 * @returns 时间线事件数组（不包含projectId，调用者需要添加）
 */
export async function generateTimelineEvents(
  project: Project,
  storylines: Storyline[],
  chapters: ChapterPlan[]
): Promise<Omit<TimelineEvent, 'projectId'>[]> {
  // 提取主要故事线结构
  const mainStoryline = storylines.find(s => s.name.includes('主线') || s.name.includes('主线'))
  
  const prompt = `根据以下故事线和章节信息，提取8-12个关键时间节点事件。

作品标题：${project.title}
题材：${project.genre || '未知'}

章节规划：
${chapters.map(c => `第${c.index}章《${c.title}》：${c.summary}`).join('\n')}

故事线：
${storylines.map(s => `【${s.name}】`).join(' ')}

请以JSON格式返回时间线事件：
{
  "events": [
    {
      "title": "事件标题（简洁有力）",
      "description": "事件描述（1-2句话）",
      "order": 1,
      "chapterIds": [1, 2]
    }
  ]
}

要求：
- 选择对故事发展有重大影响的关键事件
- 每个事件关联相关的章节
- 事件之间有逻辑顺序
- 体现故事的起承转合`

  try {
    const response = await callLLM({
      model: 'minimax',
      messages: [
        { role: 'system', content: '你是一个专业的小说策划专家，擅长提取故事关键事件，构建合理的时间线。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 2000
    }, 'timeline_generator')
    
    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return data.events.map((e: any, idx: number) => ({
        title: e.title,
        description: e.description || '',
        order: e.order ?? idx,
        chapterIds: e.chapterIds || []
      }))
    }
    
    // 如果解析失败，返回默认事件
    return generateDefaultTimelineEvents(chapters)
  } catch (error) {
    console.error('生成时间线事件失败:', error)
    return generateDefaultTimelineEvents(chapters)
  }
}

/**
 * 生成默认时间线事件（当AI生成失败时）
 */
function generateDefaultTimelineEvents(chapters: ChapterPlan[]): Omit<TimelineEvent, 'projectId'>[] {
  const events: Omit<TimelineEvent, 'projectId'>[] = []
  
  // 从前中后各取章节生成事件
  const total = chapters.length
  const checkpoints = [0, Math.floor(total / 3), Math.floor(total * 2 / 3), total - 1]
  
  checkpoints.forEach((chIdx, order) => {
    if (chapters[chIdx]) {
      events.push({
        title: chapters[chIdx].title,
        description: chapters[chIdx].summary,
        order,
        chapterIds: [chapters[chIdx].index]
      })
    }
  })
  
  return events
}

/**
 * 续写章节内容
 * @param chapterSummary 当前章节摘要
 * @param previousChaptersContent 前几章正文内容（限制800字）
 * @param writingStyle 写作风格要求
 * @returns 续写内容
 */
export async function continueChapter(
  chapterSummary: string,
  previousChaptersContent: string,
  writingStyle?: string
): Promise<string> {
  const prompt = `基于以下信息，续写小说章节内容。

当前章节摘要：${chapterSummary}

前文内容（限制800字）：
${previousChaptersContent.slice(0, 800)}

${writingStyle ? `写作风格要求：${writingStyle}` : ''}

请续写800-1500字的内容，要求：
1. 承接前文，逻辑连贯
2. 符合章节摘要设定
3. 人物性格一致
4. 情节推进自然

直接输出续写内容，不要额外的解释。`

  try {
    const response = await callLLM({
      model: 'minimax',
      messages: [
        { role: 'system', content: '你是一个专业的小说作家，擅长续写故事，文笔流畅，情节生动。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      maxTokens: 2500
    }, 'chapter_continuation')
    
    return response.trim()
  } catch (error) {
    console.error('章节续写失败:', error)
    return ''
  }
}
