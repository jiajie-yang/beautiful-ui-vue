import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import licenseText from "../../LICENSE?raw";
import Link from "@/components/site/Link";

/* The license text is read from the repo's LICENSE file at build time, so
 * this page and the actual license can never drift apart. */

export const metadata = {
  get title() { return t("licensePage.licenseBeautifulUi"); },
  get description() { return t("licensePage.beautifulUiComponentsAreReleasedUnderTheMitLicense"); }
};
const LicensePage = createComponent<Record<string, never>>("LicensePage", [], (__props, __slots) => {
  const license = computed(() => licenseText.trim());
  return () => {
    return <main class="mx-auto min-h-dvh max-w-[720px] bg-page px-6 py-8 shadow-[0_0_0_1px_var(--line)] sm:px-8 lg:px-10">
      <header class="py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {t("licensePage.back")}</Link>

        <h1 class="mt-8 text-[21px] leading-snug font-semibold tracking-[-0.02em] text-ink text-balance">
          {t("licensePage.yesYouCanUseItForFree")}</h1>
      </header>

      <section class="border-t border-dashed border-line py-8">
        <div class="overflow-hidden rounded-window bg-surface shadow-card">
          <div class="flex items-center justify-between border-b border-line bg-inset px-4 py-2.5">
            <span class="text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-3">
              {t("common.mitLicense")}</span>
            <span class="font-mono text-[11.5px] text-ink-3">{"LICENSE"}</span>
          </div>
          <pre class="overflow-x-auto whitespace-pre-wrap px-5 py-5 font-mono text-[12.5px] leading-relaxed text-ink-2">
            {license.value}
          </pre>
        </div>
      </section>
    </main>;
  };
});
export default LicensePage;
