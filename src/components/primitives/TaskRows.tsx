// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * TASK ROWS
 *
 *     0ms   rows enter staggered (80ms apart)
 *   600ms   row 1 ring sweeps 0 → 66%
 *  1500ms   row 1 expands — detail steps drop down
 *  3900ms   row 1 collapses; row 2 flips to Failed + retry
 *  5300ms   row 2 resolves to Completed
 * The status run completes once; task details stay clickable.
 * ───────────────────────────────────────────────────────── */

const TICKS = [600, 900, 2400, 1400, 2400, 600];
function useTick(intervals: number[]) {
  const [tick, setTick] = createState(0);
  watchLifecycle(() => {
    if (tick.value >= intervals.length - 1) return;
    const t = setTimeout(() => setTick(x => x + 1), intervals[tick.value]);
    return () => clearTimeout(t);
  }, () => [tick.value, intervals]);
  return computed(() => {
    return tick.value;
  });
}
const SpinnerRing = createComponent<{
  active?: boolean;
  children?: UI.VNodeChild;
}>("SpinnerRing", ["active", "children"], (__props, __slots) => {
  const active = computed(() => __props.active);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const size = computed(() => 24),
    stroke = computed(() => 2);
  const r = computed(() => (size.value - stroke.value) / 2);
  const c = computed(() => 2 * Math.PI * r.value);
  return () => {
    return <span class="relative inline-flex shrink-0 items-center justify-center" style={cssStyle({
      width: size.value,
      height: size.value
    })}>
      <svg width={size.value} height={size.value} class="absolute inset-0" style={cssStyle(active.value ? {
        animation: "spin 1.1s linear infinite"
      } : undefined)}>
        <circle cx={size.value / 2} cy={size.value / 2} r={r.value} fill="none" stroke="var(--line)" stroke-width={stroke.value} />
        {active.value && <circle cx={size.value / 2} cy={size.value / 2} r={r.value} fill="none" stroke="var(--ink-3)" stroke-width={stroke.value} stroke-linecap="round" stroke-dasharray={`${c.value * 0.28} ${c.value * 0.72}`} />}
      </svg>
      <span class="relative text-[10.5px] font-semibold tabular-nums text-ink">{children.value}</span>
    </span>;
  };
});
const Badge = createComponent<{
  tone: "red" | "green";
  children: UI.VNodeChild;
}>("Badge", ["tone", "children"], (__props, __slots) => {
  const tone = computed(() => __props.tone);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  return () => {
    return <span class={`flex size-5.5 shrink-0 items-center justify-center rounded-full text-white
        ${tone.value === "red" ? "bg-red" : "bg-green"}`} style={cssStyle({
      animation: "pop-in 300ms cubic-bezier(0.23,1,0.32,1) both"
    })}>
      {children.value}
    </span>;
  };
});
const XIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>;
const CheckIcon = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>;
const RetryIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" /></svg>;

/* One detail line shown when a task row is expanded. */
export type TaskDetail = {
  label: string;
  meta: string;
};

/* A single task row.
 *  - "done"     → green check badge + completed pill (static)
 *  - "running"  → active spinner showing `step`, no pill (static)
 *  - "sequence" → animation-driven: pending spinner → failed → completed
 */
