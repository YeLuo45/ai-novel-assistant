/**
 * JSON 流式解析器
 * 处理 Server-Sent Events 和流式 JSON 响应
 */

import type { LLMEvent, LLMEventType } from './types'

/**
 * SSE 事件解析器
 */
export class SSEParser {
  private buffer: string = ''
  private eventType: string = 'message'

  /**
   * 处理接收到的文本数据块
   */
  parse(chunk: string): LLMEvent[] {
    this.buffer += chunk
    const events: LLMEvent[] = []
    const lines = this.buffer.split('\n')

    // 保留最后不完整的行
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('event:')) {
        this.eventType = line.slice(6).trim()
        continue
      }

      if (line.startsWith('data:')) {
        const data = line.slice(5).trim()
        if (data === '[DONE]') {
          events.push({ type: 'done' })
        } else {
          events.push({
            type: this.mapEventType(this.eventType),
            content: data
          })
        }
      }
    }

    return events
  }

  private mapEventType(eventType: string): LLMEventType {
    switch (eventType) {
      case 'text':
        return 'text'
      case 'action':
        return 'action'
      case 'thinking_start':
        return 'thinking_start'
      case 'thinking_end':
        return 'thinking_end'
      case 'error':
        return 'error'
      default:
        return 'text'
    }
  }

  reset(): void {
    this.buffer = ''
    this.eventType = 'message'
  }
}

/**
 * OpenAI 聊天补全流式解析器
 */
export class OpenAIStreamParser {
  private buffer: string = ''

  parse(chunk: string): LLMEvent[] {
    this.buffer += chunk
    const events: LLMEvent[] = []
    const lines = this.buffer.split('\n')

    this.buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue

      const data = line.slice(5).trim()
      if (data === '[DONE]') {
        events.push({ type: 'done' })
        continue
      }

      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta

        if (delta?.content) {
          events.push({
            type: 'text',
            content: delta.content
          })
        }

        if (parsed.choices?.[0]?.finish_reason === 'stop') {
          events.push({ type: 'done' })
        }
      } catch {
        // 忽略无效 JSON
      }
    }

    return events
  }

  reset(): void {
    this.buffer = ''
  }
}

/**
 * Anthropic 消息流式解析器
 */
export class AnthropicStreamParser {
  private buffer: string = ''

  parse(chunk: string): LLMEvent[] {
    this.buffer += chunk
    const events: LLMEvent[] = []
    const lines = this.buffer.split('\n')

    this.buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data:')) continue

      const data = line.slice(5).trim()
      if (data === '[DONE]') {
        events.push({ type: 'done' })
        continue
      }

      try {
        const parsed = JSON.parse(data)
        const type = parsed.type

        switch (type) {
          case 'content_block_delta':
            if (parsed.delta?.text) {
              events.push({
                type: 'text',
                content: parsed.delta.text
              })
            }
            if (parsed.delta?.thinking) {
              events.push({
                type: 'thinking_start',
                content: parsed.delta.thinking
              })
            }
            break

          case 'message_delta':
            if (parsed.usage?.completion_tokens) {
              // 流结束
            }
            if (parsed.delta?.stop_reason) {
              events.push({ type: 'done' })
            }
            break
        }
      } catch {
        // 忽略无效 JSON
      }
    }

    return events
  }

  reset(): void {
    this.buffer = ''
  }
}

/**
 * 通用 JSON 行解析器（适合 DeepSeek 等）
 */
export class JSONLineParser {
  private buffer: string = ''

  parse(chunk: string): LLMEvent[] {
    this.buffer += chunk
    const events: LLMEvent[] = []
    const lines = this.buffer.split('\n')

    this.buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const parsed = JSON.parse(trimmed)

        // 检测是否为流式结束
        if (parsed.choices?.[0]?.finish_reason === 'stop' || parsed.done) {
          events.push({ type: 'done' })
          continue
        }

        // 提取文本内容
        const text = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text
        if (text) {
          events.push({ type: 'text', content: text })
        }
      } catch {
        // 忽略无效行
      }
    }

    return events
  }

  reset(): void {
    this.buffer = ''
  }
}

