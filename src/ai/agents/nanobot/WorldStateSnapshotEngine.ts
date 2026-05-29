// WorldStateSnapshotEngine - V292: World state snapshot engine
export interface WorldSnapshotData {
  locations: string[]
  characters: string[]
  items: string[]
  locationCount: number
}

export interface WorldSnapshot {
  chapter: number
  data: WorldSnapshotData
  changeCount: number
}

export interface WorldSnapshotState {
  snapshots: WorldSnapshot[]
}

export function createEmptyWorldSnapshotState(): WorldSnapshotState {
  return { snapshots: [] }
}

export function takeSnapshot(
  state: WorldSnapshotState,
  chapter: number,
  worldData: { locations: string[]; characters: string[]; items: string[] }
): WorldSnapshotState {
  const data: WorldSnapshotData = {
    locations: worldData.locations || [],
    characters: worldData.characters || [],
    items: worldData.items || [],
    locationCount: (worldData.locations || []).length,
  }
  let changeCount = 0
  if (state.snapshots.length > 0) {
    const prev = state.snapshots[state.snapshots.length - 1].data
    const allLocs = [...new Set([...prev.locations, ...data.locations])]
    const allChars = [...new Set([...prev.characters, ...data.characters])]
    const allItems = [...new Set([...prev.items, ...data.items])]
    changeCount = (allLocs.length - prev.locations.length) + (allChars.length - prev.characters.length) + (allItems.length - prev.items.length)
  }
  return { snapshots: [...state.snapshots, { chapter, data, changeCount }] }
}

export function compareSnapshots(state: WorldSnapshotState, chapterA: number, chapterB: number): number {
  const snapA = state.snapshots.find(s => s.chapter === chapterA)
  const snapB = state.snapshots.find(s => s.chapter === chapterB)
  if (!snapA || !snapB) return 0
  const allLocs = new Set([...snapA.data.locations, ...snapB.data.locations])
  const shared = snapA.data.locations.filter(l => snapB.data.locations.includes(l)).length
  return allLocs.size - shared
}

export function getWorldChangeRate(state: WorldSnapshotState): number {
  if (state.snapshots.length < 2) return 0
  const totalChanges = state.snapshots.reduce((s, snap) => s + snap.changeCount, 0)
  return Math.round(totalChanges / (state.snapshots.length - 1))
}

export function getConsistentElements(state: WorldSnapshotState): string[] {
  if (state.snapshots.length < 2) return []
  const first = state.snapshots[0].data
  const last = state.snapshots[state.snapshots.length - 1].data
  const consistent: string[] = []
  for (const loc of first.locations) {
    if (last.locations.includes(loc)) consistent.push('loc:' + loc)
  }
  for (const char of first.characters) {
    if (last.characters.includes(char)) consistent.push('char:' + char)
  }
  return consistent
}

export function formatSnapshotSummary(state: WorldSnapshotState): string {
  return "Snapshots: " + state.snapshots.length + "\n"
}

export function formatSnapshotDashboard(state: WorldSnapshotState): string {
  if (state.snapshots.length === 0) return "No snapshots\n"
  const last = state.snapshots[state.snapshots.length - 1]
  return "Chapter: " + last.chapter + " | Locations: " + last.data.locationCount + "\n"
}
