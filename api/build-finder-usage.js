'use strict';
const LIMIT = 1;
function send(res, status, body) { return res.status(status).json(body); }
module.exports = async function handler(req, res) {
  if (!['GET','POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return send(res,405,{error:'Method not allowed'});
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i,'');
  if (!supabaseUrl || !serviceKey) return send(res,503,{error:'Account service is not configured.'});
  if (!token || token.length > 10000) return send(res,401,{error:'Sign in to use the Build Finder.'});
  const base = supabaseUrl.replace(/\/$/,'');
  try {
    const userResponse = await fetch(base + '/auth/v1/user', {
      headers:{apikey:serviceKey,Authorization:'Bearer '+token}
    });
    if (!userResponse.ok) return send(res,401,{error:'Your session expired. Sign in again.'});
    const user = await userResponse.json();
    const stripeMode = process.env.STRIPE_MODE || 'test';
    if (!['test','live'].includes(stripeMode)) return send(res,503,{error:'Billing mode is not configured.'});
    const params = new URLSearchParams({
      user_id:'eq.'+user.id,
      livemode:'eq.'+String(stripeMode === 'live'),
      select:'status,current_period_end',
      order:'updated_at.desc',
      limit:'1'
    });
    const subResponse = await fetch(base + '/rest/v1/subscriptions?' + params.toString(), {
      headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey}
    });
    if (!subResponse.ok) {
      const detail = await subResponse.text().catch(()=> '');
      console.error('Build Finder membership lookup failed:',subResponse.status,detail.slice(0,500));
      return send(res,502,{error:'Could not verify membership. Please try again.'});
    }
    const rows = await subResponse.json();
    const sub = rows[0] || null;
    const active = Boolean(sub && ['active','trialing'].includes(sub.status)
      && (!sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now()));
    if (req.method === 'GET') {
      const usageResponse = await fetch(base + '/rest/v1/build_finder_trials?user_id=eq.'+encodeURIComponent(user.id)+'&select=used_count&limit=1', {
        headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey}
      });
      if (!usageResponse.ok) {
        const detail = await usageResponse.text().catch(()=> '');
        console.error('Build Finder usage lookup failed:',usageResponse.status,detail.slice(0,500));
        return send(res,502,{error:'Could not load your free-plan usage.'});
      }
      const usage = await usageResponse.json();
      const used = Number(usage[0]?.used_count || 0);
      return send(res,200,{hasPlus:active,limit:LIMIT,used,remaining:active?null:Math.max(LIMIT-used,0)});
    }
    if (active) return send(res,200,{allowed:true,hasPlus:true,limit:LIMIT,used:null,remaining:null});
    const consumeResponse = await fetch(base + '/rest/v1/rpc/consume_build_finder_trial', {
      method:'POST',
      headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},
      body:JSON.stringify({p_user_id:user.id,p_limit:LIMIT})
    });
    if (!consumeResponse.ok) {
      const detail = await consumeResponse.text().catch(()=> '');
      console.error('Build Finder trial consume failed:',consumeResponse.status,detail.slice(0,500));
      return send(res,502,{error:'Could not update your trial usage. Please try again.'});
    }
    const result = await consumeResponse.json();
    const row = Array.isArray(result) ? result[0] : result;
    return send(res,row?.allowed?200:403,{
      allowed:Boolean(row?.allowed),hasPlus:false,limit:LIMIT,
      used:Number(row?.used_count || 0),remaining:Number(row?.remaining || 0),
      error:row?.allowed?undefined:'You have used the one free Build Finder review. Plus unlocks unlimited plans.'
    });
  } catch (error) {
    console.error('Build Finder usage endpoint failed:',error.message);
    return send(res,500,{error:'Could not check Build Finder access right now.'});
  }
};
