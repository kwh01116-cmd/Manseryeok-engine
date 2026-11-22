import { validateM4InnerPatterns, type M4InnerPatternsResult, type M4InnerPatternType } from "../m4/innerPatternsV1.js";
import type { M3EvidenceResult, M3InputEnvelope, M3StemLocation } from "../m3/structuralEvidenceV1.js";
import type { TenGod } from "../domain/tenGods.js";

export const PATTERN_REVIEW_POLICY_ID = "E2-MONTH-PATTERN-SHARED-LOCATION-V01" as const;
export const PATTERN_REVIEW_VERSION = "0.1.0" as const;
type Pattern = M4InnerPatternsResult["candidates"][number]["patterns"][number];
interface Path {
  kind: string;
  pivot: "from" | "to";
  partnerGod?: TenGod;
  visibleOnly?: boolean;
}
interface ReviewRule {
  id: string;
  name: string;
  types: readonly M4InnerPatternType[];
  first: Path;
  second: Path;
  requires: readonly string[];
}

const rules: readonly ReviewRule[] = [
  {id:"OFFICER_HURT_AND_VISIBLE_RESOURCE", name:"월령 정관을 중심으로 본 상관과 표면 인성의 생극 방향",
    types:["正官"], first:{kind:"HURTING_OFFICER_CONTROLS_OFFICER",pivot:"to"},
    second:{kind:"OFFICER_GENERATES_RESOURCE",pivot:"from",visibleOnly:true},
    requires:["RESOURCE_CAN_RESTRAIN_HURTING_OFFICER","ACCOUNT_FOR_WEALTH_AND_COMBINATIONS"]},
  {id:"WEALTH_ROBBER_AND_VISIBLE_FOOD", name:"월령 재성을 중심으로 본 겁재와 표면 식신의 생극 방향",
    types:["正財","偏財"],first:{kind:"PEER_CONTROLS_WEALTH",pivot:"to",partnerGod:"劫財"},
    second:{kind:"OUTPUT_GENERATES_WEALTH",pivot:"to",partnerGod:"食神",visibleOnly:true},
    requires:["TRANSMISSION_FROM_ROBBER_THROUGH_FOOD","WEALTH_AND_PEER_RELATIVE_FORCE"]},
  {id:"KILLINGS_FOOD_AND_RESOURCE", name:"월령 칠살에 대한 식신의 제어와 칠살에서 인성으로의 생",
    types:["七殺"],first:{kind:"OUTPUT_CONTROLS_KILLINGS",pivot:"to",partnerGod:"食神"},
    second:{kind:"KILLINGS_GENERATE_RESOURCE",pivot:"from"},
    requires:["FOOD_CAN_CONTROL_KILLINGS","RESOURCE_EFFECT_ON_FOOD","WEALTH_SUPPORT_OF_KILLINGS"]},
];

function linksAt(pattern: Pattern, path: Path, pivot: M3StemLocation) {
  const obs = pattern.observations.find(item => item.kind === path.kind);
  if (!obs) throw new RangeError("E2_REQUIRED_M4_OBSERVATION_MISSING");
  const other = path.pivot === "from" ? "to" : "from";
  const matches = obs.links.filter(link => link[path.pivot].locationId === pivot.locationId &&
    (!path.partnerGod || link[other].tenGod === path.partnerGod));
  const row = (link: typeof matches[number]) => ({
    linkRef:link.id, partner:link[other].locationId, role:link[other].pillarRole,
    kind:link[other].locationKind, tenGod:link[other].tenGod, stem:link[other].stem,
    factRefs:link[other].inputFactRefs,
  });
  return {kind:obs.kind, observationRef:obs.id, visibleRequired:path.visibleOnly === true,
    qualifying:matches.filter(link=>!path.visibleOnly || link[other].locationKind === "VISIBLE_STEM").map(row),
    hiddenOnlyExcluded:matches.filter(link=>path.visibleOnly && link[other].locationKind !== "VISIBLE_STEM").map(row)};
}

/** Only authenticated M4 observations from the same M2/M3 invocation are eligible. */
export function reviewPatternPrerequisites(inner:M4InnerPatternsResult, evidence:M3EvidenceResult,
  m2Facts:M3InputEnvelope, candidateIndex:number) {
  if (!evidence || !m2Facts) throw new RangeError("E2_PATTERN_M2_AND_M3_REQUIRED");
  validateM4InnerPatterns(inner,{m2Facts,evidence});
  const c = inner.candidates[candidateIndex];
  if (!c || c.candidateIndex !== candidateIndex || c.candidateRef !== m2Facts.candidates[candidateIndex]?.id)
    throw new RangeError("E2_PATTERN_CANDIDATE_REQUIRED");
  return rules.flatMap(rule=>c.patterns.filter(p=>rule.types.includes(p.patternType)).map(p=>{
    const active=p.assessment.status === "STRUCTURAL_CANDIDATE";
    const anchors=active ? [...p.monthMembers, ...p.exactExposures.map(x=>x.visible)] : [];
    const byAnchor = [...new Map(anchors.map(loc=>[loc.locationId,loc])).values()].map(anchor=>{
      const first=linksAt(p,rule.first,anchor), second=linksAt(p,rule.second,anchor);
      const one=first.qualifying.length>0, two=second.qualifying.length>0;
      return {anchorRef:anchor.locationId,stem:anchor.stem,role:anchor.pillarRole,position:anchor.position,
        observed:one && two ? "BOTH_AT_SAME_LOCATION" : one ? "FIRST_ONLY" : two ? "SECOND_ONLY" : "NEITHER",
        first,second, factRefs:[...new Set([...anchor.inputFactRefs,...[first,second].flatMap(path=>
          [...path.qualifying,...path.hiddenOnlyExcluded].flatMap(link=>link.factRefs))])]};
    });
    return {candidateRef:c.candidateRef,ruleId:rule.id,name:rule.name,patternType:p.patternType,
      policyId:PATTERN_REVIEW_POLICY_ID,policyVersion:PATTERN_REVIEW_VERSION,ruleAuthority:"PROJECT_POLICY",
      sourceRefs:["M4-ZPZQ-ORIGINAL-CHENGBAI-NCC","E2-PROJECT-SHARED-LOCATION"],
      assessmentRef:p.assessment.id, monthBasis:p.assessment.basis,
      status:!active ? p.assessment.status : byAnchor.some(a=>a.observed==="BOTH_AT_SAME_LOCATION")
        ? "COOBSERVED_PREREQUISITES" : "INCOMPLETE_PREREQUISITES",
      byAnchor, competingExposures:p.competition.exposures.map(x=>x.id),
      additionalPrerequisites:rule.requires,effect:"EFFECT_POLICY_REQUIRED",
      formation:"NOT_ADJUDICATED",breakage:"NOT_ADJUDICATED",rescue:"NOT_ADJUDICATED",
      factRefs:[...new Set([...p.assessment.inputFactRefs,...byAnchor.flatMap(a=>a.factRefs)])]};
  }));
}
