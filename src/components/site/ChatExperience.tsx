import { t } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import ApprovalCard from "@/components/primitives/ApprovalCard";
import ChatComposer from "@/components/primitives/ChatComposer";
import CodeBlock from "@/components/primitives/CodeBlock";
import ContextCards from "@/components/primitives/ContextCards";
import DiffTable from "@/components/primitives/DiffTable";
import FilterTable from "@/components/primitives/FilterTable";
import FineTuneCard from "@/components/primitives/FineTuneCard";
import InsightCards from "@/components/primitives/InsightCards";
import LoadingState from "@/components/primitives/LoadingState";
import RecommendationCard from "@/components/primitives/RecommendationCard";
import RecordsTable from "@/components/primitives/RecordsTable";
import SearchList from "@/components/primitives/SearchList";
import SidebarNav from "@/components/primitives/SidebarNav";
import StreamingText from "@/components/primitives/StreamingText";
import TaskRows from "@/components/primitives/TaskRows";
import ThinkingState from "@/components/primitives/ThinkingState";
import ToolChips from "@/components/primitives/ToolChips";
const Spark = createComponent<{
  className?: string;
}>("Spark", ["className"], (__props, __slots) => {
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  return () => {
    return <span class={`flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-ink text-surface shadow-hairline ${className.value}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z" />
      </svg>
    </span>;
  };
});
const Chevron = createComponent<{
  open: boolean;
}>("Chevron", ["open"], (__props, __slots) => {
  const open = computed(() => __props.open);
  return () => {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300" style={cssStyle({
      transform: open.value ? "rotate(180deg)" : "rotate(0)"
    })} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>;
  };
});
const AssistantMessage = createComponent<{
  eyebrow: string;
  children: UI.VNodeChild;
  className?: string;
}>("AssistantMessage", ["eyebrow", "children", "className"], (__props, __slots) => {
  const eyebrow = computed(() => __props.eyebrow);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  return () => {
    return <article class={`flex gap-3 ${className.value}`} style={cssStyle({
      animation: "fade-up 450ms cubic-bezier(0.23,1,0.32,1) both"
    })}>
      <Spark className="mt-0.5" />
      <div class="min-w-0 flex-1">
        <span class="mb-2 block text-[11px] font-medium uppercase tracking-[0.09em] text-ink-3">{eyebrow.value}</span>
        {children.value}
      </div>
    </article>;
  };
});
const SectionHeading = createComponent<{
  number: string;
  title: string;
  detail: string;
}>("SectionHeading", ["number", "title", "detail"], (__props, __slots) => {
  const number = computed(() => __props.number);
  const title = computed(() => __props.title);
  const detail = computed(() => __props.detail);
  return () => {
    return <div class="mb-3 flex items-baseline gap-2">
      <span class="font-mono text-[10.5px] tabular-nums text-ink-3">{number.value}</span>
      <h2 class="text-[13px] font-semibold text-ink">{title.value}</h2>
      <span class="truncate text-[12px] text-ink-3">{detail.value}</span>
    </div>;
  };
});
const ContextRail = createComponent<Record<string, never>>("ContextRail", [], (__props, __slots) => {
  return () => {
    return <aside class="hidden w-[304px] shrink-0 border-l border-line bg-canvas/45 px-5 py-6 2xl:block">
      <div class="sticky top-6 flex flex-col gap-7">
        <div>
          <div class="mb-3 flex items-center justify-between">
            <span class="text-[12px] font-semibold text-ink">{t("harness.workspaceSearch")}</span>
            <kbd class="rounded-[5px] bg-field px-1.5 py-0.5 font-mono text-[10px] text-ink-3 shadow-hairline">{"⌘ K"}</kbd>
          </div>
          <SearchList />
        </div>

        <div>
          <SectionHeading number="01" title={t("common.context")} detail={t("harness.label3Sources")} />
          <ContextCards />
        </div>

        <div>
          <SectionHeading number="02" title={t("harness.tuneResponse")} detail={t("harness.liveInspector")} />
          <FineTuneCard />
        </div>
      </div>
    </aside>;
  };
});
const ChatExperience = createComponent<Record<string, never>>("ChatExperience", [], (__props, __slots) => {
  const [runOpen, setRunOpen] = createState(true);
  return () => {
    return <main class="min-h-screen bg-page p-3 text-ink sm:p-5 lg:p-7">
      <div class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] overflow-hidden rounded-window bg-page shadow-overlay sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3.5rem)]">
        <div class="hidden shrink-0 border-r border-line bg-canvas/35 lg:block">
          <SidebarNav fill />
        </div>

        <section class="flex min-w-0 flex-1 flex-col bg-page">
          <header class="flex h-[68px] shrink-0 items-center justify-between border-b border-line px-4 sm:px-7">
            <div class="flex min-w-0 items-center gap-3">
              <button type="button" aria-label={t("harness.openWorkspaceNavigation")} class="flex size-8 items-center justify-center rounded-control text-ink-3 transition-colors duration-150 hover:bg-hover hover:text-ink lg:hidden">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="truncate text-[14px] font-semibold text-ink">{t("harness.pistachioExpansion")}</span>
                  <span class="rounded-full bg-green-tint px-2 py-0.5 text-[10.5px] font-medium text-green">{t("harness.live")}</span>
                </div>
                <span class="block truncate text-[11.5px] text-ink-3">{t("harness.flavorStrategyUpdatedMomentsAgo")}</span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" class="hidden h-8 items-center gap-1.5 rounded-control bg-field px-2.5 text-[12px] font-medium text-ink-2 shadow-btn transition-[background-color,color,transform] duration-150 hover:bg-hover hover:text-ink active:scale-[0.97] sm:flex">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M12 3v18M3 12h18" /></svg>
                {t("common.newChat")}</button>
              <button type="button" aria-label={t("harness.shareConversation")} class="flex size-8 items-center justify-center rounded-control text-ink-3 transition-colors duration-150 hover:bg-hover hover:text-ink">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.9 7.5-4.6M8.2 13.1l7.5 4.6" /></svg>
              </button>
            </div>
          </header>

          <div class="flex min-h-0 flex-1">
            <div class="min-w-0 flex-1 overflow-y-auto overscroll-contain">
              <div class="mx-auto max-w-[820px] px-4 py-8 pb-10 sm:px-8 sm:py-10 lg:px-12">
                <div class="mb-8 flex justify-end pl-10 sm:pl-24">
                  <div class="rounded-xl bg-field px-3.5 py-2 text-[13px] leading-relaxed text-ink shadow-hairline">
                    {t("harness.whereShouldWeExpandPistachioThisSummerAndWhat")}</div>
                </div>

                <AssistantMessage eyebrow={t("harness.scoopAnalysisComplete")}>
                  <p class="max-w-[620px] text-[14px] leading-[1.65] text-ink">
                    {t("harness.iPulledTogetherTheSeasonalSignalSupplierContextAnd")}</p>

                  <div class="mt-5 rounded-card bg-canvas/70 p-3 shadow-hairline sm:p-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span class="block text-[12px] font-semibold text-ink">{t("harness.researchRun")}</span>
                        <span class="block text-[11px] text-ink-3">{t("harness.aSmallTrailOfWorkKeptCloseToThe")}</span>
                      </div>
                      <button type="button" aria-expanded={runOpen.value} onClick={() => setRunOpen(current => !current)} class="flex h-7 items-center gap-1.5 rounded-control bg-surface px-2 text-[11.5px] font-medium text-ink-2 shadow-btn transition-[background-color,color,transform] duration-150 hover:bg-hover hover:text-ink active:scale-[0.97]">
                        {runOpen.value ? t("harness.hideDetails") : t("harness.showDetails")}
                        <Chevron open={runOpen.value} />
                      </button>
                    </div>
                    <div class="grid transition-[grid-template-rows,opacity] duration-400" style={cssStyle({
                      gridTemplateRows: runOpen.value ? "1fr" : "0fr",
                      opacity: runOpen.value ? 1 : 0
                    })}>
                      <div class="min-h-0 overflow-hidden">
                        <div class="mt-4 flex flex-col gap-5 border-t border-line pt-4">
                          <div>
                            <SectionHeading number="01" title={t("common.thinking")} detail={t("harness.agentTrace")} />
                            <ThinkingState variant="Search" />
                          </div>
                          <div>
                            <SectionHeading number="02" title={t("harness.tools")} detail={t("harness.label4Calls2Messages")} />
                            <ToolChips />
                          </div>
                          <LoadingState label={t("harness.buildingTheComparison")} variant="Dots" />
                        </div>
                      </div>
                    </div>
                  </div>
                </AssistantMessage>

                <AssistantMessage eyebrow={t("harness.scoopKeySignal")} className="mt-12">
                  <div class="max-w-[630px]">
                    <StreamingText />
                  </div>
                  <div class="mt-5">
                    <SectionHeading number="03" title={t("harness.seasonalSignal")} detail={t("harness.last3Summers")} />
                    <InsightCards />
                  </div>
                </AssistantMessage>

                <AssistantMessage eyebrow={t("harness.scoopRecommendation")} className="mt-12">
                  <p class="mb-4 max-w-[600px] text-[13px] leading-relaxed text-ink-2">{t("harness.theStrongestMoveIsToSecureConesFromThe")}</p>
                  <RecommendationCard />
                </AssistantMessage>

                <AssistantMessage eyebrow={t("harness.scoopNeedsYourCall")} className="mt-12">
                  <p class="mb-4 max-w-[600px] text-[13px] leading-relaxed text-ink-2">{t("harness.beforeIWriteTheLaunchBatchConfirmTheSize")}</p>
                  <ApprovalCard />
                </AssistantMessage>

                <AssistantMessage eyebrow={t("harness.scoopPreparingTheChange")} className="mt-12">
                  <div class="mb-4 flex items-center justify-between gap-4">
                    <p class="max-w-[480px] text-[13px] leading-relaxed text-ink-2">{t("harness.iLlStageTheNewFlavorRecordsFilterThe")}</p>
                    <span class="hidden rounded-full bg-accent-tint px-2 py-0.5 text-[10.5px] font-medium text-accent-ink sm:block">{t("harness.draft")}</span>
                  </div>
                  <div class="flex flex-col gap-6">
                    <div>
                      <SectionHeading number="04" title={t("common.tasks")} detail={t("harness.agentChecklist")} />
                      <TaskRows />
                    </div>
                    <div>
                      <SectionHeading number="05" title={t("harness.proposedEdits")} detail={t("harness.reviewBeforeApply")} />
                      <DiffTable />
                    </div>
                  </div>
                </AssistantMessage>

                <AssistantMessage eyebrow={t("harness.scoopMakerRecords")} className="mt-12">
                  <p class="mb-5 max-w-[600px] text-[13px] leading-relaxed text-ink-2">{t("harness.hereSTheWorkingSetTheFiltersAndFull")}</p>
                  <div class="flex flex-col gap-7">
                    <div>
                      <SectionHeading number="06" title={t("harness.launchFilter")} detail={t("harness.electricTags")} />
                      <div class="overflow-x-auto pb-1"><FilterTable /></div>
                    </div>
                    <div>
                      <SectionHeading number="07" title={t("harness.makerRecords")} detail={t("harness.label26Makers")} />
                      <div class="overflow-x-auto pb-1"><RecordsTable /></div>
                    </div>
                  </div>
                </AssistantMessage>

                <AssistantMessage eyebrow={t("harness.scoopBatchPlan")} className="mt-12">
                  <p class="mb-4 max-w-[600px] text-[13px] leading-relaxed text-ink-2">{t("harness.onceTheRecordsAreApprovedThisIsTheSmall")}</p>
                  <CodeBlock />
                </AssistantMessage>

                <AssistantMessage eyebrow={t("harness.scoopReadyWhenYouAre")} className="mt-12">
                  <p class="mb-4 max-w-[600px] text-[13px] leading-relaxed text-ink-2">{t("harness.everythingIsStagedAsAReviewableDraftAskFor")}</p>
                  <ChatComposer />
                </AssistantMessage>
              </div>
            </div>
            <ContextRail />
          </div>
        </section>
      </div>
    </main>;
  };
});
export default ChatExperience;
