// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* React 19 reconciles <html>'s className during hydration, wiping the class
 * the pre-paint head script set. This re-applies the stored theme the moment
 * hydration finishes, on every page. */
export const ThemeSync = createComponent<Record<string, never>>("ThemeSync", [], (__props, __slots) => {
  watchLifecycle(() => {
    try {
      const theme = localStorage.getItem("bui-theme");
      document.documentElement.classList.toggle("dark", theme !== "light");
    } catch {
      document.documentElement.classList.add("dark");
    }
  }, () => []);
  return () => {
    return null;
  };
});
