import type { VNodeChild as VueNodeChild, Component, CSSProperties as VueCSSProperties, ButtonHTMLAttributes as VueButtonAttributes } from 'vue'
export type VNodeChild = VueNodeChild
export type CSSProperties = VueCSSProperties
export type ComponentType<P = Record<string, unknown>> = import('vue').FunctionalComponent<P>
export type ButtonHTMLAttributes<T = HTMLButtonElement> = VueButtonAttributes & { className?: string; children?: VNodeChild }
export type SyntheticEvent<T = Element> = Event
export type FormEvent<T = Element> = SyntheticEvent<T>
export type MouseEvent<T = Element> = globalThis.MouseEvent
export type PointerEvent<T = Element> = globalThis.PointerEvent
export type KeyboardEvent<T = Element> = globalThis.KeyboardEvent
export type ChangeEvent<T = HTMLInputElement> = Event
export type FocusEvent<T = Element> = globalThis.FocusEvent

export type RefObject<T> = import('vue').ShallowRef<T>
export type VNode = import('vue').VNode
