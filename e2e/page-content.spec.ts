import { test, expect, gotoHome } from './fixtures'

// Every section renders its content, links point where they should, and the page loads cleanly

test.describe('page', () => {
  // The servers send the headers from public/_headers, as Cloudflare does. Without isolation
  // the AI chat silently drops to a single thread
  test('is cross-origin isolated and sends the security headers', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response!.headers()
    expect(headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(headers['cross-origin-embedder-policy']).toBe('credentialless')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true)
  })

  test('has a link preview image', async ({ page, request }) => {
    await gotoHome(page)
    const image = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(image).toBe('https://joshryther.com/og-image.png')
    // Served from this build, at the same path
    const response = await request.get(new URL(image!).pathname)
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toBe('image/png')
  })

  test('has the English title and description', async ({ page }) => {
    await gotoHome(page)
    await expect(page).toHaveTitle('Josh Ryther | Full-Stack Software Engineer')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Full-Stack Software Engineer/)
  })

  test('loads without script errors or missing local files', async ({ page }) => {
    const errors: string[] = []
    const failed: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('response', (res) => {
      if (new URL(res.url()).hostname === 'localhost' && res.status() >= 400) failed.push(`${res.status()} ${res.url()}`)
    })
    await gotoHome(page)
    await page.waitForLoadState('load')
    expect(errors).toEqual([])
    expect(failed).toEqual([])
  })

  test('renders the sections in order', async ({ page }) => {
    await gotoHome(page)
    const ids = await page.locator('main > section').evaluateAll(els => els.map(el => el.id))
    expect(ids).toEqual(['home', 'about', 'projects', 'chat', 'contact'])
  })

  test('every image has loaded', async ({ page }) => {
    await gotoHome(page)
    // Retried until every image has finished, rather than waiting for the network to go quiet
    await expect.poll(() => page.locator('img').evaluateAll(imgs =>
      (imgs as HTMLImageElement[]).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)))
      .toEqual([])
  })

  test('opens external links in a new tab without a referrer', async ({ page }) => {
    await gotoHome(page)
    const external = page.locator('a[href^="http"]')
    expect(await external.count()).toBeGreaterThan(0)
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noreferrer/)
    }
  })

  test('in-page links all point at a section that exists', async ({ page }) => {
    await gotoHome(page)
    const hrefs = await page.locator('a[href^="#"]').evaluateAll(els => els.map(el => el.getAttribute('href')!))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of new Set(hrefs)) {
      await expect(page.locator(href), `${href} target`).toHaveCount(1)
    }
  })
})

