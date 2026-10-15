/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS browser harness */
/* Isolated browser acceptance suite. All remote requests are intercepted. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PICKLE_TEST_ORIGIN || 'http://localhost:3100';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const pollId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000002';
const avatar = 'https://api.dicebear.com/9.x/notionists/svg?seed=fixture';
const project = 'wywzsnegtykcdqfkvtsj';
const screenshotDir = 'docs/screenshots';
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="24" fill="#cde7e0"/><text x="24" y="32" text-anchor="middle" font-size="24" fill="#33201b">K</text></svg>';

async function fixture(browser, config = {}) {
  const context = await browser.newContext({viewport:{width:390,height:844}, colorScheme:'light', reducedMotion:'reduce'});
  const state = {
    saved: config.saved ?? [], writes: [], suggestions: [], failReads:false,
    failAfterWrite:false, failAfterSuggestion:false, rejectVote:false, user: {id:userId,aud:'authenticated',role:'authenticated',is_anonymous:true,
      app_metadata:{provider:'anonymous',providers:['anonymous']},
      user_metadata: config.profile === false ? {} : {display_name:'Klaud',avatar_url:avatar}},
    poll: {id:pollId,question:'Pizza night: what are we ordering?',creator_id:'creator',
      voting_mode:config.multiple ? 'MULTIPLE':'SINGLE', voter_count:config.empty ? 0 : config.multiple && config.saved?.length > 1 ? 10 : 11,
      allow_suggestions:true,require_approval:true,show_results_before_voting:config.showResults ?? false,
      allow_vote_change:config.locked ? false : true,status:config.closed ? 'CLOSED':'OPEN',
      created_at:new Date().toISOString(),closed_at:config.expired ? '2020-01-01T00:00:00Z' : config.closed ? new Date().toISOString() : new Date(Date.now()+3600000).toISOString(),
      winner_option_id:null,expected_voters:12},
    options:['Detroit-style from Emmy’s','Pepperoni from Slice House','Veggie supreme from Nino’s','Margherita from Lupa'].map((text,i)=>({id:'option-'+i,poll_id:pollId,text,status:'APPROVED',vote_count:config.empty ? 0 : [5,3,2,1][i],suggested_by:null,position:i,created_at:'2026-01-01T00:00:00Z'})),
  };
  const session = () => {
    const payload = Buffer.from(JSON.stringify({sub:state.user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url');
    return {access_token:'eyJhbGciOiJIUzI1NiJ9.'+payload+'.fixture',refresh_token:'fixture',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:state.user};
  };
  await context.addInitScript(({key,value}) => { localStorage.setItem('pickle.locale','en'); localStorage.setItem(key,JSON.stringify(value)); }, {key:'sb-'+project+'-auth-token',value:session()});
  await context.routeWebSocket('**/*', ws => ws.close());
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === base) return route.continue();
    if (url.hostname === 'api.dicebear.com') return route.fulfill({contentType:'image/svg+xml',body:svg});
    if (url.hostname !== project+'.supabase.co') return route.abort();
    const json = (body, status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if (url.pathname === '/auth/v1/user') {
      if (request.method() === 'PUT') state.user.user_metadata = {...state.user.user_metadata,...request.postDataJSON().data};
      return json(state.user);
    }
    if (url.pathname === '/auth/v1/token' || url.pathname === '/auth/v1/signup') return json(session());
    if (url.pathname.includes('/rpc/cast_ballot')) {
      const ids = request.postDataJSON().p_option_ids;
      if (state.rejectVote) return json({message:'Vote change not allowed'},400);
      if (state.poll.status !== 'OPEN') return json({message:'Poll is not open'},400);
      if (state.saved.length && !state.poll.allow_vote_change) return json({message:'Vote change not allowed'},400);
      state.writes.push(ids);
      if (!state.saved.length) state.poll.voter_count++;
      for (const o of state.options) o.vote_count += Number(ids.includes(o.id))-Number(state.saved.includes(o.id));
      state.saved=[...ids]; if(state.failAfterWrite) state.failReads=true;
      return route.fulfill({status:204});
    }
    if (url.pathname.includes('/rpc/expire_poll')) {state.poll.status='CLOSED';return route.fulfill({status:204});}
    if (state.failReads && request.method() === 'GET') return json({message:'Fixture offline'},503);
    if (url.pathname === '/rest/v1/polls') return json(state.poll);
    if (url.pathname === '/rest/v1/poll_options') {
      if (request.method() === 'POST') {state.suggestions.push(request.postDataJSON());if(state.failAfterSuggestion) state.failReads=true;return route.fulfill({status:201});}
      return json(state.options);
    }
    if (url.pathname === '/rest/v1/poll_ballots') return json(state.saved.length ? {option_ids:state.saved} : null);
    if (url.pathname === '/rest/v1/votes') return json(null);
    throw Error('Unhandled fixture request: '+url.pathname);
  });
  if (config.tie) { state.options[0].vote_count=4; state.options[1].vote_count=4; state.options[2].vote_count=0; state.options[3].vote_count=0; state.poll.voter_count=8; }
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto(base+'/p/'+pollId);
  await page.getByRole('heading',{level:1,name:state.poll.question}).waitFor();
  return {context,page,state,errors};
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow');
}
async function main() {
  const browser = await chromium.launch({channel:process.env.PICKLE_BROWSER_CHANNEL || 'msedge',headless:true});
  try {
    fs.mkdirSync(screenshotDir,{recursive:true});
    let f = await fixture(browser,{profile:false});
    await f.page.getByRole('radio').first().click();
    await f.page.getByRole('button',{name:/^Vote for/}).click();
    const dialog=f.page.getByRole('dialog'); await dialog.waitFor();
    await f.page.getByRole('button',{name:'Cancel',exact:true}).click();
    assert.equal(f.state.writes.length,0,'identity cancellation wrote a ballot');
    await f.page.getByRole('button',{name:/^Vote for/}).click();
    await f.page.getByLabel('Display name',{exact:true}).fill('Klaud');
    await f.page.getByRole('button',{name:'Continue',exact:true}).click();
    await f.page.getByText('Pick your face before continuing.').waitFor();
    assert.equal(f.state.writes.length,0);
    assert.equal(await dialog.getByRole('radio').count(),10);
    await dialog.getByRole('radio').first().click();
    await f.page.getByRole('button',{name:'Show different avatars',exact:true}).click();
    assert.equal(await dialog.getByRole('radio',{checked:true}).count(),0);
    await dialog.getByRole('radio').first().click();
    await f.page.screenshot({path:screenshotDir+'/poll-identity-sheet.png',fullPage:true});
    await f.page.setViewportSize({width:320,height:900});
    const largeSheet = await f.page.addStyleTag({content:'html{font-size:24px}'});
    await noOverflow(f.page);
    assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),'identity sheet overflow');
    await f.page.screenshot({path:screenshotDir+'/poll-identity-large-text.png'});
    await largeSheet.evaluate(el=>el.remove()); await f.page.setViewportSize({width:390,height:844});
    await f.page.getByRole('button',{name:'Continue',exact:true}).click();
    await f.page.getByText("You're in, Klaud!",{exact:true}).waitFor();
    assert.deepEqual(f.state.writes,[['option-0']]);
    await f.page.getByRole('button',{name:'Change my vote',exact:true}).click();
    await f.page.getByRole('radio').nth(1).click();
    await f.page.getByRole('button',{name:'Keep my vote',exact:true}).click();
    assert.equal(f.state.writes.length,1);
    await f.page.getByRole('button',{name:'Got a better idea?',exact:true}).click();
    await dialog.getByRole('textbox').fill('Just salads');
    await dialog.getByRole('button',{name:/Send|Suggest|Submit/}).click();
    assert.equal(f.state.suggestions.length,1);
    assert.equal(f.state.suggestions[0].status,'PENDING');
    assert.deepEqual(f.errors,[]); await f.context.close();

    f=await fixture(browser,{multiple:true,saved:['option-0','option-1']});
    await f.page.getByRole('button',{name:'Change my vote',exact:true}).click();
    assert.equal(await f.page.getByRole('checkbox',{checked:true}).count(),2);
    await f.page.getByRole('checkbox').first().click(); await f.page.getByRole('checkbox').nth(2).click();
    await f.page.getByRole('button',{name:'Update 2 selections',exact:true}).click();
    await f.page.getByText("You're in, Klaud!",{exact:true}).waitFor();
    assert.deepEqual(f.state.writes,[['option-1','option-2']]);
    await f.page.reload(); await f.page.getByRole('button',{name:'Change my vote',exact:true}).click();
    assert.equal(await f.page.getByRole('checkbox',{checked:true}).count(),2);
    await f.page.getByRole('button',{name:'Keep my vote',exact:true}).click();
    assert.match(await f.page.locator('article').innerText(),/10 voters · 11 selections/);
    for(const width of [320,390,768,1280]) for(const colorScheme of ['light','dark']) for(const locale of ['en','el']) {
      await f.page.setViewportSize({width,height:900}); await f.page.emulateMedia({colorScheme,reducedMotion:'reduce'});
      await f.page.getByRole('button',{name:locale.toUpperCase(),exact:true}).click();
      await noOverflow(f.page); await f.page.evaluate(()=>document.fonts.ready);
      await f.page.screenshot({path:screenshotDir+'/poll-'+width+'-'+colorScheme+'-'+locale+'.png',fullPage:true});
    }
    assert.equal(await f.page.locator('.live-dot').evaluate(el=>getComputedStyle(el).animationName),'none');
    await f.page.setViewportSize({width:320,height:900});
    await f.page.addStyleTag({content:'html{font-size:24px}'}); await noOverflow(f.page);
    await f.page.screenshot({path:screenshotDir+'/poll-large-text-dark-el.png',fullPage:true});
    assert.deepEqual(f.errors,[]); await f.context.close();

    f=await fixture(browser,{multiple:true});
    assert.equal(await f.page.locator('.poll-leader').count(),0);
    await f.page.getByRole('checkbox').first().click(); await f.page.getByRole('checkbox').nth(1).click();
    await f.page.screenshot({path:screenshotDir+'/poll-multiple-vote.png',fullPage:true});
    await f.page.setViewportSize({width:320,height:900}); await f.page.addStyleTag({content:'html{font-size:24px}'});
    await noOverflow(f.page); await f.page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
    const bottom = await f.page.getByRole('button',{name:'EL',exact:true}).boundingBox();
    const bar = await f.page.locator('.poll-vote-actions').boundingBox(); assert.ok(bottom.y+bottom.height <= bar.y, 'bottom action covers content');
    await f.page.screenshot({path:screenshotDir+'/poll-vote-large-text.png',fullPage:true}); await f.context.close();
    f=await fixture(browser,{tie:true,closed:true});
    await f.page.getByText('Dead heat!',{exact:true}).waitFor();
    assert.equal(await f.page.getByRole('region',{name:/tie.*Detroit-style/i}).count(),1);
    await f.page.screenshot({path:screenshotDir+'/poll-closed-tie.png',fullPage:true}); await f.context.close();

    f=await fixture(browser,{saved:['option-0'],locked:true});
    assert.equal(await f.page.getByRole('button',{name:'Change my vote',exact:true}).count(),0);
    assert.equal(f.state.writes.length,0); await f.context.close();

    f=await fixture(browser,{expired:true});
    assert.equal(await f.page.getByRole('radio').count(),0); assert.equal(f.state.writes.length,0); await f.context.close();

    f=await fixture(browser,{empty:true,closed:true});
    await f.page.getByText('This poll closed without any votes.').waitFor(); await f.context.close();

    f=await fixture(browser); f.state.failAfterWrite=true;
    await f.page.getByRole('radio').first().click(); await f.page.getByRole('button',{name:/^Vote for/}).click();
    await f.page.getByText("Saved. Couldn't refresh the latest data.").waitFor();
    assert.equal(f.state.writes.length,1);
    f.state.failReads=false; await f.page.getByRole('button',{name:'Refresh',exact:true}).click();
    await f.page.getByText("Saved. Couldn't refresh the latest data.").waitFor({state:'hidden'});
    assert.equal(f.state.writes.length,1); await f.context.close();

    f=await fixture(browser,{saved:['option-0']});
    await f.page.getByRole('button',{name:'Change my vote',exact:true}).click(); await f.page.getByRole('radio').nth(2).click();
    f.state.saved=[];
    await f.page.evaluate(({key, newId})=>{
      const oldValue=localStorage.getItem(key);const session=JSON.parse(oldValue);session.user.id=newId;
      session.access_token='eyJhbGciOiJIUzI1NiJ9.'+btoa(JSON.stringify({sub:newId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'}))+'.fixture';
      localStorage.setItem(key,JSON.stringify(session)); const channel=new BroadcastChannel(key); channel.postMessage({event:'SIGNED_IN',session}); setTimeout(()=>channel.close(),100);
    },{key:'sb-'+project+'-auth-token',newId:'00000000-0000-0000-0000-000000000003'});
    // RLS fixture simulates the new user's empty ballot.
    f.state.saved=[];
    await f.page.waitForFunction(()=>document.querySelector('[role="radio"][aria-checked="true"]')===null);
    assert.equal(f.state.writes.length,0); await f.context.close();

    f=await fixture(browser); f.state.rejectVote=true;
    await f.page.getByRole('radio').first().focus(); await f.page.keyboard.press('ArrowDown');
    assert.equal(await f.page.getByRole('radio').nth(1).getAttribute('aria-checked'),'true');
    await f.page.getByRole('button',{name:/^Vote for/}).click();
    await f.page.getByText("This poll doesn't allow changing your vote.").waitFor();
    assert.equal(f.state.writes.length,0); await f.context.close();

    f=await fixture(browser); f.state.failReads=true; await f.page.reload();
    await f.page.getByRole('heading',{name:"Couldn't load the poll",exact:true}).waitFor();
    f.state.failReads=false; await f.page.getByRole('button',{name:'Try again',exact:true}).click();
    await f.page.getByRole('heading',{level:1,name:f.state.poll.question}).waitFor(); await f.context.close();

    f=await fixture(browser); f.state.failAfterSuggestion=true;
    await f.page.getByRole('button',{name:'Got a better idea?',exact:true}).click();
    await f.page.getByRole('dialog').getByRole('textbox').fill('Another idea');
    await f.page.getByRole('dialog').getByRole('button',{name:'Suggest',exact:true}).click();
    await f.page.getByText("Saved. Couldn't refresh the latest data.").waitFor();
    assert.equal(f.state.suggestions.length,1); f.state.failReads=false;
    await f.page.getByRole('button',{name:'Refresh',exact:true}).click();
    await f.page.getByText("Saved. Couldn't refresh the latest data.").waitFor({state:'hidden'});
    assert.equal(f.state.suggestions.length,1); await f.context.close();

    const page=await browser.newPage();
    for(const path of ['/','/blog']) {await page.goto(base+path);await page.getByRole('heading',{level:1}).waitFor();assert.equal(await page.locator('.poll-theme').count(),0);}
    await page.close();
    console.log('PASS: identity/cancellation/shuffle, single and multiple ballots, replacement/reload, suggestions, locked/expired/empty polls, refresh recovery, account isolation, 16 visual variants, large Greek text, marketing routes.');
  } finally {await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
