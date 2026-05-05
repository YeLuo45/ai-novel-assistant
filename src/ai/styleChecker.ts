/**
 * 文风一致性检测模块
 * - 分析章节文风特征
 * - 检测与项目整体风格的偏差
 * - 标注具体偏差段落
 */

import { callLLM } from './llm'
import { db, type ChapterStyleProfile, type OutlineNode } from '../db'

export interface StyleDimension {
  name: 'characterVoice' | 'vocabulary' | 'sentenceLength' | 'descriptionDensity'
  score: number // 0-100
  description: string
  deviations: StyleDeviation[]
}

export interface StyleDeviation {
  chapterId: number
  paragraphIndex: number
  paragraphText: string
  deviationType: 'too_long' | 'too_short' | 'dialogue_heavy' | 'description_heavy' | 'vocabulary_change' | 'tense_shift'
  expected: string
  actual: string
  severity: 'minor' | 'moderate' | 'major'
}

export interface StyleConsistencyReport {
  projectId: number
  chapterId: number
  overallScore: number // 0-100
  dimensions: StyleDimension[]
  recommendations: string[]
  analyzedAt: Date
}

/**
 * 分析单个章节的文风特征
 */
function analyzeChapterStyle(chapter: OutlineNode): {
  avgSentenceLength: number
  dialogueRatio: number
  descriptionDensity: number
  commonPhrases: string[]
} {
  const content = chapter.content || ''
  
  // 计算平均句子长度
  const sentences = content.split(/[。！？；\n]/).filter(s => s.trim())
  const avgSentenceLength = sentences.length > 0 
    ? sentences.reduce((sum: number, s: string) => sum + s.length, 0) / sentences.length 
    : 0

  // 计算对话比例
  const dialogueMatches = content.match(/「[^」]*」/g) || []
  const dialogueChars = dialogueMatches.reduce((sum: number, d: string) => sum + d.length, 0)
  const dialogueRatio = content.length > 0 ? dialogueChars / content.length : 0

  // 计算描写密度（形容词+副词占比）
  const descriptiveWords = content.match(/[的地得]/g) || []
  const descriptionDensity = content.length > 0 ? descriptiveWords.length / content.length : 0

  // 提取常用短语（简单的n-gram）
  const phrases: string[] = []
  const words = content.replace(/[「」『』，。！？、：；""'']/g, '').split(/\s+/)
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length >= 2 && words[i + 1].length >= 2) {
      phrases.push(`${words[i]}${words[i + 1]}`)
    }
  }
  
  // 统计出现频率最高的短语
  const phraseCount: Record<string, number> = {}
  phrases.forEach(p => {
    phraseCount[p] = (phraseCount[p] || 0) + 1
  })
  
  const commonPhrases = Object.entries(phraseCount)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase)

  return {
    avgSentenceLength,
    dialogueRatio,
    descriptionDensity,
    commonPhrases
  }
}

/**
 * 检测段落级别的偏差
 */
function detectParagraphDeviations(
  content: string,
  baseline: { avgSentenceLength: number; dialogueRatio: number }
): StyleDeviation[] {
  const deviations: StyleDeviation[] = []
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())

  paragraphs.forEach((paragraph, index) => {
    const sentences = paragraph.split(/[。！？；]/).filter(s => s.trim())
    const avgLen = sentences.length > 0 
      ? sentences.reduce((sum: number, s: string) => sum + s.length, 0) / sentences.length 
      : 0

    // 检测句子长度偏差
    if (avgLen > baseline.avgSentenceLength * 1.5) {
      deviations.push({
        chapterId: 0,
        paragraphIndex: index,
        paragraphText: paragraph.slice(0, 100) + (paragraph.length > 100 ? '...' : ''),
        deviationType: 'too_long',
        expected: `平均句子长度约${Math.round(baseline.avgSentenceLength)}字`,
        actual: `平均句子长度约${Math.round(avgLen)}字`,
        severity: avgLen > baseline.avgSentenceLength * 2 ? 'major' : 'moderate'
      })
    } else if (avgLen < baseline.avgSentenceLength * 0.5 && avgLen > 0) {
      deviations.push({
        chapterId: 0,
        paragraphIndex: index,
        paragraphText: paragraph.slice(0, 100) + (paragraph.length > 100 ? '...' : ''),
        deviationType: 'too_short',
        expected: `平均句子长度约${Math.round(baseline.avgSentenceLength)}字`,
        actual: `平均句子长度约${Math.round(avgLen)}字`,
        severity: 'minor'
      })
    }

    // 检测对话密度偏差
    const dialogueMatches = paragraph.match(/「[^」]*」/g) || []
    const dialogueChars = dialogueMatches.reduce((sum: number, d: string) => sum + d.length, 0)
    const ratio = paragraph.length > 0 ? dialogueChars / paragraph.length : 0

    if (ratio > baseline.dialogueRatio * 1.8 && ratio > 0.4) {
      deviations.push({
        chapterId: 0,
        paragraphIndex: index,
        paragraphText: paragraph.slice(0, 100) + (paragraph.length > 100 ? '...' : ''),
        deviationType: 'dialogue_heavy',
        expected: `对话比例约${Math.round(baseline.dialogueRatio * 100)}%`,
        actual: `对话比例约${Math.round(ratio * 100)}%`,
        severity: ratio > 0.7 ? 'major' : 'moderate'
      })
    }
  })

  return deviations
}

