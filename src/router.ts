import { watch } from 'vue'
import { t, locale, type MessageKey } from './lib/i18n'
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('./pages/GalleryPage'), meta: { titleKey: "router.beautifulUiCraftedPrimitivesForAiNativeInterfaces" } },
    { path: '/harness', component: () => import('./components/site/IceCreamHarness'), meta: { titleKey: "router.iceCreamHarnessBeautifulUiVue" } },
    { path: '/license', component: () => import('./pages/LicensePage'), meta: { titleKey: "common.mitLicense" } },
    { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFoundPage.vue'), meta: { titleKey: "router.pageNotFound" } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
function syncLanguage() {
  document.documentElement.lang = locale.value
  document.title = t((router.currentRoute.value.meta.titleKey ?? 'router.beautifulUiCraftedPrimitivesForAiNativeInterfaces') as MessageKey)
  document.querySelector('meta[name="description"]')?.setAttribute('content', t("router.craftedVuePrimitivesForAiNativeInterfaces"))
}
router.afterEach(syncLanguage)
watch(locale, syncLanguage, { immediate: true })
