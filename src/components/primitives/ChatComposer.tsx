// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * CHAT — interactive panel with tabs, replies, and composer.
 * The reply sequence begins only after the user sends.
 * ───────────────────────────────────────────────────────── */

type Phase = "idle" | "sent" | "reply1" | "reply2" | "done";

/* one scripted agent reply in the thread */
export type ChatMessage = {
  label: string;
  sub: string;
  time: string;
  body: string;
};
const MESSAGES: ChatMessage[] = [{
  label: "Sales History",
  sub: "Flavor Data",
  time: "4s",
  body: "Pulled 3 summers of mint chip sales for comparison."
}, {
  label: "Comparison",
  sub: "Trend Detection",
  time: "2s",
  body: "Mint chip is up 12% with stronger weekend peaks."
}];
const SUGGESTIONS = ["Flavors", "Suppliers"];
export type ChatComposerLabels = {
  /** the pre-filled prompt shown in the first user bubble */
  initialPrompt: string;
  /** composer input placeholder */
  placeholder: string;
};
const DEFAULT_LABELS: ChatComposerLabels = {
  initialPrompt: "Compare mint chip to last summer",
  placeholder: "Prompt or tag a flavor with @"
};
const Section = createComponent<{
  label: string;
  sub: string;
  time: string;
  body: string;
  resolving?: boolean;
}>("Section", ["label", "sub", "time", "body", "resolving"], (__props, __slots) => {
  const label = computed(() => __props.label);
  const sub = computed(() => __props.sub);
  const time = computed(() => __props.time);
  const body = computed(() => __props.body);
  const resolving = computed(() => __props.resolving);
  return () => {
    return <div class="flex w-full flex-col gap-1.5 transition-[opacity,filter,transform] duration-400" style={cssStyle({
      opacity: resolving.value ? 0.55 : 1,
      filter: resolving.value ? "blur(0.5px)" : "blur(0)",
      transform: resolving.value ? "scale(0.985)" : "scale(1)",
      transformOrigin: "top left",
      transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
      animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both"
    })}>
      <div class="flex items-center gap-1 text-[12px] leading-[1.3]">
        <span class="font-medium text-ink">{label.value}</span>
        <span class="text-ink-2">{sub.value}</span>
        <span class="text-ink">for {time.value}</span>
      </div>
      <p class="text-[13px] leading-normal text-ink">{body.value}</p>
    </div>;
  };
});
const ChatComposer = createComponent<{
  variant?: string;
  /** scripted agent replies revealed in sequence after the user sends */
  messages?: ChatMessage[];
  /** header chips (tabs) for switching context */
  suggestions?: string[];
  /** prominent copy strings */
  labels?: Partial<ChatComposerLabels>;
  /** fired with the trimmed prompt text when the user sends */
  onSend?: (text: string) => void;
}>("ChatComposer", ["variant", "messages", "suggestions", "labels", "onSend"], (__props, __slots) => {
  const messages = computed(() => __props.messages === undefined ? MESSAGES : __props.messages);
  const suggestions = computed(() => __props.suggestions === undefined ? SUGGESTIONS : __props.suggestions);
  const labels = computed(() => __props.labels);
  const onSend = computed(() => __props.onSend);
  const l = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const [phase, setPhase] = createState<Phase>("done");
  const [draft, setDraft] = createState("");
  const [submitted, setSubmitted] = createState(l.value.initialPrompt);
  const [tab, setTab] = createState(suggestions.value[0] ?? "");
  const inputRef = templateRef<HTMLInputElement>(null);
  watchLifecycle(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase.value === "sent") t = setTimeout(() => setPhase("reply1"), 500);else if (phase.value === "reply1") t = setTimeout(() => setPhase("reply2"), 1400);else if (phase.value === "reply2") t = setTimeout(() => setPhase("done"), 1200);else return;
    return () => clearTimeout(t);
  }, () => [phase.value]);
  const sent = computed(() => phase.value !== "idle");
  const canSend = computed(() => draft.value.trim().length > 0);
  const send = () => {
    if (!canSend.value) return;
    const text = draft.value.trim();
    setSubmitted(text);
    onSend.value?.(text);
    setDraft("");
    setPhase("sent");
  };
  return () => {
    return <div class="flex h-[288px] w-full max-w-95 flex-col self-start overflow-hidden rounded-[14px] bg-surface shadow-card">
      {/* header — tabs + actions */}
      <div class="flex shrink-0 items-center justify-between border-b border-line p-1.5">
        <div class="flex items-center">
          {suggestions.value.map(item => <button key={item} type="button" aria-pressed={tab.value === item} onClick={() => setTab(item)} class={`rounded-[6px] px-2 py-[3px] text-[13px] text-ink transition-[background-color,opacity] duration-100 ${tab.value === item ? "bg-field" : "opacity-50 hover:opacity-75"}`}>
              {item}
            </button>)}
        </div>
        <div class="flex items-center gap-1">
          {[<path key="p" d="M12 5v14M5 12h14" />, <g key="h"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>, <g key="e" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></g>].map((icon, i) => <button key={i} type="button" aria-label="Action" class="flex size-6 items-center justify-center rounded-[6px] text-ink-3
                transition-colors duration-100 hover:bg-hover hover:text-ink-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                {icon}
              </svg>
            </button>)}
        </div>
      </div>

      {/* conversation — fixed region so the card never changes shape */}
      <div class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pt-2.5 pb-1">
        {/* user bubble — right aligned, soft block */}
        <div class="flex justify-end pl-14">
          <div class="rounded-xl bg-field px-3 py-1.5 text-[13px] leading-[1.4] text-ink
              transition-[opacity,transform] duration-300" style={cssStyle({
            opacity: sent.value ? 1 : 0,
            transform: sent.value ? "translateY(0)" : "translateY(10px)",
            transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)"
          })}>
            {submitted.value}
          </div>
        </div>

        {messages.value[0] && (phase.value === "reply1" || phase.value === "reply2" || phase.value === "done") ? <Section label={messages.value[0].label} sub={messages.value[0].sub} time={messages.value[0].time} body={messages.value[0].body} /> : null}
        {messages.value[1] && (phase.value === "reply2" || phase.value === "done") ? <Section label={messages.value[1].label} sub={messages.value[1].sub} time={messages.value[1].time} body={messages.value[1].body} resolving={phase.value === "reply2"} /> : null}
      </div>

      {/* composer */}
      <div class="mt-auto shrink-0 p-1.5">
        <div role="presentation" onClick={() => inputRef.value?.focus()} class="flex cursor-text flex-col gap-2 rounded-control border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
          <input ref={inputRef} value={draft.value} onInput={event => setDraft((event.target as HTMLInputElement).value)} onKeydown={event => {
            if (event.key === "Enter") send();
          }} placeholder={l.value.placeholder} aria-label="Chat prompt" class="min-h-4.5 bg-transparent text-[13px] leading-[1.4] text-ink outline-none placeholder:text-ink-3" />
          <div class="flex items-center justify-end">
            <button type="button" aria-label="Send" disabled={!canSend.value} onClick={send} class="flex size-7 items-center justify-center rounded-[8px]
                transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.96]" style={cssStyle({
              background: canSend.value ? "var(--ink)" : "var(--line-strong)",
              color: canSend.value ? "var(--surface)" : "var(--ink-2)"
            })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>;
  };
});
export default ChatComposer;
