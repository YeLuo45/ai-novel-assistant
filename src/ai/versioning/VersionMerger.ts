import type { WritingVersion } from './types'

export class VersionMerger {
  /**
   * 合并多个版本
   */
  merge(
    versions: WritingVersion[],
    selections: { [versionId: string]: number[] }
  ): string {
    const sortedVersions = versions.sort((a, b) => 
      a.versionNumber - b.versionNumber)
    
    const paragraphsList = sortedVersions.map(v => v.content.split('\n\n'))
    const maxLen = Math.max(...paragraphsList.map(p => p.length))
    
    const mergedParagraphs: string[] = []
    
    for (let i = 0; i < maxLen; i++) {
      let selectedContent = ''
      
      for (let vIdx = 0; vIdx < sortedVersions.length; vIdx++) {
        const versionId = sortedVersions[vIdx].id
        const selectedParagraphs = selections[versionId] || []
        
        if (selectedParagraphs.includes(i) && paragraphsList[vIdx][i]) {
          selectedContent = paragraphsList[vIdx][i]
          break
        }
      }
      
      if (!selectedContent) {
        const paragraphArray = paragraphsList.find(paragraphs => paragraphs[i])
        const firstNonEmpty = paragraphArray ? paragraphArray[i]?.trim() : undefined
        if (firstNonEmpty) selectedContent = firstNonEmpty
      }
      
      if (selectedContent) {
        mergedParagraphs.push(selectedContent)
      }
    }
    
    return mergedParagraphs.join('\n\n')
  }
  
  /**
   * 智能合并提示词构建
   */
  buildMergePrompt(versions: WritingVersion[]): string {
    return `请合并以下${versions.length}个版本的优点，生成最终版本。

版本信息：
${versions.map((v, i) => `
【版本${i + 1}】风格：${v.analysis.tone}，节奏：${v.analysis.pacing}，情感强度：${v.analysis.emotionalIntensity}
${v.content.slice(0, 800)}${v.content.length > 800 ? '...(省略)' : ''}
`).join('\n')}

要求：
1. 选择每个版本最精彩的段落
2. 保持整体连贯性
3. 输出合并后的完整内容`
  }
}

export const versionMerger = new VersionMerger()
