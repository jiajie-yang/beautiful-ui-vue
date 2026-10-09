// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { VNodeChild } from '@/lib/dom-types';
import { ArrowUp, ChatBubbleQuestion, Check, EmojiSatisfied, NavArrowRight, Refresh, Scissor, Spark, TextBox, Xmark } from "@/lib/selection-icons";
import { Button } from "@/components/atoms/Button";
import { Shimmer } from "@/components/atoms/Shimmer";
import { StreamText } from "@/components/atoms/StreamText";

/* ─────────────────────────────────────────────────────────
 * SELECTION ACTIONS
 * A contextual AI bar attached beneath selected text.
 * The global theme owns its surface; this component only
 * composes existing surface, ink, accent, radius and motion
 * tokens.
 * ───────────────────────────────────────────────────────── */

const LEAD = "Pistachio holds the top slot all weekend. ";
const PICKED = "Churn it first thing Saturday so the batch has time to firm up before the afternoon rush.";
const REWRITE = "Churn pistachio first thing Saturday so the batch has time to fully firm before the afternoon rush.";

/* The passage: lead-in text, the selected `original`, and the streamed `rewrite`. */
export type SelectionText = {
  lead: string;
  original: string;
  rewrite: string;
};

/* A single AI action offered in the bar. Omit `action` for a no-op button
 * (e.g. Explain); `busyLabel` is the gerund shown while it runs. */
export type SelectionAction = {
  id: string;
  icon: VNodeChild;
  action?: string;
  busyLabel?: string;
};

/* The action set: `primary` are always visible; `more` reveal on expand. */
export type SelectionActionSet = {
  primary: SelectionAction[];
  more: SelectionAction[];
};

/* Prominent copy strings. */
export type SelectionActionsLabels = {
  keep: string;
  discard: string;
  placeholder: string;
};
const DEFAULT_TEXT: SelectionText = {
  lead: LEAD,
  original: PICKED,
  rewrite: REWRITE
};
const DEFAULT_LABELS: SelectionActionsLabels = {
  keep: "Keep",
  discard: "Discard",
  placeholder: "Describe edits"
};
type Mode = "idle" | "thinking" | "streaming" | "result";
const iconProps = {
  width: 14,
  height: 14,
  strokeWidth: 1.8,
  "aria-hidden": true
} as const;
const icons = {
  explain: <ChatBubbleQuestion {...iconProps} />,
  improve: <Spark {...iconProps} />,
  shorten: <Scissor {...iconProps} />,
  tone: <EmojiSatisfied {...iconProps} />,
  grammar: <TextBox {...iconProps} />,
  send: <ArrowUp width="16" height="16" strokeWidth="2.4" aria-hidden="true" />,
  chevron: <NavArrowRight {...iconProps} />,
  check: <Check {...iconProps} />,
  close: <Xmark {...iconProps} />,
  retry: <Refresh {...iconProps} />
};

/* the single "keep" affirm — solid ink with a hairline (not the atom's filled
 * highlight) shadow, so it stays a local one-off rather than a Button variant */
