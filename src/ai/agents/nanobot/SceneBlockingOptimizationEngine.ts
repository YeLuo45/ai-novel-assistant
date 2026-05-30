/**
 * SceneBlockingOptimizationEngine — V531
 * Analyzes scene blocking, spatial continuity, and visual composition in narrative scenes.
 * Inspired by: ruflo (hierarchical decomposition) + claude-code (precise control)
 */

export interface BlockingElement {
  id: string
  characterId: string
  position: { x: number, y: number, z: number }  // 3D stage position
  action: string
  emotionalState: string
}

export interface SceneBlocking {
  sceneId: string
  chapter: number
  location: string
  blockingElements: BlockingElement[]
  spatialContinuityScore: number  // 0-100
  visualClarity: number           // 0-100
  focusPoints: string[]           // characterIds of characters in focus
}

export interface BlockingState {
  scenes: Record<string, SceneBlocking>
  characterPositions: Record<string, Array<{ x: number, y: number, z: number, chapter: number }>>
  continuityViolations: Array<{ sceneId: string, description: string }>
  spatialHeatmap: Record<string, number>  // location -> usage frequency
}

export function createEmptyState(): BlockingState {
  return {
    scenes: {},
    characterPositions: {},
    continuityViolations: [],
    spatialHeatmap: {}
  }
}

export function registerSceneBlocking(state: BlockingState, sceneId: string, chapter: number, location: string): BlockingState {
  if (state.scenes[sceneId]) return state

  return {
    ...state,
    scenes: {
      ...state.scenes,
      [sceneId]: {
        sceneId,
        chapter,
        location,
        blockingElements: [],
        spatialContinuityScore: 100,
        visualClarity: 100,
        focusPoints: []
      }
    },
    spatialHeatmap: {
      ...state.spatialHeatmap,
      [location]: (state.spatialHeatmap[location] || 0)
    }
  }
}

export function addBlockingElement(state: BlockingState, sceneId: string, elementId: string, characterId: string, x: number, y: number, z: number, action: string, emotionalState: string): BlockingState {
  const scene = state.scenes[sceneId]
  if (!scene) return state

  const element: BlockingElement = {
    id: elementId,
    characterId,
    position: { x, y, z },
    action,
    emotionalState
  }

  const characterPositions = [...(state.characterPositions[characterId] || []), { x, y, z, chapter: scene.chapter }]

  return {
    ...state,
    scenes: {
      ...state.scenes,
      [sceneId]: {
        ...scene,
        blockingElements: [...scene.blockingElements, element]
      }
    },
    characterPositions: {
      ...state.characterPositions,
      [characterId]: characterPositions
    }
  }
}

export function updateSceneClarity(state: BlockingState, sceneId: string, clarity: number): BlockingState {
  const scene = state.scenes[sceneId]
  if (!scene) return state

  return {
    ...state,
    scenes: {
      ...state.scenes,
      [sceneId]: {
        ...scene,
        visualClarity: Math.max(0, Math.min(100, clarity))
      }
    }
  }
}

export function checkContinuity(state: BlockingState, sceneId: string): BlockingState {
  const scene = state.scenes[sceneId]
  if (!scene) return state

  const violations = [...state.continuityViolations]

  for (const element of scene.blockingElements) {
    const prevPositions = state.characterPositions[element.characterId] || []
    if (prevPositions.length >= 2) {
      const prev = prevPositions[prevPositions.length - 2]
      const curr = element.position

      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) +
        Math.pow(curr.y - prev.y, 2) +
        Math.pow(curr.z - prev.z, 2)
      )

      if (distance > 10) {
        violations.push({
          sceneId,
          description: `${element.characterId} jumped position (${prev.x},${prev.y}) -> (${curr.x},${curr.y})`
        })
      }
    }
  }

  return { ...state, continuityViolations: violations }
}

export function setFocusPoints(state: BlockingState, sceneId: string, focusCharacterIds: string[]): BlockingState {
  const scene = state.scenes[sceneId]
  if (!scene) return state

  return {
    ...state,
    scenes: {
      ...state.scenes,
      [sceneId]: {
        ...scene,
        focusPoints: focusCharacterIds
      }
    }
  }
}

export function analyzeBlockingDensity(state: BlockingState, sceneId: string): number {
  const scene = state.scenes[sceneId]
  if (!scene || scene.blockingElements.length === 0) return 0

  const positions = scene.blockingElements.map(e => e.position)
  let totalDistance = 0
  let pairCount = 0

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dist = Math.sqrt(
        Math.pow(positions[i].x - positions[j].x, 2) +
        Math.pow(positions[i].y - positions[j].y, 2) +
        Math.pow(positions[i].z - positions[j].z, 2)
      )
      totalDistance += dist
      pairCount++
    }
  }

  if (pairCount === 0) return 0
  return Math.round(totalDistance / pairCount)
}

export function getBlockingSummary(state: BlockingState): {
  totalScenes: number
  totalBlockingElements: number
  continuityViolations: number
  mostUsedLocation: string | null
  avgClarity: number
} {
  const sceneObjects = Object.values(state.scenes)
  const totalBlockingElements = sceneObjects.reduce((sum, s) => sum + s.blockingElements.length, 0)

  let mostUsedLocation: string | null = null
  let maxUsage = 0
  for (const [loc, usage] of Object.entries(state.spatialHeatmap)) {
    if (usage > maxUsage) {
      maxUsage = usage
      mostUsedLocation = loc
    }
  }

  const avgClarity = sceneObjects.length > 0
    ? Math.round(sceneObjects.reduce((sum, s) => sum + s.visualClarity, 0) / sceneObjects.length)
    : 100

  return {
    totalScenes: sceneObjects.length,
    totalBlockingElements,
    continuityViolations: state.continuityViolations.length,
    mostUsedLocation,
    avgClarity
  }
}

export function getSceneById(state: BlockingState, sceneId: string): SceneBlocking | null {
  return state.scenes[sceneId] || null
}

export function getCharacterPositions(state: BlockingState, characterId: string): Array<{ x: number, y: number, z: number, chapter: number }> {
  return state.characterPositions[characterId] || []
}