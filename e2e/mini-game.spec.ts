import { test, expect, gotoHome, scrollToCenter, chatPopup, chatSection } from './fixtures'

// The Flappy-style mini-game behind the game icon in both chat headers

test.describe('mini-game', () => {
  test('swaps in for the popup chat and back', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()

    await expect(chat.gameButton).toHaveAttribute('aria-label', 'Play a game')
    // The label says what it does next, so it has no aria-pressed (which would contradict it)
    await expect(chat.gameButton).not.toHaveAttribute('aria-pressed')
    await chat.gameButton.click()

    const stage = chat.dialog.getByRole('application', { name: /Flappy bird game/ })
    await expect(stage).toBeVisible()
    await expect(stage).toBeFocused()
    await expect(chat.input).toBeHidden()
    await expect(chat.gameButton).toHaveAttribute('aria-label', 'Back to chat')
    await expect(stage.getByText('Tap, click, or press Space to fly')).toBeVisible()

    await chat.gameButton.click()
    await expect(stage).toBeHidden()
    await expect(chat.input).toBeVisible()
  })

  test('reopening the popup starts back on the chat', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.gameButton.click()
    await expect(chat.dialog.getByRole('application')).toBeVisible()

    await page.keyboard.press('Escape')
    await chat.fab.click()
    await expect(chat.input).toBeVisible()
    await expect(chat.dialog.getByRole('application')).toHaveCount(0)
  })

  test('opens from the section\'s Play button', async ({ page }) => {
    await gotoHome(page)
    await scrollToCenter(page, 'chat')
    const chat = chatSection(page)
    const play = chat.section.getByRole('button', { name: 'Play', exact: true })
    await play.click()
    await expect(chat.region.getByRole('application')).toBeVisible()
    await expect(play).toBeHidden()
    await expect(chat.gameButton).toHaveAttribute('aria-label', 'Back to chat')
  })

  test('an example question switches the section back to the chat', async ({ page }) => {
    await gotoHome(page)
    await scrollToCenter(page, 'chat')
    const chat = chatSection(page)
    await chat.gameButton.click()
    await expect(chat.region.getByRole('application')).toBeVisible()

    await chat.section.locator('.example').first().click()
    await expect(chat.region.getByRole('application')).toHaveCount(0)
    await expect(chat.input).not.toHaveValue('')
  })

  test('a round plays to game over and can be played again', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.gameButton.click()
    const stage = chat.dialog.getByRole('application')
    await expect(stage).toBeFocused()

    // One flap starts the round; with no more, the bird falls
    await page.keyboard.press('Space')
    await expect(stage.getByText('Tap, click, or press Space to fly')).toBeHidden()

    const over = stage.locator('.game-over')
    await expect(over).toBeVisible({ timeout: 15_000 })
    await expect(over.getByText('Game over')).toBeVisible()
    await expect(over.locator('.final-score')).toHaveText('0')
    await expect(chat.dialog.getByText('Game over. Score 0.', { exact: false })).toBeAttached()

    const again = over.getByRole('button', { name: 'Play again' })
    await expect(again).toBeFocused()
    await again.click()
    await expect(over).toBeHidden()
    await expect(stage.getByText('Tap, click, or press Space to fly')).toBeVisible()
    await expect(stage).toBeFocused()
  })

  test('a click on the stage flaps too', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.gameButton.click()
    const stage = chat.dialog.getByRole('application')
    await stage.click()
    await expect(stage.getByText('Tap, click, or press Space to fly')).toBeHidden()
  })

  test('keys only fly while the game has focus', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.gameButton.click()
    const stage = chat.dialog.getByRole('application')
    await expect(stage).toBeFocused()

    await chat.gameButton.focus()
    await page.keyboard.press('ArrowUp')
    await expect(stage.getByText('Tap, click, or press Space to fly')).toBeVisible()

    await stage.focus()
    await page.keyboard.press('ArrowUp')
    await expect(stage.getByText('Tap, click, or press Space to fly')).toBeHidden()
  })

  test('shows the saved best score', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('flappyHighScore', '42'))
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.gameButton.click()
    await expect(chat.dialog.locator('.best')).toHaveText(/Best\s*42/)
  })

  test('sound starts muted and can be turned on', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.gameButton.click()

    await chat.dialog.getByRole('button', { name: 'Turn sound on' }).click()
    await expect(chat.dialog.getByRole('button', { name: 'Turn sound off' })).toBeVisible()
    // Focus goes back to the game so the next key press flies
    await expect(chat.dialog.getByRole('application')).toBeFocused()

    await chat.dialog.getByRole('button', { name: 'Turn sound off' }).click()
    await expect(chat.dialog.getByRole('button', { name: 'Turn sound on' })).toBeVisible()
  })

  test('draws the scene on the canvas', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await chat.gameButton.click()
    const canvas = chat.dialog.locator('canvas.game-canvas')
    await expect(canvas).toBeVisible()
    await expect.poll(() => canvas.evaluate((c: HTMLCanvasElement) => {
      const ctx = c.getContext('2d')!
      const { data } = ctx.getImageData(0, 0, c.width, c.height)
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true
      return false
    })).toBe(true)
  })
})
