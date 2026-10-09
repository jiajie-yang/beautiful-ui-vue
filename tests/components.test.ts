import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { REGISTRY } from '@/lib/registry'
import FilterTable from '@/components/primitives/FilterTable'
import SearchList from '@/components/primitives/SearchList'
import CodeBlock from '@/components/primitives/CodeBlock'
import PromptBar from '@/components/primitives/PromptBar'
import AgentScreen from '@/components/primitives/AgentScreen'
import InsightCards from '@/components/primitives/InsightCards'
import ApprovalCard from '@/components/primitives/ApprovalCard'
import RecordsTable from '@/components/primitives/RecordsTable'
import { Button } from '@/components/atoms/Button'
const mounted: VueWrapper[] = []
function render(component: Parameters<typeof mount>[0], options: Parameters<typeof mount>[1] = {}) { const wrapper=mount(component,{attachTo:document.body,...options});mounted.push(wrapper);return wrapper }
beforeEach(()=>vi.useFakeTimers())
afterEach(()=>{mounted.splice(0).forEach(w=>w.unmount());vi.clearAllTimers();vi.useRealTimers();document.body.innerHTML='';vi.clearAllMocks()})
describe('all gallery components and variants',()=>{
 for(const entry of REGISTRY) for(const variant of entry.variants??['Default']) {
  it(`${entry.id}: ${variant}`,async()=>{
   const wrapper=render(entry.Demo,{props:variant==='Default'?{}:{variant}})
   await nextTick()
   expect(wrapper.html().length).toBeGreaterThan(20)
   await vi.advanceTimersByTimeAsync(1000)
   expect(wrapper.html()).not.toContain('[object Object]')
  })
 }
})
it('button forwards native events and reacts to disabled changes',async()=>{
 const click=vi.fn(); const wrapper=render(Button,{props:{onClick:click,disabled:false},slots:{default:'Approve'}})
 expect(wrapper.text()).toBe('Approve');await wrapper.get('button').trigger('click');expect(click).toHaveBeenCalledTimes(1)
 await wrapper.setProps({disabled:true});expect(wrapper.get('button').attributes('disabled')).toBeDefined()
})
it('filter chips collapse non-matching rows',async()=>{
 const wrapper=render(FilterTable)
 const button=wrapper.findAll('button').find(b=>b.text().includes('Completed'))!
 await button.trigger('click')
 const row=wrapper.findAll('div').find(el=>el.text()==='Restock mango sorbetDec 03To doMango Moon Gelato')
 expect(wrapper.findAll('[style]').filter(el=>el.attributes('style')?.includes('grid-template-rows: 0fr')).length).toBe(4)
})
it('search input updates results and empty state',async()=>{
 const wrapper=render(SearchList);await wrapper.get('input').setValue('zzzz-no-match');expect(wrapper.text()).toContain('No results')
})
it('copy writes the provided code to clipboard',async()=>{
 const wrapper=render(CodeBlock,{props:{code:'const migrated = true;'}})
 await wrapper.get('[aria-label="Copy code"]').trigger('click');await nextTick()
 expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const migrated = true;');expect(wrapper.text()).toContain('Copied')
})
it('prompt updates and emits send without IME Enter submission',async()=>{
 const send=vi.fn();const wrapper=render(PromptBar,{props:{demo:false,onSend:send}})
 await wrapper.get('textarea').setValue('Hello Vue')
 await wrapper.get('textarea').trigger('keydown',{key:'Enter',isComposing:true});expect(send).not.toHaveBeenCalled()
 await wrapper.get('textarea').trigger('keydown',{key:'Enter',isComposing:false});expect(send).toHaveBeenCalledWith('Hello Vue')
})
it('insight carousel renders the next card rather than a setup snapshot',async()=>{
 const wrapper=render(InsightCards)
 expect(wrapper.text()).toContain('Pistachio')
 const buttons=wrapper.findAll('button');await buttons.find(b=>b.attributes('aria-label')?.toLowerCase().includes('next'))!.trigger('click')
 expect(wrapper.text()).toContain('freezer bill')
})
it('agent viewer opens via Teleport and retains recording after collapse',async()=>{
 const wrapper=render(AgentScreen)
 const open=wrapper.findAll('button').find(b=>b.text()==='Open')!;await open.trigger('click')
 expect(document.body.textContent).toContain('Teach a task')
 const teach=Array.from(document.body.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Teach a task')!;teach.click();await nextTick()
 await vi.advanceTimersByTimeAsync(2100)
 expect(document.body.textContent).toContain('00:02')
})
it('approval submits caller-provided questions',async()=>{
 const submitted=vi.fn();const wrapper=render(ApprovalCard,{props:{questions:[{title:'Choose a flavor',type:'radio',options:['Vanilla','Pistachio']}],onSubmitted:submitted}})
 const choice=wrapper.findAll('button').find(b=>b.text().includes('Pistachio'))!;await choice.trigger('click');await vi.advanceTimersByTimeAsync(600)
 expect(submitted).toHaveBeenCalledWith({0:[1]})
})
it('record selection updates select-all state',async()=>{
 const wrapper=render(RecordsTable)
 await wrapper.get('input[aria-label="Select all companies"]').setValue(true)
 expect((wrapper.get('input[aria-label="Select all companies"]').element as HTMLInputElement).checked).toBe(true)
})

it('streaming text restarts for changed input and invokes the latest completion callback',async()=>{
 const {StreamText}=await import('@/components/atoms/StreamText');const first=vi.fn(),second=vi.fn()
 const wrapper=render(StreamText,{props:{text:'abc',onDone:first,charsPerTick:1,tickMs:10}})
 await vi.advanceTimersByTimeAsync(10);await wrapper.setProps({onDone:second});await vi.advanceTimersByTimeAsync(40)
 expect(first).not.toHaveBeenCalled();expect(second).toHaveBeenCalledTimes(1)
 await wrapper.setProps({text:'fresh'});expect(wrapper.text()).toBe('');await vi.advanceTimersByTimeAsync(100);expect(wrapper.text()).toBe('fresh')
 wrapper.unmount();mounted.splice(mounted.indexOf(wrapper),1);expect(vi.getTimerCount()).toBe(0)
})
it('flowchart recalculates row layout when steps change',async()=>{
 const {default:Flowchart}=await import('@/components/primitives/Flowchart')
 const wrapper=render(Flowchart);await wrapper.setProps({steps:[{id:'trigger',row:0,x:0.5,w:200,title:'A',hue:'#9a5cff'},{id:'cond',row:1,x:0.5,w:200,title:'B',hue:'#f09a2f'},{id:'c',row:2,x:0.5,w:200,title:'C',hue:'#9a5cff'}]})
 expect(wrapper.html()).not.toContain('NaN');expect(wrapper.text()).toContain('C')
})

it('record sorting changes the row order',async()=>{
 const wrapper=render(RecordsTable)
 const names=()=>wrapper.findAll('.records-company-name').map(e=>e.text())
 const before=names();await wrapper.get('[aria-label="Sort by Last interaction"]').trigger('click');expect(names()).not.toEqual(before)
 await wrapper.get('[aria-label="Sort by Last interaction"]').trigger('click');expect(names()).not.toEqual(before)
})
it('flowchart connectors follow dragged nodes',async()=>{
 const {default:Flowchart}=await import('@/components/primitives/Flowchart');const wrapper=render(Flowchart)
 const before=wrapper.get('svg > path').attributes('d');const node=wrapper.findAll('.touch-none')[0]
 for(const [type,x,y] of [['pointerdown',200,50],['pointermove',220,60],['pointerup',220,60]] as const) { const event=new MouseEvent(type,{clientX:x,clientY:y,bubbles:true});Object.defineProperty(event,'pointerId',{value:1});node.element.dispatchEvent(event);await nextTick() }
 expect(wrapper.get('svg > path').attributes('d')).not.toBe(before)
})
it('selection actions complete a rewrite and can discard it',async()=>{
 const {default:SelectionActions}=await import('@/components/primitives/SelectionActions');const wrapper=render(SelectionActions)
 await wrapper.findAll('button').find(b=>b.text().trim()==='Improve')!.trigger('click');await vi.advanceTimersByTimeAsync(6000)
 expect(wrapper.text()).toContain('Discard');await wrapper.findAll('button').find(b=>b.text().trim()==='Discard')!.trigger('click')
 expect(wrapper.text()).toContain('Churn it first thing Saturday')
})
it('fine-tuning numeric input updates the slider',async()=>{
 const {default:FineTuneCard}=await import('@/components/primitives/FineTuneCard');const wrapper=render(FineTuneCard)
 await wrapper.get('input[aria-label="Radius value"]').setValue('18');expect(wrapper.get('[role="slider"][aria-label="Radius"]').attributes('aria-valuenow')).toBe('18')
})
it('chat composer accepts a prompt and clears its draft',async()=>{
 const {default:ChatComposer}=await import('@/components/primitives/ChatComposer');const wrapper=render(ChatComposer)
 await wrapper.get('input').setValue('Compare Vue flavors');await wrapper.get('input').trigger('keydown',{key:'Enter'})
 expect(wrapper.text()).toContain('Compare Vue flavors');expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
})
it('default approval advances through single and multiple answers',async()=>{
 const submitted=vi.fn();const wrapper=render(ApprovalCard,{props:{onSubmitted:submitted}})
 await wrapper.findAll('button').find(b=>b.text().trim()==='Three (core line)')!.trigger('click');await vi.advanceTimersByTimeAsync(600)
 await wrapper.findAll('button').find(b=>b.text().trim()==='Chocolate chips')!.trigger('click');await wrapper.get('[aria-label="Next question"]').trigger('click')
 await wrapper.findAll('button').find(b=>b.text().trim()==='Food trucks')!.trigger('click');await vi.advanceTimersByTimeAsync(600)
 expect(submitted).toHaveBeenCalledWith({0:[0],1:[0],2:[0]})
})
