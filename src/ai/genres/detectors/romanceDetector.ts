import type { GenreDetectionResult, GenreIssue } from '../types'

export interface RomanceMetrics {
  sweetnessIndex: number
  angstIndex: number
  relationshipProgress: number
  heartbeatMoments: number
}

export class RomanceDetector {
  private sweetKeywords = ['心动', '脸红', '喜欢', '爱', '甜蜜', '幸福', '拥抱', '亲吻', '告白', '表白', '牵着手', '依偎', '深情', '温柔']
  private angstKeywords = ['误会', '心痛', '眼泪', '悲伤', '痛苦', '争吵', '冷战', '失落', '绝望', '心碎', '哭泣', '委屈', '遗憾']
  private progressKeywords = ['表白', '确认关系', '牵手', '拥抱', '亲吻', '和好', '约会', '告白', '表明心意', '确定关系']
  
  /**
   * 计算言情指标
   */
  calculateMetrics(content: string): RomanceMetrics {
    const wordCount = content.length
    
    // 甜度
    let sweetCount = 0
    for (const keyword of this.sweetKeywords) {
      sweetCount += (content.match(new RegExp(keyword, 'g')) || []).length
    }
    const sweetnessIndex = Math.min(100, Math.round((sweetCount / wordCount) * 30000))
    
    // 虐度
    let angstCount = 0
    for (const keyword of this.angstKeywords) {
      angstCount += (content.match(new RegExp(keyword, 'g')) || []).length
    }
    const angstIndex = Math.min(100, Math.round((angstCount / wordCount) * 30000))
    
    // 关系进展
    let progressCount = 0
    for (const keyword of this.progressKeywords) {
      progressCount += (content.match(new RegExp(keyword, 'g')) || []).length
    }
    const relationshipProgress = Math.min(100, Math.round(progressCount * 15))
    
    // 心动时刻
    const heartbeatMoments = sweetCount + angstCount
    
    return {
      sweetnessIndex,
      angstIndex,
      relationshipProgress,
      heartbeatMoments
    }
  }
  
  /**
   * 检测关系停滞
   */
  checkRelationshipProgress(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    const wordCount = content.length
    const progressCount = (content.match(new RegExp(this.progressKeywords.join('|'), 'g')) || []).length
    
    // 每10000字至少有一次关系进展
    if (progressCount === 0 && wordCount > 5000) {
      issues.push({
        type: 'stagnant_relationship',
        severity: 'major',
        description: `关系进展停滞：${wordCount}字中未发现明显的关系进展事件`,
        suggestion: '增加角色间的互动、表白、误会、和好等推进关系的场景'
      })
    }
    
    return issues
  }
  
  /**
   * 检测甜虐平衡
   */
  checkSweetnessBalance(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    const metrics = this.calculateMetrics(content)
    
    // 甜度过高（连续5章以上无虐）
    if (metrics.sweetnessIndex > 70 && metrics.angstIndex < 10) {
      issues.push({
        type: 'too_sweet',
        severity: 'minor',
        description: '甜度过高，缺少情感冲突，可能导致剧情张力不足',
        suggestion: '增加误会、争执或外界压力等虐心情节'
      })
    }
    
    // 虐度过高
    if (metrics.angstIndex > 70 && metrics.sweetnessIndex < 10) {
      issues.push({
        type: 'too_angst',
        severity: 'minor',
        description: '虐度过高，读者可能疲劳',
        suggestion: '增加一些甜蜜互动或角色间的温馨时刻'
      })
    }
    
    return issues
  }
  
  /**
   * 执行完整检测
   */
  detect(content: string): GenreDetectionResult {
    const issues: GenreIssue[] = [
      ...this.checkRelationshipProgress(content),
      ...this.checkSweetnessBalance(content)
    ]
    
    const metrics = this.calculateMetrics(content)
    
    return {
      genreId: 'romance',
      issues,
      metrics: {
        sweetnessIndex: metrics.sweetnessIndex,
        angstIndex: metrics.angstIndex,
        relationshipProgress: metrics.relationshipProgress,
        heartbeatMoments: metrics.heartbeatMoments
      }
    }
  }
}

export const romanceDetector = new RomanceDetector()
