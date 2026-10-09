// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { createShader, playSweep, accentChain, ACCENTS } from "@/vendor/glimm";

/* The built-in "prism" palette is only cyan→indigo→magenta, so a sweep
 * reads as blue/purple. Build a true full-spectrum rainbow instead. */
const RAINBOW = accentChain([ACCENTS.red, ACCENTS.orange, ACCENTS.yellow, ACCENTS.green, ACCENTS.cyan, ACCENTS.blue, ACCENTS.purple]);

/* ─────────────────────────────────────────────────────────
 * PROMPT BAR
 * A composer with real controls: attach, @ data sources,
 * / commands, a model picker, dictation, and send.
 * Type @ or / to open the menus; ↑↓ + Enter to pick.
 * Variants: Rounded (card radius) · Pill (full radius).
 * ───────────────────────────────────────────────────────── */
const Icon = createComponent<{
  children: UI.VNodeChild;
  size?: number;
  strokeWidth?: number;
}>("Icon", ["children", "size", "strokeWidth"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const size = computed(() => __props.size === undefined ? 15 : __props.size);
  const strokeWidth = computed(() => __props.strokeWidth === undefined ? 1.8 : __props.strokeWidth);
  return () => {
    return <svg width={size.value} height={size.value} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth.value} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {children.value}
    </svg>;
  };
});
const GLYPHS: Record<string, UI.VNodeChild> = {
  clip: <path d="m21.4 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  layers: <g><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></g>,
  globe: <g><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></g>
};

/* real product marks, inline so the file stays self-contained */
const BRANDS: Record<string, UI.VNodeChild> = {
  figma: <svg width="11" height="16" viewBox="0 0 38 57" aria-hidden="true">
      <path d="M9.5 57A9.5 9.5 0 0 0 19 47.5V38H9.5a9.5 9.5 0 0 0 0 19z" fill="#0ACF83" />
      <path d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5z" fill="#A259FF" />
      <path d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5z" fill="#F24E1E" />
      <path d="M19 0h9.5a9.5 9.5 0 1 1 0 19H19V0z" fill="#FF7262" />
      <path d="M38 28.5a9.5 9.5 0 1 1-19 0 9.5 9.5 0 0 1 19 0z" fill="#1ABCFE" />
    </svg>,
  slack: <svg width="15" height="15" viewBox="0 0 127 127" aria-hidden="true">
      <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A" />
      <path d="M47 27.2c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.7 39.7.8 47 .8c7.3 0 13.2 5.9 13.2 13.2v13.2H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.3.7 54.4.7 47.1c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0" />
      <path d="M99.9 47.1c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V47.1zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.9C66.9 6.6 72.8.7 80.1.7c7.3 0 13.2 5.9 13.2 13.2v33.2z" fill="#2EB67D" />
      <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E" />
    </svg>,
  gmail: <svg width="15" height="12" viewBox="0 0 256 193" aria-hidden="true">
      <path d="M58.182 192.05V93.14L27.507 65.077 0 49.504v125.091c0 9.658 7.825 17.455 17.455 17.455h40.727Z" fill="#4285F4" />
      <path d="M197.818 192.05h40.727c9.659 0 17.455-7.826 17.455-17.455V49.505l-31.156 17.837-27.026 25.798v98.91Z" fill="#34A853" />
      <path d="m58.182 93.14-4.174-38.647 4.174-36.989L128 69.868l69.818-52.364 4.669 34.992-4.669 40.644L128 145.504 58.182 93.14Z" fill="#EA4335" />
      <path d="M197.818 17.504V93.14L256 49.504V26.231c0-21.585-24.64-33.89-41.89-20.945l-16.292 12.218Z" fill="#FBBC04" />
      <path d="m0 49.504 26.759 20.07L58.182 93.14V17.504L41.89 5.286C24.61-7.66 0 4.646 0 26.23v23.273Z" fill="#C5221F" />
    </svg>
};
type Source = {
  key: string;
  name: string;
  desc: string;
  glyph?: string;
  brand?: string;
  attach?: boolean;
  connect?: boolean;
};
const SOURCES: Source[] = [{
  key: "attach",
  name: "Add photos & files",
  desc: "Upload from your computer",
  glyph: "clip",
  attach: true
}, {
  key: "scoop",
  name: "Scoop Data",
  desc: "Sales & churn metrics",
  glyph: "chart"
}, {
  key: "flavors",
  name: "Flavor records",
  desc: "26 makers, tags, links",
  glyph: "layers"
}, {
  key: "web",
  name: "Web search",
  desc: "Real-time news and info",
  glyph: "globe"
}, {
  key: "figma",
  name: "Figma",
  desc: "Design-to-code workflows",
  brand: "figma"
}, {
  key: "slack",
  name: "Slack",
  desc: "Read and manage Slack",
  brand: "slack"
}, {
  key: "gmail",
  name: "Gmail",
  desc: "Read and manage Gmail",
  brand: "gmail",
  connect: true
}];
const COMMANDS = [{
  key: "compare",
  name: "/compare",
  desc: "Flavor vs. last summer"
}, {
  key: "churn-plan",
  name: "/churn-plan",
  desc: "Draft a churn schedule"
}, {
  key: "restock",
  name: "/restock",
  desc: "Build a reorder list"
}, {
  key: "draft-email",
  name: "/draft-email",
  desc: "Write a supplier email"
}, {
  key: "summarize",
  name: "/summarize",
  desc: "Digest the thread so far"
}];
const MODELS = [{
  key: "sprinkles-5",
  name: "Sprinkles 5",
  tag: "Flagship"
}, {
  key: "vanilla-1",
  name: "Vanilla 1",
  tag: "Basic"
}, {
  key: "freezer-burn",
  name: "Freezer Burn 0.4",
  tag: "Stale"
}];
const FILES = ["flavor-chart.png", "summer-menu.pdf", "pos-export.csv"];
const DICTATION = "Compare pistachio weekends to last summer";

