<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="(d, i) in ICONS[name]"
      :key="i"
      :d="d"
    />
  </svg>
</template>

<script setup lang="ts">
import { ICONS, type UiIconName } from './uiIcons'

defineProps<{ name: UiIconName }>()
</script>
