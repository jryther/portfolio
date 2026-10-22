import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Notices from '../../components/Notices.vue'
import { i18n, setLocale } from '../../i18n'
import { notify, dismiss, notices } from '../../services/errors'

const mountNotices = () => mount(Notices, { global: { plugins: [i18n] }, attachTo: document.body })

describe('Notices', () => {
  afterEach(() => {
    notices.value.forEach(n => dismiss(n.id))
    setLocale('en')
    document.body.innerHTML = ''
  })

  it('has its live regions in place before anything goes wrong', () => {
    const wrapper = mountNotices()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.findAll('.notice')).toHaveLength(0)
  })

  it('puts errors in the alert region and warnings in the status region', async () => {
    const wrapper = mountNotices()
    notify('error', 'notices.unexpected')
    notify('warn', 'notices.offline')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="alert"]').text()).toContain('Something went wrong on this page')
    expect(wrapper.find('[role="status"]').text()).toContain("You're offline")
  })

  it('names the level for screen readers, since colour and icon are not read out', async () => {
    const wrapper = mountNotices()
    notify('error', 'notices.unexpected')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.notice .sr-only').text()).toBe('Error:')
  })

  it('follows the language', async () => {
    const wrapper = mountNotices()
    notify('error', 'notices.unexpected')
    setLocale('es')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.notice-text').text()).toContain('Algo salió mal')
  })

  it('dismisses a notice from its close button', async () => {
    const wrapper = mountNotices()
    notify('error', 'notices.unexpected')
    await wrapper.vm.$nextTick()
    const close = wrapper.find('.notice-close')
    expect(close.attributes('aria-label')).toBe('Dismiss notification')
    await close.trigger('click')
    expect(notices.value).toHaveLength(0)
  })

  it('dismisses the focused notice with Escape', async () => {
    const wrapper = mountNotices()
    notify('error', 'notices.unexpected')
    await wrapper.vm.$nextTick()
    await wrapper.find('.notice').trigger('keydown', { key: 'Escape' })
    expect(notices.value).toHaveLength(0)
  })

  it('runs a notice action and then dismisses it', async () => {
    const wrapper = mountNotices()
    const run = vi.fn()
    notify('warn', 'notices.outdated', { action: { labelKey: 'notices.reload', run } })
    await wrapper.vm.$nextTick()
    const action = wrapper.find('.notice-action')
    expect(action.text()).toBe('Reload')
    await action.trigger('click')
    expect(run).toHaveBeenCalled()
    expect(notices.value).toHaveLength(0)
  })
})
