import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { STEM_NATURE, BRANCH_NATURE } from '../dist/index.js';
import { HIDDEN_STEM_RULE, HIDDEN_STEMS_V1 } from '../dist/domain/hiddenStems.js';
const script = fileURLToPath(new URL('../scripts/chart-preview-web.mjs', import.meta.url));
const sample = {
  calendar: 'GREGORIAN', date: '2027-02-05', time: '12:00',
  timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT',
  hourStemReference: 'SELECTED_DAY_PILLAR',
};
function announcedOrigin(stdout) {
  // stdout chunks need not end at a line or even at the end of the port.
  const found = /(?:^|\n)V0 chart preview: http:\/\/127\.0\.0\.1:(\d+)\r?\n/.exec(stdout);
  if (!found) return null;
  const port = Number(found[1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid announced local HTTP port');
  return 'http://127.0.0.1:' + port;
}
async function stopOwnedChild(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve, reject) => {
    const done = error => {
      clearTimeout(timer);
      child.off('exit', exited);
      child.off('error', failed);
      error ? reject(error) : resolve();
    };
    const exited = () => done();
    const failed = () => done(new Error('Owned local HTTP server termination failed'));
    const timer = setTimeout(() => done(new Error('Owned local HTTP server did not exit within cleanup bound')), 5000);
    child.once('exit', exited);
    child.once('error', failed);
    child.kill(); // Only the child created by this test.
  });
}
async function start() {
  const child = spawn(process.execPath, [script], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const origin = await new Promise((resolve, reject) => {
      let stdout = '', stderrPresent = false;
      const finish = (error, value) => {
        clearTimeout(timer);
        child.stdout.off('data', onStdout);
        child.stderr.off('data', onStderr);
        child.off('exit', onExit);
        child.off('error', onError);
        error ? reject(error) : resolve(value);
      };
      const onStdout = chunk => {
        stdout += chunk.toString();
        try { const origin = announcedOrigin(stdout); if (origin) finish(null, origin); }
        catch (error) { finish(error); }
      };
      const onStderr = () => { stderrPresent = true; };
      const onExit = code => finish(new Error('Server exited during startup ' + code + (stderrPresent ? ' (stderr present)' : '')));
      const onError = () => finish(new Error('Local HTTP server spawn failed'));
      const timer = setTimeout(() => finish(new Error('Local HTTP startup timeout')), 8000);
      child.stdout.on('data', onStdout);
      child.stderr.on('data', onStderr);
      child.once('exit', onExit);
      child.once('error', onError);
    });
    return { origin, stop: () => stopOwnedChild(child) };
  } catch (error) {
    try { await stopOwnedChild(child); }
    catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Local HTTP startup and owned cleanup failed'); }
    throw error;
  }
}
async function localFetch(origin, path, options) {
  try { return await fetch(origin + path, options); }
  catch (error) {
    const value = error?.cause?.code ?? error?.code;
    const code = typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(value)
      ? value : error?.cause?.message === 'bad port' ? 'BAD_PORT' : 'UNKNOWN_FETCH_CAUSE';
    // Keep diagnostics useful without echoing request bodies, birth data or keys.
    throw new Error('Local HTTP fetch failed at ' + origin + ' (cause=' + code + ')');
  }
}
async function submit(origin, data) {
  const r = await localFetch(origin, '/api/preview', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return { status: r.status, body: await r.json() };
}
test('V0 page loads and real solar/lunar chart outputs match', async () => {
  const server = await start();
  try {
    const page = await localFetch(server.origin, '/');
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /나의 사주 원국/);
    assert.match(html, /왜 이렇게 계산됐나요/);
    assert.match(html, /나의 일간/);
    assert.match(html, /월지는 어떻게 정해질까요/);
    const a = await submit(server.origin, sample);
    const b = await submit(server.origin, { ...sample, calendar: 'KOREAN_LUNAR', date: '2026-12-29', leap: false });
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(a.body.status, 'OK');
    assert.deepEqual(a.body.preview.candidates, b.body.preview.candidates);
    assert.equal(a.body.preview.candidates[0].year.hangul, '정미');
    assert.equal(a.body.preview.coverage.validation, 'STRUCTURAL_COVERAGE_ONLY');
    assert.deepEqual(a.body.preview.solarTermSourceIds, ['KR-KASI-CALENDAR-DATA']);
    assert.deepEqual(b.body.preview.solarTermSourceIds, a.body.preview.solarTermSourceIds);
    assert.equal(b.body.preview.lunarConversionSource.sourceId, 'KR-KASI-CALENDAR-DATA');
    assert.equal(a.body.story.status,'READY');
    assert.equal(a.body.story.schemaVersion,'u0-story-projection-v1');
    assert.deepEqual(a.body.story.candidates,b.body.story.candidates);
    assert.equal(a.body.story.candidates.length,1);
    assert.equal(a.body.story.candidates[0].beats[1].type,'DAY_STEM_CLASSIFICATION');
    assert.equal(a.body.story.candidates[0].beats[1].stem,a.body.preview.candidates[0].day.stem);
    assert.equal(a.body.story.candidates[0].beats[1].factRef,'preview.candidates[0].day.stem');
    assert.equal(a.body.story.candidates[0].beats[2].type,'MONTH_BRANCH_CLASSIFICATION');
    assert.equal(a.body.story.candidates[0].beats[2].branch,a.body.preview.candidates[0].month.branch);
    assert.equal(a.body.story.candidates[0].beats[2].factRef,'preview.candidates[0].month.branch');
    assert.deepEqual(a.body.story.candidates[0].beats[2],b.body.story.candidates[0].beats[2]);
  } finally { await server.stop(); }
});
test('V0 web preserves Lichun candidates and rejects invalid policies', async () => {
  const server = await start();
  try {
    const boundary = await submit(server.origin, { ...sample, date: '2027-02-04', time: '10:46' });
    assert.equal(boundary.status, 200);
    assert.equal(boundary.body.preview.candidates.length, 2);
    assert.equal(boundary.body.story.status,'READY');
    assert.equal(boundary.body.story.candidates.length,2);
    assert.equal(boundary.body.story.candidateDisplay,'SHOW_ALL_BOUNDARY_CANDIDATES');
    assert.deepEqual(boundary.body.story.candidates.map(x=>x.beats[1].factRef),
      ['preview.candidates[0].day.stem','preview.candidates[1].day.stem']);
    assert.deepEqual(boundary.body.story.candidates.map(x=>x.beats[2].factRef),
      ['preview.candidates[0].month.branch','preview.candidates[1].month.branch']);
    assert.deepEqual(boundary.body.story.candidates.map(x=>x.beats[2].branch),
      boundary.body.preview.candidates.map(x=>x.month.branch));
    assert.notEqual(boundary.body.story.candidates[0].beats[2].branch,boundary.body.story.candidates[1].beats[2].branch);
    const bad = await submit(server.origin, { ...sample, dayRollover: '' });
    assert.equal(bad.status, 422);
    assert.equal(bad.body.status, 'ERROR');
    const extra = await submit(server.origin, { ...sample, unexpected: 'x' });
    assert.equal(extra.status, 422);
  } finally { await server.stop(); }
});

