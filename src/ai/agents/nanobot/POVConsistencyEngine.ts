export interface POVScene {
  sceneId: string
  chapter: number
  povCharacter: string
  focusCharacters: string[]
  location: string
}

export interface POVConsistencyIssue {
  issueId: string
  chapter: number
  type: string
  severity: 'minor' | 'major'
  description: string
  sceneIds: string[]
}

export interface POVConsistencyState {
  scenes: POVScene[]
  issues: POVConsistencyIssue[]
  currentChapter: number
  characterPOVs: Map<string, number>  // character -> number of POV scenes
  consistencyScore: number
}

function createSceneId(): string {
  return 'pov_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function createIssueId(): string {
  return 'pov_issue_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectPOVShift(fromScene: POVScene, toScene: POVScene): POVConsistencyIssue | null {
  if (fromScene.povCharacter !== toScene.povCharacter) {
    const issues: string[] = []
    if (fromScene.focusCharacters.some(c => toScene.focusCharacters.includes(c))) {
      issues.push('Shared focus character but different POV')
    }
    if (fromScene.location === toScene.location) {
      issues.push('Same location, different POV character')
    }
    if (issues.length > 0) {
      return {
        issueId: createIssueId(),
        chapter: toScene.chapter,
        type: 'pov_shift',
        severity: issues.some(i => i.includes('Same location')) ? 'major' : 'minor',
        description: issues.join('; '),
        sceneIds: [fromScene.sceneId, toScene.sceneId],
      }
    }
  }
  return null
}

export function createEmptyPOVConsistencyState(): POVConsistencyState {
  return { scenes: [], issues: [], currentChapter: 0, characterPOVs: new Map(), consistencyScore: 100 }
}

export function registerScene(
  state: POVConsistencyState,
  chapter: number,
  povCharacter: string,
  focusCharacters: string[],
  location: string
): POVConsistencyState {
  const scene: POVScene = { sceneId: createSceneId(), chapter, povCharacter, focusCharacters, location }

  let newIssues = [...state.issues]
  if (state.scenes.length >= 1) {
    const prevScene = state.scenes[state.scenes.length - 1]
    const issue = detectPOVShift(prevScene, scene)
    if (issue) {
      newIssues = [...newIssues, issue]
    }
  }

  const newScenes = [...state.scenes, scene]
  const newCharacterPOVs = new Map(state.characterPOVs)
  newCharacterPOVs.set(povCharacter, (newCharacterPOVs.get(povCharacter) || 0) + 1)

  // Calculate consistency score
  const totalShifts = newIssues.filter(i => i.type === 'pov_shift').length
  const score = Math.max(0, 100 - totalShifts * 5)

  return {
    ...state,
    scenes: newScenes,
    issues: newIssues,
    currentChapter: Math.max(state.currentChapter, chapter),
    characterPOVs: newCharacterPOVs,
    consistencyScore: score,
  }
}

export function getConsistencyScore(state: POVConsistencyState): number {
  return state.consistencyScore
}

export function getPOVForCharacter(state: POVConsistencyState, characterId: string): number {
  return state.characterPOVs.get(characterId) || 0
}

export function getIssues(state: POVConsistencyState): POVConsistencyIssue[] {
  return state.issues
}

export function formatPOVSummary(state: POVConsistencyState): string {
  let s = "=== POV Consistency Summary ===" + "\n"
  s += "Scenes: " + state.scenes.length + " | Issues: " + state.issues.length + "\n"
  s += "Consistency Score: " + state.consistencyScore + "\n"
  s += "POV Characters: " + state.characterPOVs.size + "\n"
  return s
}

export function formatPOVDashboard(state: POVConsistencyState): string {
  let s = "=== POV Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Consistency Score: " + state.consistencyScore + "\n"

  if (state.issues.length > 0) {
    s += "\n--- Recent Issues ---" + "\n"
    for (const issue of state.issues.slice(-3)) {
      s += "  Ch " + issue.chapter + " [" + issue.type + "] " + issue.description + "\n"
    }
  }

  return s
}
