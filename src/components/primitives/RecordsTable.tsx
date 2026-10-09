// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * RECORDS TABLE — an AI spreadsheet grid. Columns are
 * *properties*: click a header to open its configuration
 * popover (type, tool, grounding, inputs, prompt, run), add
 * a new AI property from the + header, and watch cells
 * resolve row-by-row while it calculates.
 * ───────────────────────────────────────────────────────── */

type Strength = "strong" | "weak" | "veryweak" | "none";
type SortKey = "name" | "last" | "strength";
type ColumnKey = "company" | "categories" | "last" | "strength" | "links" | "ai";
const DEFAULT_COLUMN_WIDTHS: Record<ColumnKey, number> = {
  company: 270,
  categories: 275,
  last: 190,
  strength: 210,
  links: 175,
  ai: 240
};
const STRENGTH: Record<Strength, {
  label: string;
  color: string;
  rank: number;
}> = {
  strong: {
    label: "Very strong",
    color: "var(--green)",
    rank: 3
  },
  weak: {
    label: "Weak",
    color: "var(--orange)",
    rank: 2
  },
  veryweak: {
    label: "Very weak",
    color: "var(--red)",
    rank: 1
  },
  none: {
    label: "No communication",
    color: "var(--ink-3)",
    rank: 0
  }
};