test('V0 HTTP distinguishes out-of-coverage dates from invalid birth dates', async () => {
  const server = await start();
  try {
    for (const request of [
      { ...sample, date: '2028-01-01' },
      { ...sample, calendar: 'KOREAN_LUNAR', date: '2027-12-10', leap: false },
    ]) {
      const response = await submit(server.origin, request);
      assert.equal(response.status, 422);
      assert.equal(response.body.status, 'OUT_OF_COVERAGE');
      assert.equal(Object.hasOwn(response.body,'story'),false);
    }
    const invalid = await submit(server.origin, { ...sample, date: '2027-02-30' });
    assert.equal(invalid.status, 422);
    assert.equal(invalid.body.status, 'ERROR');
  } finally { await server.stop(); }
});

test('S4: actual HTTP returns Gregorian/lunar equivalent event evidence and separate Lichun cards', async () => {
  const server=await start();
  try {
    for(const [time,terms] of [['10:45',['XIAOHAN']],['10:46',['XIAOHAN','LICHUN']],['10:47',['LICHUN']]]){
      const a=await submit(server.origin,{...sample,date:'2027-02-04',time});
      const b=await submit(server.origin,{...sample,calendar:'KOREAN_LUNAR',date:'2026-12-28',leap:false,time});
      assert.equal(a.status,200);assert.equal(b.status,200);
      assert.deepEqual(a.body.preview.monthBoundaryTrace,b.body.preview.monthBoundaryTrace);
      assert.deepEqual(a.body.story.candidates,b.body.story.candidates);
      const beats=a.body.story.candidates.map(c=>c.beats.find(beat=>beat.type==='MONTH_APPLIED_JIE_CONTEXT'));
      assert.deepEqual(beats.map(beat=>beat.activeSince.term),terms);
      for(const [i,beat] of beats.entries()){
        assert.equal(beat.factRef,`preview.candidates[${i}].month`);
        assert.equal(beat.monthBranch,a.body.preview.candidates[i].month.branch);
        assert.equal(beat.activeSince.timeBasis,'KST');
        assert.equal(beat.activeSince.sourcePrecision,'MINUTE');
        assert.deepEqual(beat.activeSince.sourceIds,['KR-KASI-CALENDAR-DATA']);
      }
    }
  } finally { await server.stop(); }
});

