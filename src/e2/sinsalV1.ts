import type { ChartPillarRole } from "../chartFacts/chartFactsV1.js";
import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { ganZhiIndex } from "../domain/sexagenary.js";
import { TRIAD_DEFINITIONS } from "../domain/triadMemberships.js";
import type { HeavenlyStem } from "../domain/stems.js";
import type { M3InputCandidate } from "../m3/structuralEvidenceV1.js";

export const SINSAL_PROFILE_ID = "E2-SINSAL-SIX-NATAL-V01" as const;
export const SINSAL_VERSION = "0.1.0" as const;
export type SinsalBranchReference = "YEAR" | "DAY" | "BOTH";
export interface SinsalSelectionV1 {
  readonly policyId: typeof SINSAL_PROFILE_ID;
  readonly policyVersion: typeof SINSAL_VERSION;
  readonly branchReference: SinsalBranchReference;
}

const ROLES = ["year", "month", "day", "hour"] as const;
const LIMITS = Object.freeze(["NATAL_TABLE_MEMBERSHIP_ONLY", "EFFICACY_NOT_ASSESSED"] as const);
const LABELS = {
  DOHWA: ["도화", "桃花", "SANMING-V2-XIANCHI"],
  YEOKMA: ["역마", "驛馬", "SANMING-V3-YIMA"],
  HWAGAE: ["화개", "華蓋", "SANMING-V2-HUAGAI"],
  CHEONEUL: ["천을귀인", "天乙貴人", "SANMING-V3-TIANYI"],
  MUNCHANG: ["문창귀인", "文昌貴人", "MINGLI-JICHENG-V1-WENCHANG"],
  YANGIN: ["양인", "羊刃", "YUANHAI-V1-YANGREN"],
} as const;
type Star = keyof typeof LABELS;
type BranchStar = "DOHWA" | "YEOKMA" | "HWAGAE";
type StemStar = Exclude<Star, BranchStar>;

// The ordering of the two nobles is for display. Neither one is preferred.
const STEM_TARGETS: Readonly<Record<HeavenlyStem, readonly [readonly EarthlyBranch[], EarthlyBranch, EarthlyBranch]>> = {
  甲: [["丑","未"], "巳", "卯"], 乙: [["子","申"], "午", "辰"],
  丙: [["亥","酉"], "申", "午"], 丁: [["亥","酉"], "酉", "未"],
  戊: [["丑","未"], "申", "午"], 己: [["子","申"], "酉", "未"],
  庚: [["丑","未"], "亥", "酉"], 辛: [["寅","午"], "子", "戌"],
  壬: [["卯","巳"], "寅", "子"], 癸: [["卯","巳"], "卯", "丑"],
};

interface Site {
  readonly position: ChartPillarRole;
  readonly stem: HeavenlyStem;
  readonly branch: EarthlyBranch;
  readonly factRef: string;
}

function requireValue(ok: unknown, msg: string): asserts ok {
  if (!ok) throw new RangeError(msg);
}

// The engine adapter authenticates the parent. This pure lookup also accepts an
// explicitly constructed research fixture, but never accepts mixed parent references.
function sitesFromCandidate(candidate: M3InputCandidate): readonly Site[] {
  requireValue(candidate && Number.isSafeInteger(candidate.candidateIndex) && candidate.candidateIndex >= 0 &&
    candidate.id === `chart.candidates[${candidate.candidateIndex}]` &&
    candidate.pillars?.length === 4 && Array.isArray(candidate.facts), "E2_SINSAL_CANDIDATE_REQUIRED");
  for (const fact of candidate.facts) {
    requireValue(fact && fact.candidateRef === candidate.id, "E2_SINSAL_FOREIGN_FACT");
  }
  const nature = candidate.facts.filter(fact => fact.kind === "PILLAR_NATURE");
  requireValue(nature.length === 4, "E2_SINSAL_FOUR_NATURE_FACTS_REQUIRED");
  return ROLES.map((position, index) => {
    const pillar = candidate.pillars[index];
    const id = candidate.id + "#" + position + "-nature";
    const fact = nature.find(f => f.id === id);
    const value = fact?.value as Record<string, unknown> | undefined;
    requireValue(pillar?.role === position && pillar.factRef === `preview.candidates[${candidate.candidateIndex}].${position}` &&
      value?.role === position && value.stem === pillar.stem && value.branch === pillar.branch &&
      ganZhiIndex(pillar.stem, pillar.branch) !== null, "E2_SINSAL_PILLAR_EVIDENCE_MISMATCH");
    return { position, stem: pillar.stem, branch: pillar.branch, factRef: id };
  });
}