export type TaskRow = {
  key: string;
  label: string;
  amount: string;
  status: "done" | "running" | "sequence";
  step?: number;
  details: TaskDetail[];
};
export type TaskRowsLabels = {
  completed: string;
  failed: string;
};
const DEFAULT_LABELS: TaskRowsLabels = {
  completed: "Completed",
  failed: "Failed"
};
const TASK_ROWS: TaskRow[] = [{
  key: "verify",
  label: "Verified vendor records",
  amount: "12 suppliers",
  status: "done",
  details: [{
    label: "Matched tax and contact IDs",
    meta: "12/12"
  }, {
    label: "Flagged stale records",
    meta: "0"
  }]
}, {
  key: "index",
  label: "Build reorder task list",
  amount: "7 SKUs",
  status: "running",
  step: 2,
  details: [{
    label: "Reading POS export",
    meta: "3 files"
  }, {
    label: "Scoring stockout risk",
    meta: "68%"
  }]
}, {
  key: "draft",
  label: "Draft supplier emails",
  amount: "2 messages",
  status: "sequence",
  step: 3,
  details: [{
    label: "Cone supplier follow-up",
    meta: "draft"
  }, {
    label: "Pistachio reorder note",
    meta: "draft"
  }]
}];
const TaskRows = createComponent<{
  variant?: string;
  rows?: TaskRow[];
  labels?: Partial<TaskRowsLabels>;
  className?: string;
  onToggleRow?: (key: string, open: boolean) => void;
}>("TaskRows", ["variant", "rows", "labels", "className", "onToggleRow"], (__props, __slots) => {
  const variant = computed(() => __props.variant === undefined ? "Capsules" : __props.variant);
  const rows = computed(() => __props.rows === undefined ? TASK_ROWS : __props.rows);
  const labels = computed(() => __props.labels);
  const className = computed(() => __props.className);
  const onToggleRow = computed(() => __props.onToggleRow);
  const tick = useTick(TICKS);
  const [manualOpen, setManualOpen] = createState<Record<string, boolean>>({});
  const row2: ComputedRef<"pending" | "failed" | "done"> = computed(() => tick.value < 3 ? "pending" : tick.value === 3 ? "failed" : "done");
  const copy = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const badgeFor = (row: TaskRow) => {
    if (row.status === "done") return <Badge tone="green">{CheckIcon}</Badge>;
    if (row.status === "running") return <SpinnerRing active>{row.step}</SpinnerRing>;
    return row2.value === "pending" ? <SpinnerRing>{row.step}</SpinnerRing> : row2.value === "failed" ? <Badge tone="red">{XIcon}</Badge> : <Badge tone="green">{CheckIcon}</Badge>;
  };
  const pillFor = (row: TaskRow) => {
    if (row.status === "done") return <span class="inline-flex h-5.5 items-center rounded-full bg-green-tint px-2 text-[11.5px] font-medium text-green">
          {copy.value.completed}
        </span>;
    if (row.status === "running") return null;
    return row2.value === "failed" ? <span class="inline-flex h-5.5 items-center gap-1.5 rounded-full bg-red-tint px-2 text-[11.5px] font-medium text-red" style={cssStyle({
      animation: "fade-in 200ms ease-out both"
    })}>
        {copy.value.failed} <span style={cssStyle({
        animation: "spin 1.2s linear infinite"
      })} class="flex">{RetryIcon}</span>
      </span> : row2.value === "done" ? <span class="inline-flex h-5.5 items-center gap-1.5 rounded-full bg-green-tint px-2 text-[11.5px] font-medium text-green" style={cssStyle({
      animation: "fade-in 200ms ease-out both"
    })}>
        {copy.value.completed}
      </span> : null;
  };
  const list = computed(() => variant.value === "List");
  return () => {
    return <div class={`flex w-full max-w-110 flex-col ${list.value ? "gap-0 self-start overflow-hidden rounded-card bg-surface shadow-card" : "min-h-[196px] gap-2"}${className.value ? ` ${className.value}` : ""}`}>
      {rows.value.map((row, i) => {
        const open = manualOpen.value[row.key] ?? (row.key === "index" && tick.value === 2);
        return <div key={row.key} class={`self-stretch overflow-hidden transition-[border-radius,background-color] duration-300 hover:bg-inset ${list.value ? "border-b border-line last:border-0" : "bg-surface shadow-card"}`} style={cssStyle({
          borderRadius: list.value ? 0 : open ? 14 : 22,
          animation: `fade-up 450ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both`
        })}>
            <button type="button" aria-expanded={open} onClick={() => {
            setManualOpen(current => ({
              ...current,
              [row.key]: !open
            }));
            onToggleRow.value?.(row.key, !open);
          }} class="flex h-11 w-full items-center gap-2.5 px-2.5 text-left">
              <span class="flex size-6 shrink-0 items-center justify-center">
                {badgeFor(row)}
              </span>
              <span class="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                {row.label}
              </span>
              <span class="text-[12.5px] text-ink-2 tabular-nums">{row.amount}</span>
              {pillFor(row)}
              <span aria-hidden="true" class="-ml-2 flex size-7 shrink-0 items-center justify-center rounded-full text-ink-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300" style={cssStyle({
                transform: open ? "rotate(180deg)" : "rotate(0)"
              })}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>

            {/* dropdown detail — same expandable grammar as Chain of Thought */}
            <div class="grid transition-[grid-template-rows,opacity] duration-300" style={cssStyle({
            gridTemplateRows: open ? "1fr" : "0fr",
            opacity: open ? 1 : 0,
            transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
          })}>
                <div class="overflow-hidden">
                  <div class="mb-2.5 grid grid-cols-[24px_1fr] gap-2.5 px-2.5">
                    <span aria-hidden class="mx-auto h-full w-px bg-line" />
                    <div class="flex flex-col gap-1.5">
                      {row.details.map((d, j) => <div key={d.label} class="flex items-center justify-between" style={cssStyle(open ? {
                    animation: `fade-up 300ms cubic-bezier(0.23,1,0.32,1) ${120 + j * 100}ms both`
                  } : undefined)}>
                          <span class="text-[12px] text-ink-2">{d.label}</span>
                          <span class="font-mono text-[11.5px] text-ink-3 tabular-nums">
                            {d.meta}
                          </span>
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>
          </div>;
      })}
    </div>;
  };
});
export default TaskRows;
