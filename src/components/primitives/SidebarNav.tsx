// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { CSSProperties, VNodeChild } from '@/lib/dom-types';
import { IconArrowBoxLeft } from "@/lib/icons";
import { IconCheckmark1Small } from "@/lib/icons";
import { IconChevronDownSmall } from "@/lib/icons";
import { IconCrossSmall } from "@/lib/icons";
import { IconEditBig } from "@/lib/icons";
import { IconHome } from "@/lib/icons";
import { IconMagnifyingGlass } from "@/lib/icons";
import { IconPlusMedium } from "@/lib/icons";
import { IconPopsicle2 } from "@/lib/icons";
import { IconSettingsGear1 } from "@/lib/icons";
import { IconSidebarLeftArrow } from "@/lib/icons";
import { IconUserAdd } from "@/lib/icons";
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * SIDEBAR NAV
 * Shared by the design-system preview and the harness shell:
 * compact workspace switcher, primary navigation, searchable
 * chat history, and a collapse that preserves icon alignment.
 * ───────────────────────────────────────────────────────── */

const WORKSPACE = {
  key: "creamery",
  name: "Creamery Ops",
  monogram: "C"
};
const NAV_ITEMS = [{
  key: "home",
  label: "Home",
  icon: <IconHome size={18} />
}, {
  key: "invite",
  label: "Invite users",
  icon: <IconUserAdd size={18} />,
  count: "3/10"
}];
export type SidebarRecent = {
  id: string;
  label: string;
  prompt?: string;
};
const DEFAULT_RECENTS: SidebarRecent[] = [{
  id: "suppliers",
  label: "Supplier records"
}, {
  id: "todos",
  label: "Urgent to-dos this morning"
}, {
  id: "flavor",
  label: "Flavor page ticket"
}, {
  id: "workload",
  label: "Workload summary"
}, {
  id: "offboarding",
  label: "Off-board a supplier"
}, {
  id: "restock",
  label: "Batch restock function"
}, {
  id: "edits",
  label: "Propose flavor edits"
}, {
  id: "subway",
  label: "Subway surfing"
}];
type SidebarNavProps = {
  activeTitle?: string | null;
  className?: string;
  fill?: boolean;
  onNewChat?: () => void;
  onPick?: (id: string, label: string, prompt?: string) => void;
  /** controlled primary-nav selection (e.g. "home" | "invite") */
  activeNav?: string;
  onNavigate?: (key: string) => void;
  /** footer call-to-action — defaults to the demo "Upgrade" button */
  footerLabel?: string;
  footerIcon?: VNodeChild;
  onFooterClick?: () => void;
  recents?: SidebarRecent[];
  variant?: string;
};
const SIDEBAR_MOTION = {
  expandedWidth: 224,
  collapsedWidth: 52,
  duration: 280,
  copyDuration: 180,
  copyOffset: 8,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)"
};

/* ─────────────────────────────────────────────────────────
 * CHAT SEARCH STORYBOARD
 *
 *   0ms   search is triggered; Chats label begins fading
 *   0ms   field grows right → left from the search control
 * 180ms   field fills the row; cursor is focused and ready
 * ───────────────────────────────────────────────────────── */
