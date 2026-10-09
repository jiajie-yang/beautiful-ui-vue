// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/** Label-left / value-right row — the workhorse of every card in the refs. */
export const TextRow = createComponent<{
  label: UI.VNodeChild;
  value: UI.VNodeChild;
  meta?: UI.VNodeChild;
  className?: string;
}>("TextRow", ["label", "value", "meta", "className"], (__props, __slots) => {
  const label = computed(() => __props.label);
  const value = computed(() => __props.value);
  const meta = computed(() => __props.meta);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  return () => {
    return <div class={`flex min-h-11 items-center justify-between gap-4 py-2 ${className.value}`}>
      <span class="text-sm text-ink-2">{label.value}</span>
      <span class="flex items-baseline gap-2 text-right">
        <span class="text-sm font-medium text-ink tabular-nums">
          {value.value}
        </span>
        {meta.value && <span class="text-[13px] text-ink-3">{meta.value}</span>}
      </span>
    </div>;
  };
});
