import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { HEAVENLY_STEMS, STEM_NATURE, type FiveElement, type HeavenlyStem } from "../domain/stems.js";
import { hiddenStemsForBranch, HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE, type HiddenStemPosition } from "../domain/hiddenStems.js";
import { fiveElementRelation, tenGod, type ElementRelation, type TenGod } from "../domain/tenGods.js";
import { collectFourPillarBranchRelations, BRANCH_RELATIONS_POLICY_V1 } from "../domain/branchRelations.js";
import { collectFourPillarTriadMemberships, TRIAD_MEMBERSHIP_POLICY_V1 } from "../domain/triadMemberships.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import type { WeightedSupportInput, SupportRole } from "../experimental/weightedSupportV1.js";

export const PRODUCT_STRENGTH_POLICY_ID = "M3-PRODUCT-POSITIONAL-STRENGTH-V01";
export const PRODUCT_STRENGTH_VERSION = "0.1.0";
export type StrengthFamily = "PEER" | "RESOURCE" | "OUTPUT" | "WEALTH" | "OFFICER";
export type StrengthGrade = "WEAK" | "BORDERLINE" | "STRONG";
const ROLE_ORDER = ["year", "month", "day", "hour"] as const;
const FAMILIES: Record<ElementRelation, StrengthFamily> = {
  SAME: "PEER", TARGET_GENERATES_DAY_MASTER: "RESOURCE", DAY_MASTER_GENERATES: "OUTPUT",
  DAY_MASTER_CONTROLS: "WEALTH", TARGET_CONTROLS_DAY_MASTER: "OFFICER",
};
const SURFACE_UNITS = { year: 800, month: 1200, day: 0, hour: 1000 } as const;
const BRANCH_UNITS = { year: 1000, month: 3000, day: 2000, hour: 1000 } as const;
const TOTAL_UNITS = 10000 as const;

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export const PRODUCT_STRENGTH_METADATA = freeze({
  policyId: PRODUCT_STRENGTH_POLICY_ID, policyVersion: PRODUCT_STRENGTH_VERSION, authority: "PROJECT_POLICY",
  sources: [
    { id: "E1-FIXED-POSITION-BUDGET", kind: "PROJECT_POLICY", ref: "docs/research/M3_PRODUCT_STRENGTH_POLICY_V01.md" },
    { id: "ZPZQ-SEASON-AND-ROOT-CONTEXT", kind: "TEXT_AND_COMMENTARY_CONTEXT_ONLY", ref: "https://ncc.com.tw/fate/paleo/bg/bg_032.htm" },
    { id: "M2-HIDDEN-MEMBERS", kind: "INPUT_CONVENTION", rule: HIDDEN_STEM_RULE.ruleId, policy: HIDDEN_STEM_POLICY_V1, version: HIDDEN_STEM_RULE.version },
  ],
  surfaceUnits: SURFACE_UNITS, branchUnits: BRANCH_UNITS, totalUnits: TOTAL_UNITS,
  mainSharePercentByMemberCount: [100, 70, 60] as const,
  weakBelowUnits: 4500, strongAboveUnits: 5500, specialAtOrBelowUnits: 1000, specialAtOrAboveUnits: 9000,
  limitations: ["STRUCTURAL_WEIGHTS_NOT_MEASURED_FORCE", "NO_EXTRA_ROOT_OR_SEASON_BONUS",
    "NO_RELATION_EFFECT_OR_TRANSFORMATION", "BORDERLINE_IS_POLICY_BAND", "NO_SPECIAL_PATTERN_DIAGNOSIS",
    "NO_PREDICTIVE_VALIDATION"],
});

