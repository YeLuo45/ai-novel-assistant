/**
 * AdaptiveStoryBranchingEngine — V533
 * Dynamic story branching driven by reader choices with path memory and backtracking.
 * Inspired by: generic-agent (autonomous goal pursuit) + nanobot (distributed mesh)
 */

export type BranchType = 'choice' | 'conditional' | 'divergence' | 'convergence'
export type NodeType = 'scene' | 'choice' | 'checkpoint' | 'ending'
export type StoryMode = 'linear' | 'branching' | 'convergent'

export interface ReaderProfile {
  id: string
  preferredGenres: string[]
  readingPace: 'slow' | 'moderate' | 'fast'
  emotionalSensitivity: number  // 0-100
  interactionStyle: 'passive' | 'active' | 'explorative'
}

export interface StoryNode {
  id: string
  type: NodeType
  title: string
  content: string
  choices?: Choice[]
  conditions?: string[]
  parentNodeId: string | null
  childNodeIds: string[]
  chapterNumber: number
}

export interface Choice {
  id: string
  text: string
  targetNodeId: string
  condition?: string
  consequence?: string
  emotionalTags?: string[]
}

export interface BranchMetadata {
  storyId: string
  storyTitle: string
  mode: StoryMode
  totalNodes: number
  totalChoices: number
  currentPathLength: number
  visitedNodes: string[]
  revisitedNodes: string[]
  pathHistory: string[]
  backtrackCount: number
}

export interface BranchState {
  storyMetadata: BranchMetadata
  nodes: Record<string, StoryNode>
  currentNodeId: string | null
  readerProfile: ReaderProfile | null
  variables: Record<string, number | string | boolean>
  choiceHistory: string[]
}

export function createEmptyState(): BranchState {
  return {
    storyMetadata: {
      storyId: '',
      storyTitle: '',
      mode: 'linear',
      totalNodes: 0,
      totalChoices: 0,
      currentPathLength: 0,
      visitedNodes: [],
      revisitedNodes: [],
      pathHistory: [],
      backtrackCount: 0
    },
    nodes: {},
    currentNodeId: null,
    readerProfile: null,
    variables: {},
    choiceHistory: []
  }
}

export function initializeStory(
  state: BranchState,
  title: string,
  startNodeId: string,
  mode: StoryMode
): BranchState {
  const startNode: StoryNode = {
    id: startNodeId,
    type: 'scene',
    title,
    content: '',
    parentNodeId: null,
    childNodeIds: [],
    chapterNumber: 1
  }

  return {
    ...state,
    storyMetadata: {
      ...state.storyMetadata,
      storyId: `story_${Date.now()}`,
      storyTitle: title,
      mode,
      totalNodes: 1,
      totalChoices: 0,
      currentPathLength: 1,
      visitedNodes: [startNodeId],
      pathHistory: [startNodeId]
    },
    nodes: { [startNodeId]: startNode },
    currentNodeId: startNodeId
  }
}

export function addSceneNode(
  state: BranchState,
  nodeId: string,
  title: string,
  content: string,
  chapterNumber: number,
  parentNodeId: string | null = null
): BranchState {
  if (state.nodes[nodeId]) return state

  const node: StoryNode = {
    id: nodeId,
    type: 'scene',
    title,
    content,
    parentNodeId,
    childNodeIds: [],
    chapterNumber
  }

  const nodes = { ...state.nodes, [nodeId]: node }

  if (parentNodeId && nodes[parentNodeId]) {
    const parent = nodes[parentNodeId]
    nodes[parentNodeId] = {
      ...parent,
      childNodeIds: [...parent.childNodeIds, nodeId]
    }
  }

  return {
    ...state,
    nodes,
    storyMetadata: {
      ...state.storyMetadata,
      totalNodes: state.storyMetadata.totalNodes + 1
    }
  }
}

export function addChoiceNode(
  state: BranchState,
  choiceId: string,
  text: string,
  parentNodeId: string,
  targetNodeId: string,
  condition?: string,
  consequence?: string
): BranchState {
  const parentNode = state.nodes[parentNodeId]
  if (!parentNode) return state

  const choice: Choice = {
    id: choiceId,
    text,
    targetNodeId,
    condition,
    consequence
  }

  const updatedChoices = [...(parentNode.choices || []), choice]
  const updatedNode = {
    ...parentNode,
    choices: updatedChoices,
    type: updatedChoices.length > 0 ? 'scene' as NodeType : parentNode.type
  } as StoryNode

  return {
    ...state,
    nodes: { ...state.nodes, [parentNodeId]: updatedNode },
    storyMetadata: {
      ...state.storyMetadata,
      totalChoices: state.storyMetadata.totalChoices + 1
    }
  }
}

export function evaluateCondition(
  condition: string,
  variables: Record<string, number | string | boolean>
): boolean {
  if (!condition || condition.trim() === '') return true

  try {
    const varAccess: Record<string, number | string | boolean> = {}
    for (const [key, val] of Object.entries(variables)) {
      varAccess[key] = val
    }

    const funcBody = `
      const ${Object.entries(varAccess).map(([k, v]) => `const ${k} = ${JSON.stringify(v)};`).join('')}
      return !!(${condition})
    `
    const fn = new Function('variables', funcBody)
    return fn(varAccess) as boolean
  } catch {
    return true
  }
}

