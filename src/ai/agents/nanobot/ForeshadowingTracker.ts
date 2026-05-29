export type PayoffStatus = 'pending' | 'partially_paid' | 'fully_paid' | 'orphaned'

export interface ForeshadowingEntry {
  entryId: string
  setupChapter: number
  payoffChapter: number | null
  setupText: string
  payoffText: string
  payoffStatus: PayoffStatus
  payoffStrength: number  // 0-100 how well the payoff resolves the setup
  hintsCount: number  // number of reinforcing hints between setup and payoff
}

export interface ForeshadowingState {
  entries: ForeshadowingEntry[]
  currentChapter: number
  totalSetups: number
  fullyPaidCount: number
  orphanedCount: number
  setupPayoffRatio: number  // 0-100 ratio of paid setups to total
}

function createEntryId(): string {
  return 'fore_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyForeshadowingState(): ForeshadowingState {
  return { entries: [], currentChapter: 0, totalSetups: 0, fullyPaidCount: 0, orphanedCount: 0, setupPayoffRatio: 0 }
}

export function addForeshadowingSetup(
  state: ForeshadowingState,
  setupChapter: number,
  setupText: string
): ForeshadowingState {
  const entry: ForeshadowingEntry = {
    entryId: createEntryId(),
    setupChapter,
    payoffChapter: null,
    setupText,
    payoffText: '',
    payoffStatus: 'pending',
    payoffStrength: 0,
    hintsCount: 0,
  }

  const newEntries = [...state.entries, entry]
  return {
    ...state,
    entries: newEntries,
    currentChapter: setupChapter,
    totalSetups: newEntries.length,
    setupPayoffRatio: Math.round((state.fullyPaidCount / newEntries.length) * 100),
  }
}

export function addReinforcingHint(
  state: ForeshadowingState,
  entryId: string,
  chapter: number
): ForeshadowingState {
  const entries = state.entries.map(e => {
    if (e.entryId === entryId && e.payoffStatus === 'pending') {
      return { ...e, hintsCount: e.hintsCount + 1 }
    }
    return e
  })

  return {
    ...state,
    entries,
    currentChapter: Math.max(state.currentChapter, chapter),
  }
}

export function resolveForeshadowing(
  state: ForeshadowingState,
  entryId: string,
  payoffChapter: number,
  payoffText: string,
  payoffStrength: number
): ForeshadowingState {
  const entries = state.entries.map(e => {
    if (e.entryId === entryId) {
      return {
        ...e,
        payoffChapter,
        payoffText,
        payoffStatus: 'fully_paid' as PayoffStatus,
        payoffStrength: Math.max(0, Math.min(100, payoffStrength)),
      }
    }
    return e
  })

  const fullyPaidCount = entries.filter(e => e.payoffStatus === 'fully_paid').length
  const orphanedCount = entries.filter(e => e.payoffStatus === 'orphaned').length

  return {
    ...state,
    entries,
    currentChapter: payoffChapter,
    fullyPaidCount,
    orphanedCount,
    setupPayoffRatio: Math.round((fullyPaidCount / Math.max(1, entries.length)) * 100),
  }
}

export function markOrphanedForeshadowing(
  state: ForeshadowingState,
  entryId: string
): ForeshadowingState {
  const entries = state.entries.map(e => {
    if (e.entryId === entryId && e.payoffStatus === 'pending') {
      return { ...e, payoffStatus: 'orphaned' as PayoffStatus }
    }
    return e
  })

  const orphanedCount = entries.filter(e => e.payoffStatus === 'orphaned').length

  return {
    ...state,
    entries,
    orphanedCount,
    setupPayoffRatio: Math.round((state.fullyPaidCount / Math.max(1, entries.length)) * 100),
  }
}

export function getPendingForeshadowing(state: ForeshadowingState): ForeshadowingEntry[] {
  return state.entries.filter(e => e.payoffStatus === 'pending')
}

export function getPayoffStats(state: ForeshadowingState): { total: number; fullyPaid: number; orphaned: number; ratio: number } {
  return {
    total: state.entries.length,
    fullyPaid: state.fullyPaidCount,
    orphaned: state.orphanedCount,
    ratio: state.setupPayoffRatio,
  }
}

export function formatForeshadowingSummary(state: ForeshadowingState): string {
  let s = "=== Foreshadowing Summary ===" + "\n"
  s += "Total Setups: " + state.totalSetups + "\n"
  s += "Fully Paid: " + state.fullyPaidCount + "\n"
  s += "Orphaned: " + state.orphanedCount + "\n"
  s += "Setup-Payoff Ratio: " + state.setupPayoffRatio + "%" + "\n"
  return s
}

export function formatForeshadowingDashboard(state: ForeshadowingState): string {
  let s = "=== Foreshadowing Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Ratio: " + state.setupPayoffRatio + "%" + "\n"
  s += "Setups: " + state.totalSetups + " | Paid: " + state.fullyPaidCount + " | Orphaned: " + state.orphanedCount + "\n"

  const pending = state.entries.filter(e => e.payoffStatus === 'pending')
  if (pending.length > 0) {
    s += "\n--- Pending Foreshadowing ---" + "\n"
    for (const e of pending.slice(-4)) {
      s += "  Ch" + e.setupChapter + " "" + e.setupText.slice(0, 30) + "..." hints=" + e.hintsCount + "\n"
    }
  }

  return s
}
