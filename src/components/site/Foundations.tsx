import { t } from '@/lib/i18n';
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
        <h2 class="text-sm font-semibold text-ink">{t("foundations.foundations")}</h2>
        <span class="text-[13px] text-ink-3">
          {t("foundations.theTokensEverythingAboveIsBuiltFrom")}</span>
      </div>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Tile title={t("common.type")}>
          <div class="flex flex-col gap-1.5">
            <span class="text-2xl font-semibold tracking-[-0.02em] text-ink">
              {t("foundations.interTuned")}</span>
            <span class="text-sm text-ink">
              {t("foundations.bodyAt14pxLineHeight15")}</span>
            <span class="text-[13px] text-ink-2">
              {t("foundations.secondaryGetsColorNotWeight")}</span>
            <span class="text-xs text-ink-3">
              {(t("foundations.captionsAt12px") + " ")}<span class="tabular-nums">{"1,234.56"}</span>{" "}
              {(t("foundations.tabular") + " ")}<Chip>{"mono_chip"}</Chip>
            </span>
          </div>
        </Tile>

        <Tile title={t("foundations.color")}>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              {["bg-ink", "bg-ink-2", "bg-ink-3", "bg-line-strong", "bg-inset"].map(c => <span key={c} class={`size-7 rounded-full shadow-hairline ${c}`} />)}
              <span class="size-7 rounded-full bg-accent shadow-hairline" />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <StatusPill tone="green">{t("common.completed")}</StatusPill>
              <StatusPill tone="orange">{t("common.needsReview")}</StatusPill>
              <StatusPill tone="red">{t("common.failed")}</StatusPill>
              <StatusPill tone="accent">{t("foundations.active")}</StatusPill>
            </div>
            <p class="text-xs text-ink-3">
              {t("foundations.colorIsACondimentDotsPillsAndOnePrimary")}</p>
          </div>
        </Tile>

        <Tile title={t("foundations.shadow")}>
          <div class="flex items-center justify-around py-2">
            {([["hairline", "shadow-hairline"], ["card", "shadow-card"], ["overlay", "shadow-overlay"]] as const).map(([name, cls]) => <div key={name} class="flex flex-col items-center gap-2.5">
                <span class={`size-14 rounded-card bg-surface ${cls}`} />
                <span class="text-xs text-ink-3">{({ hairline: t("foundations.hairline"), card: t("foundations.card"), overlay: t("foundations.overlay") } as Record<string, string>)[name]}</span>
              </div>)}
          </div>
          <p class="mt-2 text-xs text-ink-3">
            {t("foundations.layeredAmbientSingleDigitOpacitiesNeverHarsh")}</p>
        </Tile>

        <Tile title={t("foundations.spacingRadius")}>
          <div class="flex flex-col gap-3">
            <div class="flex items-end gap-1.5">
              {[4, 8, 12, 16, 24, 32].map(s => <div key={s} class="flex flex-col items-center gap-1.5">
                  <span class="w-5 rounded-sm bg-accent-tint" style={cssStyle({
                  height: s
                })} />
                  <span class="text-[10px] text-ink-3 tabular-nums">{s}</span>
                </div>)}
              <span class="mb-4 ml-1 text-xs text-ink-3">{t("foundations.label4pxGrid")}</span>
            </div>
            <div class="flex items-center gap-2">
              {([["8", "rounded-chip"], ["10", "rounded-control"], ["16", "rounded-card"], ["999", "rounded-full"]] as const).map(([r, cls]) => <span key={r} class={`flex h-8 items-center bg-inset px-3 text-xs text-ink-2 shadow-hairline ${cls}`}>
                  {r}
                </span>)}
            </div>
          </div>
        </Tile>

        <Tile title={t("foundations.buttons")}>
          <div class="flex flex-col gap-2.5">
            <div class="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm">{t("common.accept")}</Button>
              <Button variant="accent" size="sm">{t("common.accept")}</Button>
              <Button variant="secondary" size="sm">{t("common.alternatives")}</Button>
              <Button variant="ghost" size="sm">{t("common.skip")}</Button>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Button variant="primary">{t("common.send")}</Button>
              <Button variant="secondary">{t("common.configure")}</Button>
            </div>
            <p class="text-xs text-ink-3">
              {t("foundations.scalesTo096OnPressOneFilledAction")}</p>
          </div>
        </Tile>

        <Tile title={t("foundations.textRows")}>
          <div class="flex flex-col divide-y divide-line">
            <TextRow label={t("foundations.currentValue")} value="780,704 USD" meta="+8%" />
            <TextRow label={t("foundations.logs")} value={t("foundations.label00125Of1Gb")} />
            <TextRow label={t("foundations.inPortfolioSince")} value="02/28/2023" />
          </div>
        </Tile>
      </div>
    </section>;
  };
});
