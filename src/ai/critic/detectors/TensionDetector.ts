/**
 * TensionDetector - V38
 * Detects tension and suspense issues across chapters
 */

import type { Detector, QualityIssue, CriticContext, ChapterContext } from '../types'

export interface TensionIssue {
  type: 'tension'
  chapterIndex: number
  issueKind: 'low_suspense' | 'flat_tension' | 'resolved_too_fast' | 'no_escalation'
  tensionLevel: number // 0-1
}

export class TensionDetector implements Detector {
  name = 'tension'

  private readonly SUSPENSE_KEYWORDS = [
    '突然', '忽然', '竟然', '居然', '猛地', '骤然', '顷刻', '瞬间',
    '但是', '然而', '可是', '不过', '只是', '虽然', '尽管',
    '疑问', '问题', '秘密', '谜团', '隐藏', '隐瞒', '欺骗', '谎言',
    '危险', '威胁', '恐惧', '担忧', '不安', '紧张', '危机',
    '等待', '期待', '希望', '绝望', '猜测', '推测'
  ]

  private readonly CONFLICT_KEYWORDS = [
    '争吵', '冲突', '打架', '争论', '对抗', '抵制', '反对', '拒绝',
    '威胁', '恐吓', '逼迫', '强迫', '命令', '要求', '质问', '质问',
    '矛盾', '分歧', '误会', '误解', '争执', '吵架', '打架'
  ]

  private readonly RESOLUTION_KEYWORDS = [
    '解决', '化解', '消除', '解除', '摆脱', '克服', '战胜', '击败',
    '和好', '和解', '妥协', '让步', '原谅', '释怀', '放心', '安心'
  ]

  async detect(context: CriticContext): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = []
    const { chapters } = context

    if (!chapters || chapters.length === 0) {
      return issues
    }

    // Calculate tension curve across chapters
    const tensionLevels = chapters.map((ch, idx) => ({
      index: idx,
      title: ch.chapterTitle || `第${idx + 1}章`,
      suspense: this.countKeywordDensity(ch.content, this.SUSPENSE_KEYWORDS),
      conflict: this.countKeywordDensity(ch.content, this.CONFLICT_KEYWORDS),
      resolution: this.countKeywordDensity(ch.content, this.RESOLUTION_KEYWORDS),
      length: ch.content.length
    }))

    // Calculate normalized tension score
    for (const chapter of tensionLevels) {
      const rawTension = (chapter.suspense + chapter.conflict * 1.5 - chapter.resolution * 0.5)
      chapter.tensionLevel = Math.max(0, Math.min(1, rawTension / 50))
    }

    // Check for tension issues
    for (const chapter of tensionLevels) {
      // Low suspense
      if (chapter.suspense < 0.3 && chapter.length > 1500) {
        issues.push({
          type: 'tension',
          severity: 'info',
          position: { chapter: chapter.index, start: 0, end: chapter.length },
          message: `章节"${chapter.title}"悬念不足，缺乏"突然"、"但是"等转折词`,
          suggestion: `添加意想不到的转折、新的问题或悬而未决的情节来增加悬念`,
          priority: 'low'
        })
      }

      // Low conflict
      if (chapter.conflict < 0.2 && chapter.length > 1500) {
        issues.push({
          type: 'tension',
          severity: 'info',
          position: { chapter: chapter.index, start: 0, end: chapter.length },
          message: `章节"${chapter.title}"冲突不足，缺少角色间的矛盾或对抗`,
          suggestion: `引入新的冲突、误会或对抗来增加故事张力`,
          priority: 'medium'
        })
      }
    }

    // Check tension escalation pattern
    const escalationIssues = this.checkEscalation(tensionLevels, chapters)
    issues.push(...escalationIssues)

    // Check for flat tension (no variation across story)
    const tensionVariation = this.calculateVariation(tensionLevels.map(c => c.tensionLevel))
    if (tensionVariation < 0.1 && chapters.length >= 5) {
      issues.push({
        type: 'tension',
        severity: 'warning',
        position: { chapter: 0, start: 0, end: 100 },
        message: `故事整体张力缺乏变化，从头到尾节奏相似`,
        suggestion: `在关键情节点增加张力峰值（高潮），在其他部分适当平缓`,
        priority: 'medium'
      })
    }

