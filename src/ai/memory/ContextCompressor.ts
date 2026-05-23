/**
 * V40 ContextCompressor - 上下文压缩算法
 * 将消息数组压缩到指定 token 限制内
 */

import { Summarizer, summarizer } from './Summarizer'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

export interface CompressionOptions {
  maxTokens: number
  summarize?: boolean
}

const TOKENS_PER_CHAR = 0.25  // 估算：1个token约等于4个字符
const MIN_MESSAGES_KEEP = 3   // 最少保留的消息数

export class ContextCompressor {
  private summarizer: Summarizer

  constructor(summarizerInstance?: Summarizer) {
    this.summarizer = summarizerInstance || summarizer
  }

  /**
   * 压缩消息数组到指定 token 限制
   */
  compress(messages: Message[], maxTokens: number, options: CompressionOptions): Message[] {
    if (messages.length === 0) return []
    
    const maxChars = Math.floor(maxTokens / TOKENS_PER_CHAR)
    const currentTokens = this.estimateTotalTokens(messages)
    
    // 如果已经在限制内，直接返回
    if (currentTokens <= maxTokens) {
      return [...messages]
    }

    // 1. 优先保留重要消息
    const prioritized = this.prioritize(messages)
    
    // 2. 分离重要消息和可压缩消息
    const { important, rest } = this.separateByPriority(prioritized, maxTokens)
    
    // 3. 压缩 rest 部分
    if (rest.length === 0) {
      return important
    }

    // 4. 生成摘要
    const summaryText = this.summarizer.summarize(rest)
    
    // 5. 合并
    return this.merge(important, summaryText, maxTokens)
  }

  /**
   * 估算总 token 数
   */
  estimateTotalTokens(messages: Message[]): number {
    return messages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0)
  }

  /**
   * 估算单条消息的 token 数
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length * TOKENS_PER_CHAR)
  }

  /**
   * 按重要性排序消息
   */
  private prioritize(messages: Message[]): Message[] {
    return messages.map((msg, index) => ({
      msg,
      priority: this.calculatePriority(msg, index, messages.length),
    })).sort((a, b) => b.priority - a.priority).map(item => item.msg)
  }

  /**
   * 计算单条消息的优先级
   */
  private calculatePriority(msg: Message, index: number, total: number): number {
    let priority = 0

    // 角色权重
    if (msg.role === 'system') priority += 100
    else if (msg.role === 'user') priority += 50
    else priority += 10

    // 位置权重 - 最近的消息更重要
    const recencyBonus = (index / total) * 20
    priority += recencyBonus

    // 内容长度权重
    const length = msg.content.length
    if (length > 100 && length < 500) priority += 5
    else if (length >= 500) priority += 3

    // 时间戳权重（如果有）
    if (msg.timestamp) {
      const age = Date.now() - msg.timestamp
      if (age < 3600000) priority += 10  // 1小时内
    }

    return priority
  }

  /**
   * 根据优先级分离消息
   */
  private separateByPriority(messages: Message[], maxTokens: number): { important: Message[], rest: Message[] } {
    const important: Message[] = []
    const rest: Message[] = []
    let importantTokens = 0

    for (const msg of messages) {
      const tokens = this.estimateTokens(msg.content)
      
      if (importantTokens + tokens <= maxTokens * 0.6) {
        // 保留60%空间给重要消息
        important.push(msg)
        importantTokens += tokens
      } else {
        rest.push(msg)
      }
    }

    return { important, rest }
  }

  /**
   * 合并重要消息和摘要
   */
  private merge(important: Message[], summary: string, maxTokens: number): Message[] {
    const result: Message[] = []
    
    // 添加摘要作为第一条（如果需要）
    if (summary) {
      const summaryTokens = this.estimateTokens(summary)
      const availableTokens = maxTokens - this.estimateTotalTokens(important)
      
      if (summaryTokens <= availableTokens) {
        result.push({
          role: 'system',
          content: `[上文摘要] ${summary}`,
        })
      }
    }

    // 添加重要消息（确保保留最新消息）
    const latestMessages = this.keepLatestMessages(important, MIN_MESSAGES_KEEP)
    result.push(...latestMessages)

    return result
  }

  /**
   * 确保保留最新消息
   */
  private keepLatestMessages(messages: Message[], minKeep: number): Message[] {
    if (messages.length <= minKeep) return messages
    
    // 保留最新的 N 条
    return messages.slice(-minKeep)
  }
}

// 默认实例
export const contextCompressor = new ContextCompressor()