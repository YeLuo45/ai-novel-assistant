export type MaterialType = 'character' | 'scene' | 'plot' | 'item' | 'location' | 'world'

export interface BaseMaterial {
  id: string
  type: MaterialType
  name: string
  description: string
  tags: string[]
  createdAt: number
  updatedAt: number
  metadata: Record<string, any>
}

export interface CharacterMaterial extends BaseMaterial {
  type: 'character'
  metadata: {
    personality: string[]
    strengths: string[]
    weaknesses: string[]
    backstory: string
    goals: string[]
    fears: string[]
    relationships: CharacterRelationship[]
    speechPatterns?: string[]
    mannerisms?: string[]
  }
}

export interface CharacterRelationship {
  targetId: string
  targetName: string
  relation: string
  dynamic: string
}

export interface SceneMaterial extends BaseMaterial {
  type: 'scene'
  metadata: {
    category: 'interior' | 'exterior' | 'fantasy' | 'modern' | 'historical' | 'scifi'
    timeOfDay?: string
    season?: string
    weather?: string
    atmosphere: string[]
    visualElements: string[]
    sounds: string[]
    sampleDescriptions?: {
      brief?: string
      standard?: string
      detailed?: string
    }
  }
}

export interface PlotMaterial extends BaseMaterial {
  type: 'plot'
  metadata: {
    plotType: string
    phases: { name: string; description: string }[]
    conflicts: string[]
    turningPoints: { name: string; position: string; description: string }[]
    emotionalArc?: { start: string; peak: string; end: string }
  }
}
