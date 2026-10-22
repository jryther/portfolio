import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ContactForm from '../../components/ContactForm.vue'
import { i18n, setLocale } from '../../i18n'

const mountForm = () => mount(ContactForm, { global: { plugins: [i18n] } })

describe('ContactForm', () => {
  // The language is global, so a failed Spanish test mustn't leave the rest in Spanish
  afterEach(() => setLocale('en'))

  it('renders the name input', () => {
    const wrapper = mountForm()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('renders the email input', () => {
    const wrapper = mountForm()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('renders the message textarea', () => {
    const wrapper = mountForm()
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('renders the submit button', () => {
    const wrapper = mountForm()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Send Message')
  })

  it('renders in Spanish when the language is switched', async () => {
    const wrapper = mountForm()
    setLocale('es')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button[type="submit"]').text()).toBe('Enviar mensaje')
    expect(wrapper.find('input[type="email"]').attributes('placeholder')).toBe('ana@empresa.com')
  })

  it('does not show the success message initially', () => {
    const wrapper = mountForm()
    expect(wrapper.find('.success-message').exists()).toBe(false)
  })

  it('binds v-model to name input', async () => {
    const wrapper = mountForm()
    const input = wrapper.find('input[type="text"]')
    await input.setValue('John Doe')
    expect((input.element as HTMLInputElement).value).toBe('John Doe')
  })

  it('binds v-model to email input', async () => {
    const wrapper = mountForm()
    const input = wrapper.find('input[type="email"]')
    await input.setValue('john@example.com')
    expect((input.element as HTMLInputElement).value).toBe('john@example.com')
  })

  it('binds v-model to message textarea', async () => {
    const wrapper = mountForm()
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Hello!')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Hello!')
  })

  describe('form submission', () => {
    let fetchSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('shows success message after successful submission', async () => {
      fetchSpy.mockResolvedValue({ ok: true })

      const wrapper = mountForm()
      await wrapper.find('input[type="text"]').setValue('Josh')
      await wrapper.find('input[type="email"]').setValue('josh@example.com')
      await wrapper.find('textarea').setValue('Hello!')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('.success-message').exists()).toBe(true)
      expect(wrapper.find('.success-message').text()).toContain('Message sent successfully')
    })

    it('clears form fields after successful submission', async () => {
      fetchSpy.mockResolvedValue({ ok: true })

      const wrapper = mountForm()
      await wrapper.find('input[type="text"]').setValue('Josh')
      await wrapper.find('input[type="email"]').setValue('josh@example.com')
      await wrapper.find('textarea').setValue('Hello!')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('')
      expect((wrapper.find('input[type="email"]').element as HTMLInputElement).value).toBe('')
      expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('')
    })

    it('does not show success message on failed response', async () => {
      fetchSpy.mockResolvedValue({ ok: false })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      const wrapper = mountForm()
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('.success-message').exists()).toBe(false)
      consoleSpy.mockRestore()
      vi.restoreAllMocks()
    })

    it('does not throw on fetch network error', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const wrapper = mountForm()
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.find('.success-message').exists()).toBe(false)
      consoleSpy.mockRestore()
    })

    describe('when sending fails', () => {
      let consoleSpy: ReturnType<typeof vi.spyOn>

      beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
      })

      afterEach(() => vi.restoreAllMocks())

      const fillAndSubmit = async (wrapper: ReturnType<typeof mountForm>) => {
        await wrapper.find('input[type="text"]').setValue('Josh')
        await wrapper.find('input[type="email"]').setValue('josh@example.com')
        await wrapper.find('textarea').setValue('Hello!')
        await wrapper.find('form').trigger('submit')
        await flushPromises()
      }

      it('explains the problem in an alert, with email as a fallback', async () => {
        fetchSpy.mockResolvedValue({ ok: false, status: 500 })

        const wrapper = mountForm()
        await fillAndSubmit(wrapper)

        const alert = wrapper.find('[role="alert"]')
        expect(alert.text()).toContain("Your message couldn't be sent")
        expect(alert.find('a').attributes('href')).toBe('mailto:jryther91@gmail.com')
        expect(consoleSpy).toHaveBeenCalledWith('[contact]', 'Message failed to send', expect.any(Error))
      })

      it('shows the same alert on a network error', async () => {
        fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'))

        const wrapper = mountForm()
        await fillAndSubmit(wrapper)

        expect(wrapper.find('.error-message').exists()).toBe(true)
        expect(wrapper.find('.success-message').exists()).toBe(false)
      })

      it('says when the visitor is offline', async () => {
        fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'))
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

        const wrapper = mountForm()
        await fillAndSubmit(wrapper)

        expect(wrapper.find('.error-message').text()).toContain("You're offline")
      })

      it('keeps what the visitor typed so they can try again', async () => {
        fetchSpy.mockResolvedValue({ ok: false, status: 500 })

        const wrapper = mountForm()
        await fillAndSubmit(wrapper)

        expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Hello!')
      })

      it('clears the error once a retry succeeds', async () => {
        fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({ ok: true })

        const wrapper = mountForm()
        await fillAndSubmit(wrapper)
        await wrapper.find('form').trigger('submit')
        await flushPromises()

        expect(wrapper.find('.error-message').exists()).toBe(false)
        expect(wrapper.find('.success-message').exists()).toBe(true)
      })
    })

    it('shows that it is sending, and ignores a second submit meanwhile', async () => {
      let respond: (value: { ok: boolean }) => void = () => {}
      fetchSpy.mockReturnValue(new Promise((resolve) => { respond = resolve }))

      const wrapper = mountForm()
      await wrapper.find('form').trigger('submit')
      const button = wrapper.find('button[type="submit"]')
      expect(button.text()).toBe('Sending…')
      expect(button.attributes('aria-disabled')).toBe('true')

      await wrapper.find('form').trigger('submit')
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      respond({ ok: true })
      await flushPromises()
      expect(button.text()).toBe('Send Message')
    })

    it('sends the correct payload to Formspree', async () => {
      fetchSpy.mockResolvedValue({ ok: true })

      const wrapper = mountForm()
      await wrapper.find('input[type="text"]').setValue('Josh')
      await wrapper.find('input[type="email"]').setValue('josh@example.com')
      await wrapper.find('textarea').setValue('Hello!')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(options.body as string)
      expect(body).toEqual({ name: 'Josh', email: 'josh@example.com', message: 'Hello!' })
    })
  })
})

