// Explicitly fictional structural units. These four-pillar combinations are not birth calculations.
import {deriveM2ChartFactsV3} from '../../dist/chartFacts/chartFactsV3.js';
import {labelKoreanGanZhi} from '../../dist/calendar/koreanBirthPreview.js';
import {SOLAR_TERM_DEFINITIONS} from '../../dist/calendar/solarTerms.js';
import {STEM_NATURE} from '../../dist/domain/stems.js';
import {BRANCH_NATURE} from '../../dist/domain/branches.js';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../../scripts/kasi/local-chart.mjs';
import {deriveLocalChartFacts,getM2PolicyBundle,M2_LOCAL_PROFILE_ID} from '../../scripts/kasi/local-chart-facts.mjs';
import {syntheticLocalChartCandidate,chartRequest} from './kasi-local-chart-synthetic.mjs';

const ROLES=['year','month','day','hour'];
const bundle=getM2PolicyBundle(M2_LOCAL_PROFILE_ID);
// Reuse existing policy/rule metadata rather than inventing native versions or source approval.
const seed=syntheticLocalChartCandidate();
const chart=createLocalChartProfile(seed.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:seed.expectedManifestSha256});
const metadata=deriveLocalChartFacts(chart.calculate(chartRequest()),{m2ProfileId:M2_LOCAL_PROFILE_ID});
const natureStem='src/domain/stems.ts#STEM_NATURE',natureBranch='src/domain/branches.ts#BRANCH_NATURE';
const godRule='M0-RULE-TEN-GODS-ELEMENT-RELATION',hiddenRule='M2-RULE-HIDDEN-STEMS-001',branchGodRule='M2-RULE-BRANCH-TEN-GODS-001';
const monthNumber={XIAOHAN:'01',LICHUN:'02',JINGZHE:'03',QINGMING:'04',LIXIA:'05',MANGZHONG:'06',XIAOSHU:'07',LIQIU:'08',BAILU:'09',HANLU:'10',LIDONG:'11',DAXUE:'12'};

