// @vitest-environment node
import {readFile,readdir} from 'node:fs/promises'
import {expect,it} from 'vitest'
it('all registry items include every local import and exclude React dependencies',async()=>{
 const dir=new URL('../public/r/',import.meta.url),items=(await readdir(dir)).filter(name=>name!=='index.json'&&name.endsWith('.json'))
 expect(items).toHaveLength(33)
 for(const name of items){
  const item=JSON.parse(await readFile(new URL(name,dir),'utf8'))
  for(const dependency of item.dependencies) expect(dependency).toMatch(/^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+(?:@\^?\d+\.\d+\.\d+)?$/i)
  expect(item.dependencies).not.toEqual(expect.arrayContaining(['react','react-dom','next']))
  const paths=new Set(item.files.map((f:{target:string})=>f.target.replace(/^~\//,'')))
  for(const file of item.files){
   expect(file.target).not.toContain('..')
   for(const match of file.content.matchAll(/from\s*["'](@\/[^"']+)["']/g)){
    const spec='src/'+match[1].slice(2)
    expect([spec,spec+'.ts',spec+'.tsx',spec+'.js',spec+'/index.ts'].some(p=>paths.has(p)),`${name}: ${spec}`).toBe(true)
   }
  }
  expect(paths.has('src/styles/globals.css')).toBe(true)
  expect(paths.has('LICENSE.md')).toBe(true)
 }
 const agent=JSON.parse(await readFile(new URL('agent-screen.json',dir),'utf8'))
 expect(agent.files[0].content).toContain('data:image/webp;base64,')
})
