import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * FINE-TUNE CARD — compact interactive inspector.
 * Number fields scrub: hover the label for an ↔ cursor and
 * drag to adjust, use ↑/↓ (⇧ for ×10), or type directly.
 * ───────────────────────────────────────────────────────── */
const ScrubField = createComponent<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  active?: boolean;
}>("ScrubField", ["label", "value", "onChange", "min", "max", "step", "suffix", "active"], (__props, __slots) => {
  const label = computed(() => __props.label);
  const value = computed(() => __props.value);
  const onChange = computed(() => __props.onChange);
  const min = computed(() => __props.min);
  const max = computed(() => __props.max);
  const step = computed(() => __props.step === undefined ? 1 : __props.step);
  const suffix = computed(() => __props.suffix === undefined ? "" : __props.suffix);
  const active = computed(() => __props.active);
  const drag = templateRef<{
    x: number;
    v: number;
  } | null>(null);
  const clamp = (v: number) => Math.min(max.value, Math.max(min.value, Math.round(v)));
  return () => {
    return <label class="flex h-6.5 min-w-0 items-center gap-1 rounded-chip py-1 pr-1 pl-0.5
        transition-[background-color,box-shadow] duration-200" style={cssStyle({
      background: active.value ? "var(--accent-tint)" : "var(--field)",
      boxShadow: active.value ? "0 0 0 1px var(--accent)" : "none"
    })}>
      {/* scrub handle */}
      <span role="slider" aria-label={label.value} aria-valuenow={value.value} aria-valuemin={min.value} aria-valuemax={max.value} tabindex={0} onPointerdown={e => {
        (e.target as HTMLInputElement as HTMLElement).setPointerCapture(e.pointerId);
        drag.value = {
          x: e.clientX,
          v: value.value
        };
      }} onPointermove={e => {
        if (!drag.value) return;
        onChange.value(clamp(drag.value.v + (e.clientX - drag.value.x) / 2 * step.value));
      }} onPointerup={() => drag.value = null} onKeydown={e => {
        const mult = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault();
          onChange.value(clamp(value.value + step.value * mult));
        } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault();
          onChange.value(clamp(value.value - step.value * mult));
        }
      }} class="flex h-full shrink-0 cursor-ew-resize touch-none items-center rounded-[4px]
          px-0.5 text-[12px] text-ink-3 select-none hover:text-ink-2 focus-visible:text-accent-ink
          focus-visible:outline-none">
        {label.value}
      </span>
      <input inputmode="numeric" value={value.value} onInput={e => {
        const n = Number((e.target as HTMLInputElement).value.replace(/[^\d-]/g, ""));
        if (!Number.isNaN(n)) onChange.value(clamp(n));
      }} aria-label={t("fineTuneCard.label0Value", [label.value])} class="min-w-0 flex-1 bg-transparent text-[12px] text-ink tabular-nums outline-none" />
      {suffix.value && <span class="shrink-0 pr-0.5 text-[11.5px] text-ink-3">{suffix.value}</span>}
    </label>;
  };
});
const SEGMENTS = ["row", "col", "grid"] as const;
const SegmentIcon = createComponent<{
  kind: string;
}>("SegmentIcon", ["kind"], (__props, __slots) => {
  const kind = computed(() => __props.kind);
  const dot = computed(() => "size-1.5 rounded-[2px] border-[1.2px] border-current");
  return () => {
    if (kind.value === "row") return <span class="flex gap-0.5">{[0, 1, 2].map(i => <span key={i} class={dot.value} />)}</span>;
    if (kind.value === "col") return <span class="flex flex-col gap-0.5">{[0, 1].map(i => <span key={i} class={dot.value} />)}</span>;
    return <span class="grid grid-cols-2 gap-0.5">
      {[0, 1, 2, 3].map(i => <span key={i} class={dot.value} />)}
    </span>;
  };
});
/* A single scrub-able number property. `value` is the initial/default value. */
export type FineTuneField = {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
};
/* Prominent copy strings on the card. */
export type FineTuneCardLabels = {
  title: string;
  layout: string;
  type: string;
  placeholder: string;
  adjust: string;
  edited: string;
};
/* The editable state emitted by `onChange`. */
export type FineTuneState = {
  segment: number;
  values: Record<string, number>;
  type: string;
};
const FIELDS: FineTuneField[] = [{
  key: "width",
  get label() { return t("fineTuneCard.width"); },
  value: 324,
  min: 40,
  max: 999
}, {
  key: "height",
  get label() { return t("fineTuneCard.height"); },
  value: 96,
  min: 24,
  max: 999
}, {
  key: "radius",
  get label() { return t("fineTuneCard.radius"); },
  value: 28,
  min: 0,
  max: 64
}, {
  key: "opacity",
  get label() { return t("fineTuneCard.opacity"); },
  value: 100,
  min: 0,
  max: 100,
  suffix: "%"
}];
const OPTIONS = ["Seasonal", "Classic", "Limited"];
const DEFAULT_LABELS: FineTuneCardLabels = {
  get title() { return t("fineTuneCard.flavorCard"); },
  get layout() { return t("fineTuneCard.layout"); },
  get type() { return t("common.type"); },
  get placeholder() { return t("fineTuneCard.selectType"); },
  get adjust() { return t("fineTuneCard.adjust"); },
  get edited() { return t("fineTuneCard.edited"); }
};
function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}
export type FineTuneCardProps = {
  /** Accepted for gallery/registry parity; not used by this card. */
  variant?: string;
  /** The scrub-able properties shown in the layout grid (rendered in pairs). */
  fields?: FineTuneField[];
  /** Options offered in the Type menu. */
  options?: string[];
  /** Prominent copy strings. */
  labels?: Partial<FineTuneCardLabels>;
  /** Called with the full editable state whenever the user edits it. */
  onChange?: (state: FineTuneState) => void;
};
const FineTuneCard = createComponent<FineTuneCardProps>("FineTuneCard", ["variant", "fields", "options", "labels", "onChange"], (__props, __slots) => {
  const fields = computed(() => __props.fields === undefined ? FIELDS : __props.fields);
  const options = computed(() => __props.options === undefined ? OPTIONS : __props.options);
  const labels = computed(() => __props.labels);
  const onChange = computed(() => __props.onChange);
  const text = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const [seg, setSeg] = createState(0);
  const [values, setValues] = createState<Record<string, number>>(() => Object.fromEntries(fields.value.map(f => [f.key, f.value])));
  const [menuOpen, setMenuOpen] = createState(false);
  const [typeValue, setTypeValue] = createState<string | null>(null);
  const typeLabel = (value: string | null) => value === null ? text.value.placeholder : (__props.options === undefined ? ({ Seasonal: t("common.seasonal"), Classic: t("common.classic"), Limited: t("fineTuneCard.limited") } as Record<string, string>)[value] ?? value : value);
  const selectSeg = (i: number) => {
    setSeg(i);
    onChange.value?.({
      segment: i,
      values: values.value,
      type: typeValue.value ?? text.value.placeholder
    });
  };
  const setValue = (key: string, v: number) => {
    setValues(current => {
      const next = {
        ...current,
        [key]: v
      };
      onChange.value?.({
        segment: seg.value,
        values: next,
        type: typeValue.value ?? text.value.placeholder
      });
      return next;
    });
  };
  const selectType = (value: string) => {
    setTypeValue(value);
    setMenuOpen(false);
    onChange.value?.({
      segment: seg.value,
      values: values.value,
      type: value
    });
  };
  const changed = computed(() => fields.value.some(f => values.value[f.key] !== f.value));
  const done = computed(() => seg.value !== 0 || changed.value || typeValue.value !== null);
  return () => {
    return <div class="relative w-full max-w-60 rounded-card bg-surface shadow-raised">
      {/* header */}
      <div class="primitive-card-bar flex items-center justify-between border-b border-line">
        <span class="text-[13px] font-medium text-ink">{text.value.title}</span>
        {done.value ? <span class="flex items-center gap-1.5 text-[12px] font-medium text-green" style={cssStyle({
          animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both"
        })}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {text.value.edited}
          </span> : <span class="flex items-center gap-1.5">
            <span class="flex size-4.5 items-center justify-center rounded-[5px] border border-accent/30 bg-accent-tint">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
              </svg>
            </span>
            <span class="bg-clip-text text-[12px] font-medium text-transparent" style={cssStyle({
            backgroundImage: "linear-gradient(90deg, var(--accent) 35%, var(--accent-ink) 50%, var(--accent) 65%)",
            backgroundSize: "200% 100%",
            animation: "shimmer-text 1.4s linear infinite"
          })}>
              {text.value.adjust}
            </span>
          </span>}
      </div>

      {/* layout section */}
      <div class="primitive-card-pad flex flex-col gap-2 border-b border-line">
        <p class="text-[12.5px] font-medium text-ink">{text.value.layout}</p>
        {/* segmented control: gray track, raised white thumb */}
        <div class="relative grid grid-cols-3 rounded-control bg-field p-0.5">
          <span aria-hidden class="absolute inset-y-0.5 rounded-[6px] bg-surface shadow-btn transition-transform duration-300" style={cssStyle({
            width: "calc((100% - 4px) / 3)",
            left: 2,
            transform: `translateX(${seg.value * 100}%)`,
            transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
          })} />
          {SEGMENTS.map((s, i) => <button key={s} type="button" aria-label={t("fineTuneCard.label0Layout", [({ row: t("fineTuneCard.row"), col: t("fineTuneCard.col"), grid: t("common.grid") })[s]])} aria-pressed={i === seg.value} onClick={() => selectSeg(i)} class={`relative z-10 flex h-6 items-center justify-center transition-colors duration-200
                ${i === seg.value ? "text-accent" : "text-ink-3"}`}>
              <SegmentIcon kind={s} />
            </button>)}
        </div>
        {chunk(fields.value, 2).map((pair, ri) => <div key={ri} class="grid min-w-0 grid-cols-2 gap-2">
            {pair.map(f => <ScrubField key={f.key} label={f.label} value={values.value[f.key]} onChange={v => setValue(f.key, v)} min={f.min} max={f.max} step={f.step} suffix={f.suffix} active={values.value[f.key] !== f.value} />)}
          </div>)}
      </div>

      {/* interaction section */}
      <div class="primitive-card-footer flex items-center justify-between">
        <span class="text-[12px] text-ink-3">{text.value.type}</span>
        <div class="relative -mr-0.5 w-30">
          <button type="button" aria-expanded={menuOpen.value} onClick={() => setMenuOpen(current => !current)} class="flex h-6.5 w-full items-center justify-between rounded-chip bg-inset py-1 pr-1 pl-2
              shadow-hairline transition-shadow duration-200 focus-visible:outline-none" style={cssStyle({
            boxShadow: menuOpen.value ? "0 0 0 1px var(--accent)" : undefined
          })}>
            <span class={`text-[12px] ${typeValue.value !== null ? "text-ink" : "text-ink-3"}`}>
              {typeLabel(typeValue.value)}
            </span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-200" style={cssStyle({
              transform: menuOpen.value ? "rotate(180deg)" : "rotate(0)"
            })}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {menuOpen.value && <div class="absolute right-0 bottom-8 z-10 w-30 rounded-[10px] bg-surface p-1 shadow-raised" style={cssStyle({
            animation: "pop-in 200ms cubic-bezier(0.23,1,0.32,1) both",
            transformOrigin: "bottom right"
          })}>
              <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[6px] bg-field">
                {options.value.map(item => <button key={typeLabel(item)} data-menu-row type="button" onClick={() => selectType(item)} class={`relative z-10 flex h-6.5 w-full items-center rounded-[6px] px-2 text-left text-[12.5px] text-ink ${item === typeValue.value ? "bg-field group-hover/glide-menu:bg-transparent" : ""}`}>
                    {typeLabel(item)}
                  </button>)}
              </GlideMenu>
            </div>}
        </div>
      </div>
    </div>;
  };
});
export default FineTuneCard;
