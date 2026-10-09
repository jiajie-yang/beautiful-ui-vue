// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { REGISTRY, type Entry } from "@/lib/registry";
import { INTERNAL } from "@/lib/meta";

/* ─────────────────────────────────────────────────────────
 * GRID + CODE OVERLAY
 * Demos run live and are directly interactable. Each card
 * has explicit actions: copy the source, or view the code.
 * ───────────────────────────────────────────────────────── */
const CopyIcon = createComponent<Record<string, never>>("CopyIcon", [], (__props, __slots) => {
  return () => {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>;
  };
});
const CheckIcon = createComponent<Record<string, never>>("CheckIcon", [], (__props, __slots) => {
  return () => {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>;
  };
});
const CodeIcon = createComponent<Record<string, never>>("CodeIcon", [], (__props, __slots) => {
  return () => {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>;
  };
});
function useCopy(code: string) {
  const [copied, setCopied] = createState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  return {
    copied,
    copy
  };
}
const Card = createComponent<{
  entry: Entry;
  code: string;
  index: number;
  onOpen: () => void;
}>("Card", ["entry", "code", "index", "onOpen"], (__props, __slots) => {
  const entry = computed(() => __props.entry);
  const code = computed(() => __props.code);
  const index = computed(() => __props.index);
  const onOpen = computed(() => __props.onOpen);
  const Demo = computed(() => entry.value.Demo);
  const {
    copied,
    copy
  } = useCopy(code.value);
  const [variant, setVariant] = createState(entry.value.variants?.[0]);
  const contentRef = templateRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = createState(272);
  watchLifecycle(() => {
    const content = contentRef.value;
    if (!content) return;
    const rememberLargestHeight = (height: number) => {
      const heightWithPadding = Math.ceil(height) + 24;
      setPreviewHeight(current => Math.max(current, heightWithPadding));
    };
    rememberLargestHeight(content.getBoundingClientRect().height);
    const observer = new ResizeObserver(([observed]) => {
      if (observed) rememberLargestHeight(observed.contentRect.height);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, () => []);
  return () => {
    return <section id={entry.value.id} class="primitive-showcase group flex w-full scroll-mt-8 flex-col border-b border-dashed border-line px-5 py-8 sm:px-8 sm:py-10" style={cssStyle({
      animation: `fade-up 600ms cubic-bezier(0.23,1,0.32,1) ${Math.min(index.value, 4) * 60}ms both`
    })}>
      <div class="mb-3 flex items-start gap-2 sm:items-baseline">
        <span class="mt-0.5 font-mono text-[11px] text-ink-3 tabular-nums sm:mt-0">
          {String(index.value + 1).padStart(2, "0")}
        </span>
        <div class="min-w-0 sm:flex sm:items-baseline sm:gap-2">
          <h3 class="whitespace-nowrap text-[13px] font-semibold text-ink">
            {entry.value.title}
          </h3>
          <p class="mt-0.5 text-[12.5px] text-ink-3 text-pretty sm:mt-0 sm:truncate">
            {entry.value.caption}
          </p>
        </div>
      </div>
      <div class="primitive-demo-surface relative flex items-center justify-center overflow-hidden rounded-window bg-canvas p-3 shadow-hairline" style={cssStyle({
        minHeight: previewHeight.value
      })}>
        <div ref={contentRef} class="w-full max-w-120 [&>*]:mx-auto">
          <Demo.value variant={variant.value} />
        </div>
        {entry.value.variants && <div class="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 rounded-full bg-field p-0.5">
            {entry.value.variants.map(v => <button key={v} onClick={() => setVariant(v)} class={`rounded-full px-2 py-0.5 text-[11.5px] font-medium transition-[background-color,color,box-shadow] duration-150
                  ${variant.value === v ? "bg-surface text-ink shadow-btn" : "text-ink-3 hover:text-ink-2"}`}>
                {v}
              </button>)}
          </div>}
        <div class="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity
            duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <button aria-label="Copy code" onClick={copy} class={`flex size-7 items-center justify-center rounded-control bg-surface
              shadow-btn transition-colors duration-100 hover:bg-hover
              ${copied.value ? "text-green" : "text-ink-3 hover:text-ink"}`}>
            {copied.value ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button aria-label="View code" onClick={onOpen.value} class="flex size-7 items-center justify-center rounded-control bg-surface
              text-ink-3 shadow-btn transition-colors duration-100
              hover:bg-hover hover:text-ink">
            <CodeIcon />
          </button>
        </div>
      </div>
    </section>;
  };
});
const Overlay = createComponent<{
  entry: Entry;
  code: string;
  onClose: () => void;
}>("Overlay", ["entry", "code", "onClose"], (__props, __slots) => {
  const entry = computed(() => __props.entry);
  const code = computed(() => __props.code);
  const onClose = computed(() => __props.onClose);
  const {
    copied,
    copy
  } = useCopy(code.value);
  watchLifecycle(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose.value();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, () => [onClose.value]);
  return () => {
    return <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`${entry.value.title} code`}>
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/55" style={cssStyle({
        animation: "fade-in 200ms ease-out both"
      })} onClick={onClose.value} />
      <div class="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden
          rounded-window bg-surface shadow-overlay" style={cssStyle({
        animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
        <div class="primitive-card-bar flex items-center justify-between gap-3 border-b border-line">
          <div class="min-w-0">
            <h3 class="text-[13px] font-semibold text-ink">{entry.value.title}</h3>
            <p class="truncate font-mono text-[11.5px] text-ink-3">
              src/components/primitives/{entry.value.file}
            </p>
            {entry.value.deps?.length || entry.value.npm?.length ? <p class="mt-1 text-[11.5px] leading-relaxed text-ink-3">
                <span class="font-medium text-ink-2">Requires</span>
                {entry.value.deps?.length ? <> · also copy {entry.value.deps.map(d => INTERNAL[d]?.title ?? d).join(", ")}</> : null}
                {entry.value.npm?.length ? <> · <code class="rounded bg-inset px-1 py-0.5 font-mono text-[11px] text-ink-2">npm i {entry.value.npm.join(" ")}</code></> : null}
              </p> : <p class="mt-1 text-[11.5px] text-ink-3">Registry includes Vue helpers, local imports, and foundation styles.</p>}
            <p class="mt-1.5 truncate font-mono text-[11px] text-ink-3" title={`pnpm dlx shadcn-vue@latest add ${window.location.origin}/r/${entry.value.id}.json`}>
              <span class="text-ink-2">$</span> pnpm dlx shadcn-vue@latest add {window.location.origin}/r/{entry.value.id}.json
            </p>
          </div>
          <div class="flex items-center gap-1.5">
            <button onClick={copy} class="flex h-7 items-center gap-1.5 rounded-control bg-ink px-2.5
                text-[12.5px] font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(16,24,40,0.1)]
                transition-transform duration-150 active:scale-[0.98]">
              {copied.value ? "Copied" : "Copy"}
            </button>
            <button aria-label="Close" onClick={onClose.value} class="primitive-icon-button text-ink-3
                transition-colors duration-150 hover:bg-hover hover:text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <pre class="flex-1 overflow-auto bg-inset p-4 font-mono text-[12px] leading-relaxed text-ink-2">
          <code>{code.value}</code>
        </pre>
        <div class="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[12px] text-ink-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden class="shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v4h1" />
          </svg>
          <span class="min-w-0 flex-1 text-pretty">
            Foundation required — paste{" "}
            <code class="rounded bg-surface px-1 py-0.5 font-mono text-[11.5px] text-ink-2 shadow-hairline">src/styles/globals.css</code>{" "}
            once and enable @vitejs/plugin-vue-jsx (tokens, <code class="font-mono text-ink-2">@theme</code> mappings, keyframes, reduced-motion).
          </span>
          <a href="/foundation.css" target="_blank" rel="noreferrer" class="flex shrink-0 items-center gap-1 font-medium text-ink transition-colors duration-150 hover:text-accent">
            globals.css
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M14 5h5v5M19 5l-8 8" /></svg>
          </a>
        </div>
      </div>
    </div>;
  };
});
export const Grid = createComponent<{
  sources: Record<string, string>;
}>("Grid", ["sources"], (__props, __slots) => {
  const sources = computed(() => __props.sources);
  const [openId, setOpenId] = createState<string | null>(null);
  const open = computed(() => REGISTRY.find(e => e.id === openId.value));
  return () => {
    return <>
      <div class="flex w-full flex-col pt-8 pb-12 lg:pt-10 lg:pb-16">
        {REGISTRY.map((entry, i) => <Card key={entry.id} entry={entry} code={sources.value[entry.id] ?? ""} index={i} onOpen={() => setOpenId(entry.id)} />)}
      </div>
      {open.value && <Overlay entry={open.value} code={sources.value[open.value.id] ?? ""} onClose={() => setOpenId(null)} />}
    </>;
  };
});