/**
 * 创建适合指定 provider 的解析器
 */
export function createStreamParser(provider: string): {
  parser: OpenAIStreamParser | AnthropicStreamParser | JSONLineParser
  parse: (chunk: string) => LLMEvent[]
} {
  switch (provider) {
    case 'anthropic':
      return new AnthropicStreamParser() as unknown as {
        parser: OpenAIStreamParser | AnthropicStreamParser | JSONLineParser
        parse: (chunk: string) => LLMEvent[]
      }
    case 'minimax':
    case 'deepseek':
    case 'siliconflow':
      return new JSONLineParser() as unknown as {
        parser: OpenAIStreamParser | AnthropicStreamParser | JSONLineParser
        parse: (chunk: string) => LLMEvent[]
      }
    default:
      return new OpenAIStreamParser() as unknown as {
        parser: OpenAIStreamParser | AnthropicStreamParser | JSONLineParser
        parse: (chunk: string) => LLMEvent[]
      }
  }
}

// ============================================================================
// 结构化 JSON 解析器 + 动作执行引擎
// 支持流式 JSON 数组增量解析，格式：
// [{"type":"text","content":"..."},{"type":"action","name":"replace","params":{"from":0,"to":10,"text":"..."}},{"type":"action","name":"insert","params":{"position":10,"text":"..."}}]
// ============================================================================

// JSON 动作类型定义
export interface TextItem {
  type: 'text'
  content: string
}

export interface ReplaceAction {
  type: 'action'
  name: 'replace'
  params: {
    from: number
    to: number
    text: string
  }
}

export interface InsertAction {
  type: 'action'
  name: 'insert'
  params: {
    position: number
    text: string
  }
}

export type ActionItem = TextItem | ReplaceAction | InsertAction

// 解析器状态
interface StructuredParserState {
  buffer: string
  isComplete: boolean
  items: ActionItem[]
  error: string | null
}

/**
 * 检查字符串是否完整闭合（支持嵌套和引号）
 */
function isBalanced(str: string): boolean {
  let depth = 0
  let inString = false
  let escaped = false
  
  for (const char of str) {
    if (escaped) {
      escaped = false
      continue
    }
    
    if (char === '\\') {
      escaped = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
      continue
    }
    
    if (inString) continue
    
    if (char === '[' || char === '{') depth++
    if (char === ']' || char === '}') depth--
    
    if (depth < 0) return false
  }
  
  return depth === 0 && !inString
}

/**
 * 检查是否找到完整的数组闭合
 */
function hasArrayClose(str: string): boolean {
  const lastBracket = str.lastIndexOf(']')
  if (lastBracket === -1) return false
  
  const afterBracket = str.slice(lastBracket + 1).trim()
  return afterBracket === ''
}

/**
 * 创建新的结构化解析器状态
 */
export function createStructuredParserState(): StructuredParserState {
  return {
    buffer: '',
    isComplete: false,
    items: [],
    error: null
  }
}

/**
 * 增量解析 JSON 数组字符串
 * 
 * @param partialJson - 增量输入的 JSON 字符串
 * @param state - 解析器状态（跨调用保持）
 * @returns 解析结果，包含是否完整和新解析的项
 */
