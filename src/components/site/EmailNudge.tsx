// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { EmailModal } from "./EmailCapture";

/* ─────────────────────────────────────────────────────────
 * EMAIL NUDGE
 * After a visitor has clicked around a bit (>10 clicks), open
 * the signup in a modal — once. Skipped for anyone who already
 * subscribed or dismissed it (persisted in localStorage).
 * ───────────────────────────────────────────────────────── */

const DONE_KEY = "bui-email-nudge";
const THRESHOLD = 10;
export const EmailNudge = createComponent<Record<string, never>>("EmailNudge", [], (__props, __slots) => {
  const [open, setOpen] = createState(false);
  watchLifecycle(() => {
    try {
      if (localStorage.getItem(DONE_KEY) === "done") return;
    } catch {
      /* ignore */
    }
    let clicks = 0;
    let fired = false;
    const onClick = () => {
      if (fired) return;
      clicks += 1;
      if (clicks > THRESHOLD) {
        fired = true;
        document.removeEventListener("click", onClick);
        setOpen(true);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, () => []);
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(DONE_KEY, "done");
    } catch {
      /* ignore */
    }
  };
  return () => {
    return <EmailModal open={open.value} onClose={close} />;
  };
});
