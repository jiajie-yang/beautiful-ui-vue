// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { Button } from "@/components/atoms/Button";

/* ─────────────────────────────────────────────────────────
 * AGENT SCREEN (live viewer)
 * Watch an agent work. The resting card is a framed capture of
 * the agent's screen; hover reveals an "Open" pill (the blue
 * accent Button). Open expands to a full-width viewer where you
 * can "Teach a task" — which starts recording — collapse
 * (recording keeps running, the card shows a red REC badge), and
 * end it.
 *
 * The screen is a placeholder image by default; pass a `streamSrc`
 * (image or video URL) to pipe in a real stream.
 * ───────────────────────────────────────────────────────── */

/* Served as a static asset from /public (not Vercel Blob) so it doesn't incur
 * Blob data-transfer charges, and pre-optimized to a ~120 KB WebP (from a
 * 2.5 MB PNG) since it loads on every gallery/harness view. */
const PLACEHOLDER = "/agent-desktop.webp";

/* aspect ratio of the placeholder capture (2964×1856) — used so the collapsed
 * card shows the whole desktop with no crop */
const SCREEN_ASPECT = "aspect-[2964/1856]";
const Ico = createComponent<{
  path: UI.VNodeChild;
  size?: number;
  sw?: number;
}>("Ico", ["path", "size", "sw"], (__props, __slots) => {
  const path = computed(() => __props.path);
  const size = computed(() => __props.size === undefined ? 15 : __props.size);
  const sw = computed(() => __props.sw === undefined ? 2 : __props.sw);
  return () => {
    return <svg width={size.value} height={size.value} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={sw.value} stroke-linecap="round" stroke-linejoin="round" aria-hidden>
      {path.value}
    </svg>;
  };
});
/* minimize-2 — two arrows converging to the middle (collapse) */
const collapseIcon = <>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </>;

/* maximize-2 — two arrows out to opposite corners (open) */
const openIcon = <>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </>;
function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* macOS-style pointer */
const CursorSvg = createComponent<{
  className?: string;
  style?: UI.CSSProperties;
}>("CursorSvg", ["className", "style"], (__props, __slots) => {
  const className = computed(() => __props.className);
  const style = computed(() => __props.style);
  return () => {
    return <svg class={className.value} style={cssStyle(style.value)} width="30" height="30" viewBox="0 0 24 24" fill="#111318" stroke="#fff" stroke-width="1.4" stroke-linejoin="round" aria-hidden>
      <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
    </svg>;
  };
});
/* collapsed card: a static decorative cursor sitting on the capture */
const DriftCursor = createComponent<Record<string, never>>("DriftCursor", [], (__props, __slots) => {
  return () => {
    return <CursorSvg className="agent-cursor" style={{
      left: "42%",
      top: "53%"
    }} />;
  };
});
/* the agent's screen — a real stream via streamSrc, else a faux window.
 * Media is absolutely positioned so it always fills its (relative) parent —
 * an h-full chain through an aspect-ratio box can collapse and leak the bg. */
const Screen = createComponent<{
  streamSrc?: string;
  cursor?: boolean;
}>("Screen", ["streamSrc", "cursor"], (__props, __slots) => {
  const streamSrc = computed(() => __props.streamSrc);
  const cursor = computed(() => __props.cursor === undefined ? true : __props.cursor);
  return () => {
    return <div class="absolute inset-0 overflow-hidden bg-inset">
      {streamSrc.value ? /\.(mp4|webm|mov|m4v)(\?|$)/i.test(streamSrc.value) ? <video src={streamSrc.value} autoplay muted loop playsinline class="absolute inset-0 h-full w-full object-cover" /> :
      
      <img src={streamSrc.value} alt="" class="absolute inset-0 h-full w-full object-cover" /> : <FauxWindow />}
      {cursor.value && <DriftCursor />}
    </div>;
  };
});
/* expanded viewer media — the image sizes itself within the viewport (bounded
 * by width and height) so the whole screen always fits with no crop */
