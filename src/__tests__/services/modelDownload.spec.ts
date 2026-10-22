import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { downloadModel, savedFraction, clearSaved, type PieceList } from '../../services/modelDownload'

// A stand-in for Cache Storage (jsdom has none) and a model host that answers ranged requests
// from a file whose byte i is i % 251, so a joined download can be checked byte for byte. Each
// test passes the real SHA-256 of every piece of that file, as the app does for the model.
// Response is a minimal stand-in too: the test environment's Response turns jsdom Blobs into
// the text "[object Blob]", which a browser's never does.

class FakeResponse {
  constructor(private data: Blob | Uint8Array, readonly init: { status?: number, headers?: Record<string, string> } = {}) {}
  get status() { return this.init.status ?? 200 }
  get headers() { return { get: (name: string) => this.init.headers?.[name] ?? null } }
  async blob() { return this.data instanceof Blob ? this.data : new Blob([this.data as BlobPart]) }
  // Two reads per body, so progress moves within a piece
  get body() {
    const bytes = this.data as Uint8Array
    const halves = [bytes.subarray(0, bytes.length >> 1), bytes.subarray(bytes.length >> 1)]
    return { getReader: () => ({ read: async () => halves.length ? { done: false, value: halves.shift() } : { done: true, value: undefined } }) }
  }
}

const URL_ = 'https://example.com/model.gguf'
const PIECE_BYTES = 8 * 1024 * 1024
const SIZE = PIECE_BYTES * 2 + 1000   // three pieces, the last one short

// Like the real one, it ignores a URL's #fragment
const cacheUrl = (url: string) => url.split('#')[0]
class FakeCache {
  entries = new Map<string, Blob>()
  async keys() { return [...this.entries.keys()].map(url => ({ url })) }
  async put(key: string, response: FakeResponse) { this.entries.set(cacheUrl(key), await response.blob()) }
  async match(key: string) { const blob = this.entries.get(cacheUrl(key)); return blob ? new FakeResponse(blob) : undefined }
  async delete(request: { url: string }) { return this.entries.delete(request.url) }
}

let cache: FakeCache
let requested: string[]

const byteAt = (i: number) => i % 251
const fileBytes = (from: number, to: number) => Uint8Array.from({ length: to - from + 1 }, (_, j) => byteAt(from + j))

let LIST: PieceList
beforeAll(async () => {
  const pieces: string[] = []
  for (let start = 0; start < SIZE; start += PIECE_BYTES) {
    const digest = await crypto.subtle.digest('SHA-256', fileBytes(start, Math.min(SIZE, start + PIECE_BYTES) - 1))
    pieces.push([...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join(''))
  }
  LIST = { size: SIZE, pieceBytes: PIECE_BYTES, pieces }
})

interface Serve {
  status?: number
  /** Flip a byte in this piece, as a corrupted or tampered response would */
  tamper?: number
  /** Answer with this Content-Range instead of the one asked for */
  contentRange?: string
}

const RANGE_RE = /bytes=(\d+)-(\d+)/

function serveRanges({ status = 206, tamper, contentRange }: Serve = {}) {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit & { signal?: AbortSignal }) => {
    init.signal?.throwIfAborted()
    const range = (init.headers as Record<string, string>).Range
    requested.push(range)
    const [, from, to] = range.match(RANGE_RE)!.map(Number)
    const body = fileBytes(from, to)
    if (tamper === Math.floor(from / PIECE_BYTES)) body[10] ^= 0xff
    return new FakeResponse(body, { status, headers: { 'Content-Range': contentRange ?? `bytes ${from}-${to}/${SIZE}` } })
  }))
}

async function bytesOf(blob: Blob, at: number[]) {
  const buf = new Uint8Array(await blob.arrayBuffer())
  return at.map(i => buf[i])
}