export function structuralM2Unit(pillarSets=[['甲子','丙寅','甲午','壬申']],{monthTerms=[]}={}){
  const sourceIds=pillarSets.map((_,i)=>'STRUCTURAL_UNIT_CALENDAR_REFERENCE:'+i);
  const preview={status:'OK',preview:{schemaVersion:'v0-korean-birth-chart-preview-v1',locale:'ko-KR',
    inputNature:'STRUCTURAL_UNIT_NOT_REAL_BIRTH',confidence:pillarSets.length===1?'DEFINITE':'PUBLISHED_MINUTE_AMBIGUOUS',confidenceScope:'PUBLISHED_MINUTE_COMPARISON_ONLY',
    policies:{timeBasis:'KOREAN_CIVIL_TIME',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'},coverage:{validation:'STRUCTURAL_COVERAGE_ONLY'},solarTermSourceIds:sourceIds,
    candidates:pillarSets.map(pillars=>Object.fromEntries(ROLES.map((role,i)=>[role,labelKoreanGanZhi({stem:pillars[i][0],branch:pillars[i][1]})])))} };
  const generic=deriveM2ChartFactsV3(preview,bundle.policies.hiddenStems.id,bundle.policies.branchRelations.id,bundle.policies.triadMembership.id);
  const rules=structuredClone(metadata.rules),ruleMap=new Map(rules.map(r=>[r.id,r]));
  const sources=structuredClone(metadata.sources.filter(s=>s.kind==='M2_RULE_SOURCE_RECORD'));
  sources.push(...sourceIds.map(id=>({id,kind:'STRUCTURAL_TEST_CALENDAR_REFERENCE',meaning:'EXPLICIT_FICTIONAL_UNIT_NOT_API_OR_M1_AUTHENTICATION'})));
  const candidates=generic.candidates.map((candidate,index)=>{
    const id='chart.candidates['+index+']',facts=[],calendarId=sourceIds[index],term=monthTerms[index]??'LIXIA';
    const add=(suffix,kind,value,roles,ruleRefs,policyRefs=[])=>{
      const fact={id:id+'#'+suffix,candidateRef:id,kind,value:structuredClone(value),pillarRefs:roles.map(role=>id+'.'+role),ruleRefs,policyRefs,
        sourceRefs:[...new Set(ruleRefs.flatMap(ref=>ruleMap.get(ref).sourceIds))],calculationSourceRefs:[calendarId]};facts.push(fact);return fact;
    };
    add('summary','SUMMARY',{pillars:ROLES.map((role,i)=>({role,...preview.preview.candidates[index][role]})),boundarySide:pillarSets.length===1?'DEFINITE':index===0?'BEFORE_PUBLISHED_MINUTE':'AFTER_PUBLISHED_MINUTE',activeSince:{term,displayedDateTime:'2026-'+monthNumber[term]+'-05T01:20',timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[calendarId],koreanName:SOLAR_TERM_DEFINITIONS[term].koreanName}},ROLES,['kasi-local-m2-composition-v1'],[bundle.id]);
    add('day-master','DAY_MASTER',{stem:candidate.dayMaster,...STEM_NATURE[candidate.dayMaster]},['day'],[natureStem]);
    const pillars=candidate.pillars.map(pillar=>({...structuredClone(pillar),nature:{stem:structuredClone(STEM_NATURE[pillar.stem]),branch:structuredClone(BRANCH_NATURE[pillar.branch])}}));
    for(const pillar of pillars){
      const role=pillar.role;
      add(role+'-nature','PILLAR_NATURE',{role,stem:pillar.stem,branch:pillar.branch,stemNature:pillar.nature.stem,branchNature:pillar.nature.branch},[role],[natureStem,natureBranch]);
      if(role!=='day')add(role+'-visible-ten-god','VISIBLE_TEN_GOD',{role,stem:pillar.stem,dayMaster:candidate.dayMaster,tenGod:pillar.visibleTenGod},['day',role],[godRule]);
      const hidden=add(role+'-hidden-stems','HIDDEN_STEMS',{role,branch:pillar.branch,dayMaster:candidate.dayMaster,members:pillar.branchTenGods.members,principalTenGod:pillar.branchTenGods.members[0].tenGod},['day',role],[hiddenRule,branchGodRule,godRule],[bundle.policies.hiddenStems.id]);
      hidden.value.members=hidden.value.members.map(member=>({...member,id:hidden.id+'#member['+member.index+']',candidateRef:id,pillarRef:id+'.'+role,
        memberRef:'facts.candidates['+index+'].pillars['+ROLES.indexOf(role)+'].branchTenGods.members['+member.index+']',m2FactRef:'genericM2.candidates['+index+'].pillars['+ROLES.indexOf(role)+'].branchTenGods.members['+member.index+']',
        ruleRefs:[hiddenRule,branchGodRule,godRule],policyRefs:[bundle.policies.hiddenStems.id],sourceRefs:[...ruleMap.get(hiddenRule).sourceIds]}));
    }
    candidate.branchRelations.forEach((relation,i)=>add('relation-'+i,'BRANCH_RELATION',relation,[relation.leftPillarRole,relation.rightPillarRole],[relation.ruleId],[bundle.policies.branchRelations.id]));
    candidate.triadMemberships.forEach((triad,i)=>add('triad-'+i,'TRIAD_MEMBERSHIP',triad,[...new Set(triad.members.flatMap(m=>m.pillarRoles))],[triad.ruleId],[bundle.policies.triadMembership.id]));
    return {id,candidateIndex:index,dayMaster:candidate.dayMaster,pillars,branchRelations:structuredClone(candidate.branchRelations),triadMemberships:structuredClone(candidate.triadMemberships),facts};
  });
  return {schemaVersion:'kasi-local-chart-facts-v1',status:'READY',inputNature:'STRUCTURAL_UNIT_NOT_REAL_BIRTH',policyBundle:structuredClone(bundle),rules,sources,candidates};
}
