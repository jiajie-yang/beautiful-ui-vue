import LanguageToggle from './LanguageToggle';
import { t, locale } from '@/lib/i18n';
// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, watch, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { CSSProperties, VNodeChild } from '@/lib/dom-types';
import AgentScreen from "@/components/primitives/AgentScreen";
import ApprovalCard from "@/components/primitives/ApprovalCard";
import ContextCards from "@/components/primitives/ContextCards";
import DiffTable from "@/components/primitives/DiffTable";
import InsightCards from "@/components/primitives/InsightCards";
import LoadingState from "@/components/primitives/LoadingState";
import PromptBar from "@/components/primitives/PromptBar";
import RecommendationCard from "@/components/primitives/RecommendationCard";
import RecordsTable from "@/components/primitives/RecordsTable";
import SelectionActions from "@/components/primitives/SelectionActions";
import SidebarNav from "@/components/primitives/SidebarNav";
import StreamingText from "@/components/primitives/StreamingText";
import TaskRows from "@/components/primitives/TaskRows";
import ThinkingState from "@/components/primitives/ThinkingState";
import ToolChips from "@/components/primitives/ToolChips";
import { UseThisModal } from "@/components/site/UseThisHarness";

/* ─────────────────────────────────────────────────────────
 * ICE CREAM HARNESS
 * An interactive chat window that shows every Beautiful UI
 * primitive in its natural habitat. Ask a question (or tap a
 * suggestion) and the agent replies — thinking, then building
 * the answer out of live components. Everything is fake data.
 * ───────────────────────────────────────────────────────── */

const NAME = "Shane";

/* ── shared bits ──────────────────────────────────────────── */

