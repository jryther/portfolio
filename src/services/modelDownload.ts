// Downloads the AI model in pieces that are kept as they arrive, so a download can be paused
// (or cut off by a closed tab or a dropped connection) and picked up where it stopped instead
// of starting the ~330 MB over.
//
// Each piece is a ranged request (the model host supports them) saved to Cache Storage under
// the model URL plus ?piece=<index> (a query, not a #fragment: the cache ignores fragments). Once every piece is in, they're joined into one Blob for wllama.
// The cache also serves as the model cache on later visits.

const CACHE_NAME = 'ai-model'
// A pause throws away at most the piece in progress
export const PIECE_BYTES = 8 * 1024 * 1024

export interface DownloadOptions {
  /** Total file size in bytes (the URL is pinned, so it's known in advance) */
  size: number
  /** Called with 0–1 as bytes arrive, including pieces already saved */
  onProgress?: (fraction: number) => void
  /** Aborting it pauses the download; saved pieces are kept */
  signal?: AbortSignal
}

const pieceCount = (size: number) => Math.ceil(size / PIECE_BYTES)
const piecePrefix = (url: string) => `${url}?piece=`
const pieceKey = (url: string, i: number) => piecePrefix(url) + i
const pieceRange = (size: number, i: number) => {
  const start = i * PIECE_BYTES
  return { start, end: Math.min(size, start + PIECE_BYTES) - 1 }
}

function openCache(): Promise<Cache> {
  if (typeof caches === 'undefined') throw new Error('Cache Storage is not available')
  return caches.open(CACHE_NAME)
}

/** Indexes of the pieces of this file already saved */
async function savedPieces(cache: Cache, url: string): Promise<Set<number>> {
  const saved = new Set<number>()
  const prefix = piecePrefix(url)
  for (const request of await cache.keys()) {
    if (request.url.startsWith(prefix)) saved.add(Number(request.url.slice(prefix.length)))
  }
  return saved
}

/** How much of the file is saved, 0–1 (1 = the whole model is cached) */
export async function savedFraction(url: string, size: number): Promise<number> {
  try {
    const cache = await openCache()
    const saved = await savedPieces(cache, url)
    let bytes = 0
    for (const i of saved) { const { start, end } = pieceRange(size, i); bytes += end - start + 1 }
    return bytes / size
  } catch {
    return 0
  }
}

/** Removes every saved piece, of this model and any earlier one */
export async function clearSaved(): Promise<void> {
  if (typeof caches !== 'undefined') await caches.delete(CACHE_NAME)
}

/** Downloads one piece, reporting bytes as they arrive, and returns it once complete */
async function fetchPiece(url: string, size: number, i: number, signal: AbortSignal | undefined, onBytes: (n: number) => void): Promise<Blob> {
  const { start, end } = pieceRange(size, i)
  const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, signal })
  if (response.status !== 206) throw new Error(`Model download: expected a partial response, got HTTP ${response.status}`)
  const reader = response.body!.getReader()
  const parts: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
    received += value.byteLength
    onBytes(value.byteLength)
  }
  const expected = end - start + 1
  if (received !== expected) throw new Error(`Model download: piece ${i} has ${received} bytes, expected ${expected}`)
  return new Blob(parts as BlobPart[])
}

/**
 * The whole file as one Blob: saved pieces from the cache, the rest downloaded (and saved).
 * Rejects with an AbortError when the signal aborts; everything saved so far is kept.
 */
export async function downloadModel(url: string, { size, onProgress = () => {}, signal }: DownloadOptions): Promise<Blob> {
  const cache = await openCache()
  // Pieces of a different model (an earlier pinned URL) are no longer needed
  for (const request of await cache.keys()) {
    if (!request.url.startsWith(piecePrefix(url))) await cache.delete(request)
  }

  const count = pieceCount(size)
  const saved = await savedPieces(cache, url)
  let done = 0
  for (const i of saved) { const { start, end } = pieceRange(size, i); done += end - start + 1 }
  onProgress(done / size)

  for (let i = 0; i < count; i++) {
    if (saved.has(i)) continue
    signal?.throwIfAborted()
    let inPiece = 0
    const piece = await fetchPiece(url, size, i, signal, (n) => {
      inPiece += n
      onProgress((done + inPiece) / size)
    })
    await cache.put(pieceKey(url, i), new Response(piece))
    done += piece.size
  }

  const pieces: Blob[] = []
  for (let i = 0; i < count; i++) {
    const response = await cache.match(pieceKey(url, i))
    if (!response) throw new Error(`Model download: piece ${i} is missing from the cache`)
    pieces.push(await response.blob())
  }
  const file = new Blob(pieces)
  if (file.size !== size) throw new Error(`Model download: got ${file.size} bytes, expected ${size}`)
  onProgress(1)
  return file
}
