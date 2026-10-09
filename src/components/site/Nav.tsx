// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import { META } from "@/lib/meta";

/* Component nav — anchors into the list, scrollspy highlights
 * the section in view, and a single pill glides to whichever
 * item the pointer is over (falling back to the active one). */

export const Nav = createComponent<Record<string, never>>("Nav", [], (__props, __slots) => {
  const [active, setActive] = createState(META[0].id);
  const [hovered, setHovered] = createState<string | null>(null);
  const [box, setBox] = createState<{
    top: number;
    height: number;
  } | null>(null);
  const listRef = templateRef<HTMLUListElement>(null);
  const itemRefs = templateRef<Record<string, HTMLLIElement | null>>({});
  watchLifecycle(() => {
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setActive((e.target as HTMLInputElement).id);
    }, {
      rootMargin: "-20% 0px -70% 0px"
    });
    META.forEach(m => {
      const el = document.getElementById(m.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, () => []);

  // position the gliding pill on the hovered item, else the active one
  watchLifecycle(() => {
    const target = itemRefs.value[hovered.value ?? active.value];
    if (target) setBox({
      top: target.offsetTop,
      height: target.offsetHeight
    });
  }, () => [hovered.value, active.value]);
  return () => {
    return <nav aria-label="Components">
      <p class="mb-2 text-[11.5px] text-ink-3">Components</p>
      <ul ref={listRef} onMouseleave={() => setHovered(null)} class="relative flex flex-col">
        {/* single gliding highlight */}
        <span aria-hidden class="pointer-events-none absolute inset-x-0 rounded-[7px] bg-hover" style={cssStyle({
          top: box.value?.top ?? 0,
          height: box.value?.height ?? 0,
          opacity: box.value ? 1 : 0,
          transition: "top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease"
        })} />
        {META.map(m => <li key={m.id} ref={(el: any) => {
          itemRefs.value[m.id] = el;
        }}>
            <a href={`#${m.id}`} onMouseenter={() => setHovered(m.id)} onFocus={() => setHovered(m.id)} onBlur={() => setHovered(null)} onClick={e => {
            e.preventDefault();
            document.getElementById(m.id)?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }} class={`relative z-10 flex items-center rounded-[7px] px-2 py-[5px]
                text-[12.5px] transition-colors duration-150
                ${active.value === m.id ? "font-medium text-ink" : "text-ink-2 hover:text-ink"}`}>
              {m.title}
            </a>
          </li>)}
      </ul>
    </nav>;
  };
});
