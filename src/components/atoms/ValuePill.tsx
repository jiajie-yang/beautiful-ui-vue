// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
type Tone = "neutral" | "green" | "orange" | "red" | "accent";
const TONES: Record<Tone, {
  cls: string;
  ring: string;
}> = {
  neutral: {
    cls: "bg-field text-ink-2",
    ring: "var(--shadow-hairline)"
  },
  green: {
    cls: "bg-green-tint text-green",
    ring: "0 0 0 1px color-mix(in oklch, var(--green) 28%, transparent)"
  },
  orange: {
    cls: "bg-orange-tint text-orange",
    ring: "0 0 0 1px color-mix(in oklch, var(--orange) 28%, transparent)"
  },
  red: {
    cls: "bg-red-tint text-red",
    ring: "0 0 0 1px color-mix(in oklch, var(--red) 28%, transparent)"
  },
  accent: {
    cls: "bg-accent-tint text-accent-ink",
    ring: "0 0 0 1px color-mix(in oklch, var(--accent) 28%, transparent)"
  }
};

/** Inline value badge — a plain value (a date, a name, a count) set off in
 *  prose. Softer than a StatusPill (no dot) and not a mono token (see Chip). */
export const ValuePill = createComponent<{
  children: UI.VNodeChild;
  tone?: Tone;
  className?: string;
}>("ValuePill", ["children", "tone", "className"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const tone = computed(() => __props.tone === undefined ? "neutral" : __props.tone);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  const t = computed(() => TONES[tone.value]);
  return () => {
    return <span class={`mx-0.5 inline-flex items-center rounded-full px-1.5 py-0
        align-middle text-[12px] font-medium ${t.value.cls} ${className.value}`} style={cssStyle({
      boxShadow: t.value.ring
    })}>
      {children.value}
    </span>;
  };
});
