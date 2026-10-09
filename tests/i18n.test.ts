import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { locale, setLocale, t } from '@/lib/i18n'
import { REGISTRY } from '@/lib/registry'
import { META } from '@/lib/meta'
import LanguageToggle from '@/components/site/LanguageToggle'
import Gallery from '@/pages/GalleryPage'
import Harness from '@/components/site/IceCreamHarness'
import SearchList from '@/components/primitives/SearchList'
import SidebarNav from '@/components/primitives/SidebarNav'
import ChatComposer from '@/components/primitives/ChatComposer'
import PromptBar from '@/components/primitives/PromptBar'
import ApprovalCard from '@/components/primitives/ApprovalCard'
import RecordsTable from '@/components/primitives/RecordsTable'
import StreamingText from '@/components/primitives/StreamingText'
import CodeBlock from '@/components/primitives/CodeBlock'
import SelectionActions from '@/components/primitives/SelectionActions'

const mounted: VueWrapper[] = []
function render(component: Parameters<typeof mount>[0], options: Parameters<typeof mount>[1] = {}) {
  const wrapper = mount(component, { attachTo: document.body, ...options })
  mounted.push(wrapper)
  return wrapper
}
function button(wrapper: VueWrapper, text: string) {
  const match = wrapper.findAll('button').find(b => b.text().trim() === text)
  expect(match, `Missing button: ${text}`).toBeDefined()
  return match!
}
beforeEach(() => { vi.useFakeTimers(); setLocale('zh-CN') })
afterEach(() => {
  mounted.splice(0).forEach(w => w.unmount())
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks()
  setLocale('en'); localStorage.removeItem('bui-locale'); document.body.innerHTML = ''
})

it('switches and persists language without failing when storage is unavailable', async () => {
  const wrapper = render(LanguageToggle)
  expect(button(wrapper, '中文').attributes('aria-pressed')).toBe('true')
  await button(wrapper, 'EN').trigger('click')
  expect(locale.value).toBe('en'); expect(localStorage.getItem('bui-locale')).toBe('en')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  await button(wrapper, '中文').trigger('click')
  expect(locale.value).toBe('zh-CN')
  expect(t('promptBar.remove0', ['report.csv'])).toBe('移除report.csv')
})

describe('Chinese gallery and every variant', () => {
  for (const entry of REGISTRY) for (const variant of entry.variants ?? ['Default']) {
    it(`${entry.id}: ${variant} supports live language switching`, async () => {
      const wrapper = render(entry.Demo, { props: variant === 'Default' ? {} : { variant } })
      await vi.advanceTimersByTimeAsync(1200)
      if (entry.id !== 'code-block' || variant !== 'Diff') expect(wrapper.text()).toMatch(/[\u4e00-\u9fff]/)
      expect(wrapper.html()).not.toContain('[object Object]')
      setLocale('en'); await nextTick()
      expect(wrapper.text()).not.toMatch(/[\u4e00-\u9fff]/)
      setLocale('zh-CN'); await nextTick()
      if (entry.id !== 'code-block' || variant !== 'Diff') expect(wrapper.text()).toMatch(/[\u4e00-\u9fff]/)
    })
  }
})

it('translates all gallery headings, preserves component IDs and the chosen variant', async () => {
  const wrapper = render(Gallery, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } })
  for (const entry of META) {
    expect(wrapper.get(`#${entry.id} h3`).text()).toBe(entry.title)
    expect(entry.caption).toMatch(/[\u4e00-\u9fff]/)
  }
  await wrapper.get('#loading-state').findAll('button').find(b => b.text() === '轨道')!.trigger('click')
  await button(wrapper, 'EN').trigger('click')
  expect(wrapper.get('#loading-state').findAll('button').find(b => b.text() === 'Orbit')!.classes()).toContain('bg-surface')
  expect(wrapper.get('h1').text()).toContain('AI-native')
})

it('searches Chinese labels and shows an empty state for a single unmatched character', async () => {
  const wrapper = render(SearchList)
  await wrapper.get('input').setValue('甜筒')
  expect(wrapper.text()).toContain('查找华夫甜筒供应商')
  expect(wrapper.text()).not.toContain('预测夏季需求')
  await button(wrapper, '查找华夫甜筒供应商').trigger('click')
  expect((wrapper.get('input').element as HTMLInputElement).value).toBe('查找华夫甜筒供应商')
  await wrapper.get('input').setValue('锆')
  expect(wrapper.text()).toContain('没有找到结果')
})

it('searches translated sidebar labels without changing scenario IDs', async () => {
  const picked = vi.fn(); const wrapper = render(SidebarNav, { props: { onPick: picked } })
  await wrapper.get('[aria-label="搜索聊天"]').trigger('click')
  await wrapper.get('input').setValue('供应商')
  await button(wrapper, '供应商记录').trigger('click')
  expect(picked).toHaveBeenCalledWith('suppliers', '供应商记录', undefined)
})

it('preserves table selections, sorting and open menus while switching language', async () => {
  const wrapper = render(RecordsTable)
  await wrapper.get('input[aria-label="选择所有公司"]').setValue(true)
  await wrapper.get('[aria-label="按最近互动排序"]').trigger('click')
  await wrapper.get('[aria-label="表格选项"]').trigger('click')
  const names = wrapper.findAll('.records-company-name').map(e => e.text())
  expect(wrapper.text()).toContain('4 天前')
  expect(wrapper.text()).not.toContain('days ago')
  setLocale('en'); await nextTick()
  expect(wrapper.findAll('.records-company-name').map(e => e.text())).toEqual(names)
  expect((wrapper.get('input[aria-label="Select all companies"]').element as HTMLInputElement).checked).toBe(true)
  expect(wrapper.text()).toContain('Reset column widths')
})