// A single mid-lightness base hue per tag. Background, text, and border are
// derived from this via color-mix() against the theme tokens in .records-tag,
// so the chips adapt to light and dark automatically (same pattern as FilterTable).
type TagColor = {
  base: string;
};
const TAG_PALETTE: Record<string, TagColor> = {
  amber: {
    base: "oklch(0.76 0.13 70)"
  },
  lime: {
    base: "oklch(0.77 0.16 122)"
  },
  yellow: {
    base: "oklch(0.80 0.15 101)"
  },
  purple: {
    base: "oklch(0.62 0.18 293)"
  },
  orange: {
    base: "oklch(0.71 0.16 48)"
  },
  cyan: {
    base: "oklch(0.72 0.10 221)"
  },
  red: {
    base: "oklch(0.64 0.19 27)"
  },
  magenta: {
    base: "oklch(0.66 0.21 323)"
  },
  green: {
    base: "oklch(0.70 0.13 162)"
  },
  pink: {
    base: "oklch(0.67 0.19 3)"
  }
};
const TAG_COLORS: Record<string, TagColor> = {
  B2B: TAG_PALETTE.amber,
  B2C: TAG_PALETTE.lime,
  Cafe: TAG_PALETTE.red,
  Catering: TAG_PALETTE.magenta,
  "Dairy-free": TAG_PALETTE.cyan,
  Gelato: TAG_PALETTE.purple,
  Imports: TAG_PALETTE.orange,
  Local: TAG_PALETTE.green,
  Seasonal: TAG_PALETTE.yellow,
  Sorbet: TAG_PALETTE.pink,
  Vegan: TAG_PALETTE.lime,
  Wholesale: TAG_PALETTE.amber
};
export type RecordRow = {
  id: string;
  name: string;
  tags: string[];
  last: string;
  strength: Strength;
  website?: string;
};
const INITIAL_ROWS: RecordRow[] = [{
  id: "aurora",
  name: "Aurora Scoops — Reykjavík",
  tags: ["Gelato", "Seasonal"],
  last: "9 days ago",
  strength: "strong",
  website: "aurora-scoops.example.com"
}, {
  id: "kumo",
  name: "Kumo Creamery — Tokyo",
  tags: ["B2C", "Cafe", "Vegan"],
  last: "3 weeks ago",
  strength: "strong",
  website: "kumo-creamery.example.com"
}, {
  id: "sol-nieve",
  name: "Sol y Nieve — Buenos Aires",
  tags: ["Gelato", "Local"],
  last: "2 months ago",
  strength: "weak",
  website: "sol-y-nieve.example.com"
}, {
  id: "maple-orbit",
  name: "Maple Orbit — Montréal",
  tags: ["B2B", "Wholesale", "Seasonal"],
  last: "15 days ago",
  strength: "weak",
  website: "maple-orbit.example.com"
}, {
  id: "blue-fig",
  name: "Blue Fig Gelato — Florence",
  tags: ["Gelato", "Cafe"],
  last: "over 1 year ago",
  strength: "veryweak",
  website: "blue-fig.example.com"
}, {
  id: "sahara-swirl",
  name: "Sahara Swirl — Marrakech",
  tags: ["Sorbet", "Local"],
  last: "5 months ago",
  strength: "veryweak"
}, {
  id: "cloudberry",
  name: "Cloudberry Cone — Helsinki",
  tags: ["Dairy-free", "Seasonal"],
  last: "No contact",
  strength: "none",
  website: "cloudberry-cone.example.com"
}, {
  id: "palm-sugar",
  name: "Palm Sugar Creamery — Bangkok",
  tags: ["B2C", "Vegan"],
  last: "3 months ago",
  strength: "veryweak",
  website: "palm-sugar.example.com"
}, {
  id: "cape-vanilla",
  name: "Cape Vanilla Co. — Cape Town",
  tags: ["Wholesale", "Imports"],
  last: "over 1 year ago",
  strength: "veryweak",
  website: "cape-vanilla.example.com"
}, {
  id: "andes-snow",
  name: "Andes Snow Creamery — Quito",
  tags: ["Gelato", "Catering"],
  last: "almost 2 years ago",
  strength: "veryweak"
}, {
  id: "tasman-sea",
  name: "Tasman Sea Gelato — Hobart",
  tags: ["Gelato", "Local"],
  last: "2 months ago",
  strength: "weak",
  website: "tasman-sea.example.com"
}, {
  id: "silk-road",
  name: "Silk Road Sorbet — Tbilisi",
  tags: ["Sorbet", "Imports"],
  last: "about 1 month ago",
  strength: "weak",
  website: "silk-road.example.com"
}, {
  id: "rosewater",
  name: "Rosewater Kulfi — Jaipur",
  tags: ["B2C", "Seasonal"],
  last: "2 months ago",
  strength: "veryweak"
}, {
  id: "lumen",
  name: "Lumen Soft Serve — Copenhagen",
  tags: ["Dairy-free", "Cafe"],
  last: "8 months ago",
  strength: "weak",
  website: "lumen-soft-serve.example.com"
}, {
  id: "cacao-norte",
  name: "Cacao Norte — Oaxaca",
  tags: ["B2B", "Local", "Wholesale"],
  last: "about 2 years ago",
  strength: "none",
  website: "cacao-norte.example.com"
}, {
  id: "pine-pistachio",
  name: "Pine & Pistachio — Istanbul",
  tags: ["Gelato", "Catering"],
  last: "about 1 month ago",
  strength: "veryweak"
}, {
  id: "ember-cone",
  name: "Ember Cone Company — Seoul",
  tags: ["B2C", "Vegan"],
  last: "15 days ago",
  strength: "weak",
  website: "ember-cone.example.com"
}, {
  id: "coral-coast",
  name: "Coral Coast Sorbet — Honolulu",
  tags: ["Sorbet", "Local"],
  last: "9 days ago",
  strength: "strong",
  website: "coral-coast.example.com"
}, {
  id: "sunbird",
  name: "Sunbird Gelateria — Lisbon",
  tags: ["Gelato", "Cafe"],
  last: "over 2 years ago",
  strength: "none",
  website: "sunbird.example.com"
}, {
  id: "mooncake",
  name: "Mooncake Ice Cream — Singapore",
  tags: ["B2B", "Wholesale"],
  last: "about 1 month ago",
  strength: "veryweak",
  website: "mooncake-ice-cream.example.com"
}, {
  id: "juniper",
  name: "Juniper & Cream — Vancouver",
  tags: ["Dairy-free", "Catering"],
  last: "No contact",
  strength: "none"
}, {
  id: "mango-moon",
  name: "Mango Moon Gelato — Nairobi",
  tags: ["Sorbet", "Vegan"],
  last: "almost 2 years ago",
  strength: "veryweak",
  website: "mango-moon.example.com"
}, {
  id: "fjord-fizz",
  name: "Fjord Fizz Ice — Oslo",
  tags: ["Dairy-free", "Seasonal"],
  last: "No contact",
  strength: "none"
}, {
  id: "pampa",
  name: "Pampa Creamery — Córdoba",
  tags: ["B2C", "Local"],
  last: "12 months ago",
  strength: "veryweak",
  website: "pampa-creamery.example.com"
}, {
  id: "lotus-leaf",
  name: "Lotus Leaf Scoops — Hanoi",
  tags: ["Vegan", "Cafe"],
  last: "15 days ago",
  strength: "weak"
}, {
  id: "saffron-sky",
  name: "Saffron Sky Kulfi — Dubai",
  tags: ["Imports", "Catering"],
  last: "almost 2 years ago",
  strength: "veryweak",
  website: "saffron-sky.example.com"
}, {
  id: "alpine-churn",
  name: "Alpine Churn — Zürich",
  tags: ["B2B", "Gelato", "Wholesale"],
  last: "4 days ago",
  strength: "strong",
  website: "alpine-churn.example.com"
}, {
  id: "monsoon-mango",
  name: "Monsoon Mango — Mumbai",
  tags: ["Sorbet", "Vegan", "Catering"],
  last: "18 days ago",
  strength: "weak",
  website: "monsoon-mango.example.com"
}, {
  id: "cedar-spoon",
  name: "Cedar Spoon — Beirut",
  tags: ["Cafe", "Local", "Seasonal"],
  last: "6 days ago",
  strength: "strong",
  website: "cedar-spoon.example.com"
}, {
  id: "baltic-berry",
  name: "Baltic Berry — Tallinn",
  tags: ["Dairy-free", "Seasonal", "B2C"],
  last: "5 weeks ago",
  strength: "weak",
  website: "baltic-berry.example.com"
}, {
  id: "delta-dairy",
  name: "Delta Dairy Works — New Orleans",
  tags: ["B2B", "Wholesale", "Local"],
  last: "2 days ago",
  strength: "strong",
  website: "delta-dairy.example.com"
}, {
  id: "yuzu-yard",
  name: "Yuzu Yard — Kyoto",
  tags: ["Sorbet", "Cafe", "Seasonal"],
  last: "11 days ago",
  strength: "strong",
  website: "yuzu-yard.example.com"
}, {
  id: "copper-cone",
  name: "Copper Cone — Melbourne",
  tags: ["Gelato", "Cafe", "B2C"],
  last: "about 1 month ago",
  strength: "weak",
  website: "copper-cone.example.com"
}, {
  id: "mint-medina",
  name: "Mint Medina — Tunis",
  tags: ["Dairy-free", "Vegan", "Local"],
  last: "No contact",
  strength: "none"
}, {
  id: "glacier-grove",
  name: "Glacier Grove — Anchorage",
  tags: ["Seasonal", "Local", "Catering"],
  last: "7 weeks ago",
  strength: "weak",
  website: "glacier-grove.example.com"
}, {
  id: "orchard-cloud",
  name: "Orchard Cloud — Lyon",
  tags: ["Gelato", "Seasonal", "Cafe"],
  last: "5 days ago",
  strength: "strong",
  website: "orchard-cloud.example.com"
}, {
  id: "tamarind-tide",
  name: "Tamarind Tide — Chennai",
  tags: ["Vegan", "Sorbet", "B2C"],
  last: "9 months ago",
  strength: "veryweak",
  website: "tamarind-tide.example.com"
}, {
  id: "amber-scoop",
  name: "Amber Scoop — Prague",
  tags: ["Gelato", "B2B"],
  last: "over 1 year ago",
  strength: "none"
}, {
  id: "boreal-batch",
  name: "Boreal Batch — Yellowknife",
  tags: ["Dairy-free", "Local", "Seasonal"],
  last: "8 days ago",
  strength: "strong",
  website: "boreal-batch.example.com"
}, {
  id: "coconut-commons",
  name: "Coconut Commons — Manila",
  tags: ["Vegan", "B2C", "Cafe"],
  last: "24 days ago",
  strength: "weak",
  website: "coconut-commons.example.com"
}, {
  id: "dolomite-dairy",
  name: "Dolomite Dairy — Bolzano",
  tags: ["Gelato", "Wholesale"],
  last: "3 days ago",
  strength: "strong",
  website: "dolomite-dairy.example.com"
}, {
  id: "equator-cream",
  name: "Equator Cream — Kampala",
  tags: ["B2B", "Catering", "Local"],
  last: "10 months ago",
  strength: "veryweak",
  website: "equator-cream.example.com"
}, {
  id: "hibiscus-house",
  name: "Hibiscus House — Accra",
  tags: ["Sorbet", "Cafe"],
  last: "6 weeks ago",
  strength: "weak",
  website: "hibiscus-house.example.com"
}, {
  id: "lagoon-ladle",
  name: "Lagoon Ladle — Venice",
  tags: ["Gelato", "Seasonal", "Catering"],
  last: "7 days ago",
  strength: "strong",
  website: "lagoon-ladle.example.com"
}, {
  id: "midnight-milk",
  name: "Midnight Milk — Tromsø",
  tags: ["Dairy-free", "Vegan", "Wholesale"],
  last: "No contact",
  strength: "none"
}, {
  id: "nomad-nougat",
  name: "Nomad Nougat — Ulaanbaatar",
  tags: ["Imports", "B2B"],
  last: "almost 2 years ago",
  strength: "none",
  website: "nomad-nougat.example.com"
}, {
  id: "olive-snow",
  name: "Olive Snow — Athens",
  tags: ["Gelato", "Cafe", "Local"],
  last: "4 days ago",
  strength: "strong",
  website: "olive-snow.example.com"
}, {
  id: "pacific-pear",
  name: "Pacific Pear — Valparaíso",
  tags: ["Sorbet", "Seasonal"],
  last: "2 months ago",
  strength: "weak",
  website: "pacific-pear.example.com"
}, {
  id: "quartz-cone",
  name: "Quartz Cone — Denver",
  tags: ["B2C", "Wholesale"],
  last: "10 days ago",
  strength: "strong",
  website: "quartz-cone.example.com"
}, {
  id: "red-lantern",
  name: "Red Lantern Creamery — Taipei",
  tags: ["Cafe", "Vegan"],
  last: "about 1 month ago",
  strength: "weak",
  website: "red-lantern.example.com"
}, {
  id: "salt-silk",
  name: "Salt & Silk — Muscat",
  tags: ["Imports", "Catering", "Gelato"],
  last: "8 months ago",
  strength: "veryweak",
  website: "salt-and-silk.example.com"
}, {
  id: "tropic-churn",
  name: "Tropic Churn — San Juan",
  tags: ["Sorbet", "Local", "B2C"],
  last: "6 days ago",
  strength: "strong",
  website: "tropic-churn.example.com"
}, {
  id: "umber-cream",
  name: "Umber Cream — Warsaw",
  tags: ["B2B", "Wholesale", "Cafe"],
  last: "5 weeks ago",
  strength: "weak",
  website: "umber-cream.example.com"
}, {
  id: "vanilla-vale",
  name: "Vanilla Vale — Antananarivo",
  tags: ["Imports", "Local"],
  last: "No contact",
  strength: "none"
}, {
  id: "willow-whip",
  name: "Willow Whip — Portland",
  tags: ["Dairy-free", "Vegan", "Cafe"],
  last: "3 days ago",
  strength: "strong",
  website: "willow-whip.example.com"
}, {
  id: "zenith-gelato",
  name: "Zenith Gelato — Auckland",
  tags: ["Gelato", "Seasonal"],
  last: "3 weeks ago",
  strength: "weak",
  website: "zenith-gelato.example.com"
}, {
  id: "apricot-atlas",
  name: "Apricot Atlas — Algiers",
  tags: ["Sorbet", "Imports"],
  last: "11 months ago",
  strength: "veryweak",
  website: "apricot-atlas.example.com"
}, {
  id: "black-sesame",
  name: "Black Sesame Social — Bandung",
  tags: ["Vegan", "Cafe", "B2C"],
  last: "9 days ago",
  strength: "strong",
  website: "black-sesame.example.com"
}, {
  id: "crimson-clover",
  name: "Crimson Clover — Brussels",
  tags: ["Gelato", "Wholesale", "Catering"],
  last: "2 months ago",
  strength: "weak",
  website: "crimson-clover.example.com"
}, {
  id: "dragonfruit-dock",
  name: "Dragonfruit Dock — Shenzhen",
  tags: ["Sorbet", "B2B", "Wholesale"],
  last: "No contact",
  strength: "none"
}];

