import type { Page } from '@playwright/test'
import { test, expect, gotoHome, scrollToSection } from './fixtures'

// The contact form has no server: sending opens the visitor's email app with the message filled
// in (unit tests check the mailto: link itself). Here: the browser's validation, and what the
// page shows after sending.

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page)
    await scrollToSection(page, 'contact')
  })

  const form = (page: Page) => {
    const root = page.locator('#contact form')
    return {
      root,
      name: root.getByLabel('Name'),
      email: root.getByLabel('Email'),
      message: root.getByLabel('Message'),
      submit: root.getByRole('button', { name: 'Send Message' }),
      // The status region is always in the DOM (so screen readers announce changes); what
      // matters is the note inside it
      note: root.getByRole('status').getByText('Your email app should open'),
      fallbackEmail: root.getByRole('status').getByRole('link', { name: 'jryther91@gmail.com' }),
    }
  }

  test('has labelled fields with placeholders', async ({ page }) => {
    const f = form(page)
    await expect(f.name).toHaveAttribute('placeholder', 'Jane Doe')
    await expect(f.email).toHaveAttribute('placeholder', 'jane@company.com')
    await expect(f.email).toHaveAttribute('type', 'email')
    await expect(f.message).toHaveAttribute('placeholder', 'What would you like to talk about?')
    for (const field of [f.name, f.email, f.message]) await expect(field).toHaveAttribute('required', '')
  })

  test('says that sending opens an email app', async ({ page }) => {
    await expect(form(page).submit).toHaveAccessibleDescription('Opens your email app with your message ready to send.')
  })

  test('does not send with missing or invalid fields', async ({ page }) => {
    const f = form(page)
    const isValid = (el: typeof f.name) => el.evaluate((input: HTMLInputElement) => input.validity.valid)

    await f.submit.click()
    expect(await isValid(f.name)).toBe(false)

    await f.name.fill('Ada')
    await f.email.fill('not-an-email')
    await f.message.fill('Hi')
    await f.submit.click()
    expect(await isValid(f.email)).toBe(false)

    await expect(f.note).toHaveCount(0)
  })

  test('after sending, shows a fallback and keeps the text on the page', async ({ page }) => {
    const f = form(page)
    await f.name.fill('Ada')
    await f.email.fill('ada@example.com')
    await f.message.fill('Hi')
    await f.submit.click()

    await expect(f.note).toBeVisible()
    await expect(f.fallbackEmail).toHaveAttribute('href', 'mailto:jryther91@gmail.com')
    // The email app opens on its own; the page stays where it was
    await expect(page).toHaveURL(/^http:\/\/localhost/)
    await expect(f.message).toHaveValue('Hi')
  })
})
