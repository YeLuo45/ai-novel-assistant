import type { WritingVersion, VersionOptions, VersionAnalysis, VersionStrategy } from './types'

export class MultiVersionGenerator {
  /**
   * 生成多个版本
   */
  async generateVersions(
    prompt: string,
    options: VersionOptions
  ): Promise<WritingVersion[]> {
    const versions: WritingVersion[] = []
    const strategies = this.getStrategies(options.strategy, options.count)
    
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i]
      const version = await this.generateSingleVersion(
        prompt,
        strategy,
        i + 1
      )
      versions.push(version)
    }
    
    return versions
  }
  
  /**
   * 生成单个版本
   */
  private async generateSingleVersion(
    prompt: string,
    strategy: VersionStrategy,
    versionNumber: number
  ): Promise<WritingVersion> {
    // 构建策略特定的提示词
    const enhancedPrompt = this.buildStrategyPrompt(prompt, strategy)
    const systemPrompt = this.getSystemPrompt(strategy)
    
    // 模拟LLM调用 - 实际项目中需要调用真实的LLM
    // 这里简化处理，生成模拟内容
    const content = await this.simulateGeneration(enhancedPrompt, systemPrompt, strategy)
    
    // 分析版本
    const analysis = this.analyzeVersion(content)
    
    return {
      id: `version_${Date.now()}_${versionNumber}`,
      versionNumber,
      createdAt: Date.now(),
      content,
      metadata: {
        strategy,
        wordCount: content.length,
        keyDifferences: [],
        strengths: [],
        weaknesses: []
      },
      analysis
    }
  }
  
  /**
   * 模拟生成（实际项目中替换为真实LLM调用）
   */
  private async simulateGeneration(
    prompt: string,
    _systemPrompt: string,
    strategy: VersionStrategy
  ): Promise<string> {
    // 模拟不同策略生成不同风格的内容
    const baseContent = this.extractCoreContent(prompt)
    
    switch (strategy) {
      case 'style_variation':
        return this.generateStyleVariation(baseContent)
      case 'plot_branch':
        return this.generatePlotBranch(baseContent)
      case 'pov_switch':
        return this.generatePovSwitch(baseContent)
      case 'tone_shift':
        return this.generateToneShift(baseContent)
      default:
        return this.generateStyleVariation(baseContent)
    }
  }
  
  private extractCoreContent(prompt: string): string {
    // 简化：从prompt中提取核心内容
    return prompt.slice(0, 200)
  }
  
  private generateStyleVariation(base: string): string {
    return `【风格变化版】

这是一个精心雕琢的文学性叙述。文字如流水般婉转，情感在字里行间若隐若现。

角色的内心世界被细腻地描绘，每一个细微的情绪波动都被捕捉并呈现。环境描写与人物心理交织，营造出独特的意境。

${base}

故事的节奏舒缓而有力，在平静的表面下暗藏着张力和期待。修辞手法丰富，比喻和象征的运用恰到好处，让读者在阅读过程中不断发现新的细节和深意。`
  }
  
  private generatePlotBranch(base: string): string {
    return `【情节分支版】

在这个版本中，故事走向了一个不同的发展方向。原本平静的表面下涌动着暗流，角色做出了意料之外但又在情理之中的选择。

情节的转折点被提前，冲突的种子早已埋下。现在，这些矛盾开始显现威力，推动故事进入一个新的阶段。

${base}

关键人物的命运发生了改变。他们不再是原先的旁观者或被动接受者，而是主动地塑造着故事的发展。这种转变不仅影响了情节的走向，也深刻地改变了角色之间的关系。`
  }
  
  private generatePovSwitch(base: string): string {
    return `【视角切换版】

从旁观者的角度看去，一切都有了不同的面貌。当视线从一个角色转移到另一个角色时，同样的事件呈现出截然不同的意义。

这是一个关于理解和误解的故事。每个人物都有自己独特的视角，而这些视角之间的碰撞和交融，构成了故事的核心张力。

${base}

通过切换视角，读者能够看到每个决定背后的复杂动机，感受到每个选择带来的代价与收获。这种多角度的叙述方式，让整个故事变得更加立体和真实。`
  }
  
  private generateToneShift(base: string): string {
    return `【语气变化版】

带着轻松而幽默的基调，故事展现了它不同的一面。即便是严肃的情节，也被赋予了某种独特的光彩。

角色的内心独白充满了自嘲和智慧，让读者在阅读的过程中不时会心一笑。这种处理方式并没有削弱故事的力量，反而让它变得更加亲切和易于接近。

${base}

然而，在幽默的外表之下，故事依然保持着它内在的深度和复杂性。轻松的语调掩盖不了情感的波澜，而那些隐藏在字里行间的隐喻和暗示，则等待着细心的读者去发掘。`
  }
  
  /**
   * 构建策略提示词
   */
  private buildStrategyPrompt(basePrompt: string, strategy: VersionStrategy): string {
    switch (strategy) {
      case 'style_variation':
        return `${basePrompt}\n\n【风格要求】采用文艺抒情的风格，注意句式变化和修辞手法的运用。`
      case 'plot_branch':
        return `${basePrompt}\n\n【情节要求】探索与传统不同的情节发展路线，给出令人意外但合理的故事走向。`
      case 'pov_switch':
        return `${basePrompt}\n\n【视角要求】从一个独特的视角叙述，突出该视角独有的观察和感受。`
      case 'tone_shift':
        return `${basePrompt}\n\n【语气要求】整体基调轻松幽默，但不失深度和内涵。`
      default:
        return basePrompt
    }
  }
  
  /**
   * 获取系统提示词
   */
  private getSystemPrompt(strategy: VersionStrategy): string {
    const base = '你是一个专业的小说写作助手，擅长根据不同要求生成高质量的文本。'
    
    switch (strategy) {
      case 'style_variation':
        return `${base}你擅长运用各种文学风格，从古典到现代，从诗意到写实。`
      case 'plot_branch':
        return `${base}你擅长设计有趣的情节转折和分支发展。`
      case 'pov_switch':
        return `${base}你擅长从不同人物视角讲述故事。`
      case 'tone_shift':
        return `${base}你擅长调节文字的基调和氛围。`
      default:
        return base
    }
  }
  
  /**
   * 分析版本
   */
  private analyzeVersion(content: string): VersionAnalysis {
    return {
      tone: this.detectTone(content),
      pacing: this.detectPacing(content),
      emotionalIntensity: this.calculateEmotionalIntensity(content),
      dialogueRatio: this.calculateDialogueRatio(content),
      descriptionDensity: this.calculateDescriptionDensity(content),
      conflictLevel: this.calculateConflictLevel(content)
    }
  }
  
  private detectTone(content: string): VersionAnalysis['tone'] {
    const formalIndicators = ['因此、然而、于是、倘若']
    const casualIndicators = ['咱们、啥、咋、不错']
    
    const hasFormal = formalIndicators.some(i => content.includes(i))
    const hasCasual = casualIndicators.some(i => content.includes(i))
    
    if (hasFormal && !hasCasual) return 'formal'
    if (hasCasual && !hasFormal) return 'casual'
    if (content.includes('！') || content.includes('哈哈')) return 'lively'
    if (content.includes('然而')) return 'serious'
    return 'casual'
  }
  
  private detectPacing(content: string): 'fast' | 'moderate' | 'slow' {
    const sentences = content.split(/[。！？]/)
    const avgLength = content.length / Math.max(sentences.length, 1)
    if (avgLength < 15) return 'fast'
    if (avgLength < 30) return 'moderate'
    return 'slow'
  }
  
  private calculateEmotionalIntensity(content: string): number {
    const emotionalWords = ['愤怒', '悲伤', '喜悦', '恐惧', '惊讶', '心痛', '激动', '幸福']
    let count = 0
    for (const word of emotionalWords) {
      const matches = content.match(new RegExp(word, 'g'))
      if (matches) count += matches.length
    }
    return Math.min(100, count * 15)
  }
  
  private calculateDialogueRatio(content: string): number {
    const dialogueMatches = content.match(/"[^"]*"/g) || []
    const sentences = content.split(/[。！？]/).length
    return Math.round((dialogueMatches.length / Math.max(sentences, 1)) * 100)
  }
  
  private calculateDescriptionDensity(content: string): number {
    const descriptionIndicators = ['看到', '观察', '仿佛', '如同', '只见', '四周', '远处']
    let count = 0
    for (const word of descriptionIndicators) {
      const matches = content.match(new RegExp(word, 'g'))
      if (matches) count += matches.length
    }
    return Math.min(100, count * 12)
  }
  
  private calculateConflictLevel(content: string): number {
    const conflictWords = ['争吵', '冲突', '对抗', '质疑', '反对', '矛盾', '对立']
    let count = 0
    for (const word of conflictWords) {
      const matches = content.match(new RegExp(word, 'g'))
      if (matches) count += matches.length
    }
    return Math.min(100, count * 20)
  }
  
  private getStrategies(strategy: VersionStrategy, count: number): VersionStrategy[] {
    if (strategy === 'mixed') {
      const options: VersionStrategy[] = ['style_variation', 'plot_branch', 'pov_switch', 'tone_shift']
      return options.slice(0, count)
    }
    return Array(count).fill(strategy)
  }
}

export const multiVersionGenerator = new MultiVersionGenerator()
