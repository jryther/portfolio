<template>
  <!-- Toasts for problems that have no place of their own on the page (see services/errors.ts).
       Both live regions are always in the DOM so screen readers announce what's added to them:
       errors interrupt (alert), notes and warnings wait their turn (status). Nothing here takes
       focus; keyboard users can Tab in, Esc dismisses the focused notice -->
  <div
    ref="rootEl"
    class="notices"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div
      v-for="region in regions"
      :key="region.role"
      :role="region.role"
      aria-atomic="false"
      aria-relevant="additions"
      class="notice-region"
    >
      <TransitionGroup name="notice">
        <div
          v-for="notice in region.items"
          :key="notice.id"
          class="notice"
          :class="`is-${notice.level}`"
          @keydown.esc.stop="close(notice.id)"
        >
          <UiIcon
            :name="ICONS[notice.level]"
            class="notice-icon"
          />
          <p class="notice-text">
            <span class="sr-only">{{ t(`notices.levels.${notice.level}`) }}: </span>
            {{ t(notice.messageKey, notice.params ?? {}) }}
          </p>
          <button
            v-if="notice.action"
            type="button"
            class="notice-action"
            @click="runAction(notice)"
          >
            {{ t(notice.action.labelKey) }}
          </button>
          <button
            v-tooltip="t('notices.dismiss')"
            type="button"
            class="notice-close"
            :aria-label="t('notices.dismiss')"
            @click="close(notice.id)"
          >
            <UiIcon name="close" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { vTooltip } from '../directives/tooltip'
import { useI18n } from 'vue-i18n'
import UiIcon from './icons/UiIcon.vue'
import type { UiIconName } from './icons/uiIcons'
import { notices, dismiss, pauseNotices, resumeNotices, type Notice, type NoticeLevel } from '../services/errors'

const { t } = useI18n()

const ICONS: Record<NoticeLevel, UiIconName> = {
  info: 'info',
  warn: 'alert-triangle',
  error: 'alert-circle',
}

// Newest first, so a new notice appears right under the header where the eye lands
const regions = computed(() => [
  { role: 'alert',  items: notices.value.filter(n => n.level === 'error').reverse() },
  { role: 'status', items: notices.value.filter(n => n.level !== 'error').reverse() },
])

const rootEl = ref<HTMLElement | null>(null)

// Countdowns hold while the visitor is pointing at or focused inside the notices
let hovering = false
let focusInside = false
// Where focus came from, to hand it back once the last notice is dismissed
let returnFocus: HTMLElement | null = null

function onPointerEnter() {
  hovering = true
  pauseNotices()
}
function onPointerLeave() {
  hovering = false
  if (!focusInside) resumeNotices()
}
function onFocusIn(e: FocusEvent) {
  focusInside = true
  pauseNotices()
  const from = e.relatedTarget as HTMLElement | null
  if (from && !rootEl.value?.contains(from)) returnFocus = from
}
function onFocusOut(e: FocusEvent) {
  if (rootEl.value?.contains(e.relatedTarget as Node | null)) return
  focusInside = false
  if (!hovering) resumeNotices()
}

// A dismissed notice that had focus passes it to the next notice, or back where it came from,
// so keyboard users aren't dropped at the top of the page
async function close(id: number) {
  const hadFocus = !!rootEl.value?.contains(document.activeElement)
  dismiss(id)
  if (!hadFocus) return
  await nextTick()
  const next = rootEl.value?.querySelector<HTMLElement>('.notice:not(.notice-leave-active) .notice-close')
  if (next) next.focus()
  else if (returnFocus?.isConnected) returnFocus.focus()
  else document.getElementById('main')?.focus()
}

function runAction(notice: Notice) {
  notice.action?.run()
  close(notice.id)
}
</script>

<style scoped>
/* Top-right, just under the fixed header (6.8rem, 6rem on smaller screens), clear of the chat
   dock in the bottom-right corner. Full width on phones */
.notices {
  --gutter: 2rem;
  position: fixed;
  top: calc(6.8rem + 1.2rem);
  right: var(--gutter);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(40rem, calc(100vw - var(--gutter) * 2));
  pointer-events: none;
}

@media (max-width: 768px) {
  .notices { top: calc(6rem + 1rem); }
}

@media (width < 480px) {
  .notices { --gutter: 1rem; }
}

.notice-region {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notice {
  --tone: var(--color-moss);
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.1rem 0.8rem 1.1rem 1.3rem;
  border: 1px solid color-mix(in srgb, var(--tone) 45%, var(--color-line-strong));
  border-radius: 1.2rem;
  background-color: color-mix(in srgb, var(--tone) 8%, var(--color-panel));
  color: var(--color-snow);
  box-shadow: 0 8px 30px rgb(0 0 0 / 0.3);
}
.notice.is-warn  { --tone: var(--color-ember); }
.notice.is-error { --tone: var(--color-rust); }

:root[data-theme="light"] .notice {
  box-shadow: 0 8px 30px rgb(19 32 28 / 0.12);
}

.notice-icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  margin-top: 0.05rem;
  color: var(--tone);
}

.notice-text {
  flex: 1;
  min-width: 0;
  padding-top: 0.1rem;
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
}

.notice-action {
  flex-shrink: 0;
  min-height: 2.4rem;
  padding: 0.1rem 0.4rem;
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
  font-weight: 600;
  color: var(--color-amber);
  text-decoration: underline;
  text-underline-offset: 0.3rem;
  cursor: pointer;
}
.notice-action:hover {
  color: var(--color-golden);
}

/* 2.8rem keeps the target comfortably above WCAG 2.5.8's 24px minimum */
.notice-close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  margin-top: -0.3rem;
  border-radius: 0.6rem;
  color: var(--color-ash);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}
.notice-close:hover {
  color: var(--color-snow);
  background-color: color-mix(in srgb, var(--color-snow) 8%, transparent);
}
.notice-close svg {
  width: 1.6rem;
  height: 1.6rem;
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
/* Slides down out of the header */
.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translateY(-0.8rem);
}
</style>
