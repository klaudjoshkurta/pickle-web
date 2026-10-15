/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS fixture suite */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.PICKLE_TEST_ORIGIN||'http://127.0.0.1:3101';
assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const project='wywzsnegtykcdqfkvtsj';
const owner='10000000-0000-0000-0000-000000000001';
const other='10000000-0000-0000-0000-000000000002';
const pollId='20000000-0000-0000-0000-000000000001';
const templateId='30000000-0000-0000-0000-000000000001';
const avatar='https://api.dicebear.com/9.x/notionists/svg?seed=creator-fixture';
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" rx="28" fill="#cde7e0"/><text x="28" y="37" text-anchor="middle" font-size="28">K</text></svg>';
const dir='docs/screenshots';
let active;
async function fixture(browser,mode='account'){
  const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'reduce'});
  const state={user:{id:owner,aud:'authenticated',role:'authenticated',email:mode==='anon'?undefined:'creator@example.test',email_confirmed_at:mode==='anon'?null:new Date().toISOString(),is_anonymous:mode==='anon',app_metadata:{provider:'email',providers:['email']},user_metadata:{display_name:'Klaud',avatar_url:avatar}},polls:[],templates:[],notifications:[],calls:[],creationIds:[],created:new Map(),loseCreate:false,failReads:false,failAfterClose:false,authCalls:[]};
  function session(){return{access_token:'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:state.user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.fixture',refresh_token:'fixture',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:state.user};}
  await context.addInitScript(({key,value})=>{localStorage.setItem('pickle.locale','en');if(value)localStorage.setItem(key,JSON.stringify(value));},{key:'sb-'+project+'-auth-token',value:mode==='fresh'?null:session()});
  await context.routeWebSocket('**/*',ws=>ws.close());
  await context.route('**/*',async route=>{
    const req=route.request();const u=new URL(req.url());if(u.origin===base)return route.continue();
    if(u.hostname==='api.dicebear.com')return route.fulfill({contentType:'image/svg+xml',body:svg});
    if(u.hostname!==project+'.supabase.co')return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    const body=()=>req.postDataJSON();
    if(u.pathname.startsWith('/auth/')){
      state.authCalls.push([u.pathname,req.method()]);
      if(u.pathname==='/auth/v1/user'){
        if(req.method()==='PUT'){const b=body();if(b.email){state.user.email=b.email;state.user.email_confirmed_at=null;}state.user.user_metadata={...state.user.user_metadata,...b.data};}
        return json(state.user);
      }
      if(u.pathname==='/auth/v1/signup'){const b=body();state.user={...state.user,email:b.email,is_anonymous:false,user_metadata:b.data};return json(session());}
      if(u.pathname==='/auth/v1/token'){state.user={...state.user,is_anonymous:false,email:'creator@example.test'};return json(session());}
      if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204});
      throw Error('Unhandled auth fixture '+u.pathname);
    }
    if(u.pathname.includes('/rpc/')){
      const name=u.pathname.split('/').at(-1);const b=body();state.calls.push({name,body:b});
      if(name==='create_poll_v2'){
        state.creationIds.push(b.p_request_id);
        let id=state.created.get(b.p_request_id);
        if(!id){id=pollId;state.created.set(b.p_request_id,id);const p={id,creator_id:state.user.id,question:b.p_question,status:'OPEN',created_at:new Date().toISOString(),closed_at:b.p_closes_at,winner_option_id:null,expected_voters:b.p_expected_voters,voting_mode:b.p_voting_mode,voter_count:0,allow_suggestions:b.p_allow_suggestions,require_approval:b.p_require_approval,show_results_before_voting:b.p_show_results_before_voting,allow_vote_change:b.p_allow_vote_change,template_id:b.p_template_id,template_round:null,poll_options:b.p_options.map((text,i)=>({id:'40000000-0000-0000-0000-00000000000'+i,poll_id:id,text,status:'APPROVED',vote_count:0,position:i,suggested_by:null,created_at:new Date().toISOString()}))};state.polls.push(p);state.notifications.push({id:'notice-created',user_id:state.user.id,type:'POLL_CREATED',poll_id:id,poll_question:p.question,detail:null,is_read:false,created_at:new Date().toISOString()});}
        if(state.loseCreate){state.loseCreate=false;return json({message:'Fixture lost response after commit'},503);}return json(id);
      }
      const p=state.polls.find(p=>p.id===b.p_poll_id);if(!p)return json({message:'Not found'},400);
      if(name==='moderate_option'){const o=p.poll_options.find(o=>o.id===b.p_option_id);o.status=b.p_approve?'APPROVED':'REJECTED';return route.fulfill({status:204});}
      if(name==='close_poll'||name==='expire_poll'){p.status='CLOSED';p.closed_at=new Date().toISOString();if(state.failAfterClose)state.failReads=true;return route.fulfill({status:204});}
      if(name==='save_poll_template'){
        let t=state.templates.find(t=>t.id===p.template_id||t.source_poll_id===p.id);
        const fields={name:b.p_name,icon:b.p_icon,schedule_weekday:b.p_weekday,schedule_time:b.p_local_time,timezone:b.p_timezone};
        if(t)Object.assign(t,fields);else{t={id:templateId,owner_id:state.user.id,source_poll_id:p.id,question:p.question,option_texts:p.poll_options.filter(o=>o.status==='APPROVED').map(o=>o.text),rounds_count:1,voting_mode:p.voting_mode,allow_suggestions:p.allow_suggestions,require_approval:p.require_approval,show_results_before_voting:p.show_results_before_voting,allow_vote_change:p.allow_vote_change,...fields};state.templates.push(t);p.template_id=t.id;p.template_round=1;}return json(t.id);
      }
      throw Error('Unhandled RPC '+name);
    }
    if(state.failReads&&req.method()==='GET')return json({message:'Fixture offline'},503);
    const filter=(items)=>items.filter(o=>[...u.searchParams].filter(([k,v])=>v.startsWith('eq.')&&k in o).every(([k,v])=>String(o[k])===v.slice(3)));
    if(u.pathname==='/rest/v1/polls'){
      const rows=filter(state.polls);const nested=u.searchParams.get('select')?.includes('poll_options');
      const data=rows.map(p=>{if(nested)return p;const copy={...p};delete copy.poll_options;return copy;});
      return json(u.searchParams.has('id')?data[0]??null:data);
    }
    if(u.pathname==='/rest/v1/poll_options')return json(filter(state.polls.flatMap(p=>p.poll_options)));
    if(u.pathname==='/rest/v1/poll_templates'){const rows=filter(state.templates);return json(u.searchParams.has('id')||u.searchParams.has('source_poll_id')?rows[0]??null:rows);}
    if(u.pathname==='/rest/v1/notifications'){
      if(req.method()==='POST'){state.notifications.push({id:'notice-'+state.notifications.length,...body(),is_read:false,created_at:new Date().toISOString()});return route.fulfill({status:201});}
      if(req.method()==='PATCH'){filter(state.notifications).forEach(n=>Object.assign(n,body()));return route.fulfill({status:204});}
      return json(filter(state.notifications));
    }
    if(['/rest/v1/votes','/rest/v1/poll_ballots'].includes(u.pathname))return json(null);
    throw Error('Unhandled fixture request '+u.pathname);
  });
  const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const f={page,context,state,errors,session};active=f;return f;
}
async function visit(f,path){await f.page.goto(base+path);}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal page overflow');}
async function capture(page,name){await noOverflow(page);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:dir+'/creator-'+name+'.png',fullPage:true});}
async function main(){
  fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:process.env.PICKLE_BROWSER_CHANNEL||'msedge',headless:true});
  try{
    let f=await fixture(browser,'fresh');await visit(f,'/app');await f.page.getByRole('link',{name:'Try it',exact:true}).click();await f.page.getByText('You’re exploring a read-only sample. Nothing here is sent to anyone.').filter({visible:true}).waitFor();assert.equal(f.state.authCalls.length,0);assert.equal(f.state.calls.length,0);await capture(f.page,'demo');
    await visit(f,'/app/signup');await f.page.getByLabel('Your name',{exact:true}).fill('Klaud');await f.page.getByRole('button',{name:'Next',exact:true}).click();
    await f.page.getByRole('button',{name:'Next',exact:true}).click();await f.page.getByText('Choose an avatar.',{exact:true}).filter({visible:true}).waitFor();
    await f.page.getByRole('radio').first().click();await f.page.getByRole('button',{name:'Next',exact:true}).click();await f.page.getByLabel('Email',{exact:true}).fill('creator@example.test');await f.page.getByRole('button',{name:'Next',exact:true}).click();await f.page.getByLabel('Password',{exact:true}).fill('fixture-password');await f.page.getByRole('button',{name:'Create an account',exact:true}).click();
    await f.page.getByRole('heading',{level:1,name:/Your first poll/}).waitFor();await capture(f.page,'first-run');assert.equal(f.state.calls.length,0);
    await f.page.getByRole('link',{name:'Film night',exact:true}).click();await f.page.getByLabel('What are we deciding?',{exact:true}).fill('Friday film: what are we watching?');
    await f.page.getByRole('combobox',{name:'Poll settings',exact:true}).selectOption('MULTIPLE');await f.page.getByRole('switch',{name:'Show results before voting',exact:true}).check();
    await f.page.getByRole('button',{name:'Move option 1 down',exact:true}).click();assert.equal(await f.page.getByLabel('Option 1',{exact:true}).inputValue(),'Lady Bird');
    const storage=await f.page.evaluate(()=>Object.fromEntries(Object.entries(sessionStorage)));await f.page.reload();await f.page.getByRole('heading',{name:'New poll',exact:true}).waitFor();assert.equal(await f.page.getByLabel('Option 1',{exact:true}).inputValue(),'Lady Bird');
    assert.deepEqual(await f.page.evaluate(()=>Object.fromEntries(Object.entries(sessionStorage))),storage);
    await capture(f.page,'film-draft');f.state.loseCreate=true;
    await f.page.getByRole('button',{name:'Create & get the link',exact:true}).click();await f.page.getByText('Couldn’t create the poll. Retry this draft to recover the same request.').filter({visible:true}).waitFor();
    await f.page.getByRole('button',{name:'Create & get the link',exact:true}).click();await f.page.getByRole('heading',{name:'It’s live!',exact:true}).waitFor();
    assert.ok(f.state.creationIds.length>=2);assert.equal(new Set(f.state.creationIds).size,1);assert.equal(f.state.polls.length,1);assert.equal(f.state.notifications.filter(n=>n.type==='POLL_CREATED').length,1);await capture(f.page,'share');
    const p=f.state.polls[0];p.voter_count=9;p.poll_options.forEach((o,i)=>o.vote_count=[5,3,1,0][i]);p.poll_options.push({id:'pending-one',poll_id:p.id,text:'Just watch trailers',status:'PENDING',vote_count:0,position:4,suggested_by:other,created_at:new Date().toISOString()},{id:'pending-two',poll_id:p.id,text:'Pick randomly',status:'PENDING',vote_count:0,position:5,suggested_by:other,created_at:new Date().toISOString()});
    await f.page.getByRole('link',{name:'Watch the votes come in',exact:true}).click();await f.page.getByRole('heading',{name:'Creator controls',exact:true}).waitFor();
    await f.page.getByRole('button',{name:'Add it',exact:true}).first().click();await f.page.getByRole('button',{name:'Not this time',exact:true}).last().click();assert.equal(p.poll_options.find(o=>o.id==='pending-one').status,'APPROVED');assert.equal(p.poll_options.find(o=>o.id==='pending-two').status,'REJECTED');
    await f.page.getByRole('button',{name:'Save as template',exact:true}).click();const dialog=f.page.getByRole('dialog');await dialog.getByLabel('Template name',{exact:true}).fill('Film night');await dialog.getByRole('switch',{name:'Weekly closing time',exact:true}).check();await dialog.getByLabel('Timezone',{exact:true}).fill('Europe/Athens');await dialog.getByRole('button',{name:'Save',exact:true}).click();await dialog.getByText('Template saved',{exact:true}).filter({visible:true}).waitFor();await dialog.getByRole('button',{name:'Back',exact:true}).click();
    await f.page.getByRole('button',{name:'End voting',exact:true}).click();await dialog.getByRole('button',{name:'Keep it open',exact:true}).click();assert.equal(f.state.calls.filter(c=>c.name==='close_poll').length,0);
    await f.page.getByRole('button',{name:'End voting',exact:true}).click();f.state.failAfterClose=true;await dialog.getByRole('button',{name:'End & reveal',exact:true}).click();await f.page.getByText('Saved. Couldn’t refresh the latest data.',{exact:true}).filter({visible:true}).waitFor();assert.equal(await f.page.getByRole('radio').count(),0);assert.equal(await f.page.getByRole('button',{name:'End voting',exact:true}).count(),0);
    f.state.failReads=false;await f.page.getByRole('button',{name:'Refresh',exact:true}).click();await f.page.getByText('Saved. Couldn’t refresh the latest data.',{exact:true}).filter({visible:true}).waitFor({state:'hidden'});assert.equal(f.state.calls.filter(c=>c.name==='close_poll').length,1);await capture(f.page,'closed-poll');
    await visit(f,'/app/templates');await f.page.getByRole('link',{name:'Use',exact:true}).click();await f.page.getByRole('heading',{name:'New poll',exact:true}).waitFor();assert.equal(await f.page.getByRole('switch',{name:'Leave out last time’s winner',exact:true}).isChecked(),true);assert.equal(await f.page.getByLabel('Option 1',{exact:true}).inputValue(),'Arrival');
    await capture(f.page,'template-round');await f.page.getByRole('switch',{name:'Leave out last time’s winner',exact:true}).uncheck();assert.equal(await f.page.getByLabel('Option 5',{exact:true}).inputValue(),'Lady Bird');
    await visit(f,'/app/notifications');await f.page.getByRole('button',{name:'Mark all read',exact:true}).click();assert.ok(f.state.notifications.every(n=>n.is_read));await capture(f.page,'notifications');
    await visit(f,'/app');await f.page.getByRole('heading',{name:'Settled',exact:true}).waitFor();await capture(f.page,'dashboard');
    for(const width of [320,390,768,1280])for(const theme of ['light','dark'])for(const locale of ['en','el']){
      await f.page.setViewportSize({width,height:900});await f.page.emulateMedia({colorScheme:theme});await f.page.getByRole('button',{name:locale.toUpperCase(),exact:true}).click();await capture(f.page,'dashboard-'+width+'-'+theme+'-'+locale);
    }
    await f.page.setViewportSize({width:320,height:900});const zoom=await f.page.addStyleTag({content:'html{font-size:24px}'});await capture(f.page,'large-text');await zoom.evaluate(el=>el.remove());await f.page.getByRole('button',{name:'EN',exact:true}).click();
    await visit(f,'/app/account');await f.page.getByRole('button',{name:'Your voting face',exact:true}).click();await f.page.getByRole('dialog').getByLabel('Display name',{exact:true}).fill('Klaud updated');await f.page.getByRole('dialog').getByRole('button',{name:'Continue',exact:true}).click();assert.equal(f.state.user.user_metadata.display_name,'Klaud updated');await f.page.getByRole('button',{name:'Sign out',exact:true}).click();await f.page.getByRole('heading',{name:'Log in',exact:true}).waitFor();assert.equal(await f.page.getByText('Friday film: what are we watching?',{exact:true}).filter({visible:true}).count(),0);
    await f.page.getByLabel('Email',{exact:true}).fill('creator@example.test');await f.page.getByLabel('Password',{exact:true}).fill('fixture-password');await f.page.getByRole('button',{name:'Log in',exact:true}).click();await f.page.getByRole('heading',{name:'Hi Klaud updated',exact:true}).waitFor();assert.deepEqual(f.errors,[]);await f.context.close();
    f=await fixture(browser,'anon');await visit(f,'/app/signup');await f.page.getByRole('button',{name:'Next',exact:true}).click();await f.page.getByRole('radio').first().click();await f.page.getByRole('button',{name:'Next',exact:true}).click();await f.page.getByLabel('Email',{exact:true}).fill('upgrade@example.test');await f.page.getByRole('button',{name:'Next',exact:true}).click();await f.page.getByLabel('Password',{exact:true}).fill('fixture-password');await f.page.getByRole('button',{name:'Create an account',exact:true}).click();await f.page.getByRole('heading',{name:'Finish your account',exact:true}).waitFor();
    await f.page.getByLabel('Password',{exact:true}).fill('new-fixture-password');await f.page.getByRole('button',{name:'Finish your account',exact:true}).click();await f.page.getByText('Verify your email first, then try again.',{exact:true}).filter({visible:true}).waitFor();assert.equal(f.state.calls.length,0);f.state.user.is_anonymous=false;f.state.user.email_confirmed_at=new Date().toISOString();await f.page.getByRole('button',{name:'Finish your account',exact:true}).click();await f.page.getByRole('heading',{name:/Your first poll/}).waitFor();assert.equal(f.state.user.user_metadata.pickle_account_pending,false);assert.deepEqual(f.errors,[]);await f.context.close();
    console.log('PASS: fresh signup, anonymous upgrade, login/logout, read-only demo, owner dashboard, stable creation retries, draft restoration/order, multi-choice settings, moderation, templates/history/DST inputs, close confirmation/refresh recovery, inbox read state, profile, 16 responsive theme/locale variants and large text.');
  }catch(error){if(active?.page&&!active.page.isClosed()){await active.page.screenshot({path:dir+'/creator-failure.png',fullPage:true}).catch(()=>{});console.error((await active.page.locator('body').innerText()).slice(0,2500));}throw error;}
  finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
