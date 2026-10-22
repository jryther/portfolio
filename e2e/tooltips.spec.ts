import type { Page } from '@playwright/test'
import { test, expect, gotoHome, chatPopup } from './fixtures'

// v-tooltip: styled tooltips that show on hover and keyboard focus, can be hovered, and are
// dismissed with Escape (WCAG 1.4.13). Unit tests cover the details; these check the real
// browser behavior: keyboard focus, positioning, and touch.

const visibleTooltip = (page: Page) => page.locator('.tooltip:not([hidden])')
const themeToggle = (page: Page) => page.getByRole('button', { name: /^Switch to (dark|light) mode$/ })

test.describe('tooltips with a mouse and keyboard', () => {
  test.skip(({ isMobile }) => isMobile, 'Hover and keyboard focus are desktop interactions')

  test.beforeEach(async ({ page }) => { await gotoHome(page) })

  test('hovering a control shows its styled tooltip next to it', async ({ page }) => {
    const toggle = themeToggle(page)
    await toggle.hover()
    const tooltip = visibleTooltip(page)
    await expect(tooltip).toHaveText(await toggle.getAttribute('aria-label') ?? '')
    await expect(tooltip).toHaveCSS('position', 'fixed')

    // Just below the button (no room above it in the header), within the viewport
    const tip = (await tooltip.boundingBox())!
    const button = (await toggle.boundingBox())!
    expect(tip.y).toBeGreaterThan(button.y + button.height)
    expect(tip.y - (button.y + button.height)).toBeLessThan(20)
    expect(tip.x + tip.width).toBeLessThanOrEqual(page.viewportSize()!.width)

    await page.mouse.move(0, 400)
    await expect(visibleTooltip(page)).toHaveCount(0)
  })

  test('an icon button tooltip that repeats the name is hidden from screen readers', async ({ page }) => {
    const toggle = themeToggle(page)
    await toggle.hover()
    await expect(visibleTooltip(page)).toHaveAttribute('aria-hidden', 'true')
    await expect(toggle).not.toHaveAttribute('aria-describedby', /tooltip/)
  })

  test('keyboard focus shows it right away, and Escape hides it without moving focus', async ({ page }) => {
    const toggle = themeToggle(page)
    // Tab to it, so the browser treats it as keyboard focus
    for (let i = 0; i < 15 && !(await toggle.evaluate(el => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab')
    }
    await expect(toggle).toBeFocused()
    await expect(visibleTooltip(page)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(visibleTooltip(page)).toHaveCount(0)
    await expect(toggle).toBeFocused()
  })

  test('the pointer can move onto the tooltip without it closing', async ({ page }) => {
    await themeToggle(page).hover()
    const tooltip = visibleTooltip(page)
    await expect(tooltip).toBeVisible()
    const box = (await tooltip.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 })
    await page.waitForTimeout(400)
    await expect(tooltip).toBeVisible()
  })

  test('in the chat popup, the first Escape closes the tooltip and the second closes the popup', async ({ page }) => {
    const chat = chatPopup(page)
    await chat.fab.click()
    await expect(chat.dialog).toBeVisible()
    await page.keyboard.press('Tab')   // focus moves from the dialog to its first button
    await expect(visibleTooltip(page)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(visibleTooltip(page)).toHaveCount(0)
    await expect(chat.dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(chat.dialog).toBeHidden()
  })

  test('the floating chat button tooltip stays inside the viewport', async ({ page }) => {
    await chatPopup(page).fab.hover()
    const tip = (await visibleTooltip(page).boundingBox())!
    const { width } = page.viewportSize()!
    expect(tip.x).toBeGreaterThanOrEqual(0)
    expect(tip.x + tip.width).toBeLessThanOrEqual(width)
  })

  test('no native title tooltips are left', async ({ page }) => {
    await expect(page.locator('[title]')).toHaveCount(0)
  })
})

test.describe('tooltips on touch', () => {
  test.skip(({ isMobile }) => !isMobile, 'Touch only')

  test('tapping a control does not leave a tooltip over the page', async ({ page }) => {
    await gotoHome(page)
    await themeToggle(page).tap()
    await page.waitForTimeout(600)
    await expect(visibleTooltip(page)).toHaveCount(0)
  })
})
