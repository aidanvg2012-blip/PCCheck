const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/live-part-prices.js');
function recorder(){return{code:200,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};}
async function call({method='POST',authorization='Bearer user-token',body,fetchStub,key='ash_test_key'}={}){
 const originalFetch=global.fetch,saved={...process.env};
 process.env.APISH_API_KEY=key;process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='service-role';process.env.STRIPE_MODE='test';global.fetch=fetchStub||(async()=>{throw new Error('Unexpected fetch');});
 const req={method,headers:authorization?{authorization}:{},body},res=recorder();
 try{await handler(req,res);return res;}finally{global.fetch=originalFetch;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);}
}
function freeUserFetch(url){
 const u=String(url);
 if(u.includes('/auth/v1/user'))return Response.json({id:'user-1'});
 if(u.includes('/rest/v1/subscriptions'))return Response.json([]);
 if(u.includes('/rest/v1/build_finder_trials'))return Response.json([{used_count:0}]);
 if(u.includes('/products?')){const parsed=new URL(u);assert.equal(parsed.searchParams.get('category'),'cpu');return Response.json({products:[{id:'cpu-1',name:'AMD Ryzen 5 7600 3.8 GHz 6-Core Processor'}],credits_used:1});}
 if(u.includes('/product?'))return Response.json({name:'AMD Ryzen 5 7600',url:'https://pcpartpicker.com/product/cpu-1',fetched_at:'2026-11-17T18:00:00Z',cached:false,credits_used:1,prices:[
  {merchant:'Retailer B',base:199.99,total:199.99,total_text:'$199.99',availability:'In stock',shipping:'+FREE s/h',url:'https://retailer-b.example/item'},
  {merchant:'Retailer A',base:209.99,total:209.99,total_text:'$209.99',availability:'In stock',url:'https://retailer-a.example/item'},
  {merchant:'Out of stock shop',base:150,total:150,availability:'Out of stock',url:'https://soldout.example/item'}
 ]});
 throw new Error('Unexpected URL '+u);
}
test('GET reports provider configuration without exposing the key',async()=>{const res=await call({method:'GET',fetchStub:async()=>{}});assert.equal(res.code,200);assert.equal(res.body.configured,true);assert.equal(JSON.stringify(res.body).includes('ash_test_key'),false);});
test('live lookup requires a signed-in account',async()=>{const res=await call({authorization:'',fetchStub:async()=>{throw new Error('Should not fetch');}});assert.equal(res.code,401);});
test('live lookup returns exact-model retailer offers sorted by current price',async()=>{const res=await call({body:{parts:[{key:'cpu:7600',category:'cpu',name:'AMD Ryzen 5 7600'}]},fetchStub:freeUserFetch});assert.equal(res.code,200);const match=res.body.matches['cpu:7600'];assert.equal(match.found,true);assert.equal(match.lowestPrice,199.99);assert.equal(match.lowestRetailer,'Retailer B');assert.equal(match.offers.length,2);assert.equal(match.offers[0].merchant,'Retailer B');});
test('live lookup does not assign a price to a near-but-not-exact model',async()=>{const res=await call({body:{parts:[{key:'cpu:7600',category:'cpu',name:'AMD Ryzen 5 7600'}]},fetchStub:async url=>{const u=String(url);if(u.includes('/auth/v1/user'))return Response.json({id:'user-1'});if(u.includes('/rest/v1/subscriptions'))return Response.json([]);if(u.includes('/rest/v1/build_finder_trials'))return Response.json([{used_count:0}]);return Response.json({products:[{id:'cpu-x',name:'AMD Ryzen 5 7600X'}]});}});assert.equal(res.code,200);assert.equal(res.body.matches['cpu:7600'].found,false);assert.equal(res.body.matches['cpu:7600'].lowestPrice,undefined);});
test('live lookup blocks free accounts after their one review is used',async()=>{const res=await call({body:{parts:[{key:'cpu:7600',category:'cpu',name:'AMD Ryzen 5 7600'}]},fetchStub:async url=>{const u=String(url);if(u.includes('/auth/v1/user'))return Response.json({id:'user-1'});if(u.includes('/rest/v1/subscriptions'))return Response.json([]);if(u.includes('/rest/v1/build_finder_trials'))return Response.json([{used_count:1}]);throw new Error('Provider must not be called');}});assert.equal(res.code,403);});
test('live lookup validates part categories',async()=>{const res=await call({body:{parts:[{key:'x',category:'unknown',name:'bad'}]},fetchStub:freeUserFetch});assert.equal(res.code,400);});
test('exact matching distinguishes similar model suffixes',()=>{assert.equal(handler._exactModelMatch('Ryzen 5 7600','AMD Ryzen 5 7600X'),false);assert.equal(handler._exactModelMatch('RTX 5070 Ti','ASUS GeForce RTX 5070 Ti'),true);});

test('provider failure across every part returns an error instead of a report',async()=>{
 const res=await call({body:{parts:[{key:'cpu:7600',category:'cpu',name:'AMD Ryzen 5 7600'}]},fetchStub:async url=>{
  const u=String(url);
  if(u.includes('/auth/v1/user'))return Response.json({id:'user-1'});
  if(u.includes('/rest/v1/subscriptions'))return Response.json([]);
  if(u.includes('/rest/v1/build_finder_trials'))return Response.json([{used_count:0}]);
  throw new Error('Provider unavailable');
 }});
 assert.equal(res.code,502);
 assert.match(res.body.error,/provider failed/i);
});
test('GET reports missing provider configuration without contacting Supabase',async()=>{
 const original=process.env.APISH_API_KEY;
 delete process.env.APISH_API_KEY;
 const res=await call({method:'GET',fetchStub:async()=>{throw new Error('No network call expected');},key:''});
 assert.equal(res.code,503);
 assert.equal(res.body.configured,false);
 if(original!==undefined)process.env.APISH_API_KEY=original;
});

test('standalone Price Tracker lookup is Plus-only',async()=>{
 const res=await call({body:{priceSearch:true,parts:[{key:'tracker:cpu:7600',category:'cpu',name:'AMD Ryzen 5 7600'}]},fetchStub:async url=>{
  const u=String(url);
  if(u.includes('/auth/v1/user'))return Response.json({id:'user-1'});
  if(u.includes('/rest/v1/subscriptions'))return Response.json([]);
  if(u.includes('/rest/v1/build_finder_trials'))return Response.json([{used_count:0}]);
  throw new Error('Provider must not be called for a free account');
 }});
 assert.equal(res.code,403);
 assert.match(res.body.error,/Plus feature/i);
});
