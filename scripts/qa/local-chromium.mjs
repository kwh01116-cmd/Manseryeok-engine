import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const browserBinary=[process.env.CHROME_BIN,'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
assert.ok(browserBinary,'Real Chromium required; no fallback to DOM emulation');

export async function connectBrowser(profile,onSpawn,evidence){
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
