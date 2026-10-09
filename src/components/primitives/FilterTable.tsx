// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * FILTER TABLE
 * Status chips directly filter the task table.
 * ───────────────────────────────────────────────────────── */

type Status = "todo" | "progress" | "done";
export type TableRow = {
  task: string;
  date: string;
  status: Status;
  owner: string;
};
export type FilterTableLabels = {
  columns: {
    task: string;
    date: string;
    status: string;
    owner: string;
  };
};
const FILTERS: {
  key: "all" | Status;
  label: string;
  dot?: string;
  count: number;
}[] = [{
  key: "all",
  label: "All",
  count: 5
}, {
  key: "todo",
  label: "To do",
  dot: "#f09a2f",
  count: 2
}, {
  key: "progress",
  label: "In Progress",
  dot: "#16a6c7",
  count: 2
}, {
  key: "done",
  label: "Completed",
  dot: "#25a878",
  count: 1
}];
const ROWS: TableRow[] = [{
  task: "Restock mango sorbet",
  date: "Dec 03",
  status: "todo",
  owner: "Mango Moon Gelato"
}, {
  task: "Churn black sesame",
  date: "Sep 22",
  status: "progress",
  owner: "Kumo Creamery"
}, {
  task: "Print summer menu",
  date: "Jan 02",
  status: "todo",
  owner: "Coral Coast Sorbet"
}, {
  task: "Taste-test batch 42",
  date: "Nov 08",
  status: "progress",
  owner: "Maple Orbit"
}, {
  task: "Order waffle cones",
  date: "Apr 14",
  status: "done",
  owner: "Aurora Scoops"
}];
const LABELS: FilterTableLabels = {
  columns: {
    task: "Task name",
    date: "Date",
    status: "Status",
    owner: "Advisor"
  }
};
const PILLS: Record<Status, {
  label: string;
  cls: string;
}> = {
  todo: {
    label: "To do",
    cls: "filter-status-todo"
  },
  progress: {
    label: "In Progress",
    cls: "filter-status-progress"
  },
  done: {
    label: "Completed",
    cls: "filter-status-done"
  }
};
const FilterTable = createComponent<{
  rows?: TableRow[];
  labels?: FilterTableLabels;
  variant?: string;
}>("FilterTable", ["rows", "labels", "variant"], (__props, __slots) => {
  const rows = computed(() => __props.rows === undefined ? ROWS : __props.rows);
  const labels = computed(() => __props.labels === undefined ? LABELS : __props.labels);
  const [filter, setFilter] = createState<"all" | Status>("all");
  return () => {
    return <div class="w-full max-w-105">
      {/* filter chips */}
      <div class="-mx-1 mb-1 flex items-center gap-1 overflow-x-auto px-1 py-1" style={cssStyle({
        scrollbarWidth: "none"
      })}>
        {FILTERS.map(f => {
          const active = filter.value === f.key;
          return <button key={f.key} type="button" aria-pressed={active} onClick={() => setFilter(f.key)} class={`flex h-6.5 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px]
                font-medium transition-[background-color,box-shadow,color] duration-200
                ${active ? "bg-surface text-ink shadow-btn" : "text-ink-2 hover:bg-hover"}`}>
              {f.dot && <span class="size-1.5 rounded-full" style={cssStyle({
              background: f.dot
            })} />}
              {f.label}
              <span class={`rounded-[4px] px-1 text-[10.5px] tabular-nums
                  ${active ? "bg-field text-ink-2" : "text-ink-3"}`}>
                {f.count}
              </span>
            </button>;
        })}
      </div>

      {/* table */}
      <div aria-label="Scrollable task table" class="overflow-x-auto rounded-card bg-surface shadow-card" role="region" tabindex={0} style={cssStyle({
        scrollbarWidth: "none"
      })}>
        <div class="min-w-[420px]">
          <div class="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.6fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] border-b border-[var(--grid-line)] text-[12.5px] font-medium text-ink-2">
            <span class="border-r border-[var(--grid-line)] px-3 py-2">{labels.value.columns.task}</span>
            <span class="border-r border-[var(--grid-line)] px-3 py-2">{labels.value.columns.date}</span>
            <span class="border-r border-[var(--grid-line)] px-3 py-2">{labels.value.columns.status}</span>
            <span class="px-3 py-2">{labels.value.columns.owner}</span>
          </div>
          {rows.value.map(row => {
            const shown = filter.value === "all" || row.status === filter.value;
            const pill = PILLS[row.status];
            return <div key={row.task} class="grid transition-[grid-template-rows,opacity] duration-300" style={cssStyle({
              gridTemplateRows: shown ? "1fr" : "0fr",
              opacity: shown ? 1 : 0,
              transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
            })}>
                <div class="overflow-hidden">
                  <div class="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.6fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] border-b
                      border-[var(--grid-line)] text-[13px] transition-colors duration-100 hover:bg-hover">
                    <span class="flex min-w-0 items-center border-r border-[var(--grid-line)] px-3 py-2">
                      <span class="truncate font-medium text-ink">{row.task}</span>
                    </span>
                    <span class="flex items-center whitespace-nowrap border-r border-[var(--grid-line)] px-3 py-2 text-ink-2 tabular-nums">
                      {row.date}
                    </span>
                    <span class="flex items-center border-r border-[var(--grid-line)] px-3 py-2">
                      <span class={`inline-flex h-[23px] shrink-0 items-center whitespace-nowrap rounded-[8px] border px-[7px]
                          text-[13px] font-medium ${pill.cls}`}>
                        {pill.label}
                      </span>
                    </span>
                    <span class="flex min-w-0 items-center px-3 py-2 text-ink-2">
                      <span class="truncate">{row.owner}</span>
                    </span>
                  </div>
                </div>
              </div>;
          })}
        </div>
      </div>
    </div>;
  };
});
export default FilterTable;
