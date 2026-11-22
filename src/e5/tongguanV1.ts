import type { ChartPillarRole } from "../chartFacts/chartFactsV1.js";
import type { BranchRelationKind } from "../domain/branchRelations.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { FIVE_ELEMENTS, type FiveElement } from "../domain/stems.js";
import { fiveElementRelation } from "../domain/tenGods.js";
import {
  validateM3EvidenceInputContext,
  type M3EvidenceResult,
  type M3InputCandidate,
  type M3InputEnvelope,
  type M3StemLocation,
} from "../m3/structuralEvidenceV1.js";

export const TONGGUAN_POLICY_ID = "E5-NATAL-TONGGUAN-V01" as const;
export const TONGGUAN_VERSION = "0.1.0" as const;

export interface TongguanSelectionV1 {
  readonly policyId: typeof TONGGUAN_POLICY_ID;
  readonly policyVersion: typeof TONGGUAN_VERSION;
}

const ROLES = ["year", "month", "day", "hour"] as const;
const SOURCES = Object.freeze([
  "https://zh.wikisource.org/zh/滴天髓/20",
  "https://wuguo.org/novel/155/chapter/7785",
  "docs/research/ENGINE_E5_TONGGUAN_POLICY_V01.md",
]);
const LIMITS = Object.freeze([
  "NATAL_POSITIONS_ONLY",
  "EFFECTIVENESS_NOT_EVALUATED",
  "NO_ELEMENT_ADDITION_PRESCRIPTION",
  "NO_FINAL_USEFUL_GOD_OR_FAVORABLE_RANK",
]);
const unique = <T>(items: readonly T[]) => [...new Set(items)];

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** A finite relation table only. This grants no observed or operative status to a chain. */
export const TONGGUAN_DIRECTIONS = freeze(FIVE_ELEMENTS.map(from => {
  const to = FIVE_ELEMENTS.find(element => fiveElementRelation(from, element) === "DAY_MASTER_CONTROLS")!;
  const mediator = FIVE_ELEMENTS.find(element => fiveElementRelation(from, element) === "DAY_MASTER_GENERATES" &&
    fiveElementRelation(element, to) === "DAY_MASTER_GENERATES")!;
  return { from, to, mediator };
}));

export const TONGGUAN_METADATA = freeze({
  id: TONGGUAN_POLICY_ID,
  version: TONGGUAN_VERSION,
  purpose: "TONGGUAN",
  authority: "PROJECT_POLICY",
  sourceRefs: SOURCES,
  limitations: LIMITS,
  directions: TONGGUAN_DIRECTIONS,
});

interface Position {
  readonly positionRef: string;
  readonly pillarRole: ChartPillarRole;
  readonly pillarIndex: number;
  readonly stem: M3StemLocation["stem"];
  readonly element: FiveElement;
  readonly position: M3StemLocation["position"];
  readonly index: number | null;
  readonly factRefs: readonly string[];
}

function getPositions(parent: M3EvidenceResult["candidates"][number]): readonly Position[] {
  const sites = [parent.visibleDayMaster, ...Object.values(parent.directionalGroups).flat()];
  return sites.map(site => ({
    positionRef: site.locationId,
    pillarRole: site.pillarRole,
    pillarIndex: ROLES.indexOf(site.pillarRole),
    stem: site.stem,
    element: site.element,
    position: site.position,
    index: site.index,
    factRefs: unique([...site.inputFactRefs, ...(site.inputMemberRef ? [site.inputMemberRef] : [])]),
  })).sort((a, b) => a.pillarIndex - b.pillarIndex || (a.index ?? -1) - (b.index ?? -1));
}

function anchored(site: Position): boolean {
  return site.position !== "OTHER";
}

function distance(left: Position, right: Position): number {
  return Math.abs(left.pillarIndex - right.pillarIndex);
}

function mediatorRoots(mediator: Position, positions: readonly Position[]) {
  const observedRoots = mediator.position === "VISIBLE"
    ? positions.filter(site => site.position !== "VISIBLE" && site.element === mediator.element)
    : [];
  return {
    exact: observedRoots.filter(root => root.stem === mediator.stem),
    sameElement: observedRoots.filter(root => root.stem !== mediator.stem),
  };
}

type ConcernKind = "STEM_COMBINATION" | "NEARBY_CONTROL_OF_MEDIATOR" | BranchRelationKind;
interface Concern {
  readonly concernRef: string;
  readonly kind: ConcernKind;
  readonly leftRef: string;
  readonly rightRef: string;
  readonly factRefs: readonly string[];
}

