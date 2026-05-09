export interface DraftConfig {
  enabled: boolean
  initialQuality: 'low' | 'medium' | 'high'
  refinementPasses: number
  qualityThreshold: number
}

export interface Draft {
  content: string
  quality: number
  version: number
  timestamp: number
}

export class DraftMode {
  private config: DraftConfig = {
    enabled: false,
    initialQuality: 'medium',
    refinementPasses: 2,
    qualityThreshold: 70
  }
  
  private currentDraft: Draft | null = null
  
  enable(config?: Partial<DraftConfig>): void {
    this.config = { ...this.config, ...config, enabled: true }
  }
  
  disable(): void {
    this.config.enabled = false
  }
  
  async generateInitialDraft(
    prompt: string,
    generateFn: (prompt: string, quality: string) => Promise<string>
  ): Promise<Draft> {
    const qualityMap = {
      low: '简洁版',
      medium: '标准版', 
      high: '精细版'
    }
    
    const quality = qualityMap[this.config.initialQuality]
    const content = await generateFn(prompt, quality)
    const qualityScore = this.assessQuality(content)
    
    this.currentDraft = {
      content,
      quality: qualityScore,
      version: 1,
      timestamp: Date.now()
    }
    
    return this.currentDraft
  }
  
  async refineDraft(
    feedback: string,
    refineFn: (content: string, feedback: string) => Promise<string>
  ): Promise<Draft> {
    if (!this.currentDraft) {
      throw new Error('No draft to refine')
    }
    
    const refined = await refineFn(this.currentDraft.content, feedback)
    const qualityScore = this.assessQuality(refined)
    
    this.currentDraft = {
      content: refined,
      quality: qualityScore,
      version: this.currentDraft.version + 1,
      timestamp: Date.now()
    }
    
    return this.currentDraft
  }
  
  private assessQuality(content: string): number {
    let score = 50
    
    if (content.length > 500) score += 10
    if (content.length > 1000) score += 10
    
    if (content.includes('。') && content.includes('，')) score += 5
    if (content.includes('\n')) score += 5
    
    const words = content.split(/[\s,\n]/)
    const uniqueWords = new Set(words)
    if (uniqueWords.size < words.length * 0.5) score -= 10
    
    return Math.max(0, Math.min(100, score))
  }
  
  isQualitySufficient(): boolean {
    if (!this.currentDraft) return false
    return this.currentDraft.quality >= this.config.qualityThreshold
  }
  
  needsMoreRefinement(): boolean {
    if (!this.currentDraft) return false
    return this.currentDraft.version < this.config.refinementPasses && !this.isQualitySufficient()
  }
  
  getCurrentDraft(): Draft | null {
    return this.currentDraft
  }
  
  getConfig(): DraftConfig {
    return { ...this.config }
  }
  
  reset(): void {
    this.currentDraft = null
  }
}

export const draftMode = new DraftMode()
