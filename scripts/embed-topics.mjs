/* eslint-disable no-console -- command-line output */
// Precomputes the chat's topic vectors: embeds every topic label and example question in
// src/data/chatTree.ts and writes them to src/data/topicVectors.json.
//
// It runs the site's own embedding code (services/wllama.ts) in headless Chrome, so the
// vectors come from exactly the same wllama build and model visitors use.
//
//   npm run embed:topics
//
// Needs Node 22+ and Chrome (set CHROME_PATH if it isn't in the usual place). The first run
// downloads the model (~330 MB) into a cache under node_modules/.cache.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const outFile = fileURLToPath(new URL('../src/data/topicVectors.json', import.meta.url))
const profileDir = fileURLToPath(new URL('../node_modules/.cache/embed-topics-chrome', import.meta.url))

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]
const chromePath = CHROME_CANDIDATES.find(p => p && existsSync(p))
if (!chromePath) {
  console.error('Chrome not found. Set CHROME_PATH to your Chrome or Chromium executable.')
  process.exit(1)
}

const server = await createServer({ root, server: { port: 5199, strictPort: false }, logLevel: 'error' })
await server.listen()
const url = server.resolvedUrls.local[0]

mkdirSync(profileDir, { recursive: true })
const chrome = spawn(chromePath, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profileDir}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
])

try {
  // Chrome prints its DevTools address on stderr once it's up
  const browserWs = await new Promise((resolve, reject) => {
    let log = ''
    chrome.stderr.on('data', (d) => {
      log += d
      const m = log.match(/DevTools listening on (ws:\/\/\S+)/)
      if (m) resolve(m[1])
    })
    chrome.on('exit', code => reject(new Error(`Chrome exited (${code})\n${log}`)))
  })
  const { port } = new URL(browserWs)
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })

  let nextId = 0
  const pending = new Map()
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++nextId
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })

  await send('Page.enable')
  await send('Page.navigate', { url })
  await new Promise(r => setTimeout(r, 2000))

  console.log('Loading the model and embedding topics…')
  const started = Date.now()
  const res = await send('Runtime.evaluate', {
    expression: `import('/src/services/wllama.ts').then(async (m) => {
      await m.loadWeights()
      return JSON.stringify(await m.computeTopicVectors())
    })`,
    awaitPromise: true,
    returnByValue: true,
  })
  if (res.result?.exceptionDetails || !res.result?.result?.value) {
    throw new Error(JSON.stringify(res.result?.exceptionDetails ?? res, null, 2))
  }

  const stored = JSON.parse(res.result.result.value)
  writeFileSync(outFile, JSON.stringify(stored, null, 2) + '\n')
  console.log(`Wrote ${stored.ids.length} vectors (hash ${stored.hash}) in ${((Date.now() - started) / 1000).toFixed(1)}s`)
  ws.close()
} finally {
  chrome.kill()
  await server.close()
}
