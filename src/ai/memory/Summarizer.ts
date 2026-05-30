/**
 * V40 Summarizer - 抽取式摘要
 * 不调用 LLM，使用简单启发式方法提取关键句
 */

export interface SummarizerOptions {
  maxSentences?: number
  minSentenceLength?: number
}

const DEFAULT_MAX_SENTENCES = 3
const DEFAULT_MIN_SENTENCE_LENGTH = 20

export class Summarizer {
  private maxSentences: number
  private minSentenceLength: number

  constructor(options: SummarizerOptions = {}) {
    this.maxSentences = options.maxSentences ?? DEFAULT_MAX_SENTENCES
    this.minSentenceLength = options.minSentenceLength ?? DEFAULT_MIN_SENTENCE_LENGTH
  }

  /**
   * 抽取式摘要 - 从消息列表中提取关键句
   * 策略：
   * 1. 按句子分割
   * 2. 计算每句的重要性分数（基于关键词频率、位置等）
   * 3. 选择分数最高的 N 句
   */
  summarize(messages: { content: string }[]): string {
    if (messages.length === 0) return ''
    if (messages.length === 1) return messages[0].content

    // 合并所有内容
    const fullText = messages.map(m => m.content).join(' ')
    
    // 分割句子
    const sentences = this.splitSentences(fullText)
    if (sentences.length === 0) return fullText.slice(0, 500)
    if (sentences.length <= this.maxSentences) {
      return sentences.join(' ')
    }

    // 计算句子分数
    const scored = sentences.map(sentence => ({
      sentence,
      score: this.scoreSentence(sentence, sentences),
    }))

    // 按分数排序，选择前 N 句
    scored.sort((a, b) => b.score - a.score)
    const topSentences = scored.slice(0, this.maxSentences)

    // 按原文顺序重新排序
    topSentences.sort((a, b) => 
      sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence)
    )

    return topSentences.map(s => s.sentence).join(' ')
  }

  /**
   * 分割句子
   */
  private splitSentences(text: string): string[] {
    // 按句子结束符分割
    const sentences = text.split(/[.!?。！？]+/)
      .map(s => s.trim())
      .filter(s => s.length >= this.minSentenceLength)
    return sentences
  }

  /**
   * 计算句子重要性分数
   */
  private scoreSentence(sentence: string, allSentences: string[]): number {
    let score = 0

    // 1. 长度分数 - 太短或太长的句子分数降低
    const length = sentence.length
    if (length >= 50 && length <= 200) score += 2
    else if (length < 30) score -= 1

    // 2. 位置分数 - 开头和结尾的句子更重要
    const index = allSentences.indexOf(sentence)
    if (index === 0) score += 3
    else if (index === allSentences.length - 1) score += 2
    else if (index < 3) score += 1

    // 3. 关键词分数 - 包含重要关键词的句子
    const importantWords = this.extractKeywords(sentence)
    score += importantWords.length * 0.5

    // 4. 重复度分数 - 句子间共享词汇越多越重要
    const otherSentences = allSentences.filter(s => s !== sentence)
    let sharedWords = 0
    for (const other of otherSentences) {
      const otherWords = new Set(other.split(/\s+/))
      for (const word of importantWords) {
        if (otherWords.has(word)) sharedWords++
      }
    }
    score += Math.min(sharedWords / allSentences.length, 3)

    // 5. 数字和专有名词分数
    if (/\d+/.test(sentence)) score += 1
    if (/['"'"'].+['"'"']/.test(sentence)) score += 1

    return score
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 提取4字以上的词
    const words = text.match(/[\w\u4e00-\u9fa5]{4,}/g) || []
    const stopWords = new Set(['这个', '那个', '什么', '怎么', '为什么', '的', '了', '是', '在', '和'])
    
    return words
      .filter(w => !stopWords.has(w))
      .filter(w => w.length >= 4)
  }
}

// 默认实例
export const summarizer = new Summarizer()