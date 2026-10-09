import { computed, defineComponent, h, onBeforeUnmount, onMounted, shallowRef, Teleport, watch, type Component, type FunctionalComponent, type ShallowRef, type VNodeChild, type Slots, type CSSProperties, type PropType } from 'vue'

/** Declare actual Vue props and execute initialization exactly once per instance. */
export function createComponent<P>(name: string, keys: string[], setup: (props: P, slots: Slots) => () => VNodeChild, propTypes: Partial<Record<Extract<keyof P, string>, PropType<unknown>>> = {}): FunctionalComponent<Omit<P, "children"> & { children?: VNodeChild }> {
  // Explicit undefined preserves defaults resolved by the component setup.
  const types: Record<string, PropType<unknown>> = { disabled: Boolean, ...propTypes }
  return defineComponent({
    name,
    inheritAttrs: false,
    props: Object.fromEntries([...new Set([...keys, 'children', 'disabled', 'type', 'title', 'id', 'onClick', 'onPointerdown', 'onPointerup', 'onFocus', 'onBlur', 'aria-label', 'aria-expanded', 'aria-pressed', 'data-sound'])].map(key => [key, types[key] ? { type: types[key], default: undefined } : {}])),
    setup(props, { slots, attrs }) {
      const all = new Proxy(props, {
        get: (target, key) => key in target ? Reflect.get(target, key) : attrs[key as string],
        ownKeys: (target) => [...new Set([...Reflect.ownKeys(target), ...Reflect.ownKeys(attrs)])],
        getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
      })
      return setup(all as P, slots)
    },
  }) as unknown as FunctionalComponent<Omit<P, "children"> & { children?: VNodeChild }>
}

export function createState<T>(initial: T | (() => T)): [ShallowRef<T>, (next: T | ((current: T) => T)) => void] {
  const state = shallowRef(typeof initial === 'function' ? (initial as () => T)() : initial) as ShallowRef<T>
  return [state, (next) => { state.value = typeof next === 'function' ? (next as (current: T) => T)(state.value) : next }]
}
export function templateRef<T>(initial: T): ShallowRef<T>;
export function templateRef<T>(initial: null): ShallowRef<T | null>;
export function templateRef<T>(initial: T | null): ShallowRef<T | null> { return shallowRef(initial) as ShallowRef<T | null> }

/** Effects run after DOM refs exist, rerun on declared reactive inputs, and dispose on unmount. */
export function watchLifecycle(effect: () => void | (() => void), sources: () => unknown[] = () => []) {
  let stop: (() => void) | undefined
  onMounted(() => {
    stop = watch(sources, (_value, _old, onCleanup) => {
      const cleanup = effect()
      if (typeof cleanup === 'function') onCleanup(cleanup)
    }, { immediate: true, flush: 'post' })
  })
  onBeforeUnmount(() => stop?.())
}

const unitless = new Set(['animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice', 'borderImageWidth', 'columnCount', 'flex', 'flexGrow', 'flexShrink', 'fontWeight', 'gridArea', 'gridColumn', 'gridColumnEnd', 'gridColumnStart', 'gridRow', 'gridRowEnd', 'gridRowStart', 'lineHeight', 'opacity', 'order', 'orphans', 'scale', 'tabSize', 'widows', 'zIndex', 'zoom', 'fillOpacity', 'strokeDashoffset', 'strokeOpacity', 'strokeWidth'])
export function cssStyle(style: unknown): CSSProperties {
  if (!style || typeof style !== 'object') return style as CSSProperties
  return Object.fromEntries(Object.entries(style).map(([key, value]) => [key, typeof value === 'number' && value !== 0 && !key.startsWith('--') && !unitless.has(key) ? `${value}px` : value])) as CSSProperties
}
export function omitProps<P extends object>(props: P, names: string[]) { return Object.fromEntries(Object.entries(props).filter(([key]) => !names.includes(key))) }
export function teleport(children: VNodeChild, target: Element | string) { return h(Teleport, { to: target }, children as never) }
