import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { Liveline, type LivelinePoint, type LivelineSeries } from "@/components/charts/Liveline";
/* ─────────────────────────────────────────────────────────
 * INSIGHT CARDS
 * Embedded mini-visualizations in an "Insights N ‹ ›"
 * carousel. Autoplay yields as soon as a person uses it.
 * ───────────────────────────────────────────────────────── */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const formatPercent = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
const formatMoney = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
/* anchor the snapshot to *call* time (inside each card's mount-time memo) —
 * a module-load constant goes stale, and once the points age past the chart
 * window the canvas renders empty */
function makePoints(values: number[], gap = 6): LivelinePoint[] {
  const end = Math.floor(Date.now() / 1000);
  return values.map((value, index) => ({
    time: end - (values.length - 1 - index) * gap,
    value
  }));
}

/* Catmull-Rom resample — turn a sparse series into a dense, smoothly curved
 * one so both the line and the hover cursor glide instead of stepping between
 * a handful of points. */
function smooth(values: number[], perSegment = 9): number[] {
  if (values.length < 3) return values.slice();
  const out: number[] = [];
  const n = values.length;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = values[Math.max(0, i - 1)];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = values[Math.min(n - 1, i + 2)];
    for (let s = 0; s < perSegment; s += 1) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3));
    }
  }
  out.push(values[n - 1]);
  return out;
}

/* dense, smoothed points spanning exactly `spanSecs` — keeps the chart window
 * unchanged while multiplying the resolution. */
function smoothPoints(values: number[], spanSecs: number): LivelinePoint[] {
  const dense = smooth(values);
  return makePoints(dense, spanSecs / (dense.length - 1));
}
function useDarkMode() {
  const [dark, setDark] = createState(false);
  watchLifecycle(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"]
    });
    return () => observer.disconnect();
  }, () => []);
  return computed(() => {
    return dark.value;
  });
}

/* inline @entity mention */
const Entity = createComponent<{
  name: string;
  tone: string;
}>("Entity", ["name", "tone"], (__props, __slots) => {
  const name = computed(() => __props.name);
  const tone = computed(() => __props.tone);
  return () => {
    return <span class="inline-flex items-center gap-1 align-baseline font-medium text-ink">
      <span class={`inline-block size-2.5 rounded-full ${tone.value}`} />
      {"@"}{name.value}
    </span>;
  };
});
const Mono = createComponent<{
  children: UI.VNodeChild;
  tone: "red" | "green";
}>("Mono", ["children", "tone"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const tone = computed(() => __props.tone);
  return () => {
    return <code class={`font-mono text-[11.5px] ${tone.value === "red" ? "text-red" : "text-green"}`}>
      {children.value}
    </code>;
  };
});
function chartIndexFromPointer(event: UI.PointerEvent<HTMLDivElement>, pointCount: number) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  return Math.round(progress * (pointCount - 1));
}
const ChartTooltip = createComponent<{
  rows: {
    label: string;
    value: string;
    color: string;
  }[];
}>("ChartTooltip", ["rows"], (__props, __slots) => {
  const rows = computed(() => __props.rows);
  return () => {
    return <div class="insight-chart-tooltip">
      {rows.value.map(row => <span key={row.label} class="insight-chart-tooltip-item">
          <span class="insight-chart-tooltip-dot" style={cssStyle({
          background: row.color
        })} />
          {row.value}
        </span>)}
    </div>;
  };
});
/* content shape for the return-comparison card's two plotted series */
export type CompareSeries = {
  name: string;
  values: number[];
  sub: string;
  tone: "red" | "green";
  dot: string;
  color: string;
  tooltipColor: string;
};
const COMPARE_SERIES: (CompareSeries & { displayName: string })[] = [{
  name: "Mint Chip",
  get displayName() { return t("common.mintChip"); },
  values: [-2.9, -3.4, -3.05, -3.86, -3.52, -4.1, -3.82, -4.41],
  sub: "-$2,377.66",
  tone: "red",
  dot: "bg-orange",
  color: "#f68f3c",
  tooltipColor: "var(--orange)"
}, {
  name: "Pistachio",
  get displayName() { return t("common.pistachio"); },
  values: [0.22, 0.58, 0.42, 0.91, 0.76, 1.08, 0.96, 1.15],
  sub: "+$617.22",
  tone: "green",
  dot: "bg-accent",
  color: "#3d9aff",
  tooltipColor: "var(--accent)"
}];

