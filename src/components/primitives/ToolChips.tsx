// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * TOOL CHIPS
 * An agent run as compact rows: tool calls with inline
 * chips, then file-diff chips summarizing the edits.
 * Hover a row to reveal its chevron; every row expands
 * to show what the tool actually did.
 * ───────────────────────────────────────────────────────── */

const STEP_MS = 700;
const Icons: Record<string, UI.VNodeChild> = {
  think: <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />,
  write: <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></g>,
  run: <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-5-6-5M12 19h8" /></g>,
  read: <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></g>
};
export type ToolDetailLine = {
  text: string;
  tone?: "add";
};
export type ToolStep = {
  icon: string;
  label: string;
  chip: string;
  mono: boolean;
  detailMono: boolean;
  detail: ToolDetailLine[];
};
export type ToolDiff = {
  file: string;
  add: number;
  del: number;
};
export type ToolDiffLine = {
  text: string;
  tone: "add" | "del" | "ctx";
};
export type ToolChipsLabels = {
  header: string;
  more: string;
};
const DEFAULT_LABELS: ToolChipsLabels = {
  header: "4 tool calls, 2 messages",
  more: "+2 more"
};
const ROWS: ToolStep[] = [{
  icon: "think",
  label: "Thinking",
  chip: "Planning the churn schedule…",
  mono: false,
  detailMono: false,
  detail: [{
    text: "Weekend demand carries pistachio, so it churns first."
  }, {
    text: "Batch capacity leaves two evening freezer windows."
  }]
}, {
  icon: "write",
  label: "Write 204 lines",
  chip: "ChurnSchedule.tsx",
  mono: true,
  detailMono: true,
  detail: [{
    text: "+ const windows = slots.filter((s) => s.temp <= -12)",
    tone: "add"
  }, {
    text: "+ return schedule(windows, { hero: \"pistachio\" })",
    tone: "add"
  }]
}, {
  icon: "run",
  label: "Rebuild and verify",
  chip: "npm run freeze",
  mono: true,
  detailMono: true,
  detail: [{
    text: "✓ built in 1.2s"
  }, {
    text: "✓ 34 checks passed"
  }]
}, {
  icon: "read",
  label: "Read image",
  chip: "flavor-chart.png",
  mono: true,
  detailMono: false,
  detail: [{
    text: "1280 × 720 · line chart, three summers."
  }, {
    text: "Mint chip trends up 12% through July."
  }]
}];
const DIFFS: ToolDiff[] = [{
  file: "flavors.css",
  add: 13,
  del: 0
}, {
  file: "ChurnSchedule.tsx",
  add: 74,
  del: 41
}, {
  file: "menu.ts",
  add: 8,
  del: 2
}];

