/**
 * 敏感词检测器
 */

import { getAllSensitiveWords, getCategoryColorClass } from './sensitiveWords'

export interface DetectionResult {
  word: string
  category: string
  label: string
  color: string
  position: number
  replacement: string
}

/**
 * 检测文本中的敏感词
 * @param text 要检测的文本
 * @returns 检测结果数组
 */
export function detectSensitiveWords(text: string): DetectionResult[] {
  const results: DetectionResult[] = []
  const wordMap = getAllSensitiveWords()
  
  // 构建敏感词正则表达式（按长度降序排列，避免部分匹配问题）
  const sortedWords = Array.from(wordMap.keys()).sort((a, b) => b.length - a.length)
  
  if (sortedWords.length === 0) return results
  
  // 创建正则表达式，匹配所有敏感词
  const escapedWords = sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(escapedWords.join('|'), 'gi')
  
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const matchedWord = match[0]
    const wordInfo = wordMap.get(matchedWord.toLowerCase())
    
    if (wordInfo) {
      results.push({
        word: matchedWord,
        category: wordInfo.category,
        label: wordInfo.label,
        color: wordInfo.color,
        position: match.index,
        replacement: '*'.repeat(matchedWord.length)
      })
    }
  }
  
  // 按位置排序
  results.sort((a, b) => a.position - b.position)
  
  return results
}

/**
 * 高亮文本中的敏感词（返回带标记的HTML）
 * @param text 原文本
 * @param results 检测结果
 * @returns 带高亮的HTML字符串
 */
export function highlightSensitiveWords(text: string, results: DetectionResult[]): string {
  if (results.length === 0) return text
  
  let highlightedText = ''
  let lastIndex = 0
  
  for (const result of results) {
    // 添加匹配之前的文本
    highlightedText += escapeHtml(text.slice(lastIndex, result.position))
    
    // 添加高亮标记的敏感词
    const colorClass = getHighlightClass(result.color)
    highlightedText += `<mark class="px-1 rounded ${colorClass}">${escapeHtml(result.word)}</mark>`
    
    lastIndex = result.position + result.word.length
  }
  
  // 添加最后一段文本
  highlightedText += escapeHtml(text.slice(lastIndex))
  
  return highlightedText
}

/**
 * 一键替换所有敏感词为*号
 * @param text 原文本
 * @param results 检测结果
 * @returns 替换后的文本
 */
export function replaceSensitiveWords(text: string, results: DetectionResult[]): string {
  if (results.length === 0) return text
  
  // 从后往前替换，避免位置偏移问题
  const sortedResults = [...results].sort((a, b) => b.position - a.position)
  
  let replacedText = text
  for (const result of sortedResults) {
    replacedText = replacedText.slice(0, result.position) + 
                   result.replacement + 
                   replacedText.slice(result.position + result.word.length)
  }
  
  return replacedText
}

/**
 * 获取高亮颜色类名
 */
function getHighlightClass(color: string): string {
  const colorMap: Record<string, string> = {
    red: 'bg-red-200 text-red-800',
    orange: 'bg-orange-200 text-orange-800',
    purple: 'bg-purple-200 text-purple-800',
    blue: 'bg-blue-200 text-blue-800',
    gray: 'bg-gray-200 text-gray-800'
  }
  return colorMap[color] || colorMap.gray
}

/**
 * HTML转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * 获取检测统计信息
 */
export function getDetectionStats(results: DetectionResult[]): Record<string, number> {
  const stats: Record<string, number> = {}
  
  for (const result of results) {
    stats[result.category] = (stats[result.category] || 0) + 1
  }
  
  return stats
}