/* self-running demo: walk the @ menu, then the / menu, and repeat.
 * Any pointer or key interaction hands control to the user. */
const AUTO_STEPS: {
  draft: string;
  active?: number;
  connect?: boolean;
  modelOpen?: boolean;
  model?: string;
  hold: number;
}[] = [{
  draft: "",
  connect: false,
  model: "vanilla-1",
  hold: 1100
}, {
  draft: "@",
  active: 0,
  hold: 900
}, {
  draft: "@",
  active: 1,
  hold: 620
}, {
  draft: "@",
  active: 4,
  hold: 620
}, {
  draft: "@",
  active: 6,
  hold: 700
}, {
  draft: "@",
  active: 6,
  connect: true,
  hold: 1000
}, {
  draft: "",
  hold: 700
}, {
  draft: "/",
  active: 0,
  hold: 900
}, {
  draft: "/",
  active: 1,
  hold: 620
}, {
  draft: "/",
  active: 3,
  hold: 1000
}, {
  draft: "",
  hold: 800
},
// open the model picker and upgrade to the flagship → rainbow sweep
{
  draft: "",
  modelOpen: true,
  hold: 1200
}, {
  draft: "",
  model: "sprinkles-5",
  hold: 2400
}, {
  draft: "",
  hold: 900
}];

