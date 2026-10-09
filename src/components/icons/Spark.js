import { defineComponent, cloneVNode } from "vue";
import {createElementVNode as  _createElementVNode,openBlock as  _openBlock,createElementBlock as  _createElementBlock} from "vue"

const render = function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    "stroke-width": "1.5",
    viewBox: "0 0 24 24"
  }, [
    _createElementVNode("path", {
      stroke: "currentColor",
      "stroke-linejoin": "round",
      d: "M3 12C9.26752 12 12 9.36306 12 3C12 9.36306 14.7134 12 21 12C14.7134 12 12 14.7134 12 21C12 14.7134 9.26752 12 3 12Z"
    })
  ]))
}
export default defineComponent({ inheritAttrs:false, setup(_props,{attrs}) { return () => cloneVNode(render({}, []), { width:24, height:24, ...attrs, "stroke-width":attrs.strokeWidth ?? 1.8 }); } });
