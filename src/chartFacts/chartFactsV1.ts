import { labelKoreanGanZhi, type KoreanBirthChartPreviewResult,
  type KoreanBirthChartPreview } from "../calendar/koreanBirthPreview.js";
import { branchTenGodFacts, type BranchTenGodFacts } from "../domain/branchTenGods.js";
import { HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE,
  type HiddenStemPolicyId } from "../domain/hiddenStems.js";
import { tenGod, type TenGod } from "../domain/tenGods.js";
import type { EarthlyBranch } from "../domain/branches.js";
import type { HeavenlyStem } from "../domain/stems.js";

export const M2_CHART_FACTS_SCHEMA = "m2-chart-facts-v1" as const;
export const M2_CHART_FACTS_RULE_ID = "M2-RULE-CHART-FACTS-001" as const;
const ROLES = ["year", "month", "day", "hour"] as const;
export type ChartPillarRole = (typeof ROLES)[number];

export interface M2PillarFact {
  readonly role: ChartPillarRole;
  readonly factRef: `preview.candidates[${number}].${ChartPillarRole}`;
  readonly stem: HeavenlyStem;
  readonly branch: EarthlyBranch;
  /** Null for the day-master column: never present its own stem as an interpreted God. */
  readonly visibleTenGod: TenGod | null;
  readonly branchTenGods: BranchTenGodFacts;
}
export interface M2CandidateFacts {
  readonly candidateIndex: number;
  readonly dayMaster: HeavenlyStem;
  readonly pillars: readonly [M2PillarFact,M2PillarFact,M2PillarFact,M2PillarFact];
}
export type M2ChartFactsResult =
  | { readonly schemaVersion: typeof M2_CHART_FACTS_SCHEMA; readonly status: "BLOCKED";
      readonly reason: "OUT_OF_COVERAGE" | "INVALID_LUNAR_DATE"; readonly candidates: readonly []; }
  | { readonly schemaVersion: typeof M2_CHART_FACTS_SCHEMA; readonly status: "READY";
      readonly sourcePreviewVersion: "v0-korean-birth-chart-preview-v1";
      readonly ruleId: typeof M2_CHART_FACTS_RULE_ID;
      readonly evidenceClass: "TRADITIONAL_RULE_LOOKUP_ONLY";
      readonly sourceRuleIds: readonly string[];
      readonly hiddenStemPolicyId: HiddenStemPolicyId;
      readonly hiddenStemSourceIds: readonly string[];
      readonly solarTermSourceIds: readonly string[];
      readonly lunarConversionSource?: NonNullable<KoreanBirthChartPreview["lunarConversionSource"]>;
      readonly policies: KoreanBirthChartPreview["policies"];
      readonly coverage: KoreanBirthChartPreview["coverage"];
      readonly confidence: KoreanBirthChartPreview["confidence"];
      readonly candidateDisplay: "ONE" | "SHOW_ALL_BOUNDARY_CANDIDATES";
      readonly candidates: readonly M2CandidateFacts[]; };

const EMPTY_CANDIDATES = Object.freeze([] as const);

const BLOCKED: Readonly<Record<"OUT_OF_COVERAGE" | "INVALID_LUNAR_DATE", M2ChartFactsResult>> =
  Object.freeze({
    OUT_OF_COVERAGE: Object.freeze({ schemaVersion:M2_CHART_FACTS_SCHEMA,
      status:"BLOCKED",reason:"OUT_OF_COVERAGE",candidates:EMPTY_CANDIDATES }),
    INVALID_LUNAR_DATE: Object.freeze({ schemaVersion:M2_CHART_FACTS_SCHEMA,
      status:"BLOCKED",reason:"INVALID_LUNAR_DATE",candidates:EMPTY_CANDIDATES }),
  });

/**
 * M2 does not recompute astronomical/calendar input, collapse Jie candidates,
 * score strength, assign a 格局/用神 or infer a personal characteristic.
 * All inputs have already passed M1 calendar coverage; this projector defends
 * its M1 contract again so callers cannot quietly forge provenance.
 */
