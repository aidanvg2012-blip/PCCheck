'use strict';

const API_BASE = 'https://api.api.sh/pcpartpicker/v1';
const CATEGORY_MAP = {cpu:'cpu',gpu:'video-card',motherboard:'motherboard',ram:'memory',storage:'internal-hard-drive',psu:'power-supply',case:'case'};
const STOP = new Set(['amd','intel','nvidia','geforce','radeon','processor','desktop','boxed','unlocked','graphics','card','video','cpu','gpu','ram','memory','kit','ddr3','ddr4','ddr5','ssd','nvme','hdd','m2','internal','drive','hard','disk','storage','motherboard','mainboard','board','power','supply','case','atx','matx','micro','mini','itx','tower','pc','core','cores','thread','threads','ghz','mhz','gb','tb','cl','black','white','wifi','edition','series','with','for','the','and']);
function send(res,status,body){return res.status(status).json(body);}
function tokens(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(token=>token&&!STOP.has(token)&&!/^\d{1,2}$/.test(token));}
function exactModelMatch(requested,candidate){const need=tokens(requested),have=new Set(tokens(candidate));if(!need.length)return String(candidate||'').toLowerCase().includes(String(requested||'').toLowerCase());return need.every(token=>have.has(token));}
function safeUrl(value){try{const u=new URL(value);return u.protocol==='https:'?u.toString():null;}catch{return null;}}
function number(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:null;}
async function apiGet(path,params,key){
  const url=new URL(API_BASE+path);
  for(const [name,value] of Object.entries(params))url.searchParams.set(name,String(value));
  url.searchParams.set('fresh','1');url.searchParams.set('raw','0');
  const response=await fetch(url.toString(),{headers:{'x-api-key':key,Accept:'application/json'}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('Retail price provider returned '+response.status+': '+String(data.error||response.statusText).slice(0,180));
  return data;
}
async function getUserAndAccess(req){
  const supabaseUrl=process.env.SUPABASE_URL,serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token=String(req.headers?.authorization||'').replace(/^Bearer\s+/i,'');
  if(!supabaseUrl||!serviceKey)throw Object.assign(new Error('Account service is not configured.'),{status:503});
  if(!token||token.length>10000)throw Object.assign(new Error('Sign in to run a live price check.'),{status:401});
  const base=supabaseUrl.replace(/\/$/,'');
  const userResponse=await fetch(base+'/auth/v1/user',{headers:{apikey:serviceKey,Authorization:'Bearer '+token}});
  if(!userResponse.ok)throw Object.assign(new Error('Your session expired. Sign in again.'),{status:401});
  const user=await userResponse.json();
  const mode=process.env.STRIPE_MODE||'test';
  if(!['test','live'].includes(mode))throw Object.assign(new Error('Billing mode is not configured.'),{status:503});
  const query=new URLSearchParams({user_id:'eq.'+user.id,livemode:'eq.'+String(mode==='live'),select:'status,current_period_end',order:'updated_at.desc',limit:'1'});
  const subResponse=await fetch(base+'/rest/v1/subscriptions?'+query.toString(),{headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey}});
  if(!subResponse.ok)throw Object.assign(new Error('Could not verify membership.'),{status:502});
  const subscriptions=await subResponse.json(),sub=subscriptions[0]||null;
  const hasPlus=Boolean(sub&&['active','trialing'].includes(sub.status)&&(!sub.current_period_end||new Date(sub.current_period_end).getTime()>Date.now()));
  if(!hasPlus){
    const usageResponse=await fetch(base+'/rest/v1/build_finder_trials?user_id=eq.'+encodeURIComponent(user.id)+'&select=used_count&limit=1',{headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey}});
    if(!usageResponse.ok)throw Object.assign(new Error('Could not check your free review access.'),{status:502});
    const rows=await usageResponse.json();
    if(Number(rows[0]?.used_count||0)>=1)throw Object.assign(new Error('Your one free build review has already been used. Plus unlocks unlimited reviews.'),{status:403});
  }
}
async function priceOne(part,key){
  const category=CATEGORY_MAP[part.category],query=String(part.model||part.name).trim();
  const search=await apiGet('/products',{category,q:query,country:'us'},key);
  const candidates=Array.isArray(search.products)?search.products:[];
  const match=candidates.find(item=>exactModelMatch(query,item.name));
  if(!match?.id)return{key:part.key,found:false,requested:query,offers:[],message:'No exact PCPartPicker model match. No live price assigned.'};
  const detail=await apiGet('/product',{id:match.id},key);
  const offers=(Array.isArray(detail.prices)?detail.prices:[]).map(offer=>{
    const base=number(offer.base),promo=number(offer.promo),total=number(offer.total),price=total||promo||base,url=safeUrl(offer.url),availability=String(offer.availability||'Not confirmed');
    if(!price||!url||/out of stock|sold out|unavailable|not available/i.test(availability))return null;
    return{merchant:String(offer.merchant||'Retailer'),price,priceText:String(offer.total_text||''),availability,shipping:offer.shipping==null?null:String(offer.shipping),tax:offer.tax==null?null:String(offer.tax),url};
  }).filter(Boolean).sort((a,b)=>a.price-b.price).slice(0,12);
  const best=offers[0]||null;
  return{key:part.key,found:true,name:String(detail.name||match.name||query),productUrl:safeUrl(detail.url)||safeUrl(match.url),lowestPrice:best?.price||null,lowestRetailer:best?.merchant||null,offers,checkedAt:detail.fetched_at||new Date().toISOString(),cached:Boolean(detail.cached),creditsUsed:Number(search.credits_used||0)+Number(detail.credits_used||0)};
}
async function mapLimit(items,limit,worker){const output=new Array(items.length);let next=0;async function run(){while(true){const index=next++;if(index>=items.length)return;output[index]=await worker(items[index]);}}await Promise.all(Array.from({length:Math.min(limit,items.length)},run));return output;}
module.exports=async function handler(req,res){
  if(req.method==='GET'){
    if(!process.env.APISH_API_KEY)return send(res,503,{configured:false,error:'Live retailer pricing is not configured yet. A parent/guardian must add APISH_API_KEY to Vercel.'});
    return send(res,200,{configured:true,provider:'PCPartPicker retailer data via API.SH',freshLookups:true});
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(res,405,{error:'Method not allowed'});}
  const key=process.env.APISH_API_KEY;
  if(!key)return send(res,503,{error:'Live retailer pricing is not configured yet. Add APISH_API_KEY to Vercel.'});
  try{
    await getUserAndAccess(req);
    let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body);}catch{body=null;}}
    const parts=Array.isArray(body?.parts)?body.parts:[];
    if(!parts.length||parts.length>21)return send(res,400,{error:'Send between 1 and 21 selected build parts.'});
    const seen=new Set();
    for(const part of parts){
      if(!part||typeof part.key!=='string'||part.key.length>180||!CATEGORY_MAP[part.category]||typeof(part.model||part.name)!=='string'||String(part.model||part.name).trim().length<2||String(part.model||part.name).length>120)return send(res,400,{error:'A selected part has an invalid category, key, or model name.'});
      if(seen.has(part.key))return send(res,400,{error:'Duplicate selected part key.'});seen.add(part.key);
    }
    const results=await mapLimit(parts,3,async part=>{try{return await priceOne(part,key);}catch(error){console.error('Live price lookup failed for',part.category,error.message);return{key:part.key,found:false,requested:part.model||part.name,offers:[],error:'Live price lookup failed for this exact part.'};}});
    if(results.length&&results.every(result=>result.error))return send(res,502,{error:'The live price provider failed for every selected part. Your free review was not used; try again later.'});
    return send(res,200,{source:'PCPartPicker via API.SH',checkedAt:new Date().toISOString(),matches:Object.fromEntries(results.map(result=>[result.key,result]))});
  }catch(error){const status=Number(error.status)||502;console.error('Live retailer price endpoint failed:',error.message);return send(res,status,{error:error.message||'Live retailer pricing is temporarily unavailable.'});}
};
module.exports._exactModelMatch=exactModelMatch;
