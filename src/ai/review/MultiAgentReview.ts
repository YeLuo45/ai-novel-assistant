/**
 * Multi-Agent Review System - V40
 * Phase 2: 多Agent评审机制
 * 
 * 四个专业评审员：
 * - 策划：剧情架构评审
 * - 文笔：语言表达评审
 * - 逻辑：前后一致性评审
 * - 节奏：阅读体验评审
 */

import type { Lesson } from '../evolution/SelfEvolutionEngine'

// ==================== 类型定义 ====================

/** 章节内容 */
export interface Chapter {
  id: number
  title: string
  content: string
  wordCount: number
  projectId?: number
}

/** 问题/缺陷 */
export interface Issue {
  type: 'plot' | 'prose' | 'logic' | 'pacing'
  severity: 'minor' | 'major' | 'critical'
  location?: { paragraph: number; sentence?: number }
  description: string
  suggestion?: string
}

/** 单个评审结果 */
export interface ReviewResult {
  reviewer: string
  specialty: string
  score: number              // 0-100
  issues: Issue[]
  suggestions: string[]
  overallComment: string
  reviewedAt: number
}

/** 汇总评审结果 */
export interface AggregatedReview {
  chapterId: number
  overallScore: number
  reviewerCount: number
  results: ReviewResult[]
  issues: Issue[]
  summary: string
  reviewedAt: number
}

// ==================== 评审员定义 ====================

/** 评审员接口 */
interface Reviewer {
  name: string
  specialty: string
  reviewChapter(chapter: Chapter): Promise<ReviewResult>
}

// ==================== 策划评审员 ====================

async function plotReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: Issue[] = []
  const suggestions: string[] = []

  // 检查章节是否有明确的目标/冲突
  const hasConflict = chapter.content.includes('冲突') || 
                      chapter.content.includes('矛盾') ||
                      chapter.content.includes('问题') ||
                      chapter.content.includes('决定')

  const hasResolution = chapter.content.includes('解决') ||
                         chapter.content.includes('结果') ||
                         chapter.content.includes('成功') ||
                         chapter.content.includes('失败')

  if (!hasConflict) {
    issues.push({
      type: 'plot',
      severity: 'major',
      description: '章节缺乏明显的冲突或矛盾',
      suggestion: '建议增加主角面临的问题或抉择'
    })
  }

  if (!hasResolution && chapter.wordCount > 1000) {
    issues.push({
      type: 'plot',
      severity: 'minor',
      description: '长章节缺少阶段性结果',
      suggestion: '考虑在适当位置添加小高潮或转折'
    })
  }

  // 检查是否有过渡性内容（章节间连接）
  const isTransitionChapter = chapter.content.length < 500
  if (isTransitionChapter) {
    suggestions.push('这是一个较短的过渡章节，可以考虑合并到相邻章节')
  }

  const score = Math.max(0, 100 - issues.length * 15 - (hasConflict ? 0 : 20))

  return {
    reviewer: '策划',
    specialty: '剧情架构',
    score,
    issues,
    suggestions,
    overallComment: issues.length === 0 
      ? '剧情架构合理，有明确的目标和冲突' 
      : `发现 ${issues.length} 个剧情问题，需要关注`,
    reviewedAt: Date.now()
  }
}

// ==================== 文笔评审员 ====================

