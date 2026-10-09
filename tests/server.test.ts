// @vitest-environment node
import {afterAll,beforeAll,it,expect,vi} from 'vitest'
import {createAppServer} from '../server/index.mjs'
let server:ReturnType<typeof createAppServer>,origin:string
beforeAll(async()=>{server=createAppServer({apiKey:'test-only',fetchImpl:vi.fn().mockResolvedValue(Response.json({id:'test'}))});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`})
afterAll(async()=>{await new Promise<void>(resolve=>server.close(resolve))})
it('serves deep links and reports missing assets instead of returning index.html',async()=>{
 for(const path of ['/','/harness','/license']){const r=await fetch(origin+path);expect(r.status).toBe(200);expect(r.headers.get('content-type')).toContain('text/html')}
 expect((await fetch(origin+'/missing.js')).status).toBe(404)
 expect((await fetch(origin+'/r/agent-screen.json')).headers.get('content-type')).toBe('application/json')
})
it('bridges real HTTP subscription requests to the isolated backend',async()=>{
 const r=await fetch(origin+'/api/subscribe',{method:'POST',body:JSON.stringify({email:'test@example.com'})});expect(r.status).toBe(200);expect(await r.json()).toEqual({ok:true,stored:true})
 expect((await fetch(origin+'/api/subscribe',{method:'POST',body:'{'})).status).toBe(400)
 expect((await fetch(origin+'/api/subscribe')).status).toBe(405)
})
it('rejects oversized bodies',async()=>{expect((await fetch(origin+'/api/subscribe',{method:'POST',body:'x'.repeat(8193)})).status).toBe(413)})
