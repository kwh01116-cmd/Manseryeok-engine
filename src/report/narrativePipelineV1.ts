import {buildConsumerReport,validateConsumerReport,validateReportProjection,type ConsumerReport,type ReportProjection,type ReportState} from "./consumerReportV1.js";
import {INTERPRETATION_PROFILE_ID,INTERPRETATION_VERSION,INTERPRETATION_POLICIES,INTERPRETATION_SOURCES,DOMAINS,contextsFromProjection,resolveSymbolicInterpretation,assertInterpretationJson,canonicalInterpretation,freezeInterpretation,type ExistingSupport,type GroundedInterpretationClaim} from "./interpretationPolicyV1.js";

export const INTERPRETED_REPORT_SCHEMA="saju-interpreted-consumer-report-v1" as const;
export const NARRATIVE_GENERATOR_VERSION="0.1.0" as const;
export const NARRATIVE_ARTIFACT_VERSION="1.0.0" as const;
export interface InterpretationBasis {projection:ReportProjection;baseReport:ConsumerReport;existingSupport:Record<string,ExistingSupport[]>;}
export interface ReportBlock {blockId:string;chartCandidateRef:string|null;claimRefs:string[];policyRefs:{id:string;version:string}[];status:ReportState;text:string;variantId:"STANDARD"|"REFLECTIVE";kind:"EXISTING_READING"|"SYMBOLIC_INTERPRETATION"|"COMPOSITION";}
export interface NarrativeIssue {category:"FACT"|"CLAIM"|"QUALITY"|"SAFETY"|"GENERATOR";code:string;blockId:string|null;}
export interface GenerationTrace {requested:"DETERMINISTIC"|"LOCAL_MOCK";used:"DETERMINISTIC"|"APPROVED_VARIANTS";attemptCount:number;fallbackUsed:boolean;failures:NarrativeIssue[];}
export interface InterpretedReport {
  schemaVersion:typeof INTERPRETED_REPORT_SCHEMA;profile:{id:typeof INTERPRETATION_PROFILE_ID;version:typeof INTERPRETATION_VERSION};
  contextId:string;basis:InterpretationBasis;interpretationClaims:GroundedInterpretationClaim[];
  sections:{id:string;chapter:number;title:string;status:ReportState;blocks:ReportBlock[]}[];
  opening:ReportBlock[];domainAssessments:{candidateRef:string;domains:{domain:string;status:string;decisionCode:string;claimRef:string}[]}[];
  eligibility:ConsumerReport["eligibility"];
  provenance:{calculationSourceDigest:string;dataVersion:string;dataFingerprint:string;interpretationSources:typeof INTERPRETATION_SOURCES;policies:{id:string;version:string}[];generatorVersion:string;artifactVersion:string;validationScope:string};
  generation:GenerationTrace;qa:{status:"PASS";meaningValidation:string;warnings:string[]};
}
const check=(ok:unknown,code:string):void=>{if(!ok)throw new RangeError(code);};
const unique=<T>(v:T[]):T[]=>[...new Set(v)];
const DOMAIN_NAME:Record<string,string>={BEHAVIOR:"행동을 돌아보는 관점",COMMUNICATION:"관계와 소통",WORK:"일과 활동 과정",MONEY:"재물과 자원 선택"};
const TITLES=["나의 사주 이해","명식의 구조","성향과 행동","관계·일·재물","시간의 흐름","종합 해석"];
const OPENING_THEME:Record<string,string>={OUTPUT_CONTROL:"표현하고 수정하는 관점과 외부 기준을 확인하는 관점을 함께 읽습니다.",RESOURCE_OUTPUT:"정보를 받아들이는 과정과 내 뜻을 설명해 내놓는 과정을 나누어 살펴봅니다.",PEER_WEALTH:"개인의 몫과 공동의 몫, 관리할 자원의 경계를 함께 살펴봅니다.",CONTROL_RESOURCE:"맡은 역할을 파악하는 관점과 필요한 자료·지원을 받아 정리하는 관점을 연결합니다.",OUTPUT_WEALTH:"결과물을 만드는 과정과 그 쓰임을 정하는 과정을 연결합니다."};
const DEFAULT_GENERATION:GenerationTrace={requested:"DETERMINISTIC",used:"DETERMINISTIC",attemptCount:0,fallbackUsed:false,failures:[]};
const ISSUE_CODES=["UNKNOWN_BLOCK","UNKNOWN_CLAIM","CROSS_CANDIDATE","POLICY_MIX","STATUS_CHANGED","HOLD_PROMOTED","UNAPPROVED_MEANING","FACT_TEXT_CHANGED","DUPLICATE_BLOCK","MISSING_BLOCK","DISALLOWED_PREDICTION","HOLLOW_PRAISE","KOREAN_PARTICLE_REVIEW","GENERATOR_UNAVAILABLE","GENERATOR_CONTRACT","GENERATOR_ABORTED"];

