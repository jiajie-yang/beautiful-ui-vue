// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
export const Switch = createComponent<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}>("Switch", ["checked", "onChange", "label"], (__props, __slots) => {
  const checked = computed(() => __props.checked);
  const onChange = computed(() => __props.onChange);
  const label = computed(() => __props.label);
  return () => {
    return <button role="switch" aria-checked={checked.value} aria-label={label.value} onClick={() => onChange.value(!checked.value)} class={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200
        ${checked.value ? "bg-ink" : "bg-line-strong"}`}>
      <span class="absolute top-0.5 left-0.5 size-5 rounded-full bg-white
          shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200" style={cssStyle({
        transform: checked.value ? "translateX(16px)" : "translateX(0)",
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
      })} />
    </button>;
  };
}, { checked: Boolean });