function combinationConcerns(positions: readonly Position[]): readonly Concern[] {
  const visible = positions.filter(site => site.position === "VISIBLE");
  return visible.flatMap((left, index) => visible.slice(index + 1).flatMap(right => {
    if (!areStemCombinationPartners(left.stem, right.stem)) return [];
    return [{
      concernRef: left.positionRef + "+" + right.positionRef,
      kind: "STEM_COMBINATION" as const,
      leftRef: left.positionRef,
      rightRef: right.positionRef,
      factRefs: unique([...left.factRefs, ...right.factRefs]),
    }];
  }));
}

function branchConcerns(candidate: M3InputCandidate) {
  const facts = candidate.facts.filter(fact => fact.kind === "BRANCH_RELATION");
  return candidate.branchRelations.map((pair, index) => ({
    concernRef: facts[index]!.id,
    kind: pair.kind,
    leftRef: pair.leftFactRef,
    rightRef: pair.rightFactRef,
    factRefs: [facts[index]!.id],
    leftPillarIndex: pair.leftPillarIndex,
    rightPillarIndex: pair.rightPillarIndex,
  }));
}

function routeConcerns(
  chain: readonly [Position, Position, Position],
  roots: ReturnType<typeof mediatorRoots>,
  positions: readonly Position[],
  stemPairs: readonly Concern[],
  branchPairs: ReturnType<typeof branchConcerns>,
): readonly Concern[] {
  const [, mediator] = chain;
  const visible = chain.filter(site => site.position === "VISIBLE").map(site => site.positionRef);
  const hidden = [...chain.filter(site => site.position !== "VISIBLE"), ...roots.exact].map(site => site.pillarIndex);
  const nearby: Concern[] = positions
    .filter(site => anchored(site) && distance(site, mediator) <= 1 &&
      fiveElementRelation(site.element, mediator.element) === "DAY_MASTER_CONTROLS")
    .map(site => ({
      concernRef: site.positionRef + ">" + mediator.positionRef,
      kind: "NEARBY_CONTROL_OF_MEDIATOR",
      leftRef: site.positionRef,
      rightRef: mediator.positionRef,
      factRefs: unique([...site.factRefs, ...mediator.factRefs]),
    }));
  return [
    ...stemPairs.filter(pair => visible.includes(pair.leftRef) || visible.includes(pair.rightRef)),
    ...branchPairs.filter(pair => hidden.includes(pair.leftPillarIndex) || hidden.includes(pair.rightPillarIndex)),
    ...nearby,
  ];
}

function controlRoute(
  direction: typeof TONGGUAN_DIRECTIONS[number],
  positions: readonly Position[],
  stemPairs: readonly Concern[],
  branchPairs: ReturnType<typeof branchConcerns>,
) {
  const sources = positions.filter(site => site.element === direction.from);
  const targets = positions.filter(site => site.element === direction.to);
  if (!sources.length || !targets.length) return null;

  const mediators = positions.filter(site => site.element === direction.mediator);
  const sourceAnchors = sources.filter(anchored);
  const targetAnchors = targets.filter(anchored);
  const paths = mediators.filter(anchored).flatMap(mediator => {
    const roots = mediatorRoots(mediator, positions);
    return sourceAnchors.filter(source => distance(source, mediator) <= 1).flatMap(source =>
      targetAnchors.filter(target => distance(mediator, target) <= 1).map(target => {
        const chain = [source, mediator, target] as const;
        const concerns = routeConcerns(chain, roots, positions, stemPairs, branchPairs);
        return {
          chain: chain.map(site => site.positionRef),
          steps: [distance(source, mediator), distance(mediator, target)],
          factRefs: unique(chain.flatMap(site => site.factRefs)),
          concernRefs: concerns.map(item => item.concernRef),
          concerns,
        };
      }));
  });
  const concerns = [...new Map(paths.flatMap(path => path.concerns).map(item => [item.concernRef, item])).values()];
  const holdReasons = [];
  if (paths.length === 0) {
    if (mediators.length === 0) holdReasons.push("MEDIATOR_NOT_OBSERVED");
    else if (!mediators.some(anchored)) holdReasons.push("MEDIATOR_OTHER_HIDDEN_ONLY");
    if (!sourceAnchors.length || !targetAnchors.length) holdReasons.push("CONTROL_ENDPOINT_OTHER_HIDDEN_ONLY");
    if (!holdReasons.length) holdReasons.push("NO_POSITION_CHAIN_WITHIN_POLICY_REACH");
  }
  return {
    ...direction,
    controlledBy: sources.map(site => site.positionRef),
    controlTargets: targets.map(site => site.positionRef),
    mediatorPositions: mediators.map(site => {
      const roots = mediatorRoots(site, positions);
      return {
        positionRef: site.positionRef,
        eligibleAsAnchor: anchored(site),
        exactRootRefs: roots.exact.map(root => root.positionRef),
        sameElementOtherStemRefs: roots.sameElement.map(root => root.positionRef),
      };
    }),
    status: paths.length === 0 ? "HOLD" as const :
      paths.every(path => path.concernRefs.length > 0) ? "COMPETING_PATH" as const : "STRUCTURAL_PATH" as const,
    paths: paths.map(({ concerns: _concerns, ...row }) => row),
    opposingEvidence: concerns,
    unresolvedConditions: holdReasons,
    effectStatus: "NOT_EVALUATED" as const,
  };
}

