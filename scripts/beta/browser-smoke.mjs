/** Actual fixture-only Chromium study. All submitted responses are synthetic QA inputs. */
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readdir,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {once} from 'node:events';
import {connectBrowser} from '../qa/local-chromium.mjs';
import {createBetaWeb} from './web.mjs';
import {buildStudyMaterials} from './materials.mjs';

const args=process.argv.slice(2);
assert.equal(process.versions.node.split('.')[0],'22');
assert.ok(args.length===4&&args[0]==='--data-pack'&&args[2]==='--evidence-dir','Expected --data-pack PATH --evidence-dir NEW_PRIVATE_DIRECTORY');
const evidence=resolve(args[3]);
await mkdir(evidence,{mode:0o700});
const state=await mkdtemp(join(tmpdir(),'saju-s9-browser-study-'));
const profile=await mkdtemp(join(tmpdir(),'saju-s9-browser-profile-'));
const screenshots=[], verified=[];
let app,browser;

async function allocatedBytes(dir){
  let bytes=0;
  for(const name of await readdir(dir)){
    const item=join(dir,name),stat=await lstat(item);
    if(stat.isFile())bytes+=stat.size;
    else if(stat.isDirectory())bytes+=await allocatedBytes(item);
  }
  return bytes;
}
async function capture(name){await browser.capture(name);screenshots.push(name);}
async function enter(role,fixtureId){
  const invite=await app.operator.issue({role,fixtureId});
  // Token remains in memory and is cleared by the page before consent is displayed.
  await browser.evaluate("document.getElementById('invite').focus()");
  await browser.send('Input.insertText',{text:invite.token});
  await browser.click('enter-btn');
  await browser.until("document.getElementById('consent-check') && !document.getElementById('main').hasAttribute('aria-busy')",'consent required');
  assert.equal(await browser.evaluate("document.getElementById('invite').value"),'');
  const keys=await browser.evaluate("(async()=>Object.keys(await(await fetch('/api/beta/me')).json()))()");
  assert.ok(!keys.includes('report')&&!keys.includes('comparison')&&!keys.includes('feedback'));
  await browser.click('consent-check');await browser.click('consent');
}
async function fillRequired(){
  // Submit intentionally artificial answers only. No human satisfaction data is collected here.
  await browser.evaluate(`(()=>{
    for(const control of document.querySelectorAll('[data-question]')){
      const label=control.labels[0];
      if(control.disabled||!label.textContent.includes('(필수)'))continue;
      if(control.tagName==='SELECT'){
        control.value=Array.from(control.options).find(o=>['응답 보류','구별하기 어려움','INSUFFICIENT_EVIDENCE'].includes(o.value))?.value||control.options[1].value;
      }else{control.value='자동 점검용 합성 응답';}
    }
  })()`);
}
async function withdraw(){
  await browser.evaluate("document.querySelector('.study-footer').open=true");
  const dialog=new Promise((ok,no)=>{
    const timeout=setTimeout(()=>{browser.socket.removeEventListener('message',handle);no(new Error('WITHDRAW_DIALOG_TIMEOUT'));},5000);
    function handle(e){
      if(JSON.parse(e.data).method!=='Page.javascriptDialogOpening')return;
      clearTimeout(timeout);browser.socket.removeEventListener('message',handle);
      browser.send('Page.handleJavaScriptDialog',{accept:true}).then(ok,no);
    }
    browser.socket.addEventListener('message',handle);
  });
  await Promise.all([dialog,browser.click('withdraw')]);
  await browser.until("!document.getElementById('welcome').hidden && !document.getElementById('main').hasAttribute('aria-busy')",'withdrawal return');
  assert.equal(await browser.evaluate("(async()=>(await fetch('/api/beta/me')).status)()"),401);
}
async function viewport(width,height,mobile){
  await browser.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Horizontal overflow at '+width);
}
try {
  const materials=await buildStudyMaterials({dataDirectory:resolve(args[1])});
  assert.ok(materials.fixtures.length>=24&&materials.diagnostics.blindEligible.length>0);
  app=await createBetaWeb({directory:state,materials,mode:'INTERNAL_QA'});
  const origin=await app.listen(0);
  browser=await connectBrowser(profile,child=>{browser={child};},evidence);browser.setOrigin(origin);
  const {send,evaluate,until,click}=browser;
  await send('Fetch.enable',{patterns:[{urlPattern:'http*',requestStage:'Request'}]});
  await send('Page.navigate',{url:origin+'/'});
  await until("document.getElementById('invite') && performance.getEntriesByType('resource').some(x=>x.name.endsWith('/api/beta/me'))",'signed-out study');
  await viewport(1280,900,false);await capture('01-entry.png');
  await enter('READER',materials.diagnostics.blindEligible[0]);
  await until("document.querySelectorAll('[data-question=blindSpecificity]').length===3",'three masked readings');
  const blind=await evaluate(`(async()=>{
    const s=await(await fetch('/api/beta/me')).json();
    return {packetKeys:Object.keys(s.comparison).sort(),slots:s.comparison.readings.map(r=>Object.keys(r).sort()),
      other:['report','fixtureId','debrief','blindOrder','claimIds','origin','sources'].filter(k=>k in s)};
  })()`);
  assert.deepEqual(blind,{packetKeys:['context','readings'],slots:Array(3).fill(['slot','text']),other:[]});
  await capture('02-reader-blind.png');
  await viewport(390,844,true);await capture('03-reader-mobile.png');
  await viewport(320,740,true);await viewport(1280,900,false);
  // Benign markup checks text rejection; no executable payload is used.
  await evaluate("document.querySelector('[data-question=blindReason]').value='<b>합성</b>'");
  await click('save');await until("document.getElementById('error').textContent.length>0",'invalid free text');
  assert.equal(await evaluate("(async()=>(await(await fetch('/api/beta/me')).json()).feedback.length)()"),0);
  await fillRequired();await click('save');
  await until("document.getElementById('notice').textContent.includes('저장했습니다')",'draft saved');
  const duplicate=await evaluate(`(async()=>{
    const s=await(await fetch('/api/beta/me')).json();
    const {feedbackId,questionId,targetId,value}=s.feedback[0];
    const response=await(await fetch('/api/beta/answer',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':s.csrfToken},body:JSON.stringify({questionId,targetId,value})})).json();
    const after=await(await fetch('/api/beta/me')).json();
    return {status:response.status,same:response.feedbackId===feedbackId,count:after.feedback.length===s.feedback.length};
  })()`);
  assert.deepEqual(duplicate,{status:'DUPLICATE',same:true,count:true});
  await send('Page.reload',{ignoreCache:true});
  await until("document.querySelector('[data-question=blindReason]')?.value==='자동 점검용 합성 응답'",'draft restored');
  await click('lock');await until("document.getElementById('ch6') && !document.getElementById('main').hasAttribute('aria-busy')",'locked response, full report');
  const middle=await evaluate("(async()=>{const s=await(await fetch('/api/beta/me')).json();return [s.blindLocked,s.completed,s.report.chapters.length,'debrief'in s,'claims'in s.report];})()");
  assert.deepEqual(middle,[true,false,6,false,false]);await capture('04-reader-report.png');
  await fillRequired();await click('finish');
  await until("document.getElementById('debrief') && !document.getElementById('main').hasAttribute('aria-busy')",'debrief at completion');
  assert.equal(await evaluate("document.querySelectorAll('#debrief p').length"),4);
  const cookies=(await send('Network.getCookies',{urls:[origin]})).cookies;
  assert.ok(cookies.length===1&&cookies.every(c=>c.httpOnly&&c.sameSite==='Strict'));
  assert.equal(await evaluate("document.cookie"),'');
  assert.deepEqual(await evaluate("[localStorage.length,sessionStorage.length,location.search]"),[0,0,'']);
  await capture('05-reader-debrief.png');
  const readerRows=await app.operator.exportFeedback();
  assert.equal(readerRows.humanParticipantCount,0);assert.equal(readerRows.records.length,1);
  assert.equal(readerRows.records[0].completed,true);
  const readerAnswers=readerRows.records[0].answers.length;
  const readerStorage=await allocatedBytes(state);
  await withdraw();assert.equal((await app.operator.exportFeedback()).records.length,0);
  verified.push('READER_MASKED_THEN_LOCKED_THEN_SIX_CHAPTERS_THEN_DEBRIEF','DUPLICATE_ANSWER_REUSES_RECEIPT','DRAFT_RELOAD_WITH_SAME_COOKIE','SAFE_TEXT_REJECTED','READER_ANSWERS_DELETED');
  const example=materials.fixtures.find(f=>f.claims.length===4);
  await enter('EXPERT',example.id);
  await until("document.querySelectorAll('[data-question=factMatch]').length===4",'expert evaluation per actual claim');
  assert.deepEqual(await evaluate("(async()=>{const s=await(await fetch('/api/beta/me')).json();return [s.role,s.report.claims.length,!!s.report.sources,s.feedback.length];})()"),['EXPERT',4,true,0]);
  for(const [width,height,mobile,name] of [[390,844,true,'06-expert-claim-mobile.png'],[1280,900,false,'07-expert-claim.png']]){
    await viewport(width,height,mobile);
    await evaluate("document.querySelector('[data-question=factMatch]').closest('section').scrollIntoView({behavior:'instant',block:'start'})");
    await until("Math.abs(document.querySelector('[data-question=factMatch]').closest('section').getBoundingClientRect().top)<32",'expert claim in viewport');
    await capture(name);
  }
  await fillRequired();await click('finish');await until("document.getElementById('finish')===null && document.querySelector('[data-question=factMatch]')?.disabled",'expert review saved');
  const expertRows=await app.operator.exportFeedback();
  assert.equal(expertRows.records.length,1);assert.ok(expertRows.records[0].completed);
  const expertAnswers=expertRows.records[0].answers.length;
  await withdraw();
  assert.equal((await app.operator.exportFeedback()).records.length,0);
  assert.equal(await evaluate("(async()=>(await fetch('/api/live/orders')).status)()"),403);
  assert.equal(await evaluate("(async()=>(await fetch('/api/admin')).status)()"),403);
  verified.push('EXPERT_FOUR_CLAIMS_WITH_EIGHT_DIMENSIONS','ROLES_AND_RESPONSES_ISOLATED','EXPERT_ANSWERS_DELETED','LIVE_AND_ADMIN_DENIED','HTTPONLY_LOCAL_ONLY');
  assert.deepEqual(browser.exceptions,[]);assert.deepEqual(browser.blocked,[]);assert.ok(browser.requests.every(r=>r.url.startsWith(origin+'/')));
  const receipt={status:'PASS',dataClass:'SYNTHETIC_INTERNAL_QA',humanExperts:0,humanReaders:0,node:process.version,
    chromium:(await send('Browser.getVersion')).product,verified,screenshots,
    readerAnswers,expertAnswers,exportRowsAfterWithdrawal:0,readerStudyStorageBytes:readerStorage,
    server:app.metrics(),browserRequests:browser.requests.length,externalPageRequests:0,
    meaning:'Instrument and rendering exercise only. QA responses have no consumer or expert evidentiary value.'};
  await writeFile(join(evidence,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:'PASS',screenshots:screenshots.length,readerAnswers,expertAnswers,humanParticipants:0}));
} catch(error) {
  // CDP evaluation errors can contain in-memory expressions. Keep diagnostics generic.
  await writeFile(join(evidence,'failure.json'),JSON.stringify({status:'FAILED',lastScreenshot:screenshots.at(-1)??null,
    reason:error.code==='ERR_ASSERTION'?'ASSERTION_FAILED':String(error.message).startsWith('Browser condition not reached:')?error.message:'BROWSER_CHECK_FAILED'})+'\n',{flag:'wx'});
  throw error;
} finally {
  try {
    if(browser?.child) {
      const child=browser.child;
      const stopped=child.exitCode!==null||child.signalCode!==null;
      if(!stopped && child.pid){
        const exit=once(child,'exit');
        const timeout=setTimeout(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill();},5000);
        try{await browser.send?.('Browser.close').catch(()=>{});browser.socket?.close();await exit;}finally{clearTimeout(timeout);}
      }
    }
  } finally {
    await app?.close();
    await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});
    await rm(state,{recursive:true,force:true,maxRetries:10,retryDelay:200});
  }
}
