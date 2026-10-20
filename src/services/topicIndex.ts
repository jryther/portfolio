import type { ChatTopic } from '../data/chatTree'
import { OFF_TOPIC_ID, UNKNOWN_ID } from '../data/chatTree'
import { MODEL } from './chatModel'

// Semantic matching for the chat: every topic's label and example questions are embedded
// once (precomputed into topicVectors.json by scripts/embed-topics.mjs), and a visitor's
// question goes to the topic with the most similar example.

export interface TopicDoc {
  id: string
  text: string
}

export interface TopicIndex {
  ids: string[]
  vectors: Float32Array[]
}

/** Shape of src/data/topicVectors.json */
export interface StoredTopicVectors {
  model: string
  dims: number
  hash: string
  ids: string[]
  /** Base64 of int8 values (unit vector × 127), docs back to back */
  vectors: string
}

/** Below this similarity nothing matches well enough, so the reply is "off topic" or "not sure" */
export const MIN_SIMILARITY = 0.6

export function buildDocs(topics: readonly ChatTopic[]): TopicDoc[] {
  return topics.flatMap(t => [t.label, ...(t.examples ?? [])].map(text => ({ id: t.id, text })))
}

/** Fingerprint of everything the stored vectors depend on, so stale vectors are detected */
export function docsHash(docs: readonly TopicDoc[]): string {
  const source = [MODEL.url, MODEL.prefix, MODEL.dims, ...docs.map(d => `${d.id}\t${d.text}`)].join('\n')
  let h = 0x811c9dc5  // FNV-1a
  for (let i = 0; i < source.length; i++) {
    h ^= source.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function normalize(v: ArrayLike<number>): Float32Array {
  let sum = 0
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i]
  const n = Math.sqrt(sum) || 1
  return Float32Array.from(v, x => x / n)
}

export function encodeVectors(vectors: readonly Float32Array[]): string {
  const bytes = new Uint8Array(vectors.length * (vectors[0]?.length ?? 0))
  let k = 0
  for (const v of vectors) for (const x of v) bytes[k++] = Math.max(-127, Math.min(127, Math.round(x * 127))) & 0xff
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

export function decodeVectors(stored: StoredTopicVectors): TopicIndex {
  const bin = atob(stored.vectors)
  const signed = Int8Array.from(bin, c => (c.charCodeAt(0) << 24) >> 24)
  const vectors = stored.ids.map((_, i) => normalize(signed.subarray(i * stored.dims, (i + 1) * stored.dims)))
  return { ids: stored.ids, vectors }
}

/** Best similarity per topic, highest first */
export function rankTopics(query: Float32Array, index: TopicIndex): { id: string, score: number }[] {
  const best = new Map<string, number>()
  index.vectors.forEach((v, i) => {
    let dot = 0
    for (let j = 0; j < v.length; j++) dot += v[j] * query[j]
    const id = index.ids[i]
    if (!(best.get(id)! >= dot)) best.set(id, dot)
  })
  return [...best].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score)
}

const ABOUT_JOSH = /\b(josh|ryther|he|him|his)\b/i

/** Topic for a question given its ranking; weak matches become "off topic" or "not sure" */
export function pickTopic(question: string, ranked: readonly { id: string, score: number }[]): string {
  const top = ranked[0]
  if (top && top.score >= MIN_SIMILARITY) return top.id
  return ABOUT_JOSH.test(question) ? UNKNOWN_ID : OFF_TOPIC_ID
}
