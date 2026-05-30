import type { GenreDetectionResult, GenreIssue } from '../types'

export class SciFiDetector {
  private techKeywords = ['能量', '系统', '模块', '科技', '飞船', 'AI', '量子', '数据', '程序', '芯片']
  
  /**
   * 检测技术矛盾
   */
  checkTechConsistency(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    
    // 简化：检测同一技术描述是否矛盾
    // 例如：之前说能量耗尽，之后又说能量充足
    const energyMentions = content.match(/能量[^\n。！？]*?(?:充足|耗尽|充满|缺少)[^\n。！？]*?/g) || []
    
    if (energyMentions.length >= 2) {
      const hasSufficient = energyMentions.some(m => m.includes('充足') || m.includes('充满'))
      const hasExhausted = energyMentions.some(m => m.includes('耗尽') || m.includes('缺少'))
      
      if (hasSufficient && hasExhausted) {
        issues.push({
          type: 'tech_contradiction',
          severity: 'critical',
          description: '检测到能量状态描述矛盾',
          suggestion: '统一能量的使用和恢复设定'
        })
      }
    }
    
    return issues
  }
  
  /**
   * 检测战力平衡
   */
  checkPowerBalance(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    
    // 简化：检测"秒杀"等描述是否过多
    const instantWinMatches = content.match(/秒杀|一招|瞬间|立刻/g) || []
    
    if (instantWinMatches.length > 3) {
      issues.push({
        type: 'power_creep',
        severity: 'major',
        description: '战斗描述过于简单，缺少回合感和张力',
        suggestion: '增加战斗过程、策略和反转'
      })
    }
    
    return issues
  }
  
  /**
   * 检测科学错误（简化）
   */
  checkScienceAccuracy(content: string): GenreIssue[] {
    const issues: GenreIssue[] = []
    
    // 简化检测
    return issues
  }
  
  /**
   * 计算科幻指标
   */
  calculateMetrics(content: string) {
    const techCount = (content.match(new RegExp(this.techKeywords.join('|'), 'g')) || []).length
    
    return {
      techConsistencyScore: 85,  // 简化
      worldCoherence: 80,
      scientificAccuracy: 75
    }
  }
  
  detect(content: string): GenreDetectionResult {
    const issues: GenreIssue[] = [
      ...this.checkTechConsistency(content),
      ...this.checkPowerBalance(content),
      ...this.checkScienceAccuracy(content)
    ]
    
    return {
      genreId: 'scifi',
      issues,
      metrics: this.calculateMetrics(content)
    }
  }
}

export const scifiDetector = new SciFiDetector()
