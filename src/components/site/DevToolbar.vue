<script setup lang="ts">
import { t } from '@/lib/i18n'
import { onBeforeUnmount, ref } from 'vue'
const enabled = import.meta.env.DEV
const active = ref(false)
const note = ref('')
const selected = ref('')
const copied = ref(false)
function inspect(event: MouseEvent) {
  if (!active.value || !(event.target instanceof Element) || event.target.closest('[data-dev-toolbar]')) return
  event.preventDefault(); event.stopPropagation()
  const el = event.target
  selected.value = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} · ${el.textContent?.trim().slice(0, 100) ?? ''}`
}
if (enabled) document.addEventListener('click', inspect, true)
onBeforeUnmount(() => document.removeEventListener('click', inspect, true))
async function copy() { await navigator.clipboard.writeText(`Element: ${selected.value}\nFeedback: ${note.value}`); copied.value = true }
</script>
<template>
  <aside v-if="enabled" data-dev-toolbar data-sound-silent class="fixed bottom-4 right-4 z-[100] max-w-xs rounded-card bg-surface p-3 text-xs shadow-overlay">
    <button type="button" :aria-pressed="active" @click="active = !active">{{ active ? t('common.exitInspect') : t('devToolbar.annotateUi') }}</button>
    <template v-if="active"><p class="my-2 break-words">{{ selected || t('devToolbar.clickAnElementToInspect') }}</p><textarea v-model="note" :aria-label="t('common.visualFeedback')" :placeholder="t('common.describeTheUiChange')" class="w-full bg-inset p-2" /><button type="button" :disabled="!selected || !note" @click="copy">{{ copied ? t('common.copied') : t('devToolbar.copyFeedback') }}</button></template>
  </aside>
</template>