interface WeightedLocation {
  readonly role: SupportRole;
  readonly family: StrengthFamily;
  readonly kind: "SURFACE" | "HIDDEN";
  readonly stem: HeavenlyStem;
  readonly element: FiveElement;
  readonly tenGod: TenGod;
  readonly position: HiddenStemPosition | null;
  readonly memberCount: number;
  /** Resolvable location in the M2 candidate's pillar; unique for each scored occurrence. */
  readonly factRef: string;
  /** A resolvable id in the M2 candidate's facts array; shared by members of one branch. */
  readonly sourceFactId: string;
  readonly units: number;
}
const supportive = (family: StrengthFamily) => family === "PEER" || family === "RESOURCE";
const sumUnits = (rows: readonly WeightedLocation[]) => rows.reduce((sum, row) => sum + row.units, 0);
const supportUnitsOf = (rows: readonly WeightedLocation[]) => sumUnits(rows.filter(row => supportive(row.family)));
const refsOf = (rows: readonly WeightedLocation[]) => rows.map(row => row.factRef);

function requireInput(ok: unknown, code: string): asserts ok {
  if (!ok) throw new RangeError(code);
}

function checkedPillars(input: WeightedSupportInput) {
  requireInput(input && /^chart\.candidates\[(0|[1-9]\d*)\]$/.test(input.candidateRef), "E1_PARENT_REFERENCE_REQUIRED");
  requireInput(Array.isArray(input.pillars) && input.pillars.length === 4, "E1_FOUR_COMPLETE_PILLARS_REQUIRED");
  const prefix = input.candidateRef.replace(/^chart\./, "facts.");
  return ROLE_ORDER.map((role, i) => {
    requireInput(Object.hasOwn(input.pillars, i), "E1_FOUR_COMPLETE_PILLARS_REQUIRED");
    const p = input.pillars[i];
    requireInput(p && p.role === role && HEAVENLY_STEMS.includes(p.stem) && EARTHLY_BRANCHES.includes(p.branch), "E1_ORDERED_VALID_PILLARS_REQUIRED");
    requireInput(HEAVENLY_STEMS.indexOf(p.stem) % 2 === EARTHLY_BRANCHES.indexOf(p.branch) % 2, "E1_GANZHI_PARITY_REQUIRED");
    requireInput(p.factRef === `${prefix}.pillars[${i}]`, "E1_CROSS_CANDIDATE_PILLAR");
    return { role, stem: p.stem, branch: p.branch, factRef: p.factRef };
  });
}
type Pillars = ReturnType<typeof checkedPillars>;

function mark(units: number, bandShift = 0): StrengthGrade {
  if (units < PRODUCT_STRENGTH_METADATA.weakBelowUnits + bandShift) return "WEAK";
  if (units > PRODUCT_STRENGTH_METADATA.strongAboveUnits + bandShift) return "STRONG";
  return "BORDERLINE";
}
export function classifyProductSupport(units: number): StrengthGrade {
  requireInput(Number.isSafeInteger(units) && units >= 0 && units <= TOTAL_UNITS, "E1_INTEGER_SUPPORT_UNITS_REQUIRED");
  return mark(units);
}

function hiddenUnits(budget: number, memberCount: number, position: HiddenStemPosition, mainAdjustment = 0, mainOnly = false) {
  if (memberCount === 1) return budget;
  const mainPercent = mainOnly ? 100 : PRODUCT_STRENGTH_METADATA.mainSharePercentByMemberCount[memberCount - 1]! + mainAdjustment;
  const main = budget * mainPercent / 100;
  return position === "MAIN_QI" ? main : (budget - main) / (memberCount - 1);
}

function weightedLocations(candidateRef: string, pillars: Pillars, dayStem: HeavenlyStem): WeightedLocation[] {
  const dayElement = STEM_NATURE[dayStem].element;
  const attributes = (stem: HeavenlyStem) => {
    const element = STEM_NATURE[stem].element;
    return { stem, element, tenGod: tenGod(dayStem, stem), family: FAMILIES[fiveElementRelation(dayElement, element)] };
  };
  const rows: WeightedLocation[] = [];
  for (const pillar of pillars) {
    const { role, factRef } = pillar;
    if (role !== "day") {
      rows.push({ ...attributes(pillar.stem), role, kind: "SURFACE", position: null, memberCount: 0,
        units: SURFACE_UNITS[role], factRef: factRef + ".stem", sourceFactId: candidateRef + "#" + role + "-visible-ten-god" });
    }
    const members = hiddenStemsForBranch(pillar.branch, HIDDEN_STEM_POLICY_V1);
    for (const member of members) {
      rows.push({ ...attributes(member.stem), role, kind: "HIDDEN", position: member.position, memberCount: members.length,
        factRef: `${factRef}.branchTenGods.members[${member.index}]`, sourceFactId: candidateRef + "#" + role + "-hidden-stems",
        units: hiddenUnits(BRANCH_UNITS[role], members.length, member.position) });
    }
  }
  return rows;
}

