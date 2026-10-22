import type { Page } from '@playwright/test'
import { test, expect, gotoHome, scrollToSection, FORMSPREE_URL } from './fixtures'

// The contact form posts to Formspree; every request here is answered by a mock

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
      // The status and alert regions are always in the DOM (so screen readers announce changes);
      // what matters is the message inside them
      success: root.getByRole('status').getByText('Message sent successfully'),
      error: root.getByRole('alert').getByText("couldn't be sent"),
      fallbackEmail: root.getByRole('alert').getByRole('link', { name: 'jryther91@gmail.com' }),
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

  test('sends the message and clears the form', async ({ page }) => {
    let body: unknown
    await page.route(FORMSPREE_URL, async (route) => {
      body = route.request().postDataJSON()
      await route.fulfill({ status: 200, json: { ok: true } })
    })
    const f = form(page)
    await f.name.fill('Ada Lovelace')
    await f.email.fill('ada@example.com')
    await f.message.fill('Hello from Playwright')
    await f.submit.click()

    await expect(f.success).toHaveText("Message sent successfully! I'll get back to you soon.")
    expect(body).toEqual({ name: 'Ada Lovelace', email: 'ada@example.com', message: 'Hello from Playwright' })
    await expect(f.name).toHaveValue('')
    await expect(f.email).toHaveValue('')
    await expect(f.message).toHaveValue('')
  })

  test('the success message goes away after a few seconds', async ({ page }) => {
    await page.clock.install()
    await page.route(FORMSPREE_URL, route => route.fulfill({ status: 200, json: { ok: true } }))
    const f = form(page)
    await f.name.fill('Ada')
    await f.email.fill('ada@example.com')
    await f.message.fill('Hi')
    await f.submit.click()
    await expect(f.success).toBeVisible()
    await page.clock.runFor(5_100)
    await expect(f.success).toBeHidden()
  })

  test('does not submit with missing or invalid fields', async ({ page }) => {
    let requests = 0
    await page.route(FORMSPREE_URL, (route) => {
      requests++
      return route.fulfill({ status: 200, json: {} })
    })
    const f = form(page)
    const isValid = (el: typeof f.name) => el.evaluate((input: HTMLInputElement) => input.validity.valid)

    await f.submit.click()
    expect(await isValid(f.name)).toBe(false)

    await f.name.fill('Ada')
    await f.email.fill('not-an-email')
    await f.message.fill('Hi')
    await f.submit.click()
    expect(await isValid(f.email)).toBe(false)

    expect(requests).toBe(0)
    await expect(f.success).toHaveCount(0)
    await expect(f.error).toHaveCount(0)
  })

  test('keeps what was typed when the server rejects it', async ({ page }) => {
    await page.route(FORMSPREE_URL, route => route.fulfill({ status: 500, body: 'error' }))
    const f = form(page)
    await f.name.fill('Ada')
    await f.email.fill('ada@example.com')
    await f.message.fill('Hi')
    const response = page.waitForResponse(FORMSPREE_URL)
    await f.submit.click()
    await response

    await expect(f.success).toHaveCount(0)
    await expect(f.error).toBeVisible()
    await expect(f.fallbackEmail).toBeVisible()
    await expect(f.name).toHaveValue('Ada')
    await expect(f.message).toHaveValue('Hi')
  })

  test('keeps what was typed when the network is down', async ({ page }) => {
    // The default route in fixtures.ts aborts the request
    const f = form(page)
    await f.name.fill('Ada')
    await f.email.fill('ada@example.com')
    await f.message.fill('Hi')
    const failed = page.waitForEvent('requestfailed', req => FORMSPREE_URL.test(req.url()))
    await f.submit.click()
    await failed

    await expect(f.success).toHaveCount(0)
    await expect(f.error).toBeVisible()
    await expect(f.fallbackEmail).toBeVisible()
    await expect(f.email).toHaveValue('ada@example.com')
  })
})
