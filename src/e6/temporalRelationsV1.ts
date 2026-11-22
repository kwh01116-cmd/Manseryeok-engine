import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "../domain/stems.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { HIDDEN_STEM_POLICY_V1, HIDDEN_STEM_RULE, hiddenStemsForBranch } from "../domain/hiddenStems.js";
import { TWELVE_GROWTH_POLICY_V1, twelveGrowthStage } from "../domain/twelveGrowthStages.js";
import { tenGod } from "../domain/tenGods.js";
import { BRANCH_RELATIONS_POLICY_V1, branchRelationsBetween, type BranchRelationHit } from "../domain/branchRelations.js";
import {
  TRIAD_DEFINITIONS, TRIAD_MEMBERSHIP_POLICY_V1, TRIAD_RULES,
  type TriadDefinition, type TriadPartialKind,
} from "../domain/triadMemberships.js";

export const E6_RELATION_POLICY_ID = "E6-NATAL-TRANSIT-M2-MEMBERSHIP-V01";
export const E6_RELATION_VERSION = "0.1.0";
export const E6_TRANSIT_LAYERS = Object.freeze(["DAEUN", "SEYUN", "MONTHLY"] as const);
const NATAL_ROLES = Object.freeze(["year", "month", "day", "hour"] as const);
const UNKNOWN_EFFECT = "NOT_EVALUATED" as const;
const PARTIAL_TRIAD_SOURCE = "MODERN-CLARIFYHK-SANHE-PARTIAL-MEMBER-CATEGORIES-2026";
const LIMITS = Object.freeze([
  "STRUCTURAL_OBSERVATIONS_ONLY", "NO_TRANSFORMATION", "NO_PREDICTION_OR_RANK_ADJUSTMENT",
  "NO_NATAL_ADJACENCY_RULE_FOR_TRANSITS", "NO_ROOT_DAMAGE_INFERENCE",
] as const);
type TransitLayer = typeof E6_TRANSIT_LAYERS[number];
type NatalRole = typeof NATAL_ROLES[number];
type Category = "NATAL_NATAL" | "NATAL_TRANSIT" | "TRANSIT_TRANSIT";

interface PillarInput {
  readonly stem: HeavenlyStem;
  readonly branch: EarthlyBranch;
  readonly positionRef?: string;
  readonly factRefs?: readonly string[];
}
export interface E6NatalPillarInput extends PillarInput { readonly role: NatalRole }
export interface E6TransitPillarInput extends PillarInput {
  readonly layer: TransitLayer;
  readonly periodRef: string;
  readonly period?: unknown;
  readonly intervalStatus?: string;
  readonly policyId?: string;
  readonly policyVersion?: string;
}
export interface E6RelationInputContext {
  readonly natalCandidateRef: string;
  readonly timeContextRef: string;
  readonly positions: readonly E6TransitPillarInput[];
  readonly unavailableLayers?: readonly TransitLayer[];
}
interface Position extends PillarInput {
  readonly layer: "NATAL" | TransitLayer;
  readonly role: NatalRole | null;
  readonly periodRef: string | null;
  readonly positionRef: string;
  readonly instanceKey: string;
  readonly factRefs: readonly string[];
}