export function assessTongguanV1(
  evidence: M3EvidenceResult,
  m2Facts: M3InputEnvelope,
  candidateIndex: number,
  selection: TongguanSelectionV1,
) {
  if (selection?.policyId !== TONGGUAN_POLICY_ID || selection.policyVersion !== TONGGUAN_VERSION) {
    throw new RangeError("EXPLICIT_E5_TONGGUAN_POLICY_REQUIRED");
  }
  validateM3EvidenceInputContext(evidence, m2Facts);
  if (!Number.isSafeInteger(candidateIndex) || candidateIndex < 0) {
    throw new RangeError("E5_TONGGUAN_CANDIDATE_REQUIRED");
  }
  const parent = evidence.candidates[candidateIndex];
  const candidate = m2Facts.candidates[candidateIndex];
  if (!parent || candidate?.id !== parent.candidateRef) {
    throw new RangeError("E5_TONGGUAN_CANDIDATE_REQUIRED");
  }
  const observedPositions = getPositions(parent);
  const stemPairs = combinationConcerns(observedPositions);
  const branchPairs = branchConcerns(candidate);
  const routes = TONGGUAN_DIRECTIONS.flatMap(direction => {
    const route = controlRoute(direction, observedPositions, stemPairs, branchPairs);
    return route ? [route] : [];
  });
  const eligible = routes.filter(route => route.status !== "HOLD");
  const candidates = eligible.map(route => ({
    element: route.mediator,
    from: route.from,
    to: route.to,
    positionRefs: unique(route.paths.map(path => path.chain[1]!)),
  }));
  const supportingEvidence = eligible.map(route => ({
    kind: "PROJECT_POSITION_CHAIN" as const,
    from: route.from,
    mediator: route.mediator,
    to: route.to,
    pathCount: route.paths.length,
    factRefs: unique(route.paths.flatMap(path => path.factRefs)),
  }));
  const opposingEvidence = [...new Map(routes.flatMap(route => route.opposingEvidence)
    .map(item => [item.concernRef, item])).values()];
  return freeze({
    schemaVersion: "manseryeok-e5-tongguan-result-v1",
    purpose: "TONGGUAN" as const,
    policyId: TONGGUAN_POLICY_ID,
    policyVersion: TONGGUAN_VERSION,
    candidateRef: parent.candidateRef,
    status: routes.length === 0 ? "NOT_APPLICABLE" as const : !candidates.length ? "HOLD" as const :
      candidates.length > 1 || eligible.some(route => route.status === "COMPETING_PATH")
        ? "COMPETING_PATHS" as const : "STRUCTURAL_CANDIDATES" as const,
    candidates,
    observedPositions,
    routes,
    supportingEvidence,
    opposingEvidence,
    unresolvedConditions: unique([
      ...routes.flatMap(route => route.unresolvedConditions),
      ...(routes.length ? ["ACTUAL_MEDIATION_EFFICACY"] : []),
    ]),
    sourceRefs: SOURCES,
    factRefs: unique([
      ...observedPositions.flatMap(site => site.factRefs),
      ...opposingEvidence.flatMap(item => item.factRefs),
    ]),
    effectStatus: "NOT_EVALUATED" as const,
    limitationCodes: LIMITS,
  });
}