/**
 * 使用AI进行深度文风分析
 */
async function analyzeWithAI(
  chapter: OutlineNode,
  baselineProfile: ChapterStyleProfile['profile'] | null
): Promise<StyleDimension[]> {
  const model = 'gpt-4o-mini'
  
  const systemPrompt = `你是一位专业的中文写作风格分析师，擅长检测文风一致性问题。
分析维度包括：
1. 角色语气一致性 - 对话是否符合角色性格
2. 措辞习惯 - 用词是否与作品整体风格一致
3. 句式长短 - 句子长度分布是否合理
4. 描写密度 - 场景描写与对话的比例

请用JSON格式输出分析结果。`

  const userPrompt = baselineProfile
    ? `分析以下章节的文风特征，与项目已有风格进行对比：

章节内容：
${chapter.content || '（无内容）'}

项目已有风格特征：
- 平均句子长度：${baselineProfile.avgSentenceLength.toFixed(1)}字
- 对话比例：${(baselineProfile.dialogueRatio * 100).toFixed(1)}%
- 描写密度：${(baselineProfile.descriptionDensity * 100).toFixed(1)}%
- 常用词汇：${baselineProfile.commonPhrases.slice(0, 5).join(', ') || '（无）'}

请输出JSON格式的分析结果，包含各维度评分(0-100)和具体偏差描述。`
    : `分析以下章节的文风特征：

章节内容：
${chapter.content || '（无内容）'}

请输出JSON格式的分析结果，包含各维度评分(0-100)和特征描述。`

  try {
    const response = await callLLM({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    }, 'style-checker')

    // 尝试解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed.dimensions || []
    }
  } catch (error) {
    console.error('AI analysis failed, using fallback:', error)
  }

  // Fallback: 使用规则基础分析
  const style = analyzeChapterStyle(chapter)
  return [
    {
      name: 'sentenceLength',
      score: 80,
      description: `平均句子长度${style.avgSentenceLength.toFixed(1)}字`,
      deviations: []
    },
    {
      name: 'descriptionDensity',
      score: 75,
      description: `描写密度${(style.descriptionDensity * 100).toFixed(1)}%`,
      deviations: []
    }
  ]
}

/**
 * 分析章节文风一致性
 */
