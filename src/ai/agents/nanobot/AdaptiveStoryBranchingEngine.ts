/**
 * AdaptiveStoryBranchingEngine — V497
 * Dynamic story branching driven by reader choices with path memory and backtracking.
 * Inspired by: generic-agent (autonomous goal pursuit) + nanobot (distributed mesh)
 */

import type { ReaderProfile } from './ReaderPersonaEngine'

export type BranchType = 'choice' | 'conditional' | 'divergence' | 'convergence'
export type NodeType = 'scene' | 'choice' | 'checkpoint' | 'ending'

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
}

export interface StoryPath {
  id: string
  nodeIds: string[]
  startedAt: number
  lastVisitedAt: number
  readerProfileId: string
  metadata: Record<string, unknown>
}

export interface BranchState {
  nodes: Record<string, StoryNode>
  paths: StoryPath[]
  activePathId: string | null
  checkpoints: string[]  // node ids
  convergencePoints: Record<string, string[]>  // nodeId -> converging path ids
}

export function createEmptyState(): BranchState {
  return {
    nodes: {},
    paths: [],
    activePathId: null,
    checkpoints: [],
    convergencePoints: {}
  }
}

export function createNode(
  state: BranchState,
  title: string,
  content: string,
  type: NodeType,
  chapterNumber: number,
  parentNodeId: string | null = null,
  conditions: string[] = []
): BranchState {
  const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const node: StoryNode = {
    id,
    type,
    title,
    content,
    choices: [],
    conditions,
    parentNodeId,
    childNodeIds: [],
    chapterNumber
  }

  // Update parent's childNodeIds
  const nodes = { ...state.nodes, [id]: node }
  if (parentNodeId && nodes[parentNodeId]) {
    nodes[parentNodeId] = {
      ...nodes[parentNodeId],
      childNodeIds: [...nodes[parentNodeId].childNodeIds, id]
    }
  }

  return { ...state, nodes }
}

