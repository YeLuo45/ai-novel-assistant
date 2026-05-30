/**
 * NarrativeImageryEngine — V465
 * Imagery analysis, symbol clustering, sensory language density tracking across narrative.
 * Inspired by: chatdev (sensory synthesis), ruflo (layered analysis), thunderbolt (feedback)
 */

export type SensoryChannel = 'visual' | 'auditory' | 'tactile' | 'olfactory' | 'gustatory' | 'kinesthetic'

export interface ImageryCluster {
  id: string
  symbol: string
  occurrences: number[]
  channels: SensoryChannel[]
  dominantChannel: SensoryChannel | null
  emotionalTone: number  // -100 to 100 (negative to positive)
  density: number  // 0-100
}

export interface ImageryReport {
  totalClusters: number
  avgDensity: number
  dominantSensory: SensoryChannel | null
  recommendations: string[]
}

export interface NarrativeImageryState {
  clusters: ImageryCluster[]
  report: ImageryReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeImageryState {
  return { clusters: [], report: null, typeAlias: {} }
}

export function registerImagery(
  state: NarrativeImageryState,
  symbol: string,
  chapter: number,
  channel: SensoryChannel,
  emotionalTone: number
): NarrativeImageryState {
  const existing = state.clusters.find(c => c.symbol === symbol)
  if (existing) {
    const clusters = state.clusters.map(c => {
      if (c.symbol !== symbol) return c
      const occurrences = [...c.occurrences, chapter]
      const channels = [...new Set([...c.channels, channel])]
      const dominantChannel = channels.sort((a, b) => {
        const countA = occurrences.filter((_, i) => i < occurrences.length && c.channels[i] === a).length
        const countB = occurrences.filter((_, i) => i < occurrences.length && c.channels[i] === b).length
        return countB - countA
      })[0]
      return { ...c, occurrences, channels, dominantChannel, density: Math.min(100, occurrences.length * 10) }
    })
    return { ...state, clusters }
  }
  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const cluster: ImageryCluster = { id, symbol, occurrences: [chapter], channels: [channel], dominantChannel: channel, emotionalTone: Math.max(-100, Math.min(100, emotionalTone)), density: 10 }
  return { ...state, clusters: [...state.clusters, cluster] }
}

export function generateImageryReport(state: NarrativeImageryState): ImageryReport {
  if (state.clusters.length === 0) {
    return { totalClusters: 0, avgDensity: 0, dominantSensory: null, recommendations: [] }
  }
  const totalClusters = state.clusters.length
  const avgDensity = Math.round(state.clusters.reduce((s, c) => s + c.density, 0) / totalClusters)
  const channelCounts: Record<string, number> = {}
  for (const c of state.clusters) {
    if (c.dominantChannel) channelCounts[c.dominantChannel] = (channelCounts[c.dominantChannel] || 0) + 1
  }
  const dominantSensory = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as SensoryChannel || null
  const recommendations: string[] = []
  if (avgDensity < 30) recommendations.push('Low imagery density - enrich sensory language')
  if (!dominantSensory || dominantSensory === 'visual') recommendations.push('Focus on non-visual sensory channels for depth')
  if (state.clusters.filter(c => c.density > 70).length > totalClusters * 0.3) recommendations.push('Some symbols overused - diversify imagery')
  return { totalClusters, avgDensity, dominantSensory, recommendations }
}

export function getSymbolDensity(state: NarrativeImageryState, symbol: string): number {
  const cluster = state.clusters.find(c => c.symbol === symbol)
  return cluster?.density || 0
}

export function compareSensoryBalance(state: NarrativeImageryState): Record<SensoryChannel, number> {
  const balance: Record<string, number> = { visual: 0, auditory: 0, tactile: 0, olfactory: 0, gustatory: 0, kinesthetic: 0 }
  for (const c of state.clusters) {
    if (c.dominantChannel && balance[c.dominantChannel] !== undefined) balance[c.dominantChannel]++
  }
  return balance as Record<SensoryChannel, number>
}
