/**
 * Multi-Agent Review — 四个专业评审员协作评审
 */

import { Chapter, ReviewResult, AggregatedReview, Reviewer } from './types'

// 专业评审员定义
const reviewers: Reviewer[] = [
  { name: '策划', specialty: '剧情架构', weight: 0.3 },
  { name: '文笔', specialty: '语言表达', weight: 0.25 },
  { name: '逻辑', specialty: '前后一致', weight: 0.25 },
  { name: '节奏', specialty: '阅读体验', weight: 0.2 },
]

/**
 * 策划评审 — 剧情架构
 */
async function plotReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: string[] = []
  const suggestions: string[] = []

  // 检查章节长度
  if (chapter.content.length < 500) {
    issues.push('章节过短，建议至少 1000 字')
  } else if (chapter.content.length > 10000) {
    issues.push('章节过长，建议拆分')
  }

  // 检查情节推进
  if (!chapter.content.includes('。') && chapter.content.split('。').length < 5) {
    issues.push('句子过少，情节发展不足')
  }

  // 检查悬念设置
  if (!hasCliffhanger(chapter.content)) {
    suggestions.push('建议在章节末尾添加悬念或转折')
  }

  // 检查人物出场
  const characterCount = countCharacterMentions(chapter.content)
  if (characterCount < 2) {
    suggestions.push('建议增加人物互动')
  }

  const score = calculateScore(issues, suggestions)

  return {
    reviewer: '策划',
    score,
    issues,
    suggestions,
    overallComment: score > 0.8 ? '剧情架构合理' : '需要改进剧情节奏',
  }
}

/**
 * 文笔评审 — 语言表达
 */
async function proseReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: string[] = []
  const suggestions: string[] = []

  // 检查重复词汇
  const wordFrequency = calculateWordFrequency(chapter.content)
  const repeatedWords = Object.entries(wordFrequency)
    .filter(([word, count]) => count > 5 && word.length > 2)
    .map(([word]) => word)

  if (repeatedWords.length > 0) {
    issues.push(`存在重复词汇: ${repeatedWords.slice(0, 3).join(', ')}`)
    suggestions.push('使用同义词替换减少重复')
  }

  // 检查语句长度
  const avgSentenceLength = chapter.content.split(/[。！？]/).reduce((sum, s) => sum + s.length, 0) /
    Math.max(1, chapter.content.split(/[。！？]/).length)

  if (avgSentenceLength > 50) {
    suggestions.push('平均句长过长，建议缩短句子增加节奏感')
  }

  // 检查修辞手法
  if (!hasMetaphor(chapter.content) && !hasSimile(chapter.content)) {
    suggestions.push('建议增加修辞手法（比喻、拟人等）丰富表达')
  }

  const score = calculateScore(issues, suggestions)

  return {
    reviewer: '文笔',
    score,
    issues,
    suggestions,
    overallComment: score > 0.8 ? '语言表达流畅' : '需要提升文笔质量',
  }
}

/**
 * 逻辑评审 — 前后一致
 */
async function logicReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: string[] = []
  const suggestions: string[] = []

  // 检查时间线逻辑
  const timeMentions = chapter.content.match(/\d+年|\d+月|\d+日|\d+时/g) || []
  if (timeMentions.length > 5) {
    issues.push('时间线描述过多，容易混淆')
    suggestions.push('简化时间线描述，使用相对时间（如"三天后"）')
  }

  // 检查地点一致性
  const locationMentions = chapter.content.match(/在|到|来到|离开/g) || []
  if (locationMentions.length > 10) {
    suggestions.push('注意地点转换的自然过渡')
  }

  // 检查人物行为逻辑
  const dialogueCount = (chapter.content.match(/"[^"]*"/g) || []).length
  const actionCount = (chapter.content.match(/[做|进行|开始|完成]/g) || []).length

  if (dialogueCount > actionCount * 2) {
    suggestions.push('对话过多，动作描写相对不足')
  }

  const score = calculateScore(issues, suggestions)

  return {
    reviewer: '逻辑',
    score,
    issues,
    suggestions,
    overallComment: score > 0.8 ? '逻辑清晰合理' : '存在逻辑漏洞',
  }
}

