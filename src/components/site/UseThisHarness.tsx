// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { VNodeChild } from '@/lib/dom-types';

/* ─────────────────────────────────────────────────────────
 * USE THIS HARNESS
 * A "take this and run" modal for the open-source harness.
 * The primary action copies a ready-to-paste prompt the user
 * hands to their coding agent; a secondary row offers the clone
 * command for the independent Vue repository.
 * ───────────────────────────────────────────────────────── */

const REPO_URL = "https://github.com/jiajie-yang/beautiful-ui-vue";
const CLONE_COMMAND = `git clone ${REPO_URL}.git`;
const AGENT_PROMPT = `Add the Beautiful UI Vue harness to my Vue 3 app.

Source (MIT, Vue 3 + Vite + Vue JSX + Tailwind v4):
${REPO_URL}

1. Clone the repo (or read its raw files) and copy src/components, src/lib,
   src/vendor, src/styles and the public assets into my app.
   src/components/site/IceCreamHarness.tsx is the chat shell.
   Preserve the included license and third-party notices.
2. Enable @vitejs/plugin-vue-jsx in Vite, jsxImportSource: vue in TypeScript,
   and the @ alias pointing to src. Use the package.json dependency list.
   Load Inter and JetBrains Mono with @fontsource-variable.
3. Replace the demo SCENARIOS in IceCreamHarness.tsx with calls to my backend.
   Preserve the thinking, streaming, tool-call and approval rendering layer.
4. Preserve the design tokens, radii, hairline borders and restrained shadows.
   Keep RESEND_API_KEY on the server if subscription is needed.

Before writing code, ask me how my agent API works.`;
function useCopy() {
  const [copied, setCopied] = createState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return {
    copied,
    copy
  };
}
const Icon = createComponent<{
  path: VNodeChild;
  size?: number;
  sw?: number;
}>("Icon", ["path", "size", "sw"], (__props, __slots) => {
  const path = computed(() => __props.path);
  const size = computed(() => __props.size === undefined ? 15 : __props.size);
  const sw = computed(() => __props.sw === undefined ? 1.9 : __props.sw);
  return () => {
    return <svg width={size.value} height={size.value} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={sw.value} stroke-linecap="round" stroke-linejoin="round" aria-hidden>
      {path.value}
    </svg>;
  };
});
const glyph = {
  copy: <g><rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></g>,
  check: <path d="M20 6L9 17l-5-5" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  external: <g><path d="M14 5h5v5" /><path d="M19 5l-8 8" /><path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" /></g>
};
export const UseThisModal = createComponent<{
  open: boolean;
  onClose: () => void;
}>("UseThisModal", ["open", "onClose"], (__props, __slots) => {
  const open = computed(() => __props.open);
  const onClose = computed(() => __props.onClose);
  const prompt = useCopy();
  const clone = useCopy();
  watchLifecycle(() => {
    if (!open.value) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose.value();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, () => [open.value, onClose.value]);
  return () => {
    if (!open.value) return null;
    return <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Fork this harness">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/55" style={cssStyle({
        animation: "fade-in 200ms ease-out both"
      })} onClick={onClose.value} />
      <div class="relative flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-window bg-surface shadow-overlay" style={cssStyle({
        animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
        {/* header */}
        <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          <div class="min-w-0">
            <h2 class="text-[16px] font-semibold tracking-[-0.01em] text-ink">Fork this harness</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-ink-2 text-pretty">
              This whole harness is open source. Hand these instructions to your coding agent
              to drop it into your product.
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose.value} class="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-control text-ink-3 transition-colors duration-150 hover:bg-hover hover:text-ink">
            <Icon path={glyph.close} size={15} sw={2.2} />
          </button>
        </div>

        {/* body */}
        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <div class="mb-2 text-[12.5px] font-medium text-ink-2">
            Give this to your agent
          </div>

          <div class="overflow-hidden rounded-card bg-inset shadow-hairline">
            <pre class="max-h-52 overflow-y-auto px-3.5 py-3 font-sans text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-2">
              {AGENT_PROMPT}
            </pre>
          </div>

          <button type="button" onClick={() => prompt.copy(AGENT_PROMPT)} class="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-control bg-ink text-[13px] font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(16,24,40,0.12)] transition-transform duration-150 active:scale-[0.99]">
            <Icon path={prompt.copied.value ? glyph.check : glyph.copy} size={15} sw={prompt.copied.value ? 2.4 : 1.9} />
            {prompt.copied.value ? "Copied to clipboard" : "Copy instructions"}
          </button>

          {/* secondary — clone the repository */}
          <div class="mt-5 mb-2 text-[12.5px] font-medium text-ink-2">
            Or clone it yourself
          </div>

          <div class="flex items-center gap-2 rounded-control bg-inset px-3 py-2 shadow-hairline">
            <span class="text-ink-3"><Icon path={<g><path d="M4 17l6-6-6-6" /><path d="M12 19h8" /></g>} size={14} sw={2} /></span>
            <code class="min-w-0 flex-1 break-all font-mono text-[12px] text-ink-2">{CLONE_COMMAND}</code>
            <button type="button" aria-label="Copy clone command" onClick={() => clone.copy(CLONE_COMMAND)} class={`flex size-7 shrink-0 items-center justify-center rounded-[7px] transition-colors duration-150 hover:bg-hover ${clone.copied.value ? "text-green" : "text-ink-3 hover:text-ink"}`}>
              <Icon path={clone.copied.value ? glyph.check : glyph.copy} size={14} sw={clone.copied.value ? 2.4 : 1.9} />
            </button>
          </div>

          <div class="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
            <span class="text-[12px] text-ink-3">MIT licensed</span>
            <a href={REPO_URL} target="_blank" rel="noreferrer" class="flex shrink-0 items-center gap-1.5 rounded-full bg-field px-2.5 py-1.5 text-[12px] font-medium text-ink shadow-btn transition-[background-color,transform] duration-150 hover:bg-hover active:scale-[0.97]">
              GitHub
              <Icon path={glyph.external} size={13} sw={2} />
            </a>
          </div>
        </div>
      </div>
    </div>;
  };
});
