// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * EMAIL CAPTURE — signup for updates + new components. Posts
 * to /api/subscribe, which saves the email as a Resend Contact
 * (API key stays server-side). The form is shared between the
 * end-of-page section and the click-nudge modal.
 * ───────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DONE_KEY = "bui-email-nudge";
type Status = "idle" | "loading" | "done" | "error";
function markDone() {
  try {
    localStorage.setItem(DONE_KEY, "done");
  } catch {
    /* ignore */
  }
}
const EmailForm = createComponent<Record<string, never>>("EmailForm", [], (__props, __slots) => {
  const [email, setEmail] = createState("");
  const [status, setStatus] = createState<Status>("idle");
  const valid = computed(() => EMAIL_RE.test(email.value.trim()));
  const submit = async (e: UI.FormEvent) => {
    e.preventDefault();
    if (!valid.value || status.value === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.value.trim()
        })
      });
      if (!res.ok) throw new Error("bad status");
      markDone();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };
  return () => {
    return <>
      <h2 class="max-w-md text-[19px] leading-snug font-semibold tracking-[-0.02em] text-ink text-balance">
        New components, in your inbox.
      </h2>
      <p class="mt-2 max-w-md text-[13px] leading-relaxed text-ink-2 text-pretty">
        Get new primitives and updates as they ship — copy-paste ready. No spam,
        unsubscribe anytime.
      </p>

      {status.value === "done" ? <div class="mt-5 flex items-center gap-2 text-[13px] font-medium text-ink" style={cssStyle({
        animation: "fade-up 350ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
          <span class="flex size-5 items-center justify-center rounded-full bg-green text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          You’re on the list — talk soon.
        </div> : <form onSubmit={submit} class="mt-5 flex max-w-md flex-col gap-1.5" novalidate>
          <div class="flex items-center gap-2">
            <div class="flex h-9 flex-1 items-center rounded-control bg-inset px-3 transition-shadow duration-150" style={cssStyle({
            boxShadow: status.value === "error" ? "0 0 0 1px var(--red)" : "var(--shadow-hairline)"
          })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="mr-2 shrink-0">
                <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                <path d="m3 6 9 6 9-6" />
              </svg>
              <input type="email" inputmode="email" autocomplete="email" value={email.value} onInput={e => {
              setEmail((e.target as HTMLInputElement).value);
              if (status.value === "error") setStatus("idle");
            }} placeholder="you@studio.com" aria-label="Email address" class="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3" />
            </div>
            <button type="submit" disabled={!valid.value || status.value === "loading"} class="flex h-9 shrink-0 items-center gap-1.5 rounded-control bg-ink px-3.5 text-[12.5px]
                font-medium text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(16,24,40,0.1)]
                transition-[opacity,transform] duration-150 enabled:active:scale-[0.97] disabled:opacity-40">
              {status.value === "loading" ? <>
                  <span class="size-3.5 rounded-full border-[1.5px] border-canvas/40 border-t-canvas" style={cssStyle({
                animation: "spin 700ms linear infinite"
              })} />
                  Joining
                </> : <>
                  Notify me
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>}
            </button>
          </div>
          {status.value === "error" && <p class="text-[12px] text-red" style={cssStyle({
          animation: "fade-in 150ms ease-out both"
        })}>
              Something went wrong — try again.
            </p>}
        </form>}
    </>;
  };
});
/** End-of-page signup section. */
export const EmailCapture = createComponent<Record<string, never>>("EmailCapture", [], (__props, __slots) => {
  return () => {
    return <section class="px-5 py-12 sm:px-8 sm:py-14">
      <EmailForm />
    </section>;
  };
});

/** The same signup, in a fork-modal-style dialog (opened by the click nudge). */
export const EmailModal = createComponent<{
  open: boolean;
  onClose: () => void;
}>("EmailModal", ["open", "onClose"], (__props, __slots) => {
  const open = computed(() => __props.open);
  const onClose = computed(() => __props.onClose);
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
    return <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Get new components in your inbox">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/55" style={cssStyle({
        animation: "fade-in 200ms ease-out both"
      })} onClick={onClose.value} />
      <div class="relative w-full max-w-[460px] overflow-hidden rounded-window bg-surface shadow-overlay" style={cssStyle({
        animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
        <button type="button" aria-label="Close" onClick={onClose.value} class="absolute top-3.5 right-3.5 z-10 flex size-8 items-center justify-center rounded-control text-ink-3 transition-colors duration-150 hover:bg-hover hover:text-ink">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
        <div class="px-6 pt-6 pb-7">
          <EmailForm />
        </div>
      </div>
    </div>;
  };
});
