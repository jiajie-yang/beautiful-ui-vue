// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { VNode, CSSProperties } from '@/lib/dom-types';
export interface LivelineTransitionProps {
  /** Key of the active child to display. Must match a child's `key` prop. */
  active: string;
  /** Chart elements with unique `key` props */
  children: VNode | VNode[];
  /** Cross-fade duration in ms (default 300) */
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Cross-fade between chart components (e.g. line ↔ candlestick).
 * Children must have unique `key` props matching possible `active` values.
 *
 * @example
 * ```tsx
 * <LivelineTransition active={chartType}>
 *   <Liveline key="line" data={data} value={value} />
 *   <Liveline key="candle" mode="candle" candles={candles} candleWidth={5} data={data} value={value} />
 * </LivelineTransition>
 * ```
 */
export const LivelineTransition = createComponent<LivelineTransitionProps>("LivelineTransition", ["active", "children", "duration", "className", "style"], (__props, __slots) => {
  const active = computed(() => __props.active);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const duration = computed(() => __props.duration === undefined ? 300 : __props.duration);
  const className = computed(() => __props.className);
  const style = computed(() => __props.style);
  const childArray = computed(() => Array.isArray(children.value) ? children.value : [children.value]);
  const [mounted, setMounted] = createState<Set<string>>(() => new Set([active.value]));
  const [visible, setVisible] = createState(active.value);
  const prevRef = templateRef(active.value);
  watchLifecycle(() => {
    if (active.value === prevRef.value) return () => {};
    const oldKey = prevRef.value;
    prevRef.value = active.value;

    // Mount the incoming child
    setMounted(prev => new Set([...prev, active.value]));

    // Double rAF ensures the browser paints the opacity:0 state
    // before we flip to opacity:1, so the CSS transition fires
    let raf1 = requestAnimationFrame(() => {
      raf1 = requestAnimationFrame(() => setVisible(active.value));
    });

    // Unmount the outgoing child after transition completes
    const timer = setTimeout(() => {
      setMounted(prev => {
        const next = new Set(prev);
        next.delete(oldKey);
        return next;
      });
    }, duration.value + 50);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timer);
    };
  }, () => [active.value, duration.value]);
  return () => {
    return <div class={className.value} style={cssStyle({
      position: 'relative',
      width: '100%',
      height: '100%',
      ...style.value
    })}>
      {childArray.value.map(child => {
        const key = String(child.key ?? '');
        if (!mounted.value.has(key)) return null;
        const isActive = key === visible.value;
        return <div key={key} style={cssStyle({
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0,
          transition: `opacity ${duration.value}ms ease`,
          pointerEvents: isActive ? 'auto' : 'none'
        })}>
            {child}
          </div>;
      })}
    </div>;
  };
});
