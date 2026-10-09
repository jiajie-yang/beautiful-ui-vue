import { t } from './i18n';
export type Meta = {
  id: string;
  title: string;
  caption: string;
  file: string;
  variants?: string[];
  /** other files in this repo the component imports (ids in INTERNAL) — copy these too */
  deps?: string[];
  /** npm packages the component imports — install these */
  npm?: string[];
};

/** Shared building blocks that primitives import but that don't get their own
 * gallery card. Copy these alongside any component that lists them in `deps`. */
export const INTERNAL: Record<string, { title: string; path: string }> = {
  button: { get title() { return t("common.button"); }, path: "components/atoms/Button.tsx" },
  "glide-menu": { title: "GlideMenu", path: "components/primitives/GlideMenu.tsx" },
  "entity-chip": { title: "EntityChip", path: "components/atoms/EntityChip.tsx" },
  "value-pill": { title: "ValuePill", path: "components/atoms/ValuePill.tsx" },
  shimmer: { title: "Shimmer", path: "components/atoms/Shimmer.tsx" },
  "stream-text": { title: "StreamText", path: "components/atoms/StreamText.tsx" },
};

export const META: Meta[] = [
  {
    id: "loading-state",
    get title() { return t("gallery.loadingState"); },
    get caption() { return t("gallery.pixelGridLoaderWithShimmerAndElapsedTime"); },
    file: "LoadingState.tsx",
    variants: ["Drive", "Dots", "Orbit", "Surfer"],
  },
  {
    id: "thinking-state",
    get title() { return t("common.thinking"); },
    get caption() { return t("gallery.expandableTracesStepsReasoningSearchCoding"); },
    file: "ThinkingState.tsx",
    variants: ["Steps", "Reasoning", "Search", "Coding"],
  },
  {
    id: "streaming-text",
    get title() { return t("gallery.streamingText"); },
    get caption() { return t("gallery.streamedAnswerWithInlineSourcesActionsAndFollowUps"); },
    file: "StreamingText.tsx",
  },
  {
    id: "approval-card",
    get title() { return t("gallery.approvalCard"); },
    get caption() { return t("gallery.humanInTheLoopQuestionsTheAgentAsksBefore"); },
    file: "ApprovalCard.tsx",
    deps: ["button", "glide-menu"],
  },
  {
    id: "tool-chips",
    get title() { return t("gallery.toolChips"); },
    get caption() { return t("gallery.codeEditsAndToolCallsAsCompactChips"); },
    file: "ToolChips.tsx",
  },
  {
    id: "task-rows",
    get title() { return t("gallery.taskRows"); },
    get caption() { return t("gallery.liveAgentTaskStatusRunningFailedCompleted"); },
    file: "TaskRows.tsx",
    variants: ["Capsules", "List"],
  },
  {
    id: "chat-composer",
    get title() { return t("common.chat"); },
    get caption() { return t("gallery.tabbedChatPanelWithReasoningRepliesAndAComposer"); },
    file: "ChatComposer.tsx",
  },
  {
    id: "prompt-bar",
    get title() { return t("gallery.promptBar"); },
    get caption() { return t("gallery.composerWithSourcesCommandsModelPickerAndDictation"); },
    file: "PromptBar.tsx",
    variants: ["Rounded", "Pill"],
  },
  {
    id: "recommendation-card",
    get title() { return t("gallery.recommendationCard"); },
    get caption() { return t("gallery.agentSuggestionWithAConfidenceMeterAndActions"); },
    file: "RecommendationCard.tsx",
    deps: ["button", "entity-chip", "value-pill"],
  },
  {
    id: "context-cards",
    get title() { return t("gallery.contextCards"); },
    get caption() { return t("gallery.retrievedKnowledgeChunksWithTheirSources"); },
    file: "ContextCards.tsx",
  },
  {
    id: "diff-table",
    get title() { return t("gallery.diffTable"); },
    get caption() { return t("gallery.aiProposedEditsSweepingThroughTabularData"); },
    file: "DiffTable.tsx",
    deps: ["button"],
  },
  {
    id: "records-table",
    get title() { return t("gallery.recordsTable"); },
    get caption() { return t("gallery.crmStyleGridWithTagsSortingAndRelationshipStatus"); },
    file: "RecordsTable.tsx",
    deps: ["glide-menu"],
  },
  {
    id: "filter-table",
    get title() { return t("gallery.filterTable"); },
    get caption() { return t("gallery.statusChipsThatReorganizeLiveData"); },
    file: "FilterTable.tsx",
  },
  {
    id: "sidebar-nav",
    get title() { return t("gallery.sidebarNav"); },
    get caption() { return t("gallery.collapsibleWorkspaceAndChatNavigationWithGlidingHoverStates"); },
    file: "SidebarNav.tsx",
    deps: ["glide-menu"],
  },
  {
    id: "search",
    get title() { return t("common.search"); },
    get caption() { return t("gallery.commandSearchWithLiveFilteringAndAnEmptyState"); },
    file: "SearchList.tsx",
    deps: ["glide-menu"],
  },
  {
    id: "flowchart",
    get title() { return t("common.flowchart"); },
    get caption() { return t("gallery.workflowTriggerAndConditionStepsOnADottedCanvas"); },
    file: "Flowchart.tsx",
  },
  {
    id: "insight-cards",
    get title() { return t("gallery.insightCards"); },
    get caption() { return t("gallery.pagedAgentInsightsWithScrubReadyLiveCharts"); },
    file: "InsightCards.tsx",
  },
  {
    id: "code-block",
    get title() { return t("gallery.codeBlock"); },
    get caption() { return t("gallery.aLineNumberedListingAndAUnifiedDiff"); },
    file: "CodeBlock.tsx",
    variants: ["Code", "Diff"],
  },
  {
    id: "fine-tune-card",
    get title() { return t("gallery.fineTuneCard"); },
    get caption() { return t("gallery.theAgentAdjustsDesignPropertiesInAnInspector"); },
    file: "FineTuneCard.tsx",
    deps: ["glide-menu"],
  },
  {
    id: "selection-actions",
    get title() { return t("gallery.selectionActions"); },
    get caption() { return t("gallery.highlightAPassageAndHandItToTheAgent"); },
    file: "SelectionActions.tsx",
    deps: ["button", "shimmer", "stream-text"],
  },
  {
    id: "agent-screen",
    get title() { return t("gallery.agentScreen"); },
    get caption() { return t("gallery.watchAnAgentSScreenOpenTeachATask"); },
    file: "AgentScreen.tsx",
    deps: ["button"],
    variants: ["Working", "Loading"],
  },
];

export const VARIANT_KEYS = {
  "Drive": "common.drive",
  "Dots": "common.dots",
  "Orbit": "gallery.orbit",
  "Surfer": "common.surfer",
  "Steps": "common.steps",
  "Reasoning": "common.reasoning",
  "Search": "common.search",
  "Coding": "common.coding",
  "Capsules": "common.capsules",
  "List": "common.list",
  "Rounded": "common.rounded",
  "Pill": "common.pill",
  "Code": "common.code",
  "Diff": "common.diff",
  "Working": "common.working",
  "Loading": "common.loading"
} as const;
