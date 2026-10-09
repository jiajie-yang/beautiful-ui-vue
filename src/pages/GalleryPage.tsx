import LanguageToggle from '@/components/site/LanguageToggle';
import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { SOURCES } from "@/lib/sources";
import Link from "@/components/site/Link";
import { Grid } from "@/components/site/Grid";
import { Nav } from "@/components/site/Nav";
import { EmailCapture } from "@/components/site/EmailCapture";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { META } from "@/lib/meta";

/* Sources are read at build time (static export) so every card
 * can offer its own copy-paste-able file. */
const Home = createComponent<Record<string, never>>("Home", [], (__props, __slots) => {
  const sources = computed(() => SOURCES);
  return () => {
    return <main class="relative mx-auto max-w-[960px] bg-page shadow-[0_0_0_1px_var(--line)]">
      <div class="lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
        {/* left rail — the system, then the component nav */}
        <aside class="flex flex-col border-b border-dashed border-line px-5 pt-12 pb-6 sm:px-7 sm:pt-16 sm:pb-7 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden lg:border-r lg:border-b-0 lg:pt-[clamp(2.5rem,8vh,5rem)]">
          <div class="shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-end gap-1.5">
                <img src="/logo.png" alt={"Beautiful UI"} class="-ml-3 size-20 shrink-0 lg:ml-0" />
                <span class="mb-[6px] inline-flex h-[17px] shrink-0 items-center rounded-[4px] bg-green-tint px-1 text-[13px] font-semibold leading-none text-green">
                  {"Vue"}</span>
              </div>
              <div class="flex flex-wrap items-center justify-end gap-2"><LanguageToggle /><ThemeToggle /></div>
            </div>

            <h1 class="mt-12 text-[21px] leading-snug font-semibold tracking-[-0.02em] text-ink text-balance lg:mt-[clamp(1.5rem,5vh,3rem)]">
              {t("gallery.beautifulUiForAiNativeInterfaces")}</h1>
          </div>

          <div class="relative mt-7 hidden border-t border-dashed border-line pt-6 lg:block lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:pt-0">
            <div class="component-nav-scroll lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pt-6 lg:pb-16">
              <Nav />
            </div>
          </div>

          <div class="mt-6 shrink-0 border-t border-dashed border-line pt-2">
            <Link href="/harness" className="mb-2 flex items-center justify-between gap-3 rounded-control px-2 py-2 text-[12.5px] font-medium text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink">
              {t("gallery.iceCreamHarness")}
              <svg class="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <div class="mb-2 border-t border-dashed border-line" />
            <a href="https://github.com/jiajie-yang/beautiful-ui-vue" target="_blank" rel="noreferrer" class="group flex items-center justify-between gap-3 rounded-control px-2 py-2 text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink">
              <span class="min-w-0">
                <span class="flex items-center gap-1.5 text-[12.5px] font-medium leading-[14px]">
                  <svg class="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.52 11.52 0 0 1 12 6.098c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.654 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  {"GitHub"}</span>
                <span class="mt-1 block break-all font-mono text-[10.5px] text-ink-3">{"jiajie-yang/beautiful-ui-vue"}</span>
              </span>
              <svg class="shrink-0 text-ink-3 group-hover:text-ink" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 5h5v5M19 5l-8 8M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
              </svg>
            </a>
          </div>
        </aside>

        {/* right — the components, then the signup at the end of the scroll */}
        <div class="min-w-0">
          <Grid sources={sources.value} />
          <EmailCapture />

          {/* footer — lives in the scroll column so the sticky rail is untouched */}
          <footer class="flex items-center justify-between gap-4 border-t border-dashed border-line px-5 py-6 sm:px-8">
            <span class="text-[12px] text-ink-3">{"© 2026 Beautiful UI Vue"}</span>
            <span class="flex items-center gap-4">
              <Link href="/harness" className="text-[12px] text-ink-3 transition-colors duration-150 hover:text-ink">
                {t("gallery.iceCreamHarness")}</Link>
              <Link href="/license" className="text-[12px] text-ink-3 transition-colors duration-150 hover:text-ink">
                {t("common.mitLicense")}</Link>
            </span>
          </footer>
        </div>
      </div>
    </main>;
  };
});
export default Home;
