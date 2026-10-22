import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
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

  it('does not show the email-app note initially', () => {
    const wrapper = mountForm()
    expect(wrapper.find('.form-message').exists()).toBe(false)
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

  it("explains that sending opens the visitor's email app", () => {
    const wrapper = mountForm()
    const button = wrapper.find('button[type="submit"]')
    const hint = wrapper.find(`#${button.attributes('aria-describedby')}`)
    expect(hint.text()).toBe('Opens your email app with your message ready to send.')
  })

  it('caps the message length so the email link stays usable', () => {
    const wrapper = mountForm()
    expect(wrapper.find('textarea').attributes('maxlength')).toBe('1500')
  })

  describe('form submission', () => {
    const assign = vi.fn()
    const realLocation = window.location

    beforeEach(() => {
      assign.mockReset()
      Object.defineProperty(window, 'location', { value: { ...realLocation, assign }, configurable: true })
    })
    afterEach(() => {
      Object.defineProperty(window, 'location', { value: realLocation, configurable: true })
    })

    async function submit(name = 'Ada Lovelace', email = 'ada@example.com', message = 'Hello & welcome!\nSecond line') {
      const wrapper = mountForm()
      await wrapper.find('input[type="text"]').setValue(name)
      await wrapper.find('input[type="email"]').setValue(email)
      await wrapper.find('textarea').setValue(message)
      await wrapper.find('form').trigger('submit')
      return wrapper
    }

    const opened = () => new URL(assign.mock.calls[0][0] as string)

    it('opens an email to Josh with the subject and message filled in', async () => {
      await submit()
      expect(assign).toHaveBeenCalledTimes(1)
      expect(opened().protocol).toBe('mailto:')
      expect(opened().pathname).toBe('jryther91@gmail.com')
      expect(opened().searchParams.get('subject')).toBe('Portfolio message from Ada Lovelace')
      expect(opened().searchParams.get('body')).toBe('Hello & welcome!\nSecond line\n\nAda Lovelace\nada@example.com')
    })

    it('encodes the text so symbols in it cannot break the link', async () => {
      await submit('A&B', 'ab@example.com', 'x?y=z&subject=nope #1')
      expect(assign.mock.calls[0][0]).not.toContain('&subject=nope')
      expect(opened().searchParams.get('subject')).toBe('Portfolio message from A&B')
      expect(opened().searchParams.get('body')).toContain('x?y=z&subject=nope #1')
    })

    it('writes the subject in Spanish when the page is in Spanish', async () => {
      setLocale('es')
      await submit()
      expect(opened().searchParams.get('subject')).toBe('Mensaje del portafolio de Ada Lovelace')
    })

    it('shows a note with a fallback link, and keeps the text in case it was not sent', async () => {
      const wrapper = await submit()
      const note = wrapper.find('[role="status"] .form-message')
      expect(note.text()).toContain('Your email app should open with your message ready to send.')
      expect(note.find('a').attributes('href')).toBe('mailto:jryther91@gmail.com')
      expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toContain('Hello')
    })
  })
})