function check(value: unknown, code: string): asserts value {
  if (!value) throw new RangeError(code);
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function unique<T>(rows: readonly T[]): T[] { return [...new Set(rows)]; }
function key(...parts: readonly unknown[]) { return JSON.stringify(parts); }

function validatePillar({ stem, branch }: PillarInput) {
  check(HEAVENLY_STEMS.includes(stem) && EARTHLY_BRANCHES.includes(branch) &&
    HEAVENLY_STEMS.indexOf(stem) % 2 === EARTHLY_BRANCHES.indexOf(branch) % 2, "E6_INVALID_RELATION_PILLAR");
}
function categoryOf(left: Position, right: Position): Category {
  if (left.layer === "NATAL" && right.layer === "NATAL") return "NATAL_NATAL";
  if (left.layer !== "NATAL" && right.layer !== "NATAL") return "TRANSIT_TRANSIT";
  return "NATAL_TRANSIT";
}
function pair(left: Position, right: Position, hit: BranchRelationHit | null) {
  const category = categoryOf(left, right);
  const kind = hit?.kind ?? "STEM_COMBINATION";
  const orientation = hit?.orientation ?? "SYMMETRIC";
  const symbols = hit ? [left.branch, right.branch] : [left.stem, right.stem];
  return {
    key: key(category, kind, orientation, left.instanceKey, right.instanceKey),
    shapeKey: key(category, kind, orientation, ...symbols),
    category, kind, orientation, symbols,
    positions: [
      { positionRef: left.positionRef, layer: left.layer, periodRef: left.periodRef },
      { positionRef: right.positionRef, layer: right.layer, periodRef: right.periodRef },
    ],
    factRefs: unique([...left.factRefs, ...right.factRefs]),
    ruleId: hit?.ruleId ?? "STEM_COMBINATION_PAIRS",
    sourceRefs: hit?.sourceIds ?? ["src/domain/stemCombinations.ts#STEM_COMBINATION_PAIRS"],
    effectStatus: UNKNOWN_EFFECT,
  };
}

function pairsOf(positions: readonly Position[]) {
  const pairs: ReturnType<typeof pair>[] = [];
  for (const [index, left] of positions.entries()) {
    for (const right of positions.slice(index + 1)) {
      if (areStemCombinationPartners(left.stem, right.stem)) pairs.push(pair(left, right, null));
      for (const hit of branchRelationsBetween(left.branch, right.branch, BRANCH_RELATIONS_POLICY_V1)) {
        pairs.push(pair(left, right, hit));
      }
    }
  }
  return pairs;
}
function partialKind(definition: TriadDefinition, seen: readonly boolean[]): TriadPartialKind {
  if (seen.every(Boolean)) return null;
  if (definition.family === "SANHUI") return "SANHUI_PARTIAL_MEMBERS";
  if (seen[0] && seen[1]) return "BIRTH_AND_CENTER";
  if (seen[1] && seen[2]) return "CENTER_AND_TOMB";
  return "BIRTH_AND_TOMB_NOT_HALF_TRINE";
}
function triad(definition: TriadDefinition, category: Category, positions: readonly Position[], natalCount: number) {
  const members = definition.members.map(branch => ({ branch, positions: positions.filter(p => p.branch === branch)
    .map(p => ({ positionRef: p.positionRef, instanceKey: p.instanceKey, layer: p.layer, periodRef: p.periodRef, factRefs: p.factRefs })) }));
  const seen = members.map(member => member.positions.length > 0);
  const distinctMemberCount = seen.filter(Boolean).length;
  if (distinctMemberCount < 2) return null;
  const complete = distinctMemberCount === 3;
  const rule = TRIAD_RULES[definition.family];
  return {
    key: key(category, definition.id), category, definitionId: definition.id, family: definition.family,
    namedElement: definition.element,
    state: complete ? "THREE_DISTINCT_MEMBERS" as const : "TWO_DISTINCT_MEMBERS" as const,
    distinctMemberCount, partialKind: partialKind(definition, seen), members,
    missingBranches: members.filter(member => !member.positions.length).map(member => member.branch),
    natalCompletion: category === "NATAL_NATAL" ? "NATAL_ONLY" as const
      : natalCount === 3 ? "NATAL_ALREADY_COMPLETE" as const
      : category === "TRANSIT_TRANSIT" ? "TRANSIT_ONLY" as const
      : complete && natalCount === 2 ? "COMPLETES_NATAL_PARTIAL" as const
      : complete ? "COMPLETE_MIXED_MEMBERSHIP" as const : "PARTIAL_MIXED_MEMBERSHIP" as const,
    includesNewNatalCompletion: category === "NATAL_TRANSIT" && complete && natalCount < 3,
    factRefs: unique(members.flatMap(member => member.positions.flatMap(item => item.factRefs))),
    ruleId: rule.ruleId, policyId: TRIAD_MEMBERSHIP_POLICY_V1,
    sourceRefs: complete || definition.family === "SANHUI" ? rule.sourceIds : [...rule.sourceIds, PARTIAL_TRIAD_SOURCE],
    effectStatus: UNKNOWN_EFFECT,
  };
}
function triadsOf(natal: readonly Position[], transit: readonly Position[]) {
  return TRIAD_DEFINITIONS.flatMap(definition => {
    const belongs = (item: Position) => definition.members.includes(item.branch);
    const natalMembers = natal.filter(belongs), transitMembers = transit.filter(belongs);
    const natalCount = unique(natalMembers.map(item => item.branch)).length;
    return [
      triad(definition, "NATAL_NATAL", natalMembers, natalCount),
      natalCount > 0 && transitMembers.length > 0
        ? triad(definition, "NATAL_TRANSIT", [...natalMembers, ...transitMembers], natalCount) : null,
      triad(definition, "TRANSIT_TRANSIT", transitMembers, natalCount),
    ].filter(item => item !== null);
  });
}

const issued = new WeakMap<object, { readonly signature: string; readonly parent?: object }>();

/** Pure evaluator used by the E6 adapter after authenticating the natal and time-context envelopes. */
export function observeE6Relations(natalCandidateRef: string, natalPillars: readonly E6NatalPillarInput[],
  context: E6RelationInputContext, natalContextKey?: object) {
  check(natalCandidateRef && context.natalCandidateRef === natalCandidateRef && context.timeContextRef,
    "E6_RELATION_CANDIDATE_CONTEXT_MISMATCH");
  check(natalPillars.length === NATAL_ROLES.length && NATAL_ROLES.every(role =>
    natalPillars.filter(item => item.role === role).length === 1), "E6_FOUR_NATAL_POSITIONS_REQUIRED");
  const unavailableLayers = [...(context.unavailableLayers ?? [])];
  check(unique(unavailableLayers).length === unavailableLayers.length &&
    unavailableLayers.every(layer => E6_TRANSIT_LAYERS.includes(layer)), "E6_UNKNOWN_RELATION_LAYER");
  check(context.positions.every(item => E6_TRANSIT_LAYERS.includes(item.layer) && item.periodRef.length > 0 &&
    (!unavailableLayers.includes(item.layer) || item.intervalStatus === "NEEDS_DATA")) &&
    unique(context.positions.map(item => item.layer)).length === context.positions.length,
  "E6_INCOHERENT_RELATION_LAYER_INSTANCES");

  const natal = NATAL_ROLES.map(role => {
    const item = natalPillars.find(p => p.role === role)!;
    validatePillar(item);
    return { ...item, layer: "NATAL" as const, role, periodRef: null,
      positionRef: item.positionRef ?? natalCandidateRef + "#natal:" + role,
      instanceKey: key(natalCandidateRef, "NATAL", role, item.stem, item.branch),
      factRefs: [...(item.factRefs ?? [])] };
  });
  const dayMaster = natal[2]!.stem;
  const transit = E6_TRANSIT_LAYERS.flatMap(layer => {
    const item = context.positions.find(p => p.layer === layer);
    if (!item) return [];
    validatePillar(item);
    const instanceKey = key(natalCandidateRef, layer, item.periodRef, item.stem, item.branch);
    return [{ ...item, ...(item.period === undefined ? {} : { period: structuredClone(item.period) }),
      natalCandidateRef, timeContextRef: context.timeContextRef, role: null,
      positionRef: item.positionRef ?? instanceKey, instanceKey, factRefs: [...(item.factRefs ?? [])],
      stemTenGod: tenGod(dayMaster, item.stem),
      hiddenStems: hiddenStemsForBranch(item.branch, HIDDEN_STEM_POLICY_V1).map(stem => ({ ...stem, tenGod: tenGod(dayMaster, stem.stem) })),
      twelveGrowth: twelveGrowthStage(dayMaster, item.branch, TWELVE_GROWTH_POLICY_V1) }];
  });
  const all = [...natal, ...transit];
  check(unique(all.map(item => item.positionRef)).length === all.length, "E6_DUPLICATE_POSITION_REFERENCE");
  const pairs = pairsOf(all), triads = triadsOf(natal, transit);
  const result = freeze({
    policyId: E6_RELATION_POLICY_ID, policyVersion: E6_RELATION_VERSION,
    natalCandidateRef, timeContextRef: context.timeContextRef, dayMaster,
    status: unavailableLayers.length > 0 ? "PARTIAL" as const :
      pairs.length || triads.length ? "OBSERVED" as const : "OBSERVED_NO_RELATIONS" as const,
    unavailableLayers: E6_TRANSIT_LAYERS.filter(layer => unavailableLayers.includes(layer)),
    natalPositions: natal, transitPositions: transit, pairs, triads,
    sourceRefs: ["src/domain/tenGods.ts", HIDDEN_STEM_RULE.policyId, TWELVE_GROWTH_POLICY_V1,
      BRANCH_RELATIONS_POLICY_V1, TRIAD_MEMBERSHIP_POLICY_V1],
    limitationCodes: LIMITS,
  });
  issued.set(result, { signature: key(natalCandidateRef, ...natal.map(item => item.instanceKey)),
    ...(natalContextKey ? { parent: natalContextKey } : {}) });
  return result;
}

type Observation = ReturnType<typeof observeE6Relations>;
type Pair = Observation["pairs"][number];
type Triad = Observation["triads"][number];
function missingPairLayers(row: Pair, other: Observation) {
  return other.unavailableLayers.filter(layer => row.positions.some(p => p.layer === layer));
}
function membershipKey(row: Triad | undefined) {
  return row ? key(...row.members.map(member => member.positions.map(p => p.instanceKey))) : null;
}

/** Ordered pair delta over two actual, coherent, same-parent observations. Alternatives are compared by the caller. */
export function diffE6Relations(left: Observation, right: Observation) {
  const before = issued.get(left), after = issued.get(right);
  check(before && after, "E6_ISSUED_RELATION_OBSERVATION_REQUIRED");
  check(before.signature === after.signature && before.parent === after.parent
    && left.policyId === right.policyId && left.policyVersion === right.policyVersion, "E6_RELATION_DIFF_PRECONDITION");

  const leftPairs = new Map(left.pairs.map(row => [row.key, row]));
  const rightPairs = new Map(right.pairs.map(row => [row.key, row]));
  const added: Pair[] = [], ended: Pair[] = [], maintained: Pair[] = [];
  const uncomparable: { side: "BEFORE" | "AFTER"; row: Pair; missingLayers: TransitLayer[] }[] = [];
  for (const row of right.pairs) {
    if (leftPairs.has(row.key)) {
      maintained.push(row);
      continue;
    }
    const missingLayers = missingPairLayers(row, left);
    if (missingLayers.length) uncomparable.push({ side: "AFTER", row, missingLayers });
    else added.push(row);
  }
  for (const row of left.pairs) {
    if (rightPairs.has(row.key)) continue;
    const missingLayers = missingPairLayers(row, right);
    if (missingLayers.length) uncomparable.push({ side: "BEFORE", row, missingLayers });
    else ended.push(row);
  }

  const beforeTriads = new Map(left.triads.map(row => [row.key, row]));
  const afterTriads = new Map(right.triads.map(row => [row.key, row]));
  const unobservedLayers = unique([...left.unavailableLayers, ...right.unavailableLayers]);
  const triadChanges = unique([...beforeTriads.keys(), ...afterTriads.keys()]).map(group => {
    const start = beforeTriads.get(group), end = afterTriads.get(group);
    const incomplete = (start ?? end)?.category !== "NATAL_NATAL" && unobservedLayers.length > 0;
    const equal = membershipKey(start) === membershipKey(end);
    const status = incomplete ? "UNCOMPARABLE" as const : equal ? "MAINTAINED" as const
      : !start ? "ADDED" as const : !end ? "ENDED" as const : "CHANGED" as const;
    return { key: group, status, before: start ?? null, after: end ?? null,
      unobservedLayers: incomplete ? unobservedLayers : [],
      observedMembersSame: equal };
  });
  const changedLayers = E6_TRANSIT_LAYERS.flatMap(layer => {
    const a = left.transitPositions.find(p => p.layer === layer);
    const b = right.transitPositions.find(p => p.layer === layer);
    const status = unobservedLayers.includes(layer) ? "UNCOMPARABLE" as const
      : a?.instanceKey !== b?.instanceKey ? "PERIOD_INSTANCE_CHANGED" as const : null;
    return status ? [{ layer, status, beforePeriodRef: a?.periodRef ?? null, afterPeriodRef: b?.periodRef ?? null }] : [];
  });
  return freeze({ policyId: E6_RELATION_POLICY_ID, policyVersion: E6_RELATION_VERSION,
    natalCandidateRef: left.natalCandidateRef, beforeTimeContextRef: left.timeContextRef, afterTimeContextRef: right.timeContextRef,
    status: unobservedLayers.length ? "PARTIAL" as const : "COMPARED" as const,
    added, ended, maintained, uncomparable, triadChanges, changedLayers, unobservedLayers,
    effectStatus: UNKNOWN_EFFECT,
  });
}