/* the AI column resolves to fictional competitor pairs */
const AI_LABEL = "Competitors";
const COMPETITOR_POOL = ["Frost & Ladle", "Polar Pint Co.", "Meltwater Creamery", "Cirrus Scoops", "Golden Churn", "Velvet Freeze", "North Cone Collective", "Sundae Syndicate"];
const competitorsFor = (index: number) => `${COMPETITOR_POOL[index % 8]}, ${COMPETITOR_POOL[(index + 3) % 8]}`;
const Icon = createComponent<{
  children: UI.VNodeChild;
  size?: number;
  strokeWidth?: number;
}>("Icon", ["children", "size", "strokeWidth"], (__props, __slots) => {
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  const size = computed(() => __props.size === undefined ? 14 : __props.size);
  const strokeWidth = computed(() => __props.strokeWidth === undefined ? 1.8 : __props.strokeWidth);
  return () => {
    return <svg width={size.value} height={size.value} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth.value} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {children.value}
    </svg>;
  };
});
/* glyph library for property types & tools */
const TYPE_GLYPHS: Record<string, UI.VNodeChild> = {
  Text: <path d="M4 6h16M4 12h10M4 18h7" />,
  File: <g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></g>,
  Collection: <g><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" /></g>,
  "Single select": <g><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.4 2.4 4.6-4.9" /></g>,
  "Multi select": <g><path d="M11 6h9M11 12h9M11 18h9" /><path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" /></g>,
  URL: <g><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></g>,
  Reference: <path d="M7 17 17 7M9 7h8v8" />,
  JSON: <g><path d="M8 4c-2 0-2 2-2 3s.5 3-2 3c2.5 0 2 2 2 3s0 3 2 3" /><path d="M16 4c2 0 2 2 2 3s-.5 3 2 3c-2.5 0-2 2-2 3s0 3-2 3" /></g>,
  "File splitter": <g><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></g>,
  Date: <g><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></g>
};
const TOOL_GLYPHS: Record<string, UI.VNodeChild> = {
  model: <path d="M12 3l1.7 5.1a2 2 0 0 0 1.2 1.2L20 11l-5.1 1.7a2 2 0 0 0-1.2 1.2L12 19l-1.7-5.1a2 2 0 0 0-1.2-1.2L4 11l5.1-1.7a2 2 0 0 0 1.2-1.2z" />,
  web: <g><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13.5 13.5 0 0 1 3.5 9 13.5 13.5 0 0 1-3.5 9 13.5 13.5 0 0 1-3.5-9A13.5 13.5 0 0 1 12 3z" /></g>,
  user: <g><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></g>
};

