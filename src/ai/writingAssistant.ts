/**
 * 智能写作建议模块
 * - 续写/润色/扩写/缩写
 * - 基于选中内容和上下文生成建议
 * - 支持视角切换（第一人称/第三人称限知/第三人称全知）
 * - 支持角色关系上下文
 */

import { callLLM } from './llm'
import { streamLLM } from './llm'
import type { Observable } from './types'
import type { LLMEvent } from './types'

export type WritingAssistType = 'continue' | 'polish' | 'expand' | 'summarize' | 'dialogue' | 'scene_transition'

export interface WritingAssistOptions {
  type: WritingAssistType
  selectedText: string
  contextBefore: string
  contextAfter: string
  model?: string
  viewpoint?: 'first_person' | 'third_person_limited' | 'third_person_omniscient'
  currentCharacterName?: string
  characterNames?: string[] // 参与对话的角色名列表
}

/**
 * 获取视角对应的写作指示
 */
function getViewpointInstruction(viewpoint?: string, characterName?: string): string {
  switch (viewpoint) {
    case 'first_person':
      return `【视角要求】使用第一人称"我"进行叙述，注重内心独白的运用。主角是${characterName || '未知'}。`
    case 'third_person_limited':
      return `【视角要求】使用第三人称限知视角，跟着${characterName || '主角'}的视角走，只能展示该角色所知的信息。`
    case 'third_person_omniscient':
      return `【视角要求】使用第三人称全知视角，可以描述任何角色的思想和事件。`
    default:
      return `【视角要求】根据上下文自然选择叙事视角。`
  }
}

/**
 * 对话生成指示
 */
function getDialogueInstruction(characterNames?: string[]): string {
  if (!characterNames || characterNames.length === 0) {
    return `请自然地生成对话，符合人物性格和当前情境。`
  }
  const names = characterNames.join('、')
  return `当前场景涉及以下角色：${names}。请生成符合各角色性格的对话，语言自然流畅，符合中文表达习惯。`
}

/**
 * 场景转换指示
 */
function getTransitionInstruction(): string {
  return `这是场景转换。请描写好过渡，可以使用：
- 时间流逝（眨眼间、数日后、随着...）
- 空间转换（推开...的门、穿过...、来到...）
- 视角切换（镜头转向另一边/与此同时/另一边...）
保持叙事连贯性，让读者自然跟随。`
}

/**
 * 获取对应操作的 prompt 模板
 */
function buildPrompt(options: WritingAssistOptions): string {
  const { type, selectedText, contextBefore, contextAfter, viewpoint, currentCharacterName, characterNames } = options

  const viewpointInstruction = getViewpointInstruction(viewpoint, currentCharacterName)

  switch (type) {
    case 'continue':
      return `你是一位专业的小说作家。请根据以下内容继续写作，保持文风、语调和叙事节奏的一致性。

要求：
1. 延续现有情节和人物
2. 保持相同的写作风格
3. 长度适中（300-500字）
4. 不要重复之前的内容
5. ${viewpointInstruction}

前文：
${contextBefore || '(无前文)'}

后文（如有）：
${contextAfter || '(无后文)'}

请继续写作：`

    case 'polish':
      return `你是一位专业的中文写作润色专家。请对以下文字进行润色，使其更加流畅、生动、富有表现力。

要求：
1. 保持原意不变
2. 改善句式结构
3. 优化用词
4. 提升文采
5. ${viewpointInstruction}
${characterNames && characterNames.length > 0 ? `6. 注意对话中的人物性格一致性\n` : ''}

原文：
${selectedText}

润色后的版本：`

    case 'expand':
      return `你是一位专业的小说作家。请对以下内容进行扩写，增加细节描写、场景氛围和情感深度。

要求：
1. 保持原意和核心情节
2. 增加细节描写
3. 丰富场景氛围
4. 适当增加字数（扩写至1.5-2倍）
5. 前文后文衔接自然
6. ${viewpointInstruction}

前文：
${contextBefore || '(无前文)'}

原文：
${selectedText}

后文：
${contextAfter || '(无后文)'}

扩写后的版本：`

    case 'summarize':
      return `你是一位专业的内容编辑。请对以下内容进行缩写，保留核心信息和关键情节。

要求：
1. 保留核心要点
2. 删除冗余描写
3. 语言简洁精炼
4. 缩写至原文的1/3左右
5. 保持叙事连贯性

原文：
${selectedText}

缩写后的版本：`

    case 'dialogue':
      return `你是一位专业的小说作家。请为以下场景创作对话。

要求：
1. ${getDialogueInstruction(characterNames)}
2. 对话要简洁自然，符合中文表达习惯
3. 每句对话不宜过长
4. 用括号标注动作和神态（如：（低声说）、（冷笑）、（眼眶泛红））
5. 可以有话外音或旁白来补充场景

场景上下文：
前文：${contextBefore || '(无前文)'}

场景：${selectedText}

后文：${contextAfter || '(无后文)'}

请生成对话：`

    case 'scene_transition':
      return `你是一位专业的小说作家。请创作场景之间的过渡。

要求：
1. ${getTransitionInstruction()}
2. 过渡自然，不突兀
3. 可以用省略号或过渡句连接
4. 长度适中（50-150字）

前一个场景结尾：
${contextBefore || '(无前文)'}

后一个场景开头：
${contextAfter || '(无后文)'}

请写过渡：`

    default:
      throw new Error(`Unknown writing assist type: ${type}`)
  }
}

const SYSTEM_PROMPT = `你是一位专业的小说创作助手，擅长写作润色、语法纠错、情节扩写缩写、对话创作、场景过渡等工作。

核心能力：
1. 续写：保持文风一致性，自然延续情节
2. 润色：提升文字表现力，保持原意
3. 扩写：增加细节和氛围，丰富描写
4. 缩写：提炼核心，删减冗余
5. 对话创作：塑造人物性格，语言自然
6. 场景过渡：连接场景，保持连贯

写作风格指导：
- 描写细腻但不啰嗦
- 对话符合人物性格
- 视角切换时保持一致性
- 注重情感和氛围营造
- 用词精准，避免陈词滥调

你是中文写作专家，请用优美流畅的中文回复。`

/**
 * 执行写作建议（非流式）
 */
export async function performWritingAssist(
  options: WritingAssistOptions
): Promise<string> {
  const { type, model = 'gpt-4o-mini' } = options
  const prompt = buildPrompt(options)

  const response = await callLLM({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  }, 'writing-assist')

  return response
}

/**
 * 执行写作建议（流式）
 */
export function streamWritingAssist(
  options: WritingAssistOptions,
  onEvent: (event: LLMEvent) => void
): () => void {
  const { type, model = 'gpt-4o-mini' } = options
  const prompt = buildPrompt(options)

  const observable = streamLLM({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  }, 'writing-assist')

  return observable.subscribe(onEvent)
}

/**
 * 生成多个候选版本
 */
export async function generateCandidates(
  options: WritingAssistOptions,
  count: number = 3
): Promise<string[]> {
  const { type, model = 'gpt-4o-mini' } = options
  const prompt = buildPrompt(options)

  // 使用不同的 temperature 生成多样性结果
  const temperatures = [0.6, 0.7, 0.8]

  const promises = Array.from({ length: count }, async (_, i) => {
    const temp = temperatures[i] || 0.7
    try {
      const response = await callLLM({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: temp
      }, 'writing-assist')
      return response
    } catch (error) {
      console.error(`Error generating candidate ${i}:`, error)
      return null
    }
  })

  const results = await Promise.all(promises)
  return results.filter((r): r is string => r !== null)
}