const MediaSizer = createComponent<{
  src: string;
}>("MediaSizer", ["src"], (__props, __slots) => {
  const src = computed(() => __props.src);
  const style = computed(() => ({
    maxHeight: "calc(100vh - 150px)",
    maxWidth: "min(960px, 90vw)"
  }) as const);
  const cls = computed(() => "block h-auto w-auto object-contain");
  return () => {
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src.value) ? <video src={src.value} autoplay muted loop playsinline class={cls.value} style={cssStyle(style.value)} /> :
    
    <img src={src.value} alt="" class={cls.value} style={cssStyle(style.value)} />;
  };
});
/* connecting state — spinner on black, same ring as Task Rows */
const LoadingScreen = createComponent<Record<string, never>>("LoadingScreen", [], (__props, __slots) => {
  const size = computed(() => 26),
    stroke = computed(() => 2),
    r = computed(() => (size.value - stroke.value) / 2),
    c = computed(() => 2 * Math.PI * r.value);
  return () => {
    return <div class="absolute inset-0 bg-black">
      {/* spinner dead-center; wrapper carries the centering so the spin
          transform on the svg doesn't override it */}
      <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg width={size.value} height={size.value} class="block" style={cssStyle({
          animation: "spin 1.1s linear infinite"
        })} aria-hidden>
          <circle cx={size.value / 2} cy={size.value / 2} r={r.value} fill="none" stroke="rgba(255,255,255,0.18)" stroke-width={stroke.value} />
          <circle cx={size.value / 2} cy={size.value / 2} r={r.value} fill="none" stroke="#fff" stroke-width={stroke.value} stroke-linecap="round" stroke-dasharray={`${c.value * 0.28} ${c.value * 0.72}`} />
        </svg>
      </span>
      <span class="absolute inset-x-0 text-center text-[12.5px] font-medium text-white/70" style={cssStyle({
        top: "calc(50% + 28px)"
      })}>
        Connecting to agent&apos;s screen
      </span>
    </div>;
  };
});
const FauxWindow = createComponent<Record<string, never>>("FauxWindow", [], (__props, __slots) => {
  return () => {
    return <div class="flex h-full w-full flex-col bg-surface">
      <div class="flex shrink-0 items-center gap-1.5 border-b border-line bg-inset px-2.5 py-1.5">
        <span class="flex items-center gap-1">
          <span class="size-2 rounded-full bg-red" />
          <span class="size-2 rounded-full bg-orange" />
          <span class="size-2 rounded-full bg-green" />
        </span>
        <span class="ml-1 flex min-w-0 items-center gap-1.5 rounded-t-[6px] bg-surface px-2 py-1 shadow-[0_-1px_0_var(--line)]">
          <span class="size-2 shrink-0 rounded-[3px] bg-accent-tint" />
          <span class="h-1.5 w-14 rounded-full bg-line-strong" />
        </span>
      </div>
      <div class="flex shrink-0 items-center gap-2 border-b border-line px-2.5 py-1.5 text-ink-3">
        <Ico size={12} path={<path d="M15 18l-6-6 6-6" />} />
        <Ico size={12} path={<path d="M9 6l6 6-6 6" />} />
        <span class="min-w-0 flex-1 truncate rounded-full bg-field px-2.5 py-[3px] font-mono text-[9px] text-ink-3">
          hunter.io/try/search/ugly.cash
        </span>
      </div>
      <div class="flex flex-1 flex-col gap-2.5 overflow-hidden p-3">
        <div class="flex items-center gap-2">
          <span class="grid size-4 place-items-center rounded-[4px] bg-accent-tint text-[8px] font-bold text-accent">h</span>
          <span class="h-1.5 w-12 rounded-full bg-line-strong" />
          <span class="ml-auto h-4 w-12 rounded-full bg-inset shadow-btn" />
        </div>
        <div class="flex items-center gap-2 rounded-[8px] bg-inset p-2">
          <span class="h-3 flex-1 rounded-full bg-surface shadow-hairline" />
          <span class="h-3 w-9 rounded-full bg-accent" />
        </div>
        {["w-2/5", "w-1/2", "w-1/3", "w-2/5"].map((w, i) => <div key={i} class="flex items-center gap-2.5">
            <span class="size-6 shrink-0 rounded-full bg-accent-tint" />
            <span class="flex min-w-0 flex-1 flex-col gap-1.5">
              <span class={`h-1.5 rounded-full bg-line-strong ${w}`} />
              <span class="h-1.5 w-3/5 rounded-full bg-line" />
            </span>
          </div>)}
      </div>
    </div>;
  };
});
const AgentScreen = createComponent<{
  agentName?: string;
  streamSrc?: string;
  variant?: string;
}>("AgentScreen", ["agentName", "streamSrc", "variant"], (__props, __slots) => {
  const agentName = computed(() => __props.agentName === undefined ? "Agent" : __props.agentName);
  const streamSrc = computed(() => __props.streamSrc === undefined ? PLACEHOLDER : __props.streamSrc);
  const variant = computed(() => __props.variant);
  const loading = computed(() => variant.value === "Loading");
  const [open, setOpen] = createState(false);
  const [recording, setRecording] = createState(false);
  const [secs, setSecs] = createState(0);
  const [mounted, setMounted] = createState(false);
  const [cursorPos, setCursorPos] = createState<{
    x: number;
    y: number;
  } | null>(null);
  watchLifecycle(() => setMounted(true), () => []);

  // tick while recording — survives collapse (state lives here, not the overlay)
  watchLifecycle(() => {
    if (!recording.value) return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, () => [recording.value]);

  // lock scroll + Esc-to-collapse while the viewer is open
  watchLifecycle(() => {
    if (!open.value) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, () => [open.value]);
  const startRecording = () => {
    setSecs(0);
    setRecording(true);
  };
  const endRecording = () => {
    setRecording(false);
    setSecs(0);
  };
  const controls = computed(() => <div class="flex shrink-0 items-center gap-1.5">
      {recording.value ? <button type="button" onClick={endRecording} class="inline-flex h-[27px] items-center gap-1.5 rounded-full bg-red pl-2.5 pr-3 text-[13px] font-medium leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-[transform,filter] duration-150 ease-out hover:brightness-95 active:scale-[0.96]">
          <span class="size-2.5 rounded-[2px] bg-white" />
          End
        </button> : <Button variant="secondary" size="sm" className="gap-1 pl-1.5" onClick={startRecording}>
          <Ico size={15} path={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" /></>} />
          Teach a task
        </Button>}
      <button type="button" aria-label="Collapse" onClick={() => setOpen(false)} class="primitive-icon-button text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink">
        <Ico size={15} path={collapseIcon} />
      </button>
    </div>);
  return () => {
    return <div class="w-full max-w-[340px]">
      {/* ── resting card — hover/click scoped to the Mac window only ── */}
      <div class={`group/screen relative ${SCREEN_ASPECT} overflow-hidden rounded-window bg-inset shadow-card transition-shadow duration-150 ${loading.value ? "" : "cursor-pointer hover:shadow-raised"}`} onClick={loading.value ? undefined : () => setOpen(true)} style={cssStyle({
        animation: "fade-up 380ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
        {loading.value ? <LoadingScreen /> : <>
            <Screen streamSrc={streamSrc.value} />

            {/* hover reveal — scoped to this frame's named group, not the gallery section */}
            <div class="absolute inset-0 flex items-center justify-center bg-[rgba(17,19,24,0)] transition-colors duration-150 group-hover/screen:bg-[rgba(17,19,24,0.18)]">
              <span class="translate-y-1 opacity-0 transition duration-150 group-hover/screen:translate-y-0 group-hover/screen:opacity-100">
                <Button variant="accent" size="sm" onClick={e => {
                e.stopPropagation();
                setOpen(true);
              }}>
                  <Ico size={14} path={openIcon} />
                  Open
                </Button>
              </span>
            </div>
          </>}
      </div>

      <div class="mt-2.5 truncate px-0.5 text-[13px] font-medium text-ink">{agentName.value}&apos;s screen</div>

      {/* ── expanded viewer — portaled to <body> so it takes over the whole page ── */}
      {open.value && mounted.value && teleport(<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={`${agentName.value}'s screen`}>
            <div class="absolute inset-0 bg-black/60 dark:bg-black/75" style={cssStyle({
          animation: "fade-in 180ms ease-out both"
        })} onClick={() => setOpen(false)} />
            <div class="relative flex max-h-full flex-col overflow-hidden rounded-[16px] bg-surface p-2 pt-0 shadow-overlay" style={cssStyle({
          animation: "pop-in 240ms cubic-bezier(0.23,1,0.32,1) both"
        })}>
              {/* title bar — agent name far left, controls right */}
              <div class="flex h-11 shrink-0 items-center justify-between gap-3 px-1.5">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="truncate text-[13px] font-semibold text-ink">{agentName.value}</span>
                  {recording.value && <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-tint py-0.5 pl-1.5 pr-2 text-[11.5px] font-medium tabular-nums text-red">
                      <span class="size-2 rounded-full bg-red" style={cssStyle({
                  animation: "records-pulse 1.1s ease-in-out infinite"
                })} />
                      {fmt(secs.value)}
                    </span>}
                </div>
                {controls.value}
              </div>

              {/* the screen — inset with a little padding (the crop framing);
                  the image sizes the window so the whole screen fits */}
              <div class="relative min-h-0 overflow-hidden rounded-[8px] bg-inset [cursor:none]" onMousemove={e => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setCursorPos({
              x: e.clientX - r.left,
              y: e.clientY - r.top
            });
          }} onMouseleave={() => setCursorPos(null)}>
                {loading.value ? <div class={SCREEN_ASPECT} style={cssStyle({
              width: "min(960px, 90vw)"
            })}>
                    <LoadingScreen />
                  </div> : <MediaSizer src={streamSrc.value} />}
                {!loading.value && cursorPos.value && <CursorSvg className="pointer-events-none absolute z-10" style={{
              left: cursorPos.value.x,
              top: cursorPos.value.y,
              filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))"
            }} />}
              </div>
            </div>
          </div>, document.body)}
    </div>;
  };
});
export default AgentScreen;