/* per-property configuration shown in the popover */
type Prompt = {
  before: string;
  chip?: string;
  after?: string;
};
type ToolKind = "model" | "web" | "user";
type ColumnMeta = {
  type: string;
  tool: string;
  toolKind: ToolKind;
  inputs?: string;
  prompt?: Prompt;
};
const COLUMN_META: Record<string, ColumnMeta> = {
  Company: {
    type: "Text",
    tool: "User input",
    toolKind: "user"
  },
  Categories: {
    type: "Multi select",
    tool: "Sprinkles 5",
    toolKind: "model",
    inputs: "Company",
    prompt: {
      before: "Tag each ",
      chip: "Company",
      after: " with its market categories."
    }
  },
  "Last interaction": {
    type: "Date",
    tool: "User input",
    toolKind: "user"
  },
  "Connection strength": {
    type: "Single select",
    tool: "Sprinkles 5",
    toolKind: "model",
    inputs: "Last interaction",
    prompt: {
      before: "Score the relationship from ",
      chip: "Last interaction",
      after: "."
    }
  },
  Links: {
    type: "URL",
    tool: "Web search",
    toolKind: "web",
    inputs: "Company",
    prompt: {
      before: "Find the website for ",
      chip: "Company",
      after: "."
    }
  },
  [AI_LABEL]: {
    type: "Text",
    tool: "Web search",
    toolKind: "web",
    inputs: "Company",
    prompt: {
      before: "Find competitors for ",
      chip: "Company"
    }
  }
};
const NEW_PROPERTY_TYPES = ["Text", "File", "Collection", "Single select", "Multi select", "URL", "Reference", "JSON", "File splitter"];
const MODEL_OPTIONS = ["Sprinkles 5", "Sprinkles 4.2", "Sprinkles Mini"];
const INPUT_OPTIONS = ["Company", "Categories", "Last interaction", "Connection strength", "Links"];
const Checkbox = createComponent<{
  checked: boolean;
  mixed?: boolean;
  onChange: () => void;
  label: string;
}>("Checkbox", ["checked", "mixed", "onChange", "label"], (__props, __slots) => {
  const checked = computed(() => __props.checked);
  const mixed = computed(() => __props.mixed === undefined ? false : __props.mixed);
  const onChange = computed(() => __props.onChange);
  const label = computed(() => __props.label);
  return () => {
    return <label class="records-checkbox" title={label.value} onClick={event => event.stopPropagation()}>
      <input type="checkbox" checked={checked.value} onInput={onChange.value} aria-label={label.value} />
      <span class={`records-checkbox-box ${checked.value || mixed.value ? "is-active" : ""}`}>
        {mixed.value ? <span class="records-checkbox-dash" /> : checked.value ? <Icon size={12}><path d="m5 12 4 4L19 6" /></Icon> : null}
      </span>
    </label>;
  };
});
const Tag = createComponent<{
  name: string;
}>("Tag", ["name"], (__props, __slots) => {
  const name = computed(() => __props.name);
  const color = computed(() => TAG_COLORS[name.value] ?? {
    base: "var(--ink-3)"
  });
  return () => {
    return <span class="records-tag" style={cssStyle({
      "--tag-base": color.value.base
    } as UI.CSSProperties)}>
      {name.value}
    </span>;
  };
});
const TagList = createComponent<{
  tags: string[];
}>("TagList", ["tags"], (__props, __slots) => {
  const tags = computed(() => __props.tags);
  const containerRef = templateRef<HTMLDivElement>(null);
  const measureRef = templateRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = createState(tags.value.length);
  watchLifecycle(() => {
    const container = containerRef.value;
    const measure = measureRef.value;
    if (!container || !measure) return;
    const update = () => {
      const available = container.clientWidth;
      const tagWidths = Array.from(measure.querySelectorAll<HTMLElement>("[data-tag-measure]"), tag => tag.offsetWidth);
      const moreWidth = measure.querySelector<HTMLElement>("[data-more-measure]")?.offsetWidth ?? 0;
      let used = 0;
      let count = 0;
      for (let index = 0; index < tagWidths.length; index += 1) {
        const nextUsed = used + (count > 0 ? 4 : 0) + tagWidths[index];
        const hiddenAfter = tags.value.length - (index + 1);
        const totalWithOverflow = nextUsed + (hiddenAfter > 0 ? 4 + moreWidth : 0);
        if (totalWithOverflow > available) break;
        used = nextUsed;
        count += 1;
      }
      setVisibleCount(count);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, () => [tags.value]);
  const hiddenCount = computed(() => tags.value.length - visibleCount.value);
  return () => {
    return <div ref={containerRef} class="records-tags" title={tags.value.join(", ")} aria-label={`Categories: ${tags.value.join(", ")}`}>
      <div ref={measureRef} class="records-tags-measure" aria-hidden>
        {tags.value.map(tag => <span key={tag} data-tag-measure><Tag name={tag} /></span>)}
        <span data-more-measure class="records-more-tag">+{tags.value.length}</span>
      </div>
      {tags.value.slice(0, visibleCount.value).map(tag => <Tag key={tag} name={tag} />)}
      {hiddenCount.value > 0 && <span class="records-more-tag">+{hiddenCount.value}</span>}
    </div>;
  };
});
const CalcCell = createComponent<Record<string, never>>("CalcCell", [], (__props, __slots) => {
  return () => {
    return <span class="records-calc">
      <span class="records-muted">Calculating…</span>
      <span class="records-pulse" />
    </span>;
  };
});
const MiniSwitch = createComponent<{
  on: boolean;
  onToggle: () => void;
  label: string;
}>("MiniSwitch", ["on", "onToggle", "label"], (__props, __slots) => {
  const on = computed(() => __props.on);
  const onToggle = computed(() => __props.onToggle);
  const label = computed(() => __props.label);
  return () => {
    return <button type="button" role="switch" aria-checked={on.value} aria-label={label.value} onClick={onToggle.value} class="relative h-4.5 w-7.5 shrink-0 rounded-full transition-colors duration-150" style={cssStyle({
      background: on.value ? "var(--accent)" : "var(--line-strong)"
    })}>
      <span class="absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow-btn transition-transform duration-150" style={cssStyle({
        transform: on.value ? "translateX(12px)" : "translateX(0)",
        transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)"
      })} />
    </button>;
  };
});
const HeaderCell = createComponent<{
  label: string;
  icon: UI.VNodeChild;
  sortKey?: SortKey;
  sort: {
    key: SortKey;
    dir: 1 | -1;
  };
  onSort: (key: SortKey) => void;
  onResizeStart: (event: UI.PointerEvent<HTMLSpanElement>) => void;
  resizing?: boolean;
  className?: string;
  selected?: boolean;
  onPick?: (event: UI.MouseEvent) => void;
}>("HeaderCell", ["label", "icon", "sortKey", "sort", "onSort", "onResizeStart", "resizing", "className", "selected", "onPick"], (__props, __slots) => {
  const label = computed(() => __props.label);
  const icon = computed(() => __props.icon);
  const sortKey = computed(() => __props.sortKey);
  const sort = computed(() => __props.sort);
  const onSort = computed(() => __props.onSort);
  const onResizeStart = computed(() => __props.onResizeStart);
  const resizing = computed(() => __props.resizing === undefined ? false : __props.resizing);
  const className = computed(() => __props.className === undefined ? "" : __props.className);
  const selected = computed(() => __props.selected === undefined ? false : __props.selected);
  const onPick = computed(() => __props.onPick);
  return () => {
    return <th class={`records-header-cell ${selected.value ? "is-colsel" : ""} ${className.value}`}>
      {/* header click opens the property config; the arrow sorts */}
      <button type="button" class="records-header-button" onClick={onPick.value}>
        <span class="records-header-icon">{icon.value}</span>
        <span class="truncate">{label.value}</span>
        {sortKey.value && <span role="button" tabindex={0} aria-label={`Sort by ${label.value}`} onClick={event => {
          event.stopPropagation();
          onSort.value(sortKey.value!);
        }} onKeydown={event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onSort.value(sortKey.value!);
          }
        }} class={`records-sort ${sort.value.key === sortKey.value ? "is-visible" : ""}`} style={cssStyle({
          transform: sort.value.key === sortKey.value && sort.value.dir === -1 ? "rotate(180deg)" : undefined
        })}>
            <Icon size={12}><path d="M12 5v14M5 12l7 7 7-7" /></Icon>
          </span>}
      </button>
      <span role="separator" aria-orientation="vertical" aria-label={`Resize ${label.value} column`} class={`records-resize-handle ${resizing.value ? "is-resizing" : ""}`} onPointerdown={onResizeStart.value} />
    </th>;
  };
});
/* config row inside the property popover */
const ConfigRow = createComponent<{
  label: string;
  children: UI.VNodeChild;
}>("ConfigRow", ["label", "children"], (__props, __slots) => {
  const label = computed(() => __props.label);
  const children = { get value() { return __slots.default?.() ?? __props.children; } };
  return () => {
    return <div class="relative flex h-8 items-center justify-between">
      <span class="text-[13px] text-ink-3">{label.value}</span>
      {children.value}
    </div>;
  };
});
const ConfigPicker = createComponent<{
  label: string;
  options: {
    label: string;
    icon: UI.VNodeChild;
  }[];
  selected: string;
  onSelect: (value: string) => void;
}>("ConfigPicker", ["label", "options", "selected", "onSelect"], (__props, __slots) => {
  const label = computed(() => __props.label);
  const options = computed(() => __props.options);
  const selected = computed(() => __props.selected);
  const onSelect = computed(() => __props.onSelect);
  return () => {
    return <div role="menu" aria-label={label.value} class="absolute left-full top-0 z-30 ml-5 w-[210px] rounded-[12px] bg-surface p-1.5 shadow-overlay" style={cssStyle({
      animation: "pop-in 140ms cubic-bezier(0.23,1,0.32,1) both",
      transformOrigin: "top left"
    })}>
      <div class="px-2 pb-1 pt-0.5 text-[11.5px] font-medium text-ink-3">{label.value}</div>
      <GlideMenu className="flex flex-col gap-px">
        {options.value.map(option => <button key={option.label} data-menu-row type="button" role="menuitemradio" aria-checked={selected.value === option.label} onClick={() => onSelect.value(option.label)} class="relative z-10 flex h-8 w-full items-center gap-1.5 rounded-[8px] px-1.5 text-left text-[13px] font-medium text-ink">
            <span class="flex size-4 shrink-0 items-center justify-center text-ink-2">{option.icon}</span>
            <span class="min-w-0 flex-1 truncate">{option.label}</span>
            <span class={selected.value === option.label ? "text-ink" : "invisible"}>
              <Icon size={14} strokeWidth={2.2}><path d="m5 12 4 4L19 6" /></Icon>
            </span>
          </button>)}
      </GlideMenu>
    </div>;
  };
});
const InputPicker = createComponent<{
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}>("InputPicker", ["options", "selected", "onToggle"], (__props, __slots) => {
  const options = computed(() => __props.options);
  const selected = computed(() => __props.selected);
  const onToggle = computed(() => __props.onToggle);
  return () => {
    return <div role="menu" aria-label="Calculation inputs" class="absolute left-full top-0 z-30 ml-5 w-[220px] rounded-[12px] bg-surface p-1.5 shadow-overlay" style={cssStyle({
      animation: "pop-in 140ms cubic-bezier(0.23,1,0.32,1) both",
      transformOrigin: "top left"
    })}>
      <div class="px-2 pb-1 pt-0.5 text-[11.5px] font-medium text-ink-3">Use values from</div>
      <GlideMenu className="flex flex-col gap-px">
        {options.value.map(option => {
          const checked = selected.value.includes(option);
          return <button key={option} data-menu-row type="button" role="menuitemcheckbox" aria-checked={checked} onClick={() => onToggle.value(option)} class="relative z-10 flex h-8 w-full items-center gap-1.5 rounded-[8px] px-1.5 text-left text-[13px] font-medium text-ink">
              <span class={`flex size-4 shrink-0 items-center justify-center rounded-[5px] border ${checked ? "border-accent bg-accent text-white" : "border-line-strong text-transparent"}`}>
                <Icon size={11} strokeWidth={2.4}><path d="m5 12 4 4L19 6" /></Icon>
              </span>
              <span class="min-w-0 flex-1 truncate">{option}</span>
            </button>;
        })}
      </GlideMenu>
    </div>;
  };
});
const RecordsTable = createComponent<{
  rows?: RecordRow[];
  fill?: boolean;
  variant?: string;
}>("RecordsTable", ["rows", "fill", "variant"], (__props, __slots) => {
  const rows = computed(() => __props.rows === undefined ? INITIAL_ROWS : __props.rows);
  const fill = computed(() => __props.fill === undefined ? false : __props.fill);
  const [selected, setSelected] = createState<Set<string>>(new Set());
  const [sort, setSort] = createState<{
    key: SortKey;
    dir: 1 | -1;
  }>({
    key: "name",
    dir: 1
  });
  const [columnWidths, setColumnWidths] = createState(DEFAULT_COLUMN_WIDTHS);
  const [actionColumnWidth, setActionColumnWidth] = createState(100);
  const [columnWidthsLocked, setColumnWidthsLocked] = createState(false);
  const [resizingColumn, setResizingColumn] = createState<ColumnKey | null>(null);
  const initialColumnWidthsRef = templateRef<Record<ColumnKey, number> | null>(null);
  const tableRef = templateRef<HTMLTableElement>(null);

  /* property popover, anchored to the clicked header */
  const [prop, setProp] = createState<{
    col: string;
    x: number;
    y: number;
  } | null>(null);
  const [grounding, setGrounding] = createState(false);
  const [groundingHelpOpen, setGroundingHelpOpen] = createState(false);
  const [configMenu, setConfigMenu] = createState<"type" | "tool" | "inputs" | null>(null);
  const [columnOverrides, setColumnOverrides] = createState<Record<string, Partial<ColumnMeta>>>({});
  const [inputSelections, setInputSelections] = createState<Record<string, string[]>>({});
  const [pinnedColumns, setPinnedColumns] = createState<Set<string>>(new Set());
  const [moreSettingsOpen, setMoreSettingsOpen] = createState(false);
  const [advancedSettings, setAdvancedSettings] = createState({
    required: false,
    allowEmpty: true,
    confidence: false
  });
  /* + new-property menu */
  const [addOpen, setAddOpen] = createState<{
    x: number;
    y: number;
  } | null>(null);
  const [tableMenuOpen, setTableMenuOpen] = createState<{
    x: number;
    y: number;
  } | null>(null);
  /* the added AI column and its lifecycle */
  const [aiAdded, setAiAdded] = createState(false);
  const [aiDone, setAiDone] = createState(false);
  const [pendingOpenAi, setPendingOpenAi] = createState(false);
  const aiThRef = templateRef<HTMLTableCellElement>(null);
  /* programmatic scrolls (revealing the new column) shouldn't close popovers */
  const ignoreScrollRef = templateRef(false);
  /* a running calculation resolves rows one by one */
  const [calc, setCalc] = createState<{
    col: string;
    resolved: number;
  } | null>(null);

  /* Let the table fill its available space once, then capture those rendered
   * widths before paint. From that point on every column is explicit, so a
   * resize changes only the dragged column and the table's total width. */
  watchLifecycle(() => {
    if (columnWidthsLocked.value || !tableRef.value) return;
    const headers = Array.from(tableRef.value.querySelectorAll<HTMLTableCellElement>("thead th"));
    if (headers.length < 6) return;
    const measured: Record<ColumnKey, number> = {
      company: headers[0].getBoundingClientRect().width,
      categories: headers[1].getBoundingClientRect().width,
      last: headers[2].getBoundingClientRect().width,
      strength: headers[3].getBoundingClientRect().width,
      links: headers[4].getBoundingClientRect().width,
      ai: DEFAULT_COLUMN_WIDTHS.ai
    };
    initialColumnWidthsRef.value = measured;
    setColumnWidths(measured);
    setActionColumnWidth(headers[headers.length - 1].getBoundingClientRect().width);
    setColumnWidthsLocked(true);
  }, () => [columnWidthsLocked.value]);
  const visibleRows = computed(() => {
    return [...rows.value].sort((a, b) => {
      const value = sort.value.key === "name" ? a.name.localeCompare(b.name) : sort.value.key === "last" ? a.last.localeCompare(b.last) : STRENGTH[a.strength].rank - STRENGTH[b.strength].rank;
      return value * sort.value.dir;
    });
  });

  /* stagger: one row resolves every beat */
  watchLifecycle(() => {
    if (!calc.value) return;
    if (calc.value.resolved > visibleRows.value.length) {
      if (calc.value.col === AI_LABEL) setAiDone(true);
      setCalc(null);
      return;
    }
    const t = setTimeout(() => setCalc(current => current ? {
      ...current,
      resolved: current.resolved + 1
    } : current), 110);
    return () => clearTimeout(t);
  }, () => [calc.value, visibleRows.value.length]);

  /* after adding the AI column, scroll it into view and open its config
   * anchored to the new header */
  watchLifecycle(() => {
    if (!pendingOpenAi.value || !aiThRef.value) return;
    const scroller = aiThRef.value.closest(".records-scroll");
    if (scroller) {
      ignoreScrollRef.value = true;
      scroller.scrollLeft = scroller.scrollWidth;
    }
    const rect = aiThRef.value.getBoundingClientRect();
    setProp({
      col: AI_LABEL,
      x: Math.min(rect.left, window.innerWidth - 336),
      y: rect.bottom + 6
    });
    setPendingOpenAi(false);
  }, () => [pendingOpenAi.value, aiAdded.value]);

  /* click anywhere else closes popovers */
  watchLifecycle(() => {
    if (!prop.value! && !addOpen.value && !tableMenuOpen.value) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as HTMLInputElement as Element).closest("[data-recpop]")) {
        setProp(null);
        setConfigMenu(null);
        setGroundingHelpOpen(false);
        setMoreSettingsOpen(false);
        setAddOpen(null);
        setTableMenuOpen(null);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, () => [prop.value!, addOpen.value, tableMenuOpen.value]);
  const openProp = (col: string) => (event: UI.MouseEvent) => {
    const th = (event.currentTarget as HTMLElement as Element).closest("th");
    if (!th) return;
    setAddOpen(null);
    setTableMenuOpen(null);
    setConfigMenu(null);
    setGroundingHelpOpen(false);
    setMoreSettingsOpen(false);
    setProp(current => {
      if (current?.col === col) return null;
      const rect = th.getBoundingClientRect();
      return {
        col,
        x: Math.min(rect.left, window.innerWidth - 336),
        y: rect.bottom + 6
      };
    });
  };
  const isCalc = (col: string, index: number) => !!calc.value && calc.value.col === col && index >= calc.value.resolved;
  const allSelected = computed(() => visibleRows.value.length > 0 && visibleRows.value.every(row => selected.value.has(row.id)));
  const partiallySelected = computed(() => !allSelected.value && visibleRows.value.some(row => selected.value.has(row.id)));
  const toggleSort = (key: SortKey) => setSort(current => current.key === key ? {
    key,
    dir: current.dir * -1 as 1 | -1
  } : {
    key,
    dir: 1
  });
  const startColumnResize = (key: ColumnKey, minWidth = 120) => (event: UI.PointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setProp(null);
    setConfigMenu(null);
    setGroundingHelpOpen(false);
    setMoreSettingsOpen(false);
    setAddOpen(null);
    setTableMenuOpen(null);
    const startX = event.clientX;
    const startWidth = columnWidths.value[key];
    const previousCursor = document.body.style.cursor;
    const previousSelection = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setResizingColumn(key);
    const move = (moveEvent: PointerEvent) => {
      const width = Math.max(minWidth, startWidth + moveEvent.clientX - startX);
      setColumnWidths(current => ({
        ...current,
        [key]: width
      }));
    };
    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelection;
      setResizingColumn(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };
  const toggleRow = (id: string) => setSelected(current => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(current => {
    const next = new Set(current);
    if (allSelected.value) visibleRows.value.forEach(row => next.delete(row.id));else visibleRows.value.forEach(row => next.add(row.id));
    return next;
  });
  const meta = computed(() => prop.value! ? {
    ...COLUMN_META[prop.value!.col],
    ...columnOverrides.value[prop.value!.col]
  } : null);
  const selectedInputs = computed(() => prop.value! && meta.value! ? inputSelections.value[prop.value!.col] ?? (meta.value!.inputs ? [meta.value!.inputs] : []) : []);
  const tableWidth = computed(() => columnWidths.value.company + columnWidths.value.categories + columnWidths.value.last + columnWidths.value.strength + columnWidths.value.links + (aiAdded.value ? columnWidths.value.ai : 0) + actionColumnWidth.value);
  return () => {
    return <div class={`records-shell${fill.value ? " is-fill" : ""}`}>
      <div class="records-scroll" tabindex={0} aria-label="Companies table. Scroll horizontally and vertically to view all columns and records." onScroll={() => {
        if (ignoreScrollRef.value) {
          ignoreScrollRef.value = false;
          return;
        }
        setProp(null);
        setConfigMenu(null);
        setGroundingHelpOpen(false);
        setMoreSettingsOpen(false);
        setAddOpen(null);
        setTableMenuOpen(null);
      }}>
        <table ref={tableRef} class="records-table" style={cssStyle({
          width: columnWidthsLocked.value ? tableWidth.value : "100%",
          minWidth: tableWidth.value
        })}>
          <colgroup>
            <col class="records-company-col" style={cssStyle({
              width: columnWidths.value.company
            })} />
            <col class="records-category-col" style={cssStyle({
              width: columnWidths.value.categories
            })} />
            <col class="records-last-col" style={cssStyle({
              width: columnWidths.value.last
            })} />
            <col class="records-strength-col" style={cssStyle({
              width: columnWidths.value.strength
            })} />
            <col class="records-link-col" style={cssStyle({
              width: columnWidths.value.links
            })} />
            {aiAdded.value && <col style={cssStyle({
              width: columnWidths.value.ai
            })} />}
            <col style={cssStyle({
              width: 100
            })} />
          </colgroup>
          <thead>
            <tr>
              <th class={`records-header-cell records-sticky-cell ${prop.value!?.col === "Company" ? "is-colsel" : ""}`}>
                <div class="records-company-header" style={cssStyle({
                  cursor: "pointer"
                })} onClick={event => openProp("Company")(event)}>
                  <Checkbox checked={allSelected.value} mixed={partiallySelected.value} onChange={toggleAll} label="Select all companies" />
                  <span>Company</span>
                </div>
                <span role="separator" aria-orientation="vertical" aria-label="Resize Company column" class={`records-resize-handle ${resizingColumn.value === "company" ? "is-resizing" : ""}`} onPointerdown={startColumnResize("company", 180)} />
              </th>
              <HeaderCell label="Categories" selected={prop.value!?.col === "Categories"} onPick={openProp("Categories")} sort={sort.value} onSort={toggleSort} onResizeStart={startColumnResize("categories")} resizing={resizingColumn.value === "categories"} icon={<Icon size={15}>{TYPE_GLYPHS["Multi select"]}</Icon>} />
              <HeaderCell label="Last interaction" selected={prop.value!?.col === "Last interaction"} onPick={openProp("Last interaction")} sortKey="last" sort={sort.value} onSort={toggleSort} onResizeStart={startColumnResize("last")} resizing={resizingColumn.value === "last"} icon={<Icon size={15}>{TYPE_GLYPHS.Date}</Icon>} />
              <HeaderCell label="Connection strength" selected={prop.value!?.col === "Connection strength"} onPick={openProp("Connection strength")} sortKey="strength" sort={sort.value} onSort={toggleSort} onResizeStart={startColumnResize("strength")} resizing={resizingColumn.value === "strength"} icon={<Icon size={15}>{TYPE_GLYPHS["Single select"]}</Icon>} />
              <HeaderCell label="Links" selected={prop.value!?.col === "Links"} onPick={openProp("Links")} sort={sort.value} onSort={toggleSort} onResizeStart={startColumnResize("links")} resizing={resizingColumn.value === "links"} icon={<Icon size={15}>{TYPE_GLYPHS.URL}</Icon>} />
              {aiAdded.value && <th ref={aiThRef} class={`records-header-cell ${prop.value!?.col === AI_LABEL ? "is-colsel" : ""}`}>
                  <button type="button" class="records-header-button" onClick={openProp(AI_LABEL)}>
                    <span class="records-header-icon"><Icon size={15}>{TYPE_GLYPHS.Text}</Icon></span>
                    <span class="truncate">{AI_LABEL}</span>
                  </button>
                  <span role="separator" aria-orientation="vertical" aria-label={`Resize ${AI_LABEL} column`} class={`records-resize-handle ${resizingColumn.value === "ai" ? "is-resizing" : ""}`} onPointerdown={startColumnResize("ai")} />
                </th>}
              <th class="records-header-cell">
                <div class="flex h-[35px] items-center gap-1 px-2">
                  <button type="button" aria-label="New property" data-recpop onClick={event => {
                    setProp(null);
                    setTableMenuOpen(null);
                    const rect = (event.currentTarget as HTMLElement as Element).getBoundingClientRect();
                    setAddOpen(current => current ? null : {
                      x: Math.min(rect.left, window.innerWidth - 276),
                      y: rect.bottom + 6
                    });
                  }} class="flex size-7 items-center justify-center rounded-[7px] text-ink-2 transition-colors duration-100 hover:bg-hover hover:text-ink">
                    <Icon size={15} strokeWidth={2}><path d="M12 5v14M5 12h14" /></Icon>
                  </button>
                  <button type="button" aria-label="Table options" aria-expanded={!!tableMenuOpen.value} data-recpop onClick={event => {
                    setProp(null);
                    setAddOpen(null);
                    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                    setTableMenuOpen(current => current ? null : {
                      x: Math.max(8, Math.min(rect.right - 220, window.innerWidth - 228)),
                      y: rect.bottom + 6
                    });
                  }} class="flex size-7 items-center justify-center rounded-[7px] text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          {/* data cells stay silent — the papery link/flick sound is too much when scanning rows */}
          <tbody data-sound-silent>
            {visibleRows.value.map((row, index) => {
              const selectedRow = selected.value.has(row.id);
              const strength = STRENGTH[row.strength];
              return <tr key={row.id} class={`records-row ${selectedRow ? "is-selected" : ""}`}>
                <td class={`records-cell records-sticky-cell records-company-cell ${prop.value!?.col === "Company" ? "is-colsel" : ""}`}><span class="records-rownum">{index + 1}</span><Checkbox checked={selectedRow} onChange={() => toggleRow(row.id)} label={`Select ${row.name}`} /><span class="records-company-mark">{row.name.slice(0, 1).toUpperCase()}</span><a href={row.website ? `https://${row.website}` : "#"} onClick={event => !row.website && event.preventDefault()} title={row.name} class={`records-company-name ${row.website ? "has-link" : ""}`}>{row.name}</a></td>
                <td class={`records-cell ${prop.value!?.col === "Categories" ? "is-colsel" : ""}`}>{isCalc("Categories", index) ? <CalcCell /> : <TagList tags={row.tags} />}</td>
                <td class={`records-cell ${row.last === "No contact" ? "records-muted" : ""} ${prop.value!?.col === "Last interaction" ? "is-colsel" : ""}`}>{isCalc("Last interaction", index) ? <CalcCell /> : row.last}</td>
                <td class={`records-cell ${prop.value!?.col === "Connection strength" ? "is-colsel" : ""}`}>{isCalc("Connection strength", index) ? <CalcCell /> : <span class="records-strength"><span class="records-strength-dot" style={cssStyle({
                      background: strength.color
                    })} />{strength.label}</span>}</td>
                <td class={`records-cell ${prop.value!?.col === "Links" ? "is-colsel" : ""}`}>{isCalc("Links", index) ? <CalcCell /> : row.website ? <a class="records-link" href={`https://${row.website}`} title={row.website} target="_blank" rel="noreferrer"><span class="records-link-label">{row.website}</span><Icon size={12}><path d="M14 5h5v5M19 5l-8 8" /></Icon></a> : <span class="records-muted">—</span>}</td>
                {aiAdded.value && <td class={`records-cell ${prop.value!?.col === AI_LABEL ? "is-colsel" : ""}`}>
                    {calc.value?.col === AI_LABEL ? index < calc.value.resolved ? competitorsFor(index) : <CalcCell /> : aiDone.value ? competitorsFor(index) : <span class="records-muted">—</span>}
                  </td>}
                <td class="records-cell" />
              </tr>;
            })}
          </tbody>
          <tfoot>
            <tr class="records-calculation-row">
              <td class="records-cell records-sticky-cell">
                <span class="records-footer-value records-calculation-label"><span class="records-calculation-number">{rows.value.length}</span> count</span>
              </td>
              <td class="records-cell">
                <button type="button" class="records-add-calculation"><Icon size={15}><path d="M12 5v14M5 12h14" /></Icon>Add calculation</button>
              </td>
              <td class="records-cell records-muted"><span class="records-footer-value">—</span></td>
              <td class="records-cell">
                <span class="records-footer-value records-average"><span class="records-strength-dot" style={cssStyle({
                    background: "var(--orange)"
                  })} />{Math.round(rows.value.reduce((sum, row) => sum + STRENGTH[row.strength].rank, 0) / rows.value.length / 3 * 100)}% average</span>
              </td>
              <td class="records-cell"><span class="records-footer-value records-muted">{rows.value.filter(row => row.website).length} links</span></td>
              {aiAdded.value && <td class="records-cell records-muted"><span class="records-footer-value">{aiDone.value ? `${rows.value.length} filled` : "—"}</span></td>}
              <td class="records-cell" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── property configuration popover ─────────────────── */}
      {prop.value! && meta.value! && <div data-recpop class="fixed z-50 w-[320px] rounded-[14px] bg-surface px-3 pt-3 pb-1.5 shadow-overlay" style={cssStyle({
        top: prop.value!.y,
        left: prop.value!.x,
        animation: "pop-in 160ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "top left"
      })}>
          <div class="pb-2 text-[13.5px] font-medium text-ink">{prop.value!.col}</div>

          <ConfigRow label="Type">
            <button type="button" aria-haspopup="menu" aria-expanded={configMenu.value === "type"} onClick={() => setConfigMenu(current => current === "type" ? null : "type")} class="flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[13px] font-medium text-ink transition-colors duration-100 hover:bg-hover">
              <span class="text-ink-2"><Icon size={14}>{TYPE_GLYPHS[meta.value!.type] ?? TYPE_GLYPHS.Text}</Icon></span>
              {meta.value!.type}
              <span class="text-ink-3"><Icon size={12} strokeWidth={2.2}><path d="M9 6l6 6-6 6" /></Icon></span>
            </button>
            {configMenu.value === "type" && <ConfigPicker label="Property type" selected={meta.value!.type} options={NEW_PROPERTY_TYPES.map(type => ({
            label: type,
            icon: <Icon size={15}>{TYPE_GLYPHS[type]}</Icon>
          }))} onSelect={type => {
            setColumnOverrides(current => ({
              ...current,
              [prop.value!.col]: {
                ...current[prop.value!.col],
                type
              }
            }));
            setConfigMenu(null);
          }} />}
          </ConfigRow>
          <ConfigRow label="Tool">
            <button type="button" aria-haspopup="menu" aria-expanded={configMenu.value === "tool"} onClick={() => setConfigMenu(current => current === "tool" ? null : "tool")} class="flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[13px] font-medium text-ink transition-colors duration-100 hover:bg-hover">
              <span class={meta.value!.toolKind === "model" ? "text-accent" : "text-ink-2"}>
                {meta.value!.toolKind === "model" ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>{TOOL_GLYPHS.model}</svg> : <Icon size={14}>{TOOL_GLYPHS[meta.value!.toolKind]}</Icon>}
              </span>
              {meta.value!.tool}
              <span class="text-ink-3"><Icon size={12} strokeWidth={2.2}><path d="M9 6l6 6-6 6" /></Icon></span>
            </button>
            {configMenu.value === "tool" && <ConfigPicker label="Model" selected={meta.value!.tool} options={MODEL_OPTIONS.map(model => ({
            label: model,
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>{TOOL_GLYPHS.model}</svg>
          }))} onSelect={tool => {
            setColumnOverrides(current => ({
              ...current,
              [prop.value!.col]: {
                ...current[prop.value!.col],
                tool,
                toolKind: "model"
              }
            }));
            setConfigMenu(null);
          }} />}
          </ConfigRow>
          <ConfigRow label="Grounding">
            <span class="flex items-center gap-2">
              <MiniSwitch label="Grounding" on={grounding.value} onToggle={() => setGrounding(current => !current)} />
              <button type="button" aria-label="About grounding" aria-expanded={groundingHelpOpen.value} onClick={() => setGroundingHelpOpen(open => !open)} class="flex size-6 items-center justify-center rounded-[6px] text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink">
                <Icon size={13}><g><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></g></Icon>
              </button>
            </span>
            {groundingHelpOpen.value && <div class="absolute right-0 top-[30px] z-30 w-[230px] rounded-[10px] px-3 py-2.5 text-[12px] leading-relaxed shadow-overlay" style={cssStyle({
            color: "var(--tooltip-fg)",
            background: "var(--tooltip-bg)"
          })} role="status">
                Grounding lets the model verify generated values against connected sources.
              </div>}
          </ConfigRow>
          <ConfigRow label="Inputs">
            <button type="button" aria-haspopup="menu" aria-expanded={configMenu.value === "inputs"} onClick={() => setConfigMenu(current => current === "inputs" ? null : "inputs")} class="flex max-w-[220px] items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-[13px] text-ink-2 transition-colors duration-100 hover:bg-hover hover:text-ink">
              {selectedInputs.value.length ? <span class="flex min-w-0 items-center gap-1">
                  {selectedInputs.value.slice(0, 2).map(input => <span key={input} class="max-w-[92px] truncate rounded-[5px] bg-accent-tint px-1.5 py-0.5 text-[12px] font-medium text-accent-ink">{input}</span>)}
                  {selectedInputs.value.length > 2 && <span class="text-[11px] font-medium text-ink-3">+{selectedInputs.value.length - 2}</span>}
                </span> : <span>Select inputs</span>}
              <span class="shrink-0 text-ink-3"><Icon size={12} strokeWidth={2.2}><path d="M9 6l6 6-6 6" /></Icon></span>
            </button>
            {configMenu.value === "inputs" && <InputPicker selected={selectedInputs.value} options={INPUT_OPTIONS.filter(input => input !== prop.value!.col)} onToggle={input => {
            setInputSelections(current => {
              const existing = current[prop.value!.col] ?? (meta.value!.inputs ? [meta.value!.inputs] : []);
              const next = existing.includes(input) ? existing.filter(item => item !== input) : [...existing, input];
              return {
                ...current,
                [prop.value!.col]: next
              };
            });
          }} />}
          </ConfigRow>

          {/* prompt — @-mention chips inline */}
          <div contenteditable role="textbox" aria-label={`${prop.value!.col} calculation prompt`} aria-multiline="true" spellcheck class="mt-2 min-h-[88px] cursor-text rounded-[10px] bg-inset p-3 text-[13px] leading-relaxed shadow-hairline outline-none transition-[box-shadow] duration-150 focus:shadow-[0_0_0_2px_var(--accent)]">
            {meta.value!.prompt ? <span class="text-ink">
                {meta.value!.prompt.before}
                {meta.value!.prompt.chip && <span contenteditable={false} class="rounded-[5px] bg-accent-tint px-1.5 py-0.5 text-[12px] font-medium text-accent-ink">{meta.value!.prompt.chip}</span>}
                {meta.value!.prompt.after}
              </span> : <span class="text-ink-3">Set a prompt (press @ to mention an input)</span>}
          </div>

          <button type="button" disabled={!!calc.value} onClick={() => {
          setCalc({
            col: prop.value!.col,
            resolved: 0
          });
          setProp(null);
        }} class="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-[9px] text-[12.5px] font-medium text-ink shadow-btn transition-[background-color,transform] duration-150 hover:bg-hover active:scale-[0.98] disabled:opacity-60">
            <Icon size={14} strokeWidth={1.9}><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" /></Icon>
            Go calculate
          </button>

          <GlideMenu className="mt-3 flex flex-col gap-0.5 border-t border-line pt-2" highlightClassName="-inset-x-1.5 rounded-[8px] bg-hover">
            <button data-menu-row type="button" aria-pressed={pinnedColumns.value.has(prop.value!.col)} onClick={() => setPinnedColumns(current => {
            const next = new Set(current);
            next.has(prop.value!.col) ? next.delete(prop.value!.col) : next.add(prop.value!.col);
            return next;
          })} class="relative z-10 -mx-1.5 flex h-8 items-center gap-2.5 rounded-[8px] px-1.5 text-left text-[13px] leading-none text-ink transition-transform duration-150 active:scale-[0.96]">
              <span class={pinnedColumns.value.has(prop.value!.col) ? "text-accent" : "text-ink-2"}><Icon size={15}><path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3-1-7z" /></Icon></span>
              {pinnedColumns.value.has(prop.value!.col) ? "Unpin" : "Pin"}
            </button>
            <button data-menu-row type="button" aria-expanded={moreSettingsOpen.value} onClick={() => setMoreSettingsOpen(open => !open)} class="relative z-10 -mx-1.5 flex h-8 items-center gap-2.5 rounded-[8px] px-1.5 text-left text-[13px] leading-none text-ink transition-transform duration-150 active:scale-[0.96]">
              <span class={moreSettingsOpen.value ? "text-ink" : "text-ink-2"}><Icon size={15}><g><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></g></Icon></span>
              <span class="flex-1">More settings</span>
              <span class={`text-ink-3 transition-transform duration-150 ${moreSettingsOpen.value ? "rotate-90" : ""}`}><Icon size={12} strokeWidth={2.2}><path d="M9 6l6 6-6 6" /></Icon></span>
            </button>
            {prop.value!.col === AI_LABEL && <button data-menu-row type="button" onClick={() => {
            setAiAdded(false);
            setAiDone(false);
            setProp(null);
          }} class="relative z-10 -mx-1.5 flex h-8 items-center gap-2.5 rounded-[8px] px-1.5 text-left text-[13px] leading-none text-ink transition-transform duration-150 active:scale-[0.96]">
                <span class="text-ink-2"><Icon size={15}><g><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a16.3 16.3 0 0 1-2.1 3M6.6 6.6A16 16 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></g></Icon></span>
                Hide from view
              </button>}
          </GlideMenu>

          {moreSettingsOpen.value && <div class="mt-2 border-t border-line pt-2" style={cssStyle({
          animation: "fade-up 160ms cubic-bezier(0.23,1,0.32,1) both"
        })}>
              <div class="pb-1 text-[11.5px] font-medium text-ink-3">Behavior</div>
              <ConfigRow label="Required value">
                <MiniSwitch label="Required value" on={advancedSettings.value.required} onToggle={() => setAdvancedSettings(current => ({
              ...current,
              required: !current.required
            }))} />
              </ConfigRow>
              <ConfigRow label="Allow empty results">
                <MiniSwitch label="Allow empty results" on={advancedSettings.value.allowEmpty} onToggle={() => setAdvancedSettings(current => ({
              ...current,
              allowEmpty: !current.allowEmpty
            }))} />
              </ConfigRow>
              <ConfigRow label="Show confidence">
                <MiniSwitch label="Show confidence" on={advancedSettings.value.confidence} onToggle={() => setAdvancedSettings(current => ({
              ...current,
              confidence: !current.confidence
            }))} />
              </ConfigRow>
            </div>}
        </div>}

      {/* ── new property type menu ─────────────────────────── */}
      {addOpen.value && <div data-recpop class="fixed z-50 w-[260px] rounded-[14px] bg-surface p-1.5 shadow-overlay" style={cssStyle({
        top: addOpen.value.y,
        left: addOpen.value.x,
        animation: "pop-in 160ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "top left"
      })}>
          <div class="px-2 pb-1 pt-1 text-[12px] font-medium text-ink-3">New property</div>
          <GlideMenu className="flex flex-col gap-px">
            {NEW_PROPERTY_TYPES.map(type => <button key={type} data-menu-row type="button" onClick={() => {
            setAddOpen(null);
            setAiDone(false);
            setAiAdded(true);
            setPendingOpenAi(true);
          }} class="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2 text-left text-[13px] text-ink">
                <span class="text-ink-2"><Icon size={15}>{TYPE_GLYPHS[type]}</Icon></span>
                {type}
              </button>)}
          </GlideMenu>
        </div>}

      {/* ── table options menu ─────────────────────────────── */}
      {tableMenuOpen.value && <div data-recpop class="fixed z-50 w-[220px] rounded-[14px] bg-surface p-1.5 shadow-overlay" style={cssStyle({
        top: tableMenuOpen.value.y,
        left: tableMenuOpen.value.x,
        animation: "pop-in 160ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "top right"
      })}>
          <div class="px-2 pb-1 pt-1 text-[12px] font-medium text-ink-3">Table options</div>
          <GlideMenu className="flex flex-col gap-px">
          <button data-menu-row type="button" onClick={() => {
            const position = tableMenuOpen.value!;
            setTableMenuOpen(null);
            setAddOpen({
              x: Math.min(position.x, window.innerWidth - 276),
              y: position.y
            });
          }} class="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2 text-left text-[13px] text-ink">
            <span class="text-ink-2"><Icon size={15} strokeWidth={2}><path d="M12 5v14M5 12h14" /></Icon></span>
            Add property
          </button>
          <button data-menu-row type="button" onClick={() => {
            setColumnWidths({
              company: 220,
              categories: 220,
              last: 155,
              strength: 180,
              links: 160,
              ai: 200
            });
            setTableMenuOpen(null);
          }} class="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2 text-left text-[13px] text-ink">
            <span class="text-ink-2"><Icon size={15}><path d="M4 8h16M7 4 3 8l4 4M17 4l4 4-4 4M4 16h16" /></Icon></span>
            Compact columns
          </button>
          <button data-menu-row type="button" onClick={() => {
            setColumnWidths({
              ...(initialColumnWidthsRef.value ?? DEFAULT_COLUMN_WIDTHS)
            });
            setTableMenuOpen(null);
          }} class="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2 text-left text-[13px] text-ink">
            <span class="text-ink-2"><Icon size={15}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v6h6" /></Icon></span>
            Reset column widths
          </button>
          <div class="my-1 h-px bg-line" />
          <button data-menu-row type="button" onClick={() => {
            setSelected(new Set());
            setTableMenuOpen(null);
          }} class="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2 text-left text-[13px] text-ink">
            <span class="text-ink-2"><Icon size={15}><path d="M5 5l14 14M19 5 5 19" /></Icon></span>
            Clear selection
          </button>
          </GlideMenu>
        </div>}
    </div>;
  };
}, { fill: Boolean });
export default RecordsTable;