describe('downloadModel', () => {
  beforeEach(() => {
    vi.stubGlobal('Response', FakeResponse)
    cache = new FakeCache()
    requested = []
    vi.stubGlobal('caches', { open: async () => cache, delete: async () => { cache.entries.clear(); return true } })
    serveRanges()
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('downloads the file in ranged pieces and joins them in order', async () => {
    const progress: number[] = []
    const file = await downloadModel(URL_, LIST, { onProgress: (p: number) => progress.push(p) })
    expect(file.size).toBe(SIZE)
    expect(requested).toEqual([
      `bytes=0-${PIECE_BYTES - 1}`,
      `bytes=${PIECE_BYTES}-${PIECE_BYTES * 2 - 1}`,
      `bytes=${PIECE_BYTES * 2}-${SIZE - 1}`,
    ])
    // Bytes from each piece, including either side of both joins
    const at = [0, PIECE_BYTES - 1, PIECE_BYTES, PIECE_BYTES * 2, SIZE - 1]
    expect(await bytesOf(file, at)).toEqual(at.map(byteAt))
    expect(progress[progress.length - 1]).toBe(1)
    expect(progress).toEqual([...progress].sort((a, b) => a - b))   // only ever goes up
  })

  it('pauses when aborted, keeps the finished pieces, and resumes after them', async () => {
    const controller = new AbortController()
    const paused = downloadModel(URL_, LIST, {
      signal: controller.signal,
      // Abort once the first piece is in
      onProgress: (p: number) => { if (p >= PIECE_BYTES / SIZE) controller.abort() },
    })
    await expect(paused).rejects.toMatchObject({ name: 'AbortError' })
    expect(await savedFraction(URL_, LIST)).toBeCloseTo(PIECE_BYTES / SIZE)

    requested = []
    const progress: number[] = []
    const file = await downloadModel(URL_, LIST, { onProgress: (p: number) => progress.push(p) })
    // Starts where it stopped: only the missing pieces are fetched
    expect(requested).toEqual([`bytes=${PIECE_BYTES}-${PIECE_BYTES * 2 - 1}`, `bytes=${PIECE_BYTES * 2}-${SIZE - 1}`])
    expect(progress[0]).toBeCloseTo(PIECE_BYTES / SIZE)
    expect(file.size).toBe(SIZE)
  })

  it('loads a complete download from the cache without fetching', async () => {
    await downloadModel(URL_, LIST)
    expect(await savedFraction(URL_, LIST)).toBe(1)
    requested = []
    const file = await downloadModel(URL_, LIST)
    expect(requested).toEqual([])
    expect(file.size).toBe(SIZE)
  })

  it('drops pieces of an earlier model', async () => {
    await cache.put('https://example.com/old.gguf?piece=0', new FakeResponse(new Uint8Array(3)))
    await downloadModel(URL_, LIST)
    expect([...cache.entries.keys()].some(k => k.includes('old.gguf'))).toBe(false)
  })

  it('ignores and drops pieces the hash list no longer expects, such as from another piece size', async () => {
    const stale = `${URL_}?piece=0&sha256=${'0'.repeat(64)}`
    await cache.put(stale, new FakeResponse(new Uint8Array(PIECE_BYTES * 2)))
    expect(await savedFraction(URL_, LIST)).toBe(0)
    const file = await downloadModel(URL_, LIST)
    expect(requested).toHaveLength(3)
    expect(file.size).toBe(SIZE)
    expect(cache.entries.has(stale)).toBe(false)
  })

  it('still pauses when aborted after the last bytes arrive, keeping every piece', async () => {
    const controller = new AbortController()
    const paused = downloadModel(URL_, LIST, {
      signal: controller.signal,
      // While the last piece is still to be checked, saved and joined
      onProgress: (p: number) => { if (p === 1) controller.abort() },
    })
    await expect(paused).rejects.toMatchObject({ name: 'AbortError' })
    expect(await savedFraction(URL_, LIST)).toBe(1)
  })

  it('rejects a piece whose bytes fail the integrity check, and does not keep it', async () => {
    serveRanges({ tamper: 1 })
    await expect(downloadModel(URL_, LIST)).rejects.toThrow('piece 1 failed its integrity check')
    // The good piece before it is kept; the bad one never reaches the cache
    expect(await savedFraction(URL_, LIST)).toBeCloseTo(PIECE_BYTES / SIZE)
  })

  it('rejects a piece the host sent for the wrong range', async () => {
    serveRanges({ contentRange: `bytes 0-${PIECE_BYTES - 1}/999` })
    await expect(downloadModel(URL_, LIST)).rejects.toThrow('piece 0 came back as')
    expect(await savedFraction(URL_, LIST)).toBe(0)
  })

  it('fails clearly when the host ignores ranged requests', async () => {
    serveRanges({ status: 200 })
    await expect(downloadModel(URL_, LIST)).rejects.toThrow('expected a partial response, got HTTP 200')
  })

  it('refuses to start when the hash list does not fit the file', async () => {
    await expect(downloadModel(URL_, { ...LIST, pieces: LIST.pieces.slice(1) })).rejects.toThrow('2 piece hashes for 3 pieces')
  })

  it('clearSaved removes everything saved', async () => {
    await downloadModel(URL_, LIST)
    await clearSaved()
    expect(await savedFraction(URL_, LIST)).toBe(0)
  })
})

describe('modelPieces.json', () => {
  it('has one hash per piece of the pinned model', async () => {
    const { default: pieces } = await import('../../data/modelPieces.json')
    expect(pieces.pieces).toHaveLength(Math.ceil(pieces.size / pieces.pieceBytes))
    expect(pieces.pieces.every((h: string) => /^[0-9a-f]{64}$/.test(h))).toBe(true)
  })
})
