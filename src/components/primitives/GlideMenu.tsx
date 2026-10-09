// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { VNodeChild } from '@/lib/dom-types';
type GlideMenuProps = {
  children: VNodeChild;
  className?: string;
  highlightClassName?: string;
  rowSelector?: string;
};

/** A single hover layer that glides between interactive menu rows. */
const GlideMenu = createComponent<GlideMenuProps>("GlideMenu", ["children", "className", "highlightClassName", "rowSelector"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  const highlightClassName = computed(() => __props.highlightClassName === undefined ? "inset-x-0 rounded-[8px] bg-hover" : __props.highlightClassName);
  const rowSelector = computed(() => __props.rowSelector === undefined ? "[data-menu-row]" : __props.rowSelector);
  const ref = templateRef<HTMLDivElement>(null);
  const [box, setBox] = createState<{
    top: number;
    height: number;
  } | null>(null);
  const [visible, setVisible] = createState(false);
  const moveTo = (target: EventTarget | null) => {
    const container = ref.value;
    if (!(target instanceof Element) || !container) return;
    const row = target.closest(rowSelector.value);
    if (!(row instanceof HTMLElement) || !container.contains(row)) return;
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    setBox({
      top: rowRect.top - containerRect.top,
      height: rowRect.height
    });
    setVisible(true);
  };
  return () => {
    return <div ref={ref} onMouseover={event => moveTo(event.target as HTMLInputElement)} onMouseleave={() => setVisible(false)} onFocusin={event => moveTo(event.target as HTMLInputElement)} onFocusout={event => {
      if (!ref.value?.contains(event.relatedTarget as Node | null)) setVisible(false);
    }} class={`group/glide-menu relative ${className.value}`}>
      <span aria-hidden class={`pointer-events-none absolute ${highlightClassName.value}`} style={cssStyle({
        top: box.value?.top ?? 0,
        height: box.value?.height ?? 0,
        opacity: box.value && visible.value ? 1 : 0,
        transition: "top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease"
      })} />
      {children.value}
    </div>;
  };
});
export default GlideMenu;