export function addChoice(
  state: BranchState,
  nodeId: string,
  text: string,
  targetNodeId: string,
  condition?: string,
  consequence?: string
): BranchState {
  const node = state.nodes[nodeId]
  if (!node) return state

  const choice: Choice = {
    id: `choice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text,
    targetNodeId,
    condition,
    consequence
  }

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: {
        ...node,
        choices: [...(node.choices || []), choice]
      }
    }
  }
}

export function createPath(
  state: BranchState,
  readerProfileId: string
): BranchState {
  const id = `path_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const path: StoryPath = {
    id,
    nodeIds: [],
    startedAt: Date.now(),
    lastVisitedAt: Date.now(),
    readerProfileId,
    metadata: {}
  }
  return { ...state, paths: [...state.paths, path], activePathId: id }
}

export function setActivePath(state: BranchState, pathId: string): BranchState {
  if (!state.paths.find(p => p.id === pathId)) return state
  return { ...state, activePathId: pathId }
}

export function navigateToNode(
  state: BranchState,
  pathId: string,
  nodeId: string,
  consequence?: string
): BranchState {
  const path = state.paths.find(p => p.id === pathId)
  if (!path) return state

  const pathIndex = state.paths.findIndex(p => p.id === pathId)
  const updatedPath: StoryPath = {
    ...path,
    nodeIds: [...path.nodeIds, nodeId],
    lastVisitedAt: Date.now(),
    metadata: consequence ? { ...path.metadata, lastConsequence: consequence } : path.metadata
  }

  const paths = [...state.paths]
  paths[pathIndex] = updatedPath

  return { ...state, paths }
}

export function makeChoice(
  state: BranchState,
  pathId: string,
  nodeId: string,
  choiceId: string
): BranchState {
  const node = state.nodes[nodeId]
  if (!node || !node.choices) return state

  const choice = node.choices.find(c => c.id === choiceId)
  if (!choice) return state

  // Apply consequence if any
  let nextState = state
  if (choice.consequence) {
    const pathIndex = state.paths.findIndex(p => p.id === pathId)
    const path = state.paths[pathIndex]
    nextState = {
      ...state,
      paths: state.paths.map((p, i) =>
        i === pathIndex
          ? { ...p, metadata: { ...p.metadata, lastConsequence: choice.consequence } }
          : p
      )
    }
  }

  return navigateToNode(nextState, pathId, choice.targetNodeId, choice.consequence)
}

export function addCheckpoint(state: BranchState, nodeId: string): BranchState {
  if (!state.nodes[nodeId] || state.checkpoints.includes(nodeId)) return state
  return { ...state, checkpoints: [...state.checkpoints, nodeId] }
}

export function addConvergencePoint(state: BranchState, nodeId: string, pathId: string): BranchState {
  const existing = state.convergencePoints[nodeId] || []
  if (existing.includes(pathId)) return state
  return {
    ...state,
    convergencePoints: { ...state.convergencePoints, [nodeId]: [...existing, pathId] }
  }
}

export function getActivePath(state: BranchState): StoryPath | null {
  if (!state.activePathId) return null
  return state.paths.find(p => p.id === state.activePathId) || null
}

export function getNodeById(state: BranchState, nodeId: string): StoryNode | null {
  return state.nodes[nodeId] || null
}

export function getPathHistory(state: BranchState, pathId: string): StoryNode[] {
  const path = state.paths.find(p => p.id === pathId)
  if (!path) return []
  return path.nodeIds.map(id => state.nodes[id]).filter(Boolean)
}

export function getAvailableChoices(state: BranchState, nodeId: string, context: Record<string, unknown> = {}): Choice[] {
  const node = state.nodes[nodeId]
  if (!node || !node.choices) return []

  return node.choices.filter(choice => {
    if (!choice.condition) return true
    // Simple condition evaluation - check if context satisfies condition
    // Format: "engagementScore > 60" or "pacing == 'slow'"
    try {
      const [rawKey, op, rawVal] = choice.condition.split(/([><=!]+)/)
      const key = rawKey.trim()
      const val = rawVal.trim()
      const ctxVal = context[key]
      if (op === '>' || op === '<' || op === '>=' || op === '<=') {
        return new Function(`return ${ctxVal} ${op} ${Number(val)}`)()
      }
      if (op === '==' || op === '===') {
        return ctxVal == val.replace(/['"]/g, '')
      }
    } catch {
      // Invalid condition, skip this choice
    }
    return true
  })
}

export function findConvergentNode(state: BranchState, pathIds: string[]): string | null {
  for (const [nodeId, pIds] of Object.entries(state.convergencePoints)) {
    if (pIds.length >= 2 && pathIds.some(id => pIds.includes(id))) {
      return nodeId
    }
  }
  return null
}

export function getBacktrackOptions(state: BranchState, pathId: string, maxDepth: number = 5): StoryNode[] {
  const path = state.paths.find(p => p.id === pathId)
  if (!path || path.nodeIds.length === 0) return []

  const recentNodes = path.nodeIds.slice(-maxDepth)
  return recentNodes
    .slice(0, -1)  // Exclude current node
    .reverse()
    .map(id => state.nodes[id])
    .filter(Boolean)
}

export function backtrackToNode(state: BranchState, pathId: string, nodeId: string): BranchState {
  const pathIndex = state.paths.findIndex(p => p.id === pathId)
  if (pathIndex === -1) return state

  const path = state.paths[pathIndex]
  const nodeIndex = path.nodeIds.indexOf(nodeId)
  if (nodeIndex === -1) return state

  const newNodeIds = path.nodeIds.slice(0, nodeIndex + 1)
  const updatedPath: StoryPath = {
    ...path,
    nodeIds: newNodeIds,
    lastVisitedAt: Date.now()
  }

  const paths = [...state.paths]
  paths[pathIndex] = updatedPath

  return { ...state, paths }
}

export function getStoryProgress(state: BranchState, pathId: string): { totalNodes: number, uniqueEndings: number, chapterProgress: number } {
  const path = state.paths.find(p => p.id === pathId)
  if (!path) return { totalNodes: 0, uniqueEndings: 0, chapterProgress: 0 }

  const visitedNodeIds = new Set(path.nodeIds)
  const endingNodes = Object.values(state.nodes).filter(
    n => n.type === 'ending' && visitedNodeIds.has(n.id)
  ).length

  const chapters = Object.values(state.nodes).map(n => n.chapterNumber)
  const maxChapter = chapters.length > 0 ? Math.max(...chapters) : 1
  const visitedChapters = new Set(path.nodeIds.map(id => state.nodes[id]?.chapterNumber).filter(Boolean))
  const chapterProgress = maxChapter > 0 ? (visitedChapters.size / maxChapter) * 100 : 0

  return {
    totalNodes: path.nodeIds.length,
    uniqueEndings: endingNodes,
    chapterProgress: Math.round(chapterProgress)
  }
}