import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { VNodeChild } from '@/lib/dom-types';

/* ─────────────────────────────────────────────────────────
 * THINKING — expandable agent trace, four variants
 *
 *   Steps      step list with spinner → muted checks
 *   Reasoning  prose reasoning that expands, then settles
 *   Search     web-search trace: query + sources read
 *   Coding     tool trace: files read, edits, commands
 *
 * The trace runs once, settles, and remains expandable.
 * ───────────────────────────────────────────────────────── */

const STAGES = [800, 600, 1800, 2600, 1600];
function useSequence(steps: number[]) {
  const [stage, setStage] = createState(0);
  watchLifecycle(() => {
    if (stage.value >= steps.length - 1) return;
    const t = setTimeout(() => setStage(s => s + 1), steps[stage.value]);
    return () => clearTimeout(t);
  }, () => [stage.value, steps]);
  return computed(() => {
    return stage.value;
  });
}
type Row = {
  primary: string;
  secondary?: string;
  mono?: boolean;
  add?: number;
  del?: number;
  href?: string;
};
const VARIANTS: Record<string, {
  active: string;
  done: string;
  rows: Row[];
  query?: string;
}> = {
  Steps: {
    get active() { return t("common.thinking"); },
    get done() { return t("thinkingState.thoughtFor4Seconds"); },
    rows: [{
      get primary() { return t("thinkingState.readingFlavorBriefs"); }
    }, {
      get primary() { return t("thinkingState.scanningSupplierLists"); }
    }, {
      get primary() { return t("thinkingState.comparingTastingNotes"); },
      get secondary() { return t("thinkingState.label6Flavors"); }
    }, {
      get primary() { return t("thinkingState.writingTheScoopReport"); }
    }]
  },
  Reasoning: {
    get active() { return t("common.thinking"); },
    get done() { return t("thinkingState.thoughtFor4Seconds"); },
    rows: [{
      get primary() { return t("thinkingState.summerDemandSpikesForStoneFruitFlavorsPeachAnd"); }
    }, {
      get primary() { return t("thinkingState.iShouldCheckConeInventoryBeforePromotingAWaffle"); }
    }]
  },
  Search: {
    get active() { return t("thinkingState.searchingTheWeb"); },
    get done() { return t("thinkingState.searchedTheWeb"); },
    get query() { return t("thinkingState.bestWaffleConeSupplier"); },
    rows: [{
      primary: "Joy Cone",
      secondary: "joycone.com",
      href: "https://joycone.com/fs_products/waffle-cones/"
    }, {
      primary: "WebstaurantStore",
      secondary: "webstaurantstore.com",
      href: "https://www.webstaurantstore.com/ice-cream-shop-supplies.html"
    }, {
      primary: "The Konery",
      secondary: "thekonery.com",
      href: "https://www.thekonery.com/"
    }]
  },
  Coding: {
    get active() { return t("thinkingState.runningTools"); },
    get done() { return t("thinkingState.ran3Tools"); },
    rows: [{
      get primary() { return t("thinkingState.read"); },
      secondary: "flavors.ts",
      mono: true
    }, {
      get primary() { return t("thinkingState.edit"); },
      secondary: "ChurnSchedule.tsx",
      mono: true,
      add: 74,
      del: 41
    }, {
      get primary() { return t("thinkingState.run"); },
      secondary: "npm run freeze",
      mono: true
    }]
  }
};
const Dot = createComponent<{
  tone: string;
}>("Dot", ["tone"], (__props, __slots) => {
  const tone = computed(() => __props.tone);
  return () => {
    return <span class={`flex size-3.5 shrink-0 items-center justify-center rounded-full text-white ${tone.value}`}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.5 12h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    </span>;
  };
});
const TONES = ["bg-accent", "bg-orange", "bg-green"];
const ThinkingState = createComponent<{
  variant?: string;
  onSettled?: () => void;
  /** override the built-in trace content (keeps the primitive reusable) */
  rows?: Row[];
  active?: string;
  done?: string;
  /** override the header glyph (defaults to the sparkle) */
  icon?: VNodeChild;
}>("ThinkingState", ["variant", "onSettled", "rows", "active", "done", "icon"], (__props, __slots) => {
  const variant = computed(() => __props.variant === undefined ? "Steps" : __props.variant);
  const onSettled = computed(() => __props.onSettled);
  const rows = computed(() => __props.rows);
  const active = computed(() => __props.active);
  const done = computed(() => __props.done);
  const icon = computed(() => __props.icon);
  const stage = useSequence(STAGES);
  const [manualExpanded, setManualExpanded] = createState<boolean | null>(null);
  const [selectedTool, setSelectedTool] = createState<string | null>(null);
  const base = computed(() => VARIANTS[variant.value] ?? VARIANTS.Steps);
  const v = computed(() => ({
    ...base.value,
    rows: rows.value ?? base.value.rows,
    active: active.value ?? base.value.active,
    done: done.value ?? base.value.done
  }));
  const autoExpanded = computed(() => stage.value >= 1 && stage.value < 4);
  const expanded = computed(() => manualExpanded.value ?? autoExpanded.value);
  const working = computed(() => stage.value < 3);
  const visible = computed(() => stage.value < 2 ? 0 : stage.value === 2 ? Math.min(2, v.value.rows.length) : v.value.rows.length);
  const traceRef = templateRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = createState(0);
  watchLifecycle(() => {
    if (traceRef.value) setLineHeight(traceRef.value.offsetHeight);
  }, () => [visible.value, expanded.value, variant.value, stage.value]);

  /* let embedders sequence content after the trace settles */
  const settledRef = templateRef(false);
  watchLifecycle(() => {
    if (working.value || settledRef.value) return;
    settledRef.value = true;
    onSettled.value?.();
  }, () => [working.value, onSettled.value]);
  return () => {
    return <div key={variant.value} class="flex w-full max-w-95 flex-col" style={cssStyle({
      minHeight: working.value || expanded.value ? 176 : undefined,
      transition: "min-height 400ms cubic-bezier(0.23,1,0.32,1)"
    })}>
      {/* header — shared across variants */}
      <button type="button" aria-expanded={expanded.value} onClick={() => setManualExpanded(current => !(current ?? autoExpanded.value))} class="-mx-1.5 flex w-fit items-center gap-2 rounded-control px-1.5 py-1
          transition-colors duration-100 hover:bg-hover-2">
        {icon.value ? <span class="flex shrink-0 transition-colors duration-200" style={cssStyle({
          color: working.value ? "var(--ink-2)" : "var(--ink-3)"
        })}>
            {icon.value}
          </span> : <svg width="16" height="16" viewBox="0 0 24 24" fill={working.value ? "var(--ink-2)" : "var(--ink-3)"}>
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
          </svg>}
        <span role="status" class="contents">
          {working.value ? <span class="bg-clip-text text-[13px] font-medium whitespace-nowrap text-transparent" style={cssStyle({
            backgroundImage: "linear-gradient(90deg, var(--ink-3) 35%, var(--ink) 50%, var(--ink-3) 65%)",
            backgroundSize: "200% 100%",
            animation: "shimmer-text 1.4s linear infinite"
          })}>
              {v.value.active}
            </span> : <span class="text-[13px] font-medium whitespace-nowrap text-ink-2" style={cssStyle({
            animation: "fade-in 350ms ease-out both"
          })}>
              {v.value.done}
            </span>}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300" style={cssStyle({
          transform: expanded.value ? "rotate(180deg)" : "rotate(0)"
        })}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* expandable trace */}
      <div class="grid transition-[grid-template-rows,opacity] duration-400" style={cssStyle({
        gridTemplateRows: expanded.value ? "1fr" : "0fr",
        opacity: expanded.value ? 1 : 0,
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
      })}>
        <div class="overflow-hidden">
          <div class="relative mt-1 ml-[5px] pl-4">
            <span aria-hidden class="absolute left-[3px] w-px bg-line" style={cssStyle({
              top: -8,
              height: lineHeight.value ? lineHeight.value - 2 : 0,
              transition: "height 500ms cubic-bezier(0.23,1,0.32,1)"
            })} />
            <div ref={traceRef} class="flex flex-col gap-1 py-1">
            {v.value.query && <div class="flex h-6 items-center gap-2 px-1.5" style={cssStyle({
                animation: expanded.value ? "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" : undefined
              })}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" class="shrink-0">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <span class="text-[12.5px] text-ink-2">{v.value.query}</span>
              </div>}
            {v.value.rows.slice(0, visible.value).map((row, i) => {
                const content = <>
                {variant.value === "Search" && <Dot tone={TONES[i % 3]} />}
                {variant.value === "Steps" && (i < visible.value - 1 || !working.value ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg> : <span class="size-3 shrink-0 rounded-full border-[1.5px] border-line-strong border-t-ink-2" style={cssStyle({
                    animation: "spin 700ms linear infinite"
                  })} />)}
                <span class={`min-w-0 truncate text-[12.5px] ${variant.value === "Reasoning" ? "whitespace-normal leading-relaxed text-ink-2" : "font-medium text-ink"} ${variant.value === "Search" ? "animated-underline" : ""}`}>
                  {row.primary}
                </span>
                {row.secondary && <span class={`shrink-0 text-[11.5px] text-ink-3 ${row.mono ? "font-mono" : ""}`}>
                    {row.secondary}
                  </span>}
                {row.add !== undefined && <span class="shrink-0 font-mono text-[11px] tabular-nums">
                    <span class="text-green">{"+"}{row.add}</span>{" "}
                    <span class="text-red">{"−"}{row.del}</span>
                  </span>}
                </>;
                const rowClass = "flex min-h-7 w-full items-center gap-2 rounded-[6px] px-1.5 py-0.5 text-left";
                const animation = {
                  animation: `fade-up 320ms cubic-bezier(0.23,1,0.32,1) ${i * 120}ms both`
                };
                if (variant.value === "Search") {
                  return <a key={row.primary} href={row.href} target="_blank" rel="noreferrer" class={`${rowClass} transition-colors duration-150 hover:bg-hover`} style={cssStyle(animation)}>
                    {content}
                  </a>;
                }
                if (variant.value === "Coding") {
                  const selected = selectedTool.value === row.primary;
                  return <button key={row.primary} type="button" aria-pressed={selected} onClick={() => setSelectedTool(selected ? null : row.primary)} class={`${rowClass} transition-colors duration-150 ${selected ? "bg-inset" : "hover:bg-hover"}`} style={cssStyle(animation)}>
                    {content}
                  </button>;
                }
                return <div key={row.primary} class={rowClass} style={cssStyle(animation)}>
                  {content}
                </div>;
              })}
            {variant.value === "Search" && stage.value >= 3 && <span class="text-[12px] text-ink-3" style={cssStyle({
                animation: "fade-in 300ms ease-out both"
              })}>
                {t("thinkingState.label7More")}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>;
  };
});
export default ThinkingState;
