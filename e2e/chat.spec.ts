import {
  test, expect, gotoHome, scrollToCenter, chatPopup, chatSection, holdModelDownload,
} from './fixtures'

// The AI chat: the floating popup, the full-page "Ask" section, and the conversation they share.
// The model download is always blocked or held, so answers here come from keyword routing.

const WELCOME = /^Hi! I'm Josh's assistant/
const WELCOME_CHIPS = [
  'Who is Josh?',
  "What's his main project?",
  'What are his skills?',
  "What's his biggest impact?",
  'How can I contact him?',
]

test.describe('chat popup', () => {
  test('opens from the floating button with a welcome and topics', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await expect(chat.dialog).toBeHidden()

    await chat.fab.click()
    await expect(chat.dialog).toBeVisible()
    await expect(chat.dialog).toBeFocused()
    await expect(chat.fab).toBeHidden()
    await expect(chat.assistantBubbles).toHaveText([WELCOME])
    await expect(chat.chips).toHaveText(WELCOME_CHIPS)
    await expect(chat.dialog.getByText('Ask About Josh')).toBeVisible()
  })

  test('closes with the close button and with Escape, handing focus back', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)

    await chat.fab.click()
    await chat.dialog.getByRole('button', { name: 'Close chat' }).click()
    await expect(chat.dialog).toBeHidden()
    await expect(chat.fab).toBeFocused()

    await chat.fab.click()
    await expect(chat.dialog).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(chat.dialog).toBeHidden()
    await expect(chat.fab).toBeFocused()
  })

  test('keeps the conversation when closed and reopened', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.chip('Who is Josh?').click()
    await expect(chat.assistantBubbles).toHaveCount(2)
    await chat.dialog.getByRole('button', { name: 'Close chat' }).click()
    await chat.fab.click()
    await expect(chat.userBubbles).toHaveText(['Who is Josh?'])
    await expect(chat.assistantBubbles).toHaveCount(2)
  })

  // The clicked chip is gone once the answer arrives; focus must stay in the popup, not drop to <body>
  test('Escape still closes the popup after picking a topic', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.chip('Who is Josh?').click()
    await expect(chat.assistantBubbles).toHaveCount(2)
    await expect(chat.dialog.locator('.chat-panel')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(chat.dialog).toBeHidden()
    await expect(chat.fab).toBeFocused()
  })

  test('picking a topic by keyboard keeps focus in the chat', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.chip('Who is Josh?').focus()
    await page.keyboard.press('Enter')
    await expect(chat.assistantBubbles).toHaveCount(2)
    // The next Tab continues inside the popup
    await page.keyboard.press('Tab')
    expect(await chat.dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
  })

  // The text box is disabled while the answer arrives; focus must stay in the popup, not drop to <body>
  test('sending a question by keyboard keeps focus in the chat', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.input.fill('hello')
    await chat.input.press('Enter')
    await expect(chat.assistantBubbles).toHaveCount(2)
    expect(await chat.dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(chat.fab).toBeFocused()
  })

  test('a topic chip asks its question and offers follow-ups', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.chip('Who is Josh?').click()

    await expect(chat.userBubbles).toHaveText(['Who is Josh?'])
    await expect(chat.assistantBubbles.nth(1)).toContainText('Josh Ryther is a full-stack software engineer at Pearson')
    await expect(chat.chips).toHaveText([
      "What's his main project?",
      'How much experience does he have?',
      'What are his skills?',
      "What's his biggest impact?",
    ])

    // Follow-ups only offer what hasn't been asked yet
    await chat.chip('How much experience does he have?').click()
    await expect(chat.assistantBubbles).toHaveCount(3)
    await expect(chat.chips).not.toContainText(['How much experience does he have?'])
  })

  test('answers a typed question by keyword', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()

    await chat.input.fill('How do I get in touch?')
    await chat.send.click()
    await expect(chat.userBubbles).toHaveText(['How do I get in touch?'])
    await expect(chat.assistantBubbles.nth(1)).toContainText('jryther91@gmail.com')
    await expect(chat.input).toHaveValue('')
  })

  test('Enter sends the question', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.input.fill('hello')
    await chat.input.press('Enter')
    await expect(chat.userBubbles).toHaveText(['hello'])
    await expect(chat.assistantBubbles.nth(1)).toHaveText(/^Hi there! I can tell you about Josh/)
  })

  test("says when it doesn't know", async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.input.fill('zxqv blorp')
    await chat.input.press('Enter')
    await expect(chat.assistantBubbles.nth(1)).toHaveText(/^That's not something I have details on/)
  })

  test('an empty or blank question sends nothing', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.send.click()
    await chat.input.fill('   ')
    await chat.input.press('Enter')
    await expect(chat.userBubbles).toHaveCount(0)
    await expect(chat.assistantBubbles).toHaveCount(1)
  })

  test('counts characters up to the 400 limit', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await expect(chat.dialog.getByText('0/400')).toBeVisible()
    await chat.input.fill('hello')
    await expect(chat.dialog.getByText('5/400')).toBeVisible()
    await chat.input.fill('x'.repeat(450))
    await expect(chat.input).toHaveValue('x'.repeat(400))
    await expect(chat.dialog.getByText('400/400')).toBeVisible()
  })

  test('Clear starts the conversation over', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.chip('What are his skills?').click()
    await expect(chat.assistantBubbles).toHaveCount(2)

    await chat.clear.click()
    await expect(chat.userBubbles).toHaveCount(0)
    await expect(chat.assistantBubbles).toHaveText([WELCOME])
    await expect(chat.chips).toHaveText(WELCOME_CHIPS)
  })

  test('shows a thinking indicator, then types the answer out', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.chip('Who is Josh?').click()

    await expect(chat.dialog.getByLabel('Thinking')).toBeVisible()
    // Input and Send wait while the reply is on its way
    await expect(chat.send).toBeDisabled()
    await expect(chat.dialog.getByLabel('Thinking')).toBeHidden()
    await expect(chat.assistantBubbles.nth(1)).toContainText('pharmacy technician')
    await expect(chat.send).toBeEnabled()
  })
})

