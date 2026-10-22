/* eslint-disable no-console -- command-line output */
// Checks Hugging Face for a newer EmbeddingGemma model file than the one pinned in
// src/services/chatModel.ts, and repins it if there is one. Dependabot can't watch Hugging
// Face, so the model-update workflow runs this weekly and opens a PR with the result.
//
//   node scripts/check-model-update.mjs
//
// Compares the model file itself, not the repo's latest commit: a README edit moves the
// commit but not the model, and shouldn't open a PR. When the file has changed, it rewrites
// the URL's commit, `bytes` and `sizeLabel`; run `npm run embed:topics` afterwards, because a
// new model means new topic vectors.
//
// Like Dependabot's cooldown, a commit has to be COOLDOWN_DAYS old before it's proposed.
// In GitHub Actions it writes `updated` (true/false) and `revision` to $GITHUB_OUTPUT.

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const COOLDOWN_DAYS = 7
const modelFile = fileURLToPath(new URL('../src/services/chatModel.ts', import.meta.url))

const source = readFileSync(modelFile, 'utf8')
const match = source.match(/https:\/\/huggingface\.co\/([^/]+\/[^/]+)\/resolve\/([0-9a-f]{40})\/([^'"]+)/)
if (!match) {
  console.error(`No pinned Hugging Face URL found in ${modelFile}`)
  process.exit(1)
}
const [pinnedUrl, repo, pinnedRev, path] = match

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} returned ${res.status}`)
  return res.json()
}

// The model file's content hash (and size) at a commit
async function fileAt(rev) {
  const tree = await getJson(`https://huggingface.co/api/models/${repo}/tree/${rev}`)
  const file = tree.find(f => f.path === path)
  if (!file) throw new Error(`${path} is missing from ${repo} at ${rev}; pick a new file by hand`)
  return { oid: file.lfs?.oid ?? file.oid, size: file.size }
}

function setOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v}\n`).join(''))
}

const latest = await getJson(`https://huggingface.co/api/models/${repo}/revision/main`)
const [pinned, current] = await Promise.all([fileAt(pinnedRev), fileAt(latest.sha)])

if (pinned.oid === current.oid) {
  console.log(`${path} is unchanged at ${repo}@${latest.sha}`)
  setOutput({ updated: false })
  process.exit(0)
}

const ageDays = (Date.now() - new Date(latest.lastModified).getTime()) / 86_400_000
if (ageDays < COOLDOWN_DAYS) {
  console.log(`${path} changed in ${latest.sha}, but it's only ${ageDays.toFixed(1)} days old; waiting for ${COOLDOWN_DAYS}`)
  setOutput({ updated: false })
  process.exit(0)
}

// Matches the existing style: 333_590_944 and '~330 MB'
const bytes = String(current.size).replace(/\B(?=(\d{3})+(?!\d))/g, '_')
const sizeLabel = `~${Math.round(current.size / 1e7) * 10} MB`

const updated = source
  .replace(pinnedUrl, pinnedUrl.replace(pinnedRev, latest.sha))
  .replace(/bytes: [\d_]+,/, `bytes: ${bytes},`)
  .replace(/sizeLabel: '[^']*',/, `sizeLabel: '${sizeLabel}',`)
writeFileSync(modelFile, updated)

console.log(`Repinned ${path} from ${pinnedRev} to ${latest.sha} (${bytes} bytes)`)
setOutput({ updated: true, revision: latest.sha })
