import type { Directive } from 'vue'

// v-tooltip: styled tooltips that replace the browser's native `title`.
//
// Follows the WAI-ARIA tooltip pattern and WCAG 1.4.13 (content on hover or focus):
// - Shows on mouse hover after a short delay, and right away on keyboard focus. Never on
//   touch, where hover doesn't exist and a tap means "activate".
// - Hoverable: the pointer can move onto the tooltip without it disappearing.
// - Persistent: it stays until hover and focus move away, or it's dismissed.
// - Dismissible: Escape hides it without moving focus, and without also triggering whatever
//   else Escape does (a second Escape then closes the chat popup or the menu as usual).
// - Each tooltip has role="tooltip". When its text adds to the element's accessible name
//   (v-tooltip on a button with visible text), the trigger points to it with aria-describedby.
//   When it only repeats the name (icon buttons with an aria-label), it's hidden from screen
//   readers so the name isn't read out twice.
//
// Usage: v-tooltip="t('toggles.toDark')"  or  v-tooltip="{ text, placement: 'bottom' }"

export type TooltipValue = string | { text: string, placement?: 'top' | 'bottom' }

const SHOW_DELAY_MS = 400   // hover only; keyboard focus shows at once
const HIDE_DELAY_MS = 120   // time to move the pointer from the trigger onto the tooltip
const GAP_PX = 8            // between trigger and tooltip
const EDGE_PX = 8           // keep clear of the viewport edge

interface TooltipState {
  tip: HTMLElement
  text: string
  placement: 'top' | 'bottom'
  showTimer?: ReturnType<typeof setTimeout>
  hideTimer?: ReturnType<typeof setTimeout>
  visible: boolean
  removeListeners: () => void
}

const states = new WeakMap<HTMLElement, TooltipState>()
let nextId = 0

// The one tooltip on screen, so Escape and scrolling know what to hide
let active: { el: HTMLElement, state: TooltipState } | null = null

function normalize(value: TooltipValue): { text: string, placement: 'top' | 'bottom' } {
  return typeof value === 'string'
    ? { text: value, placement: 'top' }
    : { text: value.text, placement: value.placement ?? 'top' }
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Describe the trigger with the tooltip, unless the tooltip only repeats its accessible name.
 * The text is kept in the tooltip even while it's hidden: screen readers read a description
 * from a hidden element, and it has to be there before the tooltip ever shows.
 */
function syncAccessibility(el: HTMLElement, state: TooltipState) {
  state.tip.textContent = state.text
  const name = el.getAttribute('aria-label') ?? el.textContent ?? ''
  const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== state.tip.id)
  const repeatsName = squash(name) === squash(state.text)
  if (repeatsName) {
    state.tip.setAttribute('aria-hidden', 'true')
  } else {
    state.tip.removeAttribute('aria-hidden')
    ids.push(state.tip.id)
  }
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '))
  else el.removeAttribute('aria-describedby')
}

function position(el: HTMLElement, state: TooltipState) {
  const trigger = el.getBoundingClientRect()
  const { offsetWidth: width, offsetHeight: height } = state.tip
  let top = state.placement === 'top' ? trigger.top - height - GAP_PX : trigger.bottom + GAP_PX
  // Flip to the other side when there's no room
  if (state.placement === 'top' && top < EDGE_PX) top = trigger.bottom + GAP_PX
  if (state.placement === 'bottom' && top + height > window.innerHeight - EDGE_PX) top = trigger.top - height - GAP_PX
  const left = Math.min(
    Math.max(trigger.left + trigger.width / 2 - width / 2, EDGE_PX),
    window.innerWidth - width - EDGE_PX,
  )
  state.tip.style.top = `${Math.round(top)}px`
  state.tip.style.left = `${Math.round(left)}px`
  state.tip.dataset.placement = top >= trigger.bottom ? 'bottom' : 'top'
}

