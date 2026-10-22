import { test as base, expect, type Page, type Route } from '@playwright/test'

// Shared setup for every spec: the page runs offline. Google Fonts, the ~330 MB AI model on
// Hugging Face and the Formspree endpoint are all blocked unless a test routes them itself,
// so a run never downloads the model or sends a real message.

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(url => url.hostname !== 'localhost', route => route.abort())
    await use(context)
  },
})

export { expect }

export const MODEL_URL = /huggingface\.co/
export const FORMSPREE_URL = /formspree\.io/

/** Opens the page and waits for the app to mount */
export async function gotoHome(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Ryther' })).toBeVisible()
}

/** Scrolls a section to the top of the viewport, the way landing from the nav would */
export async function scrollToSection(page: Page, id: string) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
}

/** Scrolls a section into the middle of the viewport (where the chat section counts as "in view") */
export async function scrollToCenter(page: Page, id: string) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
}

/**
 * Holds the AI model download open until release() is called, so tests can look at the
 * loading state. fail() aborts it instead, which puts the chat in its error state.
 */
export async function holdModelDownload(page: Page) {
  const pending: Route[] = []
  await page.context().route(MODEL_URL, route => { pending.push(route) })
  return {
    fail: async () => {
      await page.context().unroute(MODEL_URL)
      await page.context().route(MODEL_URL, route => route.abort())
      await Promise.all(pending.splice(0).map(r => r.abort().catch(() => {})))
    },
  }
}

/** The floating chat popup and its parts */
export function chatPopup(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Ask about Josh' })
  return {
    fab: page.locator('.fab'),
    dialog,
    ...chatParts(dialog),
  }
}

/** The full-page chat in the "Ask" section */
export function chatSection(page: Page) {
  const region = page.getByRole('region', { name: 'Chat about Josh' })
  return {
    section: page.locator('#chat'),
    region,
    ...chatParts(region),
  }
}

function chatParts(root: ReturnType<Page['locator']>) {
  return {
    input: root.getByRole('textbox', { name: 'Ask a question about Josh' }),
    send: root.getByRole('button', { name: 'Send', exact: true }),
    clear: root.getByRole('button', { name: 'Clear' }),
    userBubbles: root.locator('.bubble.from-user'),
    assistantBubbles: root.locator('.bubble.from-assistant'),
    chips: root.locator('.topic-chip'),
    chip: (label: string) => root.locator('.topic-chip', { hasText: label }),
    gameButton: root.locator('.chat-header .header-btn').first(),
    loadButton: root.getByRole('button', { name: /^Load AI/ }),
  }
}
