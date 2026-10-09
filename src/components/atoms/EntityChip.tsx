// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/** Monogram mark — a colored disc with an initial or short glyph.
 *  The shared building block for entity chips and monogram headings. */
export const Monogram = createComponent<{
  children: UI.VNodeChild;
  color?: string;
  className?: string;
}>("Monogram", ["children", "color", "className"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const color = computed(() => __props.color === undefined ? "#e08a3c" : __props.color);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  return () => {
    return <span class={`flex size-4 shrink-0 items-center justify-center rounded-full
        text-[9px] font-semibold leading-none text-white ${className.value}`} style={cssStyle({
      background: color.value
    })}>
      {children.value}
    </span>;
  };
});

/** Inline entity reference — a monogram + name in a soft field pill.
 *  Names a supplier, person, or record inside running text. Softer than a
 *  StatusPill (no dot, no state) and not a mono token (see Chip). */
export const EntityChip = createComponent<{
  name: string;
  color?: string;
  monogram?: UI.VNodeChild;
  className?: string;
}>("EntityChip", ["name", "color", "monogram", "className"], (__props, __slots) => {
  const name = computed(() => __props.name);
  const color = computed(() => __props.color);
  const monogram = computed(() => __props.monogram);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  return () => {
    return <span class={`mx-0.5 inline-flex items-center gap-1 rounded-full bg-field
        py-px pl-[3px] pr-1.5 align-middle shadow-hairline ${className.value}`}>
      <Monogram color={color.value}>{monogram.value ?? name.value.charAt(0)}</Monogram>
      <span class="text-[12px] font-medium text-ink">{name.value}</span>
    </span>;
  };
});
