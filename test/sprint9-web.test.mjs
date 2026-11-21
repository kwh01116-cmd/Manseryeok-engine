import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createBetaWeb,checkMode} from '../scripts/beta/web.mjs';
import {questionsFor,CONSENT_VERSION} from '../scripts/beta/study.mjs';

function corpus(extra='') {
  // Synthetic material for transport and ownership tests; the private browser suite uses actual S7 text.
  const fixtures=['F03','F04'].map((id,i)=>({
    id,label:'모의 사례 '+id,artifactVersion:'0.1.0',status:'SUPPORTED',chartSummary:'가상 원국',
    chapters:Array.from({length:6},(_,j)=>({title:(j+1)+'장',chapterId:'ch'+(j+1),paragraphs:['해당 사례 본문 '+id+extra]})),
    candidates:[{ordinal:1,pillars:[id,'월','일','시']}],
    claims:[{claimId:'p1-work',domain:'WORK',status:'LIMITED',text:'위치 설명. '+(i?'자료를 모으는 단계에서 일의 순서를 정하는 방식과 경험을 다른 사람에게 표현하는 방식을 함께 돌아보게 됩니다. 서로의 설명이 달라지는 경우 어떤 질문을 더할 수 있을까요?':'계획을 세우는 단계에서 역할을 먼저 정하는 방식과 결과를 직접 확인하는 방식을 함께 살펴볼 수 있습니다. 최근 맡은 일을 시작할 때 어느 기준을 먼저 생각했는지 떠올려 보세요.')}]
  }));
  return {fixtures,version:'TEST_TRANSPORT_V01'};
}
async function setup(t){
  const directory=await mkdtemp(join(tmpdir(),'s9-http-'));
  let app,origin;
  async function start(materials=corpus()) {
    app=await createBetaWeb({directory,mode:'INTERNAL_QA',materials});origin=await app.listen(0);
  }
  await start();
  t.after(async()=>{await app.close();await rm(directory,{recursive:true,force:true});});
  async function request(path,body,guest={},headers={}){
    const res=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{...(guest.cookie?{Cookie:guest.cookie}:{}),
      ...(body===undefined?{}:{Origin:origin,'content-type':'application/json','x-csrf-token':guest.csrf??''}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')};
  }
  async function guest(fixtureId,role,arm){
    const issued=await app.operator.issue({fixtureId,role,arm});
    const res=await request('/api/beta/enter',{invite:issued.token});assert.equal(res.status,200);
    assert.match(res.cookie,/HttpOnly; SameSite=Strict/);
    const g={cookie:res.cookie.split(';')[0],inviteId:issued.inviteId};
    const me=await request('/api/beta/me',undefined,g);g.csrf=me.data.csrfToken;
    assert.equal(me.data.report,undefined);assert.equal(me.data.questions,undefined);
    assert.equal((await request('/api/beta/consent',{version:CONSENT_VERSION},g)).status,200);
    return g;
  }
  return {request,guest,app:()=>app,restart:async m=>{await app.close();await start(m);}};
}

test('mode and network boundary do not accept human collection, client-owned modes or sales',async t=>{
  for(const mode of ['LOCAL_DEVELOPMENT','INTERNAL_QA'])assert.equal(checkMode(mode),mode);
  for(const mode of ['CLOSED_BETA','PRODUCTION','LIVE'])assert.throws(()=>checkMode(mode));
  const {request}=await setup(t);
  assert.equal((await request('/api/live/checkout',{approved:true})).status,403);
  assert.equal((await request('/api/orders',{mode:'TEST'})).status,403);
  assert.equal((await request('/api/admin/export')).status,403);
  assert.equal((await request('/api/beta/me?fixture=F03')).status,400);
  assert.equal((await request('/api/beta/me')).status,401);
  assert.equal((await request('/api/beta/enter',{invite:'fixture',mode:'CLOSED_BETA'})).status,422);
  assert.equal((await request('/api/beta/enter',{invite:'fixture'},{},{Origin:'https://unrelated.invalid'})).status,403);
});
test('assigned report, private answers and withdrawal remain scoped through restart',async t=>{
  const env=await setup(t),{request}=env;
  const a=await env.guest('F03','READER','REPORT_ONLY'),b=await env.guest('F04','EXPERT','EXPERT');
  let me=await request('/api/beta/me',undefined,a);
  assert.equal(me.status,200);assert.equal(me.data.report.id,'F03');assert.equal(me.data.report.claims,undefined);
  assert.equal((await request('/api/beta/me',undefined,b)).data.report.id,'F04');
  const ans={questionId:'chapterComment',targetId:'ch2',value:'내부 점검 문장'};
  assert.equal((await request('/api/beta/answer',ans,{cookie:a.cookie,csrf:b.csrf})).status,403);
  assert.equal((await request('/api/beta/answer',{...ans,fixtureId:'F04'},a)).status,422);
  assert.equal((await request('/api/beta/answer',{...ans,value:'<b>모의 입력</b>'},a)).status,422);
  assert.equal((await request('/api/beta/answer',ans,a)).data.status,'RECORDED');
  assert.equal((await request('/api/beta/answer',ans,a)).data.status,'DUPLICATE');
  assert.equal((await request('/api/beta/me',undefined,b)).data.feedback.length,0);
  await env.restart();
  me=await request('/api/beta/me',undefined,a);assert.equal(me.data.feedback[0].value,ans.value);
  await env.restart(corpus('매체 변경'));
  assert.equal((await request('/api/beta/me',undefined,a)).status,409);
  assert.equal((await request('/api/beta/withdraw',{},a)).status,200);
  assert.equal((await request('/api/beta/me',undefined,a)).status,401);
  assert.equal((await env.app().operator.exportFeedback()).records.length,1);
});
test('blind material projection locks answers before revealing the report and delays the answer key',async t=>{
  const env=await setup(t),g=await env.guest('F03','READER','BLIND');
  const me=()=>env.request('/api/beta/me',undefined,g);
  const send=(path,data)=>env.request('/api/beta/'+path,data,g);
  const view=(await me()).data;
  assert.deepEqual(view.comparison.readings.map(r=>Object.keys(r).sort()),Array.from({length:3},()=>['slot','text']));
  for(const field of ['report','blindOrder','fixtureId','debrief'])assert.equal(view[field],undefined);
  assert.equal((await send('lock',{})).status,409);
  for(const q of questionsFor('READER').filter(q=>q.id.startsWith('blind'))){
    for(const targetId of q.target==='slot'?['1','2','3']:['overall']){
      const value=q.kind==='rating'?2:q.kind==='choice'?q.choices.at(-1):'모의 비교 응답';
      assert.equal((await send('answer',{questionId:q.id,targetId,value})).status,200);
    }
  }
  assert.equal((await send('lock',{})).status,200);
  const locked=(await me()).data;assert.ok(locked.report);assert.equal(locked.debrief,undefined);
  assert.equal((await send('answer',{questionId:'blindSpecificity',targetId:'1',value:5})).status,409);
  assert.equal((await send('finish',{})).status,409);
  for(const q of locked.questions.filter(q=>q.required)){
    const ids=q.target==='chapter'?Array.from({length:6},(_,i)=>'ch'+(i+1)):['overall'];
    for(const targetId of ids)assert.equal((await send('answer',{questionId:q.id,targetId,value:q.kind==='rating'?3:q.choices[0]})).status,200);
  }
  assert.equal((await send('finish',{})).status,200);
  assert.equal((await me()).data.debrief.readings.length,3);
  await env.app().operator.revoke(g.inviteId);assert.equal((await me()).status,401);
});