function show(el: HTMLElement, state: TooltipState) {
  clearTimeout(state.showTimer)
  clearTimeout(state.hideTimer)
  if (!state.text || !el.isConnected) return
  if (active && active.el !== el) hide(active.el, active.state)
  state.tip.textContent = state.text
  state.tip.hidden = false
  position(el, state)
  state.visible = true
  active = { el, state }
  requestAnimationFrame(() => { if (state.visible) state.tip.classList.add('is-visible') })
}

function hide(el: HTMLElement, state: TooltipState) {
  clearTimeout(state.showTimer)
  clearTimeout(state.hideTimer)
  state.visible = false
  state.tip.classList.remove('is-visible')
  state.tip.hidden = true
  if (active?.el === el) active = null
}

// Escape dismisses the visible tooltip. Capture phase, and stopped there, so the same key
// press doesn't also close the chat popup or the menu behind it
function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !active) return
  hide(active.el, active.state)
  e.stopImmediatePropagation()
  e.preventDefault()
}
// A fixed-position tooltip would drift away from its trigger while the page scrolls
function onScroll() {
  if (active) hide(active.el, active.state)
}
let globalListeners = 0
function addGlobalListeners() {
  if (globalListeners++ > 0) return
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
}
function removeGlobalListeners() {
  if (--globalListeners > 0) return
  window.removeEventListener('keydown', onKeyDown, true)
  window.removeEventListener('scroll', onScroll, true)
}

export const vTooltip: Directive<HTMLElement, TooltipValue> = {
  mounted(el, binding) {
    const { text, placement } = normalize(binding.value)
    const tip = document.createElement('div')
    tip.id = `tooltip-${++nextId}`
    tip.className = 'tooltip'
    tip.setAttribute('role', 'tooltip')
    tip.hidden = true
    document.body.appendChild(tip)

    const state: TooltipState = { tip, text, placement, visible: false, removeListeners: () => {} }
    const scheduleShow = () => {
      clearTimeout(state.hideTimer)
      if (state.visible) return
      clearTimeout(state.showTimer)
      state.showTimer = setTimeout(() => show(el, state), SHOW_DELAY_MS)
    }
    const scheduleHide = () => {
      clearTimeout(state.showTimer)
      clearTimeout(state.hideTimer)
      state.hideTimer = setTimeout(() => hide(el, state), HIDE_DELAY_MS)
    }

    const onEnter = (e: PointerEvent) => { if (e.pointerType !== 'touch') scheduleShow() }
    const onLeave = (e: PointerEvent) => {
      // Still inside the trigger or the tooltip itself: keep it (hoverable)
      if (e.relatedTarget instanceof Node && (el.contains(e.relatedTarget) || tip.contains(e.relatedTarget))) return
      if (el.matches(':focus-visible')) return
      scheduleHide()
    }
    // Keyboard focus only: a mouse click also focuses, and its hover already handles that
    const onFocus = () => { if (el.matches(':focus-visible')) show(el, state) }
    const onBlur = () => hide(el, state)
    // Clicking acts on the control; the tooltip shouldn't sit over what happens next
    const onPress = () => hide(el, state)

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('focus', onFocus)
    el.addEventListener('blur', onBlur)
    el.addEventListener('pointerdown', onPress)
    tip.addEventListener('pointerenter', () => clearTimeout(state.hideTimer))
    tip.addEventListener('pointerleave', onLeave)
    state.removeListeners = () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('blur', onBlur)
      el.removeEventListener('pointerdown', onPress)
    }

    states.set(el, state)
    syncAccessibility(el, state)
    addGlobalListeners()
  },

  // The text can change while it's showing (the theme toggle's label flips on click)
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    const { text, placement } = normalize(binding.value)
    state.text = text
    state.placement = placement
    syncAccessibility(el, state)
    if (state.visible) {
      state.tip.textContent = text
      position(el, state)
    }
  },

  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return
    hide(el, state)
    state.removeListeners()
    state.tip.remove()
    states.delete(el)
    removeGlobalListeners()
  },
}
