// Native Vue JSX. Design and behavior adapted from Beautiful UI (MIT).
import type * as UI from '@/lib/dom-types';
import { computed, type ComputedRef, type FunctionalComponent } from 'vue';
import { createComponent, createState, templateRef, watchLifecycle, cssStyle, omitProps, teleport } from '@/lib/vue-tools';
import type { ButtonHTMLAttributes } from '@/lib/dom-types';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const filledShadow = "shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";

/* Pill-shaped by default — the app's core button style. Explicit symmetric
 * padding (not a fixed height) so the top/bottom spacing is always equal. */
export const buttonVariants = cva(`inline-flex items-center justify-center font-medium select-none
   transition-[transform,background-color,opacity] duration-150 ease-out
   active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none`, {
  variants: {
    variant: {
      primary: `bg-ink text-canvas hover:opacity-90 dark:bg-ink dark:text-canvas ${filledShadow}`,
      secondary: "bg-surface text-ink shadow-btn hover:bg-inset aria-expanded:bg-hover",
      ghost: "bg-hover-2 text-ink hover:bg-line-strong",
      accent: `bg-accent text-white hover:bg-accent-ink ${filledShadow}`,
      success: `bg-green text-white hover:brightness-95 ${filledShadow}`,
      /* transparent until hovered — for dense toolbars/action rows */
      quiet: "text-ink hover:bg-hover"
    },
    size: {
      /* compact toolbar pill — fixed height, lighter weight */
      xs: "h-7 rounded-full px-2.5 text-[12px] font-normal leading-none gap-1",
      /* canonical action pill — 27px tall, roomy sides */
      sm: "h-[27px] px-3 text-[13px] leading-none rounded-full gap-1.5",
      md: "px-4 py-[9px] text-sm leading-none rounded-full gap-2"
    }
  },
  defaultVariants: {
    variant: "secondary",
    size: "md"
  }
});
export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export const Button = createComponent<ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>>("Button", ["variant", "size", "className"], (__props, __slots) => {
  const variant = computed(() => __props.variant);
  const size = computed(() => __props.size);
  const className = computed(() => __props.className);
  const props = computed(() => omitProps(__props, ["variant", "size", "className", "children"]));
  return () => {
    return <button class={cn(buttonVariants({
      variant: variant.value,
      size: size.value
    }), className.value)} {...props.value}>{__slots.default?.() ?? __props.children}</button>;
  };
});