export function executeChoice(
  state: BranchState,
  nodeId: string,
  choiceId: string
): BranchState {
  const node = state.nodes[nodeId]
  if (!node || !node.choices) return state

  const choice = node.choices.find(c => c.id === choiceId)
  if (!choice) return state

  if (choice.condition && !evaluateCondition(choice.condition, state.variables)) {
    return state
  }

  const targetExists = state.nodes[choice.targetNodeId]

  let newVariables = { ...state.variables }
  if (choice.consequence) {
    try {
      const consequenceCode = choice.consequence
      const assignMatch = Array.from(consequenceCode.matchAll(/(\w+)\s*=\s*([^;]+);/g))
      for (const match of assignMatch) {
        const varName = match[1]
        let varValue: any = state.variables[varName]
        const expr = match[2].trim()
        if (expr === 'true') varValue = true
        else if (expr === 'false') varValue = false
        else if (expr === 'null') varValue = null
        else if (!isNaN(Number(expr))) varValue = Number(expr)
        else if (expr.startsWith('"') || expr.startsWith("'")) varValue = expr.slice(1, -1)
        else varValue = state.variables[expr] ?? true
        newVariables[varName] = varValue
      }
    } catch {
      // ignore invalid consequence
    }
  }

  const visitedNodes = [...state.storyMetadata.visitedNodes]
  const revisitedNodes = [...state.storyMetadata.revisitedNodes]

  if (visitedNodes.includes(choice.targetNodeId)) {
    revisitedNodes.push(choice.targetNodeId)
  } else {
    visitedNodes.push(choice.targetNodeId)
  }

  const pathHistory = [...state.storyMetadata.pathHistory, choice.targetNodeId]

  let backtrackCount = state.storyMetadata.backtrackCount
  if (state.currentNodeId && !visitedNodes.includes(state.currentNodeId)) {
    backtrackCount++
  }

  return {
    ...state,
    currentNodeId: choice.targetNodeId,
    variables: newVariables,
    choiceHistory: [...state.choiceHistory, choiceId],
    storyMetadata: {
      ...state.storyMetadata,
      visitedNodes,
      revisitedNodes,
      currentPathLength: pathHistory.length,
      pathHistory,
      backtrackCount
    }
  }
}

export function backtrack(state: BranchState, steps: number = 1): BranchState {
  if (state.storyMetadata.pathHistory.length <= steps) return state

  const newHistory = state.storyMetadata.pathHistory.slice(0, -steps)
  const previousNodeId = newHistory[newHistory.length - 1]

  return {
    ...state,
    currentNodeId: previousNodeId,
    storyMetadata: {
      ...state.storyMetadata,
      pathHistory: newHistory,
      currentPathLength: newHistory.length,
      backtrackCount: state.storyMetadata.backtrackCount + 1
    }
  }
}

export function getCurrentScene(state: BranchState): StoryNode | null {
  if (!state.currentNodeId) return null
  return state.nodes[state.currentNodeId] || null
}

export function getSceneById(state: BranchState, nodeId: string): StoryNode | null {
  return state.nodes[nodeId] || null
}

export function getStoryStateSummary(state: BranchState): {
  storyTitle: string
  mode: StoryMode
  totalNodes: number
  totalChoices: number
  currentPathLength: number
  revisitCount: number
  backtrackCount: number
  currentChapter: number
} {
  const currentNode = getCurrentScene(state)
  return {
    storyTitle: state.storyMetadata.storyTitle,
    mode: state.storyMetadata.mode,
    totalNodes: state.storyMetadata.totalNodes,
    totalChoices: state.storyMetadata.totalChoices,
    currentPathLength: state.storyMetadata.currentPathLength,
    revisitCount: state.storyMetadata.revisitedNodes.length,
    backtrackCount: state.storyMetadata.backtrackCount,
    currentChapter: currentNode?.chapterNumber || 1
  }
}

export function calculatePathSimilarity(
  pathA: string[],
  pathB: string[]
): number {
  if (pathA.length === 0 || pathB.length === 0) return 0

  const setA = new Set(pathA)
  const intersection = pathB.filter(id => setA.has(id))
  const union = new Set([...pathA, ...pathB])

  return Math.round((intersection.length / union.size) * 100)
}

export function getNodeAtDepth(
  state: BranchState,
  depth: number
): StoryNode | null {
  if (depth < 0 || depth >= state.storyMetadata.pathHistory.length) return null
  const nodeId = state.storyMetadata.pathHistory[depth]
  return state.nodes[nodeId] || null
}

export function findNearestCommonAncestor(
  state: BranchState,
  nodeIdA: string,
  nodeIdB: string
): string | null {
  const ancestorsA = new Set<string>()
  let current: string | null = nodeIdA

  while (current) {
    ancestorsA.add(current)
    const node = state.nodes[current]
    current = node?.parentNodeId || null
  }

  current = nodeIdB
  while (current) {
    if (ancestorsA.has(current)) return current
    const node = state.nodes[current]
    current = node?.parentNodeId || null
  }

  return null
}