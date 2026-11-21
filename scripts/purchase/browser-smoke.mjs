/** Real Chromium + actual private offline engine. No mocked charts, PG, LLM, or external request. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createPurchaseWeb} from './web.mjs';
import {loadPurchaseEnginePorts} from './service.mjs';
import {allowedSmokeRequest} from '../browser-request-policy.mjs';
import {SPRINT6_REPORT_CASES} from '../../test/fixtures/sprint6-report-cases-v1.mjs';

const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){assert.ok(['--data-pack','--evidence-dir'].includes(args[i])&&args[i+1]&&!options[args[i]],'Explicit data pack and evidence directory required');options[args[i]]=args[i+1];}
assert.ok(options['--data-pack']&&options['--evidence-dir']);
assert.equal(process.versions.node.split('.')[0],'22');
const evidence=resolve(options['--evidence-dir']);
// Same 369-byte native Chromium time icon pinned in browser-request-policy.mjs.
// Here an external stylesheet rather than an inline stylesheet is its initiator.
const nativeTimeIcon=request=>{
 const prefix='data:image/svg+xml;base64,';
 if(request.type!=='Image'||!request.url.startsWith(prefix)||request.url.length>1024)return false;
 const bytes=Buffer.from(request.url.slice(prefix.length),'base64');
 return bytes.length===369&&createHash('sha256').update(bytes).digest('hex')==='6f2cf0c99091af44641cb27eee6a0f32a56aa85f446f60a9482864f2ade413d4';
};
const browserBinary=[process.env.CHROME_BIN,'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
assert.ok(browserBinary,'Real Chromium required; no fallback to DOM emulation');

async function connectBrowser(profile,onSpawn){
 const child=spawn(browserBinary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});onSpawn(child);let port,spawnError;
 child.once('error',error=>{spawnError=error;});
 for(let i=0;i<150;i++){if(spawnError)throw spawnError;if(child.exitCode!==null)throw new Error('Owned browser exited during startup');try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(port>0)break;}catch{}await pause(100);}
 assert.ok(port,'Chromium CDP startup');
 let target;for(let i=0;i<40;i++){try{target=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(t=>t.type==='page'&&t.webSocketDebuggerUrl);if(target)break;}catch{}await pause(100);}assert.ok(target,'Chromium page target');
 const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true});});
 let sequence=0,origin=null;const pending=new Map(),requests=[],blocked=[],exceptions=[];
 const send=(method,params={})=>new Promise((ok,no)=>{const id=++sequence,timeout=setTimeout(()=>{pending.delete(id);no(new Error('CDP timed out: '+method));},15000);pending.set(id,{ok,no,timeout});socket.send(JSON.stringify({id,method,params}));});
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Network.requestWillBeSent')requests.push({url:message.params.request.url,type:message.params.type,initiator:message.params.initiator});
  if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails.text);
  if(message.method==='Fetch.requestPaused'){const {requestId,request}=message.params;const allowed=origin&&request.url.startsWith(origin+'/');if(!allowed)blocked.push(new URL(request.url).protocol);send(allowed?'Fetch.continueRequest':'Fetch.failRequest',allowed?{requestId}:{requestId,errorReason:'BlockedByClient'}).catch(()=>{});}
  if(!message.id)return;const item=pending.get(message.id);if(!item)return;pending.delete(message.id);clearTimeout(item.timeout);message.error?item.no(new Error(JSON.stringify(message.error))):item.ok(message.result??{});
 });
 socket.addEventListener('close',()=>{for(const item of pending.values()){clearTimeout(item.timeout);item.no(new Error('Owned browser CDP closed'));}pending.clear();});
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error('Browser expression failed: '+JSON.stringify(result.exceptionDetails));return result.result?.value;};
 const until=async(expression,why)=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(75);}throw new Error('Browser condition not reached: '+why);};
 const click=async id=>{await evaluate(`(()=>{const b=document.getElementById(${JSON.stringify(id)});if(!b||b.disabled)throw new Error('Unavailable UI control');b.click();})()`);};
 const capture=async name=>{const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(evidence,name),Buffer.from(data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
 return {child,socket,send,evaluate,until,click,capture,requests,blocked,exceptions,setOrigin:value=>{origin=value;}};
}

await mkdir(evidence,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'saju-s8-browser-'));
const stateDirectory=join(evidence,'local-server-state');
let app,browser,failure,origin,port;const screenshots=[],verified=[];
const saveShot=async name=>{await browser.capture(name);screenshots.push(name);};
try{
 const ports=await loadPurchaseEnginePorts(resolve(options['--data-pack']));
 // A bounded delay in the real job lets the UI show the actual GENERATING state.
 const start=async n=>{app=await createPurchaseWeb({stateDirectory,ports,mode:'LOCAL_TEST_ONLY',faults:async phase=>{if(phase==='AFTER_START')await pause(450);}});origin=await app.listen(n);port=app.server.address().port;};
 await start(0);browser=await connectBrowser(profile,child=>{browser={child};});browser.setOrigin(origin);
 const {send,evaluate,until,click}=browser;
 await send('Fetch.enable',{patterns:[{urlPattern:'http*',requestStage:'Request'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:1365,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:origin+'/'});
 await until("document.querySelector('#intro-heading')&&document.querySelector('#error').classList.contains('hidden')&&!document.querySelector('#main').hasAttribute('aria-busy')",'product introduction');
 await until("performance.getEntriesByType('resource').some(x=>x.name.endsWith('/api/session'))",'server-issued session');
 assert.ok(await evaluate("document.body.textContent.includes('NOT_FOR_SALE_YET')"));await saveShot('01-product-desktop.png');
 await click('start-input');await click('fill-example');await saveShot('02-input-desktop.png');
 await click('calculate');await until("!document.getElementById('step-confirm').classList.contains('hidden')",'input confirmation');
 assert.ok(await evaluate("document.getElementById('confirmation').textContent.includes('2026-01-08')"));await saveShot('03-confirm-desktop.png');
 await click('confirm-input');await until("!document.getElementById('step-preview').classList.contains('hidden')",'free preview');
 assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('#preview-content .pillar strong'),n=>n.textContent)"),['乙巳','己丑','壬午','丙午']);await saveShot('04-preview-desktop.png');
 assert.equal(await evaluate("document.getElementById('test-checkout').disabled"),false);await click('test-checkout');
 await until("!document.getElementById('step-order').classList.contains('hidden')",'test order');await saveShot('05-test-checkout-desktop.png');
 await evaluate("document.querySelector('[data-payment=approve]').click()");
 await until("/생성 대기|생성 중|결과 검증 중|완료/u.test(document.getElementById('order-status').textContent)",'actual job status');await saveShot('06-generation-desktop.png');
 await until("!document.getElementById('read-report').classList.contains('hidden')",'actual S7 report completed');
 await evaluate("document.querySelector('[data-payment=duplicate]').click()");await until("!document.getElementById('main').hasAttribute('aria-busy')",'duplicate approval safely replayed');
 await click('read-report');await until("document.querySelectorAll('.report-chapter').length===6",'six S7 chapters');
 const reading=await evaluate("document.getElementById('report-content').textContent");assert.ok(reading.includes('역할')||reading.includes('관점'));assert.ok(reading.includes('제한적 해석'));
 const reportCheck=await evaluate(`(async()=>{const id=history.state.orderId,r=await(await fetch('/api/orders/'+encodeURIComponent(id)+'/report')).json();return {schema:r.schemaVersion,profile:r.reportProfile,sections:r.sections.sections.length,symbolic:r.sections.sections.flatMap(s=>s.blocks).filter(b=>b.kind==='SYMBOLIC_INTERPRETATION').length,claimRefs:r.sections.sections.flatMap(s=>s.blocks).filter(b=>b.kind==='SYMBOLIC_INTERPRETATION').every(b=>b.claimRefs.length>0&&b.policyRefs.length>0),historyId:id};})()`);
 assert.equal(reportCheck.sections,6);assert.equal(reportCheck.symbolic,4);assert.equal(reportCheck.claimRefs,true);const firstOrderId=reportCheck.historyId;
 await saveShot('07-report-desktop.png');verified.push('ACTUAL_S7_FOUR_SYMBOLIC_CLAIMS_SIX_CHAPTERS');
 await evaluate("document.querySelectorAll('#report-toc a')[2].click()");
 assert.equal(await evaluate("document.getElementById('step-report').classList.contains('hidden')"),false,'Chapter anchor must not navigate to product introduction');
 assert.equal(await evaluate("document.activeElement.id"),'report-chapter-3');verified.push('CHAPTER_TOC_SCROLL_PRESERVES_REPORT_ROUTE');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate("window.scrollTo({top:0,behavior:'instant'})");await saveShot('07b-report-mobile.png');
 for(const width of [320,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Report no overflow width '+width);}
 await send('Emulation.setDeviceMetricsOverride',{width:1365,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.reload',{ignoreCache:true});await until("document.querySelectorAll('.report-chapter').length===6&&!document.getElementById('step-report').classList.contains('hidden')",'refresh re-read');
 assert.equal(await evaluate("document.getElementById('report-content').textContent"),reading);verified.push('REFRESH_SAME_REPORT');
 await app.close();app=null;await start(port);browser.setOrigin(origin);
 await send('Page.reload',{ignoreCache:true});await until("document.querySelectorAll('.report-chapter').length===6&&!document.getElementById('step-report').classList.contains('hidden')",'restart re-read');
 assert.equal(await evaluate("document.getElementById('report-content').textContent"),reading);verified.push('SERVER_RESTART_SAME_COOKIE_SAME_STORED_REPORT');
 await click('open-library');await until("document.querySelectorAll('.library-card').length===1",'owned library');await saveShot('08-library-desktop.png');
 // An independent guest cannot inspect the first guest's order. Tokens remain only in memory.
 const cookies=(await send('Network.getCookies',{urls:[origin]})).cookies;assert.equal(cookies.length,1);assert.equal(cookies[0].httpOnly,true);assert.equal(cookies[0].sameSite,'Strict');
 await send('Network.clearBrowserCookies');
 const otherGuest=await evaluate(`(async()=>{await fetch('/api/session');const response=await fetch('/api/orders/'+${JSON.stringify(firstOrderId)});return response.status;})()`);assert.equal(otherGuest,404);
 await send('Network.clearBrowserCookies');const c=cookies[0];await send('Network.setCookie',{name:c.name,value:c.value,url:origin,path:c.path,httpOnly:c.httpOnly,secure:c.secure,sameSite:c.sameSite,expires:c.expires});
 await send('Page.reload',{ignoreCache:true});await until("document.querySelectorAll('.library-card').length===1",'original guest restored');verified.push('OTHER_GUEST_ORDER_404_HTTPONLY_SAMESITE_COOKIE');
 // Verify browser rendering and checkout blocking for real calendar exception cases.
 const ids=['WINTER_WOOD_CANDIDATE','WINTER_WOOD_PRESENT_FIRE_HOLD','MONTH_MAIN_DIRECT_WEALTH','LICHUN_CORRELATED_NATAL_PARENTS','DST_NONEXISTENT_CIVIL_TIME','DST_AMBIGUOUS_CIVIL_TIME','FUTURE_LUNAR_NEEDS_DATA','UNKNOWN_TIME_REQUIRES_INFORMATION'];
 const previews=[];
 for(const id of ids){const example=SPRINT6_REPORT_CASES.find(x=>x.id===id);assert.ok(example,id);await click('new-report');await click('fill-example');
  const r=example.request,date=r.date??`${r.lunarDate.lunarYear}-${String(r.lunarDate.lunarMonth).padStart(2,'0')}-${String(r.lunarDate.lunarDay).padStart(2,'0')}`;
  await evaluate(`(()=>{const values=${JSON.stringify({calendar:r.calendar,'birth-date':date,'birth-time':r.time??'','calendar-profile':r.calendarProfileId,'day-rollover':r.policies.dayRollover,'hour-reference':r.policies.hourStemReference})};for(const[id,value]of Object.entries(values)){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));}document.getElementById('unknown-time').checked=${r.time===null};document.getElementById('unknown-time').dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await click('calculate');await until("!document.getElementById('step-confirm').classList.contains('hidden')",'calendar review '+id);await click('confirm-input');await until("!document.getElementById('step-preview').classList.contains('hidden')",'calendar preview '+id);
  const actual=await evaluate("({pillars:Array.from(document.querySelectorAll('#preview-content .pillar strong'),n=>n.textContent),blocked:document.getElementById('test-checkout').disabled,text:document.getElementById('preview-content').textContent})");
  assert.equal(actual.blocked,!example.expected.canProvideTimedReport,id);assert.equal(actual.pillars.length,example.expected.natalParents*4,id);previews.push({id,checkoutBlocked:actual.blocked,natalParents:actual.pillars.length/4});
  if(id==='LICHUN_CORRELATED_NATAL_PARENTS')await saveShot('09-boundary-two-candidates.png');
  if(id==='DST_NONEXISTENT_CIVIL_TIME'){await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await saveShot('10-dst-gap-mobile.png');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await send('Emulation.setDeviceMetricsOverride',{width:1365,height:1000,deviceScaleFactor:1,mobile:false});}
 }
 // The existing engine rejects a 1950 date under the selected profile, without a fabricated chart.
 await click('new-report');await click('fill-example');await evaluate("document.getElementById('birth-date').value='1950-06-01';document.getElementById('birth-date').dispatchEvent(new Event('input',{bubbles:true}))");await click('calculate');
 await until("!document.getElementById('error').classList.contains('hidden')||!document.getElementById('step-confirm').classList.contains('hidden')",'1950 unsupported handling');
 assert.equal(await evaluate("!document.getElementById('step-order').classList.contains('hidden')"),false);verified.push('1950_NOT_NORMALIZED_INTO_SUPPORTED_BIRTH');
 // Return to the real completed order and simulate review, refund failure, retry and success.
 await click('open-library');await until("!document.getElementById('step-library').classList.contains('hidden')&&document.querySelector('.library-card')&&!document.getElementById('main').hasAttribute('aria-busy')",'library before refund');await evaluate("document.querySelector('.library-card .secondary').click()");await until("!document.getElementById('step-order').classList.contains('hidden')",'completed order reopened');
 await click('request-refund');await until("document.getElementById('order-status').textContent.includes('환불 요청됨')",'refund request');await click('fail-refund');await until("document.getElementById('order-status').textContent.includes('환불 실패')",'refund failure');
 await click('approve-refund');await until("document.getElementById('order-status').textContent.includes('테스트 환불 완료')",'refund retried successfully');assert.equal(await evaluate("document.getElementById('read-report').classList.contains('hidden')"),true);assert.equal(await evaluate("document.getElementById('order-status').textContent.includes('아래에서 저장된 결과를 열 수 있습니다.')"),false,'Refunded report must not be described as readable');assert.ok(await evaluate("document.getElementById('order-status').textContent.includes('열람은 제한됩니다')"));await saveShot('11-refund-desktop.png');verified.push('REFUND_FAILURE_RETRY_SUCCESS_ACCESS_REVOKED');
 for(const width of [320,390,768]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'No horizontal overflow width '+width);}
 await click('new-report');await click('fill-example');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await saveShot('12-input-mobile.png');
 await evaluate("document.getElementById('calendar-profile').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.ok(await evaluate("document.activeElement&&document.activeElement.id==='day-rollover'"));
 await send('Accessibility.enable');const ax=await send('Accessibility.getFullAXTree');assert.ok(ax.nodes.some(n=>!n.ignored&&n.name?.value==='생년월일'));assert.ok(ax.nodes.some(n=>!n.ignored&&n.name?.value==='입력 확인하기'));verified.push('RESPONSIVE_320_390_768_KEYBOARD_ACCESSIBLE_FORM');
 const storage=await evaluate("({local:localStorage.length,session:sessionStorage.length,visibleCookie:document.cookie,url:location.href})");assert.equal(storage.local,0);assert.equal(storage.session,0);assert.equal(storage.visibleCookie,'');assert.ok(!storage.url.includes('1992')&&!storage.url.includes('2026'));
 assert.deepEqual(browser.exceptions,[]);assert.deepEqual(browser.blocked,[]);assert.deepEqual(browser.requests.filter(r=>!allowedSmokeRequest(r,origin)&&!nativeTimeIcon(r)).map(r=>({protocol:new URL(r.url).protocol,path:new URL(r.url).pathname})),[]);
 const receipt={status:'PASS',runtime:process.versions.node,fictionalBirthsOnly:true,realCalendarEngine:true,realSprint7Pipeline:true,fakePaymentOnly:true,livePaymentAllowed:false,paidReportReady:false,shots:screenshots,verified,previews,externalRequests:0,blockedExternalRequests:0,nativeInlineTimeIconResources:browser.requests.filter(nativeTimeIcon).length,browserExceptions:0,storage:{local:0,session:0,visibleCookie:''},restart:{samePort:true,sameGuestCookie:true,sameReportText:true},scope:'Local TEST engineering, not operational PG/auth/DB or content sale approval'};
 await writeFile(join(evidence,'browser-receipt.json'),JSON.stringify(receipt,null,2)+'\n');process.stdout.write(JSON.stringify({status:'PASS',screenshots:screenshots.length,previewCases:previews.length,verified:verified.length})+'\n');
}catch(error){failure=error;await writeFile(join(evidence,'browser-failure.json'),JSON.stringify({status:'FAILED',message:error.message,shots:screenshots},null,2)+'\n').catch(()=>{});throw error;}
finally{
 try{if(browser){await browser.send?.('Browser.close').catch(()=>{});browser.socket?.close();const stopped=()=>!browser.child.pid||browser.child.exitCode!==null||browser.child.signalCode!==null;for(let i=0;i<50&&!stopped();i++)await pause(100);if(!stopped())browser.child.kill();for(let i=0;i<50&&!stopped();i++)await pause(100);assert.ok(stopped(),'Owned Chromium must stop');}await app?.close();await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});}catch(error){if(failure)throw new AggregateError([failure,error],'Browser and teardown failed');throw error;}
}