function sensitivityOf(rows: readonly WeightedLocation[], baseline: number) {
  const support = rows.filter(row => supportive(row.family));
  function recalculate(monthShift = 0, mainAdjustment = 0, mainOnly = false) {
    const budgets = { year: BRANCH_UNITS.year - monthShift / 2, month: BRANCH_UNITS.month + monthShift,
      day: BRANCH_UNITS.day, hour: BRANCH_UNITS.hour - monthShift / 2 };
    return support.reduce((total, row) => total + (row.position === null ? row.units :
      hiddenUnits(budgets[row.role], row.memberCount, row.position, mainAdjustment, mainOnly)), 0);
  }
  const probe = (id: string, supportUnits: number, bandShift = 0) => ({
    id, supportUnits, grade: mark(supportUnits, bandShift), deltaUnits: supportUnits - baseline,
  });
  const probes = [
    probe("MONTH_26", recalculate(-400)), probe("MONTH_34", recalculate(400)),
    probe("MAIN_SHARE_MINUS_10PP", recalculate(0, -10)), probe("MAIN_SHARE_PLUS_10PP", recalculate(0, 10)),
    probe("BAND_43_53", baseline, -200), probe("BAND_47_57", baseline, 200),
  ];
  return { status: probes.some(p => p.grade !== mark(baseline)) ? "SENSITIVE_TO_POLICY" as const : "STABLE_IN_PROBES" as const,
    probes, stressOnly: probe("PRINCIPAL_ONLY", recalculate(0, 0, true)) };
}

function competingConditions(candidateRef: string, pillars: Pillars) {
  const branches = pillars.map(p => p.branch) as [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch];
  const pairs = collectFourPillarBranchRelations(branches, BRANCH_RELATIONS_POLICY_V1).map((relation,i) => ({
    ...relation, factRef: candidateRef + "#relation-" + i, adjacent: relation.rightPillarIndex - relation.leftPillarIndex === 1,
  }));
  const triads = collectFourPillarTriadMemberships(branches, TRIAD_MEMBERSHIP_POLICY_V1).map((triad,i) => ({
    ...triad, factRef: candidateRef + "#triad-" + i,
  }));
  const stemPairs = [];
  for (let left = 0; left < pillars.length; left++) {
    for (let right = left + 1; right < pillars.length; right++) {
      const a = pillars[left]!, b = pillars[right]!;
      if (areStemCombinationPartners(a.stem, b.stem)) stemPairs.push({
        leftRole: a.role, rightRole: b.role, adjacent: right - left === 1,
        factRefs: [a.factRef + ".stem", b.factRef + ".stem"],
      });
    }
  }
  return { branchPairs: pairs, triadMemberships: triads, stemPairs, effectStatus: "NOT_EVALUATED" as const };
}

const issued = new WeakSet<object>();

