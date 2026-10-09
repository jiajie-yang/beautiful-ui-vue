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
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      d: "M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426"
    })
  ]))
}
export default defineComponent({ inheritAttrs:false, setup(_props,{attrs}) { return () => cloneVNode(render({}, []), { width:24, height:24, ...attrs, "stroke-width":attrs.strokeWidth ?? 1.8 }); } });
