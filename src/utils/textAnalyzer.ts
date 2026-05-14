export interface WordFrequency {
  word: string
  count: number
  percentage: number
}

export interface TextAnalysis {
  totalWords: number
  uniqueWords: number
  topWords: WordFrequency[]
  chapterTopWords: WordFrequency[]
  repeatedWords: RepeatedWord[]
}

export interface RepeatedWord {
  word: string
  positions: number[]  // paragraph index positions
  count: number
}

// Built-in Chinese stop words
const ZH_STOP_WORDS = new Set([
  '的', '了', '是', '在', '和', '与', '为', '有', '我', '他', '她', '它', '们',
  '这', '那', '就', '也', '而', '且', '但', '或', '如果', '因为', '所以', '等',
  '可以', '没有', '一个', '一些', '什么', '怎么', '自己', '这个', '那个', '被',
  '把', '让', '给', '向', '到', '从', '会', '能', '要', '去', '来', '看', '想',
  '说', '做', '用', '对', '不', '很', '都', '还', '又', '才', '已', '已经',
  '只', '更', '最', '第', '再', '比较', '非常', '特别', '真', '实在', '实在',
  '得', '地', '着', '过', '起来', '出来', '回来', '进来', '上来', '下来', '过来'
])

// Built-in English stop words
const EN_STOP_WORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need',
  'a', 'an', 'and', 'or', 'but', 'if', 'else', 'when', 'then', 'so',
  'at', 'by', 'for', 'in', 'of', 'on', 'to', 'with', 'as', 'from', 'into', 'through',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'why', 'how',
  'not', 'no', 'yes', 'all', 'any', 'some', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once',
  'here', 'there', 'now', 'just', 'also', 'very', 'too', 'only', 'even', 'still'
])

/**
 * Tokenize Chinese text into words (character-level + bi-gram for better accuracy)
 */
function tokenizeChinese(text: string): string[] {
  const tokens: string[] = []
  // Remove whitespace and split into paragraphs
  const cleaned = text.replace(/\s+/g, '')
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    // Skip punctuation and numbers
    if (/[\u4e00-\u9fff]/.test(char)) {
      tokens.push(char)
      // Add bi-gram for better context
      if (i + 1 < cleaned.length && /[\u4e00-\u9fff]/.test(cleaned[i + 1])) {
        tokens.push(cleaned[i] + cleaned[i + 1])
      }
    }
  }
  return tokens
}

/**
 * Tokenize English text into words
 */
function tokenizeEnglish(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
}

/**
 * Detect language of text
 */
function detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
  const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const enWords = (text.match(/[a-zA-Z]+/g) || []).length
  
  if (zhChars > enWords) return 'zh'
  if (enWords > zhChars) return 'en'
  return 'mixed'
}

/**
 * Calculate word frequencies from tokens
 */
function calculateFrequencies(tokens: string[], stopWords: Set<string>): Map<string, number> {
  const freq = new Map<string, number>()
  for (const token of tokens) {
    if (stopWords.has(token) || token.length < 2) continue
    freq.set(token, (freq.get(token) || 0) + 1)
  }
  return freq
}

/**
 * Detect repeated words in consecutive paragraphs
 */
function detectRepeatedWords(paragraphs: string[], threshold: number = 3): RepeatedWord[] {
  const repeated: RepeatedWord[] = []
  const wordCounts = new Map<string, number[]>()
  
  paragraphs.forEach((para, paraIndex) => {
    if (!para.trim()) return
    
    // Count words in this paragraph
    const tokens = [...tokenizeChinese(para), ...tokenizeEnglish(para)]
    const paraFreq = calculateFrequencies(tokens, new Set())
    
    paraFreq.forEach((count, word) => {
      if (count >= threshold) {
        if (!wordCounts.has(word)) {
          wordCounts.set(word, [])
        }
        wordCounts.get(word)!.push(paraIndex)
      }
    })
  })
  
  wordCounts.forEach((positions, word) => {
    if (positions.length > 0) {
      repeated.push({ word, positions, count: positions.length })
    }
  })
  
  return repeated.sort((a, b) => b.count - a.count)
}

/**
 * Analyze text and return word frequency statistics
 */
export function analyzeText(
  fullText: string,
  chapterText: string = '',
  options: { topN?: number; stopWords?: Set<string> } = {}
): TextAnalysis {
  const { topN = 20 } = options
  
  const lang = detectLanguage(fullText)
  const stopWords = options.stopWords || (lang === 'zh' ? ZH_STOP_WORDS : EN_STOP_WORDS)
  
  // Tokenize full text
  const fullTokens = lang === 'zh' || lang === 'mixed'
    ? [...tokenizeChinese(fullText), ...(lang === 'mixed' ? tokenizeEnglish(fullText) : [])]
    : tokenizeEnglish(fullText)
  
  const fullFreq = calculateFrequencies(fullTokens, stopWords)
  const totalWords = fullTokens.filter(t => !stopWords.has(t) && t.length >= 2).length
  const uniqueWords = fullFreq.size
  
  // Get top N words
  const sorted = Array.from(fullFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
  
  const topWords: WordFrequency[] = sorted.map(([word, count]) => ({
    word,
    count,
    percentage: totalWords > 0 ? Math.round((count / totalWords) * 10000) / 100 : 0
  }))
  
  // Analyze chapter text if provided
  let chapterTopWords: WordFrequency[] = []
  if (chapterText) {
    const chapterTokens = lang === 'zh' || lang === 'mixed'
      ? [...tokenizeChinese(chapterText), ...(lang === 'mixed' ? tokenizeEnglish(chapterText) : [])]
      : tokenizeEnglish(chapterText)
    
    const chapterFreq = calculateFrequencies(chapterTokens, stopWords)
    const chapterTotal = chapterTokens.filter(t => !stopWords.has(t) && t.length >= 2).length
    
    const chapterSorted = Array.from(chapterFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    
    chapterTopWords = chapterSorted.map(([word, count]) => ({
      word,
      count,
      percentage: chapterTotal > 0 ? Math.round((count / chapterTotal) * 10000) / 100 : 0
    }))
  }
  
  // Detect repeated words
  const paragraphs = fullText.split(/\n+/).filter(p => p.trim())
  const repeatedWords = detectRepeatedWords(paragraphs, 3)
  
  return {
    totalWords,
    uniqueWords,
    topWords,
    chapterTopWords,
    repeatedWords
  }
}

/**
 * Get stop words set for a language
 */
export function getStopWords(lang: 'zh' | 'en'): Set<string> {
  return lang === 'zh' ? ZH_STOP_WORDS : EN_STOP_WORDS
}
