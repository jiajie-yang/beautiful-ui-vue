import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { Button, type ButtonVariant } from "@/components/atoms/Button";
import { EntityChip } from "@/components/atoms/EntityChip";
import { ValuePill } from "@/components/atoms/ValuePill";

/* ─────────────────────────────────────────────────────────
 * RECOMMENDATION CARD
 * The card holds its shape. Pressing "Alternatives" opens a
 * new drawer listing the other options; picking one promotes
 * it to the recommendation. The primary action confirms.
 * ───────────────────────────────────────────────────────── */

export type RecommendationOption = {
  key: string;
  body: UI.VNodeChild;
  short: string;
  signal: number;
  tone: string;
  label: string;
  cta: string;
  ctaVariant: ButtonVariant;
};
export type RecommendationLabels = {
  title: string;
  alternatives: string;
  otherOptions: string;
  accepted: string;
};
const DEFAULT_LABELS: RecommendationLabels = {
  get title() { return t("recommendationCard.wantMeToPlaceThisRestockOrder"); },
  get alternatives() { return t("common.alternatives"); },
  get otherOptions() { return t("recommendationCard.otherOptions"); },
  get accepted() { return t("recommendationCard.accepted"); }
};
function defaultOptions(): RecommendationOption[] { return [{
  key: "high",
  body: <>
        {t("recommendationCard.reorderWaffleConesFrom")}{" "}
        <EntityChip name="Cone King" />{" "}
        {(t("recommendationCard.withLeadTime") + " ")}<ValuePill tone="green">{t("recommendationCard.label7Days")}</ValuePill>
      </>,
  get short() { return t("recommendationCard.reorderFromConeKing7DayLead"); },
  signal: 3,
  tone: "var(--green)",
  get label() { return t("recommendationCard.highConfidence"); },
  get cta() { return t("common.accept"); },
  ctaVariant: "accent"
}, {
  key: "review",
  body: <>
        {t("recommendationCard.switchVanillaTo") + " "}<ValuePill>{t("recommendationCard.vanillaMadagascar")}</ValuePill>{(" " + t("recommendationCard.forPeakSeason"))}</>,
  get short() { return t("recommendationCard.switchToVanillaMadagascar"); },
  signal: 2,
  tone: "var(--orange)",
  get label() { return t("common.needsReview"); },
  get cta() { return t("common.configure"); },
  ctaVariant: "primary"
}, {
  key: "none",
  body: <>
        {(t("recommendationCard.fallBackToA") + " ")}<span class="font-medium text-ink">{t("recommendationCard.fullRestock")}</span>{(" " + t("recommendationCard.acrossEverySku"))}</>,
  get short() { return t("recommendationCard.fullRestockAcrossEverySku"); },
  signal: 0,
  tone: "var(--ink-3)",
  get label() { return t("recommendationCard.noSignal"); },
  get cta() { return t("recommendationCard.acceptFullRestock"); },
  ctaVariant: "primary"
}]; }
const Meter = createComponent<{
  signal: number;
  tone: string;
}>("Meter", ["signal", "tone"], (__props, __slots) => {
  const signal = computed(() => __props.signal);
  const tone = computed(() => __props.tone);
  return () => {
    return <span class="flex items-end gap-0.5">
      {[0, 1, 2].map(bar => <span key={bar} class="w-1 rounded-full transition-colors duration-300" style={cssStyle({
        height: 10,
        background: bar < signal.value ? tone.value : "var(--line-strong)"
      })} />)}
    </span>;
  };
});
const RecommendationCard = createComponent<{
  options?: RecommendationOption[];
  labels?: Partial<RecommendationLabels>;
  variant?: string;
}>("RecommendationCard", ["options", "labels", "variant"], (__props, __slots) => {
  const options = computed(() => __props.options === undefined ? defaultOptions() : __props.options);
  const labels = computed(() => __props.labels);
  const t = computed(() => ({
    ...DEFAULT_LABELS,
    ...labels.value
  }));
  const [selected, setSelected] = createState(0);
  const [open, setOpen] = createState(false);
  const [accepted, setAccepted] = createState(false);
  const active = computed(() => options.value[selected.value]);
  const others = computed(() => options.value.map((o, i) => ({
    o,
    i
  })).filter(({
    i
  }) => i !== selected.value));
  return () => {
    return <div class="w-full max-w-95 overflow-hidden rounded-card bg-surface shadow-card">
      <div class="primitive-card-pad">
        <span class="text-[14px] font-medium text-ink">
          {t.value.title}
        </span>
        <p key={active.value.key} class="mt-1.5 min-h-12 text-[13px] leading-relaxed text-ink-2" style={cssStyle({
          animation: "fade-in 180ms ease-out both"
        })}>
          {active.value.body}
        </p>
      </div>

      {/* alternatives drawer — a distinctly new section of the card */}
      <div class="grid transition-[grid-template-rows,opacity] duration-300" style={cssStyle({
        gridTemplateRows: open.value ? "1fr" : "0fr",
        opacity: open.value ? 1 : 0,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
      })}>
        <div class="overflow-hidden">
          <div class="border-t border-line bg-surface px-2 py-2">
            <p class="px-1.5 pb-1 text-[11px] font-medium text-ink-3">
              {t.value.otherOptions}
            </p>
            {others.value.map(({
              o,
              i
            }) => <button key={o.key} type="button" onClick={() => {
              setSelected(i);
              setAccepted(false);
            }} class="flex w-full items-center gap-2.5 rounded-control px-1.5 py-1.5
                  text-left transition-colors duration-100 hover:bg-hover">
                <Meter signal={o.signal} tone={o.tone} />
                <span class="min-w-0 flex-1 truncate text-[12.5px] text-ink">{o.short}</span>
                <span class="shrink-0 text-[11px] text-ink-3">{o.label}</span>
              </button>)}
          </div>
        </div>
      </div>

      <div class="primitive-card-footer flex items-center justify-between gap-3 bg-surface">
        <span class="flex items-center gap-2">
          <Meter signal={active.value.signal} tone={active.value.tone} />
          <span class="text-[12.5px] font-medium text-ink-2">{active.value.label}</span>
        </span>

        <span class="-mr-0.5 flex items-center gap-2">
          <Button variant="secondary" size="sm" aria-expanded={open.value} onClick={() => setOpen(current => !current)} className="px-2.5 text-[12.5px]">
            {t.value.alternatives}
          </Button>
          <Button variant={accepted.value ? "success" : active.value.ctaVariant} size="sm" onClick={() => setAccepted(true)} className="text-[12.5px]">
            {accepted.value ? t.value.accepted : active.value.cta}
          </Button>
        </span>
      </div>
    </div>;
  };
});
export default RecommendationCard;
