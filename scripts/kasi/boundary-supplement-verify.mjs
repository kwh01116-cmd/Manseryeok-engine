/** Focused actual-data audit of the old next-Jie shortage cohort; never recollects. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import net from 'node:net';
import {fingerprint,sha} from '../../.kasi-build/schema.js';
import {loadCandidate} from './candidate.mjs';
import {inventory} from './research.mjs';
import {modernExplanationGrid} from './local-explain-verify.mjs';
import {createLocalChartProfile,MODERN_PROFILE_ID,MODERN_CLOCK_POLICY_ID,BASELINE_MANIFEST_SHA256} from './local-chart.mjs';
import {createLocalLuckProfile,validateLocalLuckResult,M7_LUCK_POLICY_V01} from './local-luck.mjs';
import {projectLocalLuckResult,validateLocalLuckProjectionResult,CALENDAR_PROJECTION_POLICY_V02} from './local-luck-projection.mjs';
import {loadKasi2027BoundarySupplement} from './boundary-supplement.mjs';
import {MONTH_BOUNDARY_JIE} from '../../dist/calendar/monthPillar.js';

const pins={'.private/kasi-local-1950-2026/monthly-xml':'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567','.private/kasi-research-1950-2026-fe84ab4-a':'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed','.private/kasi-research-1950-2026-fe84ab4-b':'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584'};
const exportPin='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const git=args=>execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
async function preserve(){const actual={};for(const [directory,pin]of Object.entries(pins)){actual[directory]=fingerprint(await inventory(resolve(directory)));assert.equal(actual[directory],pin,directory+' independent tree pin');}assert.equal(sha(await readFile('.private/kasi-local-1950-2026/monthly-xml/export.json')),exportPin);return actual;}
export async function verifyBoundaryShortageCohort({outputDirectory,supplementDirectory,expectedSupplementSha256}={}){
 assert.ok(typeof outputDirectory==='string');const outRelative=relative(resolve('.private'),resolve(outputDirectory));assert.ok(outRelative!==''&&!outRelative.startsWith('..')&&!isAbsolute(outRelative));
 assert.equal(supplementDirectory===undefined,expectedSupplementSha256===undefined);await mkdir(outputDirectory,{recursive:false});const before=await preserve();
 const loaded=await loadCandidate('.private/kasi-research-1950-2026-fe84ab4-a',BASELINE_MANIFEST_SHA256);
 const chart=createLocalChartProfile(loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256});let calls=0;
 const spy={...chart,calculate(r){calls++;return chart.calculate(r);}},baseline=createLocalLuckProfile(spy,{luckPolicyId:M7_LUCK_POLICY_V01,contextProfile:chart});
 const supplement=supplementDirectory===undefined?null:await loadKasi2027BoundarySupplement({directory:supplementDirectory,expectedSupplementSha256,expectedBaseManifestSha256:BASELINE_MANIFEST_SHA256});
 const selected=supplement?createLocalLuckProfile(spy,{luckPolicyId:M7_LUCK_POLICY_V01,contextProfile:chart,boundarySupplement:supplement}):null;
 const contexts=new Map();for(let y=1989;y<=2026;y++)contexts.set(y,chart.eventsForYear(y));
 const lastJie=loaded.candidate.events.filter(e=>e.date.startsWith('2026-')&&MONTH_BOUNDARY_JIE.includes(e.termCode)).sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time)).at(-1);assert.ok(lastJie);
 const cutoff=lastJie.date+'T'+lastJie.time,counts={gridVectorsInspected:0,tailVectors:0,baselineProductCalls:0,selectedProductCalls:0,productM1Calls:0,baselineCandidates:0,missingCandidates:0,missingChangedToOK:0,missingStillMissing:0,reverseUnchanged:0,ambiguousUnchanged:0,projectionCandidates:0},statuses={},missing=[],baseDigest=[];
 function calculate(profile,request,feature){const n=calls,result=profile.calculate(request,feature);assert.equal(calls-n,1);validateLocalLuckResult(result);return result;}
 for(const vector of modernExplanationGrid(loaded.candidate,contexts)){
  counts.gridVectorsInspected++;if(vector.minute<cutoff)continue;counts.tailVectors++;
  const date=vector.minute.slice(0,10),time=vector.minute.slice(11),row=loaded.index.fromGregorianDate(date).value;assert.ok(row);
  const policies={clockPolicyId:MODERN_CLOCK_POLICY_ID,...vector.policy};
  const requests=[{calendar:'GREGORIAN',date,time,policies},{calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies}];
  for(const traditionalSex of ['MALE','FEMALE'])for(const request of requests){
   const features={dayun:{traditionalSex,count:10}},old=calculate(baseline,request,features);counts.baselineProductCalls++;baseDigest.push(fingerprint({m1:old.m1.chart,candidates:old.luck.candidates.map(c=>c.dayun)}));
   const next=selected?calculate(selected,request,features):null;if(next){counts.selectedProductCalls++;assert.deepEqual(next.m1,old.m1);}
   for(const c of old.luck.candidates){counts.baselineCandidates++;const status=c.dayun.start.status;statuses[status]=(statuses[status]??0)+1;
    if(status==='NEEDS_DATA'){counts.missingCandidates++;assert.deepEqual(c.dayun.start.missingData.map(({year,term,feature})=>({year,term,feature})),[{year:2027,term:'XIAOHAN',feature:'DA_YUN_START'}]);missing.push({minute:vector.minute,calendar:request.calendar,traditionalSex,policies:vector.policy,candidateRef:c.candidateRef,direction:c.dayun.direction.direction,missingData:c.dayun.start.missingData});}
    if(!next)continue;const nc=next.luck.candidates[c.candidateIndex];assert.equal(nc.candidateRef,c.candidateRef);assert.deepEqual(nc.dayun.direction,c.dayun.direction);assert.deepEqual(nc.dayun.sequence,c.dayun.sequence);
    if(status==='NEEDS_DATA'){if(nc.dayun.start.status==='OK'){counts.missingChangedToOK++;assert.equal(nc.dayun.start.selectedEvent.term,'XIAOHAN');assert.equal(nc.dayun.start.selectedEvent.displayedDateTime,supplement.events[0].displayedDateTime);}else{counts.missingStillMissing++;assert.equal(nc.dayun.start.status,'NEEDS_DATA');}}
    else{assert.deepEqual(nc.dayun,c.dayun);if(c.dayun.direction.direction==='REVERSE')counts.reverseUnchanged++;if(status==='AMBIGUOUS')counts.ambiguousUnchanged++;}
   }
   if(next){const projected=projectLocalLuckResult(next,{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02});validateLocalLuckProjectionResult(projected);counts.projectionCandidates+=projected.projection.candidates.length;}
  }
 }
 counts.productM1Calls=calls;assert.equal(calls,counts.baselineProductCalls+counts.selectedProductCalls);assert.equal(counts.gridVectorsInspected,47975);assert.equal(counts.missingCandidates,162,'Prior cohort cardinality must be recomputed, not copied into a PASS');
 if(supplement){assert.equal(counts.missingChangedToOK,counts.missingCandidates,'Verified Xiaohan must actually resolve every independently identified Xiaohan-only shortage');assert.equal(counts.missingStillMissing,0,'Do not label an unresolved selected cohort PASS');}
 const after=await preserve();assert.deepEqual(after,before);
 const result={schemaVersion:'kasi-2027-boundary-cohort-verification-v1',status:supplement?'ACTUAL_SELECTED_SUPPLEMENT_COHORT_PASS':'BASELINE_ACTUAL_PASS_SELECTED_NOT_RUN',testHead:git(['rev-parse','HEAD']),workingTree:git(['status','--porcelain']),runtime:process.version,requestedTZ:process.env.TZ??null,resolvedTZ:Intl.DateTimeFormat().resolvedOptions().timeZone,scope:'ALL_47975_VECTORS_INSPECTED_LAST_JIE_TAIL_PRODUCT_CALCULATIONS_ONLY_NOT_FULL_REACCEPTANCE',cutoff,counts,statuses,baselineMeaningSha256:fingerprint(baseDigest),supplement:supplement?{contentSha256:supplement.contentSha256,baseManifestSha256:supplement.baseManifestSha256}:null,selectedActualValidation:supplement?'PERFORMED':'NOT_RUN_NO_ACCEPTED_ACTUAL_API_SUPPLEMENT',preserved:after,apiRequests:0,missingCohort:missing};
 result.executedModuleSha256={};for(const path of ['scripts/kasi/boundary-supplement.mjs','scripts/kasi/boundary-supplement-verify.mjs','scripts/kasi/local-luck.mjs','scripts/kasi/local-luck-projection.mjs','scripts/kasi/local-chart.mjs','dist/luck/luckV01.js','dist/luck/calendarProjectionV02.js'])result.executedModuleSha256[path]=sha(await readFile(path));
 await writeFile(join(outputDirectory,'report.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const a=process.argv.slice(2);assert.ok((a.length===2||a.length===4)&&a[0]==='--out');let blockedNetworkCalls=0;const deny=()=>{blockedNetworkCalls++;throw Error('NETWORK_FORBIDDEN');};net.Socket.prototype.connect=deny;globalThis.fetch=deny;for(const key of Object.keys(process.env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key))delete process.env[key];const result=await verifyBoundaryShortageCohort({outputDirectory:a[1],...(a.length===4?{supplementDirectory:a[2],expectedSupplementSha256:a[3]}:{})});assert.equal(blockedNetworkCalls,0);console.log(JSON.stringify({...result,missingCohort:undefined,blockedNetworkCalls}));}catch{console.error(JSON.stringify({status:'REJECTED',code:'BOUNDARY_COHORT_VERIFICATION_FAILED'}));process.exitCode=1;}}
