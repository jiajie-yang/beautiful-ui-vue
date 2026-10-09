// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * CONTEXT CARDS
 * Retrieved chunks enter once, then remain available.
 * ───────────────────────────────────────────────────────── */

export type ContextChunk = {
  title: string;
  chars: string;
  body: string;
  source: string;
  badge: string;
  tone: string;
};
export type ContextCardsLabels = {
  header: string;
  count: string;
};
const DEFAULT_LABELS: ContextCardsLabels = {
  header: "All chunks",
  count: "32"
};
const CHUNKS: ContextChunk[] = [{
  title: "Vendor onboarding rule",
  chars: "290 characters",
  body: "Cold-chain certification must be verified before a new dairy can be added to the reorder workflow.",
  source: "Dairy Onboarding SOP.pdf",
  badge: "PDF",
  tone: "bg-red"
}, {
  title: "Seasonal demand row",
  chars: "1,250 characters",
  body: "Q4 velocity table: pistachio +18%, vanilla +6%, rocky road -11%; retire flavors below 40 scoops weekly.",
  source: "Sales Velocity Export.csv",
  badge: "CSV",
  tone: "bg-green"
}];
const ContextCards = createComponent<{
  /** Accepted for gallery/registry parity; ContextCards has no visual variants. */
  variant?: string;
  chunks?: ContextChunk[];
  labels?: Partial<ContextCardsLabels>;
  className?: string;
}>("ContextCards", ["variant", "chunks", "labels", "className"], (__props, __slots) => {
  const chunks = computed(() => __props.chunks === undefined ? CHUNKS : __props.chunks);
  const labels = computed(() => __props.labels);
  const className = computed(() => __props.className);
  const [chipsShown, setChipsShown] = createState(false);
  const copy = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  watchLifecycle(() => {
    const chips = setTimeout(() => setChipsShown(true), 700);
    return () => clearTimeout(chips);
  }, () => []);
  return () => {
    return <div class={`flex w-full max-w-95 flex-col gap-2${className.value ? ` ${className.value}` : ""}`}>
      <div class="flex items-center gap-2 px-0.5" style={cssStyle({
        animation: "fade-in 400ms ease-out both"
      })}>
        <span class="text-[13px] font-semibold text-ink">{copy.value.header}</span>
        <span class="inline-flex h-5 items-center rounded-md bg-inset px-1.5 text-[11.5px] font-medium text-ink-2 shadow-hairline tabular-nums">
          {copy.value.count}
        </span>
      </div>

      {chunks.value.map((chunk, i) => <div key={chunk.title} class="overflow-hidden rounded-card bg-surface shadow-card" style={cssStyle({
        animation: `fade-up 400ms cubic-bezier(0.23,1,0.32,1) ${i * 100}ms both`
      })}>
          <div class="primitive-card-bar flex items-center gap-2.5 border-b border-line">
            <span class="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-ink">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
              <span class="truncate">{chunk.title}</span>
            </span>
            <span class="ml-auto shrink-0 text-[12px] text-ink-3 tabular-nums">{chunk.chars}</span>
          </div>
          <p class="px-3 pt-2 pb-1 text-[12.5px] leading-relaxed text-ink-2">
            {chunk.body}
          </p>
          <div class="px-3 pb-3">
            <span class="inline-flex h-6 items-center gap-1.5 rounded-full bg-inset px-2
                text-[12px] font-medium text-ink-2 shadow-btn
                transition-[opacity,transform,background-color] duration-300 hover:bg-hover" style={cssStyle({
            opacity: chipsShown.value ? 1 : 0,
            transform: chipsShown.value ? "scale(1)" : "scale(0.95)",
            transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
            transitionDelay: `${i * 80}ms`
          })}>
              <span class={`flex size-3.5 items-center justify-center rounded-[4px] ${chunk.tone} text-[7px] font-bold text-white`}>
                {chunk.badge}
              </span>
              {chunk.source}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10" /></svg>
            </span>
          </div>
        </div>)}
    </div>;
  };
});
export default ContextCards;
