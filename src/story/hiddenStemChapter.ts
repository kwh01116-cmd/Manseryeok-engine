import { deriveM2ChartFacts, M2_CHART_FACTS_SCHEMA, M2_CHART_FACTS_RULE_ID,
  type M2ChartFactsResult, type M2CandidateFacts, type ChartPillarRole } from "../chartFacts/chartFactsV1.js";
import { HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE, type HiddenStemPolicyId } from "../domain/hiddenStems.js";
import { branchTenGodFacts, BRANCH_TEN_GOD_RULE_ID } from "../domain/branchTenGods.js";
import type { HeavenlyStem } from "../domain/stems.js";
import type { EarthlyBranch } from "../domain/branches.js";
import type { TenGod } from "../domain/tenGods.js";
import type { KoreanBirthChartPreviewResult, KoreanBirthChartPreview } from "../calendar/koreanBirthPreview.js";

// Korean display translations only; membership and ten gods come exclusively from M2.
export const HIDDEN_STEM_KOREAN = Object.freeze({甲:"갑",乙:"을",丙:"병",丁:"정",戊:"무",己:"기",庚:"경",辛:"신",壬:"임",癸:"계"});
export const TEN_GOD_KOREAN = Object.freeze({比肩:"비견",劫財:"겁재",食神:"식신",傷官:"상관",偏財:"편재",正財:"정재",七殺:"칠살",正官:"정관",偏印:"편인",正印:"정인"});
const roles = ["year","month","day","hour"] as const;
function same(a: unknown,b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) &&
    a.length === b.length && [...a].every((value,i)=>same(value,b[i]));
  const left=a as Record<string,unknown>,right=b as Record<string,unknown>;
  return Object.keys(left).length === Object.keys(right).length &&
    Object.keys(left).every(key=>Object.hasOwn(right,key) && same(left[key],right[key]));
}
function invalid(): never { throw new RangeError("Invalid EP4 M2 policy, source or candidate facts."); }

export interface HiddenStemMemberView {
  readonly index: number;
  readonly stem: HeavenlyStem;
  readonly stemHangul: string;
  readonly position: "MAIN_QI" | "OTHER";
  readonly tenGod: TenGod;
  readonly tenGodHangul: string;
  readonly factRef: string;
  readonly m2FactRef: string;
}
export interface HiddenStemBranchView {
  readonly role: ChartPillarRole;
  readonly branch: EarthlyBranch;
  readonly branchHangul: string;
  readonly branchFactRef: string;
  readonly m2FactRef: string;
  readonly ruleId: typeof BRANCH_TEN_GOD_RULE_ID;
  readonly policyId: HiddenStemPolicyId;
  readonly sourceIds: readonly string[];
  readonly members: readonly HiddenStemMemberView[];
}
export interface HiddenStemCandidateView {
  readonly candidateIndex: number;
  readonly dayMaster: HeavenlyStem;
  readonly dayMasterHangul: string;
  readonly dayMasterFactRef: string;
  readonly pillarHanja: readonly string[];
  readonly branches: readonly HiddenStemBranchView[];
}
export interface HiddenStemChapter {
  readonly schemaVersion: "u1-hidden-stem-chapter-v1";
  readonly sourceSchemaVersion: typeof M2_CHART_FACTS_SCHEMA;
  readonly sourcePreviewVersion: KoreanBirthChartPreview["schemaVersion"];
  readonly evidenceClass: "TRADITIONAL_RULE_LOOKUP_ONLY";
  readonly policyId: HiddenStemPolicyId;
  readonly ruleIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly policies: KoreanBirthChartPreview["policies"];
  readonly confidence: KoreanBirthChartPreview["confidence"];
  readonly candidates: readonly HiddenStemCandidateView[];
}

