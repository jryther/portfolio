import { test, expect, gotoHome, scrollToSection } from './fixtures'

// Header navigation (desktop links and the phone menu), the skip link and back to top

const SECTIONS = [
  { name: 'About', id: 'about' },
  { name: 'Work', id: 'projects' },
  { name: 'Ask', id: 'chat' },
  { name: 'Contact', id: 'contact' },
]

test.describe('header', () => {
  test('gains a background once the page scrolls', async ({ page }) => {
    await gotoHome(page)
    const header = page.locator('header')
    await expect(header).not.toHaveClass(/scrolled/)
    await page.mouse.wheel(0, 400)
    await expect(header).toHaveClass(/scrolled/)
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(header).not.toHaveClass(/scrolled/)
  })

  test('marks the section on screen as current', async ({ page }) => {
    await gotoHome(page)
    // By href, since the phone menu is collapsed (and its links hidden) while scrolling
    const nav = page.locator('#site-nav')
    for (const { id } of SECTIONS) {
      await scrollToSection(page, id)
      await expect(nav.locator(`a[href="#${id}"]`)).toHaveAttribute('aria-current', 'true')
      await expect(nav.locator('[aria-current]')).toHaveCount(1)
    }
  })

  test('the logo goes back to the top', async ({ page, isMobile }) => {
    await gotoHome(page)
    await scrollToSection(page, 'contact')
    await page.getByRole('link', { name: 'Josh Ryther — home' }).click()
    await expect(page).toHaveURL(/#home$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    if (!isMobile) await expect(page.getByRole('navigation').locator('[aria-current]')).toHaveCount(0)
  })

  test('the resume button opens the PDF in a new tab', async ({ page, isMobile }) => {
    await gotoHome(page)
    if (isMobile) await page.getByRole('button', { name: 'Toggle menu' }).click()
    const resume = page.getByRole('navigation').getByRole('link', { name: 'Resume' })
    await expect(resume).toHaveAttribute('target', '_blank')
    await expect(resume).toHaveAttribute('href', /Resume.*\.pdf/)
  })
})

test.describe('desktop nav', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop layout only')

  test('shows the links inline, with no menu button', async ({ page }) => {
    await gotoHome(page)
    await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeHidden()
    for (const { name } of SECTIONS) {
      await expect(page.getByRole('navigation').getByRole('link', { name, exact: true })).toBeVisible()
    }
  })

  for (const { name, id } of SECTIONS) {
    test(`"${name}" scrolls to #${id}`, async ({ page }) => {
      await gotoHome(page)
      const link = page.getByRole('navigation').getByRole('link', { name, exact: true })
      await link.click()
      await expect(page).toHaveURL(new RegExp(`#${id}$`))
      await expect(page.locator(`#${id}`)).toBeInViewport()
      await expect(link).toHaveAttribute('aria-current', 'true')
    })
  }
})

test.describe('phone menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phone layout only')

  test('opens and closes from the menu button', async ({ page }) => {
    await gotoHome(page)
    const menu = page.getByRole('button', { name: 'Toggle menu' })
    const about = page.getByRole('navigation').getByRole('link', { name: 'About', exact: true })

    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(about).not.toBeInViewport()

    await menu.click()
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('header')).toHaveClass(/scrolled/)
    await expect(about).toBeInViewport()

    await menu.click()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
  })

  test('picking a link closes the menu and scrolls there', async ({ page }) => {
    await gotoHome(page)
    const menu = page.getByRole('button', { name: 'Toggle menu' })
    await menu.click()
    await page.getByRole('navigation').getByRole('link', { name: 'Work', exact: true }).click()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(page).toHaveURL(/#projects$/)
    await expect(page.locator('#projects')).toBeInViewport()
  })

  test('Escape closes the menu and returns focus to its button', async ({ page }) => {
    await gotoHome(page)
    const menu = page.getByRole('button', { name: 'Toggle menu' })
    await menu.click()
    await page.getByRole('navigation').getByRole('link', { name: 'About', exact: true }).focus()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeFocused()
  })

  test('tabbing out of the menu closes it', async ({ page }) => {
    await gotoHome(page)
    const menu = page.getByRole('button', { name: 'Toggle menu' })
    await menu.click()
    await page.getByRole('navigation').getByRole('link', { name: 'Resume' }).focus()
    await page.keyboard.press('Tab')
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('keyboard', () => {
  test('the skip link is the first stop and jumps to the content', async ({ page }) => {
    await gotoHome(page)
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
    await expect(page.locator('main')).toBeFocused()
  })
})

test.describe('back to top', () => {
  test('appears after the first screen and returns to the top', async ({ page }) => {
    await gotoHome(page)
    const backTop = page.getByRole('button', { name: 'Back to top' })
    await expect(backTop).toBeHidden()

    await scrollToSection(page, 'projects')
    await expect(backTop).toBeVisible()
    await backTop.click()

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(backTop).toBeHidden()
    // Keyboard focus moves to the top as well
    await expect(page.getByRole('link', { name: 'Josh Ryther — home' })).toBeFocused()
  })
})
