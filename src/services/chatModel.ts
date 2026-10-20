// The in-browser embedding model that matches free-text chat questions to topics
// (see services/wllama.ts). Kept separate so the chat UI can show its name and size
// without loading wllama itself.
export const MODEL = {
  name: 'Google EmbeddingGemma 300M',
  // Pinned to a commit so a repo update can't silently change the model
  url: 'https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/0f741b5a6585bd53aeb15cd1372c56f2a0f65e12/embeddinggemma-300M-Q8_0.gguf',
  sizeLabel: '~330 MB',
  // EmbeddingGemma expects a task prefix; questions and examples share one so they compare
  // like for like
  prefix: 'task: sentence similarity | query: ',
  dims: 768,
}
