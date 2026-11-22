import {structuralM2Unit} from './m3-structural-unit-input.mjs';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../../dist/m3/structuralEvidenceV1.js';
import {deriveM4InnerPatterns,M4_INNER_PATTERN_PROFILE_ID} from '../../dist/m4/innerPatternsV1.js';
import {assessProductStrength,PRODUCT_STRENGTH_POLICY_ID} from '../../dist/e1/productStrengthV1.js';
import {evaluatePatternV2,PATTERN_V2_POLICY_ID,PATTERN_V2_VERSION} from '../../dist/e5/patternV2.js';

const termByBranch = Object.freeze({
  子:'DAXUE',丑:'XIAOHAN',寅:'LICHUN',卯:'JINGZHE',辰:'QINGMING',巳:'LIXIA',
  午:'MANGZHONG',未:'XIAOSHU',申:'LIQIU',酉:'BAILU',戌:'HANLU',亥:'LIDONG',
});
export const patternV2Selection=Object.freeze({policyId:PATTERN_V2_POLICY_ID,policyVersion:PATTERN_V2_VERSION});
export function contextFor(charts) {
  const m2=structuralM2Unit(charts,{monthTerms:charts.map(pillars=>termByBranch[pillars[1][1]])});
  const m3=deriveM3Evidence(m2,{policyId:M3_EVIDENCE_PROFILE_ID});
  const m4=deriveM4InnerPatterns(m3,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts:m2});
  return {m2,m3,m4};
}
export function strengthFor(context,index) {
  const chart=context.m2.candidates[index];
  return assessProductStrength({candidateRef:chart.id,pillars:chart.pillars.map((p,i)=>({
    role:p.role,stem:p.stem,branch:p.branch,factRef:`facts.candidates[${index}].pillars[${i}]`,
  }))},{policyId:PRODUCT_STRENGTH_POLICY_ID});
}
export function patternV2For(context,index=0,{e1=true}={}) {
  return evaluatePatternV2(context.m4,context.m3,context.m2,index,{
    ...patternV2Selection,...(e1?{strength:strengthFor(context,index)}:{}),
  });
}
