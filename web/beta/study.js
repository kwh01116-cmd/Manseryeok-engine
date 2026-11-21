const $=id=>document.getElementById(id);
let session=null;
let working=false;
const controls=new Map();
const labels={
  ACCEPT:'수락',ACCEPT_WITH_QUALIFICATION:'조건을 붙여 수락',REVISE:'수정',REJECT:'기각',
  SCHOOL_DEPENDENT:'학파에 따라 다름',INSUFFICIENT_EVIDENCE:'근거 부족',
  LIMITED:'제한적 해석',HOLD:'판단 보류',SUPPORTED:'제공 가능',
  YES:'있음',NO:'없음',UNSURE:'판단하기 어려움'
};
const errors={
  INVALID_FIELDS:'입력 항목을 다시 확인해 주세요.',INVITE_RATE_LIMIT:'시도가 많습니다. 잠시 뒤 다시 열어 주세요.',
  INVITE_REJECTED:'초대 코드를 확인해 주세요.',SESSION_REQUIRED:'열람 시간이 끝났습니다. 운영자에게 문의해 주세요.',
  BETA_TEXT_INVALID:'의견은 600자까지 입력할 수 있습니다. 꺾쇠나 제어 문자를 지우고 다시 저장해 주세요.',
  BETA_MATERIAL_CHANGED:'처음 읽은 자료와 현재 자료가 달라 평가를 중단했습니다. 운영자에게 문의해 주세요.',
  BETA_INVITE_UNAVAILABLE:'초대 코드가 유효하지 않거나 이미 사용됐습니다. 발급받은 코드를 확인해 주세요.',
  STUDY_REQUEST_FAILED:'저장 결과를 확인할 수 없습니다. 새로고침한 뒤 다시 확인해 주세요.'
};
function el(tag,text,className){
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  if(className)node.className=className;
  return node;
}
function button(text,action,className='primary',id){
  const b=el('button',text,className);b.type='button';if(id)b.id=id;
  b.addEventListener('click',()=>act(action));return b;
}
function valueText(value){
  if(value==null)return '';
  if(Array.isArray(value))return value.map(valueText).join(' · ');
  if(typeof value==='object')return Object.entries(value).map(([k,v])=>k+' — '+valueText(v)).join('\n');
  return String(value);
}
async function api(path,body){
  const init={credentials:'same-origin',cache:'no-store'};
  if(body!==undefined){
    init.method='POST';init.headers={'Content-Type':'application/json'};
    if(session?.csrfToken)init.headers['X-CSRF-Token']=session.csrfToken;
    init.body=JSON.stringify(body);
  }
  const response=await fetch('/api/beta/'+path,init);
  const result=await response.json();
  if(!response.ok)throw Object.assign(new Error(result.code||'STUDY_REQUEST_FAILED'),{status:response.status});
  return result;
}
async function act(fn){
  if(working)return;working=true;
  $('main').setAttribute('aria-busy','true');$('error').textContent='';$('notice').textContent='';
  try{await fn();}catch(e){
    $('error').textContent=errors[e.message]??'요청을 마치지 못했습니다. 초대 상태와 필수 응답을 확인해 주세요. ('+e.message+')';
    $('error').scrollIntoView({block:'nearest'});
  }finally{working=false;$('main').removeAttribute('aria-busy');}
}
async function load(){
  try{session=await api('me');}
  catch(e){if(e.status!==401)throw e;session=null;}
  render();
}
$('enter').addEventListener('submit',event=>{
  event.preventDefault();act(async()=>{
    const token=$('invite').value.trim();$('invite').value='';
    await api('enter',{invite:token});await load();
  });
});
function markStatus(message){$('notice').textContent=message;$('notice').scrollIntoView({block:'nearest'});}
function panel(title){const p=el('section',undefined,'panel');p.append(el('h2',title));return p;}
function details(parent,title,body){
  const d=el('details',undefined,'evidence');d.append(el('summary',title),el('p',body,'reading-text'));parent.append(d);
}
function responseKey(q,t){return q+'/'+t;}
function addQuestion(parent,q,target){
  const key=responseKey(q.id,target);
  const row=el('div',undefined,'assessment');
  const label=el('label',q.label+(q.required?' (필수)':' (선택)'));
  const id='field-'+q.id+'-'+target;
  label.htmlFor=id;
  const choices=q.kind==='rating'?[1,2,3,4,5]:q.choices;
  let control;
  if(choices){
    control=el('select');control.append(new Option('응답 선택',''));
    for(const choice of choices){
      const title=q.kind==='rating'?(choice===1?'1 · 매우 낮음':choice===5?'5 · 매우 높음':String(choice)):
        /^ch[1-6]$/.test(choice)?choice.slice(2)+'장':labels[choice]??String(choice);
      control.append(new Option(title,String(choice)));
    }
  }else{
    control=el('textarea');control.rows=2;control.maxLength=600;control.placeholder='이름이나 연락처는 적지 마세요.';
  }
  control.id=id;control.dataset.question=q.id;control.dataset.target=target;
  const saved=session.feedback.find(x=>x.questionId===q.id&&x.targetId===target);
  if(saved)control.value=String(saved.value);
  control.disabled=session.completed;
  controls.set(key,{q,target,control,saved:saved?.value});
  row.append(label,control);parent.append(row);
}
function fieldsFor(parent,targetType,target){
  for(const q of session.questions.filter(x=>x.target===targetType))addQuestion(parent,q,target);
}
function issueForm(parent,target){
  const d=el('details',undefined,'evidence');d.append(el('summary','문제 신고'));
  fieldsFor(d,'issue',target);parent.append(d);
}
async function saveDraft(required){
  for(const entry of controls.values()){
    const {q,control,target}=entry;
    const raw=control.value.trim();
    if(!raw){
      if(entry.saved!==undefined){control.focus();throw Error('이미 저장한 의견은 다른 내용으로 수정하거나 전체 철회로 삭제할 수 있습니다');}
      if(required&&q.required){control.focus();throw Error('필수 응답을 선택하거나 작성해 주세요');}
      continue;
    }
    const value=q.kind==='rating'?Number(raw):raw;
    if(value===entry.saved)continue;
    await api('answer',{questionId:q.id,targetId:target,value});entry.saved=value;
  }
}
function actions(parent,blind){
  if(session.completed)return;
  const line=el('div',undefined,'study-actions');
  line.append(button('작성한 응답 저장',async()=>{await saveDraft(false);markStatus('작성한 응답을 저장했습니다. 같은 브라우저에서 이어 쓸 수 있습니다.');},'secondary','save'));
  line.append(button(blind?'비교 응답 확정하고 본문 열기':'평가 마치기',async()=>{
    await saveDraft(true);await api(blind?'lock':'finish',{});await load();$('main').focus();window.scrollTo(0,0);
  },'primary',blind?'lock':'finish'));parent.append(line);
}
function renderReport(root,report){
  const title=report.label||report.id;
  const head=el('header',undefined,'study-head');
  head.append(el('p',session.role==='EXPERT'?'전문가 검토 · 가상 사례':'독자 평가 · 가상 사례','eyebrow'),el('h1',title));
  if(report.chartSummary)head.append(el('p',valueText(report.chartSummary),'reading-text'));
  if(report.opening?.length)details(head,'리포트 첫 문단',report.opening.join('\n'));
  if(session.role==='EXPERT' && report.sources)details(head,'출처 대조 자료',valueText(report.sources));
  if(session.role==='EXPERT' && report.fictionalInput){
    details(head,'재현용 가상 입력과 계산 버전',JSON.stringify({input:report.fictionalInput,
      data:report.dataVersion,generator:report.generatorVersion,basis:report.basisVersion},null,2));
  }
  root.append(head);
  const toc=el('nav',undefined,'review-nav');toc.setAttribute('aria-label','장으로 이동');
  for(const chapter of report.chapters){const a=el('a',chapter.title);a.href='#'+chapter.chapterId;toc.append(a);}
  root.append(toc);
  for(const chapter of report.chapters){
    const section=panel(chapter.title);section.id=chapter.chapterId;
    for(const para of chapter.paragraphs)section.append(el('p',para,'reading-text'));
    fieldsFor(section,'chapter',chapter.chapterId);issueForm(section,chapter.chapterId);root.append(section);
  }
  if(session.role==='EXPERT'){
    if(!report.claims?.length){
      const section=panel('해석을 제공하지 않은 사례');
      section.append(el('p',report.chartSummary));fieldsFor(section,'exception','overall');root.append(section);
    }
    for(const claim of report.claims??[]){
      const section=panel('후보 '+claim.candidate+' · '+(labels[claim.status]??claim.status));
      section.append(el('p',claim.text,'reading-text'));
      for(const [title,field] of [['이 해석이 참조한 사실','inputFacts'],['적용 전제','supportingConditions'],
        ['경쟁·반대 조건','competingConditions'],['적용 정책','policy'],['출처','sourceRefs'],['원문 참조','originalRef']]){
        if(claim[field]!=null)details(section,title,valueText(claim[field]));
      }
      fieldsFor(section,'claim',claim.claimId);root.append(section);
    }
  }
  const summary=panel(session.completed?'저장한 전체 평가':'전체 평가와 문제 신고');
  if(session.completed)summary.append(el('p','이 브라우저에서 저장한 응답을 다시 확인할 수 있습니다.'));
  fieldsFor(summary,'overall','overall');issueForm(summary,'overall');root.append(summary);
  actions(root,false);
}
function render(){
  const root=$('workspace');root.replaceChildren();controls.clear();$('welcome').hidden=!!session;
  if(!session)return;
  if(!session.consented){
    const info=panel('평가를 시작하기 전에');
    info.append(el('p',session.consentText,'reading-text'));
    const label=el('label',undefined,'checkline'),check=el('input');check.type='checkbox';check.id='consent-check';
    label.append(check,document.createTextNode('가상 자료로 진행하는 내부 점검 범위를 확인했습니다.'));
    info.append(label,button('확인하고 시작',async()=>{
      if(!check.checked){check.focus();throw Error('안내 확인 필요');}
      await api('consent',{version:session.consentVersion});await load();
    },'primary','consent'));root.append(info);
  }else if(session.comparison){
    const intro=el('div',undefined,'study-head');intro.append(el('h1','어느 글에서 사례의 특징이 읽히나요?'),
      el('p','같은 주제로 쓴 세 편의 발췌문을 읽어 주세요. 차이를 느끼기 어려웠다면 그대로 답해도 됩니다. 응답을 확정한 뒤 여섯 장의 본문을 읽고, 평가 마지막에 세 글의 출처를 확인합니다.'),
      el('p',session.comparison.context,'status-panel'));root.append(intro);
    for(const {slot,text} of session.comparison.readings){
      const section=panel('글 '+slot);section.append(el('p',text,'reading-text'));fieldsFor(section,'slot',String(slot));root.append(section);
    }
    const close=panel('비교하며 발견한 점');fieldsFor(close,'overall','overall');issueForm(close,'overall');root.append(close);actions(root,true);
  }else{
    if(session.debrief){const d=panel('비교 글의 출처');d.id='debrief';
      for(const item of session.debrief.readings)d.append(el('p','글 '+item.slot+' · '+item.origin));
      d.append(el('p',session.debrief.explanation));root.append(d);}
    renderReport(root,session.report);
  }
  const footer=el('details',undefined,'study-footer');footer.append(el('summary','참여 중단과 응답 삭제'));
  const box=el('div');box.append(el('p','철회하면 이 세션의 평가와 접근권을 삭제합니다. 삭제 후에는 같은 응답을 다시 열 수 없습니다.'));
  box.append(button('철회하고 내 응답 삭제',async()=>{
    if(!window.confirm('저장한 평가를 삭제하고 종료할까요?'))return;
    await api('withdraw',{});session=null;render();markStatus('응답과 열람 권한을 삭제했습니다.');
  },'secondary','withdraw'));footer.append(box);root.append(footer);
}
act(load);
