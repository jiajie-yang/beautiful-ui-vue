// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/** Segmented control — equal-width segments, sliding thumb. */
export const SegmentedControl = createComponent<{
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}>("SegmentedControl", ["options", "value", "onChange", "className"], (__props, __slots) => {
  type T = string;
  const options = computed(() => __props.options);
  const value = computed(() => __props.value);
  const onChange = computed(() => __props.onChange);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  const index = computed(() => options.value.indexOf(value.value));
  return () => {
    return <div class={`relative inline-grid h-8 select-none rounded-full bg-line/60 p-0.5 ${className.value}`} style={cssStyle({
      gridTemplateColumns: `repeat(${options.value.length}, 1fr)`
    })} role="tablist">
      <span aria-hidden class="absolute inset-y-0.5 rounded-full bg-surface shadow-hairline
          transition-transform duration-200" style={cssStyle({
        width: `calc((100% - 4px) / ${options.value.length})`,
        left: 2,
        transform: `translateX(${index.value * 100}%)`,
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
      })} />
      {options.value.map(opt => <button key={opt} role="tab" aria-selected={opt === value.value} onClick={() => onChange.value(opt)} class={`relative z-10 rounded-full px-3 text-[13px] font-medium
            transition-colors duration-150
            ${opt === value.value ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}>
          {opt}
        </button>)}
    </div>;
  };
});
