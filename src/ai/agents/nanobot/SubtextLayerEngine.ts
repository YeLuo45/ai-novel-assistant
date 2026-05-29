export type SubtextCategory = 'emotional' | 'power' | 'romantic' | 'conflict' | 'moral' | 'identity'

export interface DialogueSubtext {
  dialogueId: string
  chapter: number
  speaker: string
  surfaceText: string
  subtextDepth: number  // 0-100
  categories: SubtextCategory[]
  meaning: string  // interpretation
  tension: number  // 0-100, underlying tension level
}

export interface SubtextLayerState {
  dialogues: DialogueSubtext[]
  currentChapter: number
  averageDepth: number
  dominantCategory: SubtextCategory | null
}

function createDialogueId(): string {
  return 'dlg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function analyzeSubtext(text: string): { depth: number; categories: SubtextCategory[]; meaning: string; tension: number } {
  const lower = text.toLowerCase()

  // Calculate subtext depth based on complexity indicators
  let depth = 20
  const categories: SubtextCategory[] = []

  // Implicit/emotional indicators
  if (lower.includes('fine') || lower.includes('whatever') || lower.includes('sure')) {
    depth += 20
    categories.push('emotional')
  }

  // Power dynamics
  if (lower.includes('must') || lower.includes('should') || lower.includes('need to')) {
    depth += 15
    categories.push('power')
  }

  // Romantic tension
  if (lower.includes('miss') || lower.includes('think about') || lower.includes('care')) {
    depth += 15
    categories.push('romantic')
  }

  // Conflict indicators
  if (lower.includes('but') || lower.includes('however') || lower.includes('still')) {
    depth += 10
    categories.push('conflict')
  }

  // Moral dilemmas
  if (lower.includes('right') || lower.includes('wrong') || lower.includes('should')) {
    depth += 10
    categories.push('moral')
  }

  // Identity questions
  if (lower.includes('who am') || lower.includes('who are') || lower.includes('what am I')) {
    depth += 15
    categories.push('identity')
  }

  // Short sentences often have more subtext
  if (text.split('.').length <= 2 && text.length < 50) {
    depth += 10
  }

  // Long rhetorical questions
  if (text.includes('?') && text.length > 30) {
    depth += 10
  }

  // Calculate tension
  let tension = 30
  if (lower.includes('hate') || lower.includes('angry') || lower.includes('love')) tension += 30
  if (lower.includes('fear') || lower.includes('afraid')) tension += 20
  if (lower.includes('hope') || lower.includes('wish')) tension -= 10
  if (categories.includes('conflict')) tension += 15
  if (categories.includes('romantic')) tension += 15

  // Meaning interpretation
  let meaning = 'Direct statement'
  if (depth > 40) meaning = 'Hidden emotional subtext'
  if (depth > 60) meaning = 'Complex layered meaning with multiple interpretations'
  if (categories.includes('power')) meaning += ' - Power dynamic implied'
  if (categories.includes('emotional')) meaning += ' - Emotional undercurrent present'

  return {
    depth: Math.min(100, depth),
    categories: [...new Set(categories)],
    meaning,
    tension: Math.min(100, Math.max(0, tension)),
  }
}

export function createEmptySubtextLayerState(): SubtextLayerState {
  return { dialogues: [], currentChapter: 0, averageDepth: 0, dominantCategory: null }
}

export function analyzeDialogue(
  state: SubtextLayerState,
  chapter: number,
  speaker: string,
  surfaceText: string
): SubtextLayerState {
  const analysis = analyzeSubtext(surfaceText)

  const dialogue: DialogueSubtext = {
    dialogueId: createDialogueId(),
    chapter,
    speaker,
    surfaceText,
    subtextDepth: analysis.depth,
    categories: analysis.categories,
    meaning: analysis.meaning,
    tension: analysis.tension,
  }

  const newDialogues = [...state.dialogues, dialogue]
  const avgDepth = Math.round(newDialogues.reduce((s, d) => s + d.subtextDepth, 0) / newDialogues.length)

  // Determine dominant category
  const allCategories = newDialogues.flatMap(d => d.categories)
  const categoryCounts: Record<string, number> = {}
  for (const cat of allCategories) {
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }
  let dominant: SubtextCategory | null = null
  let maxCount = 0
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count
      dominant = cat as SubtextCategory
    }
  }

  return {
    ...state,
    dialogues: newDialogues,
    currentChapter: Math.max(state.currentChapter, chapter),
    averageDepth: avgDepth,
    dominantCategory: dominant,
  }
}

export function getSubtextAtChapter(state: SubtextLayerState, chapter: number): DialogueSubtext[] {
  return state.dialogues.filter(d => d.chapter === chapter)
}

export function getDeepDialogues(state: SubtextLayerState, minDepth: number): DialogueSubtext[] {
  return state.dialogues.filter(d => d.subtextDepth >= minDepth)
}

export function formatSubtextSummary(state: SubtextLayerState): string {
  let s = "=== Subtext Analysis Summary ===" + "\n"
  s += "Dialogues: " + state.dialogues.length + "\n"
  s += "Avg Depth: " + state.averageDepth + "\n"
  s += "Dominant Category: " + (state.dominantCategory || 'none') + "\n"
  return s
}

export function formatSubtextDashboard(state: SubtextLayerState): string {
  let s = "=== Subtext & Layer Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Dialogues: " + state.dialogues.length + " | Avg Depth: " + state.averageDepth + " | Dominant: " + (state.dominantCategory || 'none') + "\n"

  if (state.dialogues.length > 0) {
    s += "\n--- Recent Subtext ---" + "\n"
    for (const d of state.dialogues.slice(-4)) {
      const catStr = d.categories.length > 0 ? d.categories.join(',') : 'none'
      s += "  Ch" + d.chapter + " " + d.speaker + " depth=" + d.subtextDepth + " [" + catStr + "] tension=" + d.tension + "\n"
    }
  }

  return s
}