const primary = "inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 text-[12.5px] font-normal text-canvas shadow-hairline transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.96]";
const DEFAULT_ACTIONS: SelectionActionSet = {
  primary: [{
    id: "Explain",
    icon: icons.explain
  }, {
    id: "Improve",
    icon: icons.improve,
    action: "Improve",
    busyLabel: "Improving"
  }],
  more: [{
    id: "Shorten",
    icon: icons.shorten,
    action: "Shorten",
    busyLabel: "Shortening"
  }, {
    id: "Tone",
    icon: icons.tone,
    action: "Change tone",
    busyLabel: "Changing tone"
  }, {
    id: "Grammar",
    icon: icons.grammar,
    action: "Fix grammar"
  }]
};
export type SelectionActionsProps = {
  /** Accepted for gallery/registry parity; not used by this bar. */
  variant?: string;
  /** The passage shown above the bar. */
  text?: Partial<SelectionText>;
  /** The AI actions offered in the bar. */
  actions?: SelectionActionSet;
  /** Prominent copy strings. */
  labels?: Partial<SelectionActionsLabels>;
  /** Called with the action name whenever an edit is run. */
  onAction?: (action: string) => void;
};
const SelectionActions = createComponent<SelectionActionsProps>("SelectionActions", ["variant", "text", "actions", "labels", "onAction"], (__props, __slots) => {
  const textProp = computed(() => __props.text);
  const actions = computed(() => __props.actions === undefined ? DEFAULT_ACTIONS : __props.actions);
  const labels = computed(() => __props.labels);
  const onAction = computed(() => __props.onAction);
  const passage = computed(() => ({
    ...DEFAULT_TEXT,
    ...textProp.value
  }));
  const copy = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const [shown, setShown] = createState(false);
  const [mode, setMode] = createState<Mode>("idle");
  const [action, setAction] = createState("Improve");
  const [prompt, setPrompt] = createState("");
  const [typingWidth, setTypingWidth] = createState<number | null>(null);
  const [expanded, setExpanded] = createState(false);
  const [anchor, setAnchor] = createState({
    x: 0,
    y: 0
  });
  const [positioned, setPositioned] = createState(false);
  const hostRef = templateRef<HTMLDivElement>(null);
  const selectionRef = templateRef<HTMLSpanElement>(null);
  const barRef = templateRef<HTMLDivElement>(null);
  const contentRef = templateRef<HTMLDivElement>(null);
  const frameRef = templateRef<number | null>(null);
  const previousModeRef = templateRef<Mode>("idle");
  const lastWidthRef = templateRef(0);
  const widthAnimationRef = templateRef<Animation | null>(null);
  watchLifecycle(() => {
    const timer = window.setTimeout(() => setShown(true), 280);
    return () => window.clearTimeout(timer);
  }, () => []);
  watchLifecycle(() => {
    if (mode.value !== "thinking") return;
    const timer = window.setTimeout(() => setMode("streaming"), 700);
    return () => window.clearTimeout(timer);
  }, () => [mode.value]);

  /* Attach beneath the final selected line, while centering the bar
   * against the complete selection bounds. requestAnimationFrame batches
   * streaming reflow measurements and avoids visible intermediate positions. */
  const place = () => {
    if (frameRef.value !== null) cancelAnimationFrame(frameRef.value);
    frameRef.value = requestAnimationFrame(() => {
      const host = hostRef.value;
      const selection = selectionRef.value;
      if (!host || !selection) return;
      const bounds = selection.getBoundingClientRect();
      const lines = Array.from(selection.getClientRects());
      const lastLine = lines.at(-1);
      if (!lastLine) return;
      const hostBounds = host.getBoundingClientRect();
      const next = {
        x: Math.round(bounds.left - hostBounds.left + bounds.width / 2),
        y: Math.round(lastLine.bottom - hostBounds.top + 8)
      };
      setAnchor(current => current.x === next.x && current.y === next.y ? current : next);
      setPositioned(true);
    });
  };
  watchLifecycle(() => {
    place();
  }, () => [mode.value, place]);
  watchLifecycle(() => {
    const host = hostRef.value;
    if (!host) return;
    const observer = new ResizeObserver(place);
    observer.observe(host);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      if (frameRef.value !== null) cancelAnimationFrame(frameRef.value);
    };
  }, () => [place]);

  /* Intrinsic width handles the preset expansion. When the entire content
   * changes between idle, loading and confirmation, animate from the last
   * rendered width to the new intrinsic width before the browser paints. */
  watchLifecycle(() => {
    const bar = barRef.value;
    const content = contentRef.value;
    if (!bar || !content) return;
    const nextWidth = Math.ceil(content.getBoundingClientRect().width) + 8;
    const previousWidth = lastWidthRef.value || Math.ceil(bar.getBoundingClientRect().width);
    if (previousModeRef.value !== mode.value && Math.abs(nextWidth - previousWidth) > 1) {
      widthAnimationRef.value?.cancel();
      const animation = bar.animate([{
        width: `${previousWidth}px`
      }, {
        width: `${nextWidth}px`
      }], {
        duration: 320,
        easing: "cubic-bezier(0.23,1,0.32,1)"
      });
      widthAnimationRef.value = animation;
      animation.onfinish = () => {
        lastWidthRef.value = nextWidth;
        widthAnimationRef.value = null;
      };
    } else {
      lastWidthRef.value = nextWidth;
    }
    previousModeRef.value = mode.value;
  }, () => [mode.value]);
  watchLifecycle(() => {
    const content = contentRef.value;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (widthAnimationRef.value?.playState === "running") return;
      lastWidthRef.value = Math.ceil(content.getBoundingClientRect().width) + 8;
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
      widthAnimationRef.value?.cancel();
    };
  }, () => []);
  const run = (nextAction: string) => {
    setAction(nextAction);
    setExpanded(false);
    setMode("thinking");
    onAction.value?.(nextAction);
  };
  const reset = () => {
    setExpanded(false);
    setPrompt("");
    setTypingWidth(null);
    setAction("Improve");
    setMode("idle");
  };
  const busy = computed(() => mode.value === "thinking" || mode.value === "streaming");
  const visible = computed(() => shown.value && positioned.value);
  const hasPrompt = computed(() => prompt.value.trim().length > 0);
  const busyLabelMap = computed(() => Object.fromEntries([...actions.value.primary, ...actions.value.more]
    .filter(item => item.action && item.busyLabel).map(item => [item.action!, item.busyLabel!])));
  const busyLabel = computed(() => busyLabelMap.value[action.value] ?? "Editing");
  return () => {
    return <div class="w-full max-w-[460px]">
      <div ref={hostRef} class="relative select-none pb-12">
        <p class="text-[13px] leading-relaxed text-ink">
          {passage.value.lead}
          <span ref={selectionRef} class="box-decoration-clone rounded-[3px] bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface))] text-ink dark:bg-accent-tint">
            {mode.value === "idle" || mode.value === "thinking" ? passage.value.original : mode.value === "streaming" ? <StreamText text={passage.value.rewrite} onProgress={place} onDone={() => setMode("result")} /> : passage.value.rewrite}
          </span>
        </p>

        <div class="absolute top-0 left-0 z-10" style={cssStyle({
          transform: `translate3d(${anchor.value.x}px, ${anchor.value.y}px, 0) translateX(-50%)`,
          transition: "transform 320ms cubic-bezier(0.77,0,0.175,1), opacity 180ms ease-out",
          opacity: visible.value ? 1 : 0,
          pointerEvents: visible.value ? "auto" : "none",
          willChange: "transform"
        })}>
          {/* A 36px pill wraps 28px controls at a 4px inset. The controls
              resolve to a 14px radius, preserving the concentric curve. */}
          <div ref={barRef} class="flex h-9 w-fit max-w-[calc(100vw-48px)] items-center justify-center gap-0.5 overflow-hidden rounded-full bg-surface p-1 font-sans font-normal text-ink shadow-overlay" style={cssStyle({
            width: mode.value === "idle" && hasPrompt.value && typingWidth.value ? typingWidth.value : undefined,
            ...(visible.value ? {
              animation: "pop-in 220ms cubic-bezier(0.23,1,0.32,1) both"
            } : {})
          })}>
            <div ref={contentRef} class="flex w-fit shrink-0 items-center justify-center gap-0.5" style={cssStyle({
              width: mode.value === "idle" && hasPrompt.value && typingWidth.value ? typingWidth.value - 8 : undefined
            })}>
            {busy.value && <span class="inline-flex h-7 items-center gap-1.5 whitespace-nowrap px-2.5 text-[12.5px] font-normal text-ink-2">
                <span class="size-3 shrink-0 rounded-full border-[1.5px] border-line-strong border-t-ink-2" style={cssStyle({
                  animation: "spin 700ms linear infinite"
                })} />
                {mode.value === "thinking" ? <Shimmer className="text-[12.5px] font-normal">
                    {busyLabel.value}…
                  </Shimmer> : <span>{busyLabel.value}…</span>}
              </span>}

            {mode.value === "result" && <>
                <button type="button" onClick={reset} class={primary}>
                  {icons.check}
                  {copy.value.keep}
                </button>
                <Button type="button" variant="quiet" size="xs" className="shrink-0" onClick={reset}>
                  {icons.close}
                  {copy.value.discard}
                </Button>
                <span class="mx-0.5 h-4 w-px shrink-0 bg-line" />
                <button type="button" aria-label="Try again" onClick={() => run(action.value)} class="flex size-7 shrink-0 items-center justify-center rounded-full text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-hover-2 hover:text-ink-2 active:scale-[0.96]">
                  {icons.retry}
                </button>
              </>}

            {mode.value === "idle" && <>
                <div class="flex min-w-0 items-center overflow-hidden transition-[max-width,opacity,transform] duration-400" style={cssStyle({
                  maxWidth: expanded.value ? 0 : hasPrompt.value && typingWidth.value ? typingWidth.value - 40 : 145,
                  opacity: expanded.value ? 0 : 1,
                  transform: expanded.value ? "translateX(-8px)" : "translateX(0)",
                  transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
                })}>
                  <form class="flex h-7 shrink-0 items-center transition-[width] duration-400" style={cssStyle({
                    width: hasPrompt.value && typingWidth.value ? typingWidth.value - 40 : 145,
                    transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
                  })} onSubmit={event => {
                    event.preventDefault();
                    run(prompt.value.trim() || "Improve");
                  }}>
                    <input value={prompt.value} onInput={event => {
                      const next = (event.target as HTMLInputElement).value;
                      if (!prompt.value.trim() && next.trim()) {
                        setTypingWidth(Math.ceil(barRef.value?.getBoundingClientRect().width ?? 0));
                      } else if (!next.trim()) {
                        setTypingWidth(null);
                      }
                      setPrompt(next);
                    }} aria-label={copy.value.placeholder} placeholder={copy.value.placeholder} class="h-7 w-full bg-transparent pr-2.5 pl-3 text-[12.5px] text-ink placeholder:text-ink-3" />
                  </form>
                </div>

                <div class="flex min-w-0 items-center gap-0.5 overflow-hidden transition-[max-width,opacity,transform] duration-400" style={cssStyle({
                  maxWidth: hasPrompt.value ? 0 : expanded.value ? 462 : 224,
                  opacity: hasPrompt.value ? 0 : 1,
                  transform: hasPrompt.value ? "translateX(-8px)" : "translateX(0)",
                  transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
                })}>
                  {!expanded.value && <span class="mx-1 h-4 w-px shrink-0 bg-line-strong" />}
                  {actions.value.primary.map(item => <Button key={item.id} type="button" variant="quiet" size="xs" className="shrink-0" onClick={item.action ? () => run(item.action!) : undefined}>
                      {item.icon}
                      {item.id}
                    </Button>)}

                  <div class="flex min-w-0 items-center gap-0.5 overflow-hidden transition-[max-width,opacity,margin] duration-400" style={cssStyle({
                    maxWidth: expanded.value ? 262 : 0,
                    opacity: expanded.value ? 1 : 0,
                    marginLeft: expanded.value ? 2 : 0,
                    transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
                  })}>
                  {actions.value.more.map(item => <Button key={item.id} type="button" variant="quiet" size="xs" className="shrink-0" onClick={item.action ? () => run(item.action!) : undefined}>
                      {item.icon}
                      {item.id}
                    </Button>)}
                  </div>

                  <span class="mx-0.5 h-4 w-px shrink-0 bg-line" />
                  <button type="button" aria-label={expanded.value ? "Show fewer actions" : "Show more actions"} aria-expanded={expanded.value} onClick={() => setExpanded(value => !value)} class="flex size-7 shrink-0 items-center justify-center rounded-full text-ink transition-[background-color,transform] duration-200 hover:bg-hover active:scale-[0.96]">
                    <span class="flex transition-transform duration-400" style={cssStyle({
                      transform: expanded.value ? "rotate(180deg)" : "rotate(0deg)",
                      transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
                    })}>
                      {icons.chevron}
                    </span>
                  </button>
                </div>

                <div class="flex min-w-0 items-center overflow-hidden transition-[max-width,opacity,transform] duration-400" style={cssStyle({
                  maxWidth: hasPrompt.value ? 30 : 0,
                  opacity: hasPrompt.value ? 1 : 0,
                  transform: hasPrompt.value ? "scale(1)" : "scale(0.88)",
                  transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
                })}>
                  <button type="button" aria-label="Send edit instruction" onClick={() => run(prompt.value.trim())} class="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-surface transition-[opacity,transform] duration-200 active:scale-[0.94]">
                    {icons.send}
                  </button>
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>

    </div>;
  };
});
export default SelectionActions;