export async function analyzeStyleConsistency(
  projectId: number,
  chapterId: number
): Promise<StyleConsistencyReport> {
  const chapter = await db.outlineNodes.get(chapterId)
  if (!chapter) {
    throw new Error(`Chapter ${chapterId} not found`)
  }

  // 获取项目所有章节的文风档案
  const allProfiles = await db.chapterStyleProfiles
    .where('projectId')
    .equals(projectId)
    .toArray()

  // 获取项目其他已完成章节
  const otherChapters = await db.outlineNodes
    .where('projectId')
    .equals(projectId)
    .filter((n: OutlineNode) => n.id !== chapterId && n.status === 'completed' && !!n.content)
    .toArray()

  // 计算基线文风（所有已完成章节的平均）
  let baselineProfile: ChapterStyleProfile['profile'] | null = null
  
  if (allProfiles.length > 0) {
    const avgSentenceLength = allProfiles.reduce((sum: number, p: ChapterStyleProfile) => sum + p.profile.avgSentenceLength, 0) / allProfiles.length
    const avgDialogueRatio = allProfiles.reduce((sum: number, p: ChapterStyleProfile) => sum + p.profile.dialogueRatio, 0) / allProfiles.length
    const avgDescriptionDensity = allProfiles.reduce((sum: number, p: ChapterStyleProfile) => sum + p.profile.descriptionDensity, 0) / allProfiles.length

    baselineProfile = {
      avgSentenceLength,
      dialogueRatio: avgDialogueRatio,
      descriptionDensity: avgDescriptionDensity,
      tense: 'past',
      perspective: 'third',
      characterVoices: {},
      commonPhrases: []
    }
  } else if (otherChapters.length > 0) {
    // 从其他章节计算基线
    const styles = otherChapters.map(c => analyzeChapterStyle(c))
    baselineProfile = {
      avgSentenceLength: styles.reduce((sum: number, s) => sum + s.avgSentenceLength, 0) / styles.length,
      dialogueRatio: styles.reduce((sum: number, s) => sum + s.dialogueRatio, 0) / styles.length,
      descriptionDensity: styles.reduce((sum: number, s) => sum + s.descriptionDensity, 0) / styles.length,
      tense: 'past',
      perspective: 'third',
      characterVoices: {},
      commonPhrases: []
    }
  }

  // 分析当前章节
  const currentStyle = analyzeChapterStyle(chapter)
  
  // 使用AI进行深度分析
  const aiDimensions = await analyzeWithAI(chapter, baselineProfile)

  // 检测段落偏差
  const deviations: StyleDeviation[] = []
  if (baselineProfile && chapter.content) {
    deviations.push(...detectParagraphDeviations(chapter.content, {
      avgSentenceLength: baselineProfile.avgSentenceLength,
      dialogueRatio: baselineProfile.dialogueRatio
    }))
  }

  // 计算总体评分
  let overallScore = 80
  if (baselineProfile) {
    const lengthDiff = Math.abs(currentStyle.avgSentenceLength - baselineProfile.avgSentenceLength) / baselineProfile.avgSentenceLength
    const dialogueDiff = Math.abs(currentStyle.dialogueRatio - baselineProfile.dialogueRatio) / Math.max(baselineProfile.dialogueRatio, 0.1)
    
    overallScore = Math.max(0, Math.min(100, 100 - (lengthDiff * 30 + dialogueDiff * 20)))
  }

  // 保存分析结果
  const profile: ChapterStyleProfile = {
    projectId,
    chapterId,
    profile: {
      ...currentStyle,
      tense: 'past',
      perspective: 'third',
      characterVoices: {}
    },
    analyzedAt: new Date()
  }

  await db.chapterStyleProfiles.put(profile)

  const recommendations: string[] = []
  if (overallScore < 80) {
    recommendations.push('建议检查句子长度分布，避免过长或过短的段落')
  }
  if (deviations.some((d: StyleDeviation) => d.deviationType === 'dialogue_heavy')) {
    recommendations.push('部分段落对话过于密集，建议增加场景描写平衡')
  }
  if (aiDimensions.some((d: StyleDimension) => d.score < 70)) {
    recommendations.push('建议整体润色以提升文风一致性')
  }

  return {
    projectId,
    chapterId,
    overallScore: Math.round(overallScore),
    dimensions: aiDimensions.map((d: StyleDimension) => ({
      ...d,
      deviations: deviations.filter((dev: StyleDeviation) => 
        d.name === 'sentenceLength' && dev.deviationType === 'too_long' ||
        d.name === 'sentenceLength' && dev.deviationType === 'too_short' ||
        d.name === 'descriptionDensity' && dev.deviationType === 'dialogue_heavy'
      )
    })),
    recommendations,
    analyzedAt: new Date()
  }
}

/**
 * 批量检测项目所有章节的文风一致性
 */
export async function analyzeProjectStyle(
  projectId: number
): Promise<Map<number, StyleConsistencyReport>> {
  const chapters = await db.outlineNodes
    .where('projectId')
    .equals(projectId)
    .filter((n: OutlineNode) => n.type === 'chapter' && !!n.content)
    .toArray()

  const results = new Map<number, StyleConsistencyReport>()

  for (const chapter of chapters) {
    if (chapter.id) {
      try {
        const report = await analyzeStyleConsistency(projectId, chapter.id)
        results.set(chapter.id, report)
      } catch (error) {
        console.error(`Failed to analyze chapter ${chapter.id}:`, error)
      }
    }
  }

  return results
}
