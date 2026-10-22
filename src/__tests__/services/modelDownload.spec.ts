import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadModel, savedFraction, clearSaved, PIECE_BYTES } from '../../services/modelDownload'

// A stand-in for Cache Storage (jsdom has none) and a model host that answers ranged requests
// from a file whose byte i is i % 251, so a joined download can be checked byte for byte.
// Response is a minimal stand-in too: the test environment's Response turns jsdom Blobs into
// the text "[object Blob]", which a browser's never does.

class FakeResponse {
  constructor(private data: Blob | Uint8Array, readonly init: { status?: number } = {}) {}
  get status() { return this.init.status ?? 200 }
  async blob() { return this.data instanceof Blob ? this.data : new Blob([this.data as BlobPart]) }
  // Two reads per body, so progress moves within a piece
  get body() {
    const bytes = this.data as Uint8Array
    const halves = [bytes.subarray(0, bytes.length >> 1), bytes.subarray(bytes.length >> 1)]
    return { getReader: () => ({ read: async () => halves.length ? { done: false, value: halves.shift() } : { done: true, value: undefined } }) }
  }
}

const URL_ = 'https://example.com/model.gguf'
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

function byteAt(i: number) { return i % 251 }

function serveRanges(status = 206) {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit & { signal?: AbortSignal }) => {
    init.signal?.throwIfAborted()
    const range = (init.headers as Record<string, string>).Range
    requested.push(range)
    const [, from, to] = range.match(/bytes=(\d+)-(\d+)/)!.map(Number)
    const body = Uint8Array.from({ length: to - from + 1 }, (_, j) => byteAt(from + j))
    return new FakeResponse(body, { status })
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
    const file = await downloadModel(URL_, { size: SIZE, onProgress: p => progress.push(p) })
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
    const paused = downloadModel(URL_, {
      size: SIZE,
      signal: controller.signal,
      // Abort once the first piece is in
      onProgress: p => { if (p >= PIECE_BYTES / SIZE) controller.abort() },
    })
    await expect(paused).rejects.toMatchObject({ name: 'AbortError' })
    expect(await savedFraction(URL_, SIZE)).toBeCloseTo(PIECE_BYTES / SIZE)

    requested = []
    const progress: number[] = []
    const file = await downloadModel(URL_, { size: SIZE, onProgress: p => progress.push(p) })
    // Starts where it stopped: only the missing pieces are fetched
    expect(requested).toEqual([`bytes=${PIECE_BYTES}-${PIECE_BYTES * 2 - 1}`, `bytes=${PIECE_BYTES * 2}-${SIZE - 1}`])
    expect(progress[0]).toBeCloseTo(PIECE_BYTES / SIZE)
    expect(file.size).toBe(SIZE)
  })

  it('loads a complete download from the cache without fetching', async () => {
    await downloadModel(URL_, { size: SIZE })
    expect(await savedFraction(URL_, SIZE)).toBe(1)
    requested = []
    const file = await downloadModel(URL_, { size: SIZE })
    expect(requested).toEqual([])
    expect(file.size).toBe(SIZE)
  })

  it('drops pieces of an earlier model', async () => {
    await cache.put('https://example.com/old.gguf?piece=0', new FakeResponse(new Uint8Array(3)))
    await downloadModel(URL_, { size: SIZE })
    expect([...cache.entries.keys()].some(k => k.includes('old.gguf'))).toBe(false)
  })

  it('fails clearly when the host ignores ranged requests', async () => {
    serveRanges(200)
    await expect(downloadModel(URL_, { size: SIZE })).rejects.toThrow('expected a partial response, got HTTP 200')
  })

  it('clearSaved removes everything saved', async () => {
    await downloadModel(URL_, { size: SIZE })
    await clearSaved()
    expect(await savedFraction(URL_, SIZE)).toBe(0)
  })
})
