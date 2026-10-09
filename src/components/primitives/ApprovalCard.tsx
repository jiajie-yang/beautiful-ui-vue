// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { CSSProperties } from '@/lib/dom-types';
import { Button } from "@/components/atoms/Button";
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * APPROVAL CARD (human-in-the-loop)
 * One question at a time. The stack slides vertically as you
 * move between questions (the card's height animates to fit),
 * the step counter rolls like an odometer, and the footer uses
 * pill actions — a quiet Skip and a dark Continue with a ⏎.
 * Single-choice answers auto-advance; multi-select waits.
 * ───────────────────────────────────────────────────────── */

export type ApprovalQuestion = {
  q: string;
  type: "radio" | "check";
  options: string[];
};
const QUESTIONS: ApprovalQuestion[] = [{
  q: "How many flavors should we launch?",
  type: "radio",
  options: ["Three (core line)", "Five (full case)", "Just one hero"]
}, {
  q: "Which mix-ins should we stock?",
  type: "check",
  options: ["Chocolate chips", "Waffle bits", "Sprinkles"]
}, {
  q: "Which market do we enter first?",
  type: "radio",
  options: ["Food trucks", "Grocery freezers", "Scoop shops"]
}];
export type ApprovalLabels = {
  skip: string;
  continue: string;
  send: string;
  customPlaceholder: string;
  sentMessage: string;
};
const DEFAULT_LABELS: ApprovalLabels = {
  skip: "Skip",
  continue: "Continue",
  send: "Send",
  customPlaceholder: "Something else…",
  sentMessage: "Answers sent"
};
const ROLL_MS = 400;
const SLIDE = "360ms cubic-bezier(0.22, 1, 0.36, 1)";

/* odometer digits — each character that changes rolls up (or down) */
const RollingDigits = createComponent<{
  value: string;
}>("RollingDigits", ["value"], (__props, __slots) => {
  const value = computed(() => __props.value);
  const prevRef = templateRef(value.value);
  const [oldVal, setOldVal] = createState(value.value);
  const [newVal, setNewVal] = createState(value.value);
  const [rolling, setRolling] = createState(false);
  const [shifted, setShifted] = createState(false);
  const [dir, setDir] = createState<"up" | "down">("up");
  watchLifecycle(() => {
    if (prevRef.value === value.value) return;
    const from = prevRef.value;
    prevRef.value = value.value;
    const fromN = parseInt(from, 10);
    const toN = parseInt(value.value, 10);
    setDir(Number.isFinite(fromN) && Number.isFinite(toN) && toN < fromN ? "down" : "up");
    setOldVal(from);
    setNewVal(value.value);
    setRolling(true);
    setShifted(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShifted(true));
    });
    const done = setTimeout(() => {
      setRolling(false);
      setOldVal(value.value);
      setShifted(false);
    }, ROLL_MS);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(done);
    };
  }, () => [value.value]);
  const chars = computed(() => rolling.value ? newVal.value : oldVal.value);
  return () => {
    return <>
      {Array.from({
        length: chars.value.length
      }, (_, i) => {
        const o = oldVal.value[i] ?? "";
        const n = chars.value[i] ?? "";
        if (!rolling.value || o === n) {
          return <span key={`${i}-${n}`}>{n}</span>;
        }
        const top = dir.value === "down" ? n : o;
        const bottom = dir.value === "down" ? o : n;
        const restY = dir.value === "down" ? "0" : "-1em";
        const startY = dir.value === "down" ? "-1em" : "0";
        return <span key={`${i}-${o}-${n}-${dir.value}`} style={cssStyle({
          display: "inline-block",
          position: "relative",
          overflow: "hidden",
          height: "1em",
          lineHeight: "1em",
          verticalAlign: "-0.05em"
        })}>
            <span style={cssStyle({
            display: "flex",
            flexDirection: "column",
            transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform: `translateY(${shifted.value ? restY : startY})`
          })}>
              <span style={cssStyle({
              height: "1em",
              lineHeight: "1em"
            })}>{top}</span>
              <span style={cssStyle({
              height: "1em",
              lineHeight: "1em"
            })}>{bottom}</span>
            </span>
          </span>;
      })}
    </>;
  };
});
const Ico = createComponent<{
  path: UI.VNodeChild;
  size?: number;
  sw?: number;
}>("Ico", ["path", "size", "sw"], (__props, __slots) => {
  const path = computed(() => __props.path);
  const size = computed(() => __props.size === undefined ? 14 : __props.size);
  const sw = computed(() => __props.sw === undefined ? 2 : __props.sw);
  return () => {
    return <svg width={size.value} height={size.value} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={sw.value} stroke-linecap="round" stroke-linejoin="round" aria-hidden>
      {path.value}
    </svg>;
  };
});
const ApprovalCard = createComponent<{
  questions?: ApprovalQuestion[];
  labels?: Partial<ApprovalLabels>;
  onSubmitted?: (answers: Record<number, number[]>) => void;
  onAnswerChange?: (questionIndex: number, answer: number[]) => void;
  resettable?: boolean;
  variant?: string;
}>("ApprovalCard", ["questions", "labels", "onSubmitted", "onAnswerChange", "resettable", "variant"], (__props, __slots) => {
  const questions = computed(() => __props.questions === undefined ? QUESTIONS : __props.questions);
  const labels = computed(() => __props.labels);
  const onSubmitted = computed(() => __props.onSubmitted);
  const onAnswerChange = computed(() => __props.onAnswerChange);
  const resettable = computed(() => __props.resettable === undefined ? true : __props.resettable);
  const t = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const [qi, setQi] = createState(0);
  const [answers, setAnswers] = createState<Record<number, number[]>>({});
  const [custom, setCustom] = createState<Record<number, string>>({});
  const [sent, setSent] = createState(false);
  const [open, setOpen] = createState(true);
  const advanceTimer = templateRef<ReturnType<typeof setTimeout> | null>(null);
  const questionRefs = templateRef<(HTMLDivElement | null)[]>([]);
  const measured = templateRef(false);
  const [viewportH, setViewportH] = createState<number | undefined>(undefined);
  const [trackY, setTrackY] = createState(0);
  const [animate, setAnimate] = createState(false);
  // Until the first question is measured, render only the active one so the
  // initial (and SSR) height is Q1's height — not all questions stacked, which
  // would flash to full height and then shrink on mount.
  const [ready, setReady] = createState(false);
  const last = computed(() => qi.value === questions.value.length - 1);
  const selected = computed(() => answers.value[qi.value] ?? []);
  const hasAnswer = computed(() => selected.value.length > 0 || Boolean(custom.value[qi.value]?.trim()));
  const sync = (withAnim: boolean) => {
    const item = questionRefs.value[qi.value];
    if (!item) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setViewportH(item.offsetHeight);
    setTrackY(item.offsetTop);
    setAnimate(withAnim && !reduce);
  };
  watchLifecycle(() => {
    const withAnim = measured.value;
    measured.value = true;
    sync(withAnim);
    setReady(true);
    
  }, () => [qi.value, answers.value, custom.value, open.value, sent.value]);
  watchLifecycle(() => {
    const id = requestAnimationFrame(() => sync(measured.value));
    return () => cancelAnimationFrame(id);
    
  }, () => [qi.value]);
  watchLifecycle(() => () => {
    if (advanceTimer.value) clearTimeout(advanceTimer.value);
  }, () => []);
  const goTo = (next: number) => {
    if (advanceTimer.value) clearTimeout(advanceTimer.value);
    setQi(Math.min(Math.max(next, 0), questions.value.length - 1));
  };
  const send = () => {
    if (advanceTimer.value) clearTimeout(advanceTimer.value);
    setSent(true);
    onSubmitted.value?.(answers.value);
  };
  const advance = () => {
    if (last.value) send();else goTo(qi.value + 1);
  };
  const toggle = (index: number) => {
    const type = questions.value[qi.value].type;
    setAnswers(current => {
      const picked = current[qi.value] ?? [];
      const next = type === "radio" ? [index] : picked.includes(index) ? picked.filter(item => item !== index) : [...picked, index];
      onAnswerChange.value?.(qi.value, next);
      return {
        ...current,
        [qi.value]: next
      };
    });
    if (type === "radio") {
      setCustom(current => ({
        ...current,
        [qi.value]: ""
      }));
      if (advanceTimer.value) clearTimeout(advanceTimer.value);
      advanceTimer.value = setTimeout(() => {
        if (last.value) send();else setQi(current => Math.min(questions.value.length - 1, current + 1));
      }, 480);
    }
  };
  const reset = () => {
    setQi(0);
    setAnswers({});
    setCustom({});
    setSent(false);
    setOpen(true);
    measured.value = false;
  };
  return () => {
    if (!open.value) {
      return <button type="button" onClick={() => setOpen(true)} class="rounded-control bg-surface px-3 py-2 text-[12.5px] font-medium text-ink shadow-btn transition-colors duration-150 hover:bg-hover">
        Open approval
      </button>;
    }
    if (sent.value) {
      return <div class="flex w-full max-w-80 items-center gap-3" style={cssStyle({
        animation: "pop-in 260ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-green-tint py-1 pr-2.5 pl-1 text-[12.5px] font-medium text-green">
          <span class="flex size-4.5 items-center justify-center rounded-full bg-green text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
          {t.value.sentMessage}
        </span>
        {resettable.value && <button type="button" onClick={reset} class="text-[12px] font-medium text-ink-3 transition-colors duration-150 hover:text-ink">
            Start over
          </button>}
      </div>;
    }
    return <div class="w-full max-w-80">
      <div class="relative overflow-hidden rounded-card bg-surface shadow-card" style={cssStyle({
        animation: "fade-up 380ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
        <button type="button" aria-label="Dismiss" onClick={() => setOpen(false)} class="primitive-icon-button absolute right-2.5 top-2.5 z-10 text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink">
          <Ico size={14} sw={2.2} path={<path d="M18 6L6 18M6 6l12 12" />} />
        </button>
        <div class="primitive-card-pad">
          {/* the question itself is the heading */}
          <div class="overflow-hidden" style={cssStyle({
            height: viewportH.value,
            transition: animate.value ? `height ${SLIDE}` : undefined
          })} aria-live="polite">
            <div style={cssStyle({
              display: "flex",
              flexDirection: "column",
              gap: 26,
              transform: `translate3d(0, ${-trackY.value}px, 0)`,
              transition: animate.value ? `transform ${SLIDE}` : undefined,
              willChange: "transform"
            })}>
              {questions.value.map((question, qIdx) => {
                const active = qIdx === qi.value;
                // Before the first measure, mount only the active question so the
                // card opens at its real height instead of flashing to full height.
                if (!ready.value && !active) return null;
                const picked = answers.value[qIdx] ?? [];
                const questionStyle: CSSProperties = {
                  opacity: active ? 1 : 0,
                  transition: animate.value ? `opacity ${SLIDE}` : undefined,
                  pointerEvents: active ? undefined : "none"
                };
                return <div key={qIdx} ref={(el: any) => {
                  questionRefs.value[qIdx] = el;
                }} aria-hidden={active ? undefined : true} style={cssStyle(questionStyle)}>
                    <div class="pr-7 text-[14px] font-medium text-ink">{question.q}</div>
                    <GlideMenu className="mt-2.5 flex flex-col gap-1" highlightClassName="inset-x-0 rounded-control bg-hover">
                      {question.options.map((option, i) => {
                      const on = picked.includes(i);
                      return <button key={option} type="button" data-menu-row aria-pressed={on} tabindex={active ? 0 : -1} onClick={() => {
                        if (active) toggle(i);
                      }} class="relative z-10 flex items-center gap-1.5 rounded-control pl-1 pr-2 py-1 text-left transition-colors duration-100">
                            <span class={`flex size-4 shrink-0 items-center justify-center transition-colors duration-200
                                ${question.type === "radio" ? "rounded-full" : "rounded-[5px]"}
                                ${on ? "bg-ink text-canvas" : "shadow-[inset_0_0_0_1.5px_var(--line-strong)] text-transparent"}`}>
                              {question.type === "radio" ? <span class="size-1.5 rounded-full bg-canvas transition-transform duration-200" style={cssStyle({
                            transform: on ? "scale(1)" : "scale(0)"
                          })} /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                            </span>
                            <span class={`text-[13px] leading-none transition-colors duration-200 ${on ? "text-ink" : "text-ink-2"}`}>
                              {option}
                            </span>
                          </button>;
                    })}
                      <label data-menu-row class="relative z-10 flex items-center gap-1.5 rounded-control pl-1 pr-2 py-1 transition-colors duration-100">
                        <input value={custom.value[qIdx] ?? ""} tabindex={active ? 0 : -1} onInput={event => {
                        if (!active) return;
                        setCustom(current => ({
                          ...current,
                          [qIdx]: (event.target as HTMLInputElement).value
                        }));
                        if (question.type === "radio") setAnswers(current => ({
                          ...current,
                          [qIdx]: []
                        }));
                      }} onKeydown={event => {
                        if (event.key === "Enter" && hasAnswer.value) {
                          event.preventDefault();
                          advance();
                        }
                      }} placeholder={t.value.customPlaceholder} aria-label="Custom answer" class="min-w-0 flex-1 bg-transparent pl-1.5 text-[13px] text-ink outline-none placeholder:text-ink-3" />
                      </label>
                    </GlideMenu>
                  </div>;
              })}
            </div>
          </div>
        </div>

        {/* footer — step nav (rolling counter) + pill actions */}
        <div class="primitive-card-footer flex items-center justify-between gap-3">
          <div class="flex items-center gap-1 text-ink-3">
            <button type="button" aria-label="Previous question" disabled={qi.value <= 0} onClick={() => goTo(qi.value - 1)} class="flex size-[18px] items-center justify-center rounded-[5px] transition-colors duration-100 enabled:hover:text-ink disabled:opacity-30">
              <Ico size={14} path={<path d="M18 15l-6-6-6 6" />} />
            </button>
            <span class="inline-flex items-center text-[12px] font-medium tabular-nums text-ink-3" style={cssStyle({
              letterSpacing: "-0.1px",
              lineHeight: 1
            })}>
              <RollingDigits value={`${qi.value + 1} / ${questions.value.length}`} />
            </span>
            <button type="button" aria-label="Next question" disabled={last.value} onClick={() => goTo(qi.value + 1)} class="flex size-[18px] items-center justify-center rounded-[5px] transition-colors duration-100 enabled:hover:text-ink disabled:opacity-30">
              <Ico size={14} path={<path d="M6 9l6 6 6-6" />} />
            </button>
          </div>

          <div class="-mr-0.5 flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => last.value ? setOpen(false) : goTo(qi.value + 1)}>
              {t.value.skip}
            </Button>
            <Button variant="accent" size="sm" disabled={!hasAnswer.value} onClick={advance}>
              {last.value ? t.value.send : t.value.continue}
            </Button>
          </div>
        </div>
      </div>
    </div>;
  };
}, { resettable: Boolean });
export default ApprovalCard;