/* the last @word or /word being typed, if any */
function parseToken(draft: string): {
  kind: "at" | "slash";
  query: string;
  start: number;
} | null {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!match) return null;
  return {
    kind: match[2] === "@" ? "at" : "slash",
    query: match[3].toLowerCase(),
    start: match.index + match[1].length
  };
}
const PromptBar = createComponent<{
  variant?: string;
  /** the self-running walkthrough; turn off when embedding in a real surface */
  demo?: boolean;
  /** hero sizing: a multi-line input with controls on their own row */
  tall?: boolean;
  placeholder?: string;
  onSend?: (text: string) => void;
}>("PromptBar", ["variant", "demo", "tall", "placeholder", "onSend"], (__props, __slots) => {
  const variant = computed(() => __props.variant === undefined ? "Rounded" : __props.variant);
  const demo = computed(() => __props.demo === undefined ? true : __props.demo);
  const tall = computed(() => __props.tall === undefined ? false : __props.tall);
  const placeholder = computed(() => __props.placeholder);
  const onSend = computed(() => __props.onSend);
  const pill = computed(() => variant.value === "Pill");
  const [draft, setDraft] = createState("");
  const [dismissed, setDismissed] = createState(false);
  const [plusOpen, setPlusOpen] = createState(false);
  const [modelOpen, setModelOpen] = createState(false);
  const [model, setModel] = createState(MODELS[1]);
  const [attachments, setAttachments] = createState<string[]>([]);
  const [connected, setConnected] = createState(false);
  const [active, setActive] = createState(0);
  const [listening, setListening] = createState(false);
  const [auto, setAuto] = createState(demo.value);
  const [autoStep, setAutoStep] = createState(0);
  const [expanded, setExpanded] = createState(false);
  const wide = computed(() => expanded.value || tall.value);
  const [rowBox, setRowBox] = createState<{
    top: number;
    height: number;
  } | null>(null);
  const [engaged, setEngaged] = createState(false);
  const [modelBox, setModelBox] = createState<{
    top: number;
    height: number;
  } | null>(null);
  const [modelHovered, setModelHovered] = createState<number | null>(null);
  const [modelMenuLeft, setModelMenuLeft] = createState(0);
  const [modelMenuBottom, setModelMenuBottom] = createState(0);
  const composerAnchorRef = templateRef<HTMLDivElement>(null);
  const controlsRef = templateRef<HTMLDivElement>(null);
  const inputRef = templateRef<HTMLTextAreaElement>(null);
  const measureRef = templateRef<HTMLSpanElement>(null);
  const modelRef = templateRef<HTMLButtonElement>(null);
  const rowRefs = templateRef<(HTMLButtonElement | null)[]>([]);
  const modelRowRefs = templateRef<(HTMLButtonElement | null)[]>([]);
  const glimmRef = templateRef<HTMLCanvasElement>(null);
  const shaderRef = templateRef<ReturnType<typeof createShader> | null>(null);
  const sweepingRef = templateRef(false);

  /* hand control to the user: stop the demo loop, and when they aim at
   * the input itself, clear the demo's leftover draft for a clean start */
  const takeOver = (event: {
    target: EventTarget | null;
  }) => {
    const wasAuto = auto.value;
    setAuto(false);
    if (wasAuto && event.target === inputRef.value) setDraft("");
  };
  const token = computed(() => dismissed.value ? null : parseToken(draft.value));
  const menu: ComputedRef<"at" | "slash" | null> = computed(() => plusOpen.value ? "at" : token.value?.kind ?? null);
  const query = computed(() => plusOpen.value ? "" : token.value?.query ?? "");
  const rows: ComputedRef<{
    key: string;
    name: string;
    desc: string;
  }[]> = computed(() => menu.value === "at" ? SOURCES.filter(s => s.name.toLowerCase().includes(query.value)) : menu.value === "slash" ? COMMANDS.filter(c => c.name.slice(1).startsWith(query.value)) : []);
  watchLifecycle(() => {
    setActive(0);
    setEngaged(false);
  }, () => [menu.value, query.value]);

  /* a single highlight glides to the active row instead of each row
   * toggling its own background — matches the gliding pill in the nav */
  watchLifecycle(() => {
    const target = rowRefs.value[active.value];
    if (target) setRowBox({
      top: target.offsetTop,
      height: target.offsetHeight
    });
  }, () => [menu.value, query.value, active.value, connected.value, rows.value.length]);

  /* same gliding highlight in the model menu — floats to the hovered
   * row, falling back to the currently-selected model */
  const modelIndex = computed(() => MODELS.findIndex(m => m.key === model.value.key));
  watchLifecycle(() => {
    if (!modelOpen.value) return;
    const target = modelRowRefs.value[modelHovered.value ?? modelIndex.value];
    if (target) setModelBox({
      top: target.offsetTop,
      height: target.offsetHeight
    });
  }, () => [modelOpen.value, modelHovered.value, modelIndex.value]);

  /* The menu is outside the clipped composer, so align it to the model
   * trigger by measurement instead of pinning it to the far-right edge. */
  watchLifecycle(() => {
    if (!modelOpen.value || !composerAnchorRef.value || !modelRef.value) return;
    const anchorRect = composerAnchorRef.value.getBoundingClientRect();
    const triggerRect = modelRef.value.getBoundingClientRect();
    setModelMenuLeft(Math.max(0, Math.min(triggerRect.left - anchorRect.left, anchorRect.width - 176)));
    setModelMenuBottom(anchorRect.bottom - triggerRect.top + 8);
  }, () => [modelOpen.value, wide.value, model.value.name]);
  watchLifecycle(() => {
    if (!modelOpen.value) setModelHovered(null);
  }, () => [modelOpen.value]);

  /* Build the shader with a pinned hue phase. createShader seeds its
   * internal hueShift from Math.random(), which made the sweep a different
   * colour on every reload — pin it so the rainbow is identical each time. */
  const makeShader = () => {
    const canvas = glimmRef.value;
    if (!canvas) return null;
    const random = Math.random;
    Math.random = () => 0;
    try {
      return createShader({
        canvas,
        palette: RAINBOW,
        direction: "ltr",
        bandTight: 10,
        swellAmount: 0.85
      });
    } finally {
      Math.random = random;
    }
  };

  /* Glimm shader lives inside the composer, invisible at rest. Selecting
   * the flagship model fires a one-shot rainbow sweep across the interior. */
  watchLifecycle(() => {
    shaderRef.value = makeShader();
    return () => {
      shaderRef.value?.destroy();
      shaderRef.value = null;
    };
    
  }, () => []);
  const celebrate = () => {
    if (sweepingRef.value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Recreate the shader per sweep so uTime restarts at 0 — the hue phase
    // (which drifts with time) is then identical on every trigger.
    shaderRef.value?.destroy();
    const shader = makeShader();
    shaderRef.value = shader;
    if (!shader) return;
    sweepingRef.value = true;
    const sweep = playSweep(shader, {
      palette: RAINBOW,
      direction: "ltr",
      sweepMs: 570,
      outroMs: 80,
      peakAlpha: 1.3,
      bandTight: 10,
      brightness: 1.4,
      swellAmount: 1,
      waveSpeed: 1.8,
      easing: "easeOutExpo"
    });
    sweep.done.finally(() => {
      sweepingRef.value = false;
    });
  };
  const selectModel = (next: typeof MODELS[number]) => {
    setModel(next);
    setModelOpen(false);
    if (next.key === "sprinkles-5") celebrate();
  };

  /* autoplay: apply the current step, then advance after its hold */
  watchLifecycle(() => {
    if (!auto.value) return;
    const step = AUTO_STEPS[autoStep.value % AUTO_STEPS.length];
    setDraft(step.draft);
    if (step.active !== undefined) setActive(step.active);
    if (step.connect !== undefined) setConnected(step.connect);
    if (step.modelOpen !== undefined) setModelOpen(step.modelOpen);
    if (step.model) {
      const next = MODELS.find(m => m.key === step.model);
      if (next) selectModel(next);
    }
    const t = setTimeout(() => setAutoStep(s => s + 1), step.hold);
    return () => clearTimeout(t);
  }, () => [auto.value, autoStep.value]);

  /* dictation resolves after a beat, like a real transcript landing */
  watchLifecycle(() => {
    if (!listening.value) return;
    const t = setTimeout(() => {
      setDraft(current => current ? `${current.trimEnd()} ${DICTATION}` : DICTATION);
      setListening(false);
      inputRef.value?.focus();
    }, 2200);
    return () => clearTimeout(t);
  }, () => [listening.value]);

  /* Move wrapped text above the controls, then grow to a compact maximum. */
  watchLifecycle(() => {
    const input = inputRef.value;
    const controls = controlsRef.value;
    const measure = measureRef.value;
    const modelButton = modelRef.value;
    if (!input || !controls || !measure || !modelButton) return;
    const fixedControlsWidth = 28 * 3 + modelButton.offsetWidth;
    const inlineGaps = 4 * 4;
    const inlineInputWidth = controls.clientWidth - fixedControlsWidth - inlineGaps;
    const needsFullWidth = draft.value.includes("\n") || measure.offsetWidth + 8 > inlineInputWidth;
    if (needsFullWidth !== expanded.value) {
      setExpanded(needsFullWidth);
    }
    const minHeight = 28;
    const maxHeight = 100;
    input.style.height = "0px";
    const contentHeight = input.scrollHeight;
    input.style.height = `${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px`;
    input.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  }, () => [draft.value, expanded.value]);

  /* clicking anywhere outside the composer closes the open menus */
  watchLifecycle(() => {
    if (!modelOpen.value && !plusOpen.value) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as HTMLInputElement as Element).closest("[data-promptbar]")) {
        setModelOpen(false);
        setPlusOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, () => [modelOpen.value, plusOpen.value]);
  const closeMenus = () => {
    setPlusOpen(false);
    setModelOpen(false);
  };
  const pick = (row: {
    key: string;
    name: string;
  }) => {
    const source = SOURCES.find(s => s.key === row.key);
    if (source?.attach) {
      setAttachments(current => [...current, FILES[current.length % FILES.length]]);
      if (token.value) setDraft(draft.value.slice(0, token.value.start));
    } else if (menu.value === "at") {
      setDraft(`${token.value ? draft.value.slice(0, token.value.start) : draft.value}@${row.name} `);
    } else {
      setDraft(`${token.value ? draft.value.slice(0, token.value.start) : draft.value}${row.name} `);
    }
    setPlusOpen(false);
    setDismissed(false);
    inputRef.value?.focus();
  };
  const canSend = computed(() => draft.value.trim().length > 0 || attachments.value.length > 0);
  const send = () => {
    if (!canSend.value) return;
    onSend.value?.(draft.value.trim());
    setDraft("");
    setAttachments([]);
    closeMenus();
  };
  return () => {
    return <div data-promptbar class={demo.value ? "flex min-h-[384px] w-full max-w-105 flex-col justify-end pb-8" : "w-full"} {...{ onPointerdownCapture: takeOver, onKeydownCapture: takeOver }}>
      {/* composer is the anchor — menus grow up from its top edge */}
      <div ref={composerAnchorRef} class="relative">
      {/* ── @ / slash menu ─────────────────────────────── */}
      {menu.value && <div onMouseleave={() => setEngaged(false)} class="absolute inset-x-0 bottom-full z-10 mb-2 rounded-[10px] bg-surface p-1 shadow-raised" style={cssStyle({
          animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
          transformOrigin: "bottom center"
        })}>
          {/* single gliding highlight — appears once a row is hovered */}
          <span aria-hidden class="pointer-events-none absolute inset-x-1 rounded-[6px] bg-hover" style={cssStyle({
            top: rowBox.value?.top ?? 0,
            height: rowBox.value?.height ?? 0,
            opacity: rowBox.value && engaged.value && rows.value.length > 0 ? 1 : 0,
            transition: "top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease"
          })} />
          {rows.value.map((row, i) => {
            const source = menu.value === "at" ? SOURCES.find(s => s.key === row.key) : undefined;
            return <button key={row.key} type="button" ref={(el: any) => {
              rowRefs.value[i] = el;
            }} onMousedown={event => event.preventDefault()} onMouseenter={() => {
              setActive(i);
              setEngaged(true);
            }} onClick={() => pick(row)} class="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[6px] px-2 text-left">
                {source && <span class="flex size-5.5 shrink-0 items-center justify-center text-ink-2">
                    {source.brand ? BRANDS[source.brand] : <Icon size={15}>{GLYPHS[source.glyph ?? "clip"]}</Icon>}
                  </span>}
                <span class="shrink-0 text-[12.5px] font-medium text-ink">
                  {row.name}
                </span>
                <span class="min-w-0 flex-1 truncate text-[12px] text-ink-3">{row.desc}</span>
                {source?.connect && <span role="button" tabindex={-1} onClick={event => {
                event.stopPropagation();
                setConnected(current => !current);
              }} class={`shrink-0 text-[12px] font-medium transition-colors duration-100 ${connected.value ? "text-green" : "text-accent-ink hover:underline"}`}>
                    {connected.value ? "Connected" : "Connect"}
                  </span>}
              </button>;
          })}
          {rows.value.length === 0 && <div class="flex h-9 items-center px-2 text-[12px] text-ink-3">
              No matches for “{query.value}”
            </div>}
          <div class="mt-1 border-t border-line px-2 pt-1.5 pb-1 text-[11px] text-ink-3">
            {menu.value === "at" ? "Type to search sources & files" : "Type to search commands"}
          </div>
        </div>}

      {/* ── model menu ─────────────────────────────────── */}
      {modelOpen.value && <div onMouseleave={() => setModelHovered(null)} class="absolute z-10 w-44 rounded-[10px] bg-surface p-1 shadow-raised" style={cssStyle({
          left: modelMenuLeft.value,
          bottom: modelMenuBottom.value,
          animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
          transformOrigin: "bottom left"
        })}>
          {/* single gliding highlight — floats to the hovered / selected row */}
          <span aria-hidden class="pointer-events-none absolute inset-x-1 rounded-[6px] bg-hover" style={cssStyle({
            top: modelBox.value?.top ?? 0,
            height: modelBox.value?.height ?? 0,
            opacity: modelBox.value && modelHovered.value !== null ? 1 : 0,
            transition: "top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease"
          })} />
          {MODELS.map((m, i) => <button key={m.key} type="button" ref={(el: any) => {
            modelRowRefs.value[i] = el;
          }} onMousedown={event => event.preventDefault()} onMouseenter={() => setModelHovered(i)} onClick={() => {
            selectModel(m);
            inputRef.value?.focus();
          }} class="relative z-10 flex h-7.5 w-full items-center gap-2 rounded-[6px] px-2 text-left">
              <span class="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">{m.name}</span>
              <span class="shrink-0 text-[11px] text-ink-3">{m.tag}</span>
              <span class={`shrink-0 text-ink ${m.key === model.value.key ? "" : "invisible"}`}>
                <Icon size={13} strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></Icon>
              </span>
            </button>)}
        </div>}

      {/* ── composer ───────────────────────────────────── */}
      <div class={`relative isolate flex flex-col overflow-hidden border border-line bg-surface shadow-card transition-[border-color,border-radius] duration-150 focus-within:border-line-strong ${tall.value ? "gap-2.5 p-3.5" : "gap-1.5 p-1.5"} ${pill.value ? attachments.value.length > 0 || wide.value ? "rounded-[24px]" : "rounded-full" : tall.value ? "rounded-[22px]" : "rounded-[14px]"}`}>
        {/* rainbow glimm sweep — plays across the interior on model change.
            explicit w/h: a <canvas> is a replaced element and won't stretch
            to inset-0 alone, which feeds back into the shader's ResizeObserver. */}
        <canvas ref={glimmRef} aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 h-full w-full" style={cssStyle({
            borderRadius: "inherit"
          })} />
        <span ref={measureRef} aria-hidden="true" class="pointer-events-none absolute invisible whitespace-pre text-[13px] leading-[18px]">
          {draft.value}
        </span>

        {attachments.value.length > 0 && <div class={`flex flex-wrap gap-1.5 pt-0.5 ${pill.value ? "px-1" : "px-0.5"}`}>
            {attachments.value.map((file, i) => <span key={`${file}-${i}`} class={`flex h-6.5 items-center gap-1.5 bg-field py-1 pr-1 pl-1.5 text-[11.5px] text-ink-2 shadow-hairline ${pill.value ? "rounded-full" : "rounded-chip"}`} style={cssStyle({
              animation: "pop-in 200ms cubic-bezier(0.23,1,0.32,1) both"
            })}>
                <Icon size={12}><g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></g></Icon>
                <span class="max-w-36 truncate">{file}</span>
                <button type="button" aria-label={`Remove ${file}`} onClick={() => setAttachments(current => current.filter((_, j) => j !== i))} class={`-my-1 flex size-6 items-center justify-center text-ink-3 transition-colors duration-100 hover:bg-line/70 hover:text-ink ${pill.value ? "rounded-full" : "rounded-[5px]"}`}>
                  <Icon size={10} strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></Icon>
                </button>
              </span>)}
          </div>}

        <div ref={controlsRef} class={`grid items-end gap-x-1 gap-y-1.5 ${wide.value ? "grid-cols-[28px_auto_minmax(0,1fr)_28px_28px]" : "grid-cols-[28px_minmax(0,1fr)_auto_28px_28px]"}`}>
          <button type="button" aria-label="Add attachments and sources" aria-expanded={plusOpen.value} onClick={() => {
              setModelOpen(false);
              setPlusOpen(current => !current);
              inputRef.value?.focus();
            }} class={`flex size-7 shrink-0 items-center justify-center justify-self-start text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-hover hover:text-ink active:scale-[0.94] ${pill.value ? "rounded-full" : "rounded-[8px]"} ${plusOpen.value ? "bg-hover text-ink" : ""} ${wide.value ? "col-start-1 row-start-2" : "col-start-1 row-start-1"}`}>
            <Icon size={16} strokeWidth={2}><path d="M12 5v14M5 12h14" /></Icon>
          </button>

          <textarea ref={inputRef} rows={1} value={draft.value} onInput={event => {
              setDraft((event.target as HTMLInputElement).value);
              setDismissed(false);
              setPlusOpen(false);
            }} onKeydown={event => {
              if (menu.value && rows.value.length > 0) {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setEngaged(true);
                  setActive(current => (current + (event.key === "ArrowDown" ? 1 : rows.value.length - 1)) % rows.value.length);
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey || event.key === "Tab") {
                  event.preventDefault();
                  pick(rows.value[active.value]);
                  return;
                }
              }
              if (event.key === "Escape") {
                setDismissed(true);
                closeMenus();
                return;
              }
              if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                send();
              }
            }} placeholder={listening.value ? "Listening…" : placeholder.value ?? "Write a message…"} aria-label="Prompt" class={`${tall.value ? "min-h-[68px] px-2 py-2 text-[14px] leading-5" : "min-h-7 px-1 py-[5px] text-[13px] leading-[18px]"} min-w-0 w-full resize-none bg-transparent text-ink outline-none [overflow-wrap:anywhere] placeholder:text-ink-3 ${wide.value ? "col-span-full col-start-1 row-start-1" : "col-start-2 row-start-1"}`} />

          {/* model picker */}
          <button ref={modelRef} type="button" aria-expanded={modelOpen.value} aria-label="Choose model" onClick={() => {
              setPlusOpen(false);
              setModelOpen(current => !current);
            }} class={`flex h-7 shrink-0 items-center gap-1 px-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink ${pill.value ? "rounded-full" : "rounded-[8px]"} ${wide.value ? "col-start-2 row-start-2 justify-self-start" : "col-start-3 row-start-1"}`}>
            {model.value.name}
            <span class="text-ink-3">
              <Icon size={11} strokeWidth={2.4}><path d="M6 9l6 6 6-6" /></Icon>
            </span>
          </button>

          {/* dictation */}
          <button type="button" aria-label={listening.value ? "Stop dictation" : "Start dictation"} aria-pressed={listening.value} onClick={() => setListening(current => !current)} class={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-150 active:scale-[0.94] ${pill.value ? "rounded-full" : "rounded-[8px]"} ${listening.value ? "bg-accent-tint text-accent-ink" : "text-ink-3 hover:bg-hover hover:text-ink"} ${wide.value ? "col-start-4 row-start-2" : "col-start-4 row-start-1"}`}>
            {listening.value ? <span class="flex h-3.5 items-center gap-[2.5px]">
                {[0, 1, 2].map(i => <span key={i} class="w-[2.5px] rounded-full bg-current" style={cssStyle({
                  height: "100%",
                  animation: `eq-bounce 900ms ease-in-out ${i * 150}ms infinite`
                })} />)}
              </span> : <Icon size={15} strokeWidth={2}><g><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></g></Icon>}
          </button>

          {/* send — tactile square (round in the pill variant) */}
          <button type="button" aria-label="Send" disabled={!canSend.value} onClick={send} class={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.94] ${pill.value ? "rounded-full" : "rounded-[8px]"} ${wide.value ? "col-start-5 row-start-2" : "col-start-5 row-start-1"}`} style={cssStyle({
              background: canSend.value ? "var(--ink)" : "var(--line-strong)",
              color: canSend.value ? "var(--surface)" : "var(--ink-2)"
            })}>
            <Icon size={16} strokeWidth={2.4}><path d="M12 19V5M5 12l7-7 7 7" /></Icon>
          </button>
        </div>
      </div>
      </div>
    </div>;
  };
}, { demo: Boolean, tall: Boolean });
export default PromptBar;
