// 敏感词过滤器
const SENSITIVE_PATTERNS = [
  // 政治敏感词（简化示例）
  /\b(领导人|独裁|专制)\b/gi,
  // 色情低俗词（简化示例）
  /\b(赌博|毒品|走私)\b/gi,
]

export interface FilterResult {
  filtered: boolean
  issues: Array<{ word: string, index: number }>
  suggestion?: string
}

export function filterSensitiveWords(text: string): FilterResult {
  const issues: Array<{ word: string, index: number }> = []
  
  for (const pattern of SENSITIVE_PATTERNS) {
    let match
    const regex = new RegExp(pattern.source, pattern.flags)
    while ((match = regex.exec(text)) !== null) {
      issues.push({ word: match[0], index: match.index })
    }
  }

  return {
    filtered: issues.length > 0,
    issues,
    suggestion: issues.length > 0 
      ? '建议替换或删除敏感词汇' 
      : undefined
  }
}