/**
 * 节奏评审 — 阅读体验
 */
async function pacingReview(chapter: Chapter): Promise<ReviewResult> {
  const issues: string[] = []
  const suggestions: string[] = []

  // 检查段落长度
  const paragraphs = chapter.content.split(/\n\n/)
  const longParagraphs = paragraphs.filter(p => p.length > 300).length

  if (longParagraphs > paragraphs.length * 0.5) {
    issues.push('长段落过多，阅读体验差')
    suggestions.push('将长段落拆分为短段落，每段不超过 200 字')
  }

  // 检查高潮设置
  const hasClimax = hasDramaticMoment(chapter.content)
  if (!hasClimax) {
    suggestions.push('建议增加一个戏剧性时刻提升章节张力')
  }

  // 检查情感曲线
  const情感词 = chapter.content.match(/[高兴|悲伤|愤怒|恐惧|惊讶]/g) || []
  if (情感词.length < 3) {
    suggestions.push('建议增加情感描写')
  }

  const score = calculateScore(issues, suggestions)

  return {
    reviewer: '节奏',
    score,
    issues,
    suggestions,
    overallComment: score > 0.8 ? '节奏把控得当' : '节奏需要调整',
  }
}

/**
 * 多Agent并行评审
 */
export async function multiAgentReview(chapter: Chapter): Promise<AggregatedReview> {
  const reviewFns = [plotReview, proseReview, logicReview, pacingReview]

  const results = await Promise.all(
    reviewers.map((r, i) => reviewFns[i](chapter))
  )

  return aggregateReviews(results, chapter.id)
}

/**
 * 汇总评审结果
 */
function aggregateReviews(results: ReviewResult[], chapterId: string): AggregatedReview {
  let totalScore = 0
  let totalWeight = 0

  for (let i = 0; i < results.length; i++) {
    totalScore += results[i].score * reviewers[i].weight
    totalWeight += reviewers[i].weight
  }

  const overallScore = totalScore / totalWeight

  const allIssues = results.flatMap(r => r.issues)
  const allSuggestions = results.flatMap(r => r.suggestions)
  const uniqueSuggestions = [...new Set(allSuggestions)]

  return {
    chapterId,
    overallScore,
    reviewerCount: results.length,
    reviewerResults: results,
    allIssues,
    prioritizedSuggestions: uniqueSuggestions.slice(0, 5),
    overallComment: overallScore > 0.8
      ? '章节质量优秀，建议发布'
      : overallScore > 0.6
        ? '章节质量一般，需要修改'
        : '章节质量较差，建议重写',
    createdAt: Date.now(),
  }
}

// ============ Helper Functions ============

function hasCliffhanger(content: string): boolean {
  const cliffhangers = ['悬念', '未完', '待续', '突然', '就在此时', '就在这时', '没想到', '却发现']
  return cliffhangers.some(c => content.includes(c))
}

function countCharacterMentions(content: string): number {
  const pronouns = ['他', '她', '它', '他们', '她们', '我', '我们', '你', '你们', '此人', '这家伙']
  return pronouns.filter(p => content.includes(p)).length
}

function calculateWordFrequency(content: string): Record<string, number> {
  const words = content.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const freq: Record<string, number> = {}
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1
  }
  return freq
}

function hasMetaphor(content: string): boolean {
  return content.includes('像') || content.includes('如') || content.includes('似')
}

function hasSimile(content: string): boolean {
  return content.includes('仿佛') || content.includes('宛如') || content.includes('犹如')
}

function hasDramaticMoment(content: string): boolean {
  const moments = ['突然', '猛然', '骤然', '忽然', '就在这时', '意想不到', '震惊', '惊愕']
  return moments.some(m => content.includes(m))
}

function calculateScore(issues: string[], suggestions: string[]): number {
  if (issues.length === 0 && suggestions.length === 0) return 1.0
  return Math.max(0.4, 1.0 - issues.length * 0.15 - suggestions.length * 0.05)
}