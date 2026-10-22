/* eslint-disable no-console -- command-line output */
// Writes src/data/modelPieces.json: the SHA-256 of each piece the AI model is downloaded in
// (see src/services/modelDownload.ts), so the browser can reject a corrupted or tampered piece
// before keeping it.
//
// Run after changing the model URL or PIECE_BYTES:
//   node scripts/model-piece-hashes.mjs path/to/model.gguf <sha256 published for the file>
// The whole-file hash is checked first (Hugging Face shows it on the file's page, and sends it as
// the X-Linked-ETag header), so hashes are never taken from a bad copy.

import { createHash } from 'node:crypto'
import { openSync, readSync, closeSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PIECE_BYTES = 8 * 1024 * 1024   // must match src/services/modelDownload.ts
const outFile = fileURLToPath(new URL('../src/data/modelPieces.json', import.meta.url))

const [file, expected] = process.argv.slice(2)
if (!file || !/^[0-9a-f]{64}$/.test(expected ?? '')) {
  console.error('Usage: node scripts/model-piece-hashes.mjs <model.gguf> <sha256 of the whole file>')
  process.exit(1)
}

const size = statSync(file).size
const fd = openSync(file, 'r')
const whole = createHash('sha256')
const pieces = []
const buf = Buffer.alloc(PIECE_BYTES)
for (let start = 0; start < size; start += PIECE_BYTES) {
  const n = readSync(fd, buf, 0, Math.min(PIECE_BYTES, size - start), start)
  const piece = buf.subarray(0, n)
  whole.update(piece)
  pieces.push(createHash('sha256').update(piece).digest('hex'))
}
closeSync(fd)

const actual = whole.digest('hex')
if (actual !== expected) {
  console.error(`The file's SHA-256 is ${actual}, not ${expected}. Not writing hashes from it.`)
  process.exit(1)
}

writeFileSync(outFile, JSON.stringify({ size, sha256: actual, pieceBytes: PIECE_BYTES, pieces }, null, 2) + '\n')
console.log(`${pieces.length} piece hashes for ${size} bytes written to src/data/modelPieces.json`)
