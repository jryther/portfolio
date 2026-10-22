// Downloads the AI model in pieces that are kept as they arrive, so a download can be paused
// (or cut off by a closed tab or a dropped connection) and picked up where it stopped instead
// of starting the ~330 MB over.
//
// Each piece is a ranged request (the model host supports them) saved to Cache Storage under
// the model URL plus ?piece=<index>&sha256=<its hash> (a query, not a #fragment: the cache
// ignores fragments). A piece is only kept if its SHA-256 matches the list in
// data/modelPieces.json, so a corrupted or tampered download is never saved or loaded. The hash
// in the key means a saved piece only counts while the list still expects it: a new piece size
// or model gives new hashes, and the old pieces are cleared instead of being joined in. Once
// every piece is in, they're joined into one Blob for wllama. The cache also serves as the model
// cache on later visits.

const CACHE_NAME = 'ai-model'

/** The file's size and the SHA-256 (hex) of each piece, in order: data/modelPieces.json, from
 * scripts/model-piece-hashes.mjs */
export interface PieceList {
  size: number
  pieceBytes: number
  pieces: readonly string[]
}

export interface DownloadOptions {
  /** Called with 0–1 as bytes arrive, including pieces already saved */
  onProgress?: (fraction: number) => void
  /** Aborting it pauses the download; saved pieces are kept */
  signal?: AbortSignal
}

const pieceKey = (url: string, list: PieceList, i: number) => `${url}?piece=${i}&sha256=${list.pieces[i]}`
const pieceRange = (list: PieceList, i: number) => {
  const start = i * list.pieceBytes
  return { start, end: Math.min(list.size, start + list.pieceBytes) - 1 }
}

function openCache(): Promise<Cache> {
  if (typeof caches === 'undefined') throw new Error('Cache Storage is not available')
  return caches.open(CACHE_NAME)
}

/** Indexes of the pieces of this file already saved, under the hash the list expects */
async function savedPieces(cache: Cache, url: string, list: PieceList): Promise<Set<number>> {
  const keys = new Set((await cache.keys()).map(request => request.url))
  const saved = new Set<number>()
  list.pieces.forEach((_, i) => { if (keys.has(pieceKey(url, list, i))) saved.add(i) })
  return saved
}

function savedBytes(list: PieceList, saved: Set<number>): number {
  let bytes = 0
  for (const i of saved) { const { start, end } = pieceRange(list, i); bytes += end - start + 1 }
  return bytes
}

/** How much of the file is saved, 0–1 (1 = the whole model is cached) */
export async function savedFraction(url: string, list: PieceList): Promise<number> {
  try {
    return savedBytes(list, await savedPieces(await openCache(), url, list)) / list.size
  } catch {
    return 0
  }
}

/** Removes every saved piece, of this model and any earlier one */
export async function clearSaved(): Promise<void> {
  if (typeof caches !== 'undefined') await caches.delete(CACHE_NAME)
}

async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Downloads one piece, reporting bytes as they arrive, and returns it once complete and verified */
async function fetchPiece(url: string, list: PieceList, i: number, signal: AbortSignal | undefined, onBytes: (n: number) => void): Promise<Blob> {
  const { start, end } = pieceRange(list, i)
  const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, signal })
  if (response.status !== 206) throw new Error(`Model download: expected a partial response, got HTTP ${response.status}`)
  const range = response.headers.get('Content-Range')
  if (range !== `bytes ${start}-${end}/${list.size}`) throw new Error(`Model download: piece ${i} came back as "${range}"`)
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
  const piece = new Blob(parts as BlobPart[])
  if (await sha256Hex(piece) !== list.pieces[i]) throw new Error(`Model download: piece ${i} failed its integrity check`)
  return piece
}

/**
 * The whole file as one Blob: saved pieces from the cache, the rest downloaded (and saved).
 * Rejects with an AbortError when the signal aborts; everything saved so far is kept.
 */
export async function downloadModel(url: string, list: PieceList, { onProgress = () => {}, signal }: DownloadOptions = {}): Promise<Blob> {
  const count = Math.ceil(list.size / list.pieceBytes)
  if (list.pieces.length !== count) throw new Error(`Model download: ${list.pieces.length} piece hashes for ${count} pieces`)
  const cache = await openCache()
  // Anything this list doesn't expect (another model, piece size or hash) is no longer needed
  const expected = new Set(list.pieces.map((_, i) => pieceKey(url, list, i)))
  for (const request of await cache.keys()) {
    if (!expected.has(request.url)) await cache.delete(request)
  }

  const saved = await savedPieces(cache, url, list)
  let done = savedBytes(list, saved)
  onProgress(done / list.size)

  for (let i = 0; i < count; i++) {
    if (saved.has(i)) continue
    signal?.throwIfAborted()
    let inPiece = 0
    const piece = await fetchPiece(url, list, i, signal, (n) => {
      inPiece += n
      onProgress((done + inPiece) / list.size)
    })
    await cache.put(pieceKey(url, list, i), new Response(piece))
    done += piece.size
  }

  const pieces: Blob[] = []
  for (let i = 0; i < count; i++) {
    const response = await cache.match(pieceKey(url, list, i))
    if (!response) throw new Error(`Model download: piece ${i} is missing from the cache`)
    pieces.push(await response.blob())
  }
  const file = new Blob(pieces)
  if (file.size !== list.size) throw new Error(`Model download: got ${file.size} bytes, expected ${list.size}`)
  // A pause while the last piece was checked, saved or joined still counts: every piece is kept,
  // so resuming goes straight to loading
  signal?.throwIfAborted()
  onProgress(1)
  return file
}
