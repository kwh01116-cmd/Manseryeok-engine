import { HEAVENLY_STEMS, STEM_NATURE, type HeavenlyStem, type FiveElement, type YinYang } from "../domain/stems.js";
import { EARTHLY_BRANCHES, BRANCH_NATURE, type EarthlyBranch } from "../domain/branches.js";
import { fiveElementRelation, tenGod, type ElementRelation, type TenGod } from "../domain/tenGods.js";
import { HIDDEN_STEM_POLICY_V1, type HiddenStemPosition } from "../domain/hiddenStems.js";
import { BRANCH_RELATIONS_POLICY_V1 } from "../domain/branchRelations.js";
import { TRIAD_MEMBERSHIP_POLICY_V1 } from "../domain/triadMemberships.js";
import { TWELVE_GROWTH_POLICY_V1 } from "../domain/twelveGrowthStages.js";
import { MONTH_BOUNDARY_JIE } from "../calendar/monthPillar.js";
import { isGregorianMinute } from "../calendar/solarTermTimeline.js";
import { SOLAR_TERM_DEFINITIONS, type SolarTermCode } from "../calendar/solarTerms.js";
import type { M2CandidateFactsV3 } from "../chartFacts/chartFactsV3.js";
import type { M2PillarFact, ChartPillarRole } from "../chartFacts/chartFactsV1.js";

export const M3_EVIDENCE_PROFILE_ID="m3-structural-evidence-local-v1" as const;
export const M3_EVIDENCE_VERSION="0.1.0" as const;
export const M3_EVIDENCE_SCHEMA="m3-structural-evidence-v1" as const;
const ASSEMBLY_RULE="M3-EVIDENCE-STRUCTURAL-ASSEMBLY-001",IMPLEMENTATION_SOURCE="IMPL-M3-STRUCTURAL-EVIDENCE-V1";
const ROLES=["year","month","day","hour"] as const;
const RELATIONS=["SAME","TARGET_GENERATES_DAY_MASTER","DAY_MASTER_GENERATES","DAY_MASTER_CONTROLS","TARGET_CONTROLS_DAY_MASTER"] as const;
const knownKinds=new Set(["SUMMARY","DAY_MASTER","PILLAR_NATURE","VISIBLE_TEN_GOD","HIDDEN_STEMS","TWELVE_GROWTH","BRANCH_RELATION","TRIAD_MEMBERSHIP"]);
function fail(code:string):never {throw new RangeError(code);}
function requireValue(ok:unknown,code:string):asserts ok {if(!ok)fail(code);}
function record(value:unknown):Record<string,unknown>{requireValue(value!==null&&typeof value==="object"&&!Array.isArray(value),"M3_PLAIN_RECORD_REQUIRED");return value as Record<string,unknown>;}
function strings(value:unknown,nonempty=false):readonly string[]{requireValue(Array.isArray(value)&&(!nonempty||value.length>0)&&value.every(item=>typeof item==="string"&&item.trim().length>0),"M3_REFERENCE_ARRAY_REQUIRED");return value;}
function stem(value:unknown):HeavenlyStem {requireValue(HEAVENLY_STEMS.some(item=>item===value),"M3_KNOWN_STEM_REQUIRED");return value as HeavenlyStem;}
function branch(value:unknown):EarthlyBranch {requireValue(EARTHLY_BRANCHES.some(item=>item===value),"M3_KNOWN_BRANCH_REQUIRED");return value as EarthlyBranch;}
const unique=(values:readonly string[])=>[...new Set(values)];
const frozenTrees=new WeakSet<object>();
function deepFrozen(value:unknown):boolean {if(value===null||typeof value!=="object")return typeof value!=="function";if(frozenTrees.has(value))return true;if(!Object.isFrozen(value)||!Object.values(value).every(deepFrozen))return false;frozenTrees.add(value);return true;}
function snapshot<T>(value:T):T {
  if(value===null||typeof value!=="object"){requireValue(typeof value!=="function","M3_DATA_ONLY_REQUIRED");return value;}
  const prototype=Object.getPrototypeOf(value);requireValue(Array.isArray(value)||prototype===Object.prototype||prototype===null,"M3_JSON_RECORD_REQUIRED");
  if(deepFrozen(value))return value;
  const copy=Array.isArray(value)?value.map(item=>snapshot(item)):Object.fromEntries(Object.entries(value).map(([key,item])=>[key,snapshot(item)]));
  Object.freeze(copy);frozenTrees.add(copy);return copy as T;
}
function equal(left:unknown,right:unknown):boolean {
  if(left===right)return true;if(left===null||right===null||typeof left!=="object"||typeof right!=="object")return false;
  if(Array.isArray(left)!==Array.isArray(right))return false;
  const a=Object.keys(left).sort(),b=Object.keys(right).sort();return a.length===b.length&&a.every((key,index)=>key===b[index]&&equal((left as Record<string,unknown>)[key],(right as Record<string,unknown>)[key]));
}
export const M3_EVIDENCE_POLICY_METADATA=snapshot({id:M3_EVIDENCE_PROFILE_ID,version:M3_EVIDENCE_VERSION,status:"EVIDENCE_ONLY",
  meaning:"STRUCTURAL_M2_EVIDENCE_ASSEMBLY_NOT_FINAL_STRENGTH",finalStrength:{status:"NOT_IMPLEMENTED",releaseGate:"M3_FINAL_BLOCKED_UNCHANGED"},
  definitions:{month:"ACTUAL_MONTH_BRANCH_AND_APPLIED_JIE_CONTEXT_ONLY",season:"UNRESOLVED_NO_ADOPTED_COMMANDING_QI_RULE",rootCandidates:"EXACT_DAY_STEM_AND_SAME_ELEMENT_DIFFERENT_STEM_OCCURRENCES_NOT_EFFECTIVE_ROOT",directionalRelations:"EXISTING_FIVE_ELEMENT_RELATION_HELPER_VISIBLE_DAY_MASTER_EXCLUDED",hiddenVisibleLinks:"EXACT_STEM_CHARACTER_MATCH_ALL_VISIBLE_POSITIONS_NOT_TRADITIONAL_ACTIVATION",positions:"MAIN_QI_AND_OTHER_ARE_EXISTING_DISPLAY_MEMBERSHIP_NOT_WEIGHTS",relations:"ALL_EXISTING_PAIRS_TRIADS_OVERLAPS_AND_PARTIAL_MEMBERS_RETAINED_WITH_EFFECT_UNRESOLVED"},
  rules:[{id:ASSEMBLY_RULE,runtimeVersion:M3_EVIDENCE_VERSION,kind:"PROJECT_STRUCTURAL_EVIDENCE_DEFINITION",policyIds:[M3_EVIDENCE_PROFILE_ID],sourceIds:[IMPLEMENTATION_SOURCE],meaning:"NO_NEW_TRADITIONAL_STRENGTH_OR_EFFECT_RULE"}],
  sources:[{id:IMPLEMENTATION_SOURCE,kind:"M3_EVIDENCE_ASSEMBLY_SOURCE",implementationRef:"src/m3/structuralEvidenceV1.ts",evidenceLayer:"PROJECT_STRUCTURAL_DEFINITION",meaning:"CONNECT_EXISTING_M2_POSITIONS_AND_RELATIONS_ONLY",editionVerification:"NOT_AN_EDITION_AUTHENTICATION",rightsReview:"NOT_AN_UPSTREAM_RIGHTS_APPROVAL"}],
  excluded:["FINAL_STRENGTH","STRENGTH_SCORE","WEIGHTS","PERCENTAGES","SEASON_COMMANDING_QI","EFFECTIVE_ROOT","RELATION_EFFECT","TRANSFORMATION","GEJU","YONGSHEN","FORTUNE","PREDICTION"],
  unchangedGate:"docs/research/M3_STRENGTH_GO_NOGO_DECISION_SPEC_20261018.md"});

