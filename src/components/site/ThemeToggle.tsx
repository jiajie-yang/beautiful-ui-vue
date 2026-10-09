import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/** Sun/moon segmented pill from the refs. */
export const ThemeToggle = createComponent<Record<string, never>>("ThemeToggle", [], (__props, __slots) => {
  const [dark, setDark] = createState<boolean | null>(null);
  watchLifecycle(() => {
    /* localStorage is the source of truth — the html class can be stale
     * for a moment around hydration (see ThemeSync). */
    try {
      setDark(localStorage.getItem("bui-theme") !== "light");
    } catch {
      setDark(document.documentElement.classList.contains("dark"));
    }
  }, () => []);
  function apply(next: boolean) {
    if (next === dark.value) return;
    setDark(next);
    /* freeze all transitions while every token flips, so the theme change
     * is one clean swap instead of hundreds of mismatched color fades */
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.classList.toggle("dark", next);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
    try {
      localStorage.setItem("bui-theme", next ? "dark" : "light");
    } catch {}
  }
  return () => {
    return <div class="relative inline-grid h-[calc(1.5em+0.75rem)] grid-cols-2 items-center rounded-full bg-field p-0.5 text-[11.5px]">
      <span aria-hidden class="absolute inset-y-0.5 left-0.5 w-8 rounded-full bg-surface shadow-btn
          transition-transform duration-200" style={cssStyle({
        transform: dark.value ? "translateX(32px)" : "translateX(0)",
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        opacity: dark.value === null ? 0 : 1
      })} />
      <button aria-label={t("themeToggle.lightMode")} onClick={() => apply(false)} class={`relative z-10 flex h-full w-8 items-center justify-center rounded-full
          transition-colors duration-150 ${dark.value ? "text-ink-3 hover:text-ink-2" : "text-ink"}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>
      <button aria-label={t("themeToggle.darkMode")} onClick={() => apply(true)} class={`relative z-10 flex h-full w-8 items-center justify-center rounded-full
          transition-colors duration-150 ${dark.value ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>

    </div>;
  };
});
