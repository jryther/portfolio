<template>
  <div
    ref="rootEl"
    class="resume-menu"
    :class="[`align-${align}`, { 'is-open': open }]"
    @keydown="onKeyDown"
    @focusout="onFocusOut"
  >
    <!-- Menu button (WAI-ARIA menu button pattern). The slot is the button's visible content -->
    <button
      ref="buttonEl"
      type="button"
      :class="buttonClass"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="menuId"
      @click="toggle"
    >
      <slot />
      <UiIcon
        name="chevron-down"
        class="chevron"
      />
    </button>

    <ul
      v-show="open"
      :id="menuId"
      ref="menuEl"
      class="resume-menu-list"
      role="menu"
      :aria-label="t('resumeMenu.label')"
    >
      <li
        v-for="item in items"
        :key="item.key"
        role="none"
      >
        <a
          role="menuitem"
          tabindex="-1"
          class="resume-menu-item"
          :href="item.href"
          :download="item.download"
          :target="item.download ? undefined : '_blank'"
          :rel="item.download ? undefined : 'noreferrer'"
          @click="close(false)"
        >
          <span class="format">{{ item.label }}</span>
          <span class="ext">{{ item.ext }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from './icons/UiIcon.vue'
import resumePdf from '../assets/Resume.pdf'
import resumeDocx from '../assets/Resume.docx'

// The Resume button everywhere on the site: opens a small menu to pick PDF or Word.
//
// Keyboard (WAI-ARIA menu button pattern): Enter, Space or ArrowDown opens it on the first
// format, ArrowUp on the last; ArrowUp/ArrowDown move between formats, Home/End jump to the
// ends, Escape closes it and returns focus to the button, and Tab moves on and closes it.
// Clicking outside or choosing a format closes it too.

const props = withDefaults(defineProps<{
  /** Classes for the button, so it matches where it sits */
  buttonClass?: string
  /** 'view' opens the PDF in a new tab; 'download' saves it. Word always downloads */
  pdfAction?: 'view' | 'download'
  /** Which edge of the button the menu lines up with */
  align?: 'start' | 'end'
}>(), { buttonClass: 'button-ghost', pdfAction: 'view', align: 'start' })

const { t } = useI18n()
const menuId = `resume-menu-${useId()}`
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const buttonEl = ref<HTMLButtonElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)

const items = computed(() => [
  {
    key: 'pdf',
    label: t('resumeMenu.pdf'),
    ext: '.pdf',
    href: resumePdf,
    download: props.pdfAction === 'download' ? 'Joshua_Ryther_Resume.pdf' : undefined,
  },
  { key: 'docx', label: t('resumeMenu.docx'), ext: '.docx', href: resumeDocx, download: 'Joshua_Ryther_Resume.docx' },
])

const menuItems = () => [...(menuEl.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]

async function openMenu(focus: 'first' | 'last' = 'first') {
  open.value = true
  await nextTick()
  const list = menuItems()
  ;(focus === 'first' ? list[0] : list[list.length - 1])?.focus()
}

function close(returnFocus = true) {
  if (!open.value) return
  open.value = false
  if (returnFocus) buttonEl.value?.focus()
}

function toggle() {
  if (open.value) close()
  else openMenu('first')
}

function moveFocus(step: number | 'first' | 'last') {
  const list = menuItems()
  if (!list.length) return
  const current = list.indexOf(document.activeElement as HTMLElement)
  const next = step === 'first' ? 0
    : step === 'last' ? list.length - 1
      : (current + step + list.length) % list.length
  list[next].focus()
}

function onKeyDown(e: KeyboardEvent) {
  const onButton = e.target === buttonEl.value
  if (onButton && !open.value) {
    if (e.key === 'ArrowDown') { e.preventDefault(); openMenu('first') }
    else if (e.key === 'ArrowUp') { e.preventDefault(); openMenu('last') }
    return
  }
  if (!open.value) return
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); moveFocus(1); break
    case 'ArrowUp': e.preventDefault(); moveFocus(-1); break
    case 'Home': e.preventDefault(); moveFocus('first'); break
    case 'End': e.preventDefault(); moveFocus('last'); break
    case 'Escape':
      // Only this menu closes, not the phone nav or chat popup it may sit inside
      e.preventDefault()
      e.stopPropagation()
      close()
      break
    case 'Tab': close(false); break
  }
}

// Focus moving anywhere outside the button and menu closes it
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (open.value && next && !rootEl.value?.contains(next)) close(false)
}

function onPointerDownOutside(e: PointerEvent) {
  if (open.value && !rootEl.value?.contains(e.target as Node)) close(false)
}
onMounted(() => document.addEventListener('pointerdown', onPointerDownOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDownOutside))
</script>

<style scoped>
.resume-menu {
  position: relative;
  display: inline-block;
}

.chevron {
  width: 1.4rem;
  height: 1.4rem;
  margin-left: 0.6rem;
  margin-right: -0.2rem;
  transition: transform 0.2s ease;
}
.is-open .chevron {
  transform: rotate(180deg);
}

.resume-menu-list {
  position: absolute;
  top: calc(100% + 0.6rem);
  z-index: 50;
  min-width: 100%;
  width: max-content;
  margin: 0;
  padding: 0.4rem;
  list-style: none;
  background: var(--color-surface);
  border: 1px solid var(--color-line-strong);
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.25);
}
.align-start .resume-menu-list { left: 0; }
.align-end .resume-menu-list { right: 0; }

.resume-menu-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 2rem;
  padding: 0.9rem 1.2rem;
  border-radius: 0.7rem;
  font-size: 1.45rem;
  font-weight: 500;
  color: var(--color-snow);
  text-decoration: none;
  white-space: nowrap;
}
.resume-menu-item:hover,
.resume-menu-item:focus-visible {
  background: color-mix(in srgb, var(--color-amber) 12%, transparent);
  color: var(--color-amber);
}
.resume-menu-item:focus-visible {
  outline-offset: -2px;
}
.ext {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  color: var(--color-ash);
}

@media (prefers-reduced-motion: reduce) {
  .chevron { transition: none; }
}
</style>