/** Project only M2 v1's hidden members. No new calendar resolution or interpretation. */
export function projectHiddenStemChapter(
  result: KoreanBirthChartPreviewResult, facts: M2ChartFactsResult, policyId: HiddenStemPolicyId,
): HiddenStemChapter {
  if (policyId !== HIDDEN_STEM_POLICY_V1 || result.status !== "OK" || facts.status !== "READY") invalid();
  const p = result.preview;
  if (p.schemaVersion !== "v0-korean-birth-chart-preview-v1" || p.confidenceScope !== "PUBLISHED_MINUTE_COMPARISON_ONLY" ||
      !["DEFINITE","PUBLISHED_MINUTE_AMBIGUOUS"].includes(p.confidence) ||
      !Array.isArray(p.solarTermSourceIds) || !p.solarTermSourceIds.length ||
      [...p.solarTermSourceIds].some(id=>typeof id!=="string" || !id.trim()) ||
      facts.schemaVersion !== M2_CHART_FACTS_SCHEMA || facts.sourcePreviewVersion !== p.schemaVersion ||
      facts.ruleId !== M2_CHART_FACTS_RULE_ID || facts.evidenceClass !== "TRADITIONAL_RULE_LOOKUP_ONLY" ||
      facts.hiddenStemPolicyId !== policyId || !same(facts.hiddenStemSourceIds,HIDDEN_STEM_RULE.sourceIds) ||
      !same(facts.sourceRuleIds,["M0-RULE-TEN-GODS-ELEMENT-RELATION",HIDDEN_STEM_RULE.ruleId]) ||
      !same(facts.solarTermSourceIds,[...new Set(p.solarTermSourceIds)].sort()) ||
      !same(facts.policies,p.policies) || !same(facts.coverage,p.coverage) || facts.confidence !== p.confidence ||
      !same(facts.lunarConversionSource,p.lunarConversionSource) ||
      facts.candidateDisplay !== (p.confidence === "DEFINITE" ? "ONE" : "SHOW_ALL_BOUNDARY_CANDIDATES") ||
      !Array.isArray(facts.candidates) || facts.candidates.length !== p.candidates.length ||
      facts.candidates.length !== (p.confidence === "DEFINITE" ? 1 : 2)) invalid();
  const candidates = [...facts.candidates].map((candidate: M2CandidateFacts,i): HiddenStemCandidateView => {
    const preview = p.candidates[i];
    if (!candidate || !preview || candidate.candidateIndex !== i || candidate.dayMaster !== preview.day.stem ||
        !Array.isArray(candidate.pillars) || candidate.pillars.length !== 4) invalid();
    const branches = roles.map((role,j): HiddenStemBranchView => {
      const pillar = candidate.pillars[j];
      if (!pillar || pillar.role !== role || pillar.factRef !== `preview.candidates[${i}].${role}` ||
          pillar.stem !== preview[role].stem || pillar.branch !== preview[role].branch) invalid();
      // Existing primitive validates supplied M2 results, including ten-god values. No UI calculation.
      const canonical = branchTenGodFacts(candidate.dayMaster,pillar.branch,policyId);
      if (!same(pillar.branchTenGods,canonical)) invalid();
      const m2FactRef = `chartFacts.candidates[${i}].pillars[${j}].branchTenGods`;
      return Object.freeze({
        role, branch: pillar.branch, branchHangul: preview[role].hangul[1]!,
        branchFactRef: `preview.candidates[${i}].${role}.branch`, m2FactRef,
        ruleId: canonical.ruleId, policyId, sourceIds: Object.freeze([...canonical.sourceIds]),
        members: Object.freeze(canonical.members.map((member,k) => Object.freeze({
          ...member, stemHangul: HIDDEN_STEM_KOREAN[member.stem], tenGodHangul: TEN_GOD_KOREAN[member.tenGod],
          factRef: `ep4.candidates[${i}].branches[${j}].members[${k}]`,
          m2FactRef: `${m2FactRef}.members[${k}]`,
        }))),
      });
    });
    return Object.freeze({candidateIndex:i,dayMaster:candidate.dayMaster,
      dayMasterHangul:HIDDEN_STEM_KOREAN[candidate.dayMaster],dayMasterFactRef:`preview.candidates[${i}].day.stem`,
      pillarHanja:Object.freeze(roles.map(role=>preview[role].hanja)),branches:Object.freeze(branches)});
  });
  return Object.freeze({schemaVersion:"u1-hidden-stem-chapter-v1",sourceSchemaVersion:M2_CHART_FACTS_SCHEMA,
    sourcePreviewVersion:p.schemaVersion,evidenceClass:"TRADITIONAL_RULE_LOOKUP_ONLY",policyId,
    ruleIds:Object.freeze([M2_CHART_FACTS_RULE_ID,HIDDEN_STEM_RULE.ruleId,BRANCH_TEN_GOD_RULE_ID,"M0-RULE-TEN-GODS-ELEMENT-RELATION"]),
    sourceIds:Object.freeze([...HIDDEN_STEM_RULE.sourceIds]),policies:Object.freeze({...p.policies}),
    confidence:p.confidence,candidates:Object.freeze(candidates)});
}

export function deriveHiddenStemChapter(result: KoreanBirthChartPreviewResult, policyId: HiddenStemPolicyId): HiddenStemChapter {
  return projectHiddenStemChapter(result,deriveM2ChartFacts(result,policyId),policyId);
}