/* hovering a file chip opens its diff — green added, red removed */
const DIFF_LINES: Record<string, ToolDiffLine[]> = {
  "flavors.css": [{
    text: ".scoop-card {",
    tone: "ctx"
  }, {
    text: "  gap: 14px;",
    tone: "del"
  }, {
    text: "  gap: 12px;",
    tone: "add"
  }, {
    text: "  container-type: inline-size;",
    tone: "add"
  }, {
    text: "}",
    tone: "ctx"
  }],
  "ChurnSchedule.tsx": [{
    text: "const slots = coldSlots(week);",
    tone: "ctx"
  }, {
    text: "const windows = slots;",
    tone: "del"
  }, {
    text: "const windows = slots.filter(",
    tone: "add"
  }, {
    text: "  (s) => s.temp <= -12,",
    tone: "add"
  }, {
    text: ");",
    tone: "add"
  }],
  "menu.ts": [{
    text: "export const hero = \"mint-chip\";",
    tone: "del"
  }, {
    text: "export const hero = \"pistachio\";",
    tone: "add"
  }]
};
const ToolChips = createComponent<{
  /** Accepted for gallery/registry parity; ToolChips has no visual variants. */
  variant?: string;
  steps?: ToolStep[];
  diffs?: ToolDiff[];
  diffLines?: Record<string, ToolDiffLine[]>;
  labels?: Partial<ToolChipsLabels>;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  onToggleRow?: (label: string, open: boolean) => void;
}>("ToolChips", ["variant", "steps", "diffs", "diffLines", "labels", "className", "onOpenChange", "onToggleRow"], (__props, __slots) => {
  const steps = computed(() => __props.steps === undefined ? ROWS : __props.steps);
  const diffs = computed(() => __props.diffs === undefined ? DIFFS : __props.diffs);
  const diffLines = computed(() => __props.diffLines === undefined ? DIFF_LINES : __props.diffLines);
  const labels = computed(() => __props.labels);
  const className = computed(() => __props.className);
  const onOpenChange = computed(() => __props.onOpenChange);
  const onToggleRow = computed(() => __props.onToggleRow);
  const copy = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const [step, setStep] = createState(0);
  const [open, setOpen] = createState(true);
  const [openRows, setOpenRows] = createState<Set<string>>(new Set());
  /* Rendered in a body portal so animated/translated reply wrappers cannot
   * redefine the fixed-position coordinate system. */
  const [preview, setPreview] = createState<{
    file: string;
    x: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const openPreview = (file: string) => (event: UI.SyntheticEvent) => {
    const rect = (event.currentTarget as HTMLElement as Element).closest("[data-diffchip]")!.getBoundingClientRect();
    const previewHeight = 38 + (diffLines.value[file]?.length ?? 0) * 19;
    const fitsBelow = rect.bottom + 6 + previewHeight <= window.innerHeight - 12;
    setPreview({
      file,
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
      ...(fitsBelow ? {
        top: rect.bottom + 6
      } : {
        bottom: window.innerHeight - rect.top + 6
      })
    });
  };
  const closePreview = (file: string) => () => setPreview(current => current?.file === file ? null : current);
  const total = computed(() => steps.value.length + 1); // rows, then diff chips

  watchLifecycle(() => {
    if (step.value >= total.value) return;
    const t = setTimeout(() => setStep(s => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, () => [step.value, total.value]);
  const toggleRow = (label: string) => setOpenRows(current => {
    const next = new Set(current);
    next.has(label) ? next.delete(label) : next.add(label);
    onToggleRow.value?.(label, next.has(label));
    return next;
  });
  return () => {
    return <div class={`min-h-[220px] w-full max-w-80 pb-1${className.value ? ` ${className.value}` : ""}`}>
      {/* collapsed run header */}
      <button type="button" aria-expanded={open.value} onClick={() => setOpen(current => {
        onOpenChange.value?.(!current);
        return !current;
      })} class="-mx-1.5 flex w-fit items-center gap-1.5 rounded-control px-1.5 py-1 text-[12.5px] text-ink-2 transition-colors duration-100 hover:bg-hover-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-200" style={cssStyle({
          transform: open.value ? "rotate(0deg)" : "rotate(-90deg)"
        })}>
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span class="tabular-nums">{copy.value.header}</span>
      </button>

      {/* tool call rows */}
      <div class="grid transition-[grid-template-rows,opacity] duration-300" style={cssStyle({
        gridTemplateRows: open.value ? "1fr" : "0fr",
        opacity: open.value ? 1 : 0
      })}>
        {/* -mx-1 + px-1.5 keeps content at the same x while giving the
            row hover pills room inside this overflow-hidden clip box */}
        <div class="-mx-1 overflow-hidden px-1.5 pb-1">
        <div class="mt-1.5 flex flex-col gap-1">
          {steps.value.slice(0, step.value).map(row => {
              const rowOpen = openRows.value.has(row.label);
              return <div key={row.label} style={cssStyle({
                animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both"
              })}>
              <button type="button" aria-expanded={rowOpen} onClick={() => toggleRow(row.label)} class="group/row -mx-[3px] flex h-7 w-[calc(100%+6px)] min-w-0 items-center gap-2 rounded-control px-[3px] text-left transition-colors duration-100 hover:bg-hover-2">
                <span class="relative flex size-4 shrink-0 items-center justify-center text-ink-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={row.icon === "think" ? "currentColor" : "none"} stroke="currentColor" class={`transition-opacity duration-100 group-hover/row:opacity-0 ${rowOpen ? "opacity-0" : ""}`}>
                    {Icons[row.icon]}
                  </svg>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class={`absolute transition-[opacity,transform] duration-150 group-hover/row:opacity-100 ${rowOpen ? "opacity-100" : "opacity-0"}`} style={cssStyle({
                      transform: rowOpen ? "rotate(0deg)" : "rotate(-90deg)"
                    })}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
                <span class="shrink-0 text-[12.5px] font-medium text-ink">{row.label}</span>
                <span class={`inline-flex h-5.5 min-w-0 flex-1 cursor-pointer items-center truncate rounded-chip bg-field px-1.5
                    text-[11.5px] text-ink-2 shadow-hairline transition-colors duration-100 hover:bg-hover-2
                    ${row.mono ? "font-mono" : ""}`}>
                  {row.chip}
                </span>
              </button>

              {/* expanded detail */}
              <div class="grid transition-[grid-template-rows,opacity] duration-300" style={cssStyle({
                  gridTemplateRows: rowOpen ? "1fr" : "0fr",
                  opacity: rowOpen ? 1 : 0,
                  transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
                })}>
                <div class="min-h-0 overflow-hidden">
                  <div class="mt-0.5 mb-1 ml-2 flex flex-col gap-0.5 border-l border-line py-0.5 pl-3.5">
                    {row.detail.map(line => <span key={line.text} class={`truncate text-[11.5px] leading-[1.6] ${row.detailMono ? "font-mono" : ""} ${line.tone === "add" ? "text-green" : "text-ink-2"}`}>
                        {line.text}
                      </span>)}
                  </div>
                </div>
              </div>
            </div>;
            })}
        </div>

      {/* file-diff chips */}
      {step.value >= total.value && <div class="mt-2.5 flex max-w-full flex-wrap gap-1.5 border-t border-line pt-2.5">
          {diffs.value.map((d, i) => <span key={d.file} data-diffchip class="relative" onMouseenter={openPreview(d.file)} onMouseleave={closePreview(d.file)}>
              <button type="button" aria-expanded={preview.value!?.file === d.file} aria-label={`Show diff for ${d.file}`} onFocus={openPreview(d.file)} onBlur={closePreview(d.file)} class="inline-flex h-7 max-w-full items-center gap-2 rounded-chip
                  bg-surface px-2 font-mono text-[11.5px] text-ink shadow-btn
                  transition-colors duration-100 hover:bg-hover" style={cssStyle({
                animation: `pop-in 250ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both`
              })}>
                <span class="min-w-0 truncate">{d.file}</span>
                <span class="shrink-0 text-green tabular-nums">+{d.add}</span>
                {d.del > 0 && <span class="shrink-0 text-red tabular-nums">−{d.del}</span>}
              </button>

            </span>)}
          <button type="button" class="inline-flex h-7 items-center rounded-chip px-1.5 font-mono text-[11.5px] text-ink-3
              underline decoration-transparent underline-offset-2 transition-colors duration-100
              hover:text-ink-2 hover:decoration-current" style={cssStyle({
              animation: `fade-in 300ms ease-out ${diffs.value.length * 80}ms both`
            })}>
            {copy.value.more}
          </button>
        </div>}
        </div>
      </div>
      {preview.value! && typeof document !== "undefined" && teleport(<div class="fixed z-50 w-72 overflow-hidden rounded-[10px] bg-surface shadow-overlay" style={cssStyle({
        left: preview.value!.x,
        top: preview.value!.top,
        bottom: preview.value!.bottom,
        animation: "pop-in 160ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: preview.value!.top === undefined ? "bottom left" : "top left"
      })}>
          <div class="flex items-center justify-between border-b border-line px-2.5 py-1.5 font-mono text-[11px]">
            <span class="min-w-0 truncate text-ink-2">{preview.value!.file}</span>
            <span class="shrink-0 tabular-nums">
              <span class="text-green">+{diffs.value.find(diff => diff.file === preview.value!.file)?.add}</span>
              {(diffs.value.find(diff => diff.file === preview.value!.file)?.del ?? 0) > 0 && <span class="text-red"> −{diffs.value.find(diff => diff.file === preview.value!.file)?.del}</span>}
            </span>
          </div>
          <div class="py-1 font-mono text-[11px] leading-[1.8]">
            {(diffLines.value[preview.value!.file] ?? []).map((line, index) => <div key={index} class={`flex gap-2 px-2.5 whitespace-pre ${line.tone === "add" ? "bg-green-tint text-green" : line.tone === "del" ? "bg-red-tint text-red" : "text-ink-2"}`}>
                <span class="w-3 shrink-0 select-none">{line.tone === "add" ? "+" : line.tone === "del" ? "−" : " "}</span>
                <span class="min-w-0 truncate">{line.text}</span>
              </div>)}
          </div>
        </div>, document.body)}
    </div>;
  };
});
export default ToolChips;
