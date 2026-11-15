/** Dry-run only. No credential loading, collector construction, HTTP or file writes. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {SERVICES,daysInMonth,fingerprint} from '../../.kasi-build/schema.js';

export const SPRINT5_COLLECTION_PLAN_ID='KASI-SPRINT5-LUNAR-2027-BOUNDARY-2028-13-V01';
export const SPRINT5_COLLECTION_MAX_HTTP_ATTEMPTS=13;
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export class Sprint5CollectionPlanError extends Error {constructor(code){super(code);this.name='Sprint5CollectionPlanError';this.code=code;}}
const reject=code=>{throw new Sprint5CollectionPlanError(code);};
const requests=()=>[
 ...Array.from({length:12},(_,i)=>({id:'lunar-2027-'+String(i+1).padStart(2,'0'),sequence:i+1,serviceId:SERVICES.lunar.id,operation:SERVICES.lunar.operation,query:{service:'lunar',year:2027,month:i+1,page:1,format:'xml'},wireParametersWithoutCredentials:{solYear:'2027',solMonth:String(i+1).padStart(2,'0'),pageNo:'1',numOfRows:'100'},expectedRows:daysInMonth(2027,i+1),runtimePurpose:'SOLAR_DATE_2027_LUNAR_MAPPING'})),
 {id:'solar-2028-annual',sequence:13,serviceId:SERVICES.solar.id,operation:SERVICES.solar.operation,query:{service:'solar',year:2028,page:1,format:'xml'},wireParametersWithoutCredentials:{solYear:'2028',pageNo:'1',numOfRows:'100'},expectedRows:24,runtimePurpose:'TWO_BOUNDARIES_ONLY_XIAOHAN_LICHUN'},
];
export function createSprint5CompletionPlan(){
 const content={schemaVersion:'kasi-sprint5-completion-collection-plan-v1',planId:SPRINT5_COLLECTION_PLAN_ID,version:'1.0.0',mode:'DRY_RUN_ONLY',authorizationStatus:'NOT_AUTHORIZED_BY_CURRENT_TASK',
  intent:{lunarMappingSolarRange:{fromInclusive:'2027-01-01',untilExclusive:'2028-01-01'},solarRawYear:2028,solarRuntimeTerms:['XIAOHAN','LICHUN'],automaticBirthOrClockExpansion:false,sourceDatasetMutation:false,all2028TermsAutomaticallyEnabled:false},
  requests:requests(),budget:{plannedRequests:13,maxActualHttpAttempts:SPRINT5_COLLECTION_MAX_HTTP_ATTEMPTS,retriesPerPage:0,maximumPagesPerRequest:1,numOfRows:100,timeoutMs:10000,minimumIntervalMs:350,serialRequests:true,unexpectedAdditionalPages:'STOP_REQUIRES_REVISED_USER_APPROVAL',authQuotaOrAnyNonSuccess:'STOP_NO_AUTOMATIC_RETRY'},
  credentialPolicy:{currentKeyAccess:'NONE',afterApprovalOnly:'EXISTING_APPROVED_LOCAL_SAFE_INJECTION',symbols:[SERVICES.lunar.key,SERVICES.solar.key],noChatOrSourceKeyPaste:true,noBroadSecretSearch:true,missingKey:'STOP_BEFORE_FIRST_HTTP_ATTEMPT',secretBearingUrlOrHeaderLogging:false},
  reuse:{components:['scripts/kasi/collector.ts#Client.request','scripts/kasi/collector.ts#Store.load','scripts/kasi/collector.ts#Store.save','scripts/kasi/schema.ts#parsePage','scripts/kasi/schema.ts#normalizeLunar','scripts/kasi/schema.ts#validateLunar','scripts/kasi/schema.ts#normalizeSolar','scripts/kasi/schema.ts#validateSolar'],existing2027SolarRaw:'REUSE_ACCEPTED_EXISTING_CAPTURE_DO_NOT_REQUEST_AGAIN',successfulNewPage:'VERIFY_REQUEST_ID_RAW_HASH_RECEIPT_SCHEMA_THEN_REUSE_NO_REFETCH',wholeCollectorBuildYear:'NOT_CALLED_WOULD_FETCH_UNAPPROVED_EXTRA_YEAR_COMPONENTS'},
  executeReadiness:{currentCli:'ALWAYS_REJECT_EXECUTE_BEFORE_KEY_OR_TRANSPORT',lunar2027Client:'SUPPORTED_BY_EXISTING_BOUNDED_CLIENT',solar2028Client:'EXISTING_CLIENT_REJECTS_YEAR_2028',requiredNarrowChange:'SEPARATE_EXPLICIT_APPROVED_2028_ANNUAL_SOLAR_OPTION_WITH_OLD_DEFAULT_YEAR_RANGE_UNCHANGED',liveRequestsAlreadyMade:0},
  storage:{suggestedNewPrivateDirectory:'.private/kasi-sprint5-completion-<approved-run-id>',existingProtectedDirectories:'READ_ONLY',files:['plan.json','attempts.ndjson','raw/<response-sha256>.body','receipts/<source-ref>.json','capture-manifest.json','collection-receipt.json'],rawResponseScope:'FULL_2028_ANNUAL_RAW_PRIVATE_ONLY',sourceRecord:'SERVICE_OPERATION_SECRET_FREE_QUERY_REQUESTED_AT_RESPONSE_FORMAT_RESULT_CODE_RAW_SHA256',defaultWrites:'NONE_DRY_RUN_STDOUT_ONLY',runtimeAcceptance:'SEPARATE_REVIEW_NEW_FIXED_EXPECTED_PIN_NO_AUTO_ACTIVATION'},
  acceptance:{lunar2027:['365 consecutive solar dates','12 complete requested solar-month pages','leap flag and lunar month length preserved','solar/lunar roundtrip and source links','existing2026/2027 boundary continuity'],solar2028:['24 unique named rows in the private raw response','published MINUTE required for Xiaohan and Lichun','no 24:00 reinterpretation without policy','independent primary table comparison','runtime selected terms exactly Xiaohan/Lichun'],rights:'API_PERMISSION_AND_SOURCE_AUDIT_SEPARATE_FROM_WEB_PRELIMINARY_TABLE_OR_KASA_WORK_LICENSE',newManifest:'INDEPENDENT_REVIEW_AND_PIN_REQUIRED_BEFORE_RUNTIME'},
  approvalQuestion:'2027년 getLunCalInfo의 양력1~12월 각1회와2028년 get24DivisionsInfo 연간1회, 총13 HTTP시도 이내·재시도0의 제한 수집을 승인하시겠습니까? 기존에 안전하게 주입된 해당API 키가 있을 때만 사용하고 없으면 중단합니다. 원문은 새 .private 디렉터리에만 보존하며 기존 자료를 수정하지 않습니다. 인증·쿼터·비정상 응답이나 추가 페이지 요구 시 즉시 중단하고, 성공 응답은 재사용합니다. 2028 원문24행 중 실행 대상은 소한·입춘 두 경계뿐이며 새 자료는 독립 검토·새 고정지문 수락 전에는 제품에 활성화하지 않습니다.',
 };
 return freeze({...content,planSha256:fingerprint(content)});
}
export function parseSprint5CompletionPlanArgs(args){
 if(!Array.isArray(args)||args.length%2!==0)reject('SPRINT5_PLAN_ARGUMENTS_REJECTED');
 const options={mode:'dry-run',output:'json'};
 const seen=new Set();
 for(let i=0;i<args.length;i+=2){const name=args[i],value=args[i+1];if(!['--mode','--output'].includes(name)||seen.has(name)||typeof value!=='string')reject('SPRINT5_PLAN_ARGUMENTS_REJECTED');seen.add(name);options[name.slice(2)]=value;}
 if(options.mode==='execute')reject('SPRINT5_COLLECTION_REQUIRES_SEPARATE_EXPLICIT_USER_APPROVAL');
 if(options.mode!=='dry-run'||!['json','text'].includes(options.output))reject('SPRINT5_PLAN_ARGUMENTS_REJECTED');
 return Object.freeze(options);
}
export function renderSprint5CompletionPlan(plan){return [
 'Sprint 5 결손 자료 수집 계획 — 실행 미승인·dry-run',
 '2027 양력1~12월 음력일정보12요청 + 2028 연간24절기1요청 = 기본13요청입니다.',
 '실제 HTTP시도 총13회 이내, 재시도0, 직렬350ms 간격입니다. 추가 페이지·인증·쿼터·비정상 응답은 즉시 중단합니다.',
 '현재는 키/자격증명 읽기·네트워크·원문 파일 생성이 없습니다.',
 '2028 raw24행은 비공개 보존 대상으로 계획하고 runtime은 소한·입춘만 별도 수락합니다.',
 '기존 Collector의2028년 제한은 실행 승인 후 좁은 명시 옵션으로 보완해야 합니다.',
 '자료 수락은 수집과 별개이며 새 고정지문을 독립 검토하기 전 자동 활성화하지 않습니다.',
 '계획 ID: '+plan.planId,'계획 지문: '+plan.planSha256,plan.approvalQuestion,
].join('\n')+'\n';}
export async function main(args=process.argv.slice(2)){
 try{const options=parseSprint5CompletionPlanArgs(args),plan=createSprint5CompletionPlan();process.stdout.write(options.output==='json'?JSON.stringify(plan,null,2)+'\n':renderSprint5CompletionPlan(plan));}
 catch(error){process.stderr.write(JSON.stringify({status:'REJECTED',code:error instanceof Sprint5CollectionPlanError?error.code:'SPRINT5_PLAN_REJECTED'})+'\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
