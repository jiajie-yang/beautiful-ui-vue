import { t, locale } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, watch, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * STREAMING TEXT
 * Words resolve out of blur, inline citations appear in
 * context, then actions and follow-up prompts become usable.
 * ───────────────────────────────────────────────────────── */

const WORD_MS = 55;
const HOLD_MS = 3400;

/* one streamed word, or a `cite` placeholder that renders an inline source chip */
export type StreamingToken = {
  text: string;
  cite?: boolean;
};
function defaultTokens(): StreamingToken[] {
  const tokens = (text: string) => (locale.value.startsWith('zh') ? Array.from(text) : text.split(' ')).map(text => ({ text }))
  return [...tokens(t("streamingText.pistachioIsYourFastestGrowingFlavorSalesAreUp")), { text: '', cite: true }, ...tokens(t("streamingText.stoneFruitFlavorsAreTrendingInTheSameRange"))]
}
function defaultFollowUps() { return [t("streamingText.whichFlavorsSellBestInWinter"), t("streamingText.compareGelatoAndSoftServeMargins")]; }
const SOURCE_IMAGES = {
  scoop: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231f7a5f'/%3E%3Cpath d='M20 36c0 7 5.4 12 12 12s12-5 12-12H20Z' fill='%23fff'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%23bff3dd'/%3E%3Cpath d='M24 24c4-7 13-7 17 0' fill='none' stroke='%231f7a5f' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E",
  trends: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%232f6fec'/%3E%3Cpath d='M15 43 27 31l8 7 14-18' fill='none' stroke='%23fff' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='49' cy='20' r='5' fill='%23bfe0ff'/%3E%3C/svg%3E",
  market: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23e56d24'/%3E%3Cpath d='M17 45V25h8v20h-8Zm11 0V16h8v29h-8Zm11 0V30h8v15h-8Z' fill='%23fff'/%3E%3Cpath d='M16 49h32' stroke='%23ffd6b8' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"
};

