import { readFile, writeFile, mkdir, readdir, access, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import ts from 'typescript';
const root = resolve(import.meta.dirname, '..');
const metaSource = await readFile(resolve(root,'src/lib/meta.ts'),'utf8');
const { META } = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(metaSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64')}`);
const output = resolve(root,'public/r'); await mkdir(output,{recursive:true});
const exists = async p => { try { await access(p); return true; } catch { return false; } };
async function locate(spec, file) {
  if (!spec.startsWith('@/') && !spec.startsWith('.')) return null;
  const path = spec.startsWith('@/') ? resolve(root,'src',spec.slice(2)) : resolve(dirname(file),spec);
  for (const candidate of [path, ...['.tsx','.ts','.js','.vue','/index.ts'].map(ext=>path+ext)]) if(await exists(candidate) && (await stat(candidate)).isFile()) return candidate;
  throw Error(`Missing ${spec} in ${relative(root,file)}`);
}
export async function collect(entry) {
  const files = new Map(), dependencies = new Set(['vue']);
  async function visit(file) {
    if(files.has(file))return;
    let content = await readFile(file,'utf8');
    if (file.endsWith('/AgentScreen.tsx')) content = content.replace('const PLACEHOLDER = "/agent-desktop.webp";', `const PLACEHOLDER = "data:image/webp;base64,${(await readFile(resolve(root,'public/agent-desktop.webp'))).toString('base64')}";`);
    if (/LICENSE|NOTICE/.test(file)) content = `/*\n${content}\n*/\n`;
    files.set(file,content);
    const imports = /\.[cm]?[jt]sx?$/.test(file) ? ts.preProcessFile(content, true, true).importedFiles.map(entry=>entry.fileName)
      : file.endsWith('.css') ? [...content.matchAll(/@(?:import|plugin)\s*["']([^"']+)["']/g)].map(match=>match[1]) : [];
    for(const spec of imports) {
      const local=await locate(spec,file);
      if(local)await visit(local);
      else if(!spec.startsWith('node:'))dependencies.add(spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0]);
    }
    if(file.endsWith('.js') && await exists(file.slice(0,-3)+'.d.ts'))await visit(file.slice(0,-3)+'.d.ts');
  }
  await visit(resolve(root,entry));
  await visit(resolve(root,'src/styles/globals.css'));
  await visit(resolve(root,'src/styles/site.css'));
  await visit(resolve(root,'LICENSE'));
  for(const file of [...files.keys()]) {
    const folder=dirname(file);
    for(const license of ['LICENSE','glimm-LICENSE','audio-LICENSE','glimm-NOTICE.md','audio-NOTICE.md']) if(await exists(resolve(folder,license)))await visit(resolve(folder,license));
  }
  return { files:[...files].map(([path,content])=>({ path:relative(root,path)+(path.endsWith('LICENSE')?'.md':''), target:'~/'+relative(root,path)+(path.endsWith('LICENSE')?'.md':''), type:path.endsWith('.css')?'registry:style':path.includes('/components/')?'registry:component':'registry:lib', content })), dependencies:[...dependencies].sort() };
}
const entries=[...META.map(e=>({...e,path:`src/components/primitives/${e.file}`}))];
for(const file of await readdir(resolve(root,'src/components/atoms')))if(file.endsWith('.tsx')) entries.push({id:file.slice(0,-4).replace(/[A-Z]/g,(s,i)=>(i?'-':'')+s.toLowerCase()),title:file.slice(0,-4),path:`src/components/atoms/${file}`});
entries.push({id:'glide-menu',title:'Glide Menu',path:'src/components/primitives/GlideMenu.tsx'});
const items=[];
for(const entry of entries){
 const collected=await collect(entry.path);
 const item={$schema:'https://shadcn-vue.com/schema/registry-item.json',name:entry.id,title:entry.title,type:'registry:component',description:entry.caption??entry.title,...collected};
 items.push(item);await writeFile(resolve(output,entry.id+'.json'),JSON.stringify(item,null,2)+'\n');
}
await writeFile(resolve(output,'index.json'),JSON.stringify({$schema:'https://shadcn-vue.com/schema/registry.json',name:'beautiful-ui-vue',homepage:process.env.REGISTRY_BASE_URL??'',items},null,2)+'\n');
await writeFile(resolve(root,'public/foundation.css'),await readFile(resolve(root,'src/styles/globals.css')));
console.log(`Generated ${items.length} independent Vue registry items (including transitive dependencies).`);
