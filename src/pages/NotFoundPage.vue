<script setup lang="ts">
import { t } from '@/lib/i18n'
</script>
<template><main class="px-6 py-16"><h1 class="text-2xl font-semibold">{{ t('router.pageNotFound') }}</h1><RouterLink to="/" class="mt-5 inline-block text-accent">{{ t('common.backToComponents') }}</RouterLink></main></template>
