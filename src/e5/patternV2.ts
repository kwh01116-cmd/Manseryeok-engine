import {
  evaluatePatternRulesV1, matchPatternRootLocations, PATTERN_RULES_POLICY_ID, PATTERN_RULES_VERSION,
} from "../e3/patternRulesV1.js";
import type { ProductStrengthAssessment } from "../e1/productStrengthV1.js";
import { areStemCombinationPartners } from "../domain/stemCombinations.js";
import { fiveElementRelation, type TenGod } from "../domain/tenGods.js";
import type { M4InnerPatternsResult } from "../m4/innerPatternsV1.js";
import type { M3EvidenceResult, M3InputEnvelope, M3StemLocation } from "../m3/structuralEvidenceV1.js";

export const PATTERN_V2_POLICY_ID = "E5-NATAL-PATTERN-STRUCTURE-V02" as const;
export const PATTERN_V2_VERSION = "0.2.0" as const;
const ROLE_ORDER = ["year", "month", "day", "hour"] as const;
type Location = M3StemLocation;
type M4Pattern = M4InnerPatternsResult["candidates"][number]["patterns"][number];
type Evidence = M3EvidenceResult["candidates"][number];
type FactCandidate = M3InputEnvelope["candidates"][number];
type Legacy = ReturnType<typeof evaluatePatternRulesV1>["rules"][number];
type Direction = "GENERATES" | "CONTROLS";
type StructuralStatus = "STRUCTURAL_POSSIBILITY" | "COMPETING_PATHS" | "OBSERVED_ONLY" | "NOT_OBSERVED" | "UNRESOLVED" | "OUT_OF_SCOPE";
const PROJECT = "E5-PROJECT-PATTERN-STRUCTURAL-PATHS-V02";
const SOURCE = Object.freeze({
  shen9: "ZPZQ-SHEN-CH9-CHENGBAI",
  officer: "ZPZQ-SHEN-XU-CH31-ZHENGGUAN",
  wealth: "ZPZQ-SHEN-XU-CH33-CAI",
  killings: "ZPZQ-SHEN-XU-CH39-PIANGUAN",
});
const RULES = {
  OFFICER_RESOURCE_SUPPORT: {roles:["正印","偏印"], associatedRoles:["傷官","正財","偏財"], rootUse:"LOCAL_MAIN_QI_ALTERNATIVE", sources:[SOURCE.shen9,SOURCE.officer]},
  OFFICER_HURT_PRESSURE: {roles:["傷官"], associatedRoles:[], rootUse:"NOT_REQUIRED", sources:[SOURCE.shen9,SOURCE.officer]},
  OFFICER_RESOURCE_RESCUE: {roles:["傷官","正印","偏印"], associatedRoles:["正財","偏財"], rootUse:"EXACT_REQUIRED", sources:[SOURCE.shen9,SOURCE.officer]},
  WEALTH_FOOD_FORMATION: {roles:["食神"], associatedRoles:["偏印","正官","七殺","比肩","劫財"], rootUse:"ROOTED_FEEDER_ALTERNATIVE", sources:[SOURCE.shen9,SOURCE.wealth]},
  WEALTH_ROBBER_PRESSURE: {roles:["劫財"], associatedRoles:[], rootUse:"NOT_REQUIRED", sources:[SOURCE.shen9,SOURCE.wealth]},
  WEALTH_FOOD_RESCUE: {roles:["劫財","食神"], associatedRoles:["偏印"], rootUse:"EXACT_REQUIRED", sources:[SOURCE.shen9,SOURCE.wealth]},
  KILLINGS_FOOD_CONTROL: {roles:["食神"], associatedRoles:["正印","偏印","正財","偏財"], rootUse:"EXACT_REQUIRED", sources:[SOURCE.shen9,SOURCE.killings]},
  KILLINGS_RESOURCE_INTERFERENCE: {roles:["食神","正印","偏印"], associatedRoles:["正財","偏財"], rootUse:"EXACT_REQUIRED", sources:[SOURCE.shen9,SOURCE.killings]},
  KILLINGS_RESOURCE_ROUTE: {roles:["正印","偏印"], associatedRoles:["正財","偏財","食神"], rootUse:"EXACT_REQUIRED", sources:[SOURCE.shen9,SOURCE.killings]},
} as const satisfies Record<string, {roles:readonly TenGod[];associatedRoles:readonly TenGod[];rootUse:string;sources:readonly string[]}>;
type RuleId = keyof typeof RULES;
type SupportedLegacy = Legacy & {ruleId:RuleId};
type RootUse = typeof RULES[RuleId]["rootUse"];
type Link = readonly [from:Location,to:Location,direction:Direction];
type Rival = {type:string; location:Location; pivot:Location; direction:Direction};
type Channel = {actor:Location; links:readonly Link[]; rivals:readonly Rival[]};

