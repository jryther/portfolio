import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

// This file runs entirely in a Web Worker thread.
// WebLLM's handler receives messages from the main thread,
// runs inference here, and posts results back.
const handler = new WebWorkerMLCEngineHandler()
self.onmessage = (msg) => handler.onmessage(msg)

