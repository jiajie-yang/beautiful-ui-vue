import { defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
export default defineComponent({
  inheritAttrs: false,
  props: { href: { type: String, required: true }, className: String },
  setup(props, { attrs, slots }) { return () => h(RouterLink, { ...attrs, class: props.className, to: props.href }, slots) },
})