const unique = (values: readonly string[]) => [...new Set(values)].sort();
const factsOf = (locations: readonly Location[]) => unique(locations.flatMap(x=>x.inputFactRefs));
const distinct = (locations: readonly Location[]) => [...new Map(locations.map(x=>[x.locationId,x])).values()];
const position = (value: Location) => ROLE_ORDER.indexOf(value.pillarRole);
const distance = (a: Location,b: Location) => Math.abs(position(a)-position(b));
const relates = (from:Location,to:Location,direction:Direction) =>
  from.locationId!==to.locationId && fiveElementRelation(from.element,to.element)===`DAY_MASTER_${direction}`;
const view = (loc:Location) => ({locationRef:loc.locationId,candidateRef:loc.candidateRef,pillarRole:loc.pillarRole,
  locationKind:loc.locationKind,position:loc.position,stem:loc.stem,element:loc.element,tenGod:loc.tenGod,
  memberRef:loc.inputMemberRef,factRefs:loc.inputFactRefs});

function freeze<T>(value:T):T {
  if(value && typeof value==="object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function channels(rule:RuleId,anchor:Location,surface:readonly Location[],day:Location):Channel[] {
  const of = (...gods:TenGod[]) => surface.filter(x=>x.tenGod && gods.includes(x.tenGod));
  const resources=of("正印","偏印"), wealth=of("正財","偏財");
  const against = (type:string, actors:readonly Location[], pivot:Location, direction:Direction):Rival[] =>
    actors.filter(actor=>relates(actor,pivot,direction)).map(location=>({type,location,pivot,direction}));
  const direct = (actors:readonly Location[], direction:Direction, rivalFor:(actor:Location)=>readonly Rival[] = ()=>[]):Channel[] =>
    actors.filter(actor=>relates(actor,anchor,direction)).map(actor=>({actor,links:[[actor,anchor,direction]],rivals:rivalFor(actor)}));
  const indirectResource = (food:Location) => against("INDIRECT_RESOURCE_CONTROLS_FOOD",of("偏印"),food,"CONTROLS");
  const wealthFeeds = () => against("WEALTH_GENERATES_KILLINGS",wealth,anchor,"GENERATES");
  const resourceFromAnchor = resources.filter(resource=>relates(anchor,resource,"GENERATES"));
  const hurt = direct(of("傷官"),"CONTROLS"), robber = direct(of("劫財"),"CONTROLS");
  const foodToWealth = direct(of("食神"),"GENERATES",indirectResource);
  const foodToKillings = direct(of("食神"),"CONTROLS",food=>[
    ...against("RESOURCE_CONTROLS_FOOD",resources,food,"CONTROLS"),...wealthFeeds(),
  ]);
  switch(rule) {
    case "OFFICER_RESOURCE_SUPPORT":
      return resourceFromAnchor.map(actor=>({actor,links:[[anchor,actor,"GENERATES"]],rivals:[
        ...against("WEALTH_CONTROLS_RESOURCE",wealth,actor,"CONTROLS"),
        ...against("HURT_OFFICER_CONTROLS_OFFICER",of("傷官"),anchor,"CONTROLS"),
      ]}));
    case "OFFICER_HURT_PRESSURE": return hurt;
    case "OFFICER_RESOURCE_RESCUE":
      return resourceFromAnchor.flatMap(actor=>hurt.filter(h=>relates(actor,h.actor,"CONTROLS")).map(h=>({
        actor,links:[...h.links,[anchor,actor,"GENERATES"],[actor,h.actor,"CONTROLS"]],
        rivals:against("WEALTH_CONTROLS_RESOURCE",wealth,actor,"CONTROLS"),
      })));
    case "WEALTH_FOOD_FORMATION": return foodToWealth;
    case "WEALTH_ROBBER_PRESSURE": return robber;
    case "WEALTH_FOOD_RESCUE":
      return foodToWealth.flatMap(food=>robber.filter(thief=>relates(thief.actor,food.actor,"GENERATES")).map(thief=>({
        actor:food.actor,links:[...thief.links,[thief.actor,food.actor,"GENERATES"],...food.links],rivals:food.rivals,
      })));
    case "KILLINGS_FOOD_CONTROL": return foodToKillings;
    case "KILLINGS_RESOURCE_INTERFERENCE":
      return foodToKillings.flatMap(food=>resources.filter(actor=>relates(actor,food.actor,"CONTROLS")).map(actor=>({
        actor,links:[...food.links,[actor,food.actor,"CONTROLS"]],rivals:wealthFeeds(),
      })));
    case "KILLINGS_RESOURCE_ROUTE":
      return resourceFromAnchor.filter(actor=>relates(actor,day,"GENERATES")).map(actor=>({
        actor,links:[[anchor,actor,"GENERATES"],[actor,day,"GENERATES"]],rivals:[
          ...against("WEALTH_CONTROLS_RESOURCE",wealth,actor,"CONTROLS"),...wealthFeeds(),
        ],
      }));
  }
}

function analyzePath(anchor:Location, channel:Channel, legacy:SupportedLegacy, pattern:M4Pattern, parent:Evidence,
  chart:FactCandidate, surface:readonly Location[], hidden:readonly Location[]) {
  const {actor,links,rivals}=channel;
  const roots=matchPatternRootLocations(actor,hidden);
  const rootUse:RootUse=RULES[legacy.ruleId].rootUse;
  const nearMainQi=roots.sameElementDifferentStem.filter(root=>root.position==="MAIN_QI" && distance(root,actor)<=1);
  const rootedFeederLocations = rootUse==="ROOTED_FEEDER_ALTERNATIVE" ? [...surface,parent.visibleDayMaster]
    .filter(feeder=>["比肩","劫財",null].includes(feeder.tenGod) && distance(feeder,actor)<=1 && relates(feeder,actor,"GENERATES"))
    .flatMap(feeder=>{
      const m=matchPatternRootLocations(feeder,hidden);
      const witnesses=[...m.exact,...m.sameElementDifferentStem.filter(x=>x.position==="MAIN_QI")].filter(x=>distance(feeder,x)<=1);
      return witnesses.length ? [{feeder,roots:witnesses}] : [];
    }) : [];
  const rootedFeeders=rootedFeederLocations.map(({feeder,roots})=>({feeder:view(feeder),roots:roots.map(view)}));
  const support = rootUse==="NOT_REQUIRED" ? "ROLE_RELATION_ONLY" :
    roots.exact.length ? "EXACT_HIDDEN_ROOT" :
    rootUse==="LOCAL_MAIN_QI_ALTERNATIVE" && nearMainQi.length ? "LOCAL_SAME_ELEMENT_MAIN_QI" :
    rootedFeeders.length ? "ADJACENT_ROOTED_PEER_FEEDS_FOOD" : "SUPPORT_UNCONFIRMED";

  const parsedLinks=links.map(([from,to,direction],index)=>{
    const gap=distance(from,to);
    // This bridge is a separate operational definition grounded in the observed 何 route.
    // Both stems must be literally exposed and rooted in their own branches. The recipient
    // of the second link (the day master) is between them, and the second link remains local.
    const bridge = legacy.ruleId==="KILLINGS_RESOURCE_ROUTE" && index===0 && gap===2 &&
      from.locationKind==="VISIBLE_STEM" && to.locationKind==="VISIBLE_STEM" &&
      position(parent.visibleDayMaster)===Math.min(position(from),position(to))+1 &&
      hidden.some(loc=>loc.stem===from.stem && loc.pillarRole===from.pillarRole) &&
      roots.exact.some(loc=>loc.pillarRole===to.pillarRole);
    const admission=gap<=1 ? "LOCAL" as const : bridge ? "SUPPORTED_SPAN" as const : "DISTANT_OBSERVATION" as const;
    return {from:view(from),to:view(to),direction,distance:gap,admission,
      factRefs:factsOf([from,to,...(bridge ? hidden.filter(loc=>(loc.stem===from.stem && loc.pillarRole===from.pillarRole) ||
        (loc.stem===to.stem && loc.pillarRole===to.pillarRole)) : [])])};
  });

  const route=distinct([anchor,...links.flatMap(([a,b])=>[a,b])]);
  const relatedPillars=new Set(route.filter(loc=>loc.locationKind==="HIDDEN_STEM").map(loc=>loc.pillarRole));
  const rootLocations=[...roots.exact,...roots.sameElementDifferentStem];
  const rootPillars=new Set([...rootLocations,...rootedFeederLocations.flatMap(row=>row.roots)].map(loc=>loc.pillarRole));
  const rootClashRoles=new Set<Location["pillarRole"]>();
  const branchFacts=chart.facts.filter(f=>f.kind==="BRANCH_RELATION");
  const branchRelations=chart.branchRelations.flatMap((pair,index)=>{
    const pairRoles=[pair.leftPillarRole,pair.rightPillarRole];
    const touchesRoot=pairRoles.some(p=>rootPillars.has(p));
    const touchesPath=pairRoles.some(p=>relatedPillars.has(p));
    if(!touchesRoot && !touchesPath) return [];
    if(pair.kind==="LIUCHONG" && touchesRoot) pairRoles.forEach(role=>rootClashRoles.add(role));
    return [{kind:pair.kind,roles:pairRoles,touchesRoot,touchesPath,effect:"UNASSESSED" as const,factRefs:[branchFacts[index]!.id]}];
  });
  const triadFacts=chart.facts.filter(f=>f.kind==="TRIAD_MEMBERSHIP");
  const issuedTriads:FactCandidate["triadMemberships"]=parent.relationContext.triads;
  const triadRelations=issuedTriads.flatMap((relation,index)=>{
    const roles=[...new Set(relation.members.flatMap(member=>member.pillarRoles))];
    return roles.some(role=>relatedPillars.has(role) || rootPillars.has(role)) ?
      [{relation,roles,effect:"UNASSESSED" as const,factRefs:[triadFacts[index]!.id]}] : [];
  });
  const visibleOnPath=new Set([...route.filter(loc=>loc.locationKind==="VISIBLE_STEM"),
    ...rootedFeederLocations.map(row=>row.feeder)].map(loc=>loc.locationId));
  const allSurface=[...surface,parent.visibleDayMaster];
  const stemCombinations=allSurface.flatMap((a,index)=>allSurface.slice(index+1)
    .filter(b=>(visibleOnPath.has(a.locationId) || visibleOnPath.has(b.locationId)) && areStemCombinationPartners(a.stem,b.stem))
    .map(b=>({from:view(a),to:view(b),distance:distance(a,b),effect:"UNASSESSED" as const,factRefs:factsOf([a,b])})));
  const rivalDirections=rivals.map(rival=>({type:rival.type,from:view(rival.location),to:view(rival.pivot),
    direction:rival.direction,distance:distance(rival.location,rival.pivot),factRefs:factsOf([rival.location,rival.pivot])}));
  const competingExposures=pattern.competition.exposures.map(exposure=>({
    exposureRef:exposure.id,location:view(exposure.visible),distance:distance(exposure.visible,actor),factRefs:exposure.inputFactRefs,
  }));
  const rootWithClash= roots.exact.filter(root=>rootClashRoles.has(root.pillarRole));
  const hasCompetition=rivalDirections.some(item=>item.distance<=1) || competingExposures.some(item=>item.distance<=1);
  const structuralStatus:StructuralStatus=parsedLinks.some(link=>link.admission==="DISTANT_OBSERVATION") || support==="SUPPORT_UNCONFIRMED" ?
    "OBSERVED_ONLY" : hasCompetition ? "COMPETING_PATHS" : "STRUCTURAL_POSSIBILITY";

  const grade=legacy.strengthDependency;
  const policyConditions=grade ? [!grade.base ? "E1_REQUIRED" :
    grade.base.specialReview ? "E1_SPECIAL_REVIEW" :
    grade.base.grade==="BORDERLINE" ? "E1_BORDERLINE" :
    grade.base.grade!==grade.requiredGrade ? "E1_DIRECTION_DIFFERS_FROM_V1_PREMISE" : "E1_DIRECTION_OF_V1_PREMISE_OBSERVED"] : [];
  const holdReasons=unique(["ACTUAL_ROUTE_EFFICACY_UNASSESSED",
    ...(rootUse==="NOT_REQUIRED" ? [] : ["ROOT_FORCE_UNASSESSED"]),
    ...(rootUse!=="NOT_REQUIRED" && rootWithClash.length ? ["ROOT_DAMAGE_FROM_CLASH_UNASSESSED"] : []),
    ...(branchRelations.length || triadRelations.length ? ["RELATED_BRANCH_EFFECT_UNASSESSED"] : []),
    ...(stemCombinations.length ? ["STEM_COMBINATION_EFFECT_UNASSESSED"] : []),
    ...(parsedLinks.some(link=>link.admission==="SUPPORTED_SPAN") ? ["DISTANT_TRANSMISSION_UNASSESSED"] : []),
    ...(hasCompetition ? ["COMPETING_DIRECTION_PRIORITY_UNASSESSED"] : []),
    ...(parsedLinks.some(link=>link.admission==="DISTANT_OBSERVATION") ? ["DISTANT_LINK_SUPPORT_UNCONFIRMED"] : []),
    ...(support==="SUPPORT_UNCONFIRMED" ? [rootUse==="EXACT_REQUIRED" ? "EXACT_HIDDEN_ROOT_ABSENT" : "NO_QUALIFYING_ROOT_OR_FEEDER"] : []),
    ...policyConditions.filter(reason=>reason!=="E1_DIRECTION_OF_V1_PREMISE_OBSERVED"),
  ]);
  const factRefs=unique([...factsOf(route),...factsOf(rootLocations),...parsedLinks.flatMap(x=>x.factRefs),
    ...rootedFeeders.flatMap(x=>[...x.feeder.factRefs,...x.roots.flatMap(root=>root.factRefs)]),
    ...branchRelations.flatMap(x=>x.factRefs),...triadRelations.flatMap(x=>x.factRefs),
    ...stemCombinations.flatMap(x=>x.factRefs),...rivalDirections.flatMap(x=>x.factRefs),...competingExposures.flatMap(x=>x.factRefs)]);
  return {
    observation:{anchor:view(anchor),actor:view(actor),route:route.map(view),
      exactRoots:roots.exact.map(view),sameElementRoots:roots.sameElementDifferentStem.map(view),
      rootClashLocations:rootWithClash.map(view),branchRelations,triadRelations,stemCombinations,rivalDirections,competingExposures},
    structure:{status:structuralStatus,links:parsedLinks,rootUse,support,rootedFeeders,
      localSameElementMainQi:nearMainQi.map(view)},
    efficacy:{status:"UNRESOLVED" as const,strengthDependency:grade,policyConditions,holdReasons},
    factRefs,
  };
}

function assessRule(legacy:SupportedLegacy,pattern:M4Pattern,parent:Evidence,chart:FactCandidate,
  surface:readonly Location[],hidden:readonly Location[]) {
  const rule=RULES[legacy.ruleId];
  const anchors=distinct([...pattern.monthMembers,...pattern.exactExposures.map(exposure=>exposure.visible)]);
  const observations=[...surface,...hidden];
  const routeRoleLocations=observations.filter(x=>x.tenGod && (rule.roles as readonly TenGod[]).includes(x.tenGod));
  const associatedRoleLocations=observations.filter(x=>x.tenGod && (rule.associatedRoles as readonly TenGod[]).includes(x.tenGod));
  const roleLocations=distinct([...routeRoleLocations,...associatedRoleLocations]);
  const paths=legacy.scope==="STRUCTURAL_CANDIDATE" ? anchors.flatMap(anchor=>
    channels(legacy.ruleId,anchor,surface,parent.visibleDayMaster)
      .map(channel=>analyzePath(anchor,channel,legacy,pattern,parent,chart,surface,hidden))) : [];
  const status:StructuralStatus=legacy.scope==="SOURCE_OR_POLICY_UNRESOLVED" ? "UNRESOLVED" :
    legacy.scope==="NOT_A_CANDIDATE_UNDER_POLICY" ? "OUT_OF_SCOPE" :
    paths.some(path=>path.structure.status==="COMPETING_PATHS") ? "COMPETING_PATHS" :
    paths.some(path=>path.structure.status==="STRUCTURAL_POSSIBILITY") ? "STRUCTURAL_POSSIBILITY" :
    paths.length || routeRoleLocations.length ? "OBSERVED_ONLY" : "NOT_OBSERVED";
  const eligible=status==="STRUCTURAL_POSSIBILITY" || status==="COMPETING_PATHS";
  const comparison = eligible && legacy.status==="NOT_TRIGGERED" ? "STRUCTURAL_SCOPE_EXPANDED" as const :
    eligible && legacy.status==="UNRESOLVED" ? "OBSERVATIONS_SEPARATED_FROM_EFFICACY" as const :
    eligible && legacy.status==="RULE_SATISFIED" ? "PREVIOUSLY_SATISFIED" as const : "POLICY_SCOPE_RETAINED" as const;
  const holdReasons=unique(paths.length ? paths.flatMap(path=>path.efficacy.holdReasons) :
    status==="UNRESOLVED" ? legacy.holdReasons : []);
  return {ruleId:legacy.ruleId,candidateRef:parent.candidateRef,patternRef:legacy.patternRef,patternType:legacy.patternType,
    target:legacy.target,status,previousStatus:legacy.status,comparison,
    observations:{anchors:anchors.map(view),roleLocations:roleLocations.map(view),routeRoleLocations:routeRoleLocations.map(view)},paths,holdReasons,
    sourceRefs:[PROJECT,...rule.sources],factRefs:unique([...pattern.assessment.inputFactRefs,...factsOf(roleLocations),...paths.flatMap(path=>path.factRefs)])};
}

type Options = {readonly policyId:string; readonly policyVersion:string; readonly strength?:ProductStrengthAssessment};

/** Evaluate the same authenticated M4/M3/M2 chain as E3. External E3 JSON has no input channel. */
export function evaluatePatternV2(inner:M4InnerPatternsResult,evidence:M3EvidenceResult,m2Facts:M3InputEnvelope,
  candidateIndex:number,options:Options) {
  if(options?.policyId!==PATTERN_V2_POLICY_ID || options.policyVersion!==PATTERN_V2_VERSION) {
    throw new RangeError("E5_EXPLICIT_PATTERN_V2_POLICY_REQUIRED");
  }
  const previous=evaluatePatternRulesV1(inner,evidence,m2Facts,candidateIndex,{
    policyId:PATTERN_RULES_POLICY_ID,policyVersion:PATTERN_RULES_VERSION,
    ...(options.strength===undefined ? {} : {strength:options.strength}),
  });
  const parent=evidence.candidates[candidateIndex]!, chart=m2Facts.candidates[candidateIndex]!;
  const patterns=new Map(inner.candidates[candidateIndex]!.patterns.map(pattern=>[pattern.assessment.id,pattern]));
  const locations=distinct(Object.values(parent.directionalGroups).flat());
  const surface=locations.filter(location=>location.locationKind==="VISIBLE_STEM");
  const hidden=locations.filter(location=>location.locationKind==="HIDDEN_STEM");
  const rules=previous.rules.map(legacy=>{
    if(!Object.hasOwn(RULES,legacy.ruleId)) throw new RangeError("E5_UNSUPPORTED_LEGACY_RULE");
    return assessRule(legacy as SupportedLegacy,patterns.get(legacy.patternRef)!,parent,chart,surface,hidden);
  });
  const eligible=rules.filter(rule=>rule.status==="STRUCTURAL_POSSIBILITY" || rule.status==="COMPETING_PATHS");
  const candidateRefs=unique(eligible.filter(rule=>rule.target!=="INTERFERENCE").map(rule=>rule.patternRef));
  const directKillings=eligible.filter(rule=>rule.ruleId==="KILLINGS_FOOD_CONTROL").map(rule=>rule.patternRef);
  const competingPatternRefs=unique([
    ...(candidateRefs.length>1 ? candidateRefs : []),
    ...eligible.filter(rule=>rule.status==="COMPETING_PATHS" ||
      (rule.ruleId==="KILLINGS_RESOURCE_ROUTE" && directKillings.includes(rule.patternRef))).map(rule=>rule.patternRef),
  ]);
  const status:StructuralStatus=competingPatternRefs.length ? "COMPETING_PATHS" :
    eligible.length ? "STRUCTURAL_POSSIBILITY" :
    rules.some(rule=>rule.status==="UNRESOLVED") ? "UNRESOLVED" :
    rules.some(rule=>rule.status==="OBSERVED_ONLY") ? "OBSERVED_ONLY" :
    rules.some(rule=>rule.status==="NOT_OBSERVED") ? "NOT_OBSERVED" : "OUT_OF_SCOPE";
  return freeze({schemaVersion:"engine-e5-natal-pattern-structure-v2",purpose:"PATTERN",candidateRef:parent.candidateRef,
    policyId:PATTERN_V2_POLICY_ID,policyVersion:PATTERN_V2_VERSION,ruleAuthority:"PROJECT_POLICY",status,
    previousPolicy:{policyId:PATTERN_RULES_POLICY_ID,policyVersion:PATTERN_RULES_VERSION,status:previous.status},
    previousStatus:previous.status,rules,competingPatternRefs,
    holdReasons:unique(rules.flatMap(rule=>rule.holdReasons)),factRefs:unique(rules.flatMap(rule=>rule.factRefs)),
    sourceRefs:unique(rules.flatMap(rule=>rule.sourceRefs)),
    limitations:["NATAL_SCOPE","ACTUAL_PATTERN_EFFICACY_UNASSESSED","NO_COMPLETE_PATTERN_VERDICT"]});
}
