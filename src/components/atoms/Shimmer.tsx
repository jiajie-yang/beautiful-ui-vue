// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/** Shimmering label — signals the agent is processing. */
export const Shimmer = createComponent<{
  children: UI.VNodeChild;
  className?: string;
}>("Shimmer", ["children", "className"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  return () => {
    return <span class={`inline-block bg-clip-text text-transparent ${className.value}`} style={cssStyle({
      backgroundImage: "linear-gradient(90deg, var(--ink-3) 35%, var(--ink) 50%, var(--ink-3) 65%)",
      backgroundSize: "200% 100%",
      animation: "shimmer-text 1.8s linear infinite"
    })}>
      {children.value}
    </span>;
  };
});
