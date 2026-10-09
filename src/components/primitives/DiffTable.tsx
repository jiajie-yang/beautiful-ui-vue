import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { Button } from "@/components/atoms/Button";

/* ─────────────────────────────────────────────────────────
 * DIFF TABLE
 * The proposed edit plays once and rests on the completed
 * diff. Each changed row is the control: click it to include
 * or exclude that specific addition/removal before applying.
 * ───────────────────────────────────────────────────────── */

function useStage(steps: number[]) {
  const [stage, setStage] = createState(0);
  watchLifecycle(() => {
    if (stage.value >= steps.length) return;
    const t = setTimeout(() => setStage(s => s + 1), steps[stage.value]);
    return () => clearTimeout(t);
  }, () => [stage.value, steps]);
  return computed(() => {
    return stage.value;
  });
}
const STAGE_DELAYS = [180, 260];
export type DiffRow = {
  key: string;
  id: string;
  dept: string;
  email: string;
  removed: boolean;
};
const ROWS: (DiffRow & { displayId: string; displayDept: string })[] = [{
  key: "rocky",
  id: "Rocky Road",
  get displayId() { return t("common.rockyRoad"); },
  dept: "Classic", get displayDept() { return t("common.classic"); },
  email: "aurora-scoops",
  removed: true
}, {
  key: "bubblegum",
  id: "Bubblegum",
  get displayId() { return t("common.bubblegum"); },
  dept: "Retro", get displayDept() { return t("common.retro"); },
  email: "kumo-creamery",
  removed: true
}, {
  key: "mint",
  id: "Mint Chip",
  get displayId() { return t("common.mintChip"); },
  dept: "Classic", get displayDept() { return t("common.classic"); },
  email: "maple-orbit",
  removed: false
}];
const DOT: Record<string, string> = {
  Classic: "bg-accent",
  Retro: "bg-ink-3",
  Seasonal: "bg-orange"
};
const IncludedMark = createComponent<{
  included: boolean;
  tone: "red" | "green";
}>("IncludedMark", ["included", "tone"], (__props, __slots) => {
  const included = computed(() => __props.included);
  const tone = computed(() => __props.tone);
  return () => {
    return <span aria-hidden class={`flex size-4.5 shrink-0 items-center justify-center rounded-[5px] transition-[background-color,color,transform] duration-150 ${included.value ? tone.value === "red" ? "bg-red text-white" : "bg-green text-white" : "bg-inset text-ink-3 shadow-hairline"}`} style={cssStyle({
      transform: included.value ? "scale(1)" : "scale(0.92)"
    })}>
      {included.value ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg> : null}
    </span>;
  };
});
const DiffTable = createComponent<{
  rows?: DiffRow[];
  variant?: string;
}>("DiffTable", ["rows", "variant"], (__props, __slots) => {
  const rows = computed(() => __props.rows === undefined ? ROWS : __props.rows);
  const stage = useStage(STAGE_DELAYS);
  // 0 plain · 1 removals · 2 completed diff
  const tinted = computed(() => stage.value >= 1);
  const settled = computed(() => stage.value >= 2);
  const [accepted, setAccepted] = createState(false);
  const [edits, setEdits] = createState<Record<string, boolean>>({
    rocky: true,
    bubblegum: true,
    pistachio: true
  });
  const removals = computed(() => ["rocky", "bubblegum"].filter(key => edits.value[key]).length);
  const additions = computed(() => edits.value.pistachio ? 1 : 0);
  const showAdded = computed(() => settled.value);
  const toggleEdit = (key: string) => setEdits(current => ({
    ...current,
    [key]: !current[key]
  }));
  return () => {
    return <div class="w-full max-w-95">
      <div class="relative overflow-hidden rounded-card bg-surface shadow-card">
        <div class="primitive-card-bar flex items-center justify-between border-b border-line">
          <span class="text-[12.5px] font-medium text-ink">{t("diffTable.proposedMenuCleanup")}</span>
          {settled.value && !accepted.value && <span class="text-[11px] text-ink-3">{t("diffTable.clickChangedRowsToToggle")}</span>}
        </div>

        <table class="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col class="w-[34%]" />
            <col class="w-[30%]" />
            <col class="w-[36%]" />
          </colgroup>
          <thead>
            <tr class="border-b border-line">
              {[t("diffTable.flavor"), t("diffTable.category"), t("diffTable.supplier")].map(h => <th key={h} class="primitive-table-cell text-[12px] font-medium text-ink-3">
                  {h}
                </th>)}
            </tr>
          </thead>
          <tbody>
            {rows.value.map(row => {
              const out = row.removed && tinted.value && edits.value[row.key];
              const interactive = row.removed && settled.value && !accepted.value;
              return <tr key={row.key} tabindex={interactive ? 0 : undefined} aria-selected={row.removed ? edits.value[row.key] : undefined} onClick={interactive ? () => toggleEdit(row.key) : undefined} onKeydown={interactive ? event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleEdit(row.key);
                }
              } : undefined} class={`border-b border-line transition-[background-color,filter,opacity] duration-150 last:border-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent ${interactive ? "cursor-pointer hover:brightness-[0.985]" : ""}`} style={cssStyle({
                background: out ? "var(--red-tint)" : undefined
              })}>
                  <td class="primitive-table-cell text-[13px] font-medium tabular-nums transition-colors duration-200" style={cssStyle({
                  color: out ? "var(--red)" : "var(--ink)"
                })}>
                    {__props.rows === undefined ? ROWS.find(item => item.id === row.id)?.displayId ?? row.id : row.id}
                  </td>
                  <td class="primitive-table-cell">
                    <span class="inline-flex h-5.5 items-center gap-1.5 rounded-full bg-inset px-2 text-[11.5px] font-medium shadow-hairline transition-opacity duration-200" style={cssStyle({
                    opacity: out ? 0.55 : 1
                  })}>
                      <span class={`size-1.5 rounded-full ${DOT[row.dept]}`} />
                      <span class="text-ink-2">{__props.rows === undefined ? ROWS.find(item => item.id === row.id)?.displayDept ?? row.dept : row.dept}</span>
                    </span>
                  </td>
                  <td class="primitive-table-cell text-[12.5px] whitespace-nowrap transition-colors duration-200" style={cssStyle({
                  color: out ? "var(--red)" : "var(--ink-2)",
                  textDecorationLine: out ? "line-through" : "none",
                  textDecorationColor: "color-mix(in srgb, var(--red) 50%, transparent)"
                })}>
                    <span class="flex items-center justify-between gap-2">
                      <span class="min-w-0 truncate">{row.email}</span>
                      {row.removed && settled.value && <IncludedMark included={edits.value[row.key]} tone="red" />}
                    </span>
                  </td>
                </tr>;
            })}
            {/* added row */}
            <tr>
              <td colspan={3} class="p-0">
                <div class="grid transition-[grid-template-rows,opacity] duration-200" style={cssStyle({
                  gridTemplateRows: showAdded.value ? "1fr" : "0fr",
                  opacity: showAdded.value ? 1 : 0,
                  transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
                })}>
                  <div class="overflow-hidden">
                    <div role="checkbox" tabindex={accepted.value ? -1 : 0} aria-checked={edits.value.pistachio} aria-label={t("diffTable.includeAddingPistachio")} onClick={accepted.value ? undefined : () => toggleEdit("pistachio")} onKeydown={accepted.value ? undefined : event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleEdit("pistachio");
                      }
                    }} class={`grid grid-cols-[34%_30%_36%] items-center border-t border-line transition-[background-color,filter,opacity] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent ${accepted.value ? "" : "cursor-pointer hover:brightness-[0.985]"}`} style={cssStyle({
                      background: edits.value.pistachio ? "var(--green-tint)" : undefined
                    })}>
                      <span class="primitive-table-cell text-[13px] font-medium tabular-nums transition-colors duration-200" style={cssStyle({
                        color: edits.value.pistachio ? "var(--green)" : "var(--ink-3)"
                      })}>
                        {t("common.pistachio")}</span>
                      <span class="primitive-table-cell">
                        <span class="inline-flex h-5.5 items-center gap-1.5 rounded-full bg-surface px-2 text-[11.5px] font-medium shadow-hairline">
                          <span class="size-1.5 rounded-full bg-green" />
                          <span class="text-ink-2">{t("common.seasonal")}</span>
                        </span>
                      </span>
                      <span class="primitive-table-cell text-[13px] transition-colors duration-200" style={cssStyle({
                        color: edits.value.pistachio ? "var(--green)" : "var(--ink-3)"
                      })}>
                        <span class="flex items-center justify-between gap-2">
                          <span class="min-w-0 truncate">{"maple-orbit"}</span>
                          <IncludedMark included={edits.value.pistachio} tone="green" />
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* footer — the summary follows the row-level selection */}
        {settled.value && <div class="primitive-card-footer flex min-h-11 items-center justify-between border-t border-line" style={cssStyle({
          animation: "fade-up 180ms cubic-bezier(0.23,1,0.32,1) both"
        })}>
            {accepted.value ? <span class="inline-flex items-center gap-1.5 rounded-full bg-green-tint py-1 pr-2.5 pl-1 text-[12.5px] font-medium text-green" style={cssStyle({
            animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both"
          })}>
                <span class="flex size-4.5 items-center justify-center rounded-full bg-green text-white">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                {removals.value + additions.value} {removals.value + additions.value === 1 ? t("common.edit") : t("common.edits")}{(" " + t("diffTable.applied"))}</span> : <>
                <span class="text-[11.5px] tabular-nums text-ink-3">
                  {removals.value} {removals.value === 1 ? t("diffTable.removal") : t("diffTable.removals")} {" · "}{additions.value} {additions.value === 1 ? t("diffTable.addition") : t("diffTable.additions")}
                </span>
                <span class="flex items-center gap-1.5">
                  <Button variant="accent" size="sm" disabled={removals.value + additions.value === 0} onClick={() => {
                setAccepted(true);
              }} className="text-[12px]">
                    {(t("diffTable.apply") + " ")}{removals.value + additions.value} {removals.value + additions.value === 1 ? t("common.change") : t("diffTable.changes")}
                  </Button>
                </span>
              </>}
          </div>}
      </div>
    </div>;
  };
});
export default DiffTable;