/* 1 — return comparison: 2 series, legend + big deltas + line chart */
const CompareCard = createComponent<{
  series?: CompareSeries[];
}>("CompareCard", ["series"], (__props, __slots) => {
  const series = computed(() => __props.series === undefined ? COMPARE_SERIES : __props.series);
  const dark = useDarkMode();
  const [hoverIndex, setHoverIndex] = createState<number | null>(null);
  const points = computed(() => series.value.map(s => smoothPoints(s.values, 42)));
  const pointCount = computed(() => points.value[0]?.length ?? 0);
  const chartSeries: ComputedRef<LivelineSeries[]> = computed(() => series.value.map((s, i) => ({
    id: s.name,
    label: "",
    data: points.value[i],
    value: points.value[i].at(-1)?.value ?? s.values.at(-1) ?? 0,
    color: s.color
  })));
  return () => {
    return <div class="min-h-[278px] rounded-card bg-surface p-3 shadow-hairline">
      <div class="flex items-center gap-4">
        {series.value.map((s, i) => <div key={s.name} class="flex-1">
            <span class="flex items-center gap-1.5 text-[11.5px] text-ink-2">
              <span class={`size-2 rounded-full ${s.dot}`} />
              {__props.series === undefined ? COMPARE_SERIES.find(item => item.name === s.name)?.displayName ?? s.name : s.name}
            </span>
            <span class={`block text-[17px] font-semibold tracking-[-0.01em] tabular-nums ${s.tone === "red" ? "text-red" : "text-green"}`}>
              {formatPercent(points.value[i].at(-1)?.value ?? s.values.at(-1) ?? 0)}
            </span>
            <Mono tone={s.tone}>{s.sub}</Mono>
          </div>)}
      </div>
      <div class="mt-2 overflow-hidden rounded-control bg-inset shadow-hairline">
        <div class="flex items-center justify-between border-b border-line px-2.5 py-1.5">
          <span class="text-[11px] text-ink-3 tabular-nums">
            {t("insightCards.trendSnapshot")}</span>
          <span class="rounded-full bg-field px-2 py-0.5 text-[10.5px] font-medium text-ink-2">
            {t("insightCards.snapshot")}</span>
        </div>
        <div class="insight-chart-stage relative h-[166px]" onPointerdown={event => setHoverIndex(chartIndexFromPointer(event, pointCount.value))} onPointermove={event => setHoverIndex(chartIndexFromPointer(event, pointCount.value))} onPointerleave={() => setHoverIndex(null)} onPointercancel={() => setHoverIndex(null)} onPointerup={() => setHoverIndex(null)}>
          <Liveline data={[]} value={0} series={chartSeries.value} theme={dark.value ? "dark" : "light"} grid={false} pulse={false} window={42} paused scrub={false} cursor="default" lineWidth={2.25} padding={{
            top: 40,
            right: 0,
            bottom: 22,
            left: 0
          }} formatValue={formatPercent} />
          {hoverIndex.value! !== null && <>
            <span class="insight-chart-cursor" style={cssStyle({
              left: `${hoverIndex.value! / (pointCount.value - 1) * 100}%`
            })} />
            <span class="insight-chart-tooltip-anchor" style={cssStyle({
              left: `${Math.min(Math.max(hoverIndex.value! / (pointCount.value - 1) * 100, 28), 72)}%`
            })}>
              <ChartTooltip rows={series.value.map((s, i) => ({
                label: s.name,
                value: formatPercent(points.value[i][hoverIndex.value!].value),
                color: s.tooltipColor
              }))} />
            </span>
          </>}
        </div>
      </div>
    </div>;
  };
});
/* content shape for the anomaly card's two toggled metric series */
export type AnomalyData = {
  spend: number[];
  usage: number[];
};
const ANOMALY_DATA: AnomalyData = {
  spend: [274, 289, 264, 307, 331, 1210, 1718, 2112],
  usage: [18, 19, 17, 21, 22, 58, 81, 96]
};

