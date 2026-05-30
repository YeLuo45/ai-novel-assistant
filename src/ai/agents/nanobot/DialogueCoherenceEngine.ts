/**
 * DialogueCoherenceEngine - V176
 * Dialogue Flow & Turn-Taking Coherence Tracking Engine
 * 
 * Design references:
 * - chatdev: multi-perspective dialogue analysis
 * - thunderbolt: feedback loops for conversation monitoring
 * - generic-agent: autonomous coherence detection
 */

export type DialogueIssue = 'abrupt_transition' | 'topic_shift' | 'ignored_response' | 'emotional_mismatch' | 'runon_sentence'

export interface DialogueTurn {
  turnId: string
  speakerId: string
  chapter: number
  content: string
  emotion: string
  responseTo: string | null  // turnId of the turn being responded to
  topics: string[]
  timestamp: number
}

export interface ConversationArc {
  conversationId: string
  participants: string[]
  turns: DialogueTurn[]
  topics: string[]
  dominantEmotion: string
}

export interface DialogueCoherenceState {
  turns: DialogueTurn[]
  conversations: ConversationArc[]
  currentConversation: string | null
  issues: Array<{ type: DialogueIssue; turnId: string; severity: number; description: string }>
}

function createTurnId(): string {
  return 'dt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function extractTopics(text: string): string[] {
  const lower = text.toLowerCase()
  const topicKeywords = [
    ['weather', 'sunny', 'rain', 'cold', 'hot', 'warm'],
    ['food', 'eat', 'dinner', 'lunch', 'hungry', 'meal'],
    ['work', 'job', 'office', 'boss', 'meeting', 'task'],
    ['family', 'mother', 'father', 'sister', 'brother', 'parent'],
    ['travel', 'trip', 'journey', 'go', 'visit', 'leave'],
    ['plan', 'think', 'idea', 'should', 'could', 'want'],
  ]
  const found: string[] = []
  for (const [topic, ...keywords] of topicKeywords) {
    if (keywords.some(k => lower.includes(k))) found.push(topic)
  }
  return found
}

export function createEmptyDialogueState(): DialogueCoherenceState {
  return { turns: [], conversations: [], currentConversation: null, issues: [] }
}

export function recordDialogueTurn(
  state: DialogueCoherenceState,
  speakerId: string,
  content: string,
  emotion: string,
  responseTo: string | null,
  chapter: number
): DialogueCoherenceState {
  const turn: DialogueTurn = {
    turnId: createTurnId(),
    speakerId,
    chapter,
    content,
    emotion,
    responseTo,
    topics: extractTopics(content),
    timestamp: Date.now(),
  }

  const turns = [...state.turns, turn]
  const issues = [...state.issues]
  let conversations = [...state.conversations]
  let currentConversation = state.currentConversation

  // Check for dialogue issues
  const recentTurns = turns.filter(t => t.speakerId === speakerId).slice(-3)
  if (recentTurns.length >= 2) {
    const prev = recentTurns[recentTurns.length - 2]
    if (prev && prev.speakerId === speakerId && prev.content.length > 50 && content.length > 80) {
      issues.push({
        type: 'runon_sentence',
        turnId: turn.turnId,
        severity: 30,
        description: 'Possible run-on sentence detected for ' + speakerId,
      })
    }
  }

  // Check for topic shift (no overlap with previous turn by different speaker)
  if (responseTo) {
    const respondedTo = turns.find(t => t.turnId === responseTo)
    if (respondedTo && respondedTo.speakerId !== speakerId) {
      const overlap = turn.topics.filter(t => respondedTo.topics.includes(t))
      if (overlap.length === 0 && turn.topics.length > 0 && respondedTo.topics.length > 0) {
        issues.push({
          type: 'topic_shift',
          turnId: turn.turnId,
          severity: 40,
          description: 'Possible topic shift - no topic overlap with previous turn',
        })
      }
    }
  }

  // Check for emotional mismatch with response
  if (responseTo) {
    const respondedTo = turns.find(t => t.turnId === responseTo)
    if (respondedTo) {
      const opposite: Record<string, string> = {
        anger: 'joy', joy: 'anger', sadness: 'joy', fear: 'anger',
        surprise: 'neutral', disgust: 'joy', trust: 'fear',
      }
      if (opposite[emotion] === respondedTo.emotion) {
        issues.push({
          type: 'emotional_mismatch',
          turnId: turn.turnId,
          severity: 25,
          description: 'Emotional response mismatch between turns',
        })
      }
    }
  }

  // Track conversation
  if (!currentConversation) {
    currentConversation = 'conv_' + Date.now()
    conversations.push({
      conversationId: currentConversation,
      participants: [speakerId],
      turns: [],
      topics: [],
      dominantEmotion: 'neutral',
    })
  }

  const convIdx = conversations.findIndex(c => c.conversationId === currentConversation)
  if (convIdx >= 0) {
    if (!conversations[convIdx].participants.includes(speakerId)) {
      conversations[convIdx].participants.push(speakerId)
    }
    conversations[convIdx].turns.push(turn)
    if (turn.topics.length > 0) {
      conversations[convIdx].topics = [...new Set([...conversations[convIdx].topics, ...turn.topics])]
    }
  }

  return { ...state, turns, conversations, currentConversation, issues: issues.slice(-19) }
}

export function endConversation(state: DialogueCoherenceState): DialogueCoherenceState {
  return { ...state, currentConversation: null }
}

export function getConversationFlow(state: DialogueCoherenceState, conversationId: string): DialogueTurn[] {
  const conv = state.conversations.find(c => c.conversationId === conversationId)
  return conv ? conv.turns : []
}

export function getSpeakerTurns(state: DialogueCoherenceState, speakerId: string): DialogueTurn[] {
  return state.turns.filter(t => t.speakerId === speakerId)
}

export function getDialogueIssues(state: DialogueCoherenceState): Array<{ type: DialogueIssue; turnId: string; severity: number; description: string }> {
  return state.issues.filter(i => i.severity >= 30)
}

export function formatDialogueSummary(state: DialogueCoherenceState): string {
  let s = '=== Dialogue Summary ===\n'
  s += 'Total Turns: ' + state.turns.length + '\n'
  s += 'Conversations: ' + state.conversations.length + '\n'
  s += 'Active Issues: ' + state.issues.length + '\n'

  if (state.conversations.length > 0) {
    const lastConv = state.conversations[state.conversations.length - 1]
    s += 'Last Conversation: ' + lastConv.participants.join(', ') + ' (' + lastConv.turns.length + ' turns)\n'
  }
  return s
}

export function formatDialogueDashboard(state: DialogueCoherenceState): string {
  let s = '=== Dialogue Dashboard ===\n'

  if (state.turns.length > 0) {
    s += '\n--- Recent Turns ---\n'
    for (const turn of state.turns.slice(-6).reverse()) {
      const reply = turn.responseTo ? ' -> ' : ''
      s += '  [' + turn.speakerId + '] Ch ' + turn.chapter + ': ' + turn.content.substring(0, 50) + reply + '\n'
    }
  }

  if (state.issues.length > 0) {
    s += '\n--- Dialogue Issues ---\n'
    for (const issue of state.issues.slice(-5)) {
      s += '  [' + issue.type + '] severity: ' + issue.severity + ' - ' + issue.description.substring(0, 50) + '\n'
    }
  }
  return s
}
