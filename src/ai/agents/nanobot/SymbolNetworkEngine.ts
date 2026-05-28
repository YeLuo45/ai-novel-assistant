/**
 * SymbolNetworkEngine - V186
 * Symbol & Motif Connection Tracking Network Engine
 */

export interface SymbolOccurrence {
  occurrenceId: string
  chapter: number
  context: string
  meaning: string  // interpreted meaning in context
}

export interface SymbolNode {
  symbolId: string
  name: string
  occurrences: SymbolOccurrence[]
  connections: string[]  // connected symbol IDs
  frequency: number
  layers: string[]  // e.g., 'water', 'purification', 'death'
}

export interface SymbolNetworkState {
  symbols: Map<string, SymbolNode>
  currentChapter: number
  dominantSymbols: string[]
}

function createSymbolId(): string {
  return 'sym_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function findSymbolInText(text: string): { name: string; meaning: string }[] {
  const lower = text.toLowerCase()
  const symbols: Array<{ name: string; meaning: string }> = []

  const symbolMap: Array<[string[], string]> = [
    [['water', 'river', 'ocean', 'rain', 'tears', 'wave'], 'purification, life, emotion'],
    [['fire', 'flame', 'burn', 'ember', 'ash'], 'passion, destruction, transformation'],
    [['blood', 'bleed', 'wound'], 'sacrifice, connection, violence'],
    [['shadow', 'darkness', 'dark', 'night'], 'fear, unknown, repression'],
    [['light', 'sun', 'dawn', 'shine'], 'hope, truth, awakening'],
    [['rose', 'flower', 'bloom'], 'beauty, love, fragility'],
    [['storm', 'thunder', 'lightning'], 'conflict, upheaval, change'],
    [['mirror', 'reflection'], 'self-knowledge, deception'],
    [['road', 'path', 'journey'], 'choice, transformation, destiny'],
    [['bird', 'fly', 'wing', 'flight'], 'freedom, escape, transcendence'],
  ]

  for (const [keywords, meaning] of symbolMap) {
    if (keywords.some(k => lower.includes(k))) {
      symbols.push({ name: keywords[0], meaning })
    }
  }

  return symbols
}

export function createEmptySymbolNetworkState(): SymbolNetworkState {
  return { symbols: new Map(), currentChapter: 0, dominantSymbols: [] }
}

export function recordSymbolOccurrence(
  state: SymbolNetworkState,
  chapter: number,
  context: string,
  meaning: string
): SymbolNetworkState {
  const found = findSymbolInText(context)
  if (found.length === 0) return state

  const newSymbols = new Map(state.symbols)

  for (const { name, meaning: symbolMeaning } of found) {
    const symbolId = name.toLowerCase()

    if (newSymbols.has(symbolId)) {
      const existing = newSymbols.get(symbolId)!
      const occurrence: SymbolOccurrence = { occurrenceId: createSymbolId(), chapter, context: context.substring(0, 80), meaning: symbolMeaning }
      const updated: SymbolNode = {
        ...existing,
        occurrences: [...existing.occurrences, occurrence],
        frequency: existing.frequency + 1,
      }
      newSymbols.set(symbolId, updated)
    } else {
      const occurrence: SymbolOccurrence = { occurrenceId: createSymbolId(), chapter, context: context.substring(0, 80), meaning: symbolMeaning }
      const node: SymbolNode = { symbolId, name, occurrences: [occurrence], connections: [], frequency: 1, layers: [symbolMeaning] }
      newSymbols.set(symbolId, node)
    }
  }

  // Update dominant symbols (top 5 by frequency)
  const sorted = Array.from(newSymbols.values()).sort((a, b) => b.frequency - a.frequency)
  const dominant = sorted.slice(0, 5).map(s => s.symbolId)

  return { ...state, symbols: newSymbols, currentChapter: Math.max(state.currentChapter, chapter), dominantSymbols: dominant }
}

export function connectSymbols(state: SymbolNetworkState, symbolA: string, symbolB: string): SymbolNetworkState {
  const keyA = symbolA.toLowerCase()
  const keyB = symbolB.toLowerCase()
  if (!state.symbols.has(keyA) || !state.symbols.has(keyB)) return state

  const newSymbols = new Map(state.symbols)
  const a = newSymbols.get(keyA)!
  const b = newSymbols.get(keyB)!

  if (!a.connections.includes(keyB)) {
    newSymbols.set(keyA, { ...a, connections: [...a.connections, keyB] })
  }
  if (!b.connections.includes(keyA)) {
    newSymbols.set(keyB, { ...b, connections: [...b.connections, keyA] })
  }

  return { ...state, symbols: newSymbols }
}

export function getSymbol(state: SymbolNetworkState, symbolName: string): SymbolNode | null {
  return state.symbols.get(symbolName.toLowerCase()) || null
}

export function getDominantSymbols(state: SymbolNetworkState): SymbolNode[] {
  return state.dominantSymbols.map(id => state.symbols.get(id)!).filter(Boolean)
}

export function getSymbolConnections(state: SymbolNetworkState, symbolName: string): SymbolNode[] {
  const node = state.symbols.get(symbolName.toLowerCase())
  if (!node) return []
  return node.connections.map(id => state.symbols.get(id)!).filter(Boolean)
}

export function formatSymbolSummary(state: SymbolNetworkState): string {
  let s = '=== Symbol Network Summary ===' + '
'
  s += 'Total Symbols: ' + state.symbols.size + '
'
  s += 'Dominant Symbols: ' + state.dominantSymbols.join(', ') + '
'
  s += 'Chapter: ' + state.currentChapter + '
'
  return s
}

export function formatSymbolDashboard(state: SymbolNetworkState): string {
  let s = '=== Symbol Dashboard ===' + '
'
  s += 'Chapter: ' + state.currentChapter + '
'

  if (state.dominantSymbols.length > 0) {
    s += '
--- Dominant Symbols ---' + '
'
    for (const id of state.dominantSymbols) {
      const sym = state.symbols.get(id)!
      s += '  ' + sym.name + ' (freq: ' + sym.frequency + ', layers: ' + sym.layers.join(', ') + ')' + '
'
    }
  }

  if (state.symbols.size > 0) {
    s += '
--- Recent Occurrences ---' + '
'
    const allOccs: Array<{ chapter: number; symbol: string; context: string }> = []
    for (const [, sym] of state.symbols) {
      for (const occ of sym.occurrences.slice(-2)) {
        allOccs.push({ chapter: occ.chapter, symbol: sym.name, context: occ.context.substring(0, 50) })
      }
    }
    allOccs.sort((a, b) => b.chapter - a.chapter)
    for (const o of allOccs.slice(0, 5)) {
      s += '  Ch ' + o.chapter + ' [' + o.symbol + ']: ' + o.context + '
'
    }
  }

  return s
}