export function deriveM2ChartFacts(
  result: KoreanBirthChartPreviewResult,
  hiddenStemPolicyId: HiddenStemPolicyId,
): M2ChartFactsResult {
  if (hiddenStemPolicyId !== HIDDEN_STEM_POLICY_V1) {
    throw new RangeError("A supported explicit M2 hidden-stem policy is required.");
  }
  if (result?.status === "OUT_OF_COVERAGE" || result?.status === "INVALID_LUNAR_DATE") {
    return BLOCKED[result.status];
  }
  if (result?.status !== "OK" || !result.preview) throw new RangeError("Unsupported M1 preview result.");
  const p = result.preview;
  const boundary = p.confidence === "PUBLISHED_MINUTE_AMBIGUOUS";
  if (p.schemaVersion !== "v0-korean-birth-chart-preview-v1" ||
      p.locale !== "ko-KR" || p.confidenceScope !== "PUBLISHED_MINUTE_COMPARISON_ONLY" ||
      p.policies?.timeBasis !== "KOREAN_CIVIL_TIME" ||
      !["CIVIL_MIDNIGHT","ZI_START"].includes(p.policies.dayRollover) ||
      !["SELECTED_DAY_PILLAR","CIVIL_DATE_DAY_PILLAR"].includes(p.policies.hourStemReference) ||
      p.coverage?.validation !== "STRUCTURAL_COVERAGE_ONLY" ||
      !["DEFINITE","PUBLISHED_MINUTE_AMBIGUOUS"].includes(p.confidence) ||
      !Array.isArray(p.solarTermSourceIds) || p.solarTermSourceIds.length === 0 ||
      p.solarTermSourceIds.some(x => typeof x !== "string" || !x.trim()) ||
      !Array.isArray(p.candidates) || p.candidates.length !== (boundary ? 2 : 1)) {
    throw new RangeError("Unverified M1 calendar, source or candidate contract.");
  }
  const candidates: readonly M2CandidateFacts[] = Object.freeze(p.candidates.map((candidate,index) => {
    if (!candidate || !candidate.day) throw new RangeError("Missing day-master in M1 candidate.");
    const master = candidate.day.stem;
    const pillars = ROLES.map(role => {
      const label = candidate[role];
      if (!label || typeof label.stem !== "string" || typeof label.branch !== "string") {
        throw new RangeError("Malformed M1 pillar.");
      }
      const canonical = labelKoreanGanZhi(label);
      if (canonical.hanja !== label.hanja || canonical.hangul !== label.hangul) {
        throw new RangeError("M1 pillar label does not match its stems/branches.");
      }
      return Object.freeze({
        role,
        factRef: `preview.candidates[${index}].${role}` as const,
        stem: label.stem,
        branch: label.branch,
        visibleTenGod: role === "day" ? null : tenGod(master,label.stem),
        branchTenGods: branchTenGodFacts(master,label.branch,hiddenStemPolicyId),
      });
    }) as [M2PillarFact,M2PillarFact,M2PillarFact,M2PillarFact];
    return Object.freeze({ candidateIndex:index,dayMaster:master,pillars:Object.freeze(pillars) });
  }));
  const solarTermSourceIds = Object.freeze([...new Set(p.solarTermSourceIds)].sort());
  return Object.freeze({
    schemaVersion:M2_CHART_FACTS_SCHEMA,
    status:"READY",
    sourcePreviewVersion:p.schemaVersion,
    ruleId:M2_CHART_FACTS_RULE_ID,
    evidenceClass:"TRADITIONAL_RULE_LOOKUP_ONLY",
    sourceRuleIds:Object.freeze(["M0-RULE-TEN-GODS-ELEMENT-RELATION", HIDDEN_STEM_RULE.ruleId]),
    hiddenStemPolicyId,
    hiddenStemSourceIds:HIDDEN_STEM_RULE.sourceIds,
    solarTermSourceIds,
    ...(p.lunarConversionSource?{lunarConversionSource:Object.freeze({...p.lunarConversionSource})}:{}),
    policies:Object.freeze({...p.policies}),
    coverage:Object.freeze({...p.coverage}),
    confidence:p.confidence,
    candidateDisplay:boundary?"SHOW_ALL_BOUNDARY_CANDIDATES":"ONE",
    candidates,
  });
}
