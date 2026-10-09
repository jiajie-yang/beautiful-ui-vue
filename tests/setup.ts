import { vi } from 'vitest'
if (typeof window !== "undefined") Object.defineProperty(window, 'matchMedia', { value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })), configurable: true })
class Observer { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', Observer)
vi.stubGlobal('IntersectionObserver', Observer)
if (typeof window !== "undefined") {
HTMLElement.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.scrollTo = vi.fn()
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()
HTMLElement.prototype.animate = vi.fn(() => ({ cancel: vi.fn(), playState:'finished', onfinish:null })) as never
HTMLCanvasElement.prototype.getContext = vi.fn(() => null)
Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => undefined) }, configurable:true })
}
vi.mock('@/vendor/glimm', () => ({ createShader: vi.fn(() => ({ destroy: vi.fn() })), playSweep: vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() })), accentChain: vi.fn(() => []), ACCENTS: { red: [], orange: [], yellow: [], green: [], cyan: [], blue: [], purple: [] } }))
vi.mock('@/vendor/audio', () => ({ defineSound:vi.fn(()=>vi.fn()),ensureReady:vi.fn(),setMasterVolume:vi.fn() }))
