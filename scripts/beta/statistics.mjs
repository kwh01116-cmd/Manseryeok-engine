import {CHAPTERS,EXPERT_DECISIONS} from './forms.mjs';
const counts = values => {
  const results=Object.create(null);
  for (const value of values) results[value]=(results[value]??0)+1;
  return {answered:values.length,counts:results};
};
const rating = values => ({answered:values.length,mean:values.length?Math.round(10*values.reduce((a,b)=>a+b,0)/values.length)/10:null});
const responses=(records,qid,where=()=>true)=>records.flatMap(r=>r.answers.filter(a=>a.questionId===qid&&where(a,r)).map(a=>a.value));
function reviewOutcomes(experts) {
  const groups=new Map();
  for (const p of experts) for (const a of p.answers.filter(x=>x.questionId==='disposition')) {
    const key=[p.fixtureId,p.reportArtifactVersion,p.materialSha256,a.targetId].join('/');
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(a.value);
  }
  const decisions=[...groups.values()].flat(),outcomes=Object.fromEntries(EXPERT_DECISIONS.map(d=>[d,decisions.filter(x=>x===d).length]));
  return {claimReviews:decisions.length,distinctReviewedClaims:groups.size,outcomes,
    reviseOrReject:{numerator:outcomes.REVISE+outcomes.REJECT,denominator:decisions.length},
    disagreements:[...groups.entries()].filter(([,v])=>new Set(v).size>1).map(([claim,values])=>({claim,...counts(values)})),
    exceptionFixtures:counts(responses(experts,'exceptionDisposition'))};
}
function readerSummary(readers) {
  return {completed:readers.length,
    chapterComprehension:Object.fromEntries(CHAPTERS.map(ch=>[ch,rating(responses(readers,'chapterComprehension',a=>a.targetId===ch))])),
    comprehension:rating(responses(readers,'comprehension')),personalization:rating(responses(readers,'personalization')),
    purchaseValue:rating(responses(readers,'value')),purchaseIntent:counts(responses(readers,'purchaseIntent')),
    mostUsefulChapter:counts(responses(readers,'usefulChapter')),declineCategories:counts(responses(readers,'declineCategory')),
    writtenDeclineReasons:responses(readers,'declineReason').length};
}
function summarizeBlind(blind) {
  const treatments=Object.fromEntries(['A','B','C'].map(key=>[key,{
    specificity:rating(responses(blind,'blindSpecificity',(a,p)=>p.blindKey[Number(a.targetId)-1]===key)),
    personalization:rating(responses(blind,'blindPersonalization',(a,p)=>p.blindKey[Number(a.targetId)-1]===key))}]));
  const preferred=blind.map(p=>{
    const value=p.answers.find(a=>a.questionId==='blindPreferred').value;
    return ['1','2','3'].includes(value)?p.blindKey[Number(value)-1]:'INDISTINGUISHABLE';
  });
  return {completed:blind.length,preferred:counts(preferred),treatments};
}
export function aggregateFeedback(exported) {
  const all=exported.records,finished=all.filter(r=>r.completed),reader=finished.filter(r=>r.role==='READER');
  const experts=finished.filter(r=>r.role==='EXPERT'),blind=reader.filter(r=>r.arm==='BLIND');
  const strata=['IDENTICAL_WORDING_DIFFERENT_CHART','DISTINCT_WORDING_DIFFERENT_CHART','UNSPECIFIED'];
  const byComparisonType=Object.fromEntries(strata.map(type=>[type,summarizeBlind(blind.filter(p=>(p.comparisonType??'UNSPECIFIED')===type))]));
  const issues=all.flatMap(r=>r.answers.filter(a=>a.questionId==='issueCategory').map(a=>({category:a.value,fixtureId:r.fixtureId,targetId:a.targetId})));
  return {studyVersion:exported.studyVersion,dataClass:'SYNTHETIC_INTERNAL_QA',humanParticipantCount:0,humanValidation:'NOT_TESTED',
    consented:all.length,completed:finished.length,incomplete:all.length-finished.length,
    readerArms:Object.fromEntries(['BLIND','REPORT_ONLY'].map(arm=>[arm,readerSummary(reader.filter(r=>r.arm===arm))])),
    blindComparison:{completed:blind.length,byComparisonType},
    expertReview:reviewOutcomes(experts),issueReportsIncludingIncomplete:counts(issues.map(i=>i.category)),
    unclearEvidenceLocations:issues.filter(i=>i.category==='근거가 불분명함').map(({fixtureId,targetId})=>({fixtureId,targetId}))};
}