/* the charts land only after the streamed text has finished */
const WorkloadAnswer = createComponent<Record<string, never>>("WorkloadAnswer", [], (__props, __slots) => {
  const [showCards, setShowCards] = createState(false);
  return () => {
    return <>
      <div class="max-w-[630px]">
        <StreamingText fill loop={false} onDone={() => setShowCards(true)} />
      </div>
      {showCards.value && <div class="mt-5" style={cssStyle({
        animation: "fade-up 450ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
          <InsightCards />
        </div>}
    </>;
  };
});
/* a lightweight word-by-word reveal, reusing the streaming keyframe */
const StreamLine = createComponent<{
  text: string;
  tone?: "ink" | "ink-2";
  onDone?: () => void;
}>("StreamLine", ["text", "tone", "onDone"], (__props, __slots) => {
  const text = computed(() => __props.text);
  const tone = computed(() => __props.tone === undefined ? "ink" : __props.tone);
  const onDone = computed(() => __props.onDone);
  const words = computed(() => locale.value.startsWith('zh') ? Array.from(text.value) : text.value.split(" "));
  const [n, setN] = createState(0);
  let completed = false;
  watch(words, (next, previous) => {
    setN(completed ? next.length : Math.min(next.length, Math.floor(n.value / Math.max(1, previous.length) * next.length)));
  }, { flush: 'sync' });
  const streaming = computed(() => n.value < words.value.length);
  watchLifecycle(() => {
    if (!streaming.value) return;
    const t = setTimeout(() => setN(c => c + 1), 34);
    return () => clearTimeout(t);
  }, () => [n.value, streaming.value]);
  watchLifecycle(() => {
    if (!streaming.value && !completed) { completed = true; onDone.value?.(); }
    
  }, () => [streaming.value]);
  return () => {
    return <p class={`max-w-[620px] text-[13.5px] leading-[1.65] ${tone.value === "ink" ? "text-ink" : "text-ink-2"}`}>
      {words.value.slice(0, n.value).map((word, i) => <span key={i} class="inline">
{word}{locale.value.startsWith('zh') ? "" : " "}</span>)}
      {streaming.value && <span class="stream-caret is-streaming" />}
    </p>;
  };
});
/* a consistent reply: the intro streams in, then the artifact reveals below it
 * once the text settles — so nothing pops in before the sentence lands. */
const Reply = createComponent<{
  intro: string;
  children?: VNodeChild;
}>("Reply", ["intro", "children"], (__props, __slots) => {
  const intro = computed(() => __props.intro);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const [ready, setReady] = createState(false);
  return () => {
    return <>
      <StreamLine text={intro.value} tone="ink-2" onDone={() => setReady(true)} />
      {ready.value && children.value != null && <div class="mt-5" style={cssStyle({
        animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
          {children.value}
        </div>}
    </>;
  };
});
/* the offboarding flow: answer the questions, the card collapses to a small
 * badge, then the agent thinks again and streams a short confirmation. */
const OffboardingAnswer = createComponent<Record<string, never>>("OffboardingAnswer", [], (__props, __slots) => {
  const [stage, setStage] = createState<"form" | "thinking" | "done">("form");
  watchLifecycle(() => {
    if (stage.value !== "thinking") return;
    const t = setTimeout(() => setStage("done"), 1100);
    return () => clearTimeout(t);
  }, () => [stage.value]);
  return () => {
    return <>
      <Reply intro={t("harness.beforeIArchiveTheVendorConfirmAFewDetails")}>
        <ApprovalCard resettable={false} onSubmitted={() => setStage("thinking")} />
      </Reply>
      {stage.value === "thinking" && <div class="mt-4 flex min-h-6 items-center" style={cssStyle({
        animation: "fade-in 200ms ease-out both"
      })}>
          <LoadingState label={t("harness.archivingVendor")} variant="Dots" />
        </div>}
      {stage.value === "done" && <div class="mt-4" style={cssStyle({
        animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
          <StreamLine text={t("harness.doneIArchivedFjordDairyMovedIts3Open")} />
        </div>}
    </>;
  };
});
/* the answer streams only after the search trace settles */
const FindTicketAnswer = createComponent<Record<string, never>>("FindTicketAnswer", [], (__props, __slots) => {
  const [settled, setSettled] = createState(false);
  return () => {
    return <>
      <ThinkingState variant="Search" onSettled={() => setSettled(true)} />
      {settled.value && <div class="mt-1" style={cssStyle({
        animation: "fade-in 200ms ease-out both"
      })}>
          <StreamLine tone="ink-2" text={t("harness.foundItTheFlavorPageRedesignTicketPlusThe")} />
        </div>}
    </>;
  };
});
/* the side-panel agent viewer: connects, then goes live once the browser opens */
const BrowserPane = createComponent<Record<string, never>>("BrowserPane", [], (__props, __slots) => {
  const [variant, setVariant] = createState<"Loading" | "Working">("Loading");
  watchLifecycle(() => {
    const t = setTimeout(() => setVariant("Working"), 2400);
    return () => clearTimeout(t);
  }, () => []);
  return () => {
    return <AgentScreen agentName={t("harness.browserAgent")} variant={variant.value} />;
  };
});
/* the browser flow: spin up a browser, show the plan as a thinking trace, then
 * stream a confirmation once the (fake) appeal is filed */
const ParkingAppealAnswer = createComponent<Record<string, never>>("ParkingAppealAnswer", [], (__props, __slots) => {
  const [stage, setStage] = createState<"boot" | "think" | "working" | "done">("boot");
  watchLifecycle(() => {
    if (stage.value !== "working") return;
    const t = setTimeout(() => setStage("done"), 1800);
    return () => clearTimeout(t);
  }, () => [stage.value]);
  return () => {
    return <>
      <StreamLine tone="ink-2" text={t("harness.spinningUpABrowserYouCanWatchItWork")} onDone={() => setStage(s => s === "boot" ? "think" : s)} />
      {stage.value !== "boot" && <div class="mt-4" style={cssStyle({
        animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
          <ThinkingState variant="Steps" active={t("harness.workingTheAppeal")} done={t("harness.filedTheAppeal")} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
              </svg>} rows={[{
          get primary() { return t("harness.openingTheCityParkingPortal"); }
        }, {
          get primary() { return t("harness.locatingCitationA4471902"); }
        }, {
          get primary() { return t("harness.fillingOutTheAppealForm"); }
        }, {
          get primary() { return t("harness.attachingEvidence"); },
          get secondary() { return t("harness.label2PhotosPermit"); }
        }]} onSettled={() => setStage(s => s === "think" ? "working" : s)} />
        </div>}
      {stage.value === "working" && <div class="mt-4 flex min-h-6 items-center" style={cssStyle({
        animation: "fade-in 200ms ease-out both"
      })}>
          <LoadingState label={t("harness.submittingTheAppeal")} variant="Dots" />
        </div>}
      {stage.value === "done" && <div class="mt-4" style={cssStyle({
        animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both"
      })}>
          <StreamLine text={t("harness.doneTheAppealForCitationA4471902IsSubmittedThe")} />
        </div>}
    </>;
  };
});
/* ── scenarios ────────────────────────────────────────────────
 * Each maps a user prompt to an agent reply built from primitives.
 * `beat` is how long the agent "thinks" before the answer resolves
 * — shorter when the answer leads with its own live trace.
 */
type Scenario = {
  prompt: string;
  beat: number;
  Answer: () => VNodeChild;
  /** optional one-off waiting treatment for a scenario */
  loadingVariant?: "Surfer";
  /** render the answer across the full chat window instead of the reading column */
  fullBleed?: boolean;
  /** optional artifact for the right-hand pane */
  paneTitle?: string;
  Pane?: () => VNodeChild;
  /** spreadsheet workspace: the main pane is a live table, the chat docks to the right */
  Workspace?: () => VNodeChild;
  workspaceTitle?: string;
};
const SCENARIOS: Record<string, Scenario> = {
  appeal: {
    get prompt() { return t("harness.appealMyParkingTicketCitationA4471902"); },
    beat: 500,
    get paneTitle() { return t("common.agent"); },
    Pane: () => <BrowserPane />,
    Answer: () => <ParkingAppealAnswer />
  },
  todos: {
    get prompt() { return t("harness.whatUrgentToDosNeedMyAttentionThisMorning"); },
    beat: 1100,
    get paneTitle() { return t("common.tasks"); },
    Pane: () => <>
        <TaskRows variant="List" />
        <div class="mt-6">
          <ContextCards />
        </div>
      </>,
    Answer: () => <Reply intro={t("harness.threeThingsAreTimeSensitiveIPutTheChecklist")}>
        <RecommendationCard />
      </Reply>
  },
  workload: {
    get prompt() { return t("harness.prepASummaryOfMyWorkload"); },
    beat: 900,
    Answer: () => <WorkloadAnswer />
  },
  offboarding: {
    get prompt() { return t("harness.iNeedYourApprovalBeforeIOffBoardA"); },
    beat: 850,
    Answer: () => <OffboardingAnswer />
  },
  "find-ticket": {
    get prompt() { return t("harness.thereWasATicketAboutRedesigningTheFlavorPage"); },
    beat: 500,
    get paneTitle() { return t("common.context"); },
    Pane: () => <ContextCards />,
    Answer: () => <FindTicketAnswer />
  },
  suppliers: {
    get prompt() { return t("harness.showMeOurSupplierRecords"); },
    beat: 700,
    get workspaceTitle() { return t("common.suppliers"); },
    Workspace: () => <RecordsTable fill />,
    Answer: () => <StreamLine tone="ink-2" text={t("harness.theGridSOnTheLeftAskMeTo")} />
  },
  restock: {
    get prompt() { return t("harness.draftTheBatchRestockFunction"); },
    beat: 500,
    Answer: () => <Reply intro={t("harness.iPlannedItOutAndStagedTheEditsHover")}>
        <ToolChips />
      </Reply>
  },
  edits: {
    get prompt() { return t("harness.proposeEditsToTheFlavorList"); },
    beat: 1000,
    Answer: () => <Reply intro={t("harness.iStagedTheChangesAsAReviewableDraftNothing")}>
        <DiffTable />
      </Reply>
  },
  rewrite: {
    get prompt() { return t("harness.helpMeTightenThisLaunchNote"); },
    beat: 700,
    Answer: () => <Reply intro={t("harness.selectAnyPassageAndHandItToMeI")}>
        <SelectionActions />
      </Reply>
  },
  surfer: {
    get prompt() { return t("harness.canYouAuditTheLaunchPlanAndPutSubway"); },
    beat: 18000,
    loadingVariant: "Surfer",
    Answer: () => <Reply intro={t("harness.allDoneThanksForLockingInWithMe")} />
  }
};
type ScenarioId = keyof typeof SCENARIOS;
const KEYWORDS: [ScenarioId, string[]][] = [["appeal", ["appeal", "parking", "citation", "contest", "dispute", "fine", "browser"]], ["todos", ["todo", "to-do", "urgent", "morning", "attention", "task"]], ["workload", ["summary", "summarize", "workload", "overview", "recap", "digest"]], ["offboarding", ["approve", "approval", "off-board", "offboard", "confirm", "sign off"]], ["find-ticket", ["find", "search", "ticket", "where", "look up", "locate"]], ["suppliers", ["supplier", "records", "vendor", "table", "maker", "grid"]], ["restock", ["restock", "code", "function", "batch", "script", "reorder"]], ["edits", ["edit", "diff", "change", "propose", "update the", "flavor list"]], ["rewrite", ["rewrite", "tighten", "reword", "shorten", "note", "copy"]]];
const CHINESE_KEYWORDS: [ScenarioId, string[]][] = [
  ["appeal", ["申诉", "停车", "罚单"]],
  ["offboarding", ["停用", "归档", "审批", "批准"]],
  ["find-ticket", ["工单", "查找", "寻找"]],
  ["suppliers", ["供应商", "供应记录", "表格"]],
  ["restock", ["补货", "函数", "代码"]],
  ["edits", ["口味列表", "修改建议", "编辑"]],
  ["rewrite", ["精简", "改写", "发布说明"]],
  ["todos", ["待办", "紧急", "任务"]],
  ["workload", ["摘要", "总结", "工作量"]],
  ["surfer", ["跑酷"]],
];
function matchScenario(text: string): ScenarioId {
  const lower = text.toLowerCase();
  for (const [id, words] of CHINESE_KEYWORDS) {
    if (words.some(word => lower.includes(word))) return id;
  }
  for (const [id, words] of KEYWORDS) {
    if (words.some(word => lower.includes(word))) return id;
  }
  return "workload";
}

/* ── suggestion + recents catalogs ────────────────────────── */
const SuggestionIcon = createComponent<{
  kind: string;
}>("SuggestionIcon", ["kind"], (__props, __slots) => {
  const kind = computed(() => __props.kind);
  const paths: ComputedRef<Record<string, VNodeChild>> = computed(() => ({
    todos: <g><path d="M11 6h9M11 12h9M11 18h9" /><path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" /></g>,
    workload: <g><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 10l2.5 2.5L16 8" /></g>,
    "find-ticket": <g><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></g>,
    suppliers: <g><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></g>,
    restock: <path d="M8 6l-5 6 5 6M16 6l5 6-5 6" />,
    rewrite: <g><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></g>,
    tune: <g><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></g>,
    appeal: <g><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></g>
  }));
  return () => {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden>
      {paths.value[kind.value] ?? paths.value.workload}
    </svg>;
  };
});
const SUGGESTION_POOL: {
  id: ScenarioId;
  label: string;
}[] = [{
  id: "appeal",
  get label() { return t("harness.appealMyParkingTicket"); }
}, {
  id: "suppliers",
  get label() { return t("harness.showMeOurSupplierRecords2"); }
}, {
  id: "todos",
  get label() { return t("harness.whatUrgentToDosNeedMyAttentionThisMorning"); }
}, {
  id: "workload",
  get label() { return t("harness.prepASummaryOfMyWorkload2"); }
}, {
  id: "find-ticket",
  get label() { return t("harness.findTheTicketAboutTheFlavorPageRedesign"); }
}, {
  id: "restock",
  get label() { return t("harness.draftTheBatchRestockFunction2"); }
}, {
  id: "rewrite",
  get label() { return t("harness.tightenThisLaunchNote"); }
}];
const RECENTS: {
  id: ScenarioId;
  label: string;
  prompt?: string;
  searchText?: string;
}[] = [{
  id: "appeal",
  get label() { return t("harness.parkingTicketAppeal"); },
  get searchText() { return t("harness.parkingTicketAppeal", {}, { locale: "en" }); },
  get prompt() { return SCENARIOS.appeal.prompt; }
}, {
  id: "suppliers",
  get label() { return t("common.supplierRecords"); },
  get searchText() { return t("common.supplierRecords", {}, { locale: "en" }); }
}, {
  id: "todos",
  get label() { return t("common.urgentToDosThisMorning"); },
  get searchText() { return t("common.urgentToDosThisMorning", {}, { locale: "en" }); }
}, {
  id: "find-ticket",
  get label() { return t("common.flavorPageTicket"); },
  get searchText() { return t("common.flavorPageTicket", {}, { locale: "en" }); }
}, {
  id: "workload",
  get label() { return t("common.workloadSummary"); },
  get searchText() { return t("common.workloadSummary", {}, { locale: "en" }); }
}, {
  id: "offboarding",
  get label() { return t("common.offBoardASupplier"); },
  get searchText() { return t("common.offBoardASupplier", {}, { locale: "en" }); }
}, {
  id: "restock",
  get label() { return t("common.batchRestockFunction"); },
  get searchText() { return t("common.batchRestockFunction", {}, { locale: "en" }); }
}, {
  id: "edits",
  get label() { return t("common.proposeFlavorEdits"); },
  get searchText() { return t("common.proposeFlavorEdits", {}, { locale: "en" }); }
}, {
  id: "surfer",
  get label() { return t("common.subwaySurfing"); },
  get searchText() { return t("common.subwaySurfing", {}, { locale: "en" }); },
  get prompt() { return SCENARIOS.surfer.prompt; }
}];

/* ── the agent reply — thinks, then builds the answer ─────── */
const AssistantResponse = createComponent<{
  scenarioId: ScenarioId;
  className?: string;
}>("AssistantResponse", ["scenarioId", "className"], (__props, __slots) => {
  const scenarioId = computed(() => __props.scenarioId);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  const scenario = computed(() => SCENARIOS[scenarioId.value]);
  const [answered, setAnswered] = createState(false);
  watchLifecycle(() => {
    const t = setTimeout(() => setAnswered(true), scenario.value.beat);
    return () => clearTimeout(t);
  }, () => [scenario.value.beat]);
  return () => {
    return <article class={`min-w-0 ${className.value}`} style={cssStyle({
      animation: "fade-up 450ms cubic-bezier(0.23,1,0.32,1) both"
    })}>
      {answered.value ? <div style={cssStyle({
        animation: "fade-in 260ms ease both"
      })}>{scenario.value.Answer()}</div> : <div class="flex min-h-6 items-center" style={cssStyle({
        animation: "fade-in 200ms ease-out both"
      })}>
          {scenario.value.loadingVariant === "Surfer" ? <LoadingState variant="Surfer" /> : <LoadingState label={t("common.thinking")} variant="Dots" />}
        </div>}
    </article>;
  };
});
const UserBubble = createComponent<{
  text: string;
}>("UserBubble", ["text"], (__props, __slots) => {
  const text = computed(() => __props.text);
  return () => {
    return <div class="flex justify-end pl-10 sm:pl-24" style={cssStyle({
      animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both"
    })}>
      <div class="rounded-xl bg-field px-3.5 py-2 text-[13px] leading-relaxed text-ink shadow-hairline">{text.value}</div>
    </div>;
  };
});
/* ── empty state ──────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
 * HOME ENTRANCE STORYBOARD
 *
 * Read top-to-bottom. Each value is ms after mount.
 *
 *  170ms   “Hello Shane” rises 23px, blur 17px → 0
 *  330ms   question follows with the same reveal
 *  400ms   prompt bar resolves into place
 *  550ms   recommendations finish the sequence
 * ───────────────────────────────────────────────────────── */
const HOME_REVEAL_TIMING = {
  hello: 170,
  // greeting enters first
  question: 330,
  // question follows closely
  prompt: 400,
  // composer lands after the copy
  recommendations: 550 // secondary actions finish the scene
};
const HOME_REVEAL = {
  offsetY: 23,
  // px traveled upward
  blur: 17,
  // px of initial blur
  duration: 800,
  // ms for each element to settle
  easing: "cubic-bezier(0.16, 1, 0.3, 1)"
};

/* Static entrance params. These were previously tunable via DialKit; DialKit
 * (a dev-only tuning overlay) has been removed, so we use the tuned defaults. */
const revealParams = {
  reveal: {
    blur: HOME_REVEAL.blur,
    offsetY: HOME_REVEAL.offsetY,
    duration: HOME_REVEAL.duration
  },
  sequence: {
    helloAt: HOME_REVEAL_TIMING.hello,
    questionAt: HOME_REVEAL_TIMING.question,
    promptAt: HOME_REVEAL_TIMING.prompt,
    recommendationsAt: HOME_REVEAL_TIMING.recommendations
  }
};
function homeRevealStyle(visible: boolean, reveal: {
  blur: number;
  offsetY: number;
  duration: number;
}): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate3d(0, 0, 0)" : `translate3d(0, ${reveal.offsetY}px, 0)`,
    filter: visible ? "blur(0px)" : `blur(${reveal.blur}px)`,
    transition: ["opacity", "transform", "filter"].map(property => `${property} ${reveal.duration}ms ${HOME_REVEAL.easing}`).join(", ")
  };
}
const EmptyState = createComponent<{
  onSend: (text: string, id: ScenarioId) => void;
  shuffle: () => void;
  offset: number;
}>("EmptyState", ["onSend", "shuffle", "offset"], (__props, __slots) => {
  const onSend = computed(() => __props.onSend);
  const shuffle = computed(() => __props.shuffle);
  const offset = computed(() => __props.offset);
  const shown = computed(() => [0, 1, 2].map(i => SUGGESTION_POOL[(offset.value + i) % SUGGESTION_POOL.length]));
  const [stage, setStage] = createState(0);
  watchLifecycle(() => {
    setStage(0);
    const timers = [setTimeout(() => setStage(1), revealParams.sequence.helloAt), setTimeout(() => setStage(2), revealParams.sequence.questionAt), setTimeout(() => setStage(3), revealParams.sequence.promptAt), setTimeout(() => setStage(4), revealParams.sequence.recommendationsAt)];
    return () => timers.forEach(clearTimeout);
  }, () => []);
  return () => {
    return <div class="mx-auto flex min-h-full max-w-[720px] flex-col justify-center px-4 py-10 sm:px-8">
      <h1 class="text-[26px] font-normal tracking-[-0.02em] text-ink">
        <span class="home-reveal block text-ink-3" style={cssStyle(homeRevealStyle(stage.value >= 1, revealParams.reveal))}>{(t("harness.hello") + " ")} {NAME}</span>
        <span class="home-reveal block" style={cssStyle(homeRevealStyle(stage.value >= 2, revealParams.reveal))}>{t("harness.whatCanIHelpYouWith")}</span>
      </h1>

      <div class="home-reveal relative mt-7" style={cssStyle(homeRevealStyle(stage.value >= 3, revealParams.reveal))}>
        <div class="relative">
          <PromptBar demo={false} tall placeholder={t("harness.askAnythingAboutYourCreameryOps")} onSend={text => onSend.value(text, matchScenario(text))} />
        </div>
      </div>

      <div class="home-reveal mt-6 flex flex-col" style={cssStyle(homeRevealStyle(stage.value >= 4, revealParams.reveal))}>
        {shown.value.map(item => <button key={item.id} type="button" onClick={() => {
          onSend.value(item.label, item.id);
        }} class="-mx-2 flex items-center gap-3 rounded-control px-2 py-2.5 text-left text-[14px] text-ink transition-colors duration-150 hover:bg-hover">
            <span class="text-ink-3">
              {item.id === "offboarding" ? <span class="block size-3.5 rounded-full bg-gradient-to-br from-orange to-red" /> : <SuggestionIcon kind={item.id} />}
            </span>
            <span class="min-w-0 truncate">{item.label}</span>
          </button>)}
        <div class="mt-1 flex items-center gap-5 pl-0.5 text-[13px] text-ink-3">
          <button type="button" class="flex items-center gap-2 py-1 transition-colors duration-150 hover:text-ink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
            {t("harness.connectYourAppsForABetterExperience")}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <button type="button" onClick={shuffle.value} class="flex items-center gap-2 py-1 transition-colors duration-150 hover:text-ink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" /></svg>
            {t("harness.shuffleSuggestions")}</button>
        </div>
      </div>
    </div>;
  };
});
/* ── main ─────────────────────────────────────────────────── */
type Msg = {
  id: number;
  role: "user";
  text: string;
} | {
  id: number;
  role: "assistant";
  scenarioId: ScenarioId;
};
type Chat = {
  id: number;
  recentId?: ScenarioId;
  title: string | null;
  messages: Msg[];
};

/* the pane arrives on the same beat as the answer it belongs to */
/* The pane shell reserves its space as soon as the message is sent, so the
 * column never reflows mid-thought. Only the body swaps — a quiet loader while
 * the agent works, then the artifact fades up in place. */
const PaneBody = createComponent<{
  beat: number;
  children: VNodeChild;
}>("PaneBody", ["beat", "children"], (__props, __slots) => {
  const beat = computed(() => __props.beat);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const [show, setShow] = createState(false);
  watchLifecycle(() => {
    const t = setTimeout(() => setShow(true), beat.value);
    return () => clearTimeout(t);
  }, () => [beat.value]);
  return () => {
    if (!show.value) {
      return <div class="flex h-full items-center justify-center pb-10">
        <LoadingState label={t("harness.gathering")} variant="Dots" />
      </div>;
    }
    return <div style={cssStyle({
      animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both"
    })}>{children.value}</div>;
  };
});
/* ── spreadsheet views + property inspector ───────────────────
 * The bottom bar lists views; selecting one swaps the right pane
 * from the assistant chat to a Property configuration inspector.
 */
const SPREADSHEET_VIEWS = [{
  id: "main", get name() { return t("harness.main"); },
  color: "var(--ink-3)",
  count: 60
}, {
  id: "gelato", get name() { return t("common.gelato"); },
  color: "oklch(0.627 0.23 296.668)",
  count: 17
}, {
  id: "wholesale", get name() { return t("common.wholesale"); },
  color: "oklch(0.611 0.21 263.944)",
  count: 12
}, {
  id: "dairy-free", get name() { return t("common.dairyFree"); },
  color: "oklch(0.671 0.118 219.351)",
  count: 9
}];
const ConfigSwitch = createComponent<{
  on: boolean;
  onToggle: () => void;
}>("ConfigSwitch", ["on", "onToggle"], (__props, __slots) => {
  const on = computed(() => __props.on);
  const onToggle = computed(() => __props.onToggle);
  return () => {
    return <button type="button" role="switch" aria-label={t("common.grounding")} aria-checked={on.value} onClick={onToggle.value} class="relative h-4.5 w-7.5 shrink-0 rounded-full transition-colors duration-150" style={cssStyle({
      background: on.value ? "var(--accent)" : "var(--line-strong)"
    })}>
      <span class="absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow-btn transition-transform duration-150" style={cssStyle({
        transform: on.value ? "translateX(12px)" : "translateX(0)",
        transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
      })} />
    </button>;
  };
});
const PropertyConfig = createComponent<{
  view: string;
  onClose: () => void;
}>("PropertyConfig", ["view", "onClose"], (__props, __slots) => {
  const view = computed(() => __props.view);
  const onClose = computed(() => __props.onClose);
  const [grounding, setGrounding] = createState(false);
  return () => {
    return <div class="flex min-h-0 flex-1 flex-col" style={cssStyle({
      animation: "fade-in 160ms ease-out both"
    })}>
      <div class="flex h-11 shrink-0 items-center justify-between border-b border-line px-3 sm:pl-4">
        <span class="text-[13px] font-semibold text-ink">{t("harness.propertyConfiguration")}</span>
        <div class="flex items-center gap-0.5 text-ink-3">
          <button type="button" aria-label={t("harness.previous")} class="flex size-6 items-center justify-center rounded-[6px] transition-colors duration-100 hover:bg-hover hover:text-ink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" aria-label={t("harness.next")} class="flex size-6 items-center justify-center rounded-[6px] transition-colors duration-100 hover:bg-hover hover:text-ink">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <button type="button" aria-label={t("harness.backToChat")} onClick={onClose.value} class="flex size-6 items-center justify-center rounded-[6px] transition-colors duration-100 hover:bg-hover hover:text-ink">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="text-[14px] font-semibold text-ink">{t("harness.label0Suppliers", [view.value])}</div>

        <div class="mt-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[13px] text-ink-3">{t("common.type")}</span>
            <span class="flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M4 6h16M4 12h10M4 18h7" /></svg>
              {t("harness.viewFilter")}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[13px] text-ink-3">{t("common.model")}</span>
            <span class="flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" aria-hidden><path d="M12 3l1.7 5.1a2 2 0 0 0 1.2 1.2L20 11l-5.1 1.7a2 2 0 0 0-1.2 1.2L12 19l-1.7-5.1a2 2 0 0 0-1.2-1.2L4 11l5.1-1.7a2 2 0 0 0 1.2-1.2z" /></svg>
              {"Sprinkles 5"}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[13px] text-ink-3">{t("common.grounding")}</span>
            <ConfigSwitch on={grounding.value} onToggle={() => setGrounding(v => !v)} />
          </div>
        </div>

        <div class="mt-4 rounded-[10px] bg-inset p-3 text-[13px] leading-relaxed text-ink-2 shadow-hairline">
          {(t("harness.onlySurface") + " ")}<span class="rounded-[5px] bg-accent-tint px-1.5 py-0.5 text-[12px] font-medium text-accent-ink">{view.value}</span>{(" " + t("harness.suppliersWithAStrongRecentConnectionNothingElse"))}</div>

        <button type="button" class="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[9px] text-[12.5px] font-medium text-ink shadow-btn transition-[background-color,transform] duration-150 hover:bg-hover active:scale-[0.98]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" /></svg>
          {t("harness.recomputeStaleFields")}</button>

        <div class="mt-6 flex flex-col gap-1">
          {[{
            get label() { return t("harness.useWebhooksToIntegrateWithOtherTools"); },
            icon: <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z" />
          }, {
            get label() { return t("harness.configureAZapierIntegration"); },
            icon: <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z" />
          }].map(row => <button key={row.label} type="button" class="-mx-1.5 flex items-center gap-2.5 rounded-[8px] px-1.5 py-2 text-left text-[13px] text-ink transition-colors duration-100 hover:bg-hover">
              <span class="text-accent"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>{row.icon}</svg></span>
              {row.label}
            </button>)}
        </div>

        <button type="button" class="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-[9px] bg-red-tint text-[12.5px] font-medium text-red transition-[filter,transform] duration-150 hover:brightness-95 active:scale-[0.98]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
          {t("harness.deleteProperty")}</button>
      </div>
    </div>;
  };
});
const IceCreamHarness = createComponent<Record<string, never>>("IceCreamHarness", [], (__props, __slots) => {
  const [chats, setChats] = createState<Chat[]>([{
    id: 1,
    title: null,
    messages: []
  }]);
  const [activeId, setActiveId] = createState(1);
  const [offset, setOffset] = createState(0);
  /* spreadsheet: which view/property is open in the right inspector (null = chat) */
  const [propView, setPropView] = createState<string | null>(null);
  /* "use this harness" open-source modal */
  const [useOpen, setUseOpen] = createState(false);
  const chatIdRef = templateRef(1);
  const msgIdRef = templateRef(0);
  const scrollRef = templateRef<HTMLDivElement>(null);
  const composerRef = templateRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = createState(150);
  const chat = computed(() => chats.value.find(c => c.id === activeId.value) ?? chats.value[0]);
  const active = computed(() => chat.value.messages.length > 0);

  /* right-hand pane: the latest assistant message that carries one */
  const [closedPaneId, setClosedPaneId] = createState(0);
  const lastPaneMsg = computed(() => [...chat.value.messages].reverse().find((m): m is Extract<Msg, {
    role: "assistant";
  }> => m.role === "assistant" && !!SCENARIOS[m.scenarioId].Pane));
  const paneMsg = computed(() => lastPaneMsg.value && lastPaneMsg.value.id !== closedPaneId.value ? lastPaneMsg.value : null);
  const paneScenario = computed(() => paneMsg.value! ? SCENARIOS[paneMsg.value!.scenarioId] : null);

  /* spreadsheet workspace: table becomes the main pane, chat docks to the right */
  const workspaceMsg = computed(() => [...chat.value.messages].reverse().find((m): m is Extract<Msg, {
    role: "assistant";
  }> => m.role === "assistant" && !!SCENARIOS[m.scenarioId].Workspace));
  const workspaceScenario = computed(() => workspaceMsg.value ? SCENARIOS[workspaceMsg.value.scenarioId] : null);
  const appendExchange = (target: Chat, text: string, scenarioId: ScenarioId): Chat => ({
    ...target,
    title: target.title ?? (text.length > 30 ? `${text.slice(0, 30).trimEnd()}…` : text),
    messages: [...target.messages, {
      id: msgIdRef.value += 1,
      role: "user",
      text
    }, {
      id: msgIdRef.value += 1,
      role: "assistant",
      scenarioId
    }]
  });
  const send = (text: string, scenarioId: ScenarioId) => {
    setChats(current => current.map(c => c.id === chat.value.id ? appendExchange(c, text, scenarioId) : c));
  };

  /* reopening an existing chat replays it; otherwise recents open in a
   * fresh chat unless the current one is empty */
  const [replay, setReplay] = createState<Record<number, number>>({});
  const pickRecent = (scenarioId: ScenarioId, label: string, prompt = label) => {
    const existing = chats.value.find(c => c.recentId === scenarioId);
    if (existing) {
      if (prompt !== label) {
        setChats(current => current.map(c => c.id === existing.id ? {
          ...c,
          messages: c.messages.map(message => message.role === "user" && message.text === label ? {
            ...message,
            text: prompt
          } : message)
        } : c));
      }
      setActiveId(existing.id);
      setReplay(current => ({
        ...current,
        [existing.id]: (current[existing.id] ?? 0) + 1
      }));
      return;
    }
    if (chat.value.messages.length === 0) {
      setChats(current => current.map(c => c.id === chat.value.id ? appendExchange({
        ...c,
        recentId: scenarioId,
        title: label
      }, prompt, scenarioId) : c));
      return;
    }
    const id = chatIdRef.value += 1;
    setChats(current => [...current, appendExchange({
      id,
      recentId: scenarioId,
      title: label,
      messages: []
    }, prompt, scenarioId)]);
    setActiveId(id);
  };
  const newChat = () => {
    const id = chatIdRef.value += 1;
    setChats(current => [...current, {
      id,
      title: null,
      messages: []
    }]);
    setActiveId(id);
  };
  const closeChat = (id: number) => {
    const remaining = chats.value.filter(c => c.id !== id);
    if (remaining.length === 0) {
      const nid = chatIdRef.value += 1;
      setChats([{
        id: nid,
        title: null,
        messages: []
      }]);
      setActiveId(nid);
      return;
    }
    setChats(remaining);
    if (id === activeId.value) setActiveId(remaining[remaining.length - 1].id);
  };
  watchLifecycle(() => {
    if (!active.value) return;
    const el = scrollRef.value;
    if (el) el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth"
    });
  }, () => [chat.value.messages, active.value]);

  /* the composer floats over the thread (ChatGPT-style), so the thread pads its
   * bottom by the composer's height — that lets the last message rest flush with
   * the bar and older content scroll behind it. Measure it as it changes. */
  watchLifecycle(() => {
    const el = composerRef.value;
    if (!el) return;
    const measure = () => setComposerH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, () => [active.value, activeId.value]);

  /* artifacts (charts, tables, approval cards) reveal after the text streams
   * in, growing the thread well after `messages` last changed — often in one
   * big jump. Track whether the reader is pinned to the bottom from their
   * scroll position, then follow any later growth so a tall reply's footer
   * isn't left clipped behind the composer. Scrolling up to re-read releases
   * the pin. */
  watchLifecycle(() => {
    if (!active.value) return;
    const el = scrollRef.value;
    const content = el?.firstElementChild;
    if (!el || !content) return;
    let stick = true;
    let raf = 0;
    const onScroll = () => {
      stick = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    const pin = () => {
      if (!stick) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    };
    el.addEventListener("scroll", onScroll, {
      passive: true
    });
    // ResizeObserver catches gradual growth (streaming); MutationObserver catches
    // a whole artifact being inserted and its height-animation style ticks.
    const resize = new ResizeObserver(pin);
    resize.observe(content);
    const mutate = new MutationObserver(pin);
    mutate.observe(content, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"]
    });
    return () => {
      el.removeEventListener("scroll", onScroll);
      resize.disconnect();
      mutate.disconnect();
      cancelAnimationFrame(raf);
    };
  }, () => [active.value, activeId.value]);

  /* switching threads returns the inspector to the chat */
  watchLifecycle(() => setPropView(null), () => [activeId.value]);

  /* the tab bar rides the top of the main pane in both layouts */
  const tabBar = computed(() => <div class="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chats.value.map(c => <div key={c.id}
    /* fixed width so every close button sits in the same spot — you can
     * close a run of tabs without chasing the next × across the bar */ class={`group/tab flex h-7 w-36 shrink-0 items-center gap-0.5 rounded-[7px] pl-2.5 pr-0.5 text-[12.5px] font-medium transition-colors duration-100 ${c.id === activeId.value ? "bg-hover-2 text-ink" : "text-ink-2 hover:bg-hover hover:text-ink"}`}>
          <button type="button" aria-pressed={c.id === activeId.value} onClick={() => setActiveId(c.id)} title={c.title ?? "New chat"} class="min-w-0 flex-1 text-left">
            <span class="block truncate">{c.title ?? "New chat"}</span>
          </button>
          <button type="button" aria-label={t("harness.closeTab")} onClick={() => closeChat(c.id)} class="-my-1 flex size-6 shrink-0 items-center justify-center rounded-[5px] text-ink-3 transition-[background-color,color] duration-100 hover:bg-hover-2 hover:text-ink">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>)}
      <button type="button" aria-label={t("common.newChat")} onClick={newChat} class="ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-[7px] text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>);

  /* the message thread + composer — reused as the main column (wide) or the
   * docked assistant panel in spreadsheet mode (narrow) */
  const renderThread = (narrow: boolean) => <div class="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} class="chat-thread-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div class={`flex flex-col gap-8 pt-8 ${narrow ? "px-4" : "px-4 sm:px-8 lg:px-12"}`}
      /* pad the bottom by the floating composer's height so the last message
         can rest flush with the bar and older content scrolls behind it */ style={cssStyle({
        paddingBottom: composerH.value + 16
      })}>
          {chat.value.messages.map(message => {
          const full = !narrow && message.role === "assistant" && SCENARIOS[message.scenarioId].fullBleed;
          return <div key={message.id} class={narrow || full ? "w-full" : "mx-auto w-full max-w-[720px]"}>
                {message.role === "user" ? <UserBubble text={message.text} /> : <AssistantResponse key={`${message.id}-${replay.value[chat.value.id] ?? 0}`} scenarioId={message.scenarioId} />}
              </div>;
        })}
        </div>
      </div>

      {/* soft fade so content dissolves into the bar instead of hard-clipping */}
      <div class="pointer-events-none absolute inset-x-0 bottom-0" style={cssStyle({
      height: composerH.value + 32,
      background: "linear-gradient(to top, var(--page) 64%, transparent)"
    })} />

      {/* the composer floats over the thread; content scrolls behind it */}
      <div ref={composerRef} class={`absolute inset-x-0 bottom-0 ${narrow ? "p-3" : "px-4 pb-6 sm:px-8 lg:px-12"}`}>
        <div class={narrow ? "" : "mx-auto max-w-[720px]"}>
          <PromptBar demo={false} tall placeholder={t("harness.reply")} onSend={text => send(text, matchScenario(text))} />
        </div>
      </div>
    </div>;
  return () => {
    return <main class="flex h-[100dvh] gap-0 bg-canvas p-2.5 text-ink lg:pl-0">
      <SidebarNav fill className="hidden lg:flex" recents={RECENTS} activeRecentId={chat.value.recentId ?? null} onPick={(id, label, prompt) => pickRecent(id as ScenarioId, label, prompt)} onNewChat={newChat} footerLabel={t("harness.forkThis")} onFooterClick={() => setUseOpen(true)} />

      <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <header class="flex shrink-0 items-center justify-between gap-2 px-2"><a href="/" class="text-[12px] text-ink-2 hover:text-ink">{t("common.components")}</a><LanguageToggle /></header>
        {/* panels row — main pane + docked side pane */}
        <div class="flex min-h-0 flex-1 gap-2.5">
          {workspaceScenario.value ? <>
              {/* main pane — the live spreadsheet */}
              <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-page">
                {tabBar.value}
                <div class="flex min-h-0 flex-1 flex-col">{workspaceScenario.value.Workspace?.()}</div>
                {/* views — selecting one opens its property inspector on the right */}
                <div class="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-t border-line px-2">
                  <button type="button" class="flex h-7 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-medium text-ink-2 transition-colors duration-100 hover:bg-hover hover:text-ink">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                    {t("harness.sortFilter")}</button>
                  <span class="mx-1 h-4 w-px shrink-0 bg-line" />
                  {SPREADSHEET_VIEWS.map(v => <button key={v.id} type="button" aria-pressed={propView.value === v.id} onClick={() => setPropView(current => current === v.id ? null : v.id)} class={`flex h-7 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-medium transition-colors duration-100 ${propView.value === v.id ? "bg-hover-2 text-ink" : "text-ink-2 hover:bg-hover hover:text-ink"}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={v.color} stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden class="shrink-0"><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M3.5 9.5h17M9.5 9.5v11" /></svg>
                      {v.name}
                      <span class="text-[11px] tabular-nums text-ink-3">{v.count}</span>
                    </button>)}
                  <button type="button" class="ml-0.5 flex h-7 shrink-0 items-center gap-1.5 rounded-[7px] px-2 text-[12.5px] font-medium text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                    {t("harness.newView")}</button>
                </div>
              </section>

              {/* right inspector — assistant chat, or a property configurator when a view is selected */}
              <aside class="hidden w-[400px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-line bg-page lg:flex" style={cssStyle({
              animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both"
            })}>
                {propView.value ? <PropertyConfig view={SPREADSHEET_VIEWS.find(item => item.id === propView.value)?.name ?? propView.value} onClose={() => setPropView(null)} /> : <>
                    <div class="flex h-11 shrink-0 items-center border-b border-line px-4">
                      <span class="text-[13px] font-semibold text-ink">{t("common.chat")}</span>
                    </div>
                    {renderThread(true)}
                  </>}
              </aside>
            </> : <>
              <section class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-line bg-page">
                {tabBar.value}
                {active.value ? renderThread(false) : <div class="min-h-0 flex-1 overflow-y-auto">
                    <EmptyState onSend={send} shuffle={() => setOffset(current => (current + 3) % SUGGESTION_POOL.length)} offset={offset.value} />
                  </div>}
              </section>

              {/* artifact pane — its own rounded container */}
              {active.value && paneMsg.value! && paneScenario.value?.Pane && <aside key={`${paneMsg.value!.id}-${replay.value[chat.value.id] ?? 0}`} class="hidden w-[360px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-line bg-page lg:flex" style={cssStyle({
              animation: "fade-in 300ms ease both"
            })}>
                    <div class="flex h-11 shrink-0 items-center justify-between border-b border-line px-3 sm:pl-4">
                      <span class="text-[13px] font-semibold text-ink">{paneScenario.value.paneTitle}</span>
                      <div class="flex items-center gap-0.5 text-ink-3">
                        <button type="button" aria-label={t("harness.previous")} class="flex size-6 items-center justify-center rounded-[6px] transition-colors duration-100 hover:bg-hover hover:text-ink">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
                        </button>
                        <button type="button" aria-label={t("harness.next")} class="flex size-6 items-center justify-center rounded-[6px] transition-colors duration-100 hover:bg-hover hover:text-ink">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
                        </button>
                        <button type="button" aria-label={t("harness.paneOptions")} class="flex size-6 items-center justify-center rounded-[6px] transition-colors duration-100 hover:bg-hover hover:text-ink">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
                        </button>
                        <button type="button" aria-label={t("harness.closePane")} onClick={() => setClosedPaneId(paneMsg.value!.id)} class="flex size-6 items-center justify-center rounded-[6px] transition-colors duration-100 hover:bg-hover hover:text-ink">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                    <div class="min-h-0 flex-1 overflow-y-auto p-4">
                      <PaneBody beat={paneScenario.value.beat}>{paneScenario.value.Pane()}</PaneBody>
                    </div>
                  </aside>}
            </>}
        </div>
      </div>

      <UseThisModal open={useOpen.value} onClose={() => setUseOpen(false)} />
    </main>;
  };
});
export default IceCreamHarness;
