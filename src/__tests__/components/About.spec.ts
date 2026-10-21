import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import About from '../../components/About.vue'
import en from '../../i18n/en'
import es from '../../i18n/es'
import { i18n, setLocale } from '../../i18n'

const mountAbout = () => mount(About, { global: { plugins: [i18n] } })

describe('About', () => {
  afterEach(() => setLocale('en'))

  // Lists come from the locale files through tm(); te() can't see them, which once hid every bullet
  it('renders the timeline bullets', () => {
    const items = mountAbout().findAll('.timeline-item')
    const bullets = (i: number) => items[i].findAll('li').map(li => li.text())
    expect(bullets(0)).toEqual(en.about.timeline.pearson.bullets)
    expect(bullets(2)).toEqual(en.about.timeline.pharmacy.bullets)
    expect(bullets(1)).toEqual([])   // education entries have none
  })

  it('renders the timeline in Spanish after switching', async () => {
    const wrapper = mountAbout()
    setLocale('es')
    await wrapper.vm.$nextTick()
    const first = wrapper.findAll('.timeline-item')[0]
    expect(first.find('.timeline-date').text()).toBe(es.about.timeline.pearson.dates)
    expect(first.findAll('li').map(li => li.text())).toEqual(es.about.timeline.pearson.bullets)
  })
})