async function proseReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: Issue[] = []
  const suggestions: string[] = []

  const sentences = chapter.content.split(/[.。!！?？]/).filter(s => s.trim())
  const words = chapter.content.split(/\s+/)

  // 检查平均句长
  const avgSentenceLength = words.length / Math.max(1, sentences.length)
  
  if (avgSentenceLength > 50) {
    issues.push({
      type: 'prose',
      severity: 'minor',
      description: '句子过长，阅读体验可能不佳',
      suggestion: '考虑拆分长句，使用更多短句增强节奏感'
    })
  }

  // 检查是否有重复词汇
  const wordFreq = new Map<string, number>()
  for (const word of words) {
    if (word.length > 2) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
  }
  
  const repeatedWords = Array.from(wordFreq.entries())
    .filter(([, count]) => count > 5)
    .sort((a, b) => b[1] - a[1])

  for (const [word, count] of repeatedWords.slice(0, 3)) {
    issues.push({
      type: 'prose',
      severity: 'minor',
      description: `词汇"${word}"重复使用${count}次`,
      suggestion: `建议使用同义词替换，避免重复`
    })
  }

  // 检查对话比例
  const dialogueCount = (chapter.content.match(/["""'『』]/g) || []).length / 2
  const dialogueRatio = dialogueCount / Math.max(1, sentences.length)
  
  if (dialogueRatio > 0.5) {
    suggestions.push('对话比例较高，注意配合适当的叙述和描写')
  }

  const score = Math.max(0, 100 - issues.length * 10 - suggestions.length * 5)

  return {
    reviewer: '文笔',
    specialty: '语言表达',
    score,
    issues,
    suggestions,
    overallComment: issues.length === 0 
      ? '语言表达流畅，用词恰当' 
      : `发现 ${issues.length} 个语言问题`,
    reviewedAt: Date.now()
  }
}

// ==================== 逻辑评审员 ====================

async function logicReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: Issue[] = []
  const suggestions: string[] = []

  // 检查时间线冲突（简单检查）
  const timeIndicators = chapter.content.match(/\d+年|\d+月|\d+日|\d+点|早上|中午|晚上|夜里/g) || []
  const uniqueTimes = new Set(timeIndicators)
  
  if (timeIndicators.length > 5 && uniqueTimes.size > 3) {
    suggestions.push('章节涉及多个时间段，请确保时间线清晰')
  }

  // 检查人物一致性（简单检查：同一人物的不同称呼）
  const characterMentions = chapter.content.match(/的(?:主角|男主|女主|人物)/g) || []
  if (characterMentions.length > 3) {
    issues.push({
      type: 'logic',
      severity: 'minor',
      description: '人物称呼可能不一致',
      suggestion: '确保同一人物使用统一的称呼'
    })
  }

  // 检查因果关系
  const hasCause = chapter.content.includes('因为') || chapter.content.includes('由于')
  const hasEffect = chapter.content.includes('所以') || chapter.content.includes('因此') || chapter.content.includes('导致')
  
  if (hasCause && !hasEffect) {
    suggestions.push('有"因为"但缺少"所以/因此"，注意因果表达完整')
  }

  // 检查矛盾表达
  const contradictions = [
    { pos: '但是', neg: '所以' },
    { pos: '然而', neg: '最终' }
  ]

  for (const { pos, neg } of contradictions) {
    if (chapter.content.includes(pos) && chapter.content.includes(neg)) {
      issues.push({
        type: 'logic',
        severity: 'minor',
        description: '表达可能存在矛盾',
        suggestion: '检查前后逻辑是否一致'
      })
    }
  }

  const score = Math.max(0, 100 - issues.length * 15 - suggestions.length * 5)

  return {
    reviewer: '逻辑',
    specialty: '前后一致',
    score,
    issues,
    suggestions,
    overallComment: issues.length === 0 
      ? '逻辑连贯，前后一致' 
      : `发现 ${issues.length} 个逻辑问题`,
    reviewedAt: Date.now()
  }
}

// ==================== 节奏评审员 ====================

async function pacingReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: Issue[] = []
  const suggestions: string[] = []

  // 检查字数是否在合理范围
  if (chapter.wordCount < 1000) {
    issues.push({
      type: 'pacing',
      severity: 'minor',
      description: '章节字数较少',
      suggestion: '考虑增加内容或合并到上一章'
    })
  } else if (chapter.wordCount > 5000) {
    issues.push({
      type: 'pacing',
      severity: 'minor',
      description: '章节字数较多，阅读压力较大',
      suggestion: '考虑拆分为两章'
    })
  }

  // 检查段落长度
  const paragraphs = chapter.content.split(/\n\n/)
  const longParagraphs = paragraphs.filter(p => p.length > 500)
  
  if (longParagraphs.length > paragraphs.length * 0.3) {
    issues.push({
      type: 'pacing',
      severity: 'minor',
      description: '大量长段落，阅读节奏可能偏慢',
      suggestion: '适当拆分长段落，增加呼吸感'
    })
  }

  // 检查高潮点位置（简单的峰值检测）
  const exclamationCount = (chapter.content.match(/[!！]/g) || []).length
  const questionCount = (chapter.content.match(/[?？]/g) || []).length
  
  if (exclamationCount === 0 && questionCount === 0 && chapter.wordCount > 2000) {
    suggestions.push('建议增加情感高点，使用感叹号或问号增强张力')
  }

  const score = Math.max(0, 100 - issues.length * 10 - suggestions.length * 5)

  return {
    reviewer: '节奏',
    specialty: '阅读体验',
    score,
    issues,
    suggestions,
    overallComment: issues.length === 0 
      ? '节奏把控良好，阅读体验流畅' 
      : `发现 ${issues.length} 个节奏问题`,
    reviewedAt: Date.now()
  }
}

// ==================== 四评审员 ====================

const reviewers: Reviewer[] = [
  { name: '策划', specialty: '剧情架构', reviewChapter: plotReview },
  { name: '文笔', specialty: '语言表达', reviewChapter: proseReview },
  { name: '逻辑', specialty: '前后一致', reviewChapter: logicReview },
  { name: '节奏', specialty: '阅读体验', reviewChapter: pacingReview },
]

// ==================== 多Agent评审 ====================

/**
 * 并行执行四评审员评审
 */
export async function multiAgentReview(chapter: Chapter): Promise<AggregatedReview> {
  const results = await Promise.all(reviewers.map(r => r.reviewChapter(chapter)))
  return aggregateReviews(chapter.id, results)
}

/**
 * 汇总评审结果
 */
export function aggregateReviews(chapterId: number, results: ReviewResult[]): AggregatedReview {
  // 计算总分
  const overallScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  )

  // 合并所有问题
  const allIssues = results.flatMap(r => r.issues)

  // 生成总结
  const summary = generateSummary(results, overallScore)

  return {
    chapterId,
    overallScore,
    reviewerCount: results.length,
    results,
    issues: allIssues,
    summary,
    reviewedAt: Date.now()
  }
}

/**
 * 生成评审总结
 */
function generateSummary(results: ReviewResult[], overallScore: number): string {
  const comments = results.map(r => `${r.reviewer}:${r.score}分`).join(', ')
  
  if (overallScore >= 85) {
    return `整体优秀(${comments})，各维度表现良好，建议通过。`
  } else if (overallScore >= 70) {
    return `整体良好(${comments})，有小幅改进空间，可考虑优化后通过。`
  } else if (overallScore >= 50) {
    return `整体一般(${comments})，需要针对问题进行修改。`
  } else {
    return `存在较大问题(${comments})，建议大幅修订。`
  }
}

// ==================== 结晶集成 ====================

/**
 * 评审结果结晶回调
 * 当评审分数足够高时，自动将建议结晶为新的 Lesson
 */
export async function onReviewComplete(
  projectId: number,
  review: AggregatedReview,
  selfEvolutionEngine: any
): Promise<Lesson | null> {
  if (review.overallScore > 85) {
    const lesson: Omit<Lesson, 'id' | 'createdAt'> = {
      task: `review_${review.chapterId}`,
      approach: review.results.flatMap(r => r.suggestions).join('; '),
      outcome: 'success',
      context: {
        score: review.overallScore / 100,
        reviewers: review.reviewerCount,
        chapterId: review.chapterId
      }
    }
    return await selfEvolutionEngine.recordLesson(lesson)
  }
  return null
}

// 导出评审员列表
export const getReviewers = () => reviewers