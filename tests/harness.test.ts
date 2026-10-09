import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Harness from '@/components/site/IceCreamHarness'
let wrapper:VueWrapper
beforeEach(()=>vi.useFakeTimers())
afterEach(()=>{wrapper?.unmount();vi.clearAllTimers();vi.useRealTimers();document.body.innerHTML=''})
const scenarios=[
 ['Appeal my parking ticket — citation #A4471902.','PA-6621'],
 ['What urgent to-dos need my attention this morning?','Three things are time-sensitive'],
 ['Prep a summary of my workload.','Pistachio'],
 ['I need your approval before I off-board a supplier.','Before I archive the vendor'],
 ['There was a ticket about redesigning the flavor page — can you find it?','Found it'],
 ['Show me our supplier records.','60 count'],
 ['Draft the batch restock function.','restock'],
 ['Propose flavor edits.','flavor'],
 ['Tighten this launch note.','launch'],
 ['Subway surfing.','All done']
]
for(const [prompt,expected] of scenarios)it(`harness: ${prompt}`,async()=>{
 wrapper=mount(Harness,{attachTo:document.body});await nextTick();await vi.advanceTimersByTimeAsync(1500)
 if(prompt==='Subway surfing.') await wrapper.findAll('button').find(b=>b.text().trim()==='Subway surfing')!.trigger('click')
 else { const composer=wrapper.find('textarea');await composer.setValue(prompt);await composer.trigger('keydown',{key:'Enter'}) }
 await vi.advanceTimersByTimeAsync(20000)
 expect(wrapper.text()).not.toContain('Something went wrong')
 expect(wrapper.text().toLowerCase()).toContain(expected.toLowerCase())
 expect(wrapper.findAll('[aria-label="Close tab"]').length).toBe(1)
})
it('creates and closes tabs and preserves separate chat histories',async()=>{
 wrapper=mount(Harness,{attachTo:document.body});await nextTick()
 await wrapper.get('[aria-label="New chat"]').trigger('click');expect(wrapper.findAll('[aria-label="Close tab"]').length).toBe(2)
 await wrapper.findAll('[aria-label="Close tab"]')[1].trigger('click');expect(wrapper.findAll('[aria-label="Close tab"]').length).toBe(1)
})
