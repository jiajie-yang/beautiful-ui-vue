import { defineComponent } from 'vue'
import { locale, setLocale, t, type Locale } from '@/lib/i18n'

export default defineComponent({
  name: 'LanguageToggle',
  setup() {
    return () => <div role="group" aria-label={t('common.interfaceLanguage')} class="inline-flex shrink-0 items-center rounded-full bg-field p-0.5">
      {(['en', 'zh-CN'] as Locale[]).map(value => <button type="button" key={value} lang={value} aria-pressed={locale.value === value} onClick={() => setLocale(value)} class={`rounded-full px-2 py-1 text-[11.5px] font-medium transition-colors ${locale.value === value ? 'bg-surface text-ink shadow-btn' : 'text-ink-3 hover:text-ink'}`}>
        {value === 'en' ? 'EN' : '中文'}
      </button>)}
    </div>
  },
})