/* one cited source rendered as an inline chip and in the sources list */
export type StreamingSource = {
  name: string;
  domain: string;
  href: string;
  image: string;
};
const SOURCES: StreamingSource[] = [{
  name: "Scoop Data",
  domain: "scoopdata.io",
  href: "https://scoopdata.io/",
  image: SOURCE_IMAGES.scoop
}, {
  name: "Trends Index",
  domain: "trends.google.com",
  href: "https://trends.google.com/trends/",
  image: SOURCE_IMAGES.trends
}, {
  name: "Market Basket",
  domain: "marketbasket.io",
  href: "https://marketbasket.io/",
  image: SOURCE_IMAGES.market
}];
function sourceImage(source: StreamingSource) {
  return source.image;
}
const SourceChip = createComponent<{
  source?: StreamingSource;
}>("SourceChip", ["source"], (__props, __slots) => {
  const source = computed(() => __props.source);
  return () => {
    if (!source.value) return null;
    return <a href={source.value.href} target="_blank" rel="noreferrer" class="ml-0 mr-1 inline-flex h-4.5 translate-y-[-1px] items-center gap-1 rounded-[5px]
        bg-inset pr-[3px] pl-[3px] align-middle font-mono text-[10.5px] text-ink-2 shadow-hairline
        transition-colors duration-150 hover:bg-hover hover:text-ink" style={cssStyle({
      animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both"
    })}>
      <img src={sourceImage(source.value)} alt={""} class="source-avatar size-3 rounded-[3px]" />
      <span>{source.value.domain}</span>
    </a>;
  };
});
const ACTION_ICONS: UI.VNodeChild[] = [<g key="copy"><rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></g>, <path key="retry" d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />, <path key="up" d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />, <path key="down" d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" />];
export type StreamingLabels = {
  /** label on the collapsed sources toggle */
  sources: string;
  /** heading above the follow-up prompts */
  followUps: string;
};
const DEFAULT_LABELS: StreamingLabels = {
  get sources() { return t("streamingText.label10Sources"); },
  get followUps() { return t("streamingText.followUps"); }
};
const StreamingText = createComponent<{
  variant?: string;
  /** the streamed tokens; `cite` tokens render an inline source chip */
  content?: StreamingToken[];
  /** cited sources shown in the chip, avatar stack, and expanded list */
  sources?: StreamingSource[];
  /** follow-up prompt suggestions shown once the stream completes */
  followUps?: string[];
  /** prominent copy strings */
  labels?: Partial<StreamingLabels>;
  /** restart the stream after a hold; turn off when embedding in a real thread */
  loop?: boolean;
  /** fill the parent width instead of the gallery's fixed measure */
  fill?: boolean;
  onDone?: () => void;
  /** fired when a follow-up prompt is chosen */
  onFollowUp?: (text: string, index: number) => void;
}>("StreamingText", ["variant", "content", "sources", "followUps", "labels", "loop", "fill", "onDone", "onFollowUp"], (__props, __slots) => {
  const content = computed(() => __props.content === undefined ? defaultTokens() : __props.content);
  const sources = computed(() => __props.sources === undefined ? SOURCES : __props.sources);
  const followUps = computed(() => __props.followUps === undefined ? defaultFollowUps() : __props.followUps);
  const labels = computed(() => __props.labels);
  const loop = computed(() => __props.loop === undefined ? true : __props.loop);
  const fill = computed(() => __props.fill === undefined ? false : __props.fill);
  const onDone = computed(() => __props.onDone);
  const onFollowUp = computed(() => __props.onFollowUp);
  const l = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const [count, setCount] = createState(0);
  const [sourcesOpen, setSourcesOpen] = createState(false);
  let completed = false;
  // Switching language changes the default token count, not the stream cycle.
  watch(content, (next, previous) => {
    if (__props.content !== undefined) {
      completed = false;
      setCount(0);
      return;
    }
    setCount(completed ? next.length : Math.min(next.length, Math.floor(count.value / Math.max(1, previous.length) * next.length)));
  }, { flush: 'sync' });
  const done = computed(() => count.value >= content.value.length);
  watchLifecycle(() => {
    if (done.value && !loop.value) {
      if (!completed) { completed = true; onDone.value?.(); }
      return;
    }
    if (done.value) completed = true;
    const t = setTimeout(() => {
      if (count.value >= content.value.length) { completed = false; setCount(0); }
      else setCount(c => c + 1);
    }, done.value ? HOLD_MS : WORD_MS);
    return () => clearTimeout(t);
    
  }, () => [count.value, done.value, loop.value]);
  return () => {
    return <div class={fill.value ? "w-full" : "min-h-[15.5rem] w-full max-w-95"}>
      <p class="text-[13px] leading-relaxed text-ink">
        {content.value.slice(0, count.value).map((token, i) => token.cite ? <SourceChip key={i} source={sources.value[0]} /> : <span key={i} class="inline">
              {token.text}{__props.content !== undefined || !locale.value.startsWith('zh') ? " " : ""}</span>)}
        {!done.value && <span class="ml-0.5 inline-block h-3 w-0.5 translate-y-0.5 rounded-full bg-ink" style={cssStyle({
          animation: "fade-in 150ms ease-out both"
        })} />}
      </p>

      {/* action icons row */}
      <div class="mt-2 flex items-center gap-0.5 transition-opacity duration-400" style={cssStyle({
        opacity: done.value ? 1 : 0,
        pointerEvents: done.value ? "auto" : "none"
      })}>
        {ACTION_ICONS.map((icon, i) => <button key={i} type="button" aria-label={t("common.action")} class="flex size-6 items-center justify-center rounded-[6px] text-ink-3
              transition-colors duration-100 hover:bg-hover-2 hover:text-ink-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              {icon}
            </svg>
          </button>)}
        <button type="button" aria-expanded={sourcesOpen.value} onClick={() => setSourcesOpen(current => !current)} class="ml-1.5 flex items-center gap-1.5 rounded-[6px] px-1 py-0.5 text-left transition-colors duration-150 hover:bg-hover">
          <span class="flex -space-x-1">
            {sources.value.map(source => <img key={source.domain} src={sourceImage(source)} alt={""} class="source-avatar size-3.5 rounded-full bg-surface shadow-[0_0_0_1.5px_var(--canvas)]" />)}
          </span>
          <span class="text-[12px] text-ink-2">{l.value.sources}</span>
        </button>
      </div>

      <div class="grid transition-[grid-template-rows,opacity] duration-300" style={cssStyle({
        gridTemplateRows: done.value && sourcesOpen.value ? "1fr" : "0fr",
        opacity: done.value && sourcesOpen.value ? 1 : 0,
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
      })}>
        <div class="overflow-hidden">
          <div class="mt-1.5 flex flex-col rounded-[10px] bg-inset p-1 shadow-hairline">
            {sources.value.map(source => <a key={source.domain} href={source.href} target="_blank" rel="noreferrer" class="flex items-center gap-2 rounded-[6px] px-1.5 py-1 text-[12px] text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink">
                <img src={sourceImage(source)} alt={""} class="source-avatar size-4 rounded-[4px]" />
                <span class="animated-underline">{source.name}</span>
                <span class="ml-auto font-mono text-[10.5px] text-ink-3">{source.domain}</span>
              </a>)}
          </div>
        </div>
      </div>

      {/* follow-ups */}
      <div class="mt-2.5 transition-opacity duration-400" style={cssStyle({
        opacity: done.value ? 1 : 0,
        pointerEvents: done.value ? "auto" : "none"
      })}>
        <p class="text-[12px] font-medium text-ink-2">{l.value.followUps}</p>
        <div class="mt-0.5 flex flex-col">
          {followUps.value.map((text, i) => <button key={text} onClick={() => onFollowUp.value?.(text, i)} class="-mx-1.5 flex items-center gap-2 rounded-[7px] border-b border-line
                px-1.5 py-1.5 text-left text-[12.5px] text-ink transition-colors
                duration-100 hover:bg-hover-2" style={cssStyle(done.value ? {
            animation: `fade-up 350ms cubic-bezier(0.23,1,0.32,1) ${i * 90}ms both`
          } : {
            opacity: 0
          })}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                <path d="M9 10l-5 5 5 5" />
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </svg>
              {text}
            </button>)}
        </div>
      </div>
    </div>;
  };
}, { loop: Boolean, fill: Boolean });
export default StreamingText;
