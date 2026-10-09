// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
/* ─────────────────────────────────────────────────────────
 * FLOWCHART — an agent workflow on a dotted editor canvas.
 * Two steps: a Trigger card and an If/Else condition card,
 * joined by a measured connector. Cards drag anywhere on
 * the canvas; the connector follows. Condition chips open
 * real dropdowns (same menu as the PromptBar model picker).
 * ───────────────────────────────────────────────────────── */

const PURPLE = "#9a5cff";
const AMBER = "#f09a2f";
const mix = (hue: string, pct: number, base = "var(--surface)") => `color-mix(in srgb, ${hue} ${pct}%, ${base})`;

/* ── layout constants ── */
const PAD_Y = 24;
const ROW_GAP = 64;
const PILL_OFFSET = 30; // kind pill + gap above a card

export type StepNode = {
  id: string;
  row: number;
  x: number; // 0–1 center of the node
  w: number;
  kind?: {
    label: string;
    hue: string;
  };
  hue?: string;
  title?: string;
  caption?: string;
  condition?: boolean; // renders the if/else chip rows instead
};
const NODES: StepNode[] = [{
  id: "trigger",
  row: 0,
  x: 0.5,
  w: 300,
  kind: {
    label: "Trigger",
    hue: PURPLE
  },
  hue: PURPLE,
  title: "New order created",
  caption: "Trigger when a new order is created"
}, {
  id: "cond",
  row: 1,
  x: 0.5,
  w: 356,
  kind: {
    label: "If / Else",
    hue: AMBER
  },
  condition: true
}];
const EDGES = [{
  from: "trigger",
  to: "cond"
}];

/* estimated heights for the first paint; measured immediately after */
const EST_H: Record<string, number> = {
  trigger: 92,
  cond: 134
};
const PROPERTIES = ["flavor", "topping", "size", "scoops"];
const FLAVORS = [{
  name: "Rocky Road",
  tag: "Classic"
}, {
  name: "Mint Chip",
  tag: "Classic"
}, {
  name: "Pistachio",
  tag: "Seasonal"
}, {
  name: "Bubblegum",
  tag: "Retro"
}];
const TOPPINGS = [{
  name: "Brown butter bourbon brittle crunch"
}, {
  name: "Rainbow sprinkles"
}, {
  name: "Hot fudge"
}, {
  name: "Candied pecans"
}];

