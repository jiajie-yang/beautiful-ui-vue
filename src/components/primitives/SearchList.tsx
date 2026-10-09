import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * SEARCH — command search with live filtering.
 * The field, clear action, and results are directly usable.
 * ───────────────────────────────────────────────────────── */

export type SearchItem = string;
export type SearchListLabels = {
  placeholder: string;
  ariaLabel: string;
  emptyTitle: string;
  emptyHint: string;
};
const ITEM_KEYS = ["searchList.forecastSummerDemand", "searchList.findWaffleConeSuppliers", "searchList.compareSeasonalFlavors", "searchList.draftFlavorLaunchPlan", "searchList.checkColdChainStatus", "searchList.auditSugarCosts", "searchList.retireLowSellers"] as const;
function defaultItems() { return ITEM_KEYS.map(key => t(key)); }
const LABELS: SearchListLabels = {
  get placeholder() { return t("searchList.searchFlavors"); },
  get ariaLabel() { return t("searchList.searchFlavors2"); },
  get emptyTitle() { return t("searchList.noResultsFound"); },
  get emptyHint() { return t("searchList.adjustYourSearchToTryAgain"); }
};
const SearchList = createComponent<{
  items?: SearchItem[];
  labels?: SearchListLabels;
  variant?: string;
}>("SearchList", ["items", "labels", "variant"], (__props, __slots) => {
  const items = computed(() => __props.items === undefined ? defaultItems() : __props.items);
  const labels = computed(() => __props.labels === undefined ? LABELS : __props.labels);
  const [query, setQuery] = createState("");
  const results = computed(() => query.value ? items.value.filter((item, index) => item.toLowerCase().includes(query.value.toLowerCase()) || (__props.items === undefined && t(ITEM_KEYS[index], {}, { locale: "en" }).toLowerCase().includes(query.value.toLowerCase()))) : items.value.slice(0, 5));
  const empty = computed(() => query.value.trim().length > 0 && results.value.length === 0);
  return () => {
    return <div class="flex min-h-[248px] w-full max-w-72 flex-col items-stretch">
      <div class="w-full self-start overflow-hidden rounded-card bg-surface shadow-raised">
        {/* input row */}
        <div class="flex h-10 items-center gap-2 border-b border-line px-3 transition-colors duration-100 hover:bg-hover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" class="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input value={query.value} onInput={event => setQuery((event.target as HTMLInputElement).value)} placeholder={labels.value.placeholder} aria-label={labels.value.ariaLabel} class="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3" />
          {query.value && <button aria-label={t("searchList.clearSearch")} type="button" onClick={() => setQuery("")} class="flex size-6 items-center justify-center rounded-full text-ink-3
                transition-colors duration-100 hover:bg-line/70 hover:text-ink" style={cssStyle({
            animation: "fade-in 150ms ease-out both"
          })}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>}
        </div>

        {/* results / empty state */}
        {empty.value ? <div class="flex flex-col items-center justify-center gap-1 px-4 py-8" style={cssStyle({
          animation: "fade-in 250ms ease-out both"
        })}>
            <span class="mb-1.5 flex size-8 items-center justify-center rounded-control bg-inset text-ink-3 shadow-hairline">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <span class="text-[13px] font-medium text-ink">{labels.value.emptyTitle}</span>
            <span class="text-[12px] text-ink-3">{labels.value.emptyHint}</span>
          </div> : <div class="p-1">
            <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[6px] bg-hover">
              {results.value.map(item => <button key={item} data-menu-row type="button" onClick={() => setQuery(item)} class="relative z-10 flex h-8 w-full items-center rounded-[6px] px-2 text-left text-[13px] text-ink" style={cssStyle({
              animation: "fade-in 200ms ease-out both"
            })}>
                  {item}
                </button>)}
            </GlideMenu>
          </div>}
      </div>
    </div>;
  };
});
export default SearchList;
