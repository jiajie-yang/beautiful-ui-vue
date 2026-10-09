// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Chip } from "@/components/atoms/Chip";
import { TextRow } from "@/components/atoms/TextRow";

/* The token layer, made visible — type, color, shadow, spacing, buttons, text rows. */
const Tile = createComponent<{
  title: string;
  children: UI.VNodeChild;
}>("Tile", ["title", "children"], (__props, __slots) => {
  const title = computed(() => __props.title);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  return () => {
    return <div class="flex flex-col overflow-hidden rounded-card bg-surface shadow-card">
      <div class="primitive-card-bar border-b border-line">
        <h3 class="text-[13px] font-semibold text-ink">{title.value}</h3>
      </div>
      <div class="primitive-card-pad flex flex-1 flex-col justify-center">{children.value}</div>
    </div>;
  };
});
export const Foundations = createComponent<Record<string, never>>("Foundations", [], (__props, __slots) => {
  return () => {
    return <section class="mx-auto w-full max-w-6xl px-6 pb-14">
      <div class="mb-4 flex items-baseline gap-2 px-0.5">
        <h2 class="text-sm font-semibold text-ink">Foundations</h2>
        <span class="text-[13px] text-ink-3">
          the tokens everything above is built from
        </span>
      </div>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Tile title="Type">
          <div class="flex flex-col gap-1.5">
            <span class="text-2xl font-semibold tracking-[-0.02em] text-ink">
              Inter, tuned
            </span>
            <span class="text-sm text-ink">
              Body at 14px, line-height 1.5
            </span>
            <span class="text-[13px] text-ink-2">
              Secondary gets color, not weight
            </span>
            <span class="text-xs text-ink-3">
              Captions at 12px · <span class="tabular-nums">1,234.56</span>{" "}
              tabular · <Chip>mono_chip</Chip>
            </span>
          </div>
        </Tile>

        <Tile title="Color">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              {["bg-ink", "bg-ink-2", "bg-ink-3", "bg-line-strong", "bg-inset"].map(c => <span key={c} class={`size-7 rounded-full shadow-hairline ${c}`} />)}
              <span class="size-7 rounded-full bg-accent shadow-hairline" />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <StatusPill tone="green">Completed</StatusPill>
              <StatusPill tone="orange">Needs review</StatusPill>
              <StatusPill tone="red">Failed</StatusPill>
              <StatusPill tone="accent">Active</StatusPill>
            </div>
            <p class="text-xs text-ink-3">
              Color is a condiment — dots, pills and one primary action.
            </p>
          </div>
        </Tile>

        <Tile title="Shadow">
          <div class="flex items-center justify-around py-2">
            {([["hairline", "shadow-hairline"], ["card", "shadow-card"], ["overlay", "shadow-overlay"]] as const).map(([name, cls]) => <div key={name} class="flex flex-col items-center gap-2.5">
                <span class={`size-14 rounded-card bg-surface ${cls}`} />
                <span class="text-xs text-ink-3">{name}</span>
              </div>)}
          </div>
          <p class="mt-2 text-xs text-ink-3">
            Layered, ambient, single-digit opacities. Never harsh.
          </p>
        </Tile>

        <Tile title="Spacing & radius">
          <div class="flex flex-col gap-3">
            <div class="flex items-end gap-1.5">
              {[4, 8, 12, 16, 24, 32].map(s => <div key={s} class="flex flex-col items-center gap-1.5">
                  <span class="w-5 rounded-sm bg-accent-tint" style={cssStyle({
                  height: s
                })} />
                  <span class="text-[10px] text-ink-3 tabular-nums">{s}</span>
                </div>)}
              <span class="mb-4 ml-1 text-xs text-ink-3">4px grid</span>
            </div>
            <div class="flex items-center gap-2">
              {([["8", "rounded-chip"], ["10", "rounded-control"], ["16", "rounded-card"], ["999", "rounded-full"]] as const).map(([r, cls]) => <span key={r} class={`flex h-8 items-center bg-inset px-3 text-xs text-ink-2 shadow-hairline ${cls}`}>
                  {r}
                </span>)}
            </div>
          </div>
        </Tile>

        <Tile title="Buttons">
          <div class="flex flex-col gap-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm">Accept</Button>
              <Button variant="accent" size="sm">Accept</Button>
              <Button variant="secondary" size="sm">Alternatives</Button>
              <Button variant="ghost" size="sm">Skip</Button>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Button variant="primary">Send</Button>
              <Button variant="secondary">Configure</Button>
            </div>
            <p class="text-xs text-ink-3">
              Scales to 0.96 on press. One filled action per surface.
            </p>
          </div>
        </Tile>

        <Tile title="Text rows">
          <div class="flex flex-col divide-y divide-line">
            <TextRow label="Current value" value="780,704 USD" meta="+8%" />
            <TextRow label="Logs" value="0.0125 of 1 GB" />
            <TextRow label="In portfolio since" value="02/28/2023" />
          </div>
        </Tile>
      </div>
    </section>;
  };
});