it('streams complete Chinese sentences without inserting spaces or translating custom tokens', async () => {
  const wrapper = render(StreamingText, { props: { loop: false } })
  await vi.advanceTimersByTimeAsync(10000)
  expect(wrapper.get('p').text()).toContain('开心果是增长最快的口味，本月销量增长 23%')
  const custom = render(StreamingText, { props: { loop: false, content: [{ text: 'Search' }, { text: 'world' }] } })
  await vi.advanceTimersByTimeAsync(1000)
  expect(custom.get('p').text()).toBe('Search world')
})

it('preserves literal source code and clipboard contents in Chinese', async () => {
  const code = 'const label = "Search"; // Keep this source literal'
  const wrapper = render(CodeBlock, { props: { code, lines: [code] } })
  expect(wrapper.text()).toContain(code)
  await wrapper.get('[aria-label="复制代码"]').trigger('click')
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code)
})

it('translates the selected passage and its streamed rewrite', async () => {
  const wrapper = render(SelectionActions)
  expect(wrapper.text()).toContain('周六一早就开始制作')
  await button(wrapper, '润色').trigger('click')
  await vi.advanceTimersByTimeAsync(6000)
  expect(wrapper.text()).toContain('周六一早制作开心果冰淇淋')
})

it('does not send a chat prompt or advance approval while committing IME input', async () => {
  const send = vi.fn(); const chat = render(ChatComposer, { props: { onSend: send } })
  await chat.get('input').setValue('Search')
  await chat.get('input').trigger('keydown', { key: 'Enter', isComposing: true })
  expect(send).not.toHaveBeenCalled()
  await chat.get('input').trigger('keydown', { key: 'Enter', keyCode: 229 })
  expect(send).not.toHaveBeenCalled()
  await chat.get('input').trigger('keydown', { key: 'Enter' })
  expect(send).toHaveBeenCalledWith('Search')
  expect(chat.text()).toContain('Search')
  const approval = render(ApprovalCard)
  await approval.get('input').setValue('自定义口味')
  await approval.get('input').trigger('keydown', { key: 'Enter', isComposing: true })
  expect(approval.text()).toContain('我们应该推出多少种口味？')
  expect((approval.get('input').element as HTMLInputElement).value).toBe('自定义口味')
  setLocale('en'); await nextTick()
  expect((approval.get('input').element as HTMLInputElement).value).toBe('自定义口味')
})

it('does not pick a source menu item while committing IME input', async () => {
  const wrapper = render(PromptBar, { props: { demo: false } })
  await wrapper.get('textarea').setValue('@')
  await wrapper.get('textarea').trigger('keydown', { key: 'Enter', isComposing: true })
  expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('@')
  await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
  expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).not.toBe('@')
})

const scenarios = [
  ['帮我申诉停车罚单', 'PA-6621'],
  ['今天上午的紧急待办', '有三件事需要及时处理'],
  ['整理工作量摘要', '开心果'],
  ['停用供应商前需要审批', '归档供应商前'],
  ['查找口味页面改版工单', '找到了口味页面改版工单'],
  ['查看供应商记录', '表格在左侧'],
  ['编写批量补货函数', '重新构建并验证'],
  ['口味列表的修改建议', '建议菜单调整'],
  ['精简发布说明', '周六一早'],
  ['审核计划并放跑酷视频', '全部完成'],
]
for (const [prompt, expected] of scenarios) it(`Chinese harness: ${prompt}`, async () => {
  const wrapper = render(Harness)
  await vi.advanceTimersByTimeAsync(1500)
  await wrapper.get('textarea').setValue(prompt)
  await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
  await vi.advanceTimersByTimeAsync(24000)
  expect(wrapper.text()).toContain(expected)
  expect(wrapper.text()).toContain(prompt)
  expect(wrapper.findAll('[aria-label="关闭标签页"]')).toHaveLength(1)
  await wrapper.get('textarea').setValue('保留我的草稿')
  await button(wrapper, 'EN').trigger('click')
  expect(wrapper.text()).toContain(prompt)
  expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('保留我的草稿')
  expect(wrapper.findAll('[aria-label="Close tab"]')).toHaveLength(1)
})

it('filters and selects Chinese @ sources using Unicode input', async () => {
  const wrapper = render(PromptBar, { props: { demo: false } })
  await wrapper.get('textarea').setValue('@口味')
  expect(wrapper.text()).toContain('口味记录')
  expect(wrapper.text()).not.toContain('读取和管理 Gmail')
  await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
  expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('@口味记录 ')
})

it('localizes the workspace inspector and preserves its settings when switching', async () => {
  const wrapper = render(Harness)
  await vi.advanceTimersByTimeAsync(1500)
  await wrapper.get('textarea').setValue('查看供应商记录')
  await wrapper.get('textarea').trigger('keydown', { key: 'Enter' })
  await vi.advanceTimersByTimeAsync(5000)
  await button(wrapper, '意式冰淇淋17').trigger('click')
  expect(wrapper.text()).toContain('意式冰淇淋供应商')
  const toggle = wrapper.get('[role="switch"][aria-label="来源核验"]')
  await toggle.trigger('click')
  expect(toggle.attributes('aria-checked')).toBe('true')
  await button(wrapper, 'EN').trigger('click')
  expect(wrapper.text()).toContain('Gelato suppliers')
  expect(wrapper.get('[role="switch"][aria-label="Grounding"]').attributes('aria-checked')).toBe('true')
})
