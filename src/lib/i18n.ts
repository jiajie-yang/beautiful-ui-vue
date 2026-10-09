import { createI18n } from 'vue-i18n'
import { en, type MessageKey } from './locales/en'
import { zhCN } from './locales/zh-CN'

const messages = { en, 'zh-CN': zhCN }
export type Locale = keyof typeof messages
export type { MessageKey } from './locales/en'
const STORAGE_KEY = 'bui-locale'
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && Object.hasOwn(messages, saved)) return saved as Locale
  } catch { /* Storage can be disabled. */ }
  const preferred = typeof navigator === 'undefined' ? 'en' : navigator.language.toLowerCase()
  const supported = Object.keys(messages) as Locale[]
  return supported.find(code => code.toLowerCase() === preferred)
    ?? supported.find(code => code.split('-')[0] === preferred.split('-')[0])
    ?? 'en'
}

// The same Composer also serves standalone registry components without app injection.
export const i18n = createI18n({
  legacy: false,
  globalInjection: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages,
})
export const locale = i18n.global.locale
export function setLocale(next: Locale) {
  locale.value = next
  try { localStorage.setItem(STORAGE_KEY, next) } catch { /* Keep switching usable without storage. */ }
}

/** Stable keys for new UI copy. Params are literal data, never translated implicitly. */
export function t(key: MessageKey, params: Record<string, unknown> | unknown[] | number = {}, options: { locale?: Locale } = {}) {
  if (typeof params === 'number') return i18n.global.t(key, params, options)
  if (Array.isArray(params)) return i18n.global.t(key, params, options)
  return i18n.global.t(key, params, options)
}
