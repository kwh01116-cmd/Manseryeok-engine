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
    await send('Network.enable');
    const checkEp3 = async expected => {
      const chapters=await evaluate(`Array.from(document.querySelectorAll('[data-chapter="ep3"]'),section=>({
        index:Number(section.dataset.candidateIndex),text:section.textContent,
        glyphs:Array.from(section.querySelectorAll('.glyph-symbol'),e=>e.textContent),
        elements:Array.from(section.querySelectorAll('.glyph-element'),e=>e.textContent),
        facts:Array.from(section.querySelectorAll('.glyph-proof'),e=>({ref:e.dataset.factRef,
          label:e.getAttribute('aria-label'),controls:e.getAttribute('aria-controls'),
          width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),
        rows:Array.from(section.querySelectorAll('tbody th'),e=>e.textContent),
      }))`);
      assert.equal(chapters.length,expected.length);
      const labels={甲:'목(木)',乙:'목(木)',丙:'화(火)',丁:'화(火)',戊:'토(土)',己:'토(土)',庚:'금(金)',辛:'금(金)',壬:'수(水)',癸:'수(水)',
        子:'수(水)',丑:'토(土)',寅:'목(木)',卯:'목(木)',辰:'토(土)',巳:'화(火)',午:'화(火)',未:'토(土)',申:'금(金)',酉:'금(金)',戌:'토(土)',亥:'수(水)'};
      for(const [i,chapter] of chapters.entries()){
        assert.equal(chapter.index,i);assert.deepEqual(chapter.glyphs,expected[i]);
        assert.deepEqual(chapter.elements,expected[i].map(glyph=>labels[glyph]));
        assert.deepEqual(chapter.rows,['연주','월주','일주','시주']);
        assert.match(chapter.text,/글자의 개수만으로 기운의 강약이나 길흉을 판단하지 않습니다/);
        assert.equal(chapter.facts.length,8);
        for(const [j,fact] of chapter.facts.entries()){
          const role=['year','month','day','hour'][Math.floor(j/2)],kind=j%2===0?'STEM':'BRANCH';
          assert.equal(fact.ref,`preview.candidates[${i}].${role}.${kind==='STEM'?'stem':'branch'}`);
          assert.equal(fact.controls,`ep3-proof-${i}-${role}-${kind}`);
          assert.ok(fact.label.includes('근거 확인'));assert.ok(fact.label.includes(expected[i][j]));
          assert.ok(fact.width>=44&&fact.height>=44,'EP3 tap target '+fact.ref);
        }
      }
      assert.equal(await evaluate("Array.from(document.querySelectorAll('.glyph-proof'),e=>!!document.getElementById(e.getAttribute('aria-controls'))).every(Boolean)"),true);
      return chapters;
    };
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
    assert.deepEqual(await evaluate("(() => { const s=getComputedStyle(document.querySelector('.month-chapter'));return {background:s.backgroundColor,border:s.borderTopColor}; })()"),
      {background:'rgb(247, 250, 246)',border:'rgb(207, 221, 208)'},'EP2 month chapter computed colors');
    assert.deepEqual(await evaluate("(() => { const s=getComputedStyle(document.querySelector('.fact-chapter:not(.month-chapter)'));return {background:s.backgroundColor,border:s.borderTopColor}; })()"),
      {background:'rgb(245, 247, 242)',border:'rgb(220, 227, 219)'},'EP1 generic chapter colors remain independent');
    const primaryJie = await evaluate("document.querySelector('.applied-jie').textContent");
    assert.match(primaryJie,/입춘\(立春\).*2027-02-04 10:46 \(한국 표준시 · KST 발표 분\)/);
    assert.match(primaryJie,/이 적용 절기 이벤트의 출처: KR-KASI-CALENDAR-DATA/);
    assert.ok(primaryJie.includes('preview.candidates[0].month'));
    assert.ok(primaryJie.includes('preview.monthBoundaryTrace.candidateContexts[0]'));
    const primaryGlyphs=primary.flatMap(label=>Array.from(label));
    await checkEp3([primaryGlyphs]);

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
    // EP3 buttons follow year stem -> year branch order and open the matching proof by keyboard.
    await evaluate("document.querySelector('.glyph-proof').focus()");
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    assert.equal(await evaluate("document.activeElement.dataset.factRef"),'preview.candidates[0].year.branch');
    await evaluate("document.querySelector('.glyph-proof').focus()");
    await send('Input.dispatchKeyEvent',{type:'rawKeyDown',...enter});
    await send('Input.dispatchKeyEvent',{type:'char',text:'\r',...enter});
    await send('Input.dispatchKeyEvent',{type:'keyUp',...enter});
    await until("document.querySelector('.glyph-evidence').open===true",'EP3 keyboard proof disclosure');
    assert.equal(await evaluate("document.activeElement.id"),'ep3-proof-0-year-STEM');
    assert.match(await evaluate("document.activeElement.textContent"),/preview\.candidates\[0\]\.year\.stem/);
    const glyphContext=await evaluate("document.querySelector('.glyph-context').textContent");
    assert.match(glyphContext,/CALCULATED_CLASSIFICATION_ONLY/);
    assert.match(glyphContext,/v0-korean-birth-chart-preview-v1/);
    assert.match(glyphContext,/자정\(00:00\)/);
    await send('Accessibility.enable');
    const ax=await send('Accessibility.getFullAXTree');
    assert.ok(ax.nodes.some(node=>!node.ignored&&node.role?.value==='table'&&node.name?.value==='후보 1의 천간·지지 여덟 글자'));
    assert.deepEqual(ax.nodes.filter(node=>!node.ignored&&node.role?.value==='rowheader').map(node=>node.name.value),['연주','월주','일주','시주']);
    assert.ok(ax.nodes.some(node=>!node.ignored&&node.role?.value==='button'&&node.name?.value==='연주 천간 정(丁) · 화(火) 근거 확인'));

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
    await checkEp3([primaryGlyphs]);

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
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('.month-chapter'),e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.borderTopColor];})"),
      [['rgb(247, 250, 246)','rgb(207, 221, 208)'],['rgb(247, 250, 246)','rgb(207, 221, 208)']]);
    for(const [i,text] of (await evaluate("Array.from(document.querySelectorAll('.applied-jie'),e=>e.textContent)")).entries()){
      assert.ok(text.includes(`preview.candidates[${i}].month`));
      assert.ok(text.includes(`preview.monthBoundaryTrace.candidateContexts[${i}]`));
      assert.match(text,/분 단위 자료라 실제 초 시각에 따라 달라질 수 있습니다/);
      assert.match(text,/현재 경계: 입춘\(立春\).*2027-02-04 10:46/);
    }
    const boundaryGlyphs=await evaluate("Array.from(document.querySelectorAll('.candidate'),c=>Array.from(c.querySelectorAll('.pillar strong'),e=>e.textContent).flatMap(s=>Array.from(s)))");
    await checkEp3(boundaryGlyphs);
    assert.equal(await evaluate("document.querySelectorAll('[data-chapter=ep3] .jie-caveat').length"),2);
    // Measure successful boundary cards with their longer per-event references.
    for(const width of [360,390]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:true});
      const measured=await evaluate('({innerWidth,scrollWidth:document.documentElement.scrollWidth})');
      assert.ok(measured.scrollWidth<=measured.innerWidth+1,'Applied Jie overflow at '+width+'px');
    }
    for(const width of [320,360,390]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:true});
      const measured=await evaluate('({innerWidth,scrollWidth:document.documentElement.scrollWidth})');
      assert.ok(measured.scrollWidth<=measured.innerWidth+1,'EP3 viewport overflow at '+width+'px');
      await checkEp3(boundaryGlyphs);
      assert.equal(await evaluate("Array.from(document.querySelectorAll('.glyph-element'),e=>e.scrollWidth<=e.clientWidth+1).every(Boolean)"),true);
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
    assert.equal(await evaluate("document.querySelectorAll('[data-chapter=ep3]').length"),0);

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
      "data.story.candidates[0].eightGlyphs.candidateIndex=1",
      "data.story.candidates[0].eightGlyphs.symbols[0].factRef='preview.candidates[1].year.stem'",
      "data.story.candidates[0].eightGlyphs.symbols[0].element='WOOD'", // valid element, incorrect for 丁
      "data.story.candidates[0].eightGlyphs.symbols[0].glyph='甲'",
      "data.story.candidates[0].eightGlyphs.symbols[0].elementLookupRef='FORGED'",
      "data.story.candidates[0].eightGlyphs.sourcePreviewVersion='FORGED'",
      "data.story.candidates[0].eightGlyphs.symbols.pop()",
      "data.story.candidates[0].eightGlyphs.symbols[1]=data.story.candidates[0].eightGlyphs.symbols[0]",
      "data.story.policies.dayRollover='ZI_START'",
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

    // Both individually valid boundary chapters must belong to their original candidate.
    await evaluate(`(() => {
      window.__smokeFetch=window.fetch;
      window.fetch=async (...args)=>{
        const response=await window.__smokeFetch(...args),data=await response.json();
        [data.story.candidates[0].eightGlyphs,data.story.candidates[1].eightGlyphs]=
          [data.story.candidates[1].eightGlyphs,data.story.candidates[0].eightGlyphs];
        return new Response(JSON.stringify(data),{status:response.status});
      };
      document.getElementById('example').click();
      document.getElementById('birth-date').value='2027-02-04';
      document.getElementById('birth-time').value='10:46';
      document.querySelector('#birth-form button[type=submit]').click();
    })()`);
    await until("!!document.querySelector('#output .error')",'EP3 rejects swapped Lichun chapters');
    assert.equal(await evaluate("document.querySelector('#output').textContent"),'명식과 사실 설명의 기준이 일치하지 않습니다.');
    assert.equal(await evaluate("document.querySelectorAll('.candidate,[data-chapter=ep3]').length"),0);
    await evaluate("window.fetch=window.__smokeFetch;delete window.__smokeFetch");

    // Older v1 responses without the optional trace still show their original chapters.
    await evaluate(`(() => {
      window.__smokeFetch=window.fetch;
      window.fetch=async (...args)=>{
        const response=await window.__smokeFetch(...args);const data=await response.json();
        delete data.preview.monthBoundaryTrace;
        for(const candidate of data.story.candidates){
          candidate.beats=candidate.beats.filter(b=>b.type!=='MONTH_APPLIED_JIE_CONTEXT');
          delete candidate.eightGlyphs;
        }
        return new Response(JSON.stringify(data),{status:response.status});
      };
      document.getElementById('example').click();document.querySelector('#birth-form button[type=submit]').click();
    })()`);
    await until("document.querySelectorAll('.candidate').length===1",'S4 legacy optional trace');
    assert.equal(await evaluate("document.querySelectorAll('.fact-chapter').length"),2);
    assert.equal(await evaluate("document.querySelectorAll('.applied-jie').length"),0);
    assert.equal(await evaluate("document.querySelectorAll('[data-chapter=ep3]').length"),0);
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
    assert.equal(await evaluate("document.querySelectorAll('[data-chapter=ep3]').length"),0);
    for(const [id,value,eventType] of [['birth-time','13:00','input'],['rollover','ZI_START','change']]){
      await evaluate("document.getElementById('example').click();document.querySelector('#birth-form button[type=submit]').click()");
      await until("document.querySelectorAll('.glyph-proof').length===8",'EP3 refresh before edit');
      await evaluate(`(() => {const field=document.getElementById(${JSON.stringify(id)});field.value=${JSON.stringify(value)};field.dispatchEvent(new Event(${JSON.stringify(eventType)},{bubbles:true}));})()`);
      assert.equal(await evaluate("document.querySelectorAll('[data-chapter=ep3]').length"),0);
      assert.match(await evaluate("document.querySelector('#output').textContent"),/다시 계산/);
    }
    await send('Page.setFontFamilies',{fontFamilies:{standard:'sans-serif',serif:'sans-serif',sansSerif:'sans-serif'}});
    await evaluate("document.getElementById('example').click();document.querySelector('#birth-form button[type=submit]').click()");
    await until("document.querySelectorAll('.glyph-proof').length===8",'EP3 system fonts and reduced motion');
    await checkEp3([primaryGlyphs]);
    assert.equal(await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"),true);
    assert.deepEqual(await evaluate("(async()=>({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie,databases:(await indexedDB.databases()).length,caches:(await caches.keys()).length}))()"),
      {local:0,session:0,cookie:'',databases:0,caches:0});
    assert.ok(browser.networkRequests.length>0);
    assert.ok(browser.networkRequests.every(url=>url.startsWith(origin+'/')),'No external telemetry or font requests');
    process.stdout.write('PASS real-Chromium V0/U1 EP0-EP3 + M1 S4: computed month colors, 8/16 classified glyphs and candidate factRefs, live Gregorian/lunar HTTP, Lichun/Jingzhe, keyboard proof focus and AX table, 320/360/390px, reduced-motion/system-fonts, forged/legacy responses, text-only rendering, stale/date/time/policy invalidation, no browser persistence/external requests\n');
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