function validateBasis(basis:InterpretationBasis):void {
  assertInterpretationJson(basis);check(Object.keys(basis).sort().join(",")==="baseReport,existingSupport,projection","S7_BASIS_FIELDS");
  validateReportProjection(basis.projection);validateConsumerReport(basis.baseReport,{projection:basis.projection});
  contextsFromProjection(basis.projection,basis.existingSupport);
}
function validateGeneration(g:GenerationTrace):void {
  assertInterpretationJson(g);check(Object.keys(g).sort().join(",")==="attemptCount,failures,fallbackUsed,requested,used","S7_GENERATION_FIELDS");
  check(["DETERMINISTIC","LOCAL_MOCK"].includes(g.requested)&&["DETERMINISTIC","APPROVED_VARIANTS"].includes(g.used)&&Number.isSafeInteger(g.attemptCount)&&g.attemptCount>=0&&g.attemptCount<=2&&typeof g.fallbackUsed==="boolean"&&g.failures.length<=128,"S7_GENERATION_TRACE");
  check(g.requested!=="DETERMINISTIC"||g.used==="DETERMINISTIC"&&g.attemptCount===0&&!g.fallbackUsed&&!g.failures.length,"S7_DETERMINISTIC_TRACE");
  check(g.requested!=="LOCAL_MOCK"||g.attemptCount>=1,"S7_MOCK_ATTEMPT_REQUIRED");
  check(g.requested!=="LOCAL_MOCK"||g.used!=="DETERMINISTIC"||g.fallbackUsed&&g.failures.length>0,"S7_MOCK_FALLBACK_REQUIRED");
  check(!g.fallbackUsed||g.requested==="LOCAL_MOCK"&&g.used==="DETERMINISTIC"&&g.failures.length>0,"S7_FALLBACK_TRACE");
  for(const i of g.failures)check(Object.keys(i).sort().join(",")==="blockId,category,code"&&["FACT","CLAIM","QUALITY","SAFETY","GENERATOR"].includes(i.category)&&ISSUE_CODES.includes(i.code)&&(i.blockId===null||typeof i.blockId==="string"),"S7_GENERATOR_ISSUE_CODE");
}
function compose(basis:InterpretationBasis,variants:Record<string,"STANDARD"|"REFLECTIVE">={},generation:GenerationTrace=DEFAULT_GENERATION):InterpretedReport {
  validateBasis(basis);validateGeneration(generation);assertInterpretationJson(variants);
  const input=basis.projection,base=basis.baseReport,contexts=contextsFromProjection(input,basis.existingSupport);
  const claims=contexts.flatMap(c=>resolveSymbolicInterpretation(c,{profileId:INTERPRETATION_PROFILE_ID}));
  const validIds=new Set(claims.map(c=>c.claimId));check(Object.keys(variants).every(id=>validIds.has(id)&&["STANDARD","REFLECTIVE"].includes(variants[id]!)),"S7_VARIANT_SELECTION");
  check(generation.failures.every(i=>i.blockId===null||validIds.has(i.blockId)),"S7_FAILURE_REFERENCE");
  check(generation.used!=="DETERMINISTIC"||Object.values(variants).every(v=>v==="STANDARD"),"S7_DETERMINISTIC_VARIANTS");
  const sections=TITLES.map((title,i)=>({id:input.contextId+"/interpreted/chapter/"+(i+1),chapter:i+1,title,status:"LIMITED" as ReportState,blocks:[] as ReportBlock[]}));
  const sourceClaims=new Map(base.interpretationClaims.map(c=>[c.claimId,c]));
  for(const section of base.narrativeSections.filter(s=>[1,2,5].includes(s.chapter)))for(const id of section.claimIds){const c=sourceClaims.get(id)!;if(c.templateId==="lead")continue;
    const block:ReportBlock={blockId:id,chartCandidateRef:c.candidateId,claimRefs:[id],policyRefs:[{id:c.policyId,version:c.policyVersion}],status:c.status,text:c.text,variantId:"STANDARD",kind:"EXISTING_READING"};
    const duplicate=section.chapter===5?sections[4]!.blocks.find(b=>b.text===block.text&&b.status===block.status):null;
    if(duplicate){duplicate.claimRefs.push(id);duplicate.chartCandidateRef=null;}else sections[section.chapter-1]!.blocks.push(block);
  }
  const opening:ReportBlock[]=[];
  for(const context of contexts){const own=claims.filter(c=>c.chartCandidateRef===context.candidateId),prefix=contexts.length>1?`후보 ${context.ordinal}: `:"";
    for(const c of own){const variant=variants[c.claimId]??"STANDARD",text=variant==="REFLECTIVE"?c.alternativeText:c.consumerText;
      const block:ReportBlock={blockId:c.claimId,chartCandidateRef:c.chartCandidateRef,claimRefs:[c.claimId],policyRefs:[{id:c.interpretationPolicyId,version:c.interpretationPolicyVersion}],status:c.confidenceOrApplicabilityStatus,text:prefix+text,variantId:variant,kind:"SYMBOLIC_INTERPRETATION"};
      sections[c.domain==="BEHAVIOR"?2:3]!.blocks.push(block);
    }
    const limited=own.filter(c=>c.confidenceOrApplicabilityStatus==="LIMITED"),held=own.filter(c=>c.confidenceOrApplicabilityStatus==="HOLD");
    const supports=unique(limited.flatMap(c=>c.supportingConditions.flatMap(s=>s.locations.map(l=>`${l.stem}(${l.role==="year"?"연":l.role==="month"?"월":"시"})`))));
    const focus=own.flatMap(c=>c.supportingConditions).find(c=>Object.hasOwn(OPENING_THEME,c.code));
    const text=prefix+(focus?`${focus.locations.map(l=>`${l.role==="year"?"연간":l.role==="month"?"월간":"시간"} ${l.stem}`).join("·")}의 배치에서는 ${OPENING_THEME[focus.code]}`:limited.length?`${supports.join("·")}의 배치에서 선택한 전통적 관점입니다. ${limited[0]!.consumerText.split(". ")[0]}.`:"이번 표면 배치에서는 선택한 네 영역의 해석 전제가 닫히지 않아 개인별 관점을 고르지 않았습니다.");
    opening.push({blockId:input.contextId+"/"+context.candidateId+"/interpreted/opening",chartCandidateRef:context.candidateId,claimRefs:own.map(c=>c.claimId),policyRefs:own.map(c=>({id:c.interpretationPolicyId,version:c.interpretationPolicyVersion})),status:limited.length?"LIMITED":"HOLD",text,variantId:"STANDARD",kind:"COMPOSITION"});
    const summary=prefix+(limited.length?`현재 연결해 읽을 수 있는 관점은 ${limited.map(c=>DOMAIN_NAME[c.domain]).join("·")}입니다. `:"이번 정책으로 추가한 개인별 관점은 없습니다. ")+`${held.length?held.map(c=>DOMAIN_NAME[c.domain]).join("·")+"의 추가 해석은 보류합니다. ":""}같은 배치를 실제 행동이나 성과의 정답으로 정하지 않고, 내가 쓰는 기준을 확인하는 질문으로 읽어 보세요.`;
    sections[5]!.blocks.push({blockId:input.contextId+"/"+context.candidateId+"/interpreted/summary",chartCandidateRef:context.candidateId,claimRefs:own.map(c=>c.claimId),policyRefs:own.map(c=>({id:c.interpretationPolicyId,version:c.interpretationPolicyVersion})),status:limited.length?"LIMITED":"HOLD",text:summary,variantId:"STANDARD",kind:"COMPOSITION"});
    const conditions=own.flatMap(c=>c.competingConditions),codes=unique(conditions.map(c=>c.code));
    const contextParts:string[]=[];
    const combinations=conditions.filter(c=>c.code==="STEM_COMBINATION_MEMBERSHIP");
    if(combinations.length)contextParts.push(unique(combinations.map(c=>c.locations.map(l=>`${l.stem}(${l.role==="year"?"연":l.role==="month"?"월":"시"})`).join("·"))).join(" / ")+"의 오합 짝");
    if(codes.includes("OFFICER_KILLINGS_COEXISTENCE"))contextParts.push("정관·칠살의 표면 병존");
    if(codes.includes("OUTPUT_OFFICER_COEXISTENCE"))contextParts.push("상관·정관의 표면 병존");
    if(codes.includes("EXISTING_RESOURCE_SUPPORT_LIMITATION"))contextParts.push("기존 인성 합 규칙의 채택 유보 또는 효력 미정");
    if(codes.includes("MONTH_COMPATIBILITY_UNRESOLVED"))contextParts.push("월령 장간 호환 정책의 보류");
    if(contextParts.length)sections[5]!.blocks.push({blockId:input.contextId+"/"+context.candidateId+"/interpreted/counter-context",chartCandidateRef:context.candidateId,claimRefs:own.map(c=>c.claimId),policyRefs:own.map(c=>({id:c.interpretationPolicyId,version:c.interpretationPolicyVersion})),status:"LIMITED",text:prefix+contextParts.join("·")+"도 함께 보존했습니다. 이 조건들의 실제 작용과 우열은 이번 역할 해석으로 확정하지 않았습니다.",variantId:"STANDARD",kind:"COMPOSITION"});
  }
  if(!contexts.length){const holds=base.interpretationClaims.filter(c=>c.templateId==="input-hold");for(const h of holds)opening.push({blockId:h.claimId,chartCandidateRef:null,claimRefs:[h.claimId],policyRefs:[{id:h.policyId,version:h.policyVersion}],status:h.status,text:h.text,variantId:"STANDARD",kind:"EXISTING_READING"});}
  for(const s of sections)s.status=s.blocks.some(b=>b.status==="LIMITED"||b.status==="SUPPORTED")?"LIMITED":"HOLD";
  const warnings=[...(!contexts.length?["INPUT_NOT_CALCULATED_NO_INTERPRETATION_CLAIMS"]:[]),...(!claims.some(c=>c.confidenceOrApplicabilityStatus==="LIMITED")?["NO_APPLICABLE_SYMBOLIC_DOMAIN"]:[]),"CLOSED_CATALOG_QA_NOT_HUMAN_EXPERT_OR_BUYER_VALIDATION","SHARED_ROLE_EXPLANATIONS_MAY_REPEAT_ACROSS_REPORTS"];
  return {schemaVersion:INTERPRETED_REPORT_SCHEMA,profile:{id:INTERPRETATION_PROFILE_ID,version:INTERPRETATION_VERSION},contextId:input.contextId,basis:structuredClone(basis),interpretationClaims:claims,sections,opening,
    domainAssessments:contexts.map(c=>({candidateRef:c.candidateId,domains:claims.filter(x=>x.chartCandidateRef===c.candidateId).map(x=>({domain:x.domain,status:x.confidenceOrApplicabilityStatus,decisionCode:x.decisionCode,claimRef:x.claimId}))})),
    eligibility:{...structuredClone(base.eligibility),chapters:sections.map(s=>({chapter:s.chapter,status:s.status})),reasons:unique([...base.eligibility.reasons.filter(r=>r!=="PERSONAL_TRAIT_AND_TOPIC_CHAPTERS_HAVE_NO_ACCEPTED_POLICY"),"SYMBOLIC_PERSPECTIVE_NOT_DIAGNOSIS_OR_PREDICTION","EXPERT_AND_CONSUMER_BETA_NOT_RUN"])},provenance:{calculationSourceDigest:input.provenance.sourceDigest,dataVersion:input.provenance.dataVersion,dataFingerprint:input.provenance.dataFingerprint,interpretationSources:INTERPRETATION_SOURCES,policies:DOMAINS.map(d=>({id:INTERPRETATION_POLICIES[d],version:INTERPRETATION_VERSION})),generatorVersion:NARRATIVE_GENERATOR_VERSION,artifactVersion:NARRATIVE_ARTIFACT_VERSION,validationScope:"ISSUED_ADAPTER_THEN_DETERMINISTIC_INTERNAL_CONSISTENCY_NOT_RAW_API_AUTHENTICATION_OR_PREDICTIVE_VALIDITY"},generation:structuredClone(generation),qa:{status:"PASS",meaningValidation:"RECONSTRUCTED_CLAIMS_AND_CLOSED_APPROVED_VARIANTS_NOT_OPEN_ENDED_LANGUAGE_UNDERSTANDING",warnings}};
}