function forward(branch: EarthlyBranch, steps: number): EarthlyBranch {
  return EARTHLY_BRANCHES[(EARTHLY_BRANCHES.indexOf(branch) + steps) % EARTHLY_BRANCHES.length]!;
}

function observe(star: Star, reference: Site, basis: "YEAR_BRANCH" | "DAY_BRANCH" | "DAY_STEM",
    expected: readonly EarthlyBranch[], sites: readonly Site[]) {
  const includeSelf = basis === "DAY_STEM";
  const inspected = includeSelf ? sites : sites.filter(s => s.position !== reference.position);
  const matched = inspected.filter(s => expected.includes(s.branch));
  const [name, hanja, textualSource] = LABELS[star];
  return Object.freeze({
    starId: star, name, hanja, policyId: SINSAL_PROFILE_ID, policyVersion: SINSAL_VERSION,
    ruleId: `${SINSAL_PROFILE_ID}/${star}/${basis}`,
    basis, referencePosition: reference.position, referenceFactRef: reference.factRef,
    referenceStemOrBranch: includeSelf ? reference.stem : reference.branch,
    includeReferencePillar: includeSelf, expectedMatch: Object.freeze([...expected]),
    matchedPositions: Object.freeze(matched.map(s => Object.freeze({
      position: s.position, branch: s.branch, factRef: s.factRef,
    }))),
    inspectedPositions: Object.freeze(inspected.map(s => s.position)),
    factRefs: Object.freeze([...new Set([reference.factRef, ...inspected.map(s => s.factRef)])]),
    status: matched.length ? "PRESENT" as const : "NOT_PRESENT" as const,
    sourceRefs: Object.freeze([textualSource, "E2-SINSAL-PROJECT-REFERENCE-CONVENTION"]), limitations: LIMITS,
  });
}

export function calculateSinsalV1(candidate: M3InputCandidate, options: SinsalSelectionV1) {
  requireValue(options?.policyId === SINSAL_PROFILE_ID && options.policyVersion === SINSAL_VERSION &&
    ["YEAR", "DAY", "BOTH"].includes(options.branchReference), "EXPLICIT_E2_SINSAL_POLICY_REQUIRED");
  const sites = sitesFromCandidate(candidate);
  const observations: ReturnType<typeof observe>[] = [];
  for (const reference of [sites[0]!, sites[2]!]) {
    const isYear = reference.position === "year";
    if (options.branchReference !== "BOTH" && options.branchReference !== (isYear ? "YEAR" : "DAY")) continue;
    // M2's SANHE members are ordered birth, center, tomb. Only the reference
    // branch has to belong to its group; no natal three-member formation is required.
    const group = TRIAD_DEFINITIONS.find(g => g.family === "SANHE" && g.members.includes(reference.branch));
    requireValue(group, "E2_SINSAL_SANHE_GROUP_MISSING");
    const [birth, , tomb] = group.members;
    const targets: readonly [BranchStar, EarthlyBranch][] = [
      ["DOHWA", forward(birth, 1)], ["YEOKMA", forward(birth, 6)], ["HWAGAE", tomb],
    ];
    for (const [star, target] of targets) {
      observations.push(observe(star, reference, isYear ? "YEAR_BRANCH" : "DAY_BRANCH", [target], sites));
    }
  }
  const day = sites[2]!;
  const [noble, literary, blade] = STEM_TARGETS[day.stem];
  const stemTargets: readonly [StemStar, readonly EarthlyBranch[]][] = [
    ["CHEONEUL", noble], ["MUNCHANG", [literary]], ["YANGIN", [blade]],
  ];
  for (const [star, targets] of stemTargets) {
    observations.push(observe(star, day, "DAY_STEM", targets, sites));
  }
  return Object.freeze({
    schemaVersion: "e2-sinsal-six-natal-v1", policyId: SINSAL_PROFILE_ID,
    policyVersion: SINSAL_VERSION, candidateRef: candidate.id, branchReference: options.branchReference,
    observations: Object.freeze(observations), factRefs: Object.freeze(sites.map(s => s.factRef)), limitations: LIMITS,
  });
}