test.describe('hero', () => {
  test('introduces Josh with calls to action', async ({ page }) => {
    await gotoHome(page)
    const hero = page.locator('#home')
    await expect(hero.getByText("Hey there, I'm")).toBeVisible()
    await expect(hero.getByText('Full-Stack Software Engineer', { exact: true })).toBeVisible()
    await expect(hero.getByText('Salem, OR · Open to opportunities')).toBeVisible()
    await expect(hero.getByText('Vue · React · TypeScript · Node.js')).toBeVisible()
    await expect(hero.getByText(/Mt\. Hood/)).toBeVisible()

    await expect(hero.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '#contact')
    await expect(hero.getByRole('button', { name: 'View resume' })).toHaveAttribute('aria-haspopup', 'menu')
    await expect(hero.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', /linkedin\.com\/in\/joshua-ryther/)
    await expect(hero.getByRole('link', { name: 'Email' })).toHaveAttribute('href', 'mailto:jryther91@gmail.com')
  })

  test('"Get in touch" scrolls to the contact section', async ({ page }) => {
    await gotoHome(page)
    await page.locator('#home').getByRole('link', { name: 'Get in touch' }).click()
    await expect(page).toHaveURL(/#contact$/)
    await expect(page.getByRole('heading', { name: "Let's connect" })).toBeInViewport()
  })

  test('the resume menu serves the PDF and the Word file', async ({ page }) => {
    await gotoHome(page)
    const hero = page.locator('#home')
    await hero.getByRole('button', { name: 'View resume' }).click()

    const pdf = await (await hero.getByRole('menuitem', { name: /PDF/ }).getAttribute('href'))!
    const pdfRes = await page.request.get(pdf)
    expect(pdfRes.ok()).toBe(true)
    expect((await pdfRes.body()).subarray(0, 5).toString()).toBe('%PDF-')

    // A .docx is a ZIP archive, so it starts with "PK"
    const docx = await (await hero.getByRole('menuitem', { name: /Word/ }).getAttribute('href'))!
    const docxRes = await page.request.get(docx)
    expect(docxRes.ok()).toBe(true)
    expect((await docxRes.body()).subarray(0, 2).toString()).toBe('PK')
  })
})

test.describe('about', () => {
  test('shows the bio and the at-a-glance facts', async ({ page }) => {
    await gotoHome(page)
    const about = page.locator('#about')
    await expect(about.getByRole('heading', { name: 'A little about me' })).toBeVisible()
    await expect(about.getByText('01 — About')).toBeVisible()

    const facts = about.locator('.glance-card dt')
    await expect(facts).toHaveText(['Based in', 'Currently', 'Experience', 'Focus', 'Education'])
    await expect(about.locator('.glance-card dd').nth(2)).toHaveText(/^\d+\+ years in software engineering$/)
  })

  test('downloads the resume as a PDF or a Word file', async ({ page }) => {
    await gotoHome(page)
    const about = page.locator('#about')
    const resume = about.getByRole('button', { name: 'Resume' })

    for (const [format, file] of [[/PDF/, 'Joshua_Ryther_Resume.pdf'], [/Word/, 'Joshua_Ryther_Resume.docx']] as const) {
      await resume.click()
      const download = page.waitForEvent('download')
      await about.getByRole('menuitem', { name: format }).click()
      expect((await download).suggestedFilename()).toBe(file)
    }
  })

  test('lists experience and education in order', async ({ page }) => {
    await gotoHome(page)
    const items = page.locator('#about .timeline-item')
    await expect(items).toHaveCount(4)
    await expect(items.locator('.timeline-title')).toHaveText([
      'Software Engineer',
      'B.S. Computer Science',
      'Certified Pharmacy Technician',
      'B.S. Economics',
    ])
    await expect(items.locator('.timeline-type')).toHaveText(['Work', 'Education', 'Work', 'Education'])
    await expect(items.first().locator('.timeline-bullet')).toHaveCount(6)
    await expect(items.first()).toContainText('Pearson Education')
  })

  test('groups skills with their icons', async ({ page }) => {
    await gotoHome(page)
    const groups = page.locator('#about .skill-group')
    await expect(groups.locator('.card-label')).toHaveText(['Frontend', 'Backend & Data', 'Testing & DevOps'])
    await expect(groups.nth(0).locator('.skill-chip')).toHaveText(['Vue.js', 'React', 'TypeScript', 'JavaScript', 'Tailwind CSS'])
    await expect(groups.nth(1).locator('.skill-chip')).toHaveText(['Node.js', 'Java', 'MySQL', 'MongoDB'])
    await expect(groups.nth(2).locator('.skill-chip')).toHaveText(['Jest', 'Jenkins', 'AWS'])
    // Icons are decorative
    await expect(groups.locator('img:not([alt=""])')).toHaveCount(0)
  })
})

test.describe('work', () => {
  test('features TestNav with its impact and results', async ({ page }) => {
    await gotoHome(page)
    const work = page.locator('#projects')
    await expect(work.getByRole('heading', { name: 'Professional work' })).toBeVisible()
    await expect(work.locator('.role-line')).toContainText('Software Engineer')
    await expect(work.locator('.role-line')).toContainText('Pearson')

    const featured = work.locator('article.featured')
    await expect(featured.getByRole('heading', { name: 'TestNav' })).toBeVisible()
    await expect(featured.locator('.featured-point')).toHaveCount(4)
    await expect(featured.locator('.stat-value')).toHaveText(['Millions', '~50%', '~75%', 'WCAG AA'])
    await expect(featured.getByText('Percentages are my own estimates.')).toBeVisible()
  })

  test('links to TestNav in both app stores', async ({ page }) => {
    await gotoHome(page)
    const featured = page.locator('#projects article.featured')
    await expect(featured.getByRole('link', { name: 'App Store' })).toHaveAttribute('href', /apps\.apple\.com/)
    await expect(featured.getByRole('link', { name: 'Microsoft Store' })).toHaveAttribute('href', /apps\.microsoft\.com/)
  })

  test('shows the supporting work around the platform', async ({ page }) => {
    await gotoHome(page)
    const cards = page.locator('#projects .supporting-card')
    await expect(cards.locator('.supporting-title')).toHaveText([
      'Native apps',
      'AI-powered services',
      'Content repositories',
      'Interactive content',
    ])
    for (const card of await cards.all()) {
      await expect(card.locator('.result-value')).not.toBeEmpty()
    }
  })

  test('the spotlight glow follows the pointer', async ({ page, isMobile }) => {
    test.skip(isMobile, 'No hover on touch screens')
    await gotoHome(page)
    const card = page.locator('#projects article.featured')
    await card.scrollIntoViewIfNeeded()
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + 40, box.y + 30)
    // Sub-pixel layout can put the card a fraction of a pixel off the mouse position
    const glow = (prop: string) => card.evaluate((el, p) => parseFloat((el as HTMLElement).style.getPropertyValue(p)), prop)
    await expect.poll(() => glow('--mx')).toBeCloseTo(40, 0)
    await expect.poll(() => glow('--my')).toBeCloseTo(30, 0)
  })
})

test.describe('ask section', () => {
  test('explains how the chat works', async ({ page }) => {
    await gotoHome(page)
    const chat = page.locator('#chat')
    await expect(chat.getByRole('heading', { name: 'Ask about my work' })).toBeVisible()
    await expect(chat.locator('.steps li')).toHaveCount(3)
    await expect(chat.locator('.example')).toHaveCount(3)
    await expect(chat.locator('.chat-hood dt')).toHaveText(['Model', 'Runs on', 'Privacy'])
    await expect(chat.locator('.chat-hood dd').first()).toContainText('Google EmbeddingGemma 300M, ~330 MB')
  })
})

test.describe('contact', () => {
  test('lists the ways to get in touch', async ({ page }) => {
    await gotoHome(page)
    const contact = page.locator('#contact')
    await expect(contact.getByRole('heading', { name: "Let's connect" })).toBeVisible()
    await expect(contact.getByRole('link', { name: /jryther91@gmail\.com/ })).toHaveAttribute('href', 'mailto:jryther91@gmail.com')
    await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', /linkedin\.com/)
    // Location is plain text, not a link
    await expect(contact.locator('.contact-row:not(a)')).toContainText('Salem, Oregon')
    await expect(contact.getByRole('heading', { name: 'Send a message' })).toBeVisible()
  })
})

test.describe('footer', () => {
  test('shows the credit, links and trademark note', async ({ page }) => {
    await gotoHome(page)
    const footer = page.locator('footer')
    await expect(footer).toContainText(`© ${new Date().getFullYear()} Josh Ryther`)
    await expect(footer).toContainText('Built with Vue, Vite & wllama')
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', /linkedin\.com/)
    await expect(footer.getByRole('link', { name: 'Email' })).toHaveAttribute('href', 'mailto:jryther91@gmail.com')
    await expect(footer.getByText(/TestNav is a trademark of Pearson Education/)).toBeVisible()
  })
})
