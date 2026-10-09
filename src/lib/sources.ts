import { META } from './meta'
const files = import.meta.glob('../components/primitives/*.tsx', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
export const SOURCES = Object.fromEntries(META.map(entry => [entry.id, files[`../components/primitives/${entry.file}`]]))