export interface M3InputFact {readonly id:string;readonly candidateRef:string;readonly kind:string;readonly value:unknown;readonly pillarRefs:readonly string[];readonly ruleRefs:readonly string[];readonly policyRefs:readonly string[];readonly sourceRefs:readonly string[];readonly calculationSourceRefs:readonly string[];}
export interface M3InputRule {readonly id:string;readonly runtimeVersion:string|null;readonly sourceIds:readonly string[];readonly policyIds:readonly string[];readonly [key:string]:unknown;}
export interface M3InputSource {readonly id:string;readonly kind:string;readonly [key:string]:unknown;}
export interface M3InputCandidate extends Omit<M2CandidateFactsV3,"pillars"> {readonly id:string;readonly pillars:readonly M2PillarFact[];readonly facts:readonly M3InputFact[];}
export interface M3InputEnvelope {readonly schemaVersion:"kasi-local-chart-facts-v1";readonly status:"READY";readonly policyBundle:{readonly id:string;readonly policies:Readonly<Record<string,{readonly id:string;readonly [key:string]:unknown}>>;readonly [key:string]:unknown;};readonly rules:readonly M3InputRule[];readonly sources:readonly M3InputSource[];readonly candidates:readonly M3InputCandidate[];}
export interface M3StemLocation {readonly locationId:string;readonly candidateRef:string;readonly locationKind:"VISIBLE_STEM"|"HIDDEN_STEM";readonly pillarRole:ChartPillarRole;readonly pillarRef:string;readonly stem:HeavenlyStem;readonly element:FiveElement;readonly polarity:YinYang;readonly position:"VISIBLE"|HiddenStemPosition;readonly index:number|null;readonly inputFactRef:string;readonly inputFactRefs:readonly string[];readonly inputMemberRef:string|null;readonly memberRef:string|null;readonly m2FactRef:string|null;readonly tenGod:TenGod|null;readonly relation:ElementRelation;readonly ruleRefs:readonly string[];readonly policyRefs:readonly string[];readonly sourceRefs:readonly string[];readonly calculationSourceRefs:readonly string[];}
export interface M3EvidenceRecord {readonly id:string;readonly candidateRef:string;readonly kind:string;readonly value:unknown;readonly inputFactRefs:readonly string[];readonly inputMemberRefs:readonly string[];readonly pillarRefs:readonly string[];readonly ruleRefs:readonly string[];readonly policyRefs:readonly string[];readonly sourceRefs:readonly string[];readonly calculationSourceRefs:readonly string[];}
const issued=new WeakSet<object>();
const originalInputs=new WeakMap<object,{readonly input:M3InputEnvelope;readonly snapshot:string|null}>();
function policy(id:unknown):void {requireValue(id===M3_EVIDENCE_PROFILE_ID,"EXPLICIT_SUPPORTED_M3_EVIDENCE_PROFILE_REQUIRED");}