const CHAT_SEARCH_MOTION = {
  duration: 180,
  closedWidth: 28,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)"
};
const GlideGroup = createComponent<{
  children: VNodeChild;
}>("GlideGroup", ["children"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  return () => {
    return <GlideMenu rowSelector="[data-row]" highlightClassName="sidebar-glide-highlight rounded-[7px] bg-hover-2" className="group/glide flex flex-col gap-px">
      {children.value}
    </GlideMenu>;
  };
});
const RailButton = createComponent<{
  icon: VNodeChild;
  label: string;
  active?: boolean;
  count?: string;
  onClick?: () => void;
}>("RailButton", ["icon", "label", "active", "count", "onClick"], (__props, __slots) => {
  const icon = computed(() => __props.icon);
  const label = computed(() => __props.label);
  const active = computed(() => __props.active === undefined ? false : __props.active);
  const count = computed(() => __props.count);
  const onClick = computed(() => __props.onClick);
  return () => {
    return <button data-row type="button" onClick={onClick.value} class={`sidebar-row relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left
        transition-[width,background-color,color,transform] duration-150 active:scale-[0.98]
        ${active.value ? "bg-hover-2 group-hover/glide:bg-transparent" : ""}`}>
      <span class={`flex size-5 shrink-0 items-center justify-center ${active.value ? "text-ink" : "text-ink-2"}`}>
        {icon.value}
      </span>
      <span class={`sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium ${active.value ? "text-ink" : "text-ink-2"}`}>
        {label.value}
      </span>
      {count.value && <span class="sidebar-copy mr-2 shrink-0 text-[12px] font-medium tabular-nums text-ink-3">
          {count.value}
        </span>}
    </button>;
  };
});
const WorkspaceMenu = createComponent<{
  position: {
    top: number;
    left: number;
  };
  onClose: () => void;
}>("WorkspaceMenu", ["position", "onClose"], (__props, __slots) => {
  const position = computed(() => __props.position);
  const onClose = computed(() => __props.onClose);
  return () => {
    return teleport(<div data-workspace-menu class="fixed z-50 w-64 rounded-[14px] bg-surface p-1.5 shadow-overlay" style={cssStyle({
      top: position.value.top,
      left: position.value.left,
      animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
      transformOrigin: "top left"
    })}>
      <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[8px] bg-hover-2">
        <button data-menu-row type="button" onClick={onClose.value} class="relative z-10 flex h-10 w-full items-center gap-1.5 rounded-[8px] px-2 text-left">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-ink text-[11px] font-semibold text-surface">
            {WORKSPACE.monogram}
          </span>
          <span class="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{WORKSPACE.name}</span>
          <span class="shrink-0 text-ink"><IconCheckmark1Small size={18} /></span>
        </button>
        <div class="my-1 h-px bg-line" />
        {[{
          label: "New workspace",
          icon: <IconPlusMedium size={16} />
        }, {
          label: "Workspace settings",
          icon: <IconSettingsGear1 size={16} />
        }, {
          label: "Invite team members",
          icon: <IconUserAdd size={16} />
        }].map(item => <button key={item.label} data-menu-row type="button" onClick={onClose.value} class="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left">
            <span class="flex size-5 shrink-0 items-center justify-center text-ink-2">{item.icon}</span>
            <span class="min-w-0 flex-1 truncate text-[13.5px] text-ink">{item.label}</span>
          </button>)}
        <div class="my-1 h-px bg-line" />
        <button data-menu-row type="button" onClick={onClose.value} class="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left">
          <span class="flex size-5 shrink-0 items-center justify-center text-ink-2"><IconArrowBoxLeft size={16} /></span>
          <span class="min-w-0 flex-1 truncate text-[13.5px] text-ink">Sign out</span>
        </button>
      </GlideMenu>
    </div>, document.body);
  };
});
const SidebarNav = createComponent<SidebarNavProps>("SidebarNav", ["activeTitle", "className", "fill", "onNewChat", "onPick", "activeNav", "onNavigate", "footerLabel", "footerIcon", "onFooterClick", "recents", "variant"], (__props, __slots) => {
  const activeTitle = computed(() => __props.activeTitle);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  const fill = computed(() => __props.fill === undefined ? false : __props.fill);
  const onNewChat = computed(() => __props.onNewChat);
  const onPick = computed(() => __props.onPick);
  const activeNav = computed(() => __props.activeNav);
  const onNavigate = computed(() => __props.onNavigate);
  const footerLabel = computed(() => __props.footerLabel === undefined ? "Upgrade" : __props.footerLabel);
  const footerIcon = computed(() => __props.footerIcon);
  const onFooterClick = computed(() => __props.onFooterClick);
  const recents = computed(() => __props.recents === undefined ? DEFAULT_RECENTS : __props.recents);
  const [collapsed, setCollapsed] = createState(false);
  const [internalNav, setInternalNav] = createState("chats");
  const currentNav = computed(() => activeNav.value ?? internalNav.value);
  const selectNav = (key: string) => {
    setInternalNav(key);
    onNavigate.value?.(key);
  };
  const [demoActiveTitle, setDemoActiveTitle] = createState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = createState(false);
  const [workspacePosition, setWorkspacePosition] = createState({
    top: 0,
    left: 0
  });
  const [searchOpen, setSearchOpen] = createState(false);
  const [query, setQuery] = createState("");
  const workspaceButtonRef = templateRef<HTMLButtonElement>(null);
  const searchRef = templateRef<HTMLInputElement>(null);
  const selectedTitle = computed(() => activeTitle.value === undefined ? demoActiveTitle.value : activeTitle.value);
  const visibleRecents = computed(() => recents.value.filter(item => item.label.toLowerCase().includes(query.value.trim().toLowerCase())));
  watchLifecycle(() => {
    if (!workspaceOpen.value) return;
    const close = (event: PointerEvent) => {
      const target = event.target as HTMLInputElement as Element;
      if (!target.closest("[data-workspace-trigger]") && !target.closest("[data-workspace-menu]")) {
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, () => [workspaceOpen.value]);
  watchLifecycle(() => {
    if (searchOpen.value) searchRef.value?.focus();
  }, () => [searchOpen.value]);
  const collapse = () => {
    setCollapsed(true);
    setWorkspaceOpen(false);
    setSearchOpen(false);
    setQuery("");
  };
  return () => {
    return <aside data-sidebar-collapsed={collapsed.value} aria-label="Workspace navigation" class={`relative flex shrink-0 overflow-hidden transition-[width] ${fill.value ? "h-full" : "h-[600px]"} ${className.value}`} style={cssStyle({
      width: collapsed.value ? SIDEBAR_MOTION.collapsedWidth : SIDEBAR_MOTION.expandedWidth,
      transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
      transitionTimingFunction: SIDEBAR_MOTION.easing,
      "--sidebar-copy-duration": `${SIDEBAR_MOTION.copyDuration}ms`,
      "--sidebar-copy-offset": `${SIDEBAR_MOTION.copyOffset}px`,
      "--sidebar-easing": SIDEBAR_MOTION.easing
    } as CSSProperties)}>
      <div class="flex min-h-0 w-[224px] shrink-0 flex-col">
        <div class="relative mb-2.5 h-10 shrink-0">
          <button ref={workspaceButtonRef} data-workspace-trigger type="button" aria-expanded={workspaceOpen.value} aria-hidden={collapsed.value} tabindex={collapsed.value ? -1 : 0} onClick={() => {
            if (!workspaceOpen.value && workspaceButtonRef.value) {
              const rect = workspaceButtonRef.value.getBoundingClientRect();
              setWorkspacePosition({
                top: rect.bottom + 6,
                left: rect.left
              });
            }
            setWorkspaceOpen(open => !open);
          }} class="sidebar-workspace-control absolute left-2 top-1 flex h-8 w-[164px] items-center rounded-[8px] px-2 text-left transition-[background-color,transform] duration-100 hover:bg-hover-2 active:scale-[0.99]">
            <span class="sidebar-logo flex size-5 shrink-0 items-center justify-center text-ink">
              <IconPopsicle2 size={18} />
            </span>
            <span class="sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium text-ink-2">
              {WORKSPACE.name}
            </span>
            <span class="sidebar-copy ml-1 flex shrink-0 text-ink-3">
              <IconChevronDownSmall size={16} />
            </span>
          </button>

          {workspaceOpen.value && <WorkspaceMenu position={workspacePosition.value} onClose={() => setWorkspaceOpen(false)} />}

          <button type="button" aria-label="Collapse sidebar" aria-hidden={collapsed.value} tabindex={collapsed.value ? -1 : 0} onClick={collapse} class="sidebar-collapse-control absolute right-2 top-1 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink">
            <IconSidebarLeftArrow size={18} />
          </button>
          <button type="button" aria-label="Expand sidebar" aria-hidden={!collapsed.value} tabindex={collapsed.value ? 0 : -1} onClick={() => setCollapsed(false)} class="sidebar-expand-control absolute left-2 top-0.5 flex size-9 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink">
            <IconSidebarLeftArrow size={18} className="rotate-180" />
          </button>
        </div>

        <GlideGroup>
          <RailButton icon={<IconEditBig size={18} />} label="New chat" onClick={() => {
            if (activeTitle.value === undefined) setDemoActiveTitle(null);
            selectNav("chats");
            onNewChat.value?.();
          }} />
          {NAV_ITEMS.map(item => <RailButton key={item.key} icon={item.icon} label={item.label} count={item.count} active={currentNav.value === item.key} onClick={() => selectNav(item.key)} />)}
        </GlideGroup>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div class="sidebar-copy relative mx-2 mb-1 h-8">
            <div aria-hidden={searchOpen.value} class={`absolute inset-0 flex items-center gap-1.5 px-2 text-[12.5px] font-medium text-ink-3 transition-[opacity,transform] ${searchOpen.value ? "pointer-events-none -translate-x-1 opacity-0" : "translate-x-0 opacity-100"}`} style={cssStyle({
              transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
              transitionTimingFunction: CHAT_SEARCH_MOTION.easing
            })}>
              <IconChevronDownSmall size={16} />
              <span>Chats</span>
            </div>

            <button type="button" aria-label="Search chats" aria-expanded={searchOpen.value} onClick={() => setSearchOpen(true)} class={`absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color,transform] hover:bg-hover-2 hover:text-ink active:scale-[0.96] ${searchOpen.value ? "pointer-events-none opacity-0" : "opacity-100"}`} style={cssStyle({
              transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`
            })}>
              <IconMagnifyingGlass size={16} />
            </button>

            <div class={`absolute right-0 top-0 z-20 flex h-8 items-center overflow-hidden rounded-[8px] bg-field text-ink-3 shadow-hairline transition-[width,opacity] focus-within:text-ink-2 ${searchOpen.value ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} style={cssStyle({
              width: searchOpen.value ? "100%" : CHAT_SEARCH_MOTION.closedWidth,
              transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
              transitionTimingFunction: CHAT_SEARCH_MOTION.easing
            })}>
              <span class="ml-2 flex shrink-0 items-center justify-center">
                <IconMagnifyingGlass size={15} />
              </span>
              <input ref={searchRef} value={query.value} onInput={event => setQuery((event.target as HTMLInputElement).value)} onKeydown={event => {
                if (event.key === "Escape") {
                  setSearchOpen(false);
                  setQuery("");
                }
              }} placeholder="Search chats" aria-label="Search chat history" class="ml-1.5 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-ink-3" />
              <button type="button" aria-label="Close chat search" onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }} class="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-hover-2 hover:text-ink active:scale-[0.96]">
                <IconCrossSmall size={16} />
              </button>
            </div>
          </div>

          <GlideGroup>
            {visibleRecents.value.map(item => {
              const active = item.label === selectedTitle.value;
              return <button key={item.id} data-row type="button" title={item.label} onClick={() => {
                selectNav("chats");
                if (activeTitle.value === undefined) setDemoActiveTitle(item.label);
                onPick.value?.(item.id, item.label, item.prompt);
              }} class={`sidebar-row relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left transition-[width,background-color,color,transform] duration-150 active:scale-[0.98] ${active ? "bg-hover-2 group-hover/glide:bg-transparent" : ""}`}>
                  <span class={`sidebar-copy min-w-0 flex-1 truncate text-[14px] font-medium ${active ? "text-ink" : "text-ink-2"}`}>
                    {item.label}
                  </span>
                </button>;
            })}
            {query.value && visibleRecents.value.length === 0 && <div class="sidebar-copy mx-2 px-2 py-2 text-[12.5px] text-ink-3">No chats found</div>}
          </GlideGroup>
        </div>

        <div class="sidebar-copy mx-2 mt-3 w-[208px] border-t border-line pt-3">
          <button type="button" onClick={onFooterClick.value ?? onNewChat.value} class="flex h-8 w-full items-center justify-center gap-1.5 rounded-control bg-hover-2 text-[12.5px] font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-line-strong active:scale-[0.98]">
            {footerIcon.value}
            {footerLabel.value}
          </button>
        </div>
      </div>
    </aside>;
  };
}, { fill: Boolean });
export default SidebarNav;
