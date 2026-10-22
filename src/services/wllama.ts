import { Wllama, LoggerWithoutDebug } from '@wllama/wllama/esm/index.js'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { TOPIC_LIST } from '../data/chatTree'
import storedVectors from '../data/topicVectors.json'
import { MODEL } from './chatModel'
import { createLogger } from './errors'
import {
  buildDocs, docsHash, decodeVectors, encodeVectors, unitVector, rankTopics, pickTopic,
  type TopicIndex, type StoredTopicVectors,
} from './topicIndex'

// In-browser embedding model that matches free-text questions to a decision-tree topic.
// It runs llama.cpp compiled to WebAssembly (wllama) inside a worker, on the CPU only:
// no GPU shaders to compile, and it works on devices without WebGPU.

let wllama: Wllama | null = null
let index: TopicIndex | null = null
let loadPromise: Promise<void> | null = null

const log = createLogger('wllama')

function getInstance(): Wllama {
  wllama ??= new Wllama({ default: wasmUrl }, { logger: LoggerWithoutDebug, suppressNativeLog: true })
  return wllama
}

/** True when the model file is already in the browser cache, so loading skips the download */
export async function isModelCached(): Promise<boolean> {
  try {
    const entries = await getInstance().cacheManager.list()
    return entries.some(e => e.metadata?.originalURL === MODEL.url)
  } catch {
    return false
  }
}

/** Unit-length embedding of one piece of text */
export async function embed(text: string): Promise<Float32Array> {
  const instance = getInstance()
  if (!instance.isModelLoaded()) throw new Error('Model not loaded')
  const res = await instance.createEmbedding({ input: MODEL.prefix + text })
  return unitVector(res.data[0].embedding as number[])
}

/** Embeds every topic example. Used by scripts/embed-topics.mjs, and at runtime only if the
 * stored vectors are out of date */
export async function computeTopicVectors(): Promise<StoredTopicVectors> {
  const docs = buildDocs(TOPIC_LIST)
  const vectors: Float32Array[] = []
  for (const doc of docs) vectors.push(await embed(doc.text))
  return {
    model: MODEL.url,
    dims: MODEL.dims,
    hash: docsHash(docs),
    ids: docs.map(d => d.id),
    vectors: encodeVectors(vectors),
  }
}

/** Download (or read from cache) and load just the model weights */
export async function loadWeights(onProgress: (progress: number) => void = () => {}): Promise<void> {
  await getInstance().loadModelFromUrl(MODEL.url, {
    n_ctx: 512,
    n_gpu_layers: 0,
    embeddings: true,
    progressCallback: ({ loaded, total }) => onProgress(total ? loaded / total : 0),
  })
}

/**
 * Load the model plus the topic vectors it's compared against.
 * onProgress receives 0–1 for the download.
 */
export function loadModel(onProgress: (progress: number) => void): Promise<void> {
  let fromCache = false
  loadPromise ??= (async () => {
    fromCache = await isModelCached()
    await loadWeights(onProgress)
    const stored = storedVectors as StoredTopicVectors
    if (stored.hash === docsHash(buildDocs(TOPIC_LIST))) {
      index = decodeVectors(stored)
    } else {
      log.warn('topicVectors.json is out of date, run `npm run embed:topics`. Embedding topics in the browser instead.')
      index = decodeVectors(await computeTopicVectors())
    }
  })().catch(async (e) => {
    loadPromise = null
    const failed = wllama
    // A copy from the browser cache that won't load is likely damaged, and a retry would read the
    // same file again, so drop it: the retry downloads a fresh one
    if (fromCache) {
      await failed?.cacheManager.delete(MODEL.url).catch((err: unknown) => {
        log.warn('Could not remove the cached model after a failed load', err)
      })
    }
    // A load that failed after the worker started leaves it half initialized, and wllama refuses
    // to load into it again ("Module is already initialized"), so a retry starts afresh
    wllama = null
    failed?.exit().catch(() => {})
    throw e
  })
  return loadPromise
}

/** The topic ID whose examples are closest in meaning to the question */
export async function routeWithModel(question: string): Promise<string> {
  if (!index) throw new Error('Model not loaded')
  return pickTopic(question, rankTopics(await embed(question), index))
}