test.describe('chat section', () => {
  test('greets when scrolled into view and hides the floating button', async ({ page }) => {
    await gotoHome(page)
    const popup = chatPopup(page)
    const chat = chatSection(page)
    await expect(popup.fab).toBeVisible()

    await scrollToCenter(page, 'chat')
    await expect(chat.assistantBubbles).toHaveText([WELCOME])
    await expect(chat.chips).toHaveText(WELCOME_CHIPS)
    await expect(popup.fab).toBeHidden()
    await expect(chat.region.locator('.status-pill')).toHaveText('Quick answers')

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(popup.fab).toBeVisible()
  })

  test('closes an open popup when the section comes into view', async ({ page }) => {
    await gotoHome(page)
    const popup = chatPopup(page)
    await popup.fab.click()
    await expect(popup.dialog).toBeVisible()

    await scrollToCenter(page, 'chat')
    await expect(popup.dialog).toBeHidden()
    await expect(popup.fab).toBeHidden()
  })

  test('shares one conversation with the popup', async ({ page }) => {
    await gotoHome(page)
    const popup = chatPopup(page)
    await popup.fab.click()
    await popup.chip('What are his skills?').click()
    await expect(popup.assistantBubbles).toHaveCount(2)

    await scrollToCenter(page, 'chat')
    const chat = chatSection(page)
    await expect(chat.userBubbles).toHaveText(['What are his skills?'])
    await expect(chat.assistantBubbles).toHaveCount(2)

    await chat.chip(await chat.chips.first().innerText()).click()
    await expect(chat.assistantBubbles).toHaveCount(3)
    await expect(chat.region.locator('.chat-panel')).toBeFocused()

    await page.evaluate(() => window.scrollTo(0, 0))
    await popup.fab.click()
    await expect(popup.assistantBubbles).toHaveCount(3)
  })

  test('an example question fills the input without sending it', async ({ page }) => {
    await gotoHome(page)
    await scrollToCenter(page, 'chat')
    const chat = chatSection(page)
    await expect(chat.assistantBubbles).toHaveCount(1)

    const example = 'Would he do well somewhere fast-moving?'
    await chat.input.fill('something else')
    await chat.section.getByRole('button', { name: `“${example}”` }).click()
    await expect(chat.input).toHaveValue(example)
    await expect(chat.input).toBeFocused()
    await expect(chat.userBubbles).toHaveCount(0)

    await chat.send.click()
    await expect(chat.userBubbles).toHaveText([example])
    await expect(chat.assistantBubbles).toHaveCount(2)
  })

  test('suggests loading the model before trying the examples', async ({ page }) => {
    await gotoHome(page)
    await expect(page.locator('#chat .tip')).toHaveText(/load the AI model in the chat first/)
  })
})