/** Structural M2 consistency only. The adapter must separately verify the live M1/M2 execution/source receipt. */
export function deriveM3Evidence(input:M3InputEnvelope,{policyId}:{policyId:string}){
  policy(policyId);requireValue(input?.schemaVersion==="kasi-local-chart-facts-v1"&&input.status==="READY","M3_EXISTING_M2_ENVELOPE_REQUIRED");
  const bundle=input.policyBundle;requireValue(bundle&&typeof bundle.id==="string"&&bundle.id.trim(),"M3_EXPLICIT_M2_POLICIES_REQUIRED");
  const expectedPolicies={hiddenStems:HIDDEN_STEM_POLICY_V1,branchRelations:BRANCH_RELATIONS_POLICY_V1,triadMembership:TRIAD_MEMBERSHIP_POLICY_V1,twelveGrowth:TWELVE_GROWTH_POLICY_V1};
  for(const [kind,id]of Object.entries(expectedPolicies))requireValue(bundle.policies?.[kind]?.id===id,"M3_SUPPORTED_M2_POLICIES_REQUIRED");
  const policies=new Set([bundle.id,...Object.values(bundle.policies).map(item=>item.id)]),rules=new Map<string,M3InputRule>(),sources=new Map<string,M3InputSource>();
  requireValue(Array.isArray(input.rules)&&Array.isArray(input.sources),"M3_RULE_SOURCE_REGISTRY_REQUIRED");
  for(const source of input.sources){requireValue(source&&typeof source.id==="string"&&source.id.trim()&&typeof source.kind==="string"&&source.kind.trim()&&!sources.has(source.id),"M3_DUPLICATE_OR_INVALID_SOURCE");sources.set(source.id,source);}
  for(const rule of input.rules){requireValue(rule&&typeof rule.id==="string"&&rule.id.trim()&&!rules.has(rule.id)&&(rule.runtimeVersion===null||typeof rule.runtimeVersion==="string"),"M3_DUPLICATE_OR_INVALID_RULE");strings(rule.sourceIds).forEach(ref=>requireValue(sources.has(ref),"M3_MISSING_RULE_SOURCE"));strings(rule.policyIds).forEach(ref=>requireValue(policies.has(ref),"M3_MISSING_RULE_POLICY"));rules.set(rule.id,rule);}
  requireValue(!rules.has(ASSEMBLY_RULE)&&!sources.has(IMPLEMENTATION_SOURCE),"M3_UPSTREAM_REGISTRY_COLLISION");
  requireValue(Array.isArray(input.candidates)&&input.candidates.length>0&&input.candidates.length<=2,"M3_EXPLICIT_CANDIDATES_REQUIRED");
  const allInputIds=new Set<string>(),allEvidenceIds=new Set<string>();
  const candidates=input.candidates.map((candidate:M3InputCandidate,candidateIndex:number)=>{
    const candidateRef=`chart.candidates[${candidateIndex}]`;requireValue(candidate.id===candidateRef&&candidate.candidateIndex===candidateIndex,"M3_CANDIDATE_REFERENCE");
    const master=stem(candidate.dayMaster),masterNature=STEM_NATURE[master];requireValue(Array.isArray(candidate.pillars)&&candidate.pillars.length===4&&Array.isArray(candidate.facts),"M3_FOUR_M2_PILLARS_REQUIRED");
    const facts=new Map<string,M3InputFact>(),members=new Map<string,Record<string,unknown>>();
    for(const fact of candidate.facts){
      requireValue(fact&&fact.candidateRef===candidateRef&&typeof fact.id==="string"&&fact.id.startsWith(candidateRef+"#")&&!allInputIds.has(fact.id)&&knownKinds.has(fact.kind),"M3_DUPLICATE_OR_CROSS_CANDIDATE_FACT");allInputIds.add(fact.id);facts.set(fact.id,fact);record(fact.value);
      strings(fact.pillarRefs,true).forEach(ref=>requireValue(ROLES.some(role=>ref===candidateRef+"."+role),"M3_CROSS_CANDIDATE_PILLAR_REFERENCE"));
      strings(fact.ruleRefs,true).forEach(ref=>requireValue(rules.has(ref),"M3_MISSING_FACT_RULE"));strings(fact.policyRefs).forEach(ref=>requireValue(policies.has(ref),"M3_MISSING_FACT_POLICY"));
      strings(fact.sourceRefs).forEach(ref=>requireValue(sources.has(ref),"M3_MISSING_FACT_SOURCE"));strings(fact.calculationSourceRefs,true).forEach(ref=>requireValue(sources.has(ref),"M3_MISSING_CALCULATION_SOURCE"));
    }
    const get=(suffix:string,kind:string)=>{const fact=facts.get(candidateRef+"#"+suffix);requireValue(fact?.kind===kind,"M3_REQUIRED_M2_FACT_MISSING");return fact;};
    const summary=get("summary","SUMMARY"),dayFact=get("day-master","DAY_MASTER"),dayValue=record(dayFact.value);
    requireValue(dayValue.stem===master&&dayValue.element===masterNature.element&&dayValue.polarity===masterNature.polarity,"M3_DAY_MASTER_FACT_MISMATCH");
    const summaryValue=record(summary.value),active=record(summaryValue.activeSince),term=active.term;
    requireValue(typeof term==="string"&&(MONTH_BOUNDARY_JIE as readonly string[]).includes(term)&&typeof active.displayedDateTime==="string"&&isGregorianMinute(active.displayedDateTime)&&active.timeBasis==="KST"&&active.sourcePrecision==="MINUTE","M3_APPLIED_JIE_CONTEXT_REQUIRED");
    strings(active.sourceIds,true).forEach(ref=>requireValue(sources.has(ref)&&summary.calculationSourceRefs.includes(ref),"M3_MONTH_JIE_SOURCE_REFERENCE"));
    requireValue(["DEFINITE","BEFORE_PUBLISHED_MINUTE","AFTER_PUBLISHED_MINUTE"].includes(String(summaryValue.boundarySide)),"M3_EXPLICIT_MONTH_BOUNDARY_SIDE_REQUIRED");
    const visible:M3StemLocation[]=[],hidden:M3StemLocation[]=[],natureFacts:M3InputFact[]=[],hiddenFacts:M3InputFact[]=[];
    const atomRefs=(used:readonly M3InputFact[])=>({ruleRefs:unique(used.flatMap(f=>f.ruleRefs)),policyRefs:unique(used.flatMap(f=>f.policyRefs)),sourceRefs:unique(used.flatMap(f=>f.sourceRefs)),calculationSourceRefs:unique(used.flatMap(f=>f.calculationSourceRefs))});
    for(let pillarIndex=0;pillarIndex<ROLES.length;pillarIndex++){
      const role=ROLES[pillarIndex]!,pillar:M2PillarFact=candidate.pillars[pillarIndex]!,pillarRef=candidateRef+"."+role;
      requireValue(pillar.role===role&&pillar.factRef===`preview.candidates[${candidateIndex}].${role}`,"M3_PILLAR_POSITION_MISMATCH");const visibleStem=stem(pillar.stem),b=branch(pillar.branch),nature=STEM_NATURE[visibleStem];
      if(role==="day")requireValue(visibleStem===master&&pillar.visibleTenGod===null,"M3_DAY_VISIBLE_SELF_CONTRACT");
      const nf=get(role+"-nature","PILLAR_NATURE"),nv=record(nf.value);natureFacts.push(nf);
      requireValue(nv.role===role&&nv.stem===visibleStem&&nv.branch===b&&equal(nv.stemNature,nature)&&equal(nv.branchNature,BRANCH_NATURE[b]),"M3_PILLAR_NATURE_MISMATCH");
      let god:TenGod|null=null;const visibleInputs=[nf];
      if(role!=="day"){const tf=get(role+"-visible-ten-god","VISIBLE_TEN_GOD"),tv=record(tf.value);god=tenGod(master,visibleStem);requireValue(tv.role===role&&tv.stem===visibleStem&&tv.dayMaster===master&&tv.tenGod===god&&pillar.visibleTenGod===god,"M3_VISIBLE_TEN_GOD_MISMATCH");visibleInputs.push(tf);}
      visible.push({locationId:pillarRef+".stem",candidateRef,locationKind:"VISIBLE_STEM",pillarRole:role,pillarRef,stem:visibleStem,...nature,position:"VISIBLE",index:null,inputFactRef:nf.id,inputFactRefs:visibleInputs.map(f=>f.id),inputMemberRef:null,memberRef:null,m2FactRef:null,tenGod:god,relation:fiveElementRelation(masterNature.element,nature.element),...atomRefs(visibleInputs)});
      const hf=get(role+"-hidden-stems","HIDDEN_STEMS"),hv=record(hf.value);hiddenFacts.push(hf);
      requireValue(hv.role===role&&hv.branch===b&&hv.dayMaster===master&&Array.isArray(hv.members)&&hv.members.length>0&&hv.members.length<=3&&pillar.branchTenGods.dayMaster===master&&pillar.branchTenGods.branch===b&&pillar.branchTenGods.policyId===HIDDEN_STEM_POLICY_V1&&pillar.branchTenGods.members.length===hv.members.length,"M3_HIDDEN_MEMBER_CONTRACT");
      const seenStems=new Set<string>();
      for(let index=0;index<hv.members.length;index++){
        const member=record(hv.members[index]),s=stem(member.stem),memberId=hf.id+`#member[${index}]`,position=index===0?"MAIN_QI":"OTHER",native=pillar.branchTenGods.members[index]!;
        requireValue(!seenStems.has(s)&&member.id===memberId&&!allInputIds.has(memberId)&&member.candidateRef===candidateRef&&member.pillarRef===pillarRef&&member.index===index&&member.position===position,"M3_DUPLICATE_OR_CROSS_MEMBER_LOCATION");seenStems.add(s);allInputIds.add(memberId);members.set(memberId,member);
        const memberRef=`facts.candidates[${candidateIndex}].pillars[${pillarIndex}].branchTenGods.members[${index}]`,m2FactRef=`genericM2.candidates[${candidateIndex}].pillars[${pillarIndex}].branchTenGods.members[${index}]`,memberGod=tenGod(master,s);
        requireValue(member.memberRef===memberRef&&member.m2FactRef===m2FactRef&&member.tenGod===memberGod&&native.stem===s&&native.index===index&&native.position===position&&native.tenGod===memberGod,"M3_HIDDEN_MEMBER_VALUE_MISMATCH");
        for(const [key,known]of [["ruleRefs",hf.ruleRefs],["policyRefs",hf.policyRefs],["sourceRefs",hf.sourceRefs]] as const)strings(member[key]).forEach(ref=>requireValue(known.includes(ref),"M3_MEMBER_REFERENCE_MISMATCH"));
        hidden.push({locationId:memberId,candidateRef,locationKind:"HIDDEN_STEM",pillarRole:role,pillarRef,stem:s,...STEM_NATURE[s],position,index,inputFactRef:hf.id,inputFactRefs:[hf.id],inputMemberRef:memberId,memberRef,m2FactRef,tenGod:memberGod,relation:fiveElementRelation(masterNature.element,STEM_NATURE[s].element),...atomRefs([hf])});
      }
      requireValue(hv.principalTenGod===pillar.branchTenGods.members[0]!.tenGod,"M3_MAIN_QI_LABEL_MISMATCH");
    }
    const pairFacts: M3InputFact[]=candidate.facts.filter((f:M3InputFact)=>f.kind==="BRANCH_RELATION"),triadFacts:M3InputFact[]=candidate.facts.filter((f:M3InputFact)=>f.kind==="TRIAD_MEMBERSHIP");
    requireValue(Array.isArray(candidate.branchRelations)&&Array.isArray(candidate.triadMemberships)&&pairFacts.length===candidate.branchRelations.length&&triadFacts.length===candidate.triadMemberships.length,"M3_RELATION_CONTEXT_OMITTED");
    candidate.branchRelations.forEach((pair:M3InputCandidate["branchRelations"][number],index:number)=>{requireValue(equal(pairFacts[index]!.value,pair)&&pair.leftPillarIndex<pair.rightPillarIndex&&pair.leftPillarRole===ROLES[pair.leftPillarIndex]&&pair.rightPillarRole===ROLES[pair.rightPillarIndex]&&pair.leftFactRef===`preview.candidates[${candidateIndex}].${pair.leftPillarRole}`&&pair.rightFactRef===`preview.candidates[${candidateIndex}].${pair.rightPillarRole}`&&candidate.pillars[pair.leftPillarIndex]?.branch===pair.leftBranch&&candidate.pillars[pair.rightPillarIndex]?.branch===pair.rightBranch,"M3_PAIR_CONTEXT_MISMATCH");});
    candidate.triadMemberships.forEach((triad:M3InputCandidate["triadMemberships"][number],index:number)=>{requireValue(equal(triadFacts[index]!.value,triad),"M3_TRIAD_CONTEXT_MISMATCH");for(const member of triad.members){requireValue(member.pillarIndices.length===member.pillarRoles.length&&member.pillarIndices.length===member.pillarFactRefs.length&&new Set(member.pillarIndices).size===member.pillarIndices.length,"M3_TRIAD_POSITION_MISMATCH");member.pillarIndices.forEach((p:number,i:number)=>requireValue(candidate.pillars[p]?.branch===member.branch&&member.pillarRoles[i]===ROLES[p]&&member.pillarFactRefs[i]===`preview.candidates[${candidateIndex}].${ROLES[p]}`,"M3_TRIAD_CROSS_CANDIDATE_REFERENCE"));}});
    const evidence:M3EvidenceRecord[]=[];
    const add=(kind:string,value:unknown,used:readonly M3InputFact[],inputMemberRefs:readonly string[]=[])=>{
      const id=candidateRef+"#m3-evidence["+evidence.length+"]";requireValue(!allEvidenceIds.has(id)&&used.length>0,"M3_EVIDENCE_REFERENCE");allEvidenceIds.add(id);
      for(const ref of inputMemberRefs)requireValue(members.has(ref),"M3_EVIDENCE_FOREIGN_MEMBER");
      const upstream=atomRefs(used);evidence.push({id,candidateRef,kind,value,inputFactRefs:unique(used.map(f=>f.id)),inputMemberRefs:unique(inputMemberRefs),pillarRefs:unique(used.flatMap(f=>f.pillarRefs)),ruleRefs:[ASSEMBLY_RULE,...upstream.ruleRefs],policyRefs:[M3_EVIDENCE_PROFILE_ID,...upstream.policyRefs],sourceRefs:[IMPLEMENTATION_SOURCE,...upstream.sourceRefs],calculationSourceRefs:upstream.calculationSourceRefs});
    };
    const monthMembers=hidden.filter(item=>item.pillarRole==="month"),month:M2PillarFact=candidate.pillars[1]!;
    const monthContext={dayMaster:master,monthPillar:{stem:month.stem,branch:month.branch,pillarRef:candidateRef+".month"},representativeBranchNature:BRANCH_NATURE[month.branch],principalHiddenMember:monthMembers.find(item=>item.position==="MAIN_QI")!,hiddenMembers:monthMembers,
      activeSince:{term,displayedDateTime:active.displayedDateTime,timeBasis:"KST",sourcePrecision:"MINUTE",sourceIds:[...strings(active.sourceIds)],koreanName:typeof active.koreanName==="string"?active.koreanName:SOLAR_TERM_DEFINITIONS[term as SolarTermCode].koreanName},boundarySide:summaryValue.boundarySide,
      season:{status:"UNRESOLVED",reason:"NO_ADOPTED_SEASON_STRENGTH_OR_COMMANDING_QI_AUTHORITY"}};
    add("MONTH_CONTEXT",monthContext,[summary,dayFact,natureFacts[1]!,hiddenFacts[1]!],monthMembers.map(item=>item.inputMemberRef!));
    const rootCandidates={exactStem:hidden.filter(item=>item.stem===master),sameElementDifferentStem:hidden.filter(item=>item.element===masterNature.element&&item.stem!==master)};
    add("EXACT_STEM_ROOT_CANDIDATES",{matches:rootCandidates.exactStem,criterion:"EXACT_DAY_STEM_CHARACTER",assessment:"UNRESOLVED"},[dayFact,...hiddenFacts],rootCandidates.exactStem.map(item=>item.inputMemberRef!));
    add("SAME_ELEMENT_OTHER_STEM_CANDIDATES",{matches:rootCandidates.sameElementDifferentStem,criterion:"SAME_ELEMENT_DIFFERENT_STEM",assessment:"UNRESOLVED"},[dayFact,...hiddenFacts],rootCandidates.sameElementDifferentStem.map(item=>item.inputMemberRef!));
    const directionalGroups=Object.fromEntries(RELATIONS.map(relation=>[relation,[...visible.filter(item=>item.pillarRole!=="day"),...hidden].filter(item=>item.relation===relation)])) as Record<ElementRelation,M3StemLocation[]>;
    for(const relation of RELATIONS){const locations=directionalGroups[relation],used=unique(locations.flatMap(item=>item.inputFactRefs)).map(id=>facts.get(id)!);add("DIRECTIONAL_GROUP",{relation,locations,visibleDayMasterExcluded:true,meaning:"DIRECTIONAL_MEMBERSHIP_NOT_STRENGTH_OR_WEIGHT"},[dayFact,...(used.length?used:[...natureFacts,...hiddenFacts])],locations.flatMap(item=>item.inputMemberRef?[item.inputMemberRef]:[]));}
    const hiddenVisibleLinks=hidden.flatMap(h=>visible.filter(v=>v.stem===h.stem).map(v=>({id:candidateRef+"#hidden-visible["+h.pillarRole+":"+h.index+":"+v.pillarRole+"]",candidateRef,stem:h.stem,hidden:h,visible:v,match:"EXACT_STEM_CHARACTER_ONLY",assessment:"UNRESOLVED",inputFactRefs:unique([...h.inputFactRefs,...v.inputFactRefs]),inputMemberRefs:[h.inputMemberRef!]})));
    add("HIDDEN_VISIBLE_LINKS",{links:hiddenVisibleLinks,assessment:"UNRESOLVED",includesDayVisible:true},[...natureFacts,...hiddenFacts,...candidate.facts.filter((f:M3InputFact)=>f.kind==="VISIBLE_TEN_GOD")],hiddenVisibleLinks.map(link=>link.hidden.inputMemberRef!));
    const relationContext={pairs:snapshot(candidate.branchRelations),triads:snapshot(candidate.triadMemberships),effectStatus:"UNRESOLVED"};
    add("RELATION_SCOPE",{pairCount:pairFacts.length,triadCount:triadFacts.length,effectStatus:"UNRESOLVED"},[summary,...pairFacts,...triadFacts]);
    pairFacts.forEach(fact=>add("BRANCH_RELATION_CONTEXT",{relation:snapshot(fact.value),effectStatus:"UNRESOLVED"},[fact]));
    triadFacts.forEach(fact=>add("TRIAD_MEMBERSHIP_CONTEXT",{membership:snapshot(fact.value),effectStatus:"UNRESOLVED"},[fact]));
    return {candidateRef,candidateIndex,dayMaster:master,monthContext,rootCandidates,directionalGroups,hiddenVisibleLinks,relationContext,
      visibleDayMaster:{...visible[2]!,excludedFromDirectionalGroups:true},preservedUninterpretedM2FactRefs:candidate.facts.filter((f:M3InputFact)=>f.kind==="TWELVE_GROWTH").map((f:M3InputFact)=>f.id),evidence};
  });
  const result=snapshot({schemaVersion:M3_EVIDENCE_SCHEMA,status:"EVIDENCE_ONLY" as const,policy:M3_EVIDENCE_POLICY_METADATA,finalStrength:M3_EVIDENCE_POLICY_METADATA.finalStrength,
    upstreamPolicyBundle:snapshot(bundle),candidates,rules:[...input.rules.map(snapshot),...M3_EVIDENCE_POLICY_METADATA.rules],sources:[...input.sources.map(snapshot),...M3_EVIDENCE_POLICY_METADATA.sources],
    validation:{level:"STRUCTURAL_M2_REFERENCE_AND_VALUE_CONSISTENCY_ONLY",inputAuthentication:"NOT_PERFORMED_BY_PURE_MODULE",upstreamRuleVersions:"PRESERVED_INCLUDING_NULL",editionVerification:"UNVERIFIED",rightsReview:"UNVERIFIED",predictiveValidity:"NOT_CLAIMED",g0Receipt:null,g1P2Promotion:false}});
  issued.add(result);originalInputs.set(result,{input,snapshot:deepFrozen(input)?null:JSON.stringify(input)});return result;
}
export type M3EvidenceResult=ReturnType<typeof deriveM3Evidence>;
export function validateM3Evidence(value:M3EvidenceResult):true {requireValue(issued.has(value)&&Object.isFrozen(value),"ISSUED_IMMUTABLE_M3_EVIDENCE_REQUIRED");return true;}

