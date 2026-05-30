import type { CharacterMaterial, SceneMaterial, PlotMaterial } from './types'

export class MaterialContextBuilder {
  buildCharacterContext(characters: CharacterMaterial[]): string {
    if (!characters.length) return ''
    
    return `【角色素材】
${characters.map((c, i) => `
## 角色${i + 1}: ${c.name}
${c.metadata.backstory}

性格: ${c.metadata.personality.join(', ')}
优势: ${c.metadata.strengths.join(', ')}
劣势: ${c.metadata.weaknesses.join(', ')}
目标: ${c.metadata.goals.join(', ')}
恐惧: ${c.metadata.fears.join(', ')}

${c.metadata.relationships.length > 0 ? `关系:\n${c.metadata.relationships.map(r => `- ${r.targetName}(${r.relation}): ${r.dynamic}`).join('\n')}` : ''}

${c.metadata.speechPatterns ? `说话习惯: ${c.metadata.speechPatterns.join(', ')}` : ''}
${c.metadata.mannerisms ? `行为习惯: ${c.metadata.mannerisms.join(', ')}` : ''}
`).join('\n---\n')}`
  }
  
  buildSceneContext(scenes: SceneMaterial[]): string {
    if (!scenes.length) return ''
    
    return `【场景素材】
${scenes.map((s, i) => `
## 场景${i + 1}: ${s.name}
${s.description}

${s.metadata.timeOfDay ? `时间: ${s.metadata.timeOfDay}` : ''} ${s.metadata.season ? s.metadata.season : ''} ${s.metadata.weather ? s.metadata.weather : ''}
氛围: ${s.metadata.atmosphere.join(', ')}
视觉要素: ${s.metadata.visualElements.join(', ')}
声音: ${s.metadata.sounds.join(', ')}

${s.metadata.sampleDescriptions?.standard ? `参考描写:\n${s.metadata.sampleDescriptions.standard}` : ''}
`).join('\n---\n')}`
  }
  
  buildPlotContext(plots: PlotMaterial[]): string {
    if (!plots.length) return ''
    
    return `【情节素材】
${plots.map((p, i) => `
## 情节${i + 1}: ${p.name}
类型: ${p.metadata.plotType}

${p.metadata.emotionalArc ? `情感曲线: ${p.metadata.emotionalArc.start} → ${p.metadata.emotionalArc.peak} → ${p.metadata.emotionalArc.end}` : ''}

结构:
${p.metadata.phases.map(ph => `- ${ph.name}: ${ph.description}`).join('\n')}

关键转折点:
${p.metadata.turningPoints.map(t => `- ${t.name}(${t.position}): ${t.description}`).join('\n')}

核心冲突: ${p.metadata.conflicts.join(', ')}
`).join('\n---\n')}`
  }
  
  buildFullContext(context: {
    characters?: CharacterMaterial[]
    scenes?: SceneMaterial[]
    plots?: PlotMaterial[]
  }): string {
    const parts: string[] = []
    
    if (context.characters?.length) {
      parts.push(this.buildCharacterContext(context.characters))
    }
    if (context.scenes?.length) {
      parts.push(this.buildSceneContext(context.scenes))
    }
    if (context.plots?.length) {
      parts.push(this.buildPlotContext(context.plots))
    }
    
    return parts.join('\n\n')
  }
}

export const materialContextBuilder = new MaterialContextBuilder()