test.describe('AI model loading', () => {
  test('offers the model download in the chat', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await expect(chat.dialog.getByText(/Load a small AI model that runs in your browser/)).toBeVisible()
    await expect(chat.loadButton).toHaveText('Load AI · ~330 MB')
    // The tooltip adds the model's details, so screen readers get them as the description
    await expect(chat.loadButton).toHaveAccessibleDescription('Google EmbeddingGemma 300M, ~330 MB one-time download')
  })

  test('while loading, free text waits but topic chips still answer', async ({ page }) => {
    await holdModelDownload(page)
    await gotoHome(page)
    await scrollToCenter(page, 'chat')
    const chat = chatSection(page)
    await chat.loadButton.click()

    await expect(chat.region.getByText('Downloading AI model… this only happens once.')).toBeVisible()
    await expect(chat.region.getByText('0%', { exact: true })).toBeVisible()
    await expect(chat.region.locator('.status-pill')).toHaveText('Loading AI · 0%')
    await expect(chat.input).toBeDisabled()
    await expect(chat.input).toHaveAttribute('placeholder', 'Loading the AI model… pick a topic above meanwhile')
    await expect(chat.send).toBeDisabled()
    await expect(chat.loadButton).toBeHidden()

    await chat.chip('Who is Josh?').click()
    await expect(chat.assistantBubbles).toHaveCount(2)
  })

  test('the download can be paused and resumed, and quick answers work while paused', async ({ page }) => {
    await holdModelDownload(page)
    await gotoHome(page)
    await scrollToCenter(page, 'chat')
    const chat = chatSection(page)
    await chat.loadButton.click()

    const pause = chat.region.getByRole('button', { name: 'Pause' })
    await expect(pause).toHaveAccessibleDescription('Pause the download. You can resume it later, even after leaving the page')
    await pause.focus()
    await page.keyboard.press('Enter')

    await expect(chat.region.getByText('Download paused at 0%. Quick answers still work.')).toBeVisible()
    await expect(chat.region.locator('.status-pill')).toHaveText('AI paused · 0%')
    // The same button now resumes, and keeps keyboard focus
    const resume = chat.region.getByRole('button', { name: 'Resume' })
    await expect(resume).toBeFocused()
    await expect(chat.input).toBeEnabled()
    await chat.input.fill('What are his skills?')
    await chat.input.press('Enter')
    await expect(chat.assistantBubbles).toHaveCount(2)

    await resume.click()
    await expect(chat.region.getByText('Downloading AI model… this only happens once.')).toBeVisible()
    await expect(pause).toBeVisible()
    await expect(chat.input).toBeDisabled()
  })

  test('a slow load suggests the mini-game', async ({ page }) => {
    await holdModelDownload(page)
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.loadButton.click()

    const hint = chat.dialog.getByRole('button', { name: 'Play a game while you wait' })
    await expect(hint).toBeVisible()
    await expect(chat.gameButton).toHaveAttribute('aria-label', 'Play a game while the AI loads')
    await expect(chat.gameButton.locator('.hint-dot')).toBeVisible()

    await hint.click()
    await expect(chat.dialog.getByRole('application')).toBeVisible()
    // The game shows the download progress too
    await expect(chat.dialog.getByText('AI 0%')).toBeVisible()
  })

  test('a failed load says so, keeps quick answers, and can be retried', async ({ page }) => {
    const download = await holdModelDownload(page)
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.loadButton.click()
    await expect(chat.input).toBeDisabled()

    await download.fail()
    await expect(chat.dialog.getByText("The AI model couldn't load on this device, but quick answers still work.")).toBeVisible()
    await expect(chat.input).toBeEnabled()

    await chat.input.fill('What are his skills?')
    await chat.input.press('Enter')
    await expect(chat.assistantBubbles).toHaveCount(2)

    await chat.dialog.getByRole('button', { name: 'Try again' }).click()
    await expect(chat.dialog.getByText("The AI model couldn't load on this device")).toBeVisible()
  })
})
