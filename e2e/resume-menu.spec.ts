import type { Page } from '@playwright/test'
import { test, expect, gotoHome } from './fixtures'

// The Resume buttons open a menu of formats (WAI-ARIA menu button pattern). These use the one in
// the hero; the header and About ones are the same component (navigation and page-content
// specs check where each one points).

const resumeButton = (page: Page) => page.locator('#home').getByRole('button', { name: 'View resume' })
const menu = (page: Page) => page.locator('#home').getByRole('menu', { name: 'Resume formats' })
const items = (page: Page) => menu(page).getByRole('menuitem')

test.describe('resume menu', () => {
  test.beforeEach(async ({ page }) => { await gotoHome(page) })

  test('is a closed menu button until clicked', async ({ page }) => {
    const button = resumeButton(page)
    await expect(button).toHaveAttribute('aria-haspopup', 'menu')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(menu(page)).toBeHidden()

    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(items(page)).toHaveText([/PDF\s*\.pdf/, /Word \(\.docx\)\s*\.docx/])
    await expect(items(page).first()).toBeFocused()
  })

  test('arrow keys, Home and End move between formats', async ({ page }) => {
    await resumeButton(page).focus()
    await page.keyboard.press('ArrowDown')
    await expect(items(page).first()).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(items(page).last()).toBeFocused()
    await page.keyboard.press('ArrowDown')   // wraps around
    await expect(items(page).first()).toBeFocused()
    await page.keyboard.press('End')
    await expect(items(page).last()).toBeFocused()
    await page.keyboard.press('Home')
    await expect(items(page).first()).toBeFocused()
  })

  test('ArrowUp on the button opens it on the last format', async ({ page }) => {
    await resumeButton(page).focus()
    await page.keyboard.press('ArrowUp')
    await expect(items(page).last()).toBeFocused()
  })

  test('Escape closes it and returns focus to the button', async ({ page }) => {
    await resumeButton(page).focus()
    await page.keyboard.press('Enter')
    await expect(items(page).first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu(page)).toBeHidden()
    await expect(resumeButton(page)).toBeFocused()
    await expect(resumeButton(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('Tab moves on and closes it', async ({ page }) => {
    await resumeButton(page).focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(menu(page)).toBeHidden()
  })

  test('clicking outside closes it', async ({ page }) => {
    await resumeButton(page).click()
    await expect(menu(page)).toBeVisible()
    await page.locator('#home h1').click()
    await expect(menu(page)).toBeHidden()
  })

  test('the PDF opens in a new tab and the Word file downloads', async ({ page }) => {
    await resumeButton(page).click()
    await expect(items(page).first()).toHaveAttribute('target', '_blank')
    await expect(items(page).first()).not.toHaveAttribute('download')
    await expect(items(page).last()).toHaveAttribute('download', 'Joshua_Ryther_Resume.docx')
  })
})
