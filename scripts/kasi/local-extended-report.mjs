/** Explicit Sprint4 calendar scopes. Does not replace the Sprint3 product profile. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fingerprint} from '../../.kasi-build/schema.js';
import {parseLocalChartArgs,verifyLocalChartResult,getLocalChartEventContext,verifyLocalChartEventContext,EXTENDED_SOLAR_PROFILE_ID} from './local-chart.mjs';
import {loadExtendedLocalChartProfile} from './local-extended-chart.mjs';
import {createLocalM3EvidenceProfile,validateLocalM3EvidenceResult,renderLocalM3EvidenceText} from './local-m3-evidence.mjs';
import {M2_LOCAL_PROFILE_ID,validateLocalChartFacts} from './local-chart-facts.mjs';
import {M3_EVIDENCE_PROFILE_ID} from '../../dist/m3/structuralEvidenceV1.js';
import {M3_SEASONAL_POLICY_ID} from '../../dist/m3/seasonalStateV1.js';
import {M3_ROOT_POLICY_ID} from '../../dist/m3/rootPresenceV1.js';
import {M3_SUPPORT_POLICY_ID} from '../../dist/m3/resourceSupportV1.js';
import {M4_INNER_PATTERN_PROFILE_ID,deriveM4InnerPatterns,validateM4InnerPatterns,explainM4InnerPatterns,renderM4InnerPatternsText} from '../../dist/m4/innerPatternsV1.js';
import {GONGMANG_POLICY_ID,deriveGongmang,validateGongmang,explainGongmang} from '../../dist/domain/gongmangV1.js';
import {M5_LIMITED_PURPOSE_POLICY_ID,M5_LIMITED_PURPOSE_METADATA} from '../../dist/m5/limitedPurposeV1.js';
import {M3_SEASONAL_SILI_METADATA} from '../../dist/m3/seasonalStateV2.js';
import {MONTHLY_LUCK_V2_POLICY_ID,MONTHLY_LUCK_V2_METADATA,compileMonthlyTimelineV2,monthlyLuckAtMinuteV2,monthlyLuckYearTableV2} from '../../dist/luck/monthlyLuckV2.js';
import {labelKoreanGanZhi} from '../../dist/calendar/koreanBirthPreview.js';
import {isGregorianMinute} from '../../dist/calendar/solarTermTimeline.js';

export const EXTENDED_REPORT_PROFILE_ID='KASI-LOCAL-EXTENDED-CALENDAR-ANALYSIS-V01';
export const EXTENDED_REPORT_SCHEMA='kasi-local-extended-calendar-analysis-v1';
const VERSION='0.1.0',issued=new WeakMap(),roles=['year','month','day','hour'],roleNames={year:'연',month:'월',day:'일',hour:'시'};
const elementNames={WOOD:'목(木)',FIRE:'화(火)',EARTH:'토(土)',METAL:'금(金)',WATER:'수(水)'},stateNames={WANG:'왕(旺)',XIANG:'상(相)',XIU:'휴(休)',QIU:'수(囚)',SI:'사(死)'};
function check(ok,code){if(!ok)throw new RangeError(code);}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const label=p=>{const v=labelKoreanGanZhi(p);return v.hanja+'('+v.hangul+')';};
function monthlyOptions(value={}){
 check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>['policyId','year','queryMinute'].includes(k)),'EXTENDED_MONTHLY_OPTIONS');
 const requested=value.year!==undefined||value.queryMinute!==undefined;
 if(!requested){check(value.policyId===undefined,'MONTHLY_QUERY_REQUIRED');return null;}
 check(value.policyId===MONTHLY_LUCK_V2_POLICY_ID,'EXPLICIT_EXTENDED_MONTHLY_POLICY_REQUIRED');
 if(value.year!==undefined)check(Number.isInteger(value.year)&&value.year>=1&&value.year<=9999,'MONTHLY_YEAR_INTEGER_REQUIRED');
 if(value.queryMinute!==undefined)check(typeof value.queryMinute==='string'&&isGregorianMinute(value.queryMinute),'EXPLICIT_MONTHLY_QUERY_MINUTE_REQUIRED');return value;
}
function valueAt(root,path){return path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],root);}
function summaryFor(value){
 const titles=['나의 사주팔자','일간과 오행','대표 구조와 공망','계절·강약 관련 정보','목적별 도움 요소 후보','대운·세운·월운','확인한 내용과 남은 판단'];
 const sections=titles.map((title,i)=>({id:'section-'+i,title,items:[]}));
 const add=(n,id,text,paths,candidateRef)=>sections[n].items.push({id,text,...(candidateRef?{candidateRef}:{}),valueRefs:paths.map(valuePath=>({valuePath}))});
 const parents=value.facts.candidates;
 if(parents.length>1)add(0,'published-minute','절입과 같은 표시 분이므로 원국 두 후보를 각각 유지합니다.',['m1.chart.confidence']);
 parents.forEach((c,i)=>{
  const prefix=parents.length>1?`후보 ${i+1} — `:'',ref=c.id;
  add(0,ref+'#pillars',prefix+c.pillars.map(p=>roleNames[p.role]+'주 '+label(p)).join(' · '),[`facts.candidates[${i}].pillars`],ref);
  const dm=c.pillars[2].nature.stem;
  add(1,ref+'#day-master',prefix+`일간은 ${c.dayMaster}이며 오행은 ${elementNames[dm.element]}입니다. 천간·지지와 장간의 분류는 상세 근거에 구분해 제공합니다.`,[`facts.candidates[${i}].dayMaster`,`facts.candidates[${i}].pillars[2].nature.stem`],ref);
  const p=value.innerPatterns.candidates[i],type=p.selection.primaryPattern;
  const pattern=p.patterns.find(x=>x.patternType===type);
  add(2,ref+'#pattern',prefix+(type?`월령 본기를 근거로 ${pattern.patternNameKo}(${type}) 구조 후보를 검토합니다.`:'월령 본기가 비겁이어서 여덟 내격의 대표 후보를 정하지 않습니다.')+(p.selection.candidateTypes.length>1?' 다른 월령 장간의 후보도 있어 단독 선택은 보류합니다.':''),[`innerPatterns.candidates[${i}].selection`],ref);
  const g=value.gongmang[i];add(2,ref+'#void',prefix+`선택 일주의 공망 지지는 ${g.voidBranches.join('·')}입니다. 원국 대응은 ${g.observedMatches.length}위치이며 길흉은 판단하지 않습니다.`,[`gongmang[${i}]`],ref);
  const season=value.seasonal.candidates[i].judgment;
  const root=value.root.candidates[i].targets.find(t=>t.target.pillarRole==='day');
  add(3,ref+'#season-root',prefix+(season.status==='RESOLVED_UNDER_POLICY'?`선택한 월지 계절 표에서 ${stateNames[season.seasonalState??season.dayMaster?.seasonalState]} 분류에 해당합니다.`:'선택한 계절 v0.1은 계절말 토월을 보류합니다.')+(root?` 일간의 구성상 근은 ${root.chartRootPresence==='PRESENT_UNDER_POLICY'?'확인됩니다':'이 정책에서 확인되지 않습니다'}.`:'')+' 전체 강약과 실제 근력은 확정하지 않습니다.',[`seasonal.candidates[${i}]`,`root.candidates[${i}]`],ref);
  add(4,ref+'#m5',prefix+'기존 M5는 현대 사립 계절 정책에 의존합니다. 이번 확장 프로필은 그 의존 범위를 소급 변경하지 않아 목적별 후보를 보류합니다. 도움 요소가 없다는 뜻은 아닙니다.',[`m5.candidates[${i}]`],ref);
 });
 add(5,'m7-scope','대운·세운의 기존 경로와 정책은 유지합니다. 이 확장 리포트에서는 추가 효력 판단이나 현재 시각 추정을 하지 않습니다.',['featureScope.m7']);
 if(value.monthly.status==='NOT_REQUESTED')add(5,'monthly-not-requested','월운은 요청하지 않았습니다. 연도나 조회 분을 직접 지정해야 합니다.',['monthly.status']);
 else if(value.monthly.status==='POLICY_UNRESOLVED')add(5,'monthly-clock-held','요청한 월운 정책은 현재 역사시 프로필에 채택되지 않아 보류합니다.',['monthly']);
 else{
  if(value.monthly.yearTable){const t=value.monthly.yearTable;add(5,'monthly-year',`${t.yearLabel}년 월운은 입춘부터 다음 입춘까지입니다. ${t.rows.filter(r=>r.status==='RESOLVED_UNDER_POLICY').length}/12구간의 경계가 확인됐습니다.`,['monthly.yearTable']);}
  if(value.monthly.birthLink?.queryRelation==='BEFORE_BIRTH')add(5,'monthly-before-birth','조회 시각은 출생보다 앞섭니다. 개인의 운세 기간이 아닌 독립 달력 조회입니다.',['monthly.birthLink']);
  if(value.monthly.atMinute){const q=value.monthly.atMinute;add(5,'monthly-query',q.entries.length?`조회 ${q.queryMinute.replace('T',' ')}의 월간지는 ${q.entries.map(e=>label(e.monthPillar)).join(' / ')}입니다.${q.entries.length>1?' 표시 분의 전후 조건을 유지합니다.':''}`:'필요한 자료 또는 시계 정책이 부족해 월운 조회를 보류합니다.',['monthly.atMinute']);}
 }
 add(6,'limits','명식·십성·장간·공망은 계산과 선택 분류의 결과입니다. 격국 성패·최종 용신·개인 사건은 확정하지 않았습니다.',['featureScope']);
 if(value.m1.evidence.dateConversion.method==='GREGORIAN_ARITHMETIC_WITHOUT_LUNAR_MAPPING')add(6,'lunar-data-missing','2027 양력 명식은 계산했지만 음력 날짜 대응 자료는 없습니다. 음력 변환 결과를 추정해 채우지 않습니다.',['m1.evidence.dateConversion']);
 return {title:'나의 사주 분석 요약',templateVersion:VERSION,sections};
}
export function createLocalExtendedReportProfile(chartProfile,selection={}){
 check(selection&&typeof selection==='object'&&!Array.isArray(selection)&&Object.keys(selection).every(k=>['reportProfileId','contextProfile'].includes(k)),'EXTENDED_FIXED_SUBPOLICY_CONFLICT');
 const {reportProfileId,contextProfile=chartProfile}=selection;
 check(reportProfileId===EXTENDED_REPORT_PROFILE_ID,'EXPLICIT_EXTENDED_REPORT_PROFILE_REQUIRED');
 const context=getLocalChartEventContext(contextProfile);verifyLocalChartEventContext(context);
 const bridge=createLocalM3EvidenceProfile(chartProfile,{m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_EVIDENCE_PROFILE_ID,seasonalPolicyId:M3_SEASONAL_POLICY_ID,rootPolicyId:M3_ROOT_POLICY_ID,supportPolicyId:M3_SUPPORT_POLICY_ID,contextProfile});
 const timeline=context.profile.id===EXTENDED_SOLAR_PROFILE_ID?compileMonthlyTimelineV2(context.events):null;
 return Object.freeze({calculate(request,options={}){
  check(options&&typeof options==='object'&&!Array.isArray(options)&&Object.keys(options).every(k=>['monthlyOptions','directory','expectedManifestSha256','profileId','request','reportProfileId','detail','output','annualSolarDirectory'].includes(k)),'EXTENDED_REPORT_ARGUMENTS');
  const monthlyRequest=monthlyOptions(options.monthlyOptions);
  const base=bridge.calculate(request);
  if(base.m1?.status!=='OK')return {schemaVersion:EXTENDED_REPORT_SCHEMA,status:base.status,m1:base.m1,reason:base.m1?.reason??'BIRTH_CLOCK_OR_DATA_UNSUPPORTED'};
  const {m1,facts,evidence,seasonal,root,support}=base;verifyLocalChartResult(m1,{request});verifyLocalChartEventContext(context,{calculation:m1});
  const innerPatterns=deriveM4InnerPatterns(evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts:facts});
  const gongmangInputs=facts.candidates.map(c=>({candidateRef:c.id,policyId:GONGMANG_POLICY_ID,pillars:c.pillars.map(p=>({role:p.role,stem:p.stem,branch:p.branch,factRef:c.facts.find(f=>f.kind==='PILLAR_NATURE'&&f.value.role===p.role).id})),calculationPolicyRefs:Object.values(m1.policies).map(p=>p.id)}));
  const gongmang=gongmangInputs.map(deriveGongmang);
  let monthly={status:'NOT_REQUESTED'};
  if(monthlyRequest){
   if(!timeline)monthly={status:'POLICY_UNRESOLVED',reason:'MONTHLY_V2_CLOCK_NOT_SELECTED_FOR_HISTORICAL_PROFILE',policy:MONTHLY_LUCK_V2_METADATA};
   else{
    const atMinute=monthlyRequest.queryMinute===undefined?null:monthlyLuckAtMinuteV2({timeline,queryMinute:monthlyRequest.queryMinute,policyId:monthlyRequest.policyId});
    const yearTable=monthlyRequest.year===undefined?null:monthlyLuckYearTableV2({timeline,year:monthlyRequest.year,policyId:monthlyRequest.policyId});
    const ids=new Set();function used(v){if(v&&typeof v==='object')for(const [k,x]of Object.entries(v)){if(k==='calculationSourceRefs')for(const id of x)ids.add(id);else used(x);}}used({atMinute,yearTable});
    const sources=[...MONTHLY_LUCK_V2_METADATA.sources,...[...ids].map(id=>{const source=context.evidence.find(e=>e.id===id);check(source,'EXTENDED_MONTHLY_SOURCE_REQUIRED');return source;})];
    monthly={status:'MONTHLY_TIME_AXIS_ONLY',policy:MONTHLY_LUCK_V2_METADATA,atMinute,yearTable,sources,birthLink:{queryRelation:atMinute?(atMinute.queryMinute<m1.chart.recordedBirthKstMinute?'BEFORE_BIRTH':'AT_OR_AFTER_BIRTH'):null},executionCounts:{birthM1Calls:0}};
   }
  }
  const m5={status:'HOLD',policyId:M5_LIMITED_PURPOSE_POLICY_ID,policyVersion:M5_LIMITED_PURPOSE_METADATA.version,execution:'NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY',policyRelation:'REFERENCE_ONLY_NOT_ISSUED_M5_DECISION',reason:'ORIGINAL_SILI_CLOCK_DEPENDENCY_NOT_EXTENDED',dependency:{requiredSeasonalPolicy:{id:M3_SEASONAL_SILI_METADATA.id,version:M3_SEASONAL_SILI_METADATA.version,clockPolicy:M3_SEASONAL_SILI_METADATA.clockPolicy},selectedClock:m1.policies.clock,selectedSeasonalPolicy:{id:seasonal.policy.id,version:seasonal.policy.version}},candidates:facts.candidates.map(c=>({candidateRef:c.id,status:'HOLD',candidateElements:[],reason:'ORIGINAL_SILI_CLOCK_DEPENDENCY_NOT_EXTENDED'}))};
  const value={schemaVersion:EXTENDED_REPORT_SCHEMA,status:'EXTENDED_CALENDAR_ANALYSIS_ONLY',profile:{id:reportProfileId,version:VERSION,defaultEngineReplacement:false},m1,facts,evidence,seasonal,root,support,innerPatterns,gongmang,m5,monthly,
   featureScope:{calendar:'BOUNDED_SELECTED_CLOCK_PROFILE',seasonal:'EXPLICIT_V1_EARTH_MONTHS_DEFERRED_NOT_SILI_V2',m5:'CLOCK_DEPENDENCY_HOLD_NOT_RULE_CHANGE',m7:'EXISTING_LEGACY_PRODUCT_ROUTE_UNCHANGED_NOT_EXPANDED_HERE',finalStrength:'NOT_IMPLEMENTED',patternEffects:'NOT_IMPLEMENTED',prediction:'NOT_IMPLEMENTED'},
   executionCounts:{birthM1Calls:1,m2Derivations:1,m3BridgeDerivations:1,monthlyBirthM1Calls:0},technical:{birthProfile:m1.profile,dataset:m1.dataset,calculationPolicies:m1.policies,scope:'SELECTED_LOCAL_RESEARCH_PROFILE',commercialApiUse:'CONDITIONAL_SUBSET_AUDIT_NOT_FINAL_LEGAL_CERTIFICATION',customerDistribution:'UNRESOLVED'}};
  value.summary=summaryFor(value);value.detailed={summary:value.summary,evidenceRefs:['m1','facts','evidence','seasonal','root','support','innerPatterns','gongmang','m5','monthly'],technicalRef:'technical'};
  freeze(value);issued.set(value,{hash:fingerprint(value),base,gongmangInputs});validateLocalExtendedReportResult(value);return value;
 }});
}
export async function loadLocalExtendedReportProfile(options){return createLocalExtendedReportProfile(await loadExtendedLocalChartProfile(options),{reportProfileId:options.reportProfileId});}
export function validateLocalExtendedReportResult(value){
 const receipt=issued.get(value);check(receipt&&Object.isFrozen(value)&&receipt.hash===fingerprint(value),'ISSUED_EXTENDED_REPORT_REQUIRED');
 verifyLocalChartResult(value.m1);validateLocalChartFacts(value.facts);validateLocalM3EvidenceResult(receipt.base);validateM4InnerPatterns(value.innerPatterns,{evidence:value.evidence,m2Facts:value.facts});
 value.gongmang.forEach((g,i)=>validateGongmang(g,receipt.gongmangInputs[i]));check(value.detailed.summary===value.summary,'EXTENDED_SHARED_SUMMARY_REQUIRED');
 for(const section of value.summary.sections)for(const item of section.items){if(item.candidateRef)check(value.facts.candidates.some(c=>c.id===item.candidateRef),'EXTENDED_SUMMARY_PARENT_REQUIRED');for(const r of item.valueRefs)check(valueAt(value,r.valuePath)!==undefined,'EXTENDED_SUMMARY_VALUE_REFERENCE_REQUIRED');}
 return true;
}
export function renderLocalExtendedReportText(value,{detail='summary'}={}){
 if(value.status!=='EXTENDED_CALENDAR_ANALYSIS_ONLY')return `명식 보류: ${value.status} (${value.reason??'자료 또는 시계 정책 확인 필요'})\n`;
 validateLocalExtendedReportResult(value);check(['summary','detailed'].includes(detail),'EXPLICIT_EXTENDED_DETAIL_REQUIRED');
 const summary=[value.summary.title,`양력 환산 ${value.m1.input.gregorianDate} ${value.m1.input.time}`,...value.summary.sections.flatMap((s,i)=>['',`${i+1}. ${s.title}`,...s.items.map(item=>item.text)]),'','정책·자료 지문과 세부 근거는 상세 리포트와 JSON에서 확인할 수 있습니다.'].join('\n')+'\n';
 if(detail==='summary')return summary;
 const receipt=issued.get(value);return [summary,'상세 근거 리포트',renderLocalM3EvidenceText(receipt.base),renderM4InnerPatternsText(explainM4InnerPatterns(value.innerPatterns)),...value.gongmang.map(explainGongmang),'M5 보류',JSON.stringify(value.m5,null,2),'월운',JSON.stringify(value.monthly,null,2),'기술 정보',JSON.stringify(value.technical,null,2)].join('\n')+'\n';
}
export function parseLocalExtendedReportArgs(args){
 check(Array.isArray(args)&&args.length>0&&args.length%2===0,'EXPLICIT_EXTENDED_ARGUMENTS_REQUIRED');
 const extra={},base=[],names=['--report-profile','--detail','--output','--solar-extension','--monthly-policy','--monthly-year','--monthly-query-minute'];
 for(let i=0;i<args.length;i+=2){check(typeof args[i]==='string'&&typeof args[i+1]==='string','EXTENDED_ARGUMENTS');if(names.includes(args[i])){check(!Object.hasOwn(extra,args[i]),'EXTENDED_ARGUMENT_DUPLICATE');extra[args[i]]=args[i+1];}else base.push(args[i],args[i+1]);}
 check(extra['--report-profile']===EXTENDED_REPORT_PROFILE_ID,'EXPLICIT_EXTENDED_REPORT_PROFILE_REQUIRED');check(['summary','detailed'].includes(extra['--detail']),'EXPLICIT_EXTENDED_DETAIL_REQUIRED');check(['json','text'].includes(extra['--output']),'EXPLICIT_EXTENDED_OUTPUT_REQUIRED');
 const parsed=parseLocalChartArgs(base),monthly={};
 if(extra['--monthly-policy']!==undefined)monthly.policyId=extra['--monthly-policy'];if(extra['--monthly-query-minute']!==undefined)monthly.queryMinute=extra['--monthly-query-minute'];
 if(extra['--monthly-year']!==undefined){check(/^\d+$/.test(extra['--monthly-year']),'MONTHLY_YEAR_INTEGER_REQUIRED');monthly.year=Number(extra['--monthly-year']);}monthlyOptions(monthly);
 return {...parsed,reportProfileId:EXTENDED_REPORT_PROFILE_ID,detail:extra['--detail'],output:extra['--output'],...(extra['--solar-extension']!==undefined?{annualSolarDirectory:extra['--solar-extension']}:{}),monthlyOptions:monthly};
}
export async function runLocalExtendedReportCli(args){const options=parseLocalExtendedReportArgs(args),profile=await loadLocalExtendedReportProfile(options),value=profile.calculate(options.request,options);process.stdout.write(options.output==='json'?JSON.stringify(value,null,2)+'\n':renderLocalExtendedReportText(value,{detail:options.detail}));if(value.status!=='EXTENDED_CALENDAR_ANALYSIS_ONLY')process.exitCode=2;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await runLocalExtendedReportCli(process.argv.slice(2));}catch{process.stderr.write(JSON.stringify({status:'REJECTED',code:'EXTENDED_INPUT_OR_DATA_REJECTED'})+'\n');process.exitCode=1;}}