export function parseStructuredIncremental(
  partialJson: string,
  state: StructuredParserState
): { 
  isComplete: boolean
  newItems: ActionItem[]
  error: string | null
  state: StructuredParserState
} {
  // 追加到 buffer
  state.buffer += partialJson
  
  // 如果已经有错误，保持错误状态
  if (state.error) {
    return { isComplete: false, newItems: [], error: state.error, state }
  }
  
  // 检查是否完整闭合
  if (!hasArrayClose(state.buffer)) {
    return { 
      isComplete: false, 
      newItems: [], 
      error: null, 
      state: { ...state, isComplete: false } 
    }
  }
  
  // 尝试解析
  try {
    const parsed = JSON.parse(state.buffer)
    
    if (!Array.isArray(parsed)) {
      throw new Error('JSON must be an array')
    }
    
    // 验证并类型化每一项
    const validItems: ActionItem[] = []
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) {
        throw new Error('Array items must be objects')
      }
      
      if (item.type === 'text') {
        if (typeof item.content !== 'string') {
          throw new Error('Text item content must be string')
        }
        validItems.push(item as TextItem)
      } else if (item.type === 'action') {
        if (item.name === 'replace') {
          if (typeof item.params?.from !== 'number' || 
              typeof item.params?.to !== 'number' || 
              typeof item.params?.text !== 'string') {
            throw new Error('Replace action params invalid')
          }
          validItems.push(item as ReplaceAction)
        } else if (item.name === 'insert') {
          if (typeof item.params?.position !== 'number' || 
              typeof item.params?.text !== 'string') {
            throw new Error('Insert action params invalid')
          }
          validItems.push(item as InsertAction)
        } else {
          throw new Error(`Unknown action name: ${item.name}`)
        }
      } else {
        throw new Error(`Unknown item type: ${item.type}`)
      }
    }
    
    // 计算新增的项
    const newItems = validItems.slice(state.items.length)
    
    state.items = validItems
    state.isComplete = true
    
    return { isComplete: true, newItems, error: null, state }
    
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'Parse error'
    
    // 如果 buffer 以 [ 开头且尚未闭合，可能是流式传输中
    if (state.buffer.trim().startsWith('[') && !isBalanced(state.buffer)) {
      state.error = null
      return { isComplete: false, newItems: [], error: null, state }
    }
    
    state.error = errorMsg
    return { isComplete: false, newItems: [], error: errorMsg, state }
  }
}

/**
 * 动作执行引擎 - 执行文本动作
 */
export interface ApplyResult {
  success: boolean
  newContent: string
  error?: string
}

/**
 * 执行文本动作
 * 
 * @param originalContent - 原始文本
 * @param actions - 要执行的动作数组（按顺序执行）
 * @returns 执行后的文本
 */
export function executeTextActions(
  originalContent: string,
  actions: ActionItem[]
): ApplyResult {
  let result = originalContent
  
  for (const action of actions) {
    if (action.type === 'text') {
      continue
    }
    
    if (action.type === 'action') {
      if (action.name === 'replace') {
        const { from, to, text } = action.params
        
        if (from < 0 || to > result.length || from > to) {
          return {
            success: false,
            newContent: result,
            error: `Replace bounds invalid: from=${from}, to=${to}, length=${result.length}`
          }
        }
        
        result = result.slice(0, from) + text + result.slice(to)
        
      } else if (action.name === 'insert') {
        const { position, text } = action.params
        
        if (position < 0 || position > result.length) {
          return {
            success: false,
            newContent: result,
            error: `Insert position invalid: position=${position}, length=${result.length}`
          }
        }
        
        result = result.slice(0, position) + text + result.slice(position)
      }
    }
  }
  
  return { success: true, newContent: result }
}

/**
 * 解析并执行动作（一条龙服务）
 */
export function parseAndExecuteActions(
  partialJson: string,
  state: StructuredParserState,
  originalContent: string
): {
  isComplete: boolean
  newItems: ActionItem[]
  applyResult: ApplyResult
  error: string | null
  state: StructuredParserState
} {
  const parseResult = parseStructuredIncremental(partialJson, state)
  
  if (parseResult.error) {
    return {
      ...parseResult,
      applyResult: { success: false, newContent: originalContent, error: parseResult.error }
    }
  }
  
  const applyResult = executeTextActions(originalContent, parseResult.newItems)
  
  return {
    ...parseResult,
    applyResult
  }
}

/**
 * 提取纯文本内容（从 text 类型项合并）
 */
export function extractStructuredText(items: ActionItem[]): string {
  return items
    .filter((item): item is TextItem => item.type === 'text')
    .map(item => item.content)
    .join('')
}

/**
 * 从 JSON 响应中提取文本，fallback 到原始字符串
 */
export function extractStructuredTextOrFallback(
  jsonString: string,
  fallback: string
): string {
  try {
    const parsed = JSON.parse(jsonString)
    if (Array.isArray(parsed)) {
      return extractStructuredText(parsed)
    }
    return fallback
  } catch {
    return fallback
  }
}
