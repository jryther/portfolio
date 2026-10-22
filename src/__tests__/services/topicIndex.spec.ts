import { describe, it, expect } from 'vitest'
import {
  buildDocs, docsHash, encodeVectors, decodeVectors, unitVector, rankTopics, pickTopic,
  MIN_SIMILARITY, type StoredTopicVectors,
} from '../../services/topicIndex'
import { TOPIC_LIST, OFF_TOPIC_ID, UNKNOWN_ID } from '../../data/chatTree'
import storedVectors from '../../data/topicVectors.json'

describe('topicIndex', () => {
  it('builds one doc per topic label and example', () => {
    const docs = buildDocs(TOPIC_LIST)
    const expected = TOPIC_LIST.reduce((n, t) => n + 1 + (t.examples?.length ?? 0), 0)
    expect(docs).toHaveLength(expected)
    expect(docs[0]).toEqual({ id: TOPIC_LIST[0].id, text: TOPIC_LIST[0].label })
  })

  it('has precomputed vectors that match the current tree (run `npm run embed:topics` if this fails)', () => {
    const stored = storedVectors as StoredTopicVectors
    const docs = buildDocs(TOPIC_LIST)
    expect(stored.hash).toBe(docsHash(docs))
    expect(stored.ids).toEqual(docs.map(d => d.id))
    expect(decodeVectors(stored).vectors[0]).toHaveLength(stored.dims)
  })

  it('changes the hash when any example changes', () => {
    const docs = buildDocs(TOPIC_LIST)
    const edited = docs.map((d, i) => i === 3 ? { ...d, text: d.text + '!' } : d)
    expect(docsHash(edited)).not.toBe(docsHash(docs))
  })

  it('round-trips vectors through int8 storage', () => {
    const a = unitVector([3, 4, 0, -1])
    const b = unitVector([-1, 0, 2, 2])
    const stored: StoredTopicVectors = { model: '', dims: 4, hash: '', ids: ['a', 'b'], vectors: encodeVectors([a, b]) }
    const { vectors } = decodeVectors(stored)
    vectors.forEach((v, i) => [...v].forEach((x, j) => expect(x).toBeCloseTo([a, b][i][j], 1)))
  })

  it('ranks topics by their closest example', () => {
    const index = {
      ids: ['skills', 'skills', 'contact'],
      vectors: [unitVector([1, 0, 0]), unitVector([0, 1, 0]), unitVector([0, 0, 1])],
    }
    const ranked = rankTopics(unitVector([0.1, 0.9, 0.2]), index)
    expect(ranked.map(r => r.id)).toEqual(['skills', 'contact'])
  })

  it('treats weak matches as unknown (about Josh) or off topic (anything else)', () => {
    const weak = [{ id: 'skills', score: MIN_SIMILARITY - 0.1 }]
    expect(pickTopic('How tall is Josh?', weak)).toBe(UNKNOWN_ID)
    expect(pickTopic('What is the capital of France?', weak)).toBe(OFF_TOPIC_ID)
    expect(pickTopic('¿Cuánto mide él?', weak)).toBe(UNKNOWN_ID)
    expect(pickTopic('¿Cuál es su comida favorita?', weak)).toBe(UNKNOWN_ID)
    expect(pickTopic('¿Cuál es la capital de Francia?', weak)).toBe(OFF_TOPIC_ID)
    expect(pickTopic('¿Qué es el sol?', weak)).toBe(OFF_TOPIC_ID)   // "el" (the) is not "él" (he)
    expect(pickTopic('anything', [{ id: 'skills', score: MIN_SIMILARITY + 0.1 }])).toBe('skills')
  })

  it('sends weak questions without a pronoun to whichever of unknown and off topic is closer', () => {
    const personal = [{ id: UNKNOWN_ID, score: 0.5 }, { id: OFF_TOPIC_ID, score: 0.4 }]
    const general  = [{ id: OFF_TOPIC_ID, score: 0.5 }, { id: UNKNOWN_ID, score: 0.4 }]
    expect(pickTopic('¿Tiene hijos?', personal)).toBe(UNKNOWN_ID)
    expect(pickTopic('¿Qué tiempo hace?', general)).toBe(OFF_TOPIC_ID)
  })
})