/* ── icons ── */
const ConeIcon = createComponent<{
  size?: number;
}>("ConeIcon", ["size"], (__props, __slots) => {
  const size = computed(() => __props.size === undefined ? 16 : __props.size);
  return () => {
    return <svg width={size.value} height={size.value} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11" />
      <path d="M17 7A5 5 0 0 0 7 7" />
      <path d="M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" />
    </svg>;
  };
});
const Chevron = createComponent<Record<string, never>>("Chevron", [], (__props, __slots) => {
  return () => {
    return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-ink-3">
      <path d="m6 9 6 6 6-6" />
    </svg>;
  };
});
const Handle = createComponent<Record<string, never>>("Handle", [], (__props, __slots) => {
  return () => {
    return <svg width="10" height="16" viewBox="0 0 10 16" class="shrink-0 cursor-grab text-ink-3/70">
      {[3, 8, 13].flatMap(y => [<circle key={`l${y}`} cx="3" cy={y} r="1.1" fill="currentColor" />, <circle key={`r${y}`} cx="7.5" cy={y} r="1.1" fill="currentColor" />])}
    </svg>;
  };
});
const CheckIcon = createComponent<Record<string, never>>("CheckIcon", [], (__props, __slots) => {
  return () => {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>;
  };
});
/* ── dropdown menu — same pattern as the PromptBar model picker ── */
const Menu = createComponent<{
  items: {
    name: string;
    tag?: string;
  }[];
  value: string;
  width: string;
  align: "left" | "right";
  onPick: (name: string) => void;
}>("Menu", ["items", "value", "width", "align", "onPick"], (__props, __slots) => {
  const items = computed(() => __props.items);
  const value = computed(() => __props.value);
  const width = computed(() => __props.width);
  const align = computed(() => __props.align);
  const onPick = computed(() => __props.onPick);
  const [hovered, setHovered] = createState<number | null>(null);
  const rowRefs = templateRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = createState<{
    top: number;
    height: number;
  } | null>(null);
  const valueIndex = computed(() => items.value.findIndex(item => item.name === value.value));
  watchLifecycle(() => {
    const row = rowRefs.value[hovered.value ?? valueIndex.value];
    if (row) setBox({
      top: row.offsetTop,
      height: row.offsetHeight
    });
  }, () => [hovered.value, valueIndex.value]);
  return () => {
    return <div onMouseleave={() => setHovered(null)} class={`absolute bottom-full z-20 mb-1.5 rounded-[10px] bg-surface p-1 shadow-raised ${width.value}
        ${align.value === "right" ? "right-0" : "left-0"}`} style={cssStyle({
      animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
      transformOrigin: align.value === "right" ? "bottom right" : "bottom left"
    })}>
      <span aria-hidden class="pointer-events-none absolute inset-x-1 rounded-[6px] bg-hover" style={cssStyle({
        top: box.value?.top ?? 0,
        height: box.value?.height ?? 0,
        opacity: box.value && hovered.value !== null ? 1 : 0,
        transition: "top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease"
      })} />
      {items.value.map((item, i) => <button key={item.name} type="button" ref={(el: any) => {
        rowRefs.value[i] = el;
      }} onMouseenter={() => setHovered(i)} onClick={() => onPick.value(item.name)} class="relative z-10 flex h-7.5 w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 text-left">
          <span class="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">{item.name}</span>
          {item.tag && <span class="shrink-0 text-[11px] text-ink-3">{item.tag}</span>}
          <span class={`shrink-0 text-ink ${item.name === value.value ? "" : "invisible"}`}>
            <CheckIcon />
          </span>
        </button>)}
    </div>;
  };
});
/* ── chips used inside the condition card ── */
const SourceChip = createComponent<Record<string, never>>("SourceChip", [], (__props, __slots) => {
  return () => {
    return <span data-ui class="inline-flex h-6 shrink-0 items-center gap-1 rounded-[6px] bg-surface px-1.5 text-[12px] font-medium text-ink shadow-btn">
      <span class="text-ink-2">
        <ConeIcon size={12} />
      </span>
      order
    </span>;
  };
});
const SelectChip = createComponent<{
  id: string;
  value: string;
  dot?: boolean;
  items: {
    name: string;
    tag?: string;
  }[];
  width: string;
  align?: "left" | "right";
  open: boolean;
  onToggle: (id: string) => void;
  onPick: (id: string, name: string) => void;
}>("SelectChip", ["id", "value", "dot", "items", "width", "align", "open", "onToggle", "onPick"], (__props, __slots) => {
  const id = computed(() => __props.id);
  const value = computed(() => __props.value);
  const dot = computed(() => __props.dot);
  const items = computed(() => __props.items);
  const width = computed(() => __props.width);
  const align = computed(() => __props.align === undefined ? "left" : __props.align);
  const open = computed(() => __props.open);
  const onToggle = computed(() => __props.onToggle);
  const onPick = computed(() => __props.onPick);
  return () => {
    return <span data-ui class="relative inline-flex min-w-0">
      <button type="button" aria-expanded={open.value} onClick={() => onToggle.value(id.value)} class={`inline-flex h-6 min-w-0 cursor-pointer items-center gap-1 rounded-[6px] px-1.5
          text-[12px] font-medium text-ink transition-colors duration-100
          ${open.value ? "bg-hover-2" : "bg-field hover:bg-hover-2"}`}>
        {dot.value && <span class="size-1.5 shrink-0 rounded-full" style={cssStyle({
          background: AMBER
        })} />}
        <span class="min-w-0 truncate">{value.value}</span>
        <Chevron />
      </button>
      {open.value && <Menu items={items.value} value={value.value} width={width.value} align={align.value} onPick={name => onPick.value(id.value, name)} />}
    </span>;
  };
});
const ConditionBody = createComponent<Record<string, never>>("ConditionBody", [], (__props, __slots) => {
  const [values, setValues] = createState<Record<string, string>>({
    prop1: "flavor",
    val1: "Rocky Road",
    prop2: "topping",
    val2: "Brown butter bourbon brittle crunch"
  });
  const [open, setOpen] = createState<string | null>(null);

  /* click anywhere else closes the menu */
  watchLifecycle(() => {
    if (!open.value) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as HTMLInputElement as Element).closest("[data-ui]")) setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, () => [open.value]);
  const toggle = (id: string) => setOpen(current => current === id ? null : id);
  const pick = (id: string, name: string) => {
    setValues(current => ({
      ...current,
      [id]: name
    }));
    setOpen(null);
  };
  const chip = (id: string, items: {
    name: string;
    tag?: string;
  }[], width: string, extra?: object) => <SelectChip id={id} value={values.value[id]} items={items} width={width} open={open.value === id} onToggle={toggle} onPick={pick} {...extra} />;
  return () => {
    return <div class="flex flex-col gap-1.5 px-3 py-2.5">
      <div class="flex min-w-0 items-center gap-1.5">
        <Handle />
        <span class="w-7 text-[12.5px] text-ink-2">If</span>
        <SourceChip />
        {chip("prop1", PROPERTIES.map(name => ({
          name
        })), "w-36")}
        <span class="text-[12.5px] text-ink-2">is</span>
        {chip("val1", FLAVORS, "w-44", {
          dot: true,
          align: "right"
        })}
      </div>
      <div class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1.5">
        <Handle />
        <span class="w-7 text-[12.5px] text-ink-2">and</span>
        <SourceChip />
        {chip("prop2", PROPERTIES.map(name => ({
          name
        })), "w-36")}
        <span class="text-[12.5px] text-ink-2">is</span>
        <span class="max-w-full pl-[49px]">
          {chip("val2", TOPPINGS, "w-64", {
            dot: true
          })}
        </span>
      </div>
    </div>;
  };
});
const StepBody = createComponent<{
  node: StepNode;
}>("StepBody", ["node"], (__props, __slots) => {
  const node = computed(() => __props.node);
  return () => {
    return <div class="flex items-center gap-2.5 p-2.5">
      <span class="flex size-9 shrink-0 items-center justify-center rounded-[8px]" style={cssStyle({
        background: mix(node.value.hue!, 12),
        color: node.value.hue,
        boxShadow: `0 0 0 1px ${mix(node.value.hue!, 20)}`
      })}>
        <ConeIcon />
      </span>
      <span class="min-w-0 text-left">
        <span class="block truncate text-[13px] font-semibold leading-tight text-ink">{node.value.title}</span>
        <span class="mt-0.5 block text-[12px] leading-snug text-ink-2">{node.value.caption}</span>
      </span>
    </div>;
  };
});
/* ── the canvas ── */
const Flowchart = createComponent<{
  steps?: StepNode[];
  variant?: string;
}>("Flowchart", ["steps", "variant"], (__props, __slots) => {
  const steps = computed(() => __props.steps === undefined ? NODES : __props.steps);
  const canvasRef = templateRef<HTMLDivElement>(null);
  const nodeRefs = templateRef(new Map<string, HTMLElement>());
  const [width, setWidth] = createState(0);
  const [heights, setHeights] = createState<Record<string, number>>(EST_H);
  const [selected, setSelected] = createState<string | null>(null);
  const [offsets, setOffsets] = createState<Record<string, {
    dx: number;
    dy: number;
  }>>({});
  const drag = templateRef<{
    id: string;
    startX: number;
    startY: number;
    baseDx: number;
    baseDy: number;
    moved: boolean;
  } | null>(null);
  watchLifecycle(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const measure = () => {
      setWidth(canvas.clientWidth);
      setHeights(prev => {
        const next = {
          ...prev
        };
        let changed = false;
        nodeRefs.value.forEach((el, id) => {
          const h = el.offsetHeight;
          if (h && Math.abs(h - (next[id] ?? 0)) > 0.5) {
            next[id] = h;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    nodeRefs.value.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, () => []);

  /* rows → y offsets from measured node heights */
  const rows = computed(() => [...new Set(steps.value.map(n => n.row))].sort((a, b) => a - b));
  const rowH = computed(() => rows.value.map(r => Math.max(...steps.value.filter(n => n.row === r).map(n => heights.value[n.id] ?? 90))));
  const rowY = computed(() => {
    const positions: number[] = [];
    rows.value.forEach((_, i) => { positions[i] = i === 0 ? PAD_Y : positions[i - 1] + rowH.value[i - 1] + ROW_GAP; });
    return positions;
  });
  const canvasH = computed(() => rowY.value[rows.value.length - 1] + rowH.value[rows.value.length - 1] + PAD_Y);
  const cw = computed(() => width.value || 480);
  const place = (n: StepNode) => {
    const w = Math.min(n.w, cw.value * 0.92);
    const off = offsets.value[n.id];
    return {
      w,
      cx: n.x * cw.value + (off?.dx ?? 0),
      top: rowY.value[rows.value.indexOf(n.row)] + (off?.dy ?? 0)
    };
  };

  /* card anchor points (pills sit above the card, so offset the top) */
  const anchors = (n: StepNode) => {
    const {
      cx,
      top
    } = place(n);
    return {
      top: {
        x: cx,
        y: top + (n.kind ? PILL_OFFSET : 0)
      },
      bottom: {
        x: cx,
        y: top + (heights.value[n.id] ?? 90)
      }
    };
  };
  const bezier = (edge: {
    from: string;
    to: string;
  }) => {
    const from = anchors(steps.value.find(n => n.id === edge.from)!).bottom;
    const to = anchors(steps.value.find(n => n.id === edge.to)!).top;
    const k = Math.min(Math.max(Math.abs(to.y - from.y) * 0.55, 24), 84);
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + k}, ${to.x} ${to.y - k}, ${to.x} ${to.y}`;
  };

  /* ── dragging ── */
  const onPointerDown = (node: StepNode) => (event: UI.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLInputElement as Element).closest("[data-ui]")) return;
    const off = offsets.value[node.id];
    drag.value = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      baseDx: off?.dx ?? 0,
      baseDy: off?.dy ?? 0,
      moved: false
    };
    (event.currentTarget as HTMLElement as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onPointerMove = (node: StepNode) => (event: UI.PointerEvent<HTMLDivElement>) => {
    const d = drag.value;
    if (!d || d.id !== node.id) return;
    const dx = d.baseDx + event.clientX - d.startX;
    const dy = d.baseDy + event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx - d.baseDx, dy - d.baseDy) < 3) return;
    d.moved = true;

    /* keep the card inside the canvas */
    const {
      w
    } = place(node);
    const h = heights.value[node.id] ?? 90;
    const baseCx = node.x * cw.value;
    const baseTop = rowY.value[rows.value.indexOf(node.row)];
    const cx = Math.min(Math.max(baseCx + dx, w / 2 + 8), cw.value - w / 2 - 8);
    const top = Math.min(Math.max(baseTop + dy, 8), canvasH.value - h - 8);
    setOffsets(current => ({
      ...current,
      [node.id]: {
        dx: cx - baseCx,
        dy: top - baseTop
      }
    }));
  };
  const onPointerUp = (node: StepNode) => () => {
    const d = drag.value;
    if (d?.id === node.id) {
      /* a real drag shouldn't also toggle selection */
      if (d.moved) setTimeout(() => drag.value = null, 0);else drag.value = null;
    }
  };
  const wasDragged = () => drag.value?.moved === true;
  const isLit = (edge: {
    from: string;
    to: string;
  }) => selected.value === edge.from || selected.value === edge.to;
  return () => {
    return <div ref={canvasRef} class="relative w-full select-none overflow-hidden rounded-card bg-page shadow-hairline" style={cssStyle({
      height: canvasH.value,
      backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1.25px)",
      backgroundSize: "22px 22px",
      backgroundPosition: "center"
    })}>
      {/* connectors */}
      <svg width={cw.value} height={canvasH.value} class="pointer-events-none absolute inset-0">
        {EDGES.map(edge => <path key={`${edge.from}-${edge.to}`} d={bezier(edge)} fill="none" stroke={isLit(edge) ? "var(--accent)" : "var(--line-strong)"} stroke-width="1.25" class="transition-[stroke] duration-150" />)}
      </svg>

      {/* nodes */}
      {steps.value.map(node => {
        const {
          w,
          cx,
          top
        } = place(node);
        const active = selected.value === node.id;
        return <div key={node.id} ref={(el: any) => {
          if (el) nodeRefs.value.set(node.id, el);else nodeRefs.value.delete(node.id);
        }} onPointerdown={onPointerDown(node)} onPointermove={onPointerMove(node)} onPointerup={onPointerUp(node)} class="absolute flex -translate-x-1/2 touch-none flex-col items-start gap-1.5" style={cssStyle({
          left: cx,
          top,
          width: w,
          zIndex: drag.value?.id === node.id ? 2 : 1
        })}>
            {node.kind && <span class="inline-flex h-6 items-center rounded-[6px] px-2 text-[11.5px] font-medium" style={cssStyle({
            background: mix(node.kind.hue, 14, "var(--page)"),
            color: mix(node.kind.hue, 80, "var(--ink)")
          })}>
                {node.kind.label}
              </span>}
            {node.condition ? <div class="w-full rounded-[18px] bg-surface shadow-card transition-shadow duration-150 hover:shadow-raised">
                <ConditionBody />
              </div> : <button type="button" onClick={() => {
            if (wasDragged()) return;
            setSelected(active ? null : node.id);
          }} aria-pressed={active} class={`w-full cursor-pointer rounded-[18px] bg-surface text-left outline-none
                  transition-shadow duration-150 focus-visible:shadow-[0_0_0_1.5px_var(--accent)]
                  ${active ? "shadow-[0_0_0_1.5px_var(--accent),0_2px_10px_rgba(0,0,0,0.045)]" : "shadow-card hover:shadow-raised"}`}>
                <StepBody node={node} />
              </button>}
          </div>;
      })}
    </div>;
  };
});
export default Flowchart;