/* 2 — anomaly: bars with threshold + big spent value */
const AnomalyCard = createComponent<{
  data?: AnomalyData;
}>("AnomalyCard", ["data"], (__props, __slots) => {
  const anomaly = computed(() => __props.data === undefined ? ANOMALY_DATA : __props.data);
  const dark = useDarkMode();
  const [metric, setMetric] = createState<"spend" | "usage">("spend");
  const [hoverIndex, setHoverIndex] = createState<number | null>(null);
  const spend = computed(() => makePoints(anomaly.value.spend, 7));
  const usage = computed(() => makePoints(anomaly.value.usage, 7));
  const data = computed(() => metric.value === "spend" ? spend.value : usage.value);
  const value = computed(() => data.value.at(-1)?.value ?? (metric.value === "spend" ? 2112 : 96));
  const threshold = computed(() => metric.value === "spend" ? "$2,112" : "82 kWh");
  const moneyLabel = computed(() => formatMoney(spend.value.at(-1)?.value ?? 2112));
  return () => {
    return <div class="min-h-[278px] rounded-card bg-surface p-3 shadow-hairline">
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-1.5 text-[12px] font-medium text-ink">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          {t("insightCards.highFreezerSpend")}</span>
        <span class="rounded-full bg-field px-2 py-0.5 text-[10.5px] font-medium text-ink-2">
          {t("insightCards.snapshot")}</span>
      </div>
      <div class="mt-2 overflow-hidden rounded-control bg-inset shadow-hairline">
        <div class="flex items-center justify-between border-b border-line px-2.5 py-1.5">
          <span class="text-[11px] text-ink-3 tabular-nums">
            {hoverIndex.value !== null ? metric.value === "spend" ? formatMoney(data.value[hoverIndex.value].value) : `${Math.round(data.value[hoverIndex.value].value)} kWh` : t("insightCards.label0Threshold", [threshold.value])}
          </span>
          <span class="flex rounded-full bg-field p-0.5">
            {(["spend", "usage"] as const).map(item => <button key={item} type="button" aria-pressed={metric.value === item} onClick={() => setMetric(item)} class={`rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.96] ${metric.value === item ? "bg-surface text-ink shadow-btn" : "text-ink-3 hover:text-ink-2"}`}>
                {item === "spend" ? t("insightCards.spend") : t("insightCards.usage")}
              </button>)}
          </span>
        </div>
        <div class="insight-chart-stage relative h-[166px]" onPointerdown={event => setHoverIndex(chartIndexFromPointer(event, data.value.length))} onPointermove={event => setHoverIndex(chartIndexFromPointer(event, data.value.length))} onPointerleave={() => setHoverIndex(null)} onPointercancel={() => setHoverIndex(null)} onPointerup={() => setHoverIndex(null)}>
          <Liveline data={data.value} value={value.value} theme={dark.value ? "dark" : "light"} color="#ee5c61" grid scrub={false} fill={false} pulse={false} momentum={false} paused window={49} lineWidth={2.25} cursor="crosshair" padding={{
            top: 34,
            right: 0,
            bottom: 22,
            left: 0
          }} formatValue={v => metric.value === "spend" ? formatMoney(v) : `${Math.round(v)} kWh`} />
          {hoverIndex.value! !== null && <>
            <span class="insight-chart-cursor" style={cssStyle({
              left: `${hoverIndex.value! / (data.value.length - 1) * 100}%`
            })} />
            <span class="insight-chart-tooltip-anchor" style={cssStyle({
              left: `${Math.min(Math.max(hoverIndex.value! / (data.value.length - 1) * 100, 28), 72)}%`
            })}>
              <ChartTooltip rows={[{
                label: metric.value === "spend" ? t("insightCards.spend") : t("insightCards.usage"),
                value: metric.value === "spend" ? formatMoney(data.value[hoverIndex.value!].value) : `${Math.round(data.value[hoverIndex.value!].value)} kWh`,
                color: "var(--red)"
              }]} />
            </span>
          </>}
        </div>
      </div>
      <div class="mt-1.5 flex items-baseline gap-2">
        <span class="text-[17px] font-semibold tracking-[-0.01em] text-ink tabular-nums">
          {moneyLabel.value}{(" " + t("insightCards.spent"))}</span>
        <Mono tone="red">{"+$1,834.66"}</Mono>
        <span class="text-[11px] text-ink-3">{t("insightCards.vs3Months")}</span>
      </div>
    </div>;
  };
});
/* content shape for one allocation segment */
export type AllocationSegment = {
  name: string;
  label: string;
  pct: number;
  amount: string;
  cls: string;
  tone: string;
};
const ALLOCATION_SEGMENTS: AllocationSegment[] = [{
  name: "VAN",
  get label() { return t("insightCards.vanilla"); },
  pct: 72.5,
  amount: "$51,785",
  cls: "bg-orange",
  tone: "text-orange"
}, {
  name: "CHOC",
  get label() { return t("insightCards.chocolate"); },
  pct: 22.8,
  amount: "$16,278",
  cls: "bg-line-strong",
  tone: "text-ink-2"
}, {
  name: "MINT",
  get label() { return t("insightCards.mint"); },
  pct: 4.7,
  amount: "$3,357",
  cls: "bg-line",
  tone: "text-ink-3"
}];

