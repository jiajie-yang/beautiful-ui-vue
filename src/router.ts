import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('./pages/GalleryPage'), meta: { title: 'Beautiful UI — Crafted primitives for AI-native interfaces' } },
    { path: '/harness', component: () => import('./components/site/IceCreamHarness'), meta: { title: 'Ice Cream Harness — Beautiful UI Vue' } },
    { path: '/license', component: () => import('./pages/LicensePage'), meta: { title: 'MIT License' } },
    { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFoundPage.vue'), meta: { title: '页面未找到' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
router.afterEach((to) => { document.title = String(to.meta.title) })
