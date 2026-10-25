/**
 * Dependency-free real-Chromium E2E for the private loopback V0 app.
 * Uses Node 22's built-in WebSocket + Chrome DevTools Protocol.
 * Do not point this browser harness at a public service or real birth records.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeKasiWebServer } from '../../.kasi-build/web.js';
import { WEB_TEST_KEY,webTestTransport } from '../../test/fixtures/kasi-web-synthetic.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const pickBrowser = () => [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
].find(path => path && existsSync(path));

async function launchBrowser(chrome, profile, origin) {
  const child = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, origin + '/',
  ], { stdio: 'ignore' });
  let port;
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error('Chromium exited during startup: ' + child.exitCode);
    try {
      const file = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
      port = Number(file.split('\n')[0]);
      if (port > 0) break;
    } catch { /* Browser starting. */ }
    await pause(100);
  }
  if (!port) throw new Error('Chromium CDP DevToolsActivePort was not created');
  let page;
  for (let i = 0; i < 40; i++) {
    try {
      const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      page = tabs.find(tab => tab.type === 'page' && tab.webSocketDebuggerUrl);
      if (page) break;
    } catch { /* Browser startup race. */ }
    await pause(100);
  }
  if (!page) throw new Error('No Chromium CDP page target');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const networkRequests = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if(message.method==='Network.requestWillBeSent')networkRequests.push(message.params.request.url);
    if (!message.id) return;
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    clearTimeout(item.timeout);
    if (message.error) item.reject(new Error(JSON.stringify(message.error)));
    else item.resolve(message.result ?? {});
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error('CDP timed out: ' + method));
    }, 10000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const output = await send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (output.exceptionDetails) {
      throw new Error('Browser JavaScript error: ' + JSON.stringify(output.exceptionDetails));
    }
    return output.result?.value;
  };
  const until = async (expression, why) => {
    for (let i = 0; i < 120; i++) {
      if (await evaluate(expression)) return;
      await pause(75);
    }
    throw new Error('Browser condition not reached: ' + why);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  return { child, socket, send, evaluate, until, networkRequests };
}

// End-to-end browser rendering with an injected SYNTHETIC upstream; no real KASI call.
async function run(){
 const chrome=pickBrowser();assert.ok(chrome,'Chromium is required');
 const profile=await mkdtemp(join(tmpdir(),'kasi-web-browser-'));
 const server=makeKasiWebServer({transport:webTestTransport()});let browser;
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
  browser=await launchBrowser(chrome,profile,origin);const {send,evaluate,until}=browser;await send('Network.enable');
  await until("!!document.getElementById('query-form')",'form');
  const submit=async(key=WEB_TEST_KEY)=>{
   await evaluate(`(()=>{const k=document.getElementById('key');k.value=${JSON.stringify(key)};k.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('submit').click();})()`);
   await until("!document.getElementById('submit').disabled",'response');
  };
  await submit();
  assert.equal(await evaluate("document.getElementById('key').value.length"),0);
  const result=await evaluate("JSON.parse(document.getElementById('output').textContent)");assert.equal(result.data.length,24);assert.equal(result.yearComplete,false);
  assert.ok(!JSON.stringify(result).includes(WEB_TEST_KEY));assert.equal(await evaluate("document.getElementById('download').disabled"),false);
  for(const width of [320,360,390]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:true});
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"),true);
  await evaluate("document.querySelector('summary').focus()");
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'char',key:'Enter',text:'\r',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('document.querySelector("details").open','keyboard details');
  await send('Accessibility.enable');const ax=await send('Accessibility.getFullAXTree');
  assert.ok(ax.nodes.some(n=>!n.ignored&&n.name?.value==='일반 인증키'));
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:profile});
  await evaluate("document.getElementById('download').click()");
  let downloaded;
  for(let i=0;i<50;i++){try{downloaded=await readFile(join(profile,'kasi-solar-2026.json'),'utf8');break;}catch{await pause(100);}}
  assert.ok(downloaded);assert.equal(JSON.parse(downloaded).data.length,24);assert.ok(!downloaded.includes(WEB_TEST_KEY));
  // An already-computed response arriving after an input edit must not restore old data.
  await evaluate(`(()=>{const base=window.fetch;window.fetch=async(...args)=>{const response=await base(...args);return new Promise(resolve=>{window.__release=()=>resolve(response);});};
   const k=document.getElementById('key');k.value=${JSON.stringify(WEB_TEST_KEY)};k.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('submit').click();})()`);
  await until("typeof window.__release==='function'",'delayed response');
  await evaluate("(()=>{const y=document.getElementById('year');y.value='1950';y.dispatchEvent(new Event('input',{bubbles:true}));window.__release();})()");
  await pause(100);assert.equal(await evaluate("document.getElementById('download').disabled"),true);
  assert.ok((await evaluate("document.getElementById('output').textContent")).includes('입력이 변경'));
  assert.equal(await evaluate('localStorage.length+sessionStorage.length'),0);assert.equal(await evaluate('document.cookie'), '');
  assert.ok(browser.networkRequests.every(url=>url.startsWith(origin)||url.startsWith('blob:'+origin)));
  process.stdout.write('PASS real Chromium KASI page with synthetic upstream: key clearing, 24 normalized rows, JSON download, 320/360/390px, keyboard disclosure/AX, reduced motion, stale response rejection, no browser persistence or external browser requests\n');
 }finally{
  browser?.socket.close();if(browser?.child.exitCode===null){const done=new Promise(r=>browser.child.once('exit',r));browser.child.kill('SIGTERM');await done;}
  server.closeAllConnections();await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
 }
}
run().catch(error=>{process.stderr.write(String(error)+'\n');process.exitCode=1;});