export function buildInterpretedReport(basis:InterpretationBasis,{profileId}:{profileId:string}):InterpretedReport {
  check(profileId===INTERPRETATION_PROFILE_ID,"S7_EXPLICIT_PROFILE_REQUIRED");assertInterpretationJson(basis);
  return freezeInterpretation(compose(structuredClone(basis)));
}
export function validateInterpretedReport(report:InterpretedReport):true {
  assertInterpretationJson(report);check(report.schemaVersion===INTERPRETED_REPORT_SCHEMA&&report.profile.id===INTERPRETATION_PROFILE_ID&&report.profile.version===INTERPRETATION_VERSION,"S7_REPORT_PROFILE");
  const variants=Object.fromEntries(report.sections.flatMap(s=>s.blocks).filter(b=>b.kind==="SYMBOLIC_INTERPRETATION").map(b=>[b.blockId,b.variantId]));
  check(canonicalInterpretation(report)===canonicalInterpretation(compose(report.basis,variants,report.generation)),"S7_REPORT_FACT_CLAIM_OR_NARRATIVE_TAMPERED");return true;
}
export function interpretedReportVersions(report:InterpretedReport){validateInterpretedReport(report);return {reportSchema:report.schemaVersion,reportProfile:report.profile,interpretationPolicies:report.provenance.policies,generatorVersion:NARRATIVE_GENERATOR_VERSION,artifactVersion:NARRATIVE_ARTIFACT_VERSION,dataVersion:report.provenance.dataVersion,dataFingerprint:report.provenance.dataFingerprint};}
export function auditNarrative(report:InterpretedReport,blocks:ReportBlock[]){
  validateInterpretedReport(report);assertInterpretationJson(blocks);check(Array.isArray(blocks)&&blocks.length<=128,"S7_NARRATIVE_BLOCK_LIMIT");
  const expected=report.sections.flatMap(s=>s.blocks).filter(b=>b.kind==="SYMBOLIC_INTERPRETATION"),issues:NarrativeIssue[]=[],seen=new Set<string>();
  const claims=new Map(report.interpretationClaims.map(c=>[c.claimId,c]));
  const issue=(category:NarrativeIssue["category"],code:string,blockId:string|null)=>issues.push({category,code,blockId});
  for(const b of blocks){if(!b||typeof b!=="object"||typeof b.blockId!=="string"){issue("CLAIM","UNKNOWN_BLOCK",null);continue;}
    if(seen.has(b.blockId))issue("QUALITY","DUPLICATE_BLOCK",expected.some(e=>e.blockId===b.blockId)?b.blockId:null);seen.add(b.blockId);
    const e=expected.find(x=>x.blockId===b.blockId);if(!e){issue("CLAIM","UNKNOWN_BLOCK",null);continue;}
    if(Object.keys(b).sort().join(",")!==Object.keys(e).sort().join(",")){issue("CLAIM","UNKNOWN_BLOCK",b.blockId);continue;}
    if(!Array.isArray(b.claimRefs)||b.claimRefs.some(id=>!claims.has(id))){issue("CLAIM","UNKNOWN_CLAIM",b.blockId);continue;}
    if(b.chartCandidateRef!==e.chartCandidateRef||b.claimRefs.some(id=>claims.get(id)!.chartCandidateRef!==e.chartCandidateRef))issue("FACT","CROSS_CANDIDATE",b.blockId);
    if(canonicalInterpretation(b.policyRefs)!==canonicalInterpretation(e.policyRefs))issue("CLAIM","POLICY_MIX",b.blockId);
    if(b.status!==e.status)issue("CLAIM",e.status==="HOLD"?"HOLD_PROMOTED":"STATUS_CHANGED",b.blockId);
    const c=claims.get(e.claimRefs[0]!)!,prefix=report.basis.projection.candidates.length>1?`후보 ${report.basis.projection.candidates.find(x=>x.id===c.chartCandidateRef)!.ordinal}: `:"";
    const selected=b.variantId==="STANDARD"?c.consumerText:b.variantId==="REFLECTIVE"?c.alternativeText:null;
    if(selected===null||b.text!==prefix+selected)issue("CLAIM","UNAPPROVED_MEANING",b.blockId);
    if(typeof b.text!=="string"){issue("CLAIM","UNAPPROVED_MEANING",b.blockId);continue;}
    if(/(?:반드시|무조건).{0,18}(?:사망|죽|이혼|임신|사고)|(?:암에 걸|투자.{0,16}(?:수익|손실).{0,10}(?:보장|확정))|(?:여자는|남자는).{0,12}(?:열등|무능)/u.test(b.text))issue("SAFETY","DISALLOWED_PREDICTION",b.blockId);
    if(/타고난 천재|놀라운 재능|누구보다 뛰어/u.test(b.text))issue("QUALITY","HOLLOW_PRAISE",b.blockId);
    if(/己은|癸은|甲은|壬를|申와/u.test(b.text))issue("QUALITY","KOREAN_PARTICLE_REVIEW",b.blockId);
    const normalized={...b,text:e.text,variantId:e.variantId};if(canonicalInterpretation(normalized)!==canonicalInterpretation(e)&&!issues.some(i=>i.blockId===b.blockId))issue("FACT","FACT_TEXT_CHANGED",b.blockId);
  }
  for(const e of expected)if(!seen.has(e.blockId))issue("CLAIM","MISSING_BLOCK",e.blockId);
  return freezeInterpretation({status:issues.length?"REJECTED" as const:"PASS" as const,issues,meaningValidation:"CLOSED_APPROVED_CATALOG_PLUS_FACT_CLAIM_RECONSTRUCTION_NOT_REGEX_ONLY_OR_GENERAL_SEMANTIC_PROOF"});
}
export function selectNarrativeVariants(report:InterpretedReport,blocks:ReportBlock[],generation:GenerationTrace):InterpretedReport {
  const audit=auditNarrative(report,blocks);check(audit.status==="PASS","S7_NARRATIVE_REJECTED");validateGeneration(generation);
  const variants=Object.fromEntries(blocks.map(b=>[b.blockId,b.variantId]));return freezeInterpretation(compose(report.basis,variants,generation));
}
export function recordNarrativeFallback(report:InterpretedReport,generation:GenerationTrace):InterpretedReport {validateInterpretedReport(report);check(generation.fallbackUsed&&generation.used==="DETERMINISTIC","S7_FALLBACK_REQUIRED");return freezeInterpretation(compose(report.basis,{},generation));}
export function buildInterpretedSections(report:InterpretedReport,{audience="full",voice="report"}:{audience?:"preview"|"full";voice?:"report"|"dialogue"}={}){
  validateInterpretedReport(report);check(["preview","full"].includes(audience)&&["report","dialogue"].includes(voice),"S7_VIEW_OPTIONS");
  return freezeInterpretation({schemaVersion:"saju-interpreted-report-sections-v1",profile:report.profile,contextId:report.contextId,audience,voice,eligibility:report.eligibility,opening:report.opening,sections:report.sections.filter(s=>audience==="full"||s.chapter===1||s.chapter===2).map(s=>({...s,blocks:s.blocks.map(b=>{const domain=report.interpretationClaims.find(c=>c.claimId===b.blockId)?.domain??null;return {...b,domain,heading:domain?DOMAIN_NAME[domain]:null,speaker:voice==="dialogue"?"REPORT_GUIDE":null};})}))});
}
export function renderInterpretedReport(report:InterpretedReport,{audience="full",voice="report",detail=false}:{audience?:"preview"|"full";voice?:"report"|"dialogue";detail?:boolean}={}):string {
  const view=buildInterpretedSections(report,{audience,voice}),base=report.basis.baseReport,input=base.inputContext;
  const lines=[...view.opening.map(b=>b.text),"","나의 사주 해석 리포트 — 전통적 관점 시제품",`확인할 입력: ${input.gregorianDate??input.date??"날짜 확인 필요"} ${input.time??"시각 미상"}`];
  if(input.calendar==="KOREAN_LUNAR")lines.push("음력 입력을 기존 정책으로 환산한 명식입니다. 원입력과 변환 근거는 상세 영역에 남겼습니다.");
  if(input.originalClockStatus==="AMBIGUOUS_TIME")lines.push("기록 분은 두 번 존재하는 시각입니다. 선택한 오프셋 조건과 원래의 시간 대응을 보존했습니다.");
  if(input.recordedCivilMinute&&input.standardReferenceMinute&&input.recordedCivilMinute!==input.standardReferenceMinute)lines.push(`기록 민간시 ${input.recordedCivilMinute} → 선택 표준 참조 ${input.standardReferenceMinute}`);
  for(const s of view.sections){lines.push("",`${s.chapter}. ${s.title}`);for(const b of s.blocks){if(b.heading)lines.push("["+b.heading+"]");lines.push((voice==="dialogue"?"안내자: ":"")+b.text);}if(!s.blocks.length)lines.push("현재 입력에서는 이 장의 개인별 해석을 생성하지 않았습니다.");}
  lines.push("","이 해석은 선택한 전통적 상징을 자기 이해의 질문으로 읽는 관점입니다. 실제 성격·직업 적성·재산·사건을 판정하지 않으며, 전체 강약·격국 성패·최종 용신과 관계의 실제 효력도 확정하지 않았습니다.","시제품의 제한 제공이며 유료 판매 준비를 승인한 결과가 아닙니다.");
  if(detail)lines.push("","상세 근거 — 계산·정책·claim·검수",JSON.stringify(report,null,2));return lines.join("\n")+"\n";
}

/** Rehydrate the stored base using its original projection, never an invented receipt. */
export function rebuildInterpretationBasis(projection:ReportProjection,existingSupport:Record<string,ExistingSupport[]>={}):InterpretationBasis {validateReportProjection(projection);return {projection,baseReport:buildConsumerReport(projection,{profileId:"SAJU-CONSUMER-EVIDENCE-REPORT-V01"}),existingSupport};}