/* 3 — allocation: hero number + segmented bar + legend */
const AllocationCard = createComponent<{
  segments?: AllocationSegment[];
}>("AllocationCard", ["segments"], (__props, __slots) => {
  const segments = computed(() => __props.segments === undefined ? ALLOCATION_SEGMENTS : __props.segments);
  const [selected, setSelected] = createState(segments.value[0].name);
  const active = computed(() => segments.value.find(segment => segment.name === selected.value) ?? segments.value[0]);
  return () => {
    return <div class="min-h-[278px] rounded-card bg-surface p-3 shadow-hairline">
      <span class="flex items-center gap-1.5 text-[12px] font-medium text-ink">
        <span class="flex size-3.5 items-center justify-center rounded-full bg-orange text-[8px] font-bold text-white">
          {"V"}</span>
        {t("insightCards.vanillaAllocation")}</span>
      <span class="mt-1 block text-[20px] font-semibold tracking-[-0.01em] text-ink tabular-nums">
        {active.value.amount}
      </span>
      <div class="mt-3 flex h-9 gap-0.5 overflow-hidden rounded-full bg-field p-0.5" role="group" aria-label={t("insightCards.allocationSegments")}>
        {segments.value.map(s => <button key={s.name} type="button" aria-pressed={selected.value === s.name} aria-label={`${s.label}: ${s.pct}%`} onClick={() => setSelected(s.name)} class={`relative h-full overflow-hidden rounded-full ${s.cls} transition-[opacity,transform,box-shadow] duration-300 active:scale-[0.98]`} style={cssStyle({
          width: `${s.pct}%`,
          opacity: selected.value === s.name ? 1 : 0.58,
          boxShadow: selected.value === s.name ? "inset 0 0 0 1px rgba(255,255,255,0.22)" : undefined,
          transitionTimingFunction: EASE
        })}>
            <span class="absolute inset-y-1 left-1 rounded-full bg-white/20 transition-[width,opacity] duration-500" style={cssStyle({
            width: selected.value === s.name ? "calc(100% - 8px)" : "0%",
            opacity: selected.value === s.name ? 1 : 0,
            transitionTimingFunction: EASE
          })} />
          </button>)}
      </div>
      <div class="mt-2 flex items-center gap-1.5">
        {segments.value.map(s => <button key={s.name} type="button" aria-pressed={selected.value === s.name} onClick={() => setSelected(s.name)} class={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${selected.value === s.name ? "bg-field text-ink" : "text-ink-2 hover:bg-hover hover:text-ink"}`}>
            <span class={`size-1.5 rounded-full ${s.cls}`} />
            {s.name} <span class="tabular-nums">{s.pct}{"%"}</span>
          </button>)}
      </div>
      <div class="mt-3 min-h-16 rounded-control bg-inset px-2.5 py-2 shadow-hairline">
        <span class={`block text-[11.5px] font-medium ${active.value.tone}`}>{active.value.label}</span>
        <span class="mt-1 block text-[11px] leading-relaxed text-ink-3">
          {t("insightCards.contributionSnapshotAcrossCurrentInventoryValueSegmentSelectionChanges")}</span>
      </div>
    </div>;
  };
});
/* content shape for one insight page in the carousel */
export type InsightPage = {
  key: string;
  prose: UI.VNodeChild;
  Card: UI.ComponentType;
  pill: string;
};
function defaultPages(): InsightPage[] { return [{
  key: "compare",
  prose: <>
        {(t("insightCards.theWorstPerformerInYour") + " ")}<Entity name={t("insightCards.creamery")} tone="bg-orange" />{(" " + t("insightCards.isRockyRoadDown") + " ")}<Mono tone="red">{"-6%"}</Mono>{(" " + t("insightCards.or") + " ")}<Mono tone="red">{"-$2,453.44"}</Mono>{"."}</>,
  Card: CompareCard,
  get pill() { return t("insightCards.shouldIRebalanceFlavors"); }
}, {
  key: "anomaly",
  prose: <>
        {(t("insightCards.unusuallyHighFreezerBillOn") + " ")}<span class="font-medium text-ink">{t("insightCards.dec13")}</span> {" —"}{" "}
        <Mono tone="red">{"+$1,834.66"}</Mono>{(" " + t("insightCards.aboveYourAverage"))}</>,
  Card: AnomalyCard,
  get pill() { return t("insightCards.getTipsOnCuttingFreezerCosts"); }
}, {
  key: "allocation",
  prose: <>
        {(t("insightCards.youReHeavilyInvestedIn") + " ")}<Entity name={t("insightCards.vanilla")} tone="bg-orange" />{(" " + t("insightCards.itS"))}{" "}
        <span class="font-medium text-ink">{"72.5%"}</span>{(" " + t("insightCards.ofYourCase"))}</>,
  Card: AllocationCard,
  get pill() { return t("insightCards.ifWeLookAtSeasonalsWhatChanges"); }
}]; }
export type InsightCardsLabels = {
  /** carousel heading shown before the page count */
  title: string;
};
const DEFAULT_INSIGHT_LABELS: InsightCardsLabels = {
  get title() { return t("insightCards.insights"); }
};
const InsightCards = createComponent<{
  variant?: string;
  pages?: InsightPage[];
  labels?: Partial<InsightCardsLabels>;
}>("InsightCards", ["variant", "pages", "labels"], (__props, __slots) => {
  const pages = computed(() => __props.pages === undefined ? defaultPages() : __props.pages);
  const labels = computed(() => __props.labels);
  const l = computed(() => ({
    ...DEFAULT_INSIGHT_LABELS,
    ...labels.value
  }));
  const [page, setPage] = createState(0);
  const move = (direction: -1 | 1) => {
    setPage(current => (current + direction + pages.value.length) % pages.value.length);
  };
  const prose = computed(() => pages.value[page.value].prose),
    Card = computed(() => pages.value[page.value].Card),
    pill = computed(() => pages.value[page.value].pill);
  return () => {
    return <div class="min-h-[408px] w-full max-w-86">
      {/* pager header */}
      <div class="flex items-center justify-between">
        <span class="flex items-baseline gap-1.5">
          <span class="text-[13px] font-semibold text-ink">{l.value.title}</span>
          <span class="text-[13px] text-ink-3 tabular-nums">{pages.value.length}</span>
        </span>
        <span class="flex items-center gap-0.5">
          {(["M15 18l-6-6 6-6", "M9 6l6 6-6 6"] as const).map((d, i) => <button key={i} aria-label={i === 0 ? t("insightCards.previousInsight") : t("insightCards.nextInsight")} onClick={() => move(i === 0 ? -1 : 1)} class="flex size-6 items-center justify-center rounded-[6px] text-ink-3
                transition-[background-color,color,transform] duration-100 hover:bg-hover
                hover:text-ink active:scale-[0.96]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d={d} />
              </svg>
            </button>)}
        </span>
      </div>

      {/* page content — blurred crossfade */}
      <div class="transition-[opacity,filter] duration-250" style={cssStyle({
        opacity: 1,
        filter: "blur(0)"
      })}>
        <p class="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{prose.value}</p>
        <div class="mt-2">
          <Card.value />
        </div>
        <button class="mt-2 rounded-full bg-surface px-3 py-1.5 text-left text-[12px] text-ink
            shadow-btn transition-colors duration-100 hover:bg-hover">
          {pill.value}
        </button>
      </div>
    </div>;
  };
});
export default InsightCards;
