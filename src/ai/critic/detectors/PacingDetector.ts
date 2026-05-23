/**
 * PacingDetector - V38
 * Detects pacing issues in story structure
 */

import type { Detector, QualityIssue, CriticContext, ChapterContext } from '../types'

export interface PacingIssue {
  type: 'pacing'
  chapterIndex: number
  issueKind: 'too_short' | 'too_long' | 'flat' | 'rush' | 'drag'
  intensity: number // 0-1, how severe
  peak?: boolean // is this a climax point
}

export class PacingDetector implements Detector {
  name = 'pacing'

  private readonly IDEAL_CHAPTER_LENGTH = 3000 // characters
  private readonly MIN_CHAPTER_LENGTH = 800
  private readonly MAX_CHAPTER_LENGTH = 8000
  private readonly FLAT_THRESHOLD = 0.3 // action density below this is flat

  async detect(context: CriticContext): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    const { chapters } = context

    if (!chapters || chapters.length === 0) {
      return issues
    }

    // Analyze chapter lengths
    const chapterLengths = chapters.map((ch, idx) => ({
      index: idx,
      length: ch.content.length,
      title: ch.chapterTitle || `第${idx + 1}章`
    }))

    // Check for length anomalies
    const avgLength = chapterLengths.reduce((sum, ch) => sum + ch.length, 0) / chapters.length
    
    for (const chapter of chapterLengths) {
      if (chapter.length < this.MIN_CHAPTER_LENGTH) {
        issues.push({
          type: 'pacing',
          severity: 'info',
          position: { chapter: chapter.index, start: 0, end: chapter.length },
          message: `章节"${chapter.title}"过短 (${chapter.length}字)，可能缺乏足够的发展`,
          suggestion: `考虑增加${this.IDEAL_CHAPTER_LENGTH - chapter.length}字的篇幅来充分展开情节`,
          priority: 'low'
        })
      } else if (chapter.length > this.MAX_CHAPTER_LENGTH) {
        issues.push({
          type: 'pacing',
          severity: 'warning',
          position: { chapter: chapter.index, start: 0, end: chapter.length },
          message: `章节"${chapter.title}"过长 (${chapter.length}字)，可能导致阅读疲劳`,
          suggestion: `考虑拆分为两个或多个章节，或精简内容`,
          priority: 'medium'
        })
      }

      // Check for flat chapters (low action density)
      const chapterContext = chapters[chapter.index]
      const actionDensity = this.calculateActionDensity(chapterContext)
      
      if (actionDensity < this.FLAT_THRESHOLD && chapter.length > 1500) {
        issues.push({
          type: 'pacing',
          severity: 'info',
          position: { chapter: chapter.index, start: 0, end: chapter.length },
          message: `章节"${chapter.title}"节奏平淡，缺乏明显的冲突或进展`,
          suggestion: `添加新的冲突、决定或转折点来推动故事发展`,
          priority: 'medium'
        })
      }
    }

    // Detect pacing curve issues
    const pacingIssues = this.detectPacingCurve(chapterLengths, avgLength)
    issues.push(...pacingIssues)

    return issues
  }

  async getScore(context: CriticContext): Promise<number> {
    const issues = await this.detect(context)
    
    if (issues.length === 0) return 100
    
    const errorPenalty = issues.filter(i => i.severity === 'error').length * 25
    const warningPenalty = issues.filter(i => i.severity === 'warning').length * 10
    const infoPenalty = issues.filter(i => i.severity === 'info').length * 5
    
    return Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty)
  }

  private calculateActionDensity(chapter: ChapterContext): number {
    // Action keywords: conflict, decision, change, revelation
    const actionPatterns = [
      /决定|选择|必须|应该|要|想要|计划|准备/,
      /冲突|争吵|打架|争论|对抗|抵制/,
      /发现|揭示|揭露|暴露|真相|秘密/,
      /突然|忽然|竟然|居然|猛然|骤然/,
      /改变|变化|转折|突破|进展/,
    ]

    let actionCount = 0
    for (const paragraph of chapter.paragraphs) {
      for (const pattern of actionPatterns) {
        if (pattern.test(paragraph)) {
          actionCount++
        }
      }
    }

    // Normalize by chapter length
    const normalizedLength = Math.max(chapter.content.length, 1)
    return Math.min(1, (actionCount * 100) / normalizedLength)
  }

  private detectPacingCurve(chapterLengths: { index: number; length: number; title: string }[], avgLength: number): QualityIssue[] {
    const issues: QualityIssue[] = []

    // Check for sudden length changes (rushing or dragging)
    for (let i = 1; i < chapterLengths.length; i++) {
      const prev = chapterLengths[i - 1]
      const curr = chapterLengths[i]
      const ratio = curr.length / prev.length

      if (ratio < 0.3) {
        // Very short after long - rushing
        issues.push({
          type: 'pacing',
          severity: 'warning',
          position: { chapter: curr.index, start: 0, end: curr.length },
          message: `章节"${curr.title}"相比上一章大幅缩短，节奏突然加快`,
          suggestion: `检查是否跳过太多情节，或考虑在两章之间增加过渡`,
          priority: 'medium'
        })
      } else if (ratio > 3.5) {
        // Very long after short - dragging
        issues.push({
          type: 'pacing',
          severity: 'warning',
          position: { chapter: curr.index, start: 0, end: curr.length },
          message: `章节"${curr.title}"相比上一章大幅增长，内容可能过于冗长`,
          suggestion: `检查是否有不必要的细节描写，或拆分为多个章节`,
          priority: 'low'
        })
      }
    }

    // Check for climax positioning (typically in later chapters)
    if (chapterLengths.length >= 3) {
      const lastThird = chapterLengths.slice(Math.floor(chapterLengths.length * 2 / 3))
      const firstThird = chapterLengths.slice(0, Math.floor(chapterLengths.length / 3))
      
      const lastThirdAvg = lastThird.reduce((sum, ch) => sum + ch.length, 0) / lastThird.length
      const firstThirdAvg = firstThird.reduce((sum, ch) => sum + ch.length, 0) / firstThird.length

      // Climax chapters should typically be longer
      if (lastThirdAvg < firstThirdAvg * 0.8) {
        issues.push({
          type: 'pacing',
          severity: 'info',
          position: { chapter: lastThird[0].index, start: 0, end: lastThird[0].length },
          message: `后期章节平均长度低于前期，高潮部分可能不够突出`,
          suggestion: `考虑在后期章节增加更多细节和发展，提升高潮效果`,
          priority: 'low'
        })
      }
    }

    return issues
  }
}