test('EP3: HTML embeds only existing public classification tables and HTTP returns eight candidate facts',async()=>{
  const server=await start();
  try{
    const page=await localFetch(server.origin,'/'),html=await page.text();
    assert.equal(page.headers.get('cache-control'),'no-store');
    const embedded=/<script id="nature-lookups" type="application\/json">([^<]+)<\/script>/.exec(html);
    assert.ok(embedded);
    assert.deepEqual(JSON.parse(embedded[1]),{stems:STEM_NATURE,branches:BRANCH_NATURE});
    const ep4Metadata=/<script id="ep4-rules" type="application\/json">([^<]+)<\/script>/.exec(html);
    assert.ok(ep4Metadata);
    const ep4Rules=JSON.parse(ep4Metadata[1]);
    assert.deepEqual(ep4Rules.rule,HIDDEN_STEM_RULE);assert.deepEqual(ep4Rules.members,HIDDEN_STEMS_V1);
    assert.equal(Object.hasOwn(ep4Rules,'tenGodMatrix'),false); // browser never derives ten gods
    assert.match(html,/id="hidden-policy"/);
    assert.equal(html.includes('<!-- NATURE_LOOKUPS -->'),false);
    assert.match(html,/여덟 글자와 다섯 가지 이름/);
    for(const request of [sample,{...sample,date:'2027-02-04',time:'10:46'}]){
      const response=await submit(server.origin,request);assert.equal(response.status,200);
      for(const [i,candidate] of response.body.story.candidates.entries()){
        assert.equal(candidate.eightGlyphs.symbols.length,8);
        assert.equal(candidate.eightGlyphs.candidateIndex,i);
        assert.equal(candidate.eightGlyphs.sourcePreviewVersion,response.body.preview.schemaVersion);
        for(const fact of candidate.eightGlyphs.symbols){
          assert.equal(fact.glyph,response.body.preview.candidates[i][fact.role][fact.kind==='STEM'?'stem':'branch']);
          assert.match(fact.factRef,new RegExp('^preview\\.candidates\\['+i+'\\]\\.'));
        }
      }
    }
  }finally{await server.stop();}
});

test('EP4 HTTP is opt-in with a required supported policy and keeps the unselected V0 result unchanged',async()=>{
  const server=await start();
  const policyId='M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1';
  try{
    const old=await submit(server.origin,sample);assert.equal(Object.hasOwn(old.body,'ep4'),false);
    const selected=await submit(server.origin,{...sample,hiddenStemPolicyId:policyId});
    assert.equal(selected.status,200);assert.deepEqual(selected.body.preview,old.body.preview);assert.deepEqual(selected.body.story,old.body.story);
    assert.equal(selected.body.ep4.policyId,policyId);assert.equal(selected.body.ep4.candidates[0].branches.length,4);
    for(const invalid of ['',null,'AUTO',false]){
      const bad=await submit(server.origin,{...sample,hiddenStemPolicyId:invalid});
      assert.equal(bad.status,422);assert.equal(Object.hasOwn(bad.body,'ep4'),false);
    }
    const a=await submit(server.origin,{...sample,date:'2027-02-04',time:'10:46',hiddenStemPolicyId:policyId});
    const b=await submit(server.origin,{...sample,calendar:'KOREAN_LUNAR',date:'2026-12-28',leap:false,time:'10:46',hiddenStemPolicyId:policyId});
    assert.deepEqual(a.body.ep4,b.body.ep4);assert.equal(a.body.ep4.candidates.length,2);
    const outside=await submit(server.origin,{...sample,date:'2028-01-01',hiddenStemPolicyId:policyId});
    assert.equal(outside.status,422);assert.equal(Object.hasOwn(outside.body,'ep4'),false);
  }finally{await server.stop();}
});

test('HTTP readiness waits for a complete announcement and validates the entire port', () => {
  const complete = 'V0 chart preview: http://127.0.0.1:54321\n';
  for (let end = 0; end < complete.length; end++) assert.equal(announcedOrigin(complete.slice(0, end)), null, 'a partial stdout chunk cannot announce readiness');
  assert.equal(announcedOrigin(complete), 'http://127.0.0.1:54321');
  assert.equal(announcedOrigin('other startup line\n' + complete.replace('\n', '\r\n')), 'http://127.0.0.1:54321');
  for (const port of [1, 65535]) assert.equal(announcedOrigin('V0 chart preview: http://127.0.0.1:' + port + '\n'), 'http://127.0.0.1:' + port);
  for (const port of [0, 65536, 99999999999999999]) assert.throws(() => announcedOrigin('V0 chart preview: http://127.0.0.1:' + port + '\n'), /Invalid announced/);
  assert.equal(announcedOrigin('unrelated http://127.0.0.1:54321\n'), null);
  assert.equal(announcedOrigin('V0 chart preview: http://127.0.0.1:54'), null);
});
