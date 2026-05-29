import { createEmptyState, addBeat, createSequence, addBeatToSequence } from './StoryBeatOptimizer'
const s1 = createEmptyState()
console.log('empty state sequences:', JSON.stringify(s1.sequences))
const s2 = addBeat(s1, { type: 'hook', description: 'Test', priority: 80, estimatedLength: 500 })
console.log('after addBeat, beats:', s2.beats.length, 'library keys:', Object.keys(s2.beatLibrary).length)
const beatId = s2.beats[0].id
console.log('beatId:', beatId)
const s3 = createSequence(s2, 'three_act')
console.log('after createSequence, sequences:', s3.sequences.length, 'currentSequenceId:', s3.currentSequenceId)
console.log('sequence 0 id:', s3.sequences[0]?.id)
const s4 = addBeatToSequence(s3, beatId)
console.log('after addBeatToSequence, sequences[0].beats:', s4.sequences[0]?.beats?.length)
console.log('FAIL - beats should be 1 but got', s4.sequences[0]?.beats?.length)
