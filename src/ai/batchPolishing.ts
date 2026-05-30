/**
 * 批量润色模块
 * - 逐章节处理润色请求
 * - 支持多种润色选项
 * - 返回每个章节的diff
 */

import { callLLM } from './llm'
import { db, type OutlineNode } from '../db'

export interface PolishingOptions {
  tone?: 'formal' | 'casual' | 'literary' | 'vivid'
  dialogueStyle?: 'natural' | 'classical' | 'modern' | 'poetic'
  fixErrors?: boolean
  sentenceLength?: 'short' | 'medium' | 'long' | 'balanced'
}

export interface PolishingResult {
  chapterId: number
  originalContent: string
  polishedContent: string
  diff: PolishingDiff[]
  success: boolean
  error?: string
}

export interface PolishingDiff {
  type: 'replace' | 'insert' | 'delete'
  originalText?: string
  newText?: string
  reason?: string
  position?: number
}

/**
 * 生成润色指令
 */
function buildPolishingPrompt(
  content: string,
  options: PolishingOptions
): string {
  const instructions: string[] = []

  if (options.tone) {
    switch (options.tone) {
      case 'formal':
        instructions.push('使用正式、庄重的语调')
        break
      case 'casual':
        instructions.push('使用轻松、口语化的语调')
        break
      case 'literary':
        instructions.push('使用文雅、富有文学性的语调')
        break
      case 'vivid':
        instructions.push('使用生动、形象的表达方式')
        break
    }
  }

  if (options.dialogueStyle) {
    switch (options.dialogueStyle) {
      case 'natural':
        instructions.push('对话自然流畅，符合日常说话习惯')
        break
      case 'classical':
        instructions.push('对话带有古典韵味，文言结合')
        break
      case 'modern':
        instructions.push('对话现代简洁，贴近当代生活')
        break
      case 'poetic':
        instructions.push('对话富有诗意，含蓄蕴藉')
        break
    }
  }

  if (options.sentenceLength) {
    switch (options.sentenceLength) {
      case 'short':
        instructions.push('使用短句，节奏明快')
        break
      case 'medium':
        instructions.push('句式中等长度为主')
        break
      case 'long':
        instructions.push('使用长句，描写细腻')
        break
      case 'balanced':
        instructions.push('长句短句交替，节奏有变化')
        break
    }
  }

  if (options.fixErrors) {
    instructions.push('修正错别字、语病、标点错误')
  }

  const instructionText = instructions.length > 0 
    ? instructions.join('；') + '。'
    : '整体提升文字质量'

  return `请对以下小说章节进行润色。

【润色要求】
${instructionText}

【原文】
${content}

【润色后的版本】
请直接输出润色后的完整内容，不要添加任何说明。`
}

/**
 * 计算简单的diff
 */
function computeDiff(original: string, polished: string): PolishingDiff[] {
  const diffs: PolishingDiff[] = []
  
  if (original === polished) {
    return []
  }

  // 检查是否整体替换
  if (original.trim() !== polished.trim()) {
    diffs.push({
      type: 'replace',
      originalText: original.length > 100 ? original.slice(0, 100) + '...' : original,
      newText: polished.length > 100 ? polished.slice(0, 100) + '...' : polished,
      reason: '内容修改'
    })
  }

  return diffs
}

/**
 * 润色单个章节
 */
async function polishChapter(
  chapter: OutlineNode,
  options: PolishingOptions,
  model: string = 'gpt-4o-mini'
): Promise<PolishingResult> {
  if (!chapter.content) {
    return {
      chapterId: chapter.id!,
      originalContent: '',
      polishedContent: '',
      diff: [],
      success: false,
      error: '章节无内容'
    }
  }

  const systemPrompt = `你是一位专业的中文写作润色专家，精通各种文学风格和表达方式。
你的任务是提升文字质量，使其更加流畅、生动、富有表现力。

核心原则：
1. 保持原文的核心意思和情感
2. 改善句式结构，使其更加流畅
3. 优化用词，避免陈词滥调
4. 保持角色语言风格的一致性
5. 注意中文章节写作的特殊性

请直接输出润色后的内容，不要添加任何解释或标注。`

  const userPrompt = buildPolishingPrompt(chapter.content, options)

  try {
    const polishedContent = await callLLM({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6
    }, 'batch-polishing')

    const diff = computeDiff(chapter.content, polishedContent)

    return {
      chapterId: chapter.id!,
      originalContent: chapter.content,
      polishedContent: polishedContent.trim(),
      diff,
      success: true
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '润色失败'
    console.error(`Failed to polish chapter ${chapter.id}:`, error)
    return {
      chapterId: chapter.id!,
      originalContent: chapter.content,
      polishedContent: '',
      diff: [],
      success: false,
      error: errorMessage
    }
  }
}

/**
 * 批量润色多个章节
 */
export async function batchPolish(
  chapterIds: number[],
  options: PolishingOptions,
  onProgress?: (completed: number, total: number, chapterId: number) => void
): Promise<PolishingResult[]> {
  const chapters = await db.outlineNodes
    .where('id')
    .anyOf(chapterIds)
    .toArray()

  const results: PolishingResult[] = []
  const total = chapters.length

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    if (chapter.id) {
      onProgress?.(i, total, chapter.id)
      
      const result = await polishChapter(chapter, options)
      results.push(result)
    }
  }

  onProgress?.(total, total, 0)
  return results
}

/**
 * 批量润色整个项目
 */
export async function polishProject(
  projectId: number,
  options: PolishingOptions,
  onProgress?: (completed: number, total: number, chapterId: number) => void
): Promise<PolishingResult[]> {
  const chapters = await db.outlineNodes
    .where('projectId')
    .equals(projectId)
    .filter((n: OutlineNode) => n.type === 'chapter' && !!n.content)
    .toArray()

  const chapterIds = chapters.map(c => c.id!).filter((id: number): id is number => id !== undefined)
  return batchPolish(chapterIds, options, onProgress)
}

/**
 * 快速润色单个章节（不返回diff）
 */
export async function quickPolish(
  content: string,
  options: PolishingOptions
): Promise<string> {
  const systemPrompt = `你是一位专业的中文写作润色专家。请对提供的文字进行润色。
保持原文的核心意思和情感，改善句式和用词。`

  const userPrompt = buildPolishingPrompt(content, options)

  const result = await callLLM({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.6
  }, 'batch-polishing')

  return result.trim()
}

/**
 * 应用润色结果到章节
 */
export async function applyPolishingResult(
  result: PolishingResult
): Promise<void> {
  if (!result.success) {
    throw new Error(result.error || '润色失败，无法应用')
  }

  const chapter = await db.outlineNodes.get(result.chapterId)
  if (!chapter) {
    throw new Error(`Chapter ${result.chapterId} not found`)
  }

  await db.outlineNodes.update(result.chapterId, {
    content: result.polishedContent
  })
}

/**
 * 选择性应用润色（只应用部分修改）
 */
export async function applyPartialPolishing(
  result: PolishingResult,
  acceptedDiffs: number[]
): Promise<void> {
  if (!result.success) {
    throw new Error('润色失败，无法应用')
  }

  if (acceptedDiffs.length === 0) {
    return
  }

  // 实际应用中，这里应该解析diff并选择性合并
  // 现在简化处理：如果接受了任何diff，就用完整润色版本
  if (acceptedDiffs.length > 0) {
    await applyPolishingResult(result)
  }
}
