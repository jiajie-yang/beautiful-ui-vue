// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { subscribe } from '../server/subscribe.mjs'
const request=(body:unknown)=>new Request('http://localhost/api/subscribe',{method:'POST',body:typeof body==='string'?body:JSON.stringify(body)})
describe('subscription API',()=>{
 it('rejects malformed JSON and invalid addresses before contacting Resend',async()=>{
  const fetchImpl=vi.fn();expect((await subscribe(request('{'),{fetchImpl})).status).toBe(400)
  for(const body of [null,{}, {email:'bad'}, {email:'a b@example.com'}])expect((await subscribe(request(body),{fetchImpl})).status).toBe(400)
  expect(fetchImpl).not.toHaveBeenCalled()
 })
 it('returns 503 when the server secret is absent',async()=>{expect((await subscribe(request({email:'test@example.com'}),{apiKey:''})).status).toBe(503)})
 it('normalizes an address and stores a new contact',async()=>{
  const fetchImpl=vi.fn().mockResolvedValue(Response.json({id:'mock'}))
  const response=await subscribe(request({email:' Test@Example.COM '}),{apiKey:'test-only',fetchImpl})
  expect(await response.json()).toEqual({ok:true,stored:true})
  expect(fetchImpl.mock.calls[0][1].body).toBe(JSON.stringify({email:'test@example.com',unsubscribed:false}))
 })
 it('confirms duplicates without overwriting unsubscribe status',async()=>{
  const fetchImpl=vi.fn().mockResolvedValueOnce(new Response('',{status:409})).mockResolvedValueOnce(Response.json({unsubscribed:true}))
  expect(await (await subscribe(request({email:'test@example.com'}),{apiKey:'test-only',fetchImpl})).json()).toEqual({ok:true,stored:true,existing:true})
  expect(fetchImpl.mock.calls[1][1].method).toBeUndefined()
 })
 it('returns a controlled upstream failure for API and network errors',async()=>{
  for(const fetchImpl of [vi.fn().mockResolvedValue(new Response('',{status:401})),vi.fn().mockRejectedValue(Error('network'))])
   expect((await subscribe(request({email:'test@example.com'}),{apiKey:'test-only',fetchImpl})).status).toBe(502)
 })
 it('rejects unsupported methods',async()=>{const response=await subscribe(new Request('http://localhost'));expect(response.status).toBe(405);expect(response.headers.get('allow')).toBe('POST')})
})
