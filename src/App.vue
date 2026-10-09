<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import { ThemeSync } from './components/site/ThemeSync'
import { InteractionSounds } from './components/site/InteractionSounds'
import { EmailNudge } from './components/site/EmailNudge'
import DevToolbar from './components/site/DevToolbar.vue'
const error = ref<Error | null>(null)
onErrorCaptured((err) => { error.value = err; return false })
</script>
<template>
  <main v-if="error" class="mx-auto max-w-xl p-8"><h2>Something went wrong.</h2><button type="button" @click="error = null">Try again</button></main>
  <template v-else><ThemeSync /><InteractionSounds /><EmailNudge /><RouterView /></template>
  <DevToolbar v-if="!error" />
</template>