    // Check for tension resolved too quickly
    for (let i = 1; i < tensionLevels.length; i++) {
      const prev = tensionLevels[i - 1]
      const curr = tensionLevels[i]
      
      // If previous chapter had high tension but current has very low
      if (prev.tensionLevel > 0.6 && curr.tensionLevel < 0.2) {
        issues.push({
          type: 'tension',
          severity: 'info',
          position: { chapter: curr.index, start: 0, end: curr.length },
          message: `章节"${curr.title}"张力突然消失，冲突被过快解决`,
          suggestion: `让冲突和悬念保持更长时间，增加故事的起伏感`,
          priority: 'low'
        })
      }
    }

    return issues
  }

  async getScore(context: CriticContext): Promise<number> {
    const issues = await this.detect(context)
    
    if (issues.length === 0) return 100
    
    const errorPenalty = issues.filter(i => i.severity === 'error').length * 25
    const warningPenalty = issues.filter(i => i.severity === 'warning').length * 15
    const infoPenalty = issues.filter(i => i.severity === 'info').length * 5
    
    return Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty)
  }

  private countKeywordDensity(content: string, keywords: string[]): number {
    let count = 0
    for (const keyword of keywords) {
      // Use word boundary for Chinese
      const pattern = new RegExp(keyword, 'g')
      let match
      while ((match = pattern.exec(content)) !== null) {
        count++
      }
    }
    // Normalize by content length
    return (count * 100) / Math.max(content.length, 1)
  }

  private calculateVariation(values: number[]): number {
    if (values.length < 2) return 0
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    return Math.sqrt(variance)
  }

  private checkEscalation(tensionLevels: TensionLevel[], chapters: ChapterContext[]): QualityIssue[] {
    const issues: QualityIssue[] = []

    // Check if tension generally increases toward the end
    const firstQuarter = tensionLevels.slice(0, Math.floor(tensionLevels.length / 4))
    const lastQuarter = tensionLevels.slice(Math.floor(tensionLevels.length * 3 / 4))
    
    if (firstQuarter.length > 0 && lastQuarter.length > 0) {
      const firstQuarterAvg = firstQuarter.reduce((sum, c) => sum + c.tensionLevel, 0) / firstQuarter.length
      const lastQuarterAvg = lastQuarter.reduce((sum, c) => sum + c.tensionLevel, 0) / lastQuarter.length

      if (lastQuarterAvg < firstQuarterAvg * 0.5) {
        issues.push({
          type: 'tension',
          severity: 'warning',
          position: { chapter: lastQuarter[0].index, start: 0, end: chapters[lastQuarter[0].index].content.length },
          message: `后期章节张力低于前期，故事缺乏逐步升级的紧张感`,
          suggestion: `在故事后期增加更多冲突和悬念，让高潮更加有力`,
          priority: 'high'
        })
      }
    }

    // Look for climax points (local maximums in tension)
    let hasClimax = false
    for (let i = 1; i < tensionLevels.length - 1; i++) {
      if (tensionLevels[i].tensionLevel > tensionLevels[i - 1].tensionLevel &&
          tensionLevels[i].tensionLevel > tensionLevels[i + 1].tensionLevel &&
          tensionLevels[i].tensionLevel > 0.5) {
        hasClimax = true
        break
      }
    }

    if (!hasClimax && tensionLevels.length >= 5) {
      issues.push({
        type: 'tension',
        severity: 'info',
        position: { chapter: Math.floor(tensionLevels.length / 2), start: 0, end: 100 },
        message: `故事中缺少明显的高潮点，张力曲线较为平坦`,
        suggestion: `在关键情节点设置明显的冲突升级，形成紧张的高潮`,
        priority: 'medium'
      })
    }

    return issues
  }
}

interface TensionLevel {
  index: number
  title: string
  suspense: number
  conflict: number
  resolution: number
  length: number
  tensionLevel: number
}