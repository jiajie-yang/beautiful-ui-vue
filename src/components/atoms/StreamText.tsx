// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * STREAM TEXT — reusable streaming primitive
 * Reveals characters quickly (fast, like a real token stream);
 * the leading edge resolves out of a soft blur, and the caret
 * stays solid while streaming, then blinks once the text
 * settles. Inherits typography from its context, so it drops
 * into any text surface (Selection Actions, chat, etc.).
 * ───────────────────────────────────────────────────────── */

export const StreamText = createComponent<{
  text: string;
  /** characters revealed per tick — higher is faster */
  charsPerTick?: number;
  /** interval between reveals, ms */
  tickMs?: number;
  /** how many trailing characters carry the soft blur edge */
  blurTail?: number;
  /** render the caret (solid while streaming, blinks once idle) */
  caret?: boolean;
  className?: string;
  /** fires each tick — useful for re-anchoring UI to reflowing text */
  onProgress?: () => void;
  /** fires once the full string is shown */
  onDone?: () => void;
}>("StreamText", ["text", "charsPerTick", "tickMs", "blurTail", "caret", "className", "onProgress", "onDone"], (__props, __slots) => {
  const text = computed(() => __props.text);
  const charsPerTick = computed(() => __props.charsPerTick === undefined ? 2 : __props.charsPerTick);
  const tickMs = computed(() => __props.tickMs === undefined ? 9 : __props.tickMs);
  const blurTail = computed(() => __props.blurTail === undefined ? 6 : __props.blurTail);
  const caret = computed(() => __props.caret === undefined ? true : __props.caret);
  const className = computed(() => __props.className);
  const onProgress = computed(() => __props.onProgress);
  const onDone = computed(() => __props.onDone);
  const [count, setCount] = createState(0);
  watchLifecycle(() => {
    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(i + charsPerTick.value, text.value.length);
      setCount(i);
      onProgress.value?.();
      if (i >= text.value.length) {
        clearInterval(id);
        onDone.value?.();
      }
    }, tickMs.value);
    return () => clearInterval(id);
  }, () => [text.value, charsPerTick.value, tickMs.value]);
  const streaming = computed(() => count.value < text.value.length);
  const shown = computed(() => text.value.slice(0, count.value));
  const split = computed(() => streaming.value ? Math.max(0, shown.value.length - blurTail.value) : shown.value.length);
  return () => {
    return <span class={className.value}>
      {shown.value.slice(0, split.value)}
      {split.value < shown.value.length && <span class="stream-tail">{shown.value.slice(split.value)}</span>}
      {caret.value && <span aria-hidden class={`stream-caret${streaming.value ? " is-streaming" : ""}`} />}
    </span>;
  };
}, { caret: Boolean });
