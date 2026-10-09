// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/** Small progress ring with content in the center — the task-badge from the refs. */
export const ProgressRing = createComponent<{
  progress: number; // 0..1
  tone?: "orange" | "green" | "red" | "accent";
  children?: UI.VNodeChild;
  size?: number;
}>("ProgressRing", ["progress", "tone", "children", "size"], (__props, __slots) => {
  const progress = computed(() => __props.progress);
  const tone = computed(() => __props.tone === undefined ? "orange" : __props.tone);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const size = computed(() => __props.size === undefined ? 28 : __props.size);
  const stroke = computed(() => 2);
  const r = computed(() => (size.value - stroke.value) / 2);
  const c = computed(() => 2 * Math.PI * r.value);
  const tones = computed(() => ({
    orange: "var(--orange)",
    green: "var(--green)",
    red: "var(--red)",
    accent: "var(--accent)"
  }));
  return () => {
    return <span class="relative inline-flex items-center justify-center" style={cssStyle({
      width: size.value,
      height: size.value
    })}>
      <svg width={size.value} height={size.value} class="-rotate-90 absolute inset-0">
        <circle cx={size.value / 2} cy={size.value / 2} r={r.value} fill="none" stroke="var(--line)" stroke-width={stroke.value} />
        <circle cx={size.value / 2} cy={size.value / 2} r={r.value} fill="none" stroke={tones.value[tone.value]} stroke-width={stroke.value} stroke-linecap="round" stroke-dasharray={c.value} stroke-dashoffset={c.value * (1 - Math.min(1, Math.max(0, progress.value)))} style={cssStyle({
          transition: "stroke-dashoffset 400ms cubic-bezier(0.23,1,0.32,1)"
        })} />
      </svg>
      <span class="relative text-[12px] font-semibold tabular-nums">
        {children.value}
      </span>
    </span>;
  };
});