/** Optional same-execution connection check; does not change structural facts or authenticate external JSON. */
export function validateM3EvidenceInputContext(value:M3EvidenceResult,input:M3InputEnvelope):true {
  validateM3Evidence(value);const original=originalInputs.get(value);
  requireValue(original&&original.input===input,"M3_ORIGINAL_INPUT_CONTEXT_REQUIRED");
  if(original.snapshot!==null)requireValue(JSON.stringify(input)===original.snapshot,"M3_ORIGINAL_INPUT_CHANGED_AFTER_ISSUANCE");
  return true;
}

const roleNames={year:"연주",month:"월주",day:"일주",hour:"시주"};
const elementNames={WOOD:"목",FIRE:"화",EARTH:"토",METAL:"금",WATER:"수"};
const relationNames:Record<ElementRelation,string>={SAME:"일간과 같은 오행",TARGET_GENERATES_DAY_MASTER:"일간을 생하는 방향",DAY_MASTER_GENERATES:"일간이 생하는 방향",DAY_MASTER_CONTROLS:"일간이 극하는 방향",TARGET_CONTROLS_DAY_MASTER:"일간을 극하는 방향"};
const partialNames:Record<string,string>={BIRTH_AND_CENTER:"생지·왕지 구성원",CENTER_AND_TOMB:"왕지·묘지 구성원",BIRTH_AND_TOMB_NOT_HALF_TRINE:"생지·묘지 구성원(반합 분류에서 제외)",SANHUI_PARTIAL_MEMBERS:"삼회 부분 구성원"};
function elementText(value:unknown):string {requireValue(typeof value==="string"&&Object.hasOwn(elementNames,value),"M3_UNKNOWN_ELEMENT_PRESENTATION");return elementNames[value as FiveElement];}
function roleText(value:unknown):string {requireValue(typeof value==="string"&&Object.hasOwn(roleNames,value),"M3_UNKNOWN_ROLE_PRESENTATION");return roleNames[value as ChartPillarRole];}
function locationText(item:M3StemLocation):string {return roleNames[item.pillarRole]+(item.locationKind==="VISIBLE_STEM"?" 천간":" 장간["+item.index+", "+(item.position==="MAIN_QI"?"본기":"기타 장간")+"]")+" "+item.stem;}
function listLocations(value:unknown):string {requireValue(Array.isArray(value),"M3_TEMPLATE_LOCATIONS_REQUIRED");return value.length?value.map(item=>locationText(item)).join(" · "):"없음";}
function textFor(evidence:M3EvidenceRecord):string {
  const value=record(evidence.value);
  switch(evidence.kind){
    case "MONTH_CONTEXT":{const month=record(value.monthPillar),active=record(value.activeSince),nature=record(value.representativeBranchNature);const condition=value.boundarySide==="BEFORE_PUBLISHED_MINUTE"?"출생 입력과 같은 표시 분에 놓인 절입의 전 조건에 해당하는 후보입니다.":value.boundarySide==="AFTER_PUBLISHED_MINUTE"?"출생 입력과 같은 표시 분에 놓인 절입의 후 조건에 해당하는 후보입니다.":value.boundarySide==="DEFINITE"?"현재 입력은 절입 표시 분의 전후 분기 밖에 있습니다.":fail("M3_UNKNOWN_MONTH_BOUNDARY_PRESENTATION");return `이 후보의 일간은 ${value.dayMaster}, 월주는 ${month.stem}${month.branch}입니다. 월지 ${month.branch}의 기존 표상 대표 오행은 ${elementText(nature.principalElement)}이며 적용 절입은 ${active.koreanName} ${active.displayedDateTime}입니다. ${condition} 계절 세력과 사령은 미확정(UNRESOLVED)입니다.`;}
    case "EXACT_STEM_ROOT_CANDIDATES":return `일간과 천간 문자가 같은 장간 위치: ${listLocations(value.matches)}. 통근 검토를 위한 문자 일치 자료입니다.`;
    case "SAME_ELEMENT_OTHER_STEM_CANDIDATES":return `일간과 오행은 같지만 천간 문자가 다른 장간 위치: ${listLocations(value.matches)}. 정확한 천간 일치와 구분합니다.`;
    case "DIRECTIONAL_GROUP":{const relation=value.relation as ElementRelation;requireValue(Object.hasOwn(relationNames,relation),"M3_UNKNOWN_DIRECTIONAL_TEMPLATE");return `${relationNames[relation]}의 위치: ${listLocations(value.locations)}.`;}
    case "HIDDEN_VISIBLE_LINKS":{requireValue(Array.isArray(value.links),"M3_TEMPLATE_LINKS_REQUIRED");return `장간과 표면 천간의 정확한 문자 일치 연결: ${value.links.length?value.links.map(link=>{const item=record(link);return locationText(item.hidden as M3StemLocation)+" ↔ "+locationText(item.visible as M3StemLocation);}).join(" · "):"없음"}. 일주 표면 천간도 연결 대상이며 전통적 투간의 효력 판정은 하지 않습니다.`;}
    case "RELATION_SCOPE":return `기존 M2의 지지 쌍 분류 ${value.pairCount}개와 삼합·삼회 구성원 분류 ${value.triadCount}개를 모두 보존했습니다. 겹침·부분 구성원과 관계의 실제 효력은 구분합니다.`;
    case "BRANCH_RELATION_CONTEXT":{const pair=record(value.relation),kind=String(pair.kind),names:Record<string,string>={LIUHE:"육합",LIUCHONG:"충",LIUHAI:"해",LIUPO:"파",XING:"형"};requireValue(Object.hasOwn(names,kind),"M3_UNKNOWN_PAIR_TEMPLATE");
      const direction=pair.orientation==="SYMMETRIC"?"대칭쌍":pair.orientation==="BIDIRECTIONAL"?"양방향":pair.orientation==="SELF_BETWEEN_OCCURRENCES"?"서로 다른 기둥에 반복된 지지의 자형":pair.orientation==="LEFT_TO_RIGHT"?roleText(pair.leftPillarRole)+" → "+roleText(pair.rightPillarRole)+" 방향":pair.orientation==="RIGHT_TO_LEFT"?roleText(pair.rightPillarRole)+" → "+roleText(pair.leftPillarRole)+" 방향":fail("M3_UNKNOWN_PAIR_DIRECTION_PRESENTATION");
      return `${roleText(pair.leftPillarRole)} ${pair.leftBranch} · ${roleText(pair.rightPillarRole)} ${pair.rightBranch} 조합은 현재 정책의 ${names[kind]} 분류입니다(${direction}).`;}
    case "TRIAD_MEMBERSHIP_CONTEXT":{const group=record(value.membership);requireValue((group.family==="SANHE"||group.family==="SANHUI")&&Array.isArray(group.members)&&Array.isArray(group.missingBranches),"M3_UNKNOWN_TRIAD_TEMPLATE");
      const present=group.members.map(member=>record(member)).filter(member=>Array.isArray(member.pillarRoles)&&member.pillarRoles.length>0).map(member=>String(member.branch)+"("+(member.pillarRoles as unknown[]).map(roleText).join("·")+")").join(" · ");
      const state=group.status==="THREE_DISTINCT_MEMBERS"?"서로 다른 세 구성원이 모두 있습니다":group.status==="TWO_DISTINCT_MEMBERS"?"서로 다른 두 구성원이 있습니다":fail("M3_UNKNOWN_TRIAD_STATUS_PRESENTATION");
      let partial="";if(group.partialKind!==null){requireValue(typeof group.partialKind==="string"&&Object.hasOwn(partialNames,group.partialKind),"M3_UNKNOWN_TRIAD_PARTIAL_PRESENTATION");partial=". 부분 분류는 "+partialNames[group.partialKind]+"입니다";}
      return `기존 정책의 ${elementText(group.namedElement)} 명칭 ${group.family==="SANHE"?"삼합":"삼회"}에서 ${state}: ${present}${partial}. 빠진 구성원: ${group.missingBranches.length?group.missingBranches.join("·"):"없음"}.`;}
    default:return fail("M3_UNDEFINED_EVIDENCE_TEMPLATE");
  }
}
function buildExplanation(result:M3EvidenceResult){validateM3Evidence(result);return {schemaVersion:"ko-m3-evidence-templates-v1",templateVersion:M3_EVIDENCE_VERSION,status:"EVIDENCE_ONLY",title:"명식 구조 근거 정리",
  scopeNote:"기존 M2의 위치·문자·오행 방향·구성원을 정리한 검토 자료입니다. 방향 묶음에서 일간 자신인 일주 표면 천간은 제외하되 문자 일치 연결에서는 포함합니다. 본기·표시 순서를 가중치로 쓰지 않으며 계절 세력·유효한 통근·관계 효력·최종 신강약·점수·격국·용신·길흉을 판정하지 않습니다. 출처·권리·예측 효력의 인증도 아닙니다.",
  candidates:result.candidates.map(candidate=>({candidateRef:candidate.candidateRef,candidateIndex:candidate.candidateIndex,items:candidate.evidence.map((evidence,index)=>({id:candidate.candidateRef+"#m3-explanation["+index+"]",candidateRef:candidate.candidateRef,templateId:"KO_M3_"+evidence.kind,templateVersion:M3_EVIDENCE_VERSION,evidenceRefs:[evidence.id],inputFactRefs:[...evidence.inputFactRefs],ruleRefs:[...evidence.ruleRefs],policyRefs:[...evidence.policyRefs],sourceRefs:[...evidence.sourceRefs],calculationSourceRefs:[...evidence.calculationSourceRefs],text:textFor(evidence)}))}))};}
export function explainM3Evidence(result:M3EvidenceResult){return snapshot(buildExplanation(result));}
export function validateM3EvidenceExplanation(explanation:unknown,result:M3EvidenceResult):true {validateM3Evidence(result);requireValue(equal(explanation,buildExplanation(result)),"M3_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED");return true;}
