import { describe, it, expect } from 'vitest'
import { createEmptyState, addVoiceMarker } from './NarrativeVoiceAnalyzer'

describe('debug', () => {
  it('debug', () => {
    let s = createEmptyState()
    s = addVoiceMarker(s, 1, 'first_person', 20, 5.5, 15, 70, 30, 5)
    console.log('Marker 1:', JSON.stringify(s.markers[0], null, 2))
  })
})
