import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * LOADING STATE — pixel-grid loader for long-running work
 *
 * Variants:
 *   Drive  — square cells, chevron wavefront driving right;
 *            the 650ms cycle is shorter than the sweep, so
 *            two fronts are always in flight
 *   Dots   — same wavefront, circular cells
 *   Orbit  — a comet lapping the grid perimeter
 *   Surfer — the Drive loader paired with a meme video below
 *
 * Paired with a shimmering label and a live elapsed timer
 * in mono tabular figures. Reduced motion freezes the grid
 * to its dim state; the timer still ticks.
 * ───────────────────────────────────────────────────────── */

const chevron = Array.from({
  length: 9
}, (_, i) => {
  const r = Math.floor(i / 3),
    c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});
const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({
  length: 9
}, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});
const PATTERNS: Record<string, {
  delays: (number | null)[];
  dur: number;
  round: boolean;
}> = {
  Drive: {
    delays: chevron,
    dur: 650,
    round: false
  },
  Dots: {
    delays: chevron,
    dur: 650,
    round: true
  },
  Orbit: {
    delays: orbit,
    dur: 950,
    round: false
  }
};
const LoaderGrid = createComponent<{
  delays: (number | null)[];
  dur: number;
  round: boolean;
}>("LoaderGrid", ["delays", "dur", "round"], (__props, __slots) => {
  const delays = computed(() => __props.delays);
  const dur = computed(() => __props.dur);
  const round = computed(() => __props.round);
  return () => {
    return <span aria-hidden class="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.value.map((delay, index) => <span key={index} class={`size-[4px] bg-ink ${round.value ? "rounded-full" : "rounded-[1px]"}`} style={cssStyle({
        opacity: delay === null ? 0.07 : 0.15,
        animation: delay === null ? "none" : `pixel-on ${dur.value}ms ease-in-out ${delay}ms infinite`
      })} />)}
    </span>;
  };
});
function useElapsed() {
  const [ds, setDs] = createState(0);
  watchLifecycle(() => {
    const t = setInterval(() => setDs(d => d + 1), 100);
    return () => clearInterval(t);
  }, () => []);
  const total = computed(() => ds.value / 10);
  return computed(() => {
    if (total.value < 60) return t("loadingState.label0S", [total.value.toFixed(1)]);
    return t("loadingState.label0M1S", [Math.floor(total.value / 60), (total.value % 60).toFixed(1)]);
  });
}
const LoadingState = createComponent<{
  label?: string;
  variant?: string;
  videoSrc?: string;
}>("LoadingState", ["label", "variant", "videoSrc"], (__props, __slots) => {
  const label = computed(() => __props.label);
  const variant = computed(() => __props.variant === undefined ? "Drive" : __props.variant);
  const videoSrc = computed(() => __props.videoSrc === undefined ? "https://95dnc2a95qgwt9ff.public.blob.vercel-storage.com/subway-surfers-min.mp4" : __props.videoSrc);
  const elapsed = useElapsed();
  const surfer = computed(() => variant.value === "Surfer");
  const resolvedLabel = computed(() => label.value ?? (surfer.value ? t("common.subwaySurfing") : t("loadingState.churning")));
  const [videoOk, setVideoOk] = createState(true);
  const delays = computed(() => (PATTERNS[variant.value] ?? PATTERNS.Drive).delays),
    dur = computed(() => (PATTERNS[variant.value] ?? PATTERNS.Drive).dur),
    round = computed(() => (PATTERNS[variant.value] ?? PATTERNS.Drive).round);
  const labelEl = computed(() => <span class="bg-clip-text text-[13px] font-medium text-transparent" style={cssStyle({
    backgroundImage: "linear-gradient(90deg, var(--ink-3) 35%, var(--ink) 50%, var(--ink-3) 65%)",
    backgroundSize: "200% 100%",
    animation: "shimmer-text 1.4s linear infinite"
  })}>
      {resolvedLabel.value}
    </span>);
  const elapsedEl = computed(() => <span class="font-mono text-[12px] text-ink-3 tabular-nums">{elapsed.value}</span>);
  return () => {
    if (surfer.value) {
      return <div role="status" class="flex w-fit flex-col items-start">
        <div class="flex items-center gap-2.5">
          <LoaderGrid {...PATTERNS.Drive} />
          {labelEl.value}
          {elapsedEl.value}
        </div>

        {/* the context card follows the status text it is illustrating */}
        <div class="mt-2 w-56 overflow-hidden rounded-[10px] shadow-overlay" style={cssStyle({
          animation: "pop-in 200ms cubic-bezier(0.16,1,0.3,1) both",
          transformOrigin: "top left"
        })}>
          <div class="relative aspect-video w-full" style={cssStyle({
            background: "var(--tooltip-bg)"
          })}>
            {videoOk.value ? <video src={videoSrc.value} autoplay muted loop playsinline onError={() => setVideoOk(false)} class="h-full w-full object-cover" /> : <div class="flex h-full w-full flex-col items-center justify-center gap-1.5">
                <LoaderGrid {...PATTERNS.Drive} />
                <span class="px-3 text-center font-mono text-[10px]" style={cssStyle({
                color: "var(--tooltip-muted)"
              })}>
                  {t("loadingState.videoUnavailable")}</span>
              </div>}
          </div>
        </div>
      </div>;
    }
    return <div role="status" class="flex w-fit items-center gap-2.5">
      <LoaderGrid delays={delays.value} dur={dur.value} round={round.value} />
      {labelEl.value}
      {elapsedEl.value}
    </div>;
  };
});
export default LoadingState;
