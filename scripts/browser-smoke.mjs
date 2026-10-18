/**
 * Dependency-free real-Chromium E2E for the private loopback V0 app.
 * Uses Node 22's built-in WebSocket + Chrome DevTools Protocol.
 * Do not point this browser harness at a public service or real birth records.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeChartPreviewServer } from './chart-preview-web.mjs';

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
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
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
  return { child, socket, send, evaluate, until };
}

async function run() {
  const binary = pickBrowser();
  if (!binary) throw new Error('Real Chromium/Google Chrome binary is required; no mock browser fallback');
  const profile = await mkdtemp(join(tmpdir(), 'manseryeok-browser-smoke-'));
  const server = makeChartPreviewServer();
  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await launchBrowser(binary, profile, origin);
    const { send, evaluate, until } = browser;
    await send('Emulation.setDeviceMetricsOverride', {
      width: 360, height: 780, deviceScaleFactor: 1, mobile: true,
    });
    await until("document.readyState === 'complete' && !!document.getElementById('birth-form')",
      'V0 app loaded over real localhost HTTP');
    assert.equal(await evaluate("document.querySelectorAll('.candidate').length"), 0);
    assert.equal(await evaluate("document.querySelectorAll('.fact-chapter').length"),0);
    assert.equal(await evaluate("document.querySelector('#rollover').value"), '');

    // First computation uses real HTML form submission, native browser fetch and live Node API.
    await evaluate("document.getElementById('example').click(); document.querySelector('#birth-form button[type=submit]').click()");
    await until("document.querySelectorAll('.candidate').length === 1", 'Gregorian chart rendered');
    const primary = await evaluate("Array.from(document.querySelectorAll('.candidate .pillar strong'), e => e.textContent)");
    assert.deepEqual(primary.slice(0, 2), ['丁未', '壬寅']);
    assert.equal(primary.length, 4);
    await until("document.querySelectorAll('.candidate .fact-chapter').length === 2",
      'U1 EP1 day-master and EP2 month-branch chapters');
    const ep1 = await evaluate("document.querySelector('.candidate .fact-chapter:not(.month-chapter)').textContent");
    assert.match(ep1,/나의 일간/);
    assert.match(ep1,/전통 명리의 분류/);
    assert.ok(ep1.includes('preview.candidates[0].day.stem'));
    assert.equal(await evaluate("document.querySelector('.fact-chapter:not(.month-chapter) .fact-glyph').textContent"),
      primary[2].slice(0,1));
    const ep2 = await evaluate("document.querySelector('.month-chapter').textContent");
    assert.match(ep2,/월지는 어떻게 정해질까요/);
    assert.match(ep2,/음력 초하루가 아니라/);
    assert.ok(ep2.includes('preview.candidates[0].month.branch'));
    assert.equal(await evaluate("document.querySelector('.month-chapter .fact-glyph').textContent"),primary[1].slice(1));
    const primaryJie = await evaluate("document.querySelector('.applied-jie').textContent");
    assert.match(primaryJie,/입춘\(立春\).*2027-02-04 10:46 \(한국 표준시 · KST 발표 분\)/);
    assert.match(primaryJie,/이 적용 절기 이벤트의 출처: KR-KASI-CALENDAR-DATA/);
    assert.ok(primaryJie.includes('preview.candidates[0].month'));
    assert.ok(primaryJie.includes('preview.monthBoundaryTrace.candidateContexts[0]'));

    // U1 EP0 evidence is a native accessible disclosure; provenance comes from the engine DTO.
    assert.equal(await evaluate("document.querySelector('#calculation-evidence')?.open"), false);
    await send('Page.bringToFront');
    await evaluate("document.querySelector('#calculation-evidence summary').focus()");
    assert.equal(await evaluate("document.activeElement === document.querySelector('#calculation-evidence summary')"), true);
    const enter = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13 };
    // CDP rawKeyDown alone does not activate native <summary>: Chrome needs the
    // corresponding char event. Reproduced with a real Chromium/CDP local probe.
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...enter });
    await send('Input.dispatchKeyEvent', { type: 'char', text: '\r', ...enter });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...enter });
    await until("document.querySelector('#calculation-evidence')?.open === true",
      'Keyboard Enter opens calculation evidence');
    const evidence = await evaluate("document.querySelector('#calculation-evidence').textContent");
    assert.match(evidence, /KR-KASI-CALENDAR-DATA/);
    assert.match(evidence, /자정\(00:00\)/);
    assert.match(evidence, /분 단위/);
    assert.doesNotMatch(evidence, /공식 인증 완료/);
    assert.match(evidence,/검증에 사용한 절기 자료의 출처 집합/);

    // Gregorian and equivalent Korean-lunar births produce identical four pillars.
    await evaluate(`(() => {
      const form=document.getElementById('birth-form');
      const lunar=form.querySelector('input[value="KOREAN_LUNAR"]');
      lunar.checked=true;lunar.dispatchEvent(new Event('change',{bubbles:true}));
      const date=document.getElementById('birth-date');date.value='2026-12-29';
      date.dispatchEvent(new Event('input',{bubbles:true}));
      form.querySelector('button[type=submit]').click();
    })()`);
    await until("document.querySelectorAll('.candidate').length === 1", 'Korean lunar chart rendered');
    const fromLunar = await evaluate("Array.from(document.querySelectorAll('.candidate .pillar strong'),e=>e.textContent)");
    assert.deepEqual(fromLunar, primary);
    assert.equal(await evaluate("document.querySelectorAll('.fact-chapter').length"),2);
    assert.equal(await evaluate("document.querySelector('.fact-chapter:not(.month-chapter) .fact-glyph').textContent"),
      primary[2].slice(0,1));
    assert.equal(await evaluate("document.querySelector('.month-chapter .fact-glyph').textContent"),primary[1].slice(1));
    assert.match(await evaluate("document.querySelector('#calculation-evidence').textContent"),
      /음력 변환.*KR-KASI-CALENDAR-DATA/);
    assert.equal(await evaluate("document.querySelector('.applied-jie').textContent"),primaryJie);

    // Boundary minute must preserve both correlated year/month candidates.
    await evaluate(`(() => {
      const form=document.getElementById('birth-form');
      const solar=form.querySelector('input[value="GREGORIAN"]');
      solar.checked=true;solar.dispatchEvent(new Event('change',{bubbles:true}));
      const date=document.getElementById('birth-date');date.value='2027-02-04';
      date.dispatchEvent(new Event('input',{bubbles:true}));
      const clock=document.getElementById('birth-time');clock.value='10:46';
      clock.dispatchEvent(new Event('input',{bubbles:true}));
      form.querySelector('button[type=submit]').click();
    })()`);
    await until("document.querySelectorAll('.candidate').length === 2", 'Lichun two candidates');
    await until("document.querySelectorAll('.candidate .fact-chapter').length === 4",
      'Lichun separate U1 EP1 and EP2 candidate chapters');
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.fact-chapter:not(.month-chapter) .fact-evidence'),e=>e.textContent)"),
      ['계산 근거: preview.candidates[0].day.stem · 검증된 U0 사실 매핑',
       '계산 근거: preview.candidates[1].day.stem · 검증된 U0 사실 매핑']);
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.candidate .pillar:first-child strong'),e=>e.textContent)"),
      ['丙午', '丁未']);
    assert.match(await evaluate("document.querySelector('#calculation-evidence').textContent"),
      /두 후보 모두 검토/);
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.candidate .month-chapter .fact-evidence'),e=>e.textContent.includes('preview.candidates[0].month.branch') ? 0 : e.textContent.includes('preview.candidates[1].month.branch') ? 1 : -1)"),[0,1]);
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.candidate .month-chapter .fact-glyph'),e=>e.textContent)"),
      await evaluate("Array.from(document.querySelectorAll('.candidate .pillar:nth-child(2) strong'),e=>e.textContent.slice(1))"));
    assert.ok((await evaluate("document.querySelector('.candidate .month-chapter').textContent")).includes('달라질 수 있습니다'));
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.candidate .applied-jie .jie-minute'),e=>e.textContent)"),
      ['소한(小寒) · 2027-01-05 23:10 (한국 표준시 · KST 발표 분)',
       '입춘(立春) · 2027-02-04 10:46 (한국 표준시 · KST 발표 분)']);
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.applied-jie .jie-side'),e=>e.textContent)"),
      ['절입 발표 분 이전 후보','절입 발표 분 이후 후보']);
    for(const [i,text] of (await evaluate("Array.from(document.querySelectorAll('.applied-jie'),e=>e.textContent)")).entries()){
      assert.ok(text.includes(`preview.candidates[${i}].month`));
      assert.ok(text.includes(`preview.monthBoundaryTrace.candidateContexts[${i}]`));
      assert.match(text,/분 단위 자료라 실제 초 시각에 따라 달라질 수 있습니다/);
      assert.match(text,/현재 경계: 입춘\(立春\).*2027-02-04 10:46/);
    }
    // Measure successful boundary cards with their longer per-event references.
    for(const width of [360,390]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:true});
      const measured=await evaluate('({innerWidth,scrollWidth:document.documentElement.scrollWidth})');
      assert.ok(measured.scrollWidth<=measured.innerWidth+1,'Applied Jie overflow at '+width+'px');
    }

    // Input edits invalidate old candidates. Out-of-coverage dates cannot produce a story.
    await evaluate(`(() => {
      const date=document.getElementById('birth-date');date.value='2028-01-01';
      date.dispatchEvent(new Event('input',{bubbles:true}));
    })()`);
    assert.equal(await evaluate("document.querySelectorAll('.candidate').length"), 0);
    assert.match(await evaluate("document.querySelector('#output').textContent"), /다시 계산/);
    await evaluate("document.querySelector('#birth-form button[type=submit]').click()");
    await until("!!document.querySelector('#output .error')", 'out-of-coverage error');
    assert.match(await evaluate("document.querySelector('#output .error').textContent"), /범위를 벗어납니다/);
    assert.equal(await evaluate("document.querySelector('#calculation-evidence')"), null);
    assert.equal(await evaluate("document.querySelectorAll('.fact-chapter').length"),0);
    assert.equal(await evaluate("document.querySelectorAll('.applied-jie').length"),0);

    // Mobile source/error layout must fit and expose native focusable controls.
    for (const width of [360, 390]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width, height: 800, deviceScaleFactor: 1, mobile: true,
      });
      const measured = await evaluate('({innerWidth,scrollWidth:document.documentElement.scrollWidth})');
      assert.ok(measured.scrollWidth <= measured.innerWidth + 1,
        'Horizontal overflow at ' + width + 'px: ' + JSON.stringify(measured));
    }
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    assert.equal(await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"), true);

    // All six live HTTP before/at/after vectors, including month-only ambiguity.
    for(const [date,clock,terms] of [
      ['2027-02-04','10:45',['소한']],['2027-02-04','10:46',['소한','입춘']],['2027-02-04','10:47',['입춘']],
      ['2027-03-06','04:39',['입춘']],['2027-03-06','04:40',['입춘','경칩']],['2027-03-06','04:41',['경칩']],
    ]){
      await evaluate(`(() => {
        document.getElementById('example').click();
        const date=document.getElementById('birth-date');date.value=${JSON.stringify(date)};
        date.dispatchEvent(new Event('input',{bubbles:true}));
        const clock=document.getElementById('birth-time');clock.value=${JSON.stringify(clock)};
        clock.dispatchEvent(new Event('input',{bubbles:true}));
        document.querySelector('#birth-form button[type=submit]').click();
      })()`);
      await until(`document.querySelectorAll('.applied-jie').length === ${terms.length}`,'S4 '+date+' '+clock);
      const texts=await evaluate("Array.from(document.querySelectorAll('.applied-jie .jie-minute'),e=>e.textContent)");
      terms.forEach((term,i)=>assert.ok(texts[i].startsWith(term+'('),date+' '+clock));
    }

    // Tamper only with copies of actual live responses to test client consistency gates.
    for(const mutation of [
      "data.story.candidates[0].beats.find(b=>b.type==='MONTH_APPLIED_JIE_CONTEXT').factRef='preview.candidates[1].month'",
      "data.story.candidates[0].beats.find(b=>b.type==='MONTH_APPLIED_JIE_CONTEXT').activeSince.sourceIds=['FORGED']",
    ]){
      await evaluate(`(() => {
        window.__smokeFetch=window.fetch;
        window.fetch=async (...args)=>{
          const response=await window.__smokeFetch(...args);const data=await response.json();
          ${mutation};return new Response(JSON.stringify(data),{status:response.status});
        };
        document.getElementById('example').click();document.querySelector('#birth-form button[type=submit]').click();
      })()`);
      await until("!!document.querySelector('#output .error')",'S4 rejects mismatched response');
      assert.equal(await evaluate("document.querySelector('#output').textContent"),'명식과 사실 설명의 기준이 일치하지 않습니다.');
      assert.equal(await evaluate("document.querySelectorAll('.candidate,.applied-jie').length"),0);
      await evaluate("window.fetch=window.__smokeFetch;delete window.__smokeFetch");
    }

    // Older v1 responses without the optional trace still show their original chapters.
    await evaluate(`(() => {
      window.__smokeFetch=window.fetch;
      window.fetch=async (...args)=>{
        const response=await window.__smokeFetch(...args);const data=await response.json();
        delete data.preview.monthBoundaryTrace;
        for(const candidate of data.story.candidates) candidate.beats=candidate.beats.filter(b=>b.type!=='MONTH_APPLIED_JIE_CONTEXT');
        return new Response(JSON.stringify(data),{status:response.status});
      };
      document.getElementById('example').click();document.querySelector('#birth-form button[type=submit]').click();
    })()`);
    await until("document.querySelectorAll('.candidate').length===1",'S4 legacy optional trace');
    assert.equal(await evaluate("document.querySelectorAll('.fact-chapter').length"),2);
    assert.equal(await evaluate("document.querySelectorAll('.applied-jie').length"),0);
    await evaluate("window.fetch=window.__smokeFetch;delete window.__smokeFetch");

    // Even a mutually consistent injected source string must render as text, never HTML.
    await evaluate(`(() => {
      window.__smokeFetch=window.fetch;
      window.fetch=async (...args)=>{
        const response=await window.__smokeFetch(...args);const data=await response.json();
        const text='<img src=x onerror="window.__unsafeJie=true">';
        data.preview.solarTermSourceIds.push(text);
        data.preview.monthBoundaryTrace.candidateContexts[0].activeSince.sourceIds=[text];
        data.story.candidates[0].beats.find(b=>b.type==='MONTH_APPLIED_JIE_CONTEXT').activeSince.sourceIds=[text];
        return new Response(JSON.stringify(data),{status:response.status});
      };
      document.getElementById('example').click();document.querySelector('#birth-form button[type=submit]').click();
    })()`);
    await until("document.querySelectorAll('.applied-jie').length===1",'S4 text-only source rendering');
    assert.ok((await evaluate("document.querySelector('.jie-source').textContent")).includes('<img src=x'));
    assert.equal(await evaluate("document.querySelectorAll('#output img').length"),0);
    assert.equal(await evaluate("window.__unsafeJie===undefined"),true);
    await evaluate("window.fetch=window.__smokeFetch;delete window.__smokeFetch");

    // A response completed after input edits cannot restore stale event evidence.
    await evaluate(`(() => {
      window.__smokeFetch=window.fetch;
      window.fetch=async (...args)=>{
        const response=await window.__smokeFetch(...args);
        await new Promise(resolve=>{window.__releaseSmokeResponse=resolve;});
        return response;
      };
      document.getElementById('example').click();document.querySelector('#birth-form button[type=submit]').click();
    })()`);
    await until("typeof window.__releaseSmokeResponse==='function'",'S4 delayed live response');
    await evaluate(`(async () => {
      const date=document.getElementById('birth-date');date.value='2028-01-01';
      date.dispatchEvent(new Event('input',{bubbles:true}));
      window.__releaseSmokeResponse();window.fetch=window.__smokeFetch;
      delete window.__releaseSmokeResponse;delete window.__smokeFetch;
      await new Promise(resolve=>setTimeout(resolve,100));
    })()`);
    assert.equal(await evaluate("document.querySelectorAll('.candidate,.applied-jie').length"),0);
    assert.match(await evaluate("document.querySelector('#output').textContent"),/다시 계산/);
    process.stdout.write('PASS real-Chromium V0/U1 EP0+EP1+EP2 + M1 S4 applied-Jie smoke: live HTTP, Gregorian/lunar parity, Lichun/Jingzhe before-at-after, candidate-specific KST/source refs, keyboard, coverage, 360/390px, reduced-motion, forged/legacy responses, text-only rendering, stale-response rejection\n');
  } finally {
    if (browser) {
      try { browser.socket.close(); } catch { /* teardown */ }
      browser.child.kill();
    }
    await new Promise(resolve => server.close(resolve));
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
