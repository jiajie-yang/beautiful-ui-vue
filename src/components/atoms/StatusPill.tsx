// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const statusPillVariants = cva("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium leading-none", {
  variants: {
    tone: {
      green: "bg-green-tint text-green",
      orange: "bg-orange-tint text-orange",
      red: "bg-red-tint text-red",
      accent: "bg-accent-tint text-accent-ink",
      neutral: "bg-inset text-ink-2"
    }
  },
  defaultVariants: {
    tone: "neutral"
  }
});
type Tone = NonNullable<VariantProps<typeof statusPillVariants>["tone"]>;

/* the leading dot lives on a separate element, so its color stays a small lookup */
const dotColor: Record<Tone, string> = {
  green: "bg-green",
  orange: "bg-orange",
  red: "bg-red",
  accent: "bg-accent",
  neutral: "bg-ink-3"
};
export const StatusPill = createComponent<{
  tone?: Tone;
  children: UI.VNodeChild;
  dot?: boolean;
  className?: string;
}>("StatusPill", ["tone", "children", "dot", "className"], (__props, __slots) => {
  const tone = computed(() => __props.tone === undefined ? "neutral" : __props.tone);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const dot = computed(() => __props.dot === undefined ? true : __props.dot);
  const className = computed(() => __props.className);
  return () => {
    return <span class={cn(statusPillVariants({
      tone: tone.value
    }), className.value)}>
      {dot.value && <span class={cn("size-1.5 rounded-full", dotColor[tone.value])} />}
      {children.value}
    </span>;
  };
}, { dot: Boolean });
