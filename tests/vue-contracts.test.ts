import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, ref, type Component } from 'vue'
import { Switch } from '@/components/atoms/Switch'
import { Button } from '@/components/atoms/Button'
import { StreamText } from '@/components/atoms/StreamText'
import { StatusPill } from '@/components/atoms/StatusPill'
import PromptBar from '@/components/primitives/PromptBar'
import SidebarNav from '@/components/primitives/SidebarNav'
import RecordsTable from '@/components/primitives/RecordsTable'
import StreamingText from '@/components/primitives/StreamingText'
import ApprovalCard from '@/components/primitives/ApprovalCard'
import { Liveline } from '@/components/charts/Liveline'

const mounted: VueWrapper[] = []
function template(components: Record<string, Component>, source: string, setup = () => ({})) {
  const wrapper = mount(defineComponent({ components, setup, template: source }), { attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks()
  document.body.innerHTML = ''
})

it('Vue template bare checked enables a switch and emits its next value', async () => {
  const change = vi.fn()
  const wrapper = template({ Switch }, '<Switch checked :onChange="change" />', () => ({ change }))
  expect(wrapper.get('button').attributes('aria-checked')).toBe('true')
  await wrapper.get('button').trigger('click')
  expect(change).toHaveBeenCalledWith(false)
})
it('Vue template checked remains controlled when explicitly false or updated', async () => {
  const checked = ref(false)
  const wrapper = template({ Switch }, '<Switch :checked="checked" :onChange="change" />', () => ({ checked, change: (next: boolean) => { checked.value = next } }))
  expect(wrapper.get('button').attributes('aria-checked')).toBe('false')
  await wrapper.get('button').trigger('click')
  expect(wrapper.get('button').attributes('aria-checked')).toBe('true')
})
it('Vue template bare tall enables hero sizing while explicit false keeps compact sizing', () => {
  const hero = template({ PromptBar }, '<PromptBar :demo="false" tall />')
  const compact = template({ PromptBar }, '<PromptBar :demo="false" :tall="false" />')
  expect(hero.get('textarea').classes()).toContain('min-h-[68px]')
  expect(compact.get('textarea').classes()).toContain('min-h-7')
})
for (const [name, component, selector, fillClass] of [
  ['SidebarNav', SidebarNav, 'aside', 'h-full'],
  ['RecordsTable', RecordsTable, '.records-shell', 'is-fill'],
  ['StreamingText', StreamingText, 'div', 'w-full'],
] as const) it(`Vue template bare fill is true for ${name}`, () => {
  const wrapper = template({ [name]: component }, `<${name} fill />`)
  expect(wrapper.findComponent(component).props('fill')).toBe(true)
  expect(wrapper.get(selector).classes()).toContain(fillClass)
})
it('omitted and bare flags preserve default-on demo, caret and status dot', async () => {
  const prompt = template({ PromptBar }, '<PromptBar />')
  const barePrompt = template({ PromptBar }, '<PromptBar demo />')
  const stream = template({ StreamText }, '<StreamText text="Ready" />')
  const status = template({ StatusPill }, '<StatusPill>Ready</StatusPill>')
  const bareStream = template({ StreamText }, '<StreamText text="Ready" caret />')
  const bareStatus = template({ StatusPill }, '<StatusPill dot>Ready</StatusPill>')
  await vi.advanceTimersByTimeAsync(1150)
  expect((prompt.get('textarea').element as HTMLTextAreaElement).value).toBe('@')
  expect((barePrompt.get('textarea').element as HTMLTextAreaElement).value).toBe('@')
  expect(bareStream.find('.stream-caret').exists()).toBe(true)
  expect(bareStatus.find('[class~="size-1.5"]').exists()).toBe(true)
  expect(stream.find('.stream-caret').exists()).toBe(true)
  expect(status.find('[class~="size-1.5"]').exists()).toBe(true)
})
it('explicit false still disables the default-on caret and status dot', () => {
  const stream = template({ StreamText }, '<StreamText text="Ready" :caret="false" />')
  const status = template({ StatusPill }, '<StatusPill :dot="false">Ready</StatusPill>')
  expect(stream.find('.stream-caret').exists()).toBe(false)
  expect(status.find('[class~="size-1.5"]').exists()).toBe(false)
})
it('approval remains resettable by default and with a bare attribute', async () => {
  const questions = [{ title: 'Flavor?', type: 'radio', options: ['Vanilla'] }]
  for (const attribute of ['', 'resettable', ':resettable="false"']) {
    const wrapper = template({ ApprovalCard }, `<ApprovalCard :questions="questions" ${attribute} />`, () => ({ questions }))
    await wrapper.findAll('button').find(button => button.text() === 'Vanilla')!.trigger('click')
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.text().includes('Start over')).toBe(attribute !== ':resettable="false"')
  }
})
it('Boolean-or-string and Boolean-or-object chart props retain non-Boolean values', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const options = { scale: 2, downMomentum: true }
  const wrapper = template({ Liveline }, '<Liveline :data="[]" :value="0" momentum="down" :degen="options" paused grid />', () => ({ options }))
  const chart = wrapper.findComponent(Liveline)
  expect(chart.props('momentum')).toBe('down')
  expect(chart.props('degen')).toEqual(options)
  expect(chart.props('paused')).toBe(true)
  expect(chart.props('grid')).toBe(true)
  expect(warning).not.toHaveBeenCalled()
})
it('bare chart union flags cast true and omitted default-on flags stay undefined', () => {
  const bare = template({ Liveline }, '<Liveline :data="[]" :value="0" momentum degen />').findComponent(Liveline)
  const omitted = template({ Liveline }, '<Liveline :data="[]" :value="0" />').findComponent(Liveline)
  expect(bare.props('momentum')).toBe(true)
  expect(bare.props('degen')).toBe(true)
  expect(omitted.props('grid')).toBeUndefined()
  expect(omitted.props('badge')).toBeUndefined()
  expect(omitted.props('scrub')).toBeUndefined()
})
it('Vue template bare disabled keeps the native button disabled', async () => {
  const click = vi.fn()
  const wrapper = template({ Button }, '<Button disabled :onClick="click">Approve</Button>', () => ({ click }))
  expect((wrapper.get('button').element as HTMLButtonElement).disabled).toBe(true)
  await wrapper.get('button').trigger('click')
  expect(click).not.toHaveBeenCalled()
})
for (const event of ['pointerdown', 'keydown']) it(`${event} takeover clears the demo draft once and preserves manual input`, async () => {
  const send = vi.fn()
  const wrapper = template({ PromptBar }, '<PromptBar :onSend="send" />', () => ({ send }))
  const input = wrapper.get('textarea')
  await vi.advanceTimersByTimeAsync(1150)
  expect((input.element as HTMLTextAreaElement).value).toBe('@')
  await input.trigger(event, event === 'keydown' ? { key: 'ArrowRight' } : {})
  expect((input.element as HTMLTextAreaElement).value).toBe('')
  await input.setValue('My own prompt')
  await input.trigger('pointerdown')
  await vi.advanceTimersByTimeAsync(3000)
  expect((input.element as HTMLTextAreaElement).value).toBe('My own prompt')
  await input.trigger('keydown', { key: 'Enter' })
  expect(send).toHaveBeenCalledWith('My own prompt')
})
