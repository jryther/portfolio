import { test, expect, gotoHome, scrollToSection, chatPopup } from './fixtures'

// The header's theme, language and background-animation toggles, and that each choice sticks

test.describe('theme toggle', () => {
  test('starts dark and switches to light and back', async ({ page }) => {
    await gotoHome(page)
    const html = page.locator('html')
    const themeColor = page.locator('meta[name="theme-color"]')
    await expect(html).toHaveAttribute('data-theme', 'dark')

    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await expect(html).toHaveAttribute('data-theme', 'light')
    await expect(themeColor).toHaveAttribute('content', '#F5F3EC')

    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    await expect(themeColor).toHaveAttribute('content', '#0B1012')
  })

  test('remembers the choice on the next visit', async ({ page }) => {
    await gotoHome(page)
    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await gotoHome(page)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  })

  test('changes the page colours', async ({ page }) => {
    await gotoHome(page)
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    const dark = await background()
    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await expect.poll(background).not.toBe(dark)
  })
})

test.describe('language toggle', () => {
  test('switches the page to Spanish and back', async ({ page }) => {
    await gotoHome(page)
    await page.getByRole('button', { name: 'Ver en español' }).click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page).toHaveTitle('Josh Ryther | Ingeniero de software full-stack')
    await expect(page.getByRole('heading', { name: 'Un poco sobre mí' })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Conectemos' })).toBeAttached()
    await expect(page.locator('form button[type="submit"]')).toHaveText('Enviar mensaje')
    await expect(page.getByRole('button', { name: 'Cambiar al modo claro' })).toBeVisible()

    const back = page.getByRole('button', { name: 'View in English' })
    await expect(back).toHaveText('EN')
    await expect(back).toHaveAttribute('lang', 'en')
    await back.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { name: 'A little about me' })).toBeAttached()
  })

  test('remembers the choice on the next visit', async ({ page }) => {
    await gotoHome(page)
    await page.getByRole('button', { name: 'Ver en español' }).click()
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('heading', { name: 'Un poco sobre mí' })).toBeAttached()
  })

  test('re-renders the chat in the new language', async ({ page }) => {
    await gotoHome(page)
    const chat = chatPopup(page)
    await chat.fab.click()
    await expect(chat.assistantBubbles.first()).toHaveText(/^Hi! I'm Josh's assistant/)
    await chat.chip('Who is Josh?').click()
    await expect(chat.assistantBubbles).toHaveCount(2)

    await page.getByRole('button', { name: 'Ver en español' }).click()
    const dialog = page.getByRole('dialog', { name: 'Pregunta sobre Josh' })
    await expect(dialog.locator('.bubble.from-assistant').first()).toHaveText(/^¡Hola! Soy el asistente de Josh/)
    // A chip's question is re-rendered too
    await expect(dialog.locator('.bubble.from-user')).toHaveText('¿Quién es Josh?')
  })
})

test.describe('Spanish-language browser', () => {
  test.use({ locale: 'es-ES' })

  test('gets the page in Spanish on the first visit', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('button', { name: 'View in English' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeAttached()
  })
})

test.describe('background animation toggle', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('pauses and resumes the hero scene, and remembers it', async ({ page }) => {
    await gotoHome(page)
    await page.getByRole('button', { name: 'Pause background animation' }).click()
    const play = page.getByRole('button', { name: 'Play background animation' })
    await expect(play).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('scene-paused'))).toBe('true')

    await gotoHome(page)
    await expect(play).toBeVisible()
    await play.click()
    await expect(page.getByRole('button', { name: 'Pause background animation' })).toBeVisible()
  })

  test('steps aside once the hero scrolls away', async ({ page }) => {
    await gotoHome(page)
    const pause = page.getByRole('button', { name: 'Pause background animation' })
    await expect(pause).toBeVisible()
    await scrollToSection(page, 'projects')
    await expect(pause).toBeHidden()
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(pause).toBeVisible()
  })
})

test.describe('background animation toggle with reduced motion', () => {
  test('is not offered, since the scene is already still', async ({ page }) => {
    await gotoHome(page)
    await expect(page.getByRole('button', { name: /background animation/ })).toHaveCount(0)
  })
})