/** Pure opt-in assessment of an ordered, complete chart. Caller authenticates calendar provenance. */
export function assessProductStrength(input: WeightedSupportInput, options: { readonly policyId: string }) {
  requireInput(options?.policyId === PRODUCT_STRENGTH_POLICY_ID, "EXPLICIT_PRODUCT_STRENGTH_POLICY_REQUIRED");
  const pillars = checkedPillars(input);
  const day = pillars[2]!, dayMaster = { stem: day.stem, element: STEM_NATURE[day.stem].element };
  const rows = weightedLocations(input.candidateRef, pillars, day.stem);
  const roleUnits: Record<StrengthFamily, number> = { PEER: 0, RESOURCE: 0, OUTPUT: 0, WEALTH: 0, OFFICER: 0 };
  for (const row of rows) roleUnits[row.family] += row.units;
  const supportUnits = roleUnits.PEER + roleUnits.RESOURCE;
  const supporting = rows.filter(row => supportive(row.family)), opposing = rows.filter(row => !supportive(row.family));
  const topRefs = (subset: WeightedLocation[]) => refsOf(subset.filter(row => row.units === Math.max(...subset.map(item => item.units))));
  const hidden = rows.filter(row => row.kind === "HIDDEN"), month = hidden.filter(row => row.role === "month");
  const dayHidden = hidden.filter(row => row.role === "day"), roots = hidden.filter(row => row.family === "PEER");
  const dayRoots = roots.filter(row => row.role === "day");
  const monthMain = month.find(row => row.position === "MAIN_QI")!;
  const power = rows.filter(row => row.kind === "SURFACE" || row.role === "year" || row.role === "hour");
  const powerSupport = supportUnitsOf(power), powerTotal = sumUnits(power);
  const result = freeze({
    schemaVersion: "m3-product-strength-v01", status: "GRADED_UNDER_SELECTED_POLICY" as const,
    candidateRef: input.candidateRef, policyId: PRODUCT_STRENGTH_POLICY_ID, policyVersion: PRODUCT_STRENGTH_VERSION,
    authority: "PROJECT_POLICY" as const, dayMaster, inputFacts: pillars, weightedComponents: rows, roleUnits,
    score: { supportUnits, opposingUnits: TOTAL_UNITS - supportUnits, totalUnits: TOTAL_UNITS, scale: "100_UNITS_PER_POLICY_POINT" },
    grade: classifyProductSupport(supportUnits),
    seasonalEvidence: { acquired: supportive(monthMain.family), monthBranch: pillars[1]!.branch,
      mainStem: monthMain.stem, mainFamily: monthMain.family, mainRef: monthMain.factRef,
      supportUnits: supportUnitsOf(month), totalUnits: sumUnits(month), factRefs: refsOf(month) },
    rootEvidence: { acquired: dayRoots.length > 0, exactRoots: refsOf(roots.filter(row => row.stem === day.stem)),
      sameElementOtherRoots: refsOf(roots.filter(row => row.stem !== day.stem)), dayRootRefs: refsOf(dayRoots),
      dayResourceRefs: refsOf(dayHidden.filter(row => row.family === "RESOURCE")), dayMemberRefs: refsOf(dayHidden),
      extraRootUnits: 0, rootEffect: "NOT_EVALUATED" as const },
    supportingEvidence: { acquired: powerSupport * 2 > powerTotal,
      comparison: powerSupport * 2 === powerTotal ? "TIED" : powerSupport * 2 > powerTotal ? "SUPPORT_MAJORITY" : "OPPOSITION_MAJORITY",
      supportUnits: powerSupport, totalUnits: powerTotal, powerFactRefs: refsOf(power),
      supportiveRefs: refsOf(supporting), largestSupportRefs: topRefs(supporting) },
    opposingEvidence: { opposingRefs: refsOf(opposing), largestOppositionRefs: topRefs(opposing) },
    competingConditions: competingConditions(input.candidateRef, pillars),
    specialReview: supportUnits <= PRODUCT_STRENGTH_METADATA.specialAtOrBelowUnits || supportUnits >= PRODUCT_STRENGTH_METADATA.specialAtOrAboveUnits,
    sensitivity: sensitivityOf(rows, supportUnits), factRefs: [day.factRef + ".stem", ...refsOf(rows)],
    sourceRefs: PRODUCT_STRENGTH_METADATA.sources, limitations: PRODUCT_STRENGTH_METADATA.limitations,
  });
  issued.add(result);
  return result;
}

export type ProductStrengthAssessment = ReturnType<typeof assessProductStrength>;
/** Confirms an immutable local policy result, not the origin of a caller's pillar DTO. */
export function isIssuedProductStrength(value: unknown): value is ProductStrengthAssessment {
  return value !== null && typeof value === "object" && issued.has(value);
}
