// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/** Monospace token chip — for code values like `updated_at`. */
export const Chip = createComponent<{
  children: UI.VNodeChild;
  tone?: "neutral" | "accent" | "orange";
  className?: string;
}>("Chip", ["children", "tone", "className"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const tone = computed(() => __props.tone === undefined ? "neutral" : __props.tone);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  const tones = computed(() => ({
    neutral: "bg-inset text-ink-2",
    accent: "bg-accent-tint text-accent-ink",
    orange: "bg-orange-tint text-orange"
  }));
  return () => {
    return <code class={`inline rounded-md px-1.5 py-0.5 font-mono text-[12px]
        leading-none align-[-1px] ${tones.value[tone.value]} ${className.value}`}>
      {children.value}
    </code>;
  };
});
