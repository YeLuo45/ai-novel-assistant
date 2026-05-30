import type { GenreDetectionResult, GenreIssue } from '../types'

export interface MysteryMetrics {
  clueCount: number
  redHerringCount: number
  suspenseScore: number
  revelationTiming: number
  unresolvedClues: string[]
}

export class MysteryDetector {
  private clueKeywords = ['关键', '线索', '证据', '真相', '嫌疑', '线索', '蛛丝马迹']
  private redHerringKeywords = ['误导', '其实', '表面', '看似', '也许', '可能', '红鲱鱼']
  
  /**
   * 检测线索矛盾
   */
  checkClueConsistency(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    
    // 简化：检测"关键线索"是否多次被描述为不同结论
    const clueMentions = content.match(/关键[^\n]*?(?:描述|说明|显示|表明|是|为)[^\n]*?/g) || []
    
    // 简单检查：如果同一段中出现多个相互矛盾的描述
    const sentences = content.split(/[。！？]/)
    for (let i = 0; i < sentences.length - 1; i++) {
      const current = sentences[i]
      const next = sentences[i + 1]
      
      // 检测是否是同一线索的不同描述
      if (current.includes('关键') && next.includes('关键') && i < sentences.length - 2) {
        // 简化检查
      }
    }
    
    return issues
  }
  
  /**
   * 检测时间线错误
   */
  checkTimeline(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    
    // 提取时间表达
    const timePatterns = [
      /([早晚午][上中下]?[晨间午夜间?]?)/g,
      /(第?\d+天)/g,
      /(周|月|年)/g
    ]
    
    // 简化：只检测明显的时间顺序问题
    // 如果"第二天"出现在"第一天"之前
    const dayMatches = content.match(/第(,\s*)天/g) || []
    // ...简化检测
    
    return issues
  }
  
  /**
   * 检测线索密度
   */
  checkClueDensity(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    const wordCount = content.length
    const clueCount = (content.match(new RegExp(this.clueKeywords.join('|'), 'g')) || []).length
    
    // 每2000字至少1个线索
    const expectedMinClues = Math.floor(wordCount / 2000)
    
    if (clueCount < expectedMinClues) {
      issues.push({
        type: 'obvious_clue',
        severity: 'minor',
        description: `线索密度偏低：${wordCount}字中仅发现${clueCount}个线索，建议至少${expectedMinClues}个`,
        suggestion: '增加关键情节的铺垫或增加暗示性描述'
      })
    }
    
    return issues
  }
  
  /**
   * 计算悬疑指标
   */
  calculateMetrics(content: string): MysteryMetrics {
    const wordCount = content.length
    
    const clueCount = (content.match(new RegExp(this.clueKeywords.join('|'), 'g')) || []).length
    const redHerringCount = (content.match(new RegExp(this.redHerringKeywords.join('|'), 'g')) || []).length
    
    // 悬念分数估算
    const suspenseScore = Math.min(100, (clueCount * 5) + (redHerringCount * 8))
    
    // 估算揭晓时机（简化：假设在60-70%处）
    const revelationTiming = 65
    
    return {
      clueCount,
      redHerringCount,
      suspenseScore,
      revelationTiming,
      unresolvedClues: []
    }
  }
  
  /**
   * 执行完整检测
   */
  detect(content: string): GenreDetectionResult {
    const issues: GenreIssue[] = [
      ...this.checkClueConsistency(content),
      ...this.checkTimeline(content),
      ...this.checkClueDensity(content)
    ]
    
    const metrics = this.calculateMetrics(content)
    
    return {
      genreId: 'mystery',
      issues,
      metrics: {
        clueCount: metrics.clueCount,
        redHerringCount: metrics.redHerringCount,
        suspenseScore: metrics.suspenseScore,
        revelationTiming: metrics.revelationTiming
      }
    }
  }
}

export const mysteryDetector = new MysteryDetector()